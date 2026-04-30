document.addEventListener('DOMContentLoaded', async () => {

    // ── Local team abbreviations — no per-team API calls ─────────────────────
    const TEAM_ABBR = {
        108:'LAA', 109:'ARI', 110:'BAL', 111:'BOS', 112:'CHC',
        113:'CIN', 114:'CLE', 115:'COL', 116:'DET', 117:'HOU',
        118:'KC',  119:'LAD', 120:'WSH', 121:'NYM', 133:'OAK',
        134:'PIT', 135:'SD',  136:'SEA', 137:'SF',  138:'STL',
        139:'TB',  140:'TEX', 141:'TOR', 142:'MIN', 143:'PHI',
        144:'ATL', 145:'CWS', 146:'MIA', 147:'NYY', 158:'MIL',
    };

    // ── Elements ──────────────────────────────────────────────────────────────
    const container      = document.getElementById('games-container');
    const dateInput      = document.getElementById('date-input');
    const dateDisplayTxt = document.getElementById('date-display-text');
    const datePrev       = document.getElementById('date-prev');
    const dateNext       = document.getElementById('date-next');
    const todayBtn       = document.getElementById('today-btn');
    const floatBtn       = document.getElementById('openFloatingBtn');

    let refreshTimer = null;

    // ── Anti-flicker cache ────────────────────────────────────────────────────
    // Maps gamePk → { box (DOM node), sig (data fingerprint) }
    // On each refresh we diff the new data against cached sigs.
    // If the sig hasn't changed we skip that card entirely — zero DOM work.
    const cardCache = new Map();

    // ── Date helpers ──────────────────────────────────────────────────────────

    function getBaseballToday() {
        const now = new Date();
        if (now.getHours() < 9) now.setDate(now.getDate() - 1);
        return toYMD(now);
    }

    function toYMD(date) {
        const y = date.getFullYear();
        const m = String(date.getMonth() + 1).padStart(2, '0');
        const d = String(date.getDate()).padStart(2, '0');
        return `${y}-${m}-${d}`;
    }

    function parseYMD(str) {
        const [y, m, d] = str.split('-').map(Number);
        return new Date(y, m - 1, d);
    }

    function formatDisplayDate(ymd) {
        return parseYMD(ymd).toLocaleDateString('en-US', {
            weekday: 'short', month: 'short', day: 'numeric', year: 'numeric',
        });
    }

    function formatGameTime(gameDate) {
        return new Date(gameDate).toLocaleTimeString([], {
            hour: 'numeric', minute: '2-digit', hour12: true,
        });
    }

    function setDateDisplay(ymd) {
        dateInput.value            = ymd;
        dateDisplayTxt.textContent = formatDisplayDate(ymd);
    }

    // ── Postponed-game detection ──────────────────────────────────────────────
    // MLB's API is unreliable about flipping games to "Postponed" — they
    // often stay "Scheduled" for hours past first pitch. We detect this
    // using three signals from the schedule payload itself, so no extra
    // network calls are needed (default.js already pulls /schedule).
    //
    //   1. statusCode is one of the postponed/rain codes (DR/PR/P)
    //   2. A rescheduleDate field is present (MLB has booked a makeup game
    //      — the most reliable "API hasn't flipped detailedState yet" tell)
    //   3. Time heuristic: still "Scheduled" or "Pre-Game" 90+ minutes
    //      after first pitch was supposed to happen
    //
    // 90 min is the threshold because rain delays often run 60+ min;
    // anything past 90 with no transition out of pre-game means the game
    // isn't happening today.

    const PPD_STATUS_CODES = new Set(['DR', 'PR', 'P']);

    function isLikelyPostponed(game) {
        const status = game?.status || {};

        // 1. Explicit postponed code
        if (PPD_STATUS_CODES.has(status.statusCode)) return true;
        if (/postponed/i.test(status.detailedState || '')) return true;

        // 2. Makeup game scheduled — MLB sets this before flipping the state
        if (game?.rescheduleDate || game?.rescheduleGameDate) return true;

        // 3. Time-based heuristic
        const detailedState = status.detailedState || '';
        const stuckInPreGame = detailedState === 'Scheduled'
                            || detailedState === 'Pre-Game'
                            || status.abstractGameState === 'Preview';
        if (stuckInPreGame && game?.gameDate) {
            const minutesPast = (Date.now() - new Date(game.gameDate).getTime()) / 60000;
            if (minutesPast > 90) return true;
        }

        return false;
    }

    // ── Game status classification ────────────────────────────────────────────

    function classifyStatus(game, inningText) {
        const state = game.status.detailedState || '';
        const abs   = game.status.abstractGameState || '';

        // Check for postponement BEFORE any pre-game branches, since a
        // postponed game often masquerades as "Scheduled" / "Pre-Game"
        if (isLikelyPostponed(game))
            return { label: 'POSTPONED', cssClass: 'postponed', isLive: false, isFinal: false };

        if (abs === 'Final' || state === 'Final' || state === 'Game Over' || state.startsWith('Completed'))
            return { label: 'FINAL', cssClass: 'final', isLive: false, isFinal: true };

        if (state === 'In Progress' || abs === 'Live') {
            return { label: inningText || 'LIVE', cssClass: 'live', isLive: true, isFinal: false };
        }

        if (state === 'Warmup')
            return { label: 'WARM', cssClass: 'live', isLive: true, isFinal: false };

        if (state.startsWith('Delayed')) {
            const reason = state.includes('Rain')      ? 'RAIN DLY'
                         : state.includes('Lightning') ? 'LTNG DLY'
                         : 'DELAYED';
            return { label: reason, cssClass: 'delayed', isLive: false, isFinal: false };
        }

        if (state === 'Suspended')
            return { label: 'SUSP', cssClass: 'delayed', isLive: false, isFinal: false };

        if (state === 'Cancelled')
            return { label: 'CNCLD', cssClass: 'postponed', isLive: false, isFinal: false };

        if (state === 'Pre-Game')
            return { label: formatGameTime(game.gameDate), cssClass: 'scheduled', isLive: false, isFinal: false };

        return { label: formatGameTime(game.gameDate), cssClass: 'scheduled', isLive: false, isFinal: false };
    }

    // ── Signature: include postponed-detection result ────────────────────────
    // Including isLikelyPostponed() in the fingerprint means a card whose
    // detailedState hasn't changed but has just crossed the 90-min heuristic
    // (or just got a rescheduleDate added) will trigger a patch and flip
    // from start-time to "PPD" without a full rebuild.

    function gameSig(game, inningText) {
        return [
            game.status.detailedState,
            game.teams.home.score ?? 0,
            game.teams.away.score ?? 0,
            inningText || '',
            isLikelyPostponed(game) ? 'PPD' : '',
        ].join('|');
    }

    // ── Live inning fetch ─────────────────────────────────────────────────────

    async function fetchInning(gamePk) {
        try {
            const res  = await fetch(`https://statsapi.mlb.com/api/v1.1/game/${gamePk}/feed/live`);
            const data = await res.json();
            const ls   = data?.liveData?.linescore;
            if (!ls) return null;
            const half = ls.inningHalf === 'Top' ? '▲' : '▼';
            return `${half} ${ls.currentInning || ''}`;
        } catch { return null; }
    }

    // ── Build a card from scratch (initial load only) ─────────────────────────

    function buildCard(game, inningText) {
        const { label, cssClass, isLive, isFinal } = classifyStatus(game, inningText);

        const homeId   = game.teams.home.team.id;
        const awayId   = game.teams.away.team.id;
        const homeAbbr = TEAM_ABBR[homeId] || game.teams.home.team.abbreviation || '?';
        const awayAbbr = TEAM_ABBR[awayId] || game.teams.away.team.abbreviation || '?';
        const homeScore = game.teams.home.score ?? 0;
        const awayScore = game.teams.away.score ?? 0;
        const homeWins  = isFinal && homeScore > awayScore;
        const awayWins  = isFinal && awayScore > homeScore;

        const box = document.createElement('div');
        box.className = [
            'game-box',
            isLive ? 'live' : '',
            cssClass === 'delayed' || cssClass === 'postponed' ? cssClass : '',
        ].filter(Boolean).join(' ');

        box.innerHTML = `
            <div class="game-status">${isLive ? '<span class="live-ring"></span>' : ''}${label}</div>
            <div class="team-row ${awayWins ? 'winner' : isFinal ? 'loser' : ''}">
                <img src="https://www.mlbstatic.com/team-logos/${awayId}.svg"
                     alt="${awayAbbr}" class="team-logo" onerror="this.style.opacity='.25'">
                <span class="team-abbr">${awayAbbr}</span>
                <span class="team-score">${awayScore}</span>
            </div>
            <div class="card-divider"></div>
            <div class="team-row ${homeWins ? 'winner' : isFinal ? 'loser' : ''}">
                <img src="https://www.mlbstatic.com/team-logos/${homeId}.svg"
                     alt="${homeAbbr}" class="team-logo" onerror="this.style.opacity='.25'">
                <span class="team-abbr">${homeAbbr}</span>
                <span class="team-score">${homeScore}</span>
            </div>`;

        box.addEventListener('click', () => {
            window.location.href = `popup.html?gamePk=${game.gamePk}`;
        });

        return { box, isLive, isFinal, sortKey: new Date(game.gameDate).getTime(), gamePk: game.gamePk };
    }

    // ── Patch a card in-place (refresh only) ──────────────────────────────────
    // Only called when gameSig() detects a change. Surgically updates the
    // status text, scores, and winner/loser classes without touching logos,
    // abbreviations, or the card element itself — so there is zero flicker.

    function patchCard(box, game, inningText) {
        const { label, cssClass, isLive, isFinal } = classifyStatus(game, inningText);

        const homeScore = game.teams.home.score ?? 0;
        const awayScore = game.teams.away.score ?? 0;
        const homeWins  = isFinal && homeScore > awayScore;
        const awayWins  = isFinal && awayScore > homeScore;

        // Status row — only re-render if text changed
        const statusEl   = box.querySelector('.game-status');
        const newInner   = (isLive ? '<span class="live-ring"></span>' : '') + label;
        if (statusEl.innerHTML !== newInner) statusEl.innerHTML = newInner;

        // Live border
        box.classList.toggle('live', isLive);
        box.classList.toggle('delayed',   cssClass === 'delayed');
        box.classList.toggle('postponed', cssClass === 'postponed');

        // Scores — querySelectorAll preserves away/home order from buildCard
        const scoreEls = box.querySelectorAll('.team-score');
        if (scoreEls[0]) scoreEls[0].textContent = awayScore;
        if (scoreEls[1]) scoreEls[1].textContent = homeScore;

        // Winner/loser row classes
        const rows = box.querySelectorAll('.team-row');
        if (rows[0]) rows[0].className = `team-row ${awayWins ? 'winner' : isFinal ? 'loser' : ''}`.trim();
        if (rows[1]) rows[1].className = `team-row ${homeWins ? 'winner' : isFinal ? 'loser' : ''}`.trim();
    }

    // ── Fetch games for a date ────────────────────────────────────────────────
    // isRefresh=false → full rebuild (used on date changes and first load)
    // isRefresh=true  → diff-and-patch (used by the auto-refresh interval)

    async function fetchGameData(dateStr, isRefresh = false) {
        clearInterval(refreshTimer);

        if (!isRefresh) {
            // Full clear only when the user picks a new date or on first load
            cardCache.clear();
            container.innerHTML = `
                <div class="state-msg">
                    <div class="state-spinner"></div>
                    Loading games…
                </div>`;
        }
        // When isRefresh=true we leave the current cards untouched while
        // we fetch — the user sees no change until we have new data.

        try {
            // hydrate=game(content(summary)) gives us rescheduleDate when
            // present — that's our most reliable signal for "this game is
            // postponed even though detailedState still says Scheduled"
            const res   = await fetch(`https://statsapi.mlb.com/api/v1/schedule?sportId=1&date=${dateStr}&hydrate=game(content(summary))`);
            const data  = await res.json();
            const games = data.dates?.[0]?.games || [];

            if (!isRefresh && !games.length) {
                container.innerHTML = `<div class="state-msg">No games scheduled for this date.</div>`;
                return;
            }

            // Fetch live inning data in parallel for in-progress games only
            const inningMap = {};
            await Promise.all(
                games
                    .filter(g => g.status.detailedState === 'In Progress')
                    .map(async g => { inningMap[g.gamePk] = await fetchInning(g.gamePk); })
            );

            if (!isRefresh) {
                // ── Initial render ──────────────────────────────────────────
                container.innerHTML = '';

                const built = games.map(g => buildCard(g, inningMap[g.gamePk] || null));

                // Sort: Live/Warmup → Scheduled → Delayed/PPD → Final
                built.sort((a, b) => {
                    if (a.isLive && !b.isLive) return -1;
                    if (!a.isLive && b.isLive)  return  1;
                    if (!a.isFinal && b.isFinal) return -1;
                    if (a.isFinal && !b.isFinal) return  1;
                    return a.sortKey - b.sortKey;
                });

                built.forEach(item => {
                    container.appendChild(item.box);
                    // Key by gamePk directly — unique per game even for doubleheaders
                    const game = games.find(g => g.gamePk === item.gamePk);
                    cardCache.set(item.gamePk, {
                        box: item.box,
                        sig: gameSig(game, inningMap[item.gamePk] || null),
                    });
                });

            } else {
                // ── Silent refresh — diff only ──────────────────────────────
                games.forEach(game => {
                    const newSig = gameSig(game, inningMap[game.gamePk] || null);
                    const cached = cardCache.get(game.gamePk);

                    if (!cached) {
                        // New game appeared mid-session (uncommon) — build and append
                        const { box, isLive, isFinal, sortKey } = buildCard(game, inningMap[game.gamePk] || null);
                        container.appendChild(box);
                        cardCache.set(game.gamePk, { box, sig: newSig });
                    } else if (cached.sig !== newSig) {
                        // Something changed — patch just this card's text/classes
                        patchCard(cached.box, game, inningMap[game.gamePk] || null);
                        cached.sig = newSig;
                        // (no DOM removal/insertion — card stays exactly where it is)
                    }
                    // sig === cached.sig → nothing to do, skip entirely
                });
            }

            // Schedule next refresh for today's games only
            if (dateStr === getBaseballToday()) {
                const hasLive = games.some(g =>
                    g.status.detailedState === 'In Progress' || g.status.detailedState === 'Warmup'
                );
                const interval = hasLive ? 30_000 : 60_000;
                refreshTimer = setInterval(() => fetchGameData(dateStr, true), interval);
            }

        } catch (err) {
            console.error('Game fetch error:', err);
            if (!isRefresh) {
                container.innerHTML = `<div class="state-msg" style="color:#ef4444">Failed to load games.</div>`;
            }
            // On a failed refresh we silently skip — current cards stay visible
        }
    }

    // ── Date navigation ───────────────────────────────────────────────────────

    function stepDate(days) {
        const d = parseYMD(dateInput.value || getBaseballToday());
        d.setDate(d.getDate() + days);
        const ymd = toYMD(d);
        setDateDisplay(ymd);
        fetchGameData(ymd, false);   // always full rebuild on date change
    }

    datePrev.addEventListener('click', () => stepDate(-1));
    dateNext.addEventListener('click', () => stepDate(+1));

    dateInput.addEventListener('change', () => {
        if (dateInput.value) {
            setDateDisplay(dateInput.value);
            fetchGameData(dateInput.value, false);
        }
    });

    todayBtn.addEventListener('click', () => {
        const today = getBaseballToday();
        setDateDisplay(today);
        fetchGameData(today, false);
    });

    // ── Floating window ───────────────────────────────────────────────────────

    floatBtn?.addEventListener('click', () => {
        chrome?.runtime?.sendMessage({ action: 'openFloatingWindow' });
        window.close();
    });

    // ── Init ─────────────────────────────────────────────────────────────────

    const today = getBaseballToday();
    setDateDisplay(today);
    fetchGameData(today, false);

    // Roll calendar over at 9 AM
    setInterval(() => {
        const now = new Date();
        if (now.getHours() === 9 && now.getMinutes() === 0) {
            const newDay = getBaseballToday();
            if (dateInput.value !== newDay) {
                setDateDisplay(newDay);
                fetchGameData(newDay, false);
            }
        }
    }, 60_000);

});