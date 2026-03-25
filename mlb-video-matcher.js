// Enhanced MLB Video Matcher - Direct GUID to PlayId Matching
// Matches videos using direct playId to GUID correspondence

class MLBVideoMatcher {
    constructor() {
        this.videoCache = new Map();
        this.gameContentCache = new Map();
        this.usedVideoIds = new Set();
        this.rateLimitDelay = 1000;
        this.lastApiCall = 0;
        this.activeVideoPlayers = new Set();
    }

    async fetchGameContent(gamePk) {
        if (this.gameContentCache.has(gamePk)) {
            return this.gameContentCache.get(gamePk);
        }

        try {
            await this.waitForRateLimit();
            const response = await fetch(`https://statsapi.mlb.com/api/v1/game/${gamePk}/content`);
            
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }

            const gameContent = await response.json();
            this.gameContentCache.set(gamePk, gameContent);
            console.log(`✅ Fetched game content for ${gamePk}`);
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
            console.log(`Processing ${highlights.length} potential highlights`);
            
            highlights.forEach((highlight, index) => {
                console.log(`Processing highlight ${index}:`, {
                    guid: highlight.guid,
                    title: highlight.title,
                    hasPlaybacks: !!(highlight?.playbacks?.length),
                    playbackCount: highlight?.playbacks?.length || 0
                });

                if (!highlight.guid) {
                    console.log(`  ❌ Skipping highlight ${index}: No GUID`);
                    return; 
                }

                const playbacks = highlight?.playbacks || [];
                const bestPlayback = this.selectBestPlayback(playbacks);
                
                if (!bestPlayback) {
                    console.log(`  ❌ Skipping highlight ${index}: No suitable playback found`);
                    return;
                }

                if (!highlight.date) {
                    console.log(`  ❌ Skipping highlight ${index}: No date`);
                    return;
                }
                
                const video = {
                    id: highlight.id || highlight.guid || `highlight_${index}`,
                    guid: highlight.guid,
                    title: (highlight.title || '').trim(),
                    description: (highlight.description || '').trim(),
                    date: highlight.date,
                    url: bestPlayback.url,
                    duration: highlight.duration || 0,
                    keywords: this.extractKeywords(highlight),
                    playbackType: bestPlayback.name || 'unknown',
                    isAnimated: this.detectAnimatedVideo(highlight),
                    contentType: this.detectContentType(highlight)
                };
                
                console.log(`  ✅ Added video ${index}:`, {
                    guid: video.guid,
                    title: video.title,
                    url: video.url,
                    isAnimated: video.isAnimated,
                    contentType: video.contentType
                });
                
                videos.push(video);
            });

            console.log(`✅ Extracted ${videos.length} videos with GUIDs`);
            return videos;
        } catch (error) {
            console.error('❌ Error extracting highlight videos:', error);
            return [];
        }
    }

    selectBestPlayback(playbacks) {
        if (!playbacks || playbacks.length === 0) {
            console.log('⚠️ No playbacks available');
            return null;
        }

        const mp4Playbacks = playbacks.filter(p => {
            const name = (p.name || '').toLowerCase();
            const url = (p.url || '').toLowerCase();
            const isMP4 = name.includes('mp4avc') || url.includes('.mp4');
            const isNotM3U8 = !name.includes('m3u8') && !url.includes('.m3u8');
            return isMP4 && isNotM3U8;
        });

        if (mp4Playbacks.length === 0) {
            console.log('⚠️ No MP4 playbacks found');
            return null;
        }
        
        const preferredQualities = ['2500K', '1800K', '1200K', '800K', '600K', '450K'];
        
        for (const quality of preferredQualities) {
            const qualityPlayback = mp4Playbacks.find(p => 
                p.name && p.name.includes(quality)
            );
            if (qualityPlayback) {
                console.log(`✅ Selected ${quality} MP4 playback: ${qualityPlayback.name}`);
                return qualityPlayback;
            }
        }

        console.log(`✅ Selected default MP4 playback: ${mp4Playbacks[0].name}`);
        return mp4Playbacks[0];
    }

    detectAnimatedVideo(highlight) {
        const duration = highlight.duration || 0;
        return duration > 0 && (duration < 5 || duration > 120);
    }

    detectContentType(highlight) {
        const duration = highlight.duration || 0;
        if (duration > 0 && (duration < 5 || duration > 120)) {
            return 'animated';
        }
        return 'play';
    }

    extractKeywords(highlight) {
        const keywordSources = [
            highlight.keywordsAll?.map(k => k.value) || [],
            highlight.keywords?.map(k => k.value) || []
        ];
        
        return keywordSources
            .flat()
            .filter(Boolean)
            .map(k => k.toLowerCase())
            .join(' ');
    }

    async findVideoForPlay(gamePk, play) {
        const playKey = `${gamePk}_${play.about?.atBatIndex || 'unknown'}_${play.about?.playIndex || 'unknown'}`;
        
        if (this.videoCache.has(playKey)) {
            const cachedResult = this.videoCache.get(playKey);
            console.log(`📦 Using cached result for play ${playKey}`);
            return cachedResult;
        }

        try {
            console.log(`🔍 Finding video for play: ${playKey}`);
            console.log(`📝 Play Description: "${play.result?.description || 'No description'}"`);
            
            let targetPlayId = null;
            if (play.playEvents && play.playEvents.length > 0) {
                const lastPlayEvent = play.playEvents[play.playEvents.length - 1];
                if (lastPlayEvent.playId) {
                    targetPlayId = lastPlayEvent.playId;
                }
            }

            if (!targetPlayId) {
                console.log('❌ No playId found for this scoring play. Cannot match.');
                this.videoCache.set(playKey, null);
                return null;
            }
            console.log(`🎯 Target playId: ${targetPlayId}`);

            const gameContent = await this.fetchGameContent(gamePk);
            if (!gameContent) {
                console.log('❌ No game content available.');
                this.videoCache.set(playKey, null);
                return null;
            }

            const allVideos = this.extractHighlightVideos(gameContent);
            if (allVideos.length === 0) {
                console.log('❌ No highlight videos available.');
                this.videoCache.set(playKey, null);
                return null;
            }

            const playVideos = allVideos.filter(video => 
                !video.isAnimated && 
                video.contentType !== 'animated' &&
                video.url.toLowerCase().includes('.mp4')
            );
            
            console.log(`📊 Filtered to ${playVideos.length} suitable videos`);

            if (playVideos.length === 0) {
                console.log('❌ No suitable play videos found.');
                this.videoCache.set(playKey, null);
                return null;
            }

            let bestMatch = null;

            let availableVideos = playVideos.filter(video => !this.usedVideoIds.has(video.id));
            if (availableVideos.length === 0) {
                console.log('⚠️ All videos used, allowing reuse.');
                availableVideos = [...playVideos];
            }

            for (const video of availableVideos) {
                if (video.guid === targetPlayId) {
                    bestMatch = video;
                    console.log(`✅ Perfect GUID match found: "${video.title}" (GUID: ${video.guid})`);
                    break; 
                }
            }

            if (!bestMatch) {
                console.log(`❌ No video found with matching GUID: ${targetPlayId}`);
                this.videoCache.set(playKey, null);
                return null;
            }

            this.usedVideoIds.add(bestMatch.id);
            
            const result = {
                ...bestMatch,
                matchScore: 1.0,
                matchType: 'guid-match',
                playId: targetPlayId
            };
            
            this.videoCache.set(playKey, result);
            
            console.log(`✅ Successfully linked video: "${bestMatch.title}" to play ID: ${targetPlayId}`);
            return result;

        } catch (error) {
            console.error('💥 Error in findVideoForPlay:', error);
            this.videoCache.set(playKey, null);
            return null;
        }
    }

    async waitForRateLimit() {
        const now = Date.now();
        const timeSinceLastCall = now - this.lastApiCall;
        if (timeSinceLastCall < this.rateLimitDelay) {
            await new Promise(resolve => setTimeout(resolve, this.rateLimitDelay - timeSinceLastCall));
        }
        this.lastApiCall = Date.now();
    }

    // ── UI Methods ────────────────────────────────────────────────────────────

    addVideoButtonToPlay(playDiv, gamePk, play) {
        if (playDiv.querySelector('.video-button')) {
            return;
        }

        const videoButton = document.createElement('button');
        videoButton.className = 'video-button';
        videoButton.style.cssText = `
            position: absolute;
            bottom: 8px;
            right: 8px;
            background: linear-gradient(135deg, rgba(248,249,250,0.95), rgba(217,230,243,0.95));
            border: 1px solid rgba(4,30,66,0.15);
            padding: 6px 12px;
            border-radius: 10px;
            font-size: 11px;
            font-weight: bold;
            cursor: pointer;
            box-shadow: 0 2px 8px rgba(0,0,0,0.12);
            transition: all 0.2s ease;
            z-index: 10;
            opacity: 0.8;
            pointer-events: auto;
            display: flex;
            align-items: center;
            gap: 5px;
        `;
        
        videoButton.innerHTML = `
            <img src="assets/icons/video-camera.png" alt="video" style="width:14px;height:14px;" onerror="this.style.display='none'" />
            <span>VIDEO</span>
        `;

        videoButton.onmouseover = () => {
            videoButton.style.transform = 'scale(1.06)';
            videoButton.style.boxShadow = '0 4px 14px rgba(0,0,0,0.2)';
            videoButton.style.opacity = '1';
        };
        
        videoButton.onmouseleave = () => {
            videoButton.style.transform = 'scale(1)';
            videoButton.style.boxShadow = '0 2px 8px rgba(0,0,0,0.12)';
            videoButton.style.opacity = '0.8';
        };

        videoButton.onclick = async (e) => {
            e.stopPropagation();
            
            videoButton.disabled = true;
            const originalHTML = videoButton.innerHTML;

            videoButton.innerHTML = `<span style="font-size:11px;color:#555;">Loading…</span>`;

            try {
                const video = await this.findVideoForPlay(gamePk, play);
                
                if (video) {
                    videoButton.innerHTML = originalHTML;
                    videoButton.disabled = false;
                    this.createVideoPlayer(video, playDiv, videoButton);
                } else {
                    videoButton.innerHTML = `<span style="color:#dc3545;">✕</span><span style="font-size:11px;">NO MATCH</span>`;
                    videoButton.style.background = 'linear-gradient(135deg,rgba(254,226,226,0.9),rgba(252,165,165,0.9))';
                    setTimeout(() => {
                        videoButton.innerHTML = originalHTML;
                        videoButton.style.background = 'linear-gradient(135deg,rgba(248,249,250,0.95),rgba(217,230,243,0.95))';
                        videoButton.disabled = false;
                    }, 2500);
                }
            } catch (error) {
                console.error('💥 Error loading video:', error);
                videoButton.innerHTML = `<span style="color:#dc3545;">⚠</span><span style="font-size:11px;">ERROR</span>`;
                videoButton.style.background = 'linear-gradient(135deg,rgba(254,226,226,0.9),rgba(252,165,165,0.9))';
                setTimeout(() => {
                    videoButton.innerHTML = originalHTML;
                    videoButton.style.background = 'linear-gradient(135deg,rgba(248,249,250,0.95),rgba(217,230,243,0.95))';
                    videoButton.disabled = false;
                }, 2500);
            }
        };

        playDiv.appendChild(videoButton);
    }

    // ── Video Player ──────────────────────────────────────────────────────────
    //
    // Uses a full-viewport flex OVERLAY so the player is always visible
    // inside the extension popup regardless of scroll position.
    // position:fixed on the OVERLAY (not the card) guarantees it anchors
    // to the visible popup window, never to the scrolled document.

    createVideoPlayer(video, playDiv, videoButton) {
        // Clean up any existing player
        const existingOverlay = document.querySelector('.mlb-video-overlay');
        if (existingOverlay) existingOverlay.remove();

        const playerId = `player_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        this.activeVideoPlayers.add(playerId);

        const close = () => this.closeVideoPlayer(overlay, videoButton, playerId);

        // ── Full-screen overlay (flex, centres the card) ──────────────────────
        // position:fixed + inset:0 always covers the visible popup area,
        // independent of how far the user has scrolled.
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
            background: rgba(220,230,240,0.45);
            backdrop-filter: blur(2px);
            -webkit-backdrop-filter: blur(2px);
            z-index: 9999;
            opacity: 0;
            transition: opacity 0.25s ease;
        `;
        // Click outside the card closes
        overlay.onclick = (e) => { if (e.target === overlay) close(); };

        // ── Player card ───────────────────────────────────────────────────────
        const card = document.createElement('div');
        card.style.cssText = `
            width: 100%;
            max-width: 550px;
            background: #041e41;
            border-radius: 14px;
            overflow: hidden;
            box-shadow: 0 16px 48px rgba(4,30,66,0.35);
            transform: scale(0.88);
            transition: transform 0.25s ease;
            pointer-events: auto;
        `;

        // ── Title bar ─────────────────────────────────────────────────────────
        const duration = video.duration ? ` · ${Math.round(video.duration)}s` : '';
        const titleBar = document.createElement('div');
        titleBar.style.cssText = `
            display: flex;
            align-items: center;
            gap: 10px;
            padding: 10px 12px;
            background: #041e41;
            border-bottom: 1px solid rgba(255,255,255,0.08);
        `;
        titleBar.innerHTML = `
            <div style="min-width:0;flex:1;">
                <div style="font-size:12px;font-weight:700;color:#fff;font-family:Rubik, sans-serif;
                    white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${video.title}</div>
                <div style="font-size:9px;color:rgba(255,255,255,0.4);margin-top:1px;">
                    Perfect Match${duration}</div>
            </div>
        `;

        const closeBtn = document.createElement('button');
        closeBtn.style.cssText = `
            flex-shrink: 0;
            width: 26px; height: 26px;
            border-radius: 50%;
            background: rgba(191,13,61,0.85);
            border: none;
            color: white;
            font-size: 13px;
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
        const videoElement = document.createElement('video');
        videoElement.style.cssText = `
            width: 100%;
            display: block;
            background: #000;
            max-height: 55vh;
        `;
        videoElement.controls  = true;
        videoElement.preload   = 'metadata';
        videoElement.src       = video.url;
        videoElement.crossOrigin = 'anonymous';

        videoElement.onloadedmetadata = () => {
            console.log('📺 Video metadata loaded');
            requestAnimationFrame(() => {
                overlay.style.opacity = '1';
                card.style.transform  = 'scale(1)';
                videoElement.play().catch(() => {});
            });
        };

        videoElement.onerror = () => {
            card.innerHTML = `
                <div style="padding:36px;text-align:center;color:white;">
                    <div style="font-size:32px;margin-bottom:10px;">⚠️</div>
                    <div style="font-weight:700;font-size:15px;margin-bottom:4px;">Unable to load video</div>
                    <div style="font-size:11px;opacity:0.6;">${video.title}</div>
                </div>`;
            overlay.style.opacity = '1';
            setTimeout(() => close(), 4000);
        };

        // ── Assemble & mount ──────────────────────────────────────────────────
        card.appendChild(titleBar);
        card.appendChild(videoElement);
        overlay.appendChild(card);
        // Mount on <html> so it's never clipped by a scrolled body
        document.documentElement.appendChild(overlay);

        // ESC key
        const handleKey = (e) => {
            if (e.key === 'Escape') { videoElement.pause(); close(); }
        };
        document.addEventListener('keydown', handleKey);
        overlay._cleanup = () => document.removeEventListener('keydown', handleKey);
    }

    // ── Close player ──────────────────────────────────────────────────────────

    closeVideoPlayer(overlay, videoButton, playerId) {
        this.activeVideoPlayers.delete(playerId);
        if (overlay?._cleanup) overlay._cleanup();

        overlay.style.opacity = '0';
        const card = overlay.querySelector('div');
        if (card) card.style.transform = 'scale(0.88)';

        setTimeout(() => {
            overlay?.parentNode && overlay.remove();
        }, 280);

        this.resetVideoButton(videoButton);
    }

    resetVideoButton(videoButton) {
        if (!videoButton) return;
        videoButton.style.opacity = '0.8';
        videoButton.style.pointerEvents = 'auto';
        videoButton.disabled = false;
    }

    // ── Cache management ──────────────────────────────────────────────────────

    resetForNewGame(gamePk) {
        this.usedVideoIds.clear();
        for (const [key] of this.videoCache.entries()) {
            if (key.startsWith(`${gamePk}_`)) this.videoCache.delete(key);
        }
        this.gameContentCache.delete(gamePk);
        console.log(`🔄 Reset video matcher for game ${gamePk}`);
    }

    clearCache(maxAge = 3600000) {
        if (this.videoCache.size > 100) {
            const entries = Array.from(this.videoCache.entries());
            entries.slice(0, entries.length - 100).forEach(([key]) => this.videoCache.delete(key));
        }
        if (this.gameContentCache.size > 20) {
            const entries = Array.from(this.gameContentCache.entries());
            entries.slice(0, entries.length - 20).forEach(([key]) => this.gameContentCache.delete(key));
        }
        console.log(`🧹 Cache: ${this.videoCache.size} video entries, ${this.gameContentCache.size} game entries`);
    }

    cleanup() {
        document.querySelectorAll('.mlb-video-overlay').forEach(o => {
            const id = o.dataset.playerId;
            if (id) this.closeVideoPlayer(o, null, id);
        });
        this.clearCache();
        this.activeVideoPlayers.clear();
        this.usedVideoIds.clear();
        console.log('🧹 MLBVideoMatcher cleanup completed');
    }
}

// Export
try {
    window.MLBVideoMatcher = MLBVideoMatcher;
    console.log('✅ MLBVideoMatcher loaded successfully');
    console.log('🎯 Using direct GUID to playId matching');
} catch (error) {
    console.error('💥 Failed to load MLBVideoMatcher:', error);
}