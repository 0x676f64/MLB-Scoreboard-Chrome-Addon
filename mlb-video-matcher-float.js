// MLB Video Matcher — Floating Window Edition
// Same overlay architecture as videoMatcher.js, sized for ~380px popup

class MLBVideoMatcher {
    constructor() {
        this.videoCache        = new Map();
        this.gameContentCache  = new Map();
        this.usedVideoIds      = new Set();
        this.rateLimitDelay    = 1000;
        this.lastApiCall       = 0;
        this.activeVideoPlayers = new Set();
    }

    // ── Game Content ──────────────────────────────────────────────────────────

    async fetchGameContent(gamePk) {
        if (this.gameContentCache.has(gamePk)) return this.gameContentCache.get(gamePk);
        try {
            await this.waitForRateLimit();
            const response = await fetch(`https://statsapi.mlb.com/api/v1/game/${gamePk}/content`);
            if (!response.ok) throw new Error(`HTTP ${response.status}`);
            const gameContent = await response.json();
            this.gameContentCache.set(gamePk, gameContent);
            return gameContent;
        } catch (error) {
            console.error(`❌ Failed to fetch game content for ${gamePk}:`, error);
            return null;
        }
    }

    extractHighlightVideos(gameContent) {
        const videos = [];
        try {
            const highlights = gameContent?.highlights?.highlights?.items || [];
            highlights.forEach((highlight, index) => {
                if (!highlight.guid || !highlight.date) return;
                const bestPlayback = this.selectBestPlayback(highlight?.playbacks || []);
                if (!bestPlayback) return;
                videos.push({
                    id:          highlight.id || highlight.guid || `highlight_${index}`,
                    guid:        highlight.guid,
                    title:       (highlight.title || '').trim(),
                    description: (highlight.description || '').trim(),
                    date:        highlight.date,
                    url:         bestPlayback.url,
                    duration:    highlight.duration || 0,
                    keywords:    this.extractKeywords(highlight),
                    playbackType: bestPlayback.name || 'unknown',
                    isAnimated:  this.detectAnimatedVideo(highlight),
                    contentType: this.detectContentType(highlight)
                });
            });
        } catch (error) {
            console.error('❌ Error extracting highlight videos:', error);
        }
        return videos;
    }

    selectBestPlayback(playbacks) {
        if (!playbacks?.length) return null;
        const mp4Playbacks = playbacks.filter(p => {
            const name = (p.name || '').toLowerCase();
            const url  = (p.url  || '').toLowerCase();
            return (name.includes('mp4avc') || url.includes('.mp4')) &&
                   !name.includes('m3u8') && !url.includes('.m3u8');
        });
        if (!mp4Playbacks.length) return null;
        for (const q of ['2500K','1800K','1200K','800K','600K','450K']) {
            const match = mp4Playbacks.find(p => p.name?.includes(q));
            if (match) return match;
        }
        return mp4Playbacks[0];
    }

    detectAnimatedVideo(highlight) {
        const d = highlight.duration || 0;
        return d > 0 && (d < 5 || d > 120);
    }

    detectContentType(highlight) {
        const d = highlight.duration || 0;
        return (d > 0 && (d < 5 || d > 120)) ? 'animated' : 'play';
    }

    extractKeywords(highlight) {
        return [...(highlight.keywordsAll?.map(k => k.value) || []),
                ...(highlight.keywords?.map(k => k.value) || [])]
            .filter(Boolean).map(k => k.toLowerCase()).join(' ');
    }

    // ── Video Matching ────────────────────────────────────────────────────────

