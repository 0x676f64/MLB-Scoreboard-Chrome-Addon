// ─────────────────────────────────────────────────────────────────────────────
// XLabs · Player Stats
// ─────────────────────────────────────────────────────────────────────────────

document.addEventListener('DOMContentLoaded', () => {

    const SEASON = 2026;

    // ── Element refs ─────────────────────────────────────────────────────────
    const $ = id => document.getElementById(id);

    const searchInput  = $('player-search');
    const searchBtn    = $('search-button');
    const searchClear  = $('search-clear');
    const suggestions  = $('suggestions');

    const emptyState   = $('empty-state');
    const loadingState = $('loading-state');
    const errorState   = $('error-state');
    const playerContent = $('player-content');

    const profileHeadshot = $('profile-headshot');
    const profileName     = $('profile-name');
    const profilePosition = $('profile-position');
    const profileDetails  = $('profile-details');

    const statusRow      = $('status-row');
    const statsTabs      = $('stats-tabs');
    const tabUnderline   = $('tab-underline');
    const statsTitle     = $('stats-title');
    const statsSubtitle  = $('stats-subtitle');
    const statsGrid      = $('stats-grid');

    // ── App state ────────────────────────────────────────────────────────────
    let suggestTimer = null;
    let suggestionsList = [];
    let activeSuggestionIdx = -1;
    let currentPlayerData = null;   // { player, hitting, pitching, recent..., team, standings }
    let currentMode = 'hitting';    // 'hitting' | 'pitching'

    // ── Helpers ──────────────────────────────────────────────────────────────
    const headshot = id => `https://img.mlbstatic.com/mlb-photos/image/upload/d_people:generic:headshot:67:current.png/w_150,h_150,c_fill,q_auto:best/v1/people/${id}/headshot/67/current`;
    const teamLogo = id => `https://www.mlbstatic.com/team-logos/${id}.svg`;

    // Show one of the four states; everything else hides
    function setState(state) {
        emptyState.style.display     = state === 'empty'   ? 'block' : 'none';
        loadingState.classList.toggle('visible', state === 'loading');
        errorState.classList.toggle('visible',  state === 'error');
        playerContent.classList.toggle('visible', state === 'player');
    }

    function showError(msg) {
        errorState.textContent = msg;
        setState('error');
    }

    // ── Search input wiring ──────────────────────────────────────────────────
    searchInput.addEventListener('input', () => {
        const v = searchInput.value;
        searchClear.classList.toggle('visible', v.length > 0);

        clearTimeout(suggestTimer);
        const q = v.trim();
        if (q.length < 2) {
            hideSuggestions();
            return;
        }
        suggestTimer = setTimeout(() => fetchSuggestions(q), 280);
    });

    searchInput.addEventListener('keydown', e => {
        if (suggestions.hidden || !suggestionsList.length) {
            if (e.key === 'Enter') {
                e.preventDefault();
                searchPlayerByName();
            }
            return;
        }
        // Arrow navigation through suggestions
        if (e.key === 'ArrowDown') {
            e.preventDefault();
            activeSuggestionIdx = Math.min(activeSuggestionIdx + 1, suggestionsList.length - 1);
            updateActiveSuggestion();
        } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            activeSuggestionIdx = Math.max(activeSuggestionIdx - 1, -1);
            updateActiveSuggestion();
        } else if (e.key === 'Enter') {
            e.preventDefault();
            if (activeSuggestionIdx >= 0) {
                loadPlayerById(suggestionsList[activeSuggestionIdx].id);
            } else {
                searchPlayerByName();
            }
        } else if (e.key === 'Escape') {
            hideSuggestions();
        }
    });

    searchBtn.addEventListener('click', () => searchPlayerByName());

    searchClear.addEventListener('click', () => {
        searchInput.value = '';
        searchClear.classList.remove('visible');
        hideSuggestions();
        searchInput.focus();
    });

    // Hide suggestions when clicking outside the search bar
    document.addEventListener('click', e => {
        if (!e.target.closest('.search-bar')) hideSuggestions();
    });

    // Click on a suggestion
    suggestions.addEventListener('click', e => {
        const item = e.target.closest('.sg-item');
        if (!item) return;
        loadPlayerById(item.dataset.id);
    });

    // ── Suggestions fetch + render ───────────────────────────────────────────
    async function fetchSuggestions(query) {
        try {
            const res = await fetch(
                `https://statsapi.mlb.com/api/v1/people/search?names=${encodeURIComponent(query)}&sportId=1&hydrate=currentTeam`
            );
            if (!res.ok) return hideSuggestions();
            const data = await res.json();
            const top = (data.people || []).filter(p => p.active !== false).slice(0, 6);
            renderSuggestions(top);
        } catch (e) {
            console.error('Suggestion fetch error:', e);
            hideSuggestions();
        }
    }

    function renderSuggestions(players) {
        suggestionsList = players;
        activeSuggestionIdx = -1;

        if (!players.length) {
            suggestions.innerHTML = `<div class="sg-empty">No players found</div>`;
            suggestions.hidden = false;
            return;
        }

        suggestions.innerHTML = players.map(p => {
            const team = p.currentTeam?.abbreviation || p.currentTeam?.name || '—';
            const pos  = p.primaryPosition?.abbreviation || '';
            return `
                <button type="button" class="sg-item" data-id="${p.id}">
                    <img src="${headshot(p.id)}" alt="" class="sg-photo" onerror="this.style.opacity='.3'">
                    <div class="sg-info">
                        <div class="sg-name">${p.fullName}</div>
                        <div class="sg-meta">${pos}${pos ? ' · ' : ''}${team}</div>
                    </div>
                </button>`;
        }).join('');
        suggestions.hidden = false;
    }

    function updateActiveSuggestion() {
        suggestions.querySelectorAll('.sg-item').forEach((el, i) => {
            el.classList.toggle('active', i === activeSuggestionIdx);
        });
    }

    function hideSuggestions() {
        suggestions.hidden = true;
        suggestionsList = [];
        activeSuggestionIdx = -1;
    }

    // ── Search by typed name ────────────────────────────────────────────────
    async function searchPlayerByName() {
        const q = searchInput.value.trim();
        if (!q) return;
        hideSuggestions();
        setState('loading');
        try {
            const res  = await fetch(`https://statsapi.mlb.com/api/v1/people/search?names=${encodeURIComponent(q)}&sportId=1`);
            const data = await res.json();
            const list = (data.people || []).filter(p => p.active !== false);
            if (!list.length) return showError('No player found with that name.');
            await loadPlayerById(list[0].id);
        } catch (e) {
            console.error(e);
            showError('Failed to search for players.');
        }
    }

    // ── Load full player data and render ────────────────────────────────────
    async function loadPlayerById(playerId) {
        hideSuggestions();
        setState('loading');

        try {
            const [
                player,
                hittingStats,
                pitchingStats,
                recentHitting,
                recentPitching,
                allHitting,
                allPitching,
                standings,
            ] = await Promise.all([
                fetchPlayerDetails(playerId),
                fetchPlayerStats(playerId, 'hitting'),
                fetchPlayerStats(playerId, 'pitching'),
                fetchRecentStats(playerId, 'hitting', 7),
                fetchRecentStats(playerId, 'pitching', 3),
                fetchAllPlayerStats('hitting'),
                fetchAllPlayerStats('pitching'),
                fetchTeamStandings(),
            ]);

            currentPlayerData = {
                player, hittingStats, pitchingStats,
                recentHitting, recentPitching,
                allHitting, allPitching, standings,
            };

            // Decide which stat group(s) to show
            const isPitcher  = player.primaryPosition?.type === 'Pitcher';
            const hasHitting  = Object.keys(hittingStats).length  > 0;
            const hasPitching = Object.keys(pitchingStats).length > 0;
            const showBoth   = hasHitting && hasPitching;     // two-way players

            currentMode = isPitcher ? 'pitching' : 'hitting';

            renderProfile(player);
            renderStatusBadges();

            // Configure tabs
            if (showBoth) {
                statsTabs.classList.add('visible');
                statsTabs.querySelectorAll('.tab-btn').forEach(btn => {
                    btn.classList.toggle('active', btn.dataset.mode === currentMode);
                });
                requestAnimationFrame(() => moveTabUnderline());
            } else {
                statsTabs.classList.remove('visible');
            }

            renderStats();
            setState('player');

        } catch (e) {
            console.error(e);
            showError('An error occurred while fetching player data.');
        }
    }

    // Tab switching
    statsTabs.querySelectorAll('.tab-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            currentMode = btn.dataset.mode;
            statsTabs.querySelectorAll('.tab-btn').forEach(b => b.classList.toggle('active', b === btn));
            moveTabUnderline();
            renderStatusBadges();
            renderStats();
        });
    });

    function moveTabUnderline() {
        const active = statsTabs.querySelector('.tab-btn.active');
        if (!active) return;
        tabUnderline.style.width = active.offsetWidth + 'px';
        tabUnderline.style.left  = active.offsetLeft  + 'px';
    }

    // ── API calls ────────────────────────────────────────────────────────────

    async function fetchPlayerDetails(playerId) {
        const res = await fetch(`https://statsapi.mlb.com/api/v1/people/${playerId}?hydrate=currentTeam`);
        if (!res.ok) throw new Error('Failed to get player details');
        const data = await res.json();
        return data.people[0];
    }

    async function fetchPlayerStats(playerId, group) {
        const res = await fetch(`https://statsapi.mlb.com/api/v1/people/${playerId}/stats?stats=statsSingleSeason&season=${SEASON}&group=${group}&sportId=1`);
        if (!res.ok) return {};
        const data = await res.json();
        return data.stats?.[0]?.splits?.[0]?.stat || {};
    }

    async function fetchRecentStats(playerId, group, gameCount) {
        try {
            const res = await fetch(`https://statsapi.mlb.com/api/v1/people/${playerId}/stats?stats=gameLog&group=${group}&season=${SEASON}&gameType=R&limit=${gameCount}`);
            if (!res.ok) return { stats: {}, gamesCount: 0 };
            const data = await res.json();
            const games = data.stats?.[0]?.splits || [];
            if (!games.length) return { stats: {}, gamesCount: 0 };

            if (group === 'hitting') {
                let atBats = 0, hits = 0;
                games.forEach(g => {
                    atBats += parseInt(g.stat.atBats || 0);
                    hits   += parseInt(g.stat.hits   || 0);
                });
                return {
                    stats: { avg: atBats > 0 ? hits / atBats : 0, atBats, hits },
                    gamesCount: games.length,
                };
            } else {
                let earnedRuns = 0, ip = 0;
                games.forEach(g => {
                    earnedRuns += parseInt(g.stat.earnedRuns || 0);
                    const s = (g.stat.inningsPitched || '0').toString();
                    if (s.includes('.')) {
                        const [whole, frac] = s.split('.');
                        ip += parseInt(whole) + parseInt(frac) / 3;
                    } else {
                        ip += parseFloat(s) || 0;
                    }
                });
                return {
                    stats: { era: ip > 0 ? (earnedRuns / ip) * 9 : 0, inningsPitched: ip, earnedRuns },
                    gamesCount: games.length,
                };
            }
        } catch (e) {
            console.error('Recent stats error:', e);
            return { stats: {}, gamesCount: 0 };
        }
    }

    async function fetchAllPlayerStats(group) {
        try {
            const res = await fetch(`https://statsapi.mlb.com/api/v1/stats?stats=season&group=${group}&sportId=1&season=${SEASON}&limit=600`);
            if (!res.ok) return [];
            const data = await res.json();
            return (data.stats?.[0]?.splits || []).map(s => ({
                id: s.player.id,
                team: s.team,
                stats: s.stat,
            }));
        } catch (e) {
            console.error('All stats error:', e);
            return [];
        }
    }

    async function fetchTeamStandings() {
        try {
            const res = await fetch(`https://statsapi.mlb.com/api/v1/standings?leagueId=103,104&season=${SEASON}`);
            if (!res.ok) return {};
            const data = await res.json();
            const map = {};
            (data.records || []).forEach(rec => {
                (rec.teamRecords || []).forEach(tr => { map[tr.team.id] = tr.gamesPlayed; });
            });
            return map;
        } catch (e) {
            console.error('Standings error:', e);
            return {};
        }
    }

    // ── Qualification + percentile logic ────────────────────────────────────

    // Thresholds match the actual filter (lowered for early-season inclusivity)
    const THRESHOLD = {
        hitter: 2.0,           // PA per team game
        starter: 0.75,         // IP per team game
        relief: 0.20,          // IP per team game
    };

    function isReliefFromStats(s) {
        return (s.gamesStarted || 0) < ((s.gamesPlayed || 0) / 2);
    }

    function isQualified(stats, teamGP, isPitcher, isRelief) {
        if (!teamGP) return false;
        if (isPitcher) {
            const ip = parseFloat(stats.inningsPitched || 0);
            return ip / teamGP >= (isRelief ? THRESHOLD.relief : THRESHOLD.starter);
        } else {
            const pa = parseInt(stats.plateAppearances || 0);
            return pa / teamGP >= THRESHOLD.hitter;
        }
    }

    function filterQualifiedPlayers(allPlayersData, standings, isPitcher) {
        return allPlayersData.filter(p => {
            const tgp = standings[p.team?.id];
            if (!tgp) return false;
            const relief = isPitcher && isReliefFromStats(p.stats);
            return isQualified(p.stats, tgp, isPitcher, relief);
        });
    }

    function calculatePercentile(value, qualifiedValues, higherIsBetter) {
        const valid = qualifiedValues.filter(v => typeof v === 'number' && !isNaN(v));
        if (!valid.length) return 50;
        if (valid.length === 1) return 50;

        const sorted = [...valid].sort((a, b) => a - b);
        let pos = sorted.findIndex(v => v >= value);
        if (pos === -1) pos = sorted.length;

        const raw = (pos / sorted.length) * 100;
        return higherIsBetter ? Math.round(raw) : Math.round(100 - raw);
    }

    function calculateRank(value, qualifiedValues, higherIsBetter) {
        const valid = qualifiedValues.filter(v => typeof v === 'number' && !isNaN(v));
        if (!valid.length) return null;
        const sorted = [...valid].sort((a, b) => higherIsBetter ? b - a : a - b);
        // 1-indexed rank: count of values strictly better than this one + 1
        const better = sorted.filter(v => higherIsBetter ? v > value : v < value).length;
        return { rank: better + 1, total: valid.length };
    }

    // Continuous blue → gray → red gradient. Matches stats-dashboard's pctColor.
    function pctColor(pct) {
        const t = Math.max(0, Math.min(100, pct)) / 100;
        let r, g, b;
        if (t <= 0.5) {
            const f = t * 2;
            r = Math.round( 40 + ( 128 -  40) * f);
            g = Math.round( 80 + ( 128 -  80) * f);
            b = Math.round(220 + ( 128 - 220) * f);
        } else {
            const f = (t - 0.5) * 2;
            r = Math.round(128 + (255 - 128) * f);
            g = Math.round(128 + (  0 - 128) * f);
            b = Math.round(128 + (  0 - 128) * f);
        }
        return `rgb(${r},${g},${b})`;
    }

    // ── Rendering ────────────────────────────────────────────────────────────

    function renderProfile(player) {
        profileHeadshot.innerHTML = `<img src="${headshot(player.id)}" alt="${player.fullName}" onerror="this.src='assets/mlb_logo.svg'">`;
        profileName.textContent = player.fullName;

        const pos    = player.primaryPosition?.name || 'Position Unknown';
        const team   = player.currentTeam;
        const teamId = team?.id;

        profilePosition.innerHTML = `
            <span>${pos}</span>
            <span class="profile-dot"></span>
            ${teamId ? `<img src="${teamLogo(teamId)}" class="profile-team-logo" alt="">` : ''}
            <span>${team?.name || 'Free Agent'}</span>
        `;

        const details = [];
        if (player.primaryNumber)        details.push(`<span><strong>#${player.primaryNumber}</strong></span>`);
        if (player.batSide?.code && player.pitchHand?.code) {
            details.push(`<span>B/T: <strong>${player.batSide.code}/${player.pitchHand.code}</strong></span>`);
        }
        if (player.height)              details.push(`<span>${player.height}</span>`);
        if (player.weight)              details.push(`<span>${player.weight} lbs</span>`);
        if (player.currentAge)          details.push(`<span>Age <strong>${player.currentAge}</strong></span>`);
        profileDetails.innerHTML = details.join('');
    }

    function renderStatusBadges() {
        const { player, hittingStats, pitchingStats, recentHitting, recentPitching, allHitting, allPitching, standings } = currentPlayerData;
        const isPitcher   = currentMode === 'pitching';
        const stats       = isPitcher ? pitchingStats : hittingStats;
        const recentStats = isPitcher ? recentPitching : recentHitting;
        const teamId      = player.currentTeam?.id;
        const teamGP      = teamId ? standings[teamId] : 0;
        const relief      = isPitcher && isReliefFromStats(stats);
        const qualified   = isQualified(stats, teamGP, isPitcher, relief);

        const qualifiedPool = filterQualifiedPlayers(
            isPitcher ? allPitching : allHitting,
            standings,
            isPitcher
        );

        // Qualification badge
        let qualBadge;
        if (qualified) {
            qualBadge = `
                <div class="status-badge qualified">
                    <span class="badge-emoji">✓</span>
                    <span class="badge-text">Qualified</span>
                    <span class="badge-value">${qualifiedPool.length} ${isPitcher ? 'P' : 'H'}</span>
                </div>`;
        } else {
            const thresh = isPitcher ? (relief ? THRESHOLD.relief : THRESHOLD.starter) : THRESHOLD.hitter;
            const actual = isPitcher
                ? ((parseFloat(stats.inningsPitched) || 0) / Math.max(teamGP, 1)).toFixed(2)
                : ((parseInt(stats.plateAppearances) || 0) / Math.max(teamGP, 1)).toFixed(2);
            const unit   = isPitcher ? 'IP' : 'PA';
            qualBadge = `
                <div class="status-badge not-qualified">
                    <span class="badge-emoji">✗</span>
                    <span class="badge-text">Not Qualified</span>
                    <span class="badge-value">${actual}/${thresh.toFixed(2)} ${unit}/G</span>
                </div>`;
        }

        // Recent performance badge
        let perfBadge;
        if (isPitcher) {
            const era = recentStats.stats.era;
            const gc  = recentStats.gamesCount;
            const ip  = recentStats.stats.inningsPitched || 0;
            if (gc > 0 && !isNaN(era) && ip > 0) {
                const eraDisplay = era.toFixed(2);
                if (era < 3.00) {
                    perfBadge = `<div class="status-badge hot"><span class="badge-emoji">🔥</span><span class="badge-text">Hot · last ${gc} starts</span><span class="badge-value">${eraDisplay} ERA</span></div>`;
                } else if (era <= 3.90) {
                    perfBadge = `<div class="status-badge steady"><span class="badge-emoji">⚖️</span><span class="badge-text">Steady · last ${gc} starts</span><span class="badge-value">${eraDisplay} ERA</span></div>`;
                } else {
                    perfBadge = `<div class="status-badge cold"><span class="badge-emoji">❄️</span><span class="badge-text">Cold · last ${gc} starts</span><span class="badge-value">${eraDisplay} ERA</span></div>`;
                }
            } else {
                perfBadge = `<div class="status-badge no-data"><span class="badge-text">Recent pitching data unavailable</span></div>`;
            }
        } else {
            const avg = recentStats.stats.avg;
            const gc  = recentStats.gamesCount;
            const ab  = recentStats.stats.atBats || 0;
            if (gc > 0 && !isNaN(avg) && ab > 0) {
                const avgDisplay = avg.toFixed(3).replace(/^0+/, '');
                if (avg > 0.285) {
                    perfBadge = `<div class="status-badge hot"><span class="badge-emoji">🔥</span><span class="badge-text">Hot · last ${gc} games</span><span class="badge-value">${avgDisplay} AVG</span></div>`;
                } else if (avg >= 0.225) {
                    perfBadge = `<div class="status-badge steady"><span class="badge-emoji">⚖️</span><span class="badge-text">Steady · last ${gc} games</span><span class="badge-value">${avgDisplay} AVG</span></div>`;
                } else {
                    perfBadge = `<div class="status-badge cold"><span class="badge-emoji">❄️</span><span class="badge-text">Cold · last ${gc} games</span><span class="badge-value">${avgDisplay} AVG</span></div>`;
                }
            } else {
                perfBadge = `<div class="status-badge no-data"><span class="badge-text">Recent hitting data unavailable</span></div>`;
            }
        }

        statusRow.innerHTML = qualBadge + perfBadge;
    }

    function renderStats() {
        const { hittingStats, pitchingStats, allHitting, allPitching, standings, player } = currentPlayerData;
        const isPitcher = currentMode === 'pitching';
        const stats     = isPitcher ? pitchingStats : hittingStats;
        const teamGP    = standings[player.currentTeam?.id] || 0;
        const relief    = isPitcher && isReliefFromStats(stats);
        const qualified = isQualified(stats, teamGP, isPitcher, relief);

        const qualifiedPool = filterQualifiedPlayers(
            isPitcher ? allPitching : allHitting,
            standings,
            isPitcher
        );

        statsTitle.textContent    = `${SEASON} ${isPitcher ? 'Pitching' : 'Hitting'} Stats`;
        statsSubtitle.textContent = `vs ${qualifiedPool.length} qualified ${isPitcher ? (relief ? 'relievers' : 'starters') : 'hitters'}`;

        const config = isPitcher ? PITCHING_STATS : HITTING_STATS;
        statsGrid.innerHTML = '';

        config.forEach(cfg => {
            if (!Object.prototype.hasOwnProperty.call(stats, cfg.name)) return;

            const raw = parseFloat(stats[cfg.name]);
            if (isNaN(raw)) return;

            const higherIsBetter = isPitcher ? !cfg.goodLow : !!cfg.goodHigh;

            const qualifiedValues = qualifiedPool
                .map(p => parseFloat(p.stats[cfg.name]))
                .filter(v => !isNaN(v));

            const percentile = qualified && qualifiedValues.length > 0
                ? calculatePercentile(raw, qualifiedValues, higherIsBetter)
                : null;

            const rankInfo = qualified && qualifiedValues.length > 0
                ? calculateRank(raw, qualifiedValues, higherIsBetter)
                : null;

            const display = cfg.format ? cfg.format(raw) : (Number.isInteger(raw) ? raw : raw.toString());
            const color   = percentile != null ? pctColor(percentile) : '#9e9e9e';

            const card = document.createElement('div');
            card.className = 'sc' + (qualified ? '' : ' unqualified');
            card.innerHTML = `
                <div class="sc-name">${cfg.display}</div>
                <div class="sc-value">${display}</div>
                <div class="sc-bar-wrap">
                    <div class="sc-bar"></div>
                    <div class="sc-circle">${percentile != null ? percentile : 'N/A'}</div>
                </div>
                <div class="sc-rank">${rankInfo ? `${ordinal(rankInfo.rank)} of ${rankInfo.total}` : 'Not qualified'}</div>
            `;

            statsGrid.appendChild(card);

            // Animate the bar in after it's in the DOM
            const bar    = card.querySelector('.sc-bar');
            const circle = card.querySelector('.sc-circle');
            requestAnimationFrame(() => {
                if (percentile != null) {
                    bar.style.background = color;
                    bar.style.width      = percentile + '%';
                    circle.style.background = color;
                    circle.style.left = `calc(${percentile}% - 7px)`;
                } else {
                    bar.style.width = '0%';
                    circle.style.left = '0';
                }
            });
        });

        if (!statsGrid.children.length) {
            statsGrid.innerHTML = `<div style="grid-column:1/-1;padding:24px;text-align:center;color:var(--muted);font-size:12px;">No ${isPitcher ? 'pitching' : 'hitting'} stats available for ${SEASON}.</div>`;
        }
    }

    function ordinal(n) {
        const s = ['th', 'st', 'nd', 'rd'];
        const v = n % 100;
        return n + (s[(v - 20) % 10] || s[v] || s[0]);
    }

    // ── Stat configs ─────────────────────────────────────────────────────────
    const fmtRate = v => parseFloat(v).toFixed(3).replace(/^0+/, '');

    const HITTING_STATS = [
        { name: 'avg',              display: 'AVG',           format: fmtRate, goodHigh: true  },
        { name: 'homeRuns',         display: 'Home Runs',                       goodHigh: true  },
        { name: 'rbi',              display: 'RBI',                             goodHigh: true  },
        { name: 'hits',             display: 'Hits',                            goodHigh: true  },
        { name: 'runs',             display: 'Runs',                            goodHigh: true  },
        { name: 'obp',              display: 'OBP',           format: fmtRate, goodHigh: true  },
        { name: 'slg',              display: 'SLG',           format: fmtRate, goodHigh: true  },
        { name: 'ops',              display: 'OPS',           format: fmtRate, goodHigh: true  },
        { name: 'doubles',          display: 'Doubles',                         goodHigh: true  },
        { name: 'triples',          display: 'Triples',                         goodHigh: true  },
        { name: 'totalBases',       display: 'Total Bases',                     goodHigh: true  },
        { name: 'baseOnBalls',      display: 'Walks',                           goodHigh: true  },
        { name: 'stolenBases',      display: 'Stolen Bases',                    goodHigh: true  },
        { name: 'strikeOuts',       display: 'Strikeouts',                      goodHigh: false },
        { name: 'plateAppearances', display: 'PA',                              goodHigh: true  },
    ];

    const PITCHING_STATS = [
        { name: 'era',            display: 'ERA',         format: v => parseFloat(v).toFixed(2),  goodLow: true  },
        { name: 'whip',           display: 'WHIP',        format: v => parseFloat(v).toFixed(3),  goodLow: true  },
        { name: 'wins',           display: 'Wins',                                                goodHigh: true },
        { name: 'losses',         display: 'Losses',                                              goodLow: true  },
        { name: 'strikeOuts',     display: 'Strikeouts',                                          goodHigh: true },
        { name: 'inningsPitched', display: 'Innings',     format: v => parseFloat(v).toFixed(1),  goodHigh: true },
        { name: 'saves',          display: 'Saves',                                               goodHigh: true },
        { name: 'holds',          display: 'Holds',                                               goodHigh: true },
        { name: 'hits',           display: 'Hits Allowed',                                        goodLow: true  },
        { name: 'runs',           display: 'Runs Allowed',                                        goodLow: true  },
        { name: 'homeRuns',       display: 'HR Allowed',                                          goodLow: true  },
        { name: 'baseOnBalls',    display: 'Walks',                                               goodLow: true  },
        { name: 'strikeoutWalkRatio', display: 'K/BB',    format: v => parseFloat(v).toFixed(2),  goodHigh: true },
        { name: 'gamesPlayed',    display: 'Games',                                               goodHigh: true },
        { name: 'gamesStarted',   display: 'GS',                                                  goodHigh: true },
    ];

    // ── Init ─────────────────────────────────────────────────────────────────
    setState('empty');
    searchInput.focus();
});