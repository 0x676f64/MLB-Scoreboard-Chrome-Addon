document.addEventListener('DOMContentLoaded', async () => {

    // ── Elements ──────────────────────────────────────────────────────────────

    const container        = document.getElementById('standings-container');
    const alBtn            = document.getElementById('al-tab');
    const nlBtn            = document.getElementById('nl-tab');
    const wcBtn            = document.getElementById('wildcard-tab');
    const bracketBtn       = document.getElementById('bracket-tab');
    const yearDisplay      = document.getElementById('year-display');
    const yearPrev         = document.getElementById('year-prev');
    const yearNext         = document.getElementById('year-next');
    const historicalBanner = document.getElementById('historical-banner');

    // ── State ─────────────────────────────────────────────────────────────────

    const CURRENT_YEAR = 2026;
    const MIN_YEAR     = 2015;

    let activeLeague  = 'AL';
    let activeSeason  = CURRENT_YEAR;
    const cache       = {};         // standings per year
    const bracketCache = {};        // playoff results per year

    // ── Constants ─────────────────────────────────────────────────────────────

    const DIVISION_NAMES = {
        201:'AL East', 202:'AL Central', 200:'AL West',
        204:'NL East', 205:'NL Central', 203:'NL West',
    };

    const TEAM_ABBR = {
        108:'LAA', 109:'ARI', 110:'BAL', 111:'BOS', 112:'CHC',
        113:'CIN', 114:'CLE', 115:'COL', 116:'DET', 117:'HOU',
        118:'KC',  119:'LAD', 120:'WSH', 121:'NYM', 133:'OAK',
        134:'PIT', 135:'SD',  136:'SEA', 137:'SF',  138:'STL',
        139:'TB',  140:'TEX', 141:'TOR', 142:'MIN', 143:'PHI',
        144:'ATL', 145:'CWS', 146:'MIA', 147:'NYY', 158:'MIL',
    };

    // Placeholder shown when a team logo URL fails to load.
    // Navy circle with baseball stitching — intentional, never looks broken.
    const FALLBACK_LOGO = `data:image/svg+xml,${encodeURIComponent(`
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 40 40">
            <circle cx="20" cy="20" r="20" fill="#041e42"/>
            <circle cx="20" cy="20" r="14" fill="none" stroke="rgba(255,255,255,0.08)" stroke-width="1.5"/>
            <circle cx="20" cy="20" r="8"  fill="rgba(255,255,255,0.06)"/>
            <!-- Left stitch curve -->
            <path d="M13 11 C10 15 10 25 13 29" fill="none" stroke="#bf0d3d" stroke-width="1.4" stroke-linecap="round"/>
            <!-- Right stitch curve -->
            <path d="M27 11 C30 15 30 25 27 29" fill="none" stroke="#bf0d3d" stroke-width="1.4" stroke-linecap="round"/>
            <!-- Left tick marks -->
            <line x1="13" y1="16" x2="10" y2="15" stroke="#bf0d3d" stroke-width="0.9" stroke-linecap="round"/>
            <line x1="13" y1="20" x2="10" y2="20" stroke="#bf0d3d" stroke-width="0.9" stroke-linecap="round"/>
            <line x1="13" y1="24" x2="10" y2="25" stroke="#bf0d3d" stroke-width="0.9" stroke-linecap="round"/>
            <!-- Right tick marks -->
            <line x1="27" y1="16" x2="30" y2="15" stroke="#bf0d3d" stroke-width="0.9" stroke-linecap="round"/>
            <line x1="27" y1="20" x2="30" y2="20" stroke="#bf0d3d" stroke-width="0.9" stroke-linecap="round"/>
            <line x1="27" y1="24" x2="30" y2="25" stroke="#bf0d3d" stroke-width="0.9" stroke-linecap="round"/>
        </svg>
    `)}`;

    // Safe onerror attribute string — swaps src to placeholder, removes handler to prevent loop
    const ON_ERR = `this.onerror=null;this.src='${FALLBACK_LOGO}'`;

    // ── Popup height reset ────────────────────────────────────────────────────
    // Chrome extension popups grow automatically but do NOT shrink on their own.
    // After every content change we explicitly clear any accumulated height so
    // Chrome reads the new scrollHeight and resizes the window to match.
    function resetPopupHeight() {
        document.documentElement.style.height = 'auto';
        document.body.style.height = 'auto';
    }

    // ── Data Fetching ─────────────────────────────────────────────────────────

    async function fetchStandings(season) {
        if (cache[season]) return cache[season];
        const res     = await fetch(
            `https://statsapi.mlb.com/api/v1/standings?leagueId=103,104&season=${season}`
        );
        cache[season] = await res.json();
        return cache[season];
    }

    // Load historical playoff results from the bundled JSON.
    // The JSON covers 2015-2024 with 100% accurate LCS/WS data and best-effort DS/WC data.
    // Returns the season record directly from playoff-history.json, or null for current season.
    async function fetchPlayoffResults(season) {
        if (bracketCache[season] !== undefined) return bracketCache[season];
        if (season >= CURRENT_YEAR) { bracketCache[season] = null; return null; }

        try {
            const res    = await fetch(chrome?.runtime?.getURL
                ? chrome.runtime.getURL('playoff-history.json')
                : 'playoff-history.json');
            const allData = await res.json();
            bracketCache[season] = allData[String(season)] || null;
            return bracketCache[season];
        } catch(e) {
            console.warn('playoff-history.json load failed:', e);
            bracketCache[season] = null;
            return null;
        }
    }

    // ── Seeding Logic ─────────────────────────────────────────────────────────

    // Returns { AL: [seed1..seed6], NL: [seed1..seed6] }
    // Each entry: { team, wins, losses, pct, seed, isDivWinner, divisionId }
    function getPlayoffSeeds(data) {
        const divWinners = { AL: [], NL: [] };
        const wcPool     = { AL: [], NL: [] };

        data.records.forEach(rec => {
            const league = rec.league?.id === 103 ? 'AL' : 'NL';
            const teams  = [...rec.teamRecords].sort(
                (a,b) => parseFloat(b.winningPercentage) - parseFloat(a.winningPercentage)
            );
            if (!teams.length) return;

            const makeEntry = (t, isDivWinner) => ({
                team:        t.team,
                wins:        t.wins,
                losses:      t.losses,
                pct:         parseFloat(t.winningPercentage) || 0,
                isDivWinner,
                divisionId:  rec.division?.id,
            });

            divWinners[league].push(makeEntry(teams[0], true));
            teams.slice(1).forEach(t => wcPool[league].push(makeEntry(t, false)));
        });

        const seeds = {};
        ['AL','NL'].forEach(lg => {
            // Sort division winners best → worst record for seeds 1-3
            divWinners[lg].sort((a,b) => b.pct - a.pct);
            // Sort wild card pool best → worst record for seeds 4-6
            wcPool[lg].sort((a,b) => b.pct - a.pct);

            seeds[lg] = [
                ...divWinners[lg].slice(0,3).map((t,i) => ({ ...t, seed: i+1 })),
                ...wcPool[lg].slice(0,3).map((t,i) => ({ ...t, seed: i+4 })),
            ];
        });

        return seeds;
    }

    // ── Bracket Rendering ──────────────────────────────────────────────────────

    function teamLogo(id) {
        return `https://www.mlbstatic.com/team-logos/${id}.svg`;
    }

    // Dark-background variant — MLB's "on-dark" logo is white/light coloured,
    // designed specifically to pop against navy, black, and dark surfaces.
    function teamLogoDark(id) {
        return `https://www.mlbstatic.com/team-logos/team-cap-on-dark/${id}.svg`;
    }

    function fmtWL(wins, losses) {
        return `${wins}-${losses}`;
    }

    // Renders a single matchup card (two teams)
    function makeBktMatchup(topEntry, botEntry, result, roundLabel) {
        const div      = document.createElement('div');
        div.className  = 'bracket-matchup';

        const hasResult  = result && result.winnerId;
        const topIsWin   = hasResult && result.winnerId === topEntry?.team?.id;
        const botIsWin   = hasResult && result.winnerId === botEntry?.team?.id;
        const isBye      = topEntry?.isBye || false;

        if (isBye) div.classList.add('bye-card');

        const teamRow = (entry, isWinner, isLoser, isTbd) => {
            if (!entry) {
                return `<div class="bkt-team tbd">
                    <span class="bkt-seed">?</span>
                    <div class="bkt-tbd-logo"></div>
                    <span class="bkt-abbr" style="color:var(--text-muted);">TBD</span>
                </div>`;
            }
            const id      = entry.team?.id;
            const abbr    = TEAM_ABBR[id] || entry.team?.name?.split(' ').pop() || '???';
            const cls     = isWinner ? 'winner' : isLoser ? 'loser' : isTbd ? 'tbd' : '';
            const seedCls = entry.seed <= 3 ? 'in-playoff' : '';
            const winMark = isWinner
                ? `<div class="bkt-win-mark"><svg viewBox="0 0 8 8"><polyline points="1.5 4 3.2 6 6.5 2"/></svg></div>`
                : '';
            return `<div class="bkt-team ${cls}">
                <span class="bkt-seed ${seedCls}">${entry.seed}</span>
                <img src="${teamLogo(id)}" class="bkt-logo" onerror="${ON_ERR}">
                <span class="bkt-abbr">${abbr}</span>
                <span class="bkt-rec">${fmtWL(entry.wins, entry.losses)}</span>
                ${winMark}
            </div>`;
        };

        const seriesBadge = hasResult
            ? `<div class="bkt-series-result">${result.wins}-${result.losses}</div>`
            : '';

        div.innerHTML = `
            ${teamRow(topEntry, topIsWin, hasResult && !topIsWin && topEntry, false)}
            ${teamRow(botEntry, botIsWin, hasResult && !botIsWin && botEntry, !hasResult)}
            ${seriesBadge}`;

        return div;
    }

    // Build one league's bracket section (AL or NL)
    // Convert a JSON round record { winner, loser, wins, losses } into the
    // shape makeBktMatchup expects: { winnerId, wins, losses, winnerTeam }
    // teamFromSeeds looks up the seed entry so we can show real name/logo.
    function resolveTeam(id, seeds) {
        if (!id) return null;
        const found = seeds?.find(s => s.team?.id === id);
        return found ? found.team : { id, name: TEAM_ABBR[id] || String(id) };
    }

    function jsonRoundToResult(round, seeds) {
        if (!round) return null;
        return {
            winnerId:   round.winner,
            wins:       round.wins,
            losses:     round.losses,
            winnerTeam: resolveTeam(round.winner, seeds),
        };
    }

    // Build a seed-like entry from just a team ID — used when seeding order
    // isn't stored in the JSON (historical seasons with old format)
    function teamEntry(id, seedNum, allSeeds) {
        const found = allSeeds?.find(s => s.team?.id === id);
        if (found) return found;
        return { team: { id, name: TEAM_ABBR[id] || String(id) }, wins: 0, losses: 0, seed: seedNum };
    }

    // ── renderLeagueBracket ───────────────────────────────────────────────────
    // history = the league object from playoff-history.json (or null for projected)
    // seeds   = computed seeds from current standings (used for projected, and
    //           for regular-season W-L records in historical display)
    function renderLeagueBracket(league, seeds, history) {
        const section = document.createElement('div');
        section.className = 'bracket-league';
        const isAL = league === 'AL';
        const fmt  = history?.format || (seeds.length >= 6 ? 'WC_SERIES' : 'WC_GAME');
        const isOldFmt = fmt === 'WC_GAME';   // 2015-2021
        const teamSeeds = seeds; // shorthand

        section.innerHTML = `
            <div class="bracket-league-header">
                <div class="bracket-league-header-dot"></div>
                <span class="bracket-league-name">${isAL ? 'American' : 'National'} League</span>
                <span class="bracket-league-note">${isOldFmt ? '5 teams · WC game' : '6 teams · 3 rounds'}</span>
            </div>
            <div class="bracket-rounds" id="bkt-rounds-${league}"></div>`;

        const roundsEl = section.querySelector('#bkt-rounds-' + league);

        // ── Pull round data from JSON (historical) or mark as projected ───────

        const h = history?.[league];   // history.AL or history.NL

        // WC round
        const wcData  = h?.wc  || null;   // array of 2 series (new format)
        const wcGame  = h?.wcGame || null; // single game (old format)
        // DS round: array of 2 series
        const dsData  = h?.ds  || null;
        // LCS
        const lcsData = h?.lcs || null;

        const lcsResult = jsonRoundToResult(lcsData, teamSeeds);

        // ── Wild Card column ──────────────────────────────────────────────────
        const wcRound = document.createElement('div');
        wcRound.className = 'bracket-round';
        wcRound.innerHTML = '<div class="bracket-round-label">' + (isOldFmt ? 'WC Game' : 'Wild Card') + '</div>';

        if (isOldFmt) {
            // Old format: single WC game, then 4 seeds go to ALDS
            const wcW = wcGame ? teamEntry(wcGame.winner, '★', teamSeeds) : null;
            const wcL = wcGame ? teamEntry(wcGame.loser, '★', teamSeeds) : null;

            // Show the WC game as a 2-team card
            const wcCard = makeBktMatchup(
                wcW || { team: { id: 0 }, wins: 0, losses: 0, seed: 'WC1' },
                wcL || { team: { id: 0 }, wins: 0, losses: 0, seed: 'WC2' },
                wcGame ? { winnerId: wcGame.winner, wins: 1, losses: 0, winnerTeam: wcW?.team } : null,
                'WC'
            );
            wcRound.appendChild(wcCard);

            // Spacer: seeds 1 and 2 advance directly
            const div1Card = document.createElement('div');
            div1Card.className = 'bracket-matchup bye-card';
            div1Card.innerHTML = `<div class="bkt-team" style="opacity:0.6;">
                <span class="bkt-seed in-playoff">1</span>
                <img src="${teamLogo(seeds[0]?.team?.id || 0)}" class="bkt-logo" onerror="${ON_ERR}">
                <span class="bkt-abbr">${TEAM_ABBR[seeds[0]?.team?.id] || seeds[0]?.team?.name?.split(' ').pop() || '—'}</span>
                <span class="bkt-rec">${fmtWL(seeds[0]?.wins||0, seeds[0]?.losses||0)}</span>
                <span style="font-size:7px;color:var(--text-muted);margin-left:auto;">BYE</span>
            </div>`;
            wcRound.appendChild(div1Card);

            const div2Card = document.createElement('div');
            div2Card.className = 'bracket-matchup bye-card';
            div2Card.innerHTML = `<div class="bkt-team" style="opacity:0.6;">
                <span class="bkt-seed in-playoff">2</span>
                <img src="${teamLogo(seeds[1]?.team?.id || 0)}" class="bkt-logo" onerror="${ON_ERR}">
                <span class="bkt-abbr">${TEAM_ABBR[seeds[1]?.team?.id] || seeds[1]?.team?.name?.split(' ').pop() || '—'}</span>
                <span class="bkt-rec">${fmtWL(seeds[1]?.wins||0, seeds[1]?.losses||0)}</span>
                <span style="font-size:7px;color:var(--text-muted);margin-left:auto;">BYE</span>
            </div>`;
            wcRound.appendChild(div2Card);

        } else {
            // New format: two best-of-3 series + two byes
            const [wc1, wc2] = wcData || [null, null];

            // Series 1: #3 vs #6
            const wc1Top = wc1 ? teamEntry(Math.max(wc1.winner, wc1.loser) === seeds[2]?.team?.id ? seeds[2]?.team?.id : wc1.winner, 3, teamSeeds) : seeds[2];
            const wc1Bot = wc1 ? teamEntry(wc1.winner === wc1Top?.team?.id ? wc1.loser : wc1.winner, 6, teamSeeds) : seeds[5];
            wcRound.appendChild(makeBktMatchup(
                wc1 ? teamEntry(wc1.winner, '■', teamSeeds) : seeds[2],
                wc1 ? teamEntry(wc1.loser,  '■', teamSeeds) : seeds[5],
                jsonRoundToResult(wc1, teamSeeds), 'WC'
            ));

            // Bye: #1 seed
            const byeDiv1 = document.createElement('div');
            byeDiv1.className = 'bracket-matchup bye-card';
            byeDiv1.innerHTML = `<div class="bkt-team" style="opacity:0.55;">
                <span class="bkt-seed in-playoff">${seeds[0]?.seed || 1}</span>
                <img src="${teamLogo(seeds[0]?.team?.id)}" class="bkt-logo" onerror="${ON_ERR}">
                <span class="bkt-abbr">${TEAM_ABBR[seeds[0]?.team?.id] || seeds[0]?.team?.name?.split(' ').pop()}</span>
                <span class="bkt-rec">${fmtWL(seeds[0]?.wins, seeds[0]?.losses)}</span>
                <span style="font-size:7px;color:var(--text-muted);margin-left:auto;">BYE</span>
            </div>`;
            wcRound.appendChild(byeDiv1);

            // Series 2: #4 vs #5
            wcRound.appendChild(makeBktMatchup(
                wc2 ? teamEntry(wc2.winner, '■', teamSeeds) : seeds[3],
                wc2 ? teamEntry(wc2.loser,  '■', teamSeeds) : seeds[4],
                jsonRoundToResult(wc2, teamSeeds), 'WC'
            ));

            // Bye: #2 seed
            const byeDiv2 = document.createElement('div');
            byeDiv2.className = 'bracket-matchup bye-card';
            byeDiv2.innerHTML = `<div class="bkt-team" style="opacity:0.55;">
                <span class="bkt-seed in-playoff">${seeds[1]?.seed || 2}</span>
                <img src="${teamLogo(seeds[1]?.team?.id)}" class="bkt-logo" onerror="${ON_ERR}">
                <span class="bkt-abbr">${TEAM_ABBR[seeds[1]?.team?.id] || seeds[1]?.team?.name?.split(' ').pop()}</span>
                <span class="bkt-rec">${fmtWL(seeds[1]?.wins, seeds[1]?.losses)}</span>
                <span style="font-size:7px;color:var(--text-muted);margin-left:auto;">BYE</span>
            </div>`;
            wcRound.appendChild(byeDiv2);
        }

        roundsEl.appendChild(wcRound);

        // ── Division Series column ────────────────────────────────────────────
        const dsRound = document.createElement('div');
        dsRound.className = 'bracket-round';
        dsRound.innerHTML = '<div class="bracket-round-label">Div Series</div>';

        const [ds1, ds2] = dsData || [null, null];
        const ds1Res = jsonRoundToResult(ds1, teamSeeds);
        const ds2Res = jsonRoundToResult(ds2, teamSeeds);

        dsRound.appendChild(makeBktMatchup(
            ds1 ? teamEntry(ds1.winner, '■', teamSeeds) : null,
            ds1 ? teamEntry(ds1.loser,  '■', teamSeeds) : null,
            ds1Res, 'DS'
        ));
        dsRound.appendChild(makeBktMatchup(
            ds2 ? teamEntry(ds2.winner, '■', teamSeeds) : null,
            ds2 ? teamEntry(ds2.loser,  '■', teamSeeds) : null,
            ds2Res, 'DS'
        ));

        roundsEl.appendChild(dsRound);

        // ── LCS column ────────────────────────────────────────────────────────
        const lcsRound = document.createElement('div');
        lcsRound.className = 'bracket-round';
        lcsRound.innerHTML = '<div class="bracket-round-label">Champ Series</div>';

        lcsRound.appendChild(makeBktMatchup(
            lcsData ? teamEntry(lcsData.winner, '■', teamSeeds) : null,
            lcsData ? teamEntry(lcsData.loser,  '■', teamSeeds) : null,
            lcsResult, 'LCS'
        ));

        roundsEl.appendChild(lcsRound);

        return { el: section, lcsWinnerId: lcsData?.winner || null, lcsResult };
    }

    // ── renderWS ──────────────────────────────────────────────────────────────
    function renderWS(alData, nlData, history, seeds) {
        const wsDiv = document.createElement('div');
        wsDiv.className = 'bracket-ws';

        const ws = history?.ws;

        if (ws) {
            // Historical — show champion prominently
            const runnerUpId = ws.loser;
            const champId    = ws.winner;
            wsDiv.innerHTML = `
                <div class="ws-label">World<br>Series</div>
                <div class="ws-runner-up">
                    <img src="${teamLogoDark(runnerUpId)}" class="ws-runner-up-logo" onerror="${ON_ERR}">
                    <div class="ws-runner-up-name">${TEAM_ABBR[runnerUpId] || runnerUpId}</div>
                    <div style="font-family:'DM Mono',monospace;font-size:8px;color:rgba(255,255,255,0.3);">Runner-up</div>
                </div>
                <div class="ws-champion">
                    <div class="ws-crown">🏆</div>
                    <img src="${teamLogoDark(champId)}" class="ws-champ-logo" onerror="${ON_ERR}">
                    <div class="ws-champ-name">
                        ${TEAM_ABBR[champId] || champId}
                        <span style="font-family:'DM Mono',monospace;font-size:10px;font-weight:400;color:rgba(255,255,255,0.5);margin-left:4px;">${ws.wins}–${ws.losses}</span>
                    </div>
                    <div class="ws-champ-result">World Series Champions</div>
                </div>
                <div style="flex:1;"></div>`;
        } else {
            // Projected — show the two LCS projections
            const alId  = alData?.lcsWinnerId;
            const nlId  = nlData?.lcsWinnerId;
            const alAbbr = alId ? (TEAM_ABBR[alId] || String(alId)) : 'AL Champ';
            const nlAbbr = nlId ? (TEAM_ABBR[nlId] || String(nlId)) : 'NL Champ';
            wsDiv.innerHTML = `
                <div class="ws-label">World<br>Series</div>
                <div class="ws-matchup">
                    <div class="ws-team">
                        ${alId ? `<img src="${teamLogoDark(alId)}" class="ws-logo" onerror="${ON_ERR}">` : '<div style="width:30px;height:30px;border-radius:50%;background:rgba(255,255,255,0.1);flex-shrink:0;"></div>'}
                        <div>
                            <div class="ws-team-name">${alAbbr}</div>
                            <div class="ws-league-badge">American League</div>
                        </div>
                    </div>
                    <div class="ws-vs">vs</div>
                    <div class="ws-team right" style="text-align:right;">
                        <div>
                            <div class="ws-team-name">${nlAbbr}</div>
                            <div class="ws-league-badge">National League</div>
                        </div>
                        ${nlId ? `<img src="${teamLogoDark(nlId)}" class="ws-logo" onerror="${ON_ERR}">` : '<div style="width:30px;height:30px;border-radius:50%;background:rgba(255,255,255,0.1);flex-shrink:0;"></div>'}
                    </div>
                </div>`;
        }

        return wsDiv;
    }

    // Main bracket entry point
    async function loadBracket(season) {
        if (container.children.length > 0) {
            container.classList.add('slide-exit');
            await new Promise(r => setTimeout(r, 140));
            container.classList.remove('slide-exit');
        }

        container.innerHTML = `
            <div class="loading-state">
                <div class="loading-spinner"></div>
                Loading ${season} Playoff Bracket…
            </div>`;

        try {
            // Fetch both in parallel
            const [standingsData, playoffResults] = await Promise.all([
                fetchStandings(season),
                fetchPlayoffResults(season),
            ]);

            container.innerHTML = '';
            container.style.flexDirection = 'column';
            container.style.flexWrap = 'nowrap';

            const seeds      = getPlayoffSeeds(standingsData);
            const isProjected = season >= CURRENT_YEAR;

            // ── Mode banner ────────────────────────────────────────────────
            const banner = document.createElement('div');
            if (isProjected) {
                banner.className = 'bracket-mode-banner projected';
                banner.innerHTML = `
                    <svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><polyline points="12 12 15 14"/></svg>
                    Projected bracket — if the season ended today`;
            } else {
                banner.className = 'bracket-mode-banner historical';
                banner.innerHTML = `
                    <svg viewBox="0 0 24 24"><polyline points="1 4 1 10 7 10"/><path d="M3.51 15a9 9 0 1 0 .49-3"/></svg>
                    ${season} postseason results`;
            }
            container.appendChild(banner);

            // ── League brackets side by side ───────────────────────────────
            const leaguesRow = document.createElement('div');
            leaguesRow.className = 'bracket-leagues';

            // playoffResults is the raw season record from playoff-history.json
            // (e.g. { format, champion, AL: {...}, NL: {...}, ws: {...} })
            const alData = renderLeagueBracket('AL', seeds.AL, playoffResults);
            const nlData = renderLeagueBracket('NL', seeds.NL, playoffResults);
            leaguesRow.appendChild(alData.el);
            leaguesRow.appendChild(nlData.el);
            container.appendChild(leaguesRow);

            // ── World Series ───────────────────────────────────────────────
            container.appendChild(
                renderWS(alData, nlData, playoffResults, seeds)
            );

        } catch(err) {
            console.error('Bracket load error:', err);
            container.innerHTML = `
                <div class="loading-state" style="color:#ef4444;flex-direction:column;gap:6px;">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <circle cx="12" cy="12" r="10"/>
                        <line x1="12" y1="8" x2="12" y2="12"/>
                        <line x1="12" y1="16" x2="12.01" y2="16"/>
                    </svg>
                    Could not load ${season} bracket
                </div>`;
        } finally {
            // Always reset after content settles so the popup shrinks/grows correctly
            requestAnimationFrame(resetPopupHeight);
        }
    }

    // ── Standings Helpers ─────────────────────────────────────────────────────

    function gamesBack(leadW, leadL, w, l) {
        if (w === leadW && l === leadL) return '—';
        const gb = ((leadW - w) + (l - leadL)) / 2;
        return gb % 1 === 0 ? String(gb) : gb.toFixed(1);
    }

    function fmtPct(p) {
        if (!p || p === '0') return '.000';
        const f = parseFloat(p);
        return f < 1 ? '.' + String(Math.round(f * 1000)).padStart(3, '0') : f.toFixed(3);
    }

    // ── Standings Rendering ───────────────────────────────────────────────────

    function buildTeamRow(team, i, isFirst, gb, delay) {
        const row      = document.createElement('div');
        row.className  = 'team-row' + (isFirst ? ' leader' : '');
        row.style.animationDelay = `${delay + 40 + i * 35}ms`;

        const teamId = team.team.id;
        const abbr   = TEAM_ABBR[teamId] || team.team.name.split(' ').pop();
        const p      = parseFloat(team.winningPercentage) || 0;
        const pctStr = fmtPct(team.winningPercentage);
        const barPct = Math.max(0, Math.min(100, ((p - 0.35) / 0.35) * 100));

        row.innerHTML = `
            <span class="team-pos${isFirst ? ' first-place' : ''}">${i + 1}</span>
            <div class="team-identity">
                <img src="https://www.mlbstatic.com/team-logos/${teamId}.svg"
                     alt="${team.team.name}" class="team-logo"
                     onerror="${ON_ERR}">
                <span class="team-abbr">${abbr}</span>
            </div>
            <span class="team-stat">${team.wins}</span>
            <span class="team-stat">${team.losses}</span>
            <span class="team-stat muted">${gb}</span>
            <div class="pct-cell">
                <span class="pct-value">${pctStr}</span>
                <div class="pct-bar-track">
                    <div class="pct-bar-fill" style="width:${barPct}%"></div>
                </div>
            </div>`;

        return row;
    }

    function renderDivision(record, delay = 0) {
        const card     = document.createElement('div');
        card.className = 'division-card';
        card.style.animationDelay = `${delay}ms`;

        const name  = DIVISION_NAMES[record.division.id] || 'Division';
        const teams = [...record.teamRecords].sort(
            (a,b) => parseFloat(b.winningPercentage) - parseFloat(a.winningPercentage)
        );
        const lead  = teams[0];

        card.innerHTML = `
            <div class="division-header">
                <div class="division-header-dot"></div>
                <span class="division-name">${name}</span>
                <span class="division-season">${activeSeason}</span>
            </div>
            <div class="col-header">
                <span>#</span><span>Team</span>
                <span>W</span><span>L</span><span>GB</span>
                <span style="text-align:right;padding-right:2px;">Pct</span>
            </div>
            <div class="team-list"></div>`;

        const list = card.querySelector('.team-list');
        teams.forEach((team, i) => {
            const gb = gamesBack(lead.wins, lead.losses, team.wins, team.losses);
            list.appendChild(buildTeamRow(team, i, i === 0, gb, delay));
        });

        return card;
    }

    function renderWildcard(data) {
        const fragment = document.createDocumentFragment();
        ['AL','NL'].forEach((league, li) => {
            const leagueId = league === 'AL' ? 103 : 104;
            const wcTeams  = [];
            data.records.forEach(rec => {
                if (rec.league?.id !== leagueId) return;
                rec.teamRecords.forEach(t => {
                    if (t.wildCardRank && parseInt(t.wildCardRank) <= 6) wcTeams.push(t);
                });
            });
            wcTeams.sort((a,b) => parseInt(a.wildCardRank) - parseInt(b.wildCardRank));

            const card     = document.createElement('div');
            card.className = 'division-card';
            card.style.animationDelay = `${li * 60}ms`;
            card.innerHTML = `
                <div class="wc-league-label">
                    <div class="division-header-dot"></div>
                    <span>${league} Wild Card</span>
                    <span class="wc-spots-badge">3 Playoff Spots</span>
                </div>
                <div class="col-header">
                    <span>#</span><span>Team</span>
                    <span>W</span><span>L</span><span>GB</span>
                    <span style="text-align:right;padding-right:2px;">Pct</span>
                </div>
                <div class="team-list"></div>`;

            const list = card.querySelector('.team-list');
            wcTeams.forEach((team, i) => {
                const rank   = parseInt(team.wildCardRank);
                const row    = document.createElement('div');
                row.className = 'team-row' + (rank === 4 ? ' playoff-line' : '');
                row.style.animationDelay = `${li * 60 + 40 + i * 35}ms`;
                const teamId = team.team.id;
                const abbr   = TEAM_ABBR[teamId] || team.team.name.split(' ').pop();
                const p      = parseFloat(team.winningPercentage) || 0;
                const pctStr = fmtPct(team.winningPercentage);
                const barPct = Math.max(0, Math.min(100, ((p - 0.35) / 0.35) * 100));
                const gbRaw  = team.wildCardGamesBack || team.gamesBack;
                const gbDisp = !gbRaw || gbRaw === '-' || gbRaw === '0.0' || gbRaw === 0 ? '—' : gbRaw;
                row.innerHTML = `
                    <span class="team-pos${rank <= 3 ? ' first-place' : ''}">${rank}</span>
                    <div class="team-identity">
                        <img src="https://www.mlbstatic.com/team-logos/${teamId}.svg"
                             alt="${team.team.name}" class="team-logo"
                             onerror="${ON_ERR}">
                        <span class="team-abbr">${abbr}</span>
                    </div>
                    <span class="team-stat">${team.wins}</span>
                    <span class="team-stat">${team.losses}</span>
                    <span class="team-stat muted">${gbDisp}</span>
                    <div class="pct-cell">
                        <span class="pct-value">${pctStr}</span>
                        <div class="pct-bar-track">
                            <div class="pct-bar-fill" style="width:${barPct}%"></div>
                        </div>
                    </div>`;
                list.appendChild(row);
            });
            fragment.appendChild(card);
        });
        return fragment;
    }

    // ── Main Standings Load ───────────────────────────────────────────────────

    async function loadStandings(league, season) {
        if (container.children.length > 0) {
            container.classList.add('slide-exit');
            await new Promise(r => setTimeout(r, 140));
            container.classList.remove('slide-exit');
        }

        // Reset to row layout for standings tabs
        container.style.flexDirection = 'row';
        container.style.flexWrap = 'nowrap';

        container.innerHTML = `
            <div class="loading-state">
                <div class="loading-spinner"></div>
                Loading ${season} ${league === 'WC' ? 'Wild Card' : league} Standings…
            </div>`;

        try {
            const data = await fetchStandings(season);
            container.innerHTML = '';

            if (league === 'WC') {
                container.appendChild(renderWildcard(data));
            } else {
                const divisionIds = league === 'AL' ? [201, 202, 200] : [204, 205, 203];
                divisionIds.forEach((divId, i) => {
                    const record = data.records.find(r => r.division?.id === divId);
                    if (record) container.appendChild(renderDivision(record, i * 55));
                });
            }
        } catch(err) {
            console.error('Standings load error:', err);
            container.innerHTML = `
                <div class="loading-state" style="color:#ef4444;flex-direction:column;gap:6px;">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <circle cx="12" cy="12" r="10"/>
                        <line x1="12" y1="8" x2="12" y2="12"/>
                        <line x1="12" y1="16" x2="12.01" y2="16"/>
                    </svg>
                    Could not load ${season} standings
                </div>`;
        } finally {
            requestAnimationFrame(resetPopupHeight);
        }
    }

    // ── Year Navigator ────────────────────────────────────────────────────────

    async function setSeason(year, direction) {
        activeSeason = year;

        const outX = direction > 0 ? '-6px' : '6px';
        const inX  = direction > 0 ? '6px'  : '-6px';
        yearDisplay.style.transition = 'opacity 0.12s ease, transform 0.12s ease';
        yearDisplay.style.opacity    = '0';
        yearDisplay.style.transform  = `translateX(${outX}) scale(0.85)`;

        await new Promise(r => setTimeout(r, 120));
        yearDisplay.textContent     = year;
        yearDisplay.style.transform = `translateX(${inX}) scale(0.85)`;
        yearDisplay.style.opacity   = '0';
        void yearDisplay.offsetWidth;
        yearDisplay.style.transform = 'translateX(0) scale(1)';
        yearDisplay.style.opacity   = '1';

        yearPrev.disabled = year <= MIN_YEAR;
        yearNext.disabled = year >= CURRENT_YEAR;

        if (year < CURRENT_YEAR) {
            historicalBanner.classList.add('visible');
            historicalBanner.innerHTML = `
                <svg viewBox="0 0 24 24"><polyline points="1 4 1 10 7 10"/><path d="M3.51 15a9 9 0 1 0 .49-3"/></svg>
                Viewing ${year} season`;
        } else {
            historicalBanner.classList.remove('visible');
        }

        if (activeLeague === 'BRACKET') {
            loadBracket(year);
        } else {
            loadStandings(activeLeague, year);
        }
    }

    yearPrev.addEventListener('click', () => {
        if (activeSeason > MIN_YEAR) setSeason(activeSeason - 1, -1);
    });
    yearNext.addEventListener('click', () => {
        if (activeSeason < CURRENT_YEAR) setSeason(activeSeason + 1, 1);
    });

    // ── Tab Wiring ────────────────────────────────────────────────────────────

    const allTabs = { AL: alBtn, NL: nlBtn, WC: wcBtn, BRACKET: bracketBtn };

    function setActiveTab(league) {
        activeLeague = league;
        Object.values(allTabs).forEach(b => b?.classList.remove('active'));
        allTabs[league]?.classList.add('active');

        if (league === 'BRACKET') {
            loadBracket(activeSeason);
        } else {
            loadStandings(league, activeSeason);
        }
    }

    alBtn.addEventListener('click',      () => setActiveTab('AL'));
    nlBtn.addEventListener('click',      () => setActiveTab('NL'));
    wcBtn.addEventListener('click',      () => setActiveTab('WC'));
    bracketBtn?.addEventListener('click', () => setActiveTab('BRACKET'));

    // ── Init ──────────────────────────────────────────────────────────────────

    yearPrev.disabled = false;
    yearNext.disabled = true;

    loadStandings('AL', CURRENT_YEAR);
});