    async findVideoForPlay(gamePk, play) {
        const playKey = `${gamePk}_${play.about?.atBatIndex || 'unknown'}_${play.about?.playIndex || 'unknown'}`;
        if (this.videoCache.has(playKey)) return this.videoCache.get(playKey);

        try {
            let targetPlayId = null;
            if (play.playEvents?.length) {
                const last = play.playEvents[play.playEvents.length - 1];
                if (last.playId) targetPlayId = last.playId;
            }
            if (!targetPlayId) { this.videoCache.set(playKey, null); return null; }

            const gameContent = await this.fetchGameContent(gamePk);
            if (!gameContent) { this.videoCache.set(playKey, null); return null; }

            const allVideos = this.extractHighlightVideos(gameContent);
            const playVideos = allVideos.filter(v =>
                !v.isAnimated && v.contentType !== 'animated' && v.url.toLowerCase().includes('.mp4'));
            if (!playVideos.length) { this.videoCache.set(playKey, null); return null; }

            let available = playVideos.filter(v => !this.usedVideoIds.has(v.id));
            if (!available.length) available = [...playVideos];

            const bestMatch = available.find(v => v.guid === targetPlayId) || null;
            if (!bestMatch) { this.videoCache.set(playKey, null); return null; }

            this.usedVideoIds.add(bestMatch.id);
            const result = { ...bestMatch, matchScore: 1.0, matchType: 'guid-match', playId: targetPlayId };
            this.videoCache.set(playKey, result);
            return result;

        } catch (error) {
            console.error('💥 Error in findVideoForPlay:', error);
            this.videoCache.set(playKey, null);
            return null;
        }
    }

    async waitForRateLimit() {
        const now = Date.now();
        const wait = this.rateLimitDelay - (now - this.lastApiCall);
        if (wait > 0) await new Promise(r => setTimeout(r, wait));
        this.lastApiCall = Date.now();
    }

    // ── Video Button ──────────────────────────────────────────────────────────

    addVideoButtonToPlay(playDiv, gamePk, play) {
        if (playDiv.querySelector('.video-button')) return;

        const btn = document.createElement('button');
        btn.className = 'video-button';
        btn.style.cssText = `
            position: absolute;
            bottom: 6px;
            right: 6px;
            background: linear-gradient(135deg, rgba(248,249,250,0.95), rgba(217,230,243,0.95));
            border: 1px solid rgba(4,30,66,0.15);
            padding: 4px 9px;
            border-radius: 8px;
            font-size: 10px;
            font-weight: 700;
            cursor: pointer;
            box-shadow: 0 2px 6px rgba(0,0,0,0.12);
            transition: all 0.2s ease;
            z-index: 10;
            opacity: 0.8;
            pointer-events: auto;
            display: flex;
            align-items: center;
            gap: 4px;
            font-family: 'Rubik', sans-serif;
        `;
        btn.innerHTML = `
            <img src="assets/icons/video-camera.png" alt="video"
                style="width:12px;height:12px;" onerror="this.style.display='none'"/>
            <span>VIDEO</span>
        `;

        btn.onmouseover  = () => { btn.style.transform = 'scale(1.06)'; btn.style.opacity = '1'; };
        btn.onmouseleave = () => { btn.style.transform = 'scale(1)';   btn.style.opacity = '0.8'; };

        btn.onclick = async (e) => {
            e.stopPropagation();
            btn.disabled = true;
            const originalHTML = btn.innerHTML;
            btn.innerHTML = `<span style="font-size:10px;color:#555;">Loading…</span>`;

            try {
                const video = await this.findVideoForPlay(gamePk, play);
                if (video) {
                    btn.innerHTML = originalHTML;
                    btn.disabled = false;
                    this.createVideoPlayer(video, playDiv, btn);
                } else {
                    btn.innerHTML = `<span style="color:#dc3545;">✕</span><span style="font-size:10px;">NO MATCH</span>`;
                    btn.style.background = 'linear-gradient(135deg,rgba(254,226,226,0.9),rgba(252,165,165,0.9))';
                    setTimeout(() => {
                        btn.innerHTML = originalHTML;
                        btn.style.background = 'linear-gradient(135deg,rgba(248,249,250,0.95),rgba(217,230,243,0.95))';
                        btn.disabled = false;
                    }, 2500);
                }
            } catch (err) {
                console.error('💥 Error loading video:', err);
                btn.innerHTML = `<span style="color:#dc3545;">⚠</span><span style="font-size:10px;">ERROR</span>`;
                btn.style.background = 'linear-gradient(135deg,rgba(254,226,226,0.9),rgba(252,165,165,0.9))';
                setTimeout(() => {
                    btn.innerHTML = originalHTML;
                    btn.style.background = 'linear-gradient(135deg,rgba(248,249,250,0.95),rgba(217,230,243,0.95))';
                    btn.disabled = false;
                }, 2500);
            }
        };

        playDiv.appendChild(btn);
    }

    // ── Video Player ──────────────────────────────────────────────────────────
    //
    // Full-viewport flex OVERLAY mounted on <html> so it is always anchored
    // to the visible floating window, regardless of scroll position.
    // No transform-centering, no separate backdrop element — one overlay
    // handles everything cleanly.

    createVideoPlayer(video, playDiv, videoButton) {
        // Remove any stale player
        document.querySelector('.mlb-video-overlay')?.remove();

        const playerId = `player_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        this.activeVideoPlayers.add(playerId);

        const close = () => this.closeVideoPlayer(overlay, videoButton, playerId);

        // ── Overlay (full-screen flex, light frosted) ─────────────────────────
        const overlay = document.createElement('div');
        overlay.className = 'mlb-video-overlay';
        overlay.dataset.playerId = playerId;
        overlay.style.cssText = `
            position: fixed;
            inset: 0;
            width: 100%;
            height: 100%;
            display: flex;
            align-items: center;
            justify-content: center;
            background: rgba(210,225,240,0.50);
            backdrop-filter: blur(5px);
            -webkit-backdrop-filter: blur(5px);
            z-index: 9999;
            opacity: 0;
            transition: opacity 0.22s ease;
        `;
        // Click outside the card → close
        overlay.onclick = (e) => { if (e.target === overlay) close(); };

        // ── Player card ───────────────────────────────────────────────────────
        // max-width capped at 340px so it fits the 380px floating window with
        // visible margins on both sides.
        const card = document.createElement('div');
        card.style.cssText = `
            width: 92%;
            max-width: 340px;
            background: #041e41;
            border-radius: 12px;
            overflow: hidden;
            box-shadow: 0 14px 40px rgba(4,30,66,0.4);
            transform: scale(0.88);
            transition: transform 0.22s ease;
            pointer-events: auto;
        `;

        // ── Title bar ─────────────────────────────────────────────────────────
        const duration = video.duration ? ` · ${Math.round(video.duration)}s` : '';
        const titleBar = document.createElement('div');
        titleBar.style.cssText = `
            display: flex;
            align-items: center;
            gap: 8px;
            padding: 8px 10px;
            background: #041e41;
            border-bottom: 1px solid rgba(255,255,255,0.08);
        `;
        titleBar.innerHTML = `
            <div style="min-width:0;flex:1;">
                <div style="font-size:11px;font-weight:700;color:#fff;font-family:'Rubik',sans-serif;
                    white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${video.title}</div>
                <div style="font-size:8px;color:rgba(255,255,255,0.4);margin-top:1px;
                    font-family:'Rubik',sans-serif;">Perfect Match${duration}</div>
            </div>
        `;

        const closeBtn = document.createElement('button');
        closeBtn.style.cssText = `
            flex-shrink: 0;
            width: 24px; height: 24px;
            border-radius: 50%;
            background: rgba(191,13,61,0.85);
            border: none;
            color: white;
            font-size: 12px;
            line-height: 1;
            cursor: pointer;
            display: flex; align-items: center; justify-content: center;
            transition: background 0.15s;
        `;
        closeBtn.textContent = '✕';
        closeBtn.title = 'Close (ESC)';
        closeBtn.onmouseover  = () => closeBtn.style.background = 'rgba(191,13,61,1)';
        closeBtn.onmouseleave = () => closeBtn.style.background = 'rgba(191,13,61,0.85)';
        closeBtn.onclick = (e) => { e.stopPropagation(); videoElement.pause(); close(); };
        titleBar.appendChild(closeBtn);

        // ── Video element ─────────────────────────────────────────────────────
        // max-height: 46vh keeps the video fully visible in the floating window
        // without the user needing to scroll.
        const videoElement = document.createElement('video');
        videoElement.style.cssText = `
            width: 100%;
            display: block;
            background: #000;
            max-height: 46vh;
        `;
        videoElement.controls    = true;
        videoElement.preload     = 'metadata';
        videoElement.src         = video.url;
        videoElement.crossOrigin = 'anonymous';

        videoElement.onloadedmetadata = () => {
            requestAnimationFrame(() => {
                overlay.style.opacity = '1';
                card.style.transform  = 'scale(1)';
                videoElement.play().catch(() => {});
            });
        };

        videoElement.onerror = () => {
            card.innerHTML = `
                <div style="padding:32px;text-align:center;color:white;font-family:'Rubik',sans-serif;">
                    <div style="font-size:28px;margin-bottom:8px;">⚠️</div>
                    <div style="font-weight:700;font-size:13px;margin-bottom:4px;">Unable to load video</div>
                    <div style="font-size:10px;opacity:0.6;">${video.title}</div>
                </div>`;
            overlay.style.opacity = '1';
            setTimeout(() => close(), 4000);
        };

        // ── Assemble & mount on <html> ─────────────────────────────────────────
        card.appendChild(titleBar);
        card.appendChild(videoElement);
        overlay.appendChild(card);
        // Mounting on documentElement (not body) ensures the fixed overlay
        // covers the visible window even when body has scrolled content.
        document.documentElement.appendChild(overlay);

        // ESC key
        const handleKey = (e) => { if (e.key === 'Escape') { videoElement.pause(); close(); } };
        document.addEventListener('keydown', handleKey);
        overlay._cleanup = () => document.removeEventListener('keydown', handleKey);
    }

    // ── Close ─────────────────────────────────────────────────────────────────

    closeVideoPlayer(overlay, videoButton, playerId) {
        this.activeVideoPlayers.delete(playerId);
        if (overlay?._cleanup) overlay._cleanup();

        overlay.style.opacity = '0';
        const card = overlay.querySelector('div');
        if (card) card.style.transform = 'scale(0.88)';

        setTimeout(() => overlay?.parentNode && overlay.remove(), 240);
        this.resetVideoButton(videoButton);
    }

    resetVideoButton(videoButton) {
        if (!videoButton) return;
        videoButton.style.opacity      = '0.8';
        videoButton.style.pointerEvents = 'auto';
        videoButton.disabled            = false;
    }

    // ── Cache management ──────────────────────────────────────────────────────

    resetForNewGame(gamePk) {
        this.usedVideoIds.clear();
        for (const [key] of this.videoCache.entries()) {
            if (key.startsWith(`${gamePk}_`)) this.videoCache.delete(key);
        }
        this.gameContentCache.delete(gamePk);
    }

    clearCache() {
        if (this.videoCache.size > 100) {
            const entries = Array.from(this.videoCache.entries());
            entries.slice(0, entries.length - 100).forEach(([k]) => this.videoCache.delete(k));
        }
        if (this.gameContentCache.size > 20) {
            const entries = Array.from(this.gameContentCache.entries());
            entries.slice(0, entries.length - 20).forEach(([k]) => this.gameContentCache.delete(k));
        }
    }

    cleanup() {
        document.querySelectorAll('.mlb-video-overlay').forEach(o => {
            const id = o.dataset.playerId;
            if (id) this.closeVideoPlayer(o, null, id);
        });
        this.clearCache();
        this.activeVideoPlayers.clear();
        this.usedVideoIds.clear();
    }
}

// Export
try {
    window.MLBVideoMatcher = MLBVideoMatcher;
    console.log('✅ MLBVideoMatcher (float) loaded');
    console.log('🎯 Using direct GUID to playId matching');
} catch (error) {
    console.error('💥 Failed to load MLBVideoMatcher:', error);
}