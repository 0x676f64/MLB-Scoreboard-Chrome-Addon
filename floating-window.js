// ─────────────────────────────────────────────────────────────────────────────
// FloatingWindowManager — background portion (opens/closes the floating window)
// ─────────────────────────────────────────────────────────────────────────────

const CONFIG = { defaultWidth: 610, defaultHeight: 640, maxInnings: 9 };

class FloatingWindowManager {
    constructor() { this.windowId = null; }

    async open() {
        try {
            if (this.windowId) {
                await chrome.windows.update(this.windowId, { focused: true });
                return;
            }
            const [d] = await chrome.system.display.getInfo();
            const left = Math.round(d.bounds.left + (d.bounds.width  - CONFIG.defaultWidth)  / 2);
            const top  = Math.round(d.bounds.top  + (d.bounds.height - CONFIG.defaultHeight) / 2);

            const win = await chrome.windows.create({
                url: 'floating-window.html',
                type: 'popup',
                width: CONFIG.defaultWidth,
                height: CONFIG.defaultHeight,
                left, top,
                focused: true,
                alwaysOnTop: true,
            });
            this.windowId = win.id;
            chrome.windows.onRemoved.addListener(id => {
                if (id === this.windowId) this.windowId = null;
            });
        } catch (e) { console.error('FloatingWindow.open error:', e); }
    }

    async close() {
        if (!this.windowId) return;
        try { await chrome.windows.remove(this.windowId); } catch {}
        this.windowId = null;
    }

    toggle() { return this.windowId ? this.close() : this.open(); }
}

const floatingWindowManager = new FloatingWindowManager();

if (typeof chrome !== 'undefined' && chrome.runtime?.onMessage) {
    chrome.runtime.onMessage.addListener((req, _s, reply) => {
        const map = {
            openFloatingWindow:   () => floatingWindowManager.open(),
            closeFloatingWindow:  () => floatingWindowManager.close(),
            toggleFloatingWindow: () => floatingWindowManager.toggle(),
        };
        map[req.action]?.();
        reply({ success: !!map[req.action] });
        return true;
    });
}

// ─────────────────────────────────────────────────────────────────────────────
// Page script — runs inside floating-window.html
// ─────────────────────────────────────────────────────────────────────────────

document.addEventListener('DOMContentLoaded', async () => {

    // ── Static team abbreviations (no API calls needed) ───────────────────────
    const TEAM_ABBR = {
        108:'LAA', 109:'ARI', 110:'BAL', 111:'BOS', 112:'CHC',
        113:'CIN', 114:'CLE', 115:'COL', 116:'DET', 117:'HOU',
        118:'KC',  119:'LAD', 120:'WSH', 121:'NYM', 133:'OAK',
        134:'PIT', 135:'SD',  136:'SEA', 137:'SF',  138:'STL',
        139:'TB',  140:'TEX', 141:'TOR', 142:'MIN', 143:'PHI',
        144:'ATL', 145:'CWS', 146:'MIA', 147:'NYY', 158:'MIL',
    };

    const LIVE_CODES  = new Set(['I','IP','IS','IR','MC','MA']);
    const FINAL_CODES = new Set(['F','FR','FT','O','FO','C','CR']);

    const API = {
        schedule:  date   => `https://statsapi.mlb.com/api/v1/schedule?sportId=1&date=${date}&hydrate=team,linescore,probablePitcher`,
        gameFeed:  pk     => `https://statsapi.mlb.com/api/v1.1/game/${pk}/feed/live`,
        headshot:  id     => `https://img.mlbstatic.com/mlb-photos/image/upload/d_people:generic:headshot:67:current.png/w_80,q_auto:best/v1/people/${id}/headshot/67/current`,
        logo:      id     => `https://www.mlbstatic.com/team-logos/${id}.svg`,
    };

    // ── Elements ──────────────────────────────────────────────────────────────
    const container  = document.getElementById('games-container');
    const dateInput  = document.getElementById('date-input');
    const displayTxt = document.getElementById('date-display-text');
    const datePrev   = document.getElementById('date-prev');
    const dateNext   = document.getElementById('date-next');
    const todayBtn   = document.getElementById('today-btn');

    let refreshTimer = null;

    // ── Anti-flicker cache ────────────────────────────────────────────────────
    // Maps gamePk → { box (DOM node), sig (data fingerprint) }
    // On refresh we re-render only cards whose sig changed.
    const cardCache = new Map();

    // The signature changes when ANY visible piece of the rich card changes.
    // For live games that includes inning, half, bases, outs, current matchup.
    function gameSig(game, detailedData) {
        const d = detailedData;
        const baseStr = d ? `${d.basesStatus?.first?1:0}${d.basesStatus?.second?1:0}${d.basesStatus?.third?1:0}` : '';
        return [
            game.status.statusCode,
            game.teams.home.score ?? 0,
            game.teams.away.score ?? 0,
            d?.currentInning || '',
            d?.inningHalf || '',
            d?.outsCount ?? '',
            baseStr,
            d?.awayBatter?.id  || '',
            d?.homeBatter?.id  || '',
            d?.awayPitcher?.id || '',
            d?.homePitcher?.id || '',
            d?.winningPitcher?.id || '',
            d?.losingPitcher?.id  || '',
        ].join('|');
    }

    // ── Date helpers ──────────────────────────────────────────────────────────

    function baseballToday() {
        const now = new Date();
        if (now.getHours() < 9) now.setDate(now.getDate() - 1);
        return toYMD(now);
    }
    function toYMD(date) {
        return [
            date.getFullYear(),
            String(date.getMonth() + 1).padStart(2, '0'),
            String(date.getDate()).padStart(2, '0'),
        ].join('-');
    }
    function parseYMD(str) {
        const [y, m, d] = str.split('-').map(Number);
        return new Date(y, m - 1, d);
    }
    function fmtDisplay(ymd) {
        return parseYMD(ymd).toLocaleDateString('en-US', {
            weekday: 'short', month: 'short', day: 'numeric', year: 'numeric',
        });
    }
    function fmtTime(gameDate) {
        return new Date(gameDate).toLocaleTimeString([], {
            hour: 'numeric', minute: '2-digit', hour12: true,
        });
    }
    function setDateDisplay(ymd) {
        dateInput.value        = ymd;
        displayTxt.textContent = fmtDisplay(ymd);
    }
    function fmtPitcherName(name, short = false) {
        if (!name) return 'TBD';
        if (short) { const p = name.split(' '); return p[p.length - 1]; }
        return name;
    }
    function getRecord(team) {
        const r = team.leagueRecord;
        return r ? `${r.wins}-${r.losses}` : '';
    }
    function getFinalLabel(state, inn) {
        if (!state) return 'FINAL';
        if (state.includes('Suspended')) return 'SUSP';
        if (state.includes('Cancelled')) return 'CNCLD';
        if (state.includes('Postponed')) return 'PPD';
        if (inn && inn !== 9) return `F/${inn}`;
        return 'FINAL';
    }

    // ── Rich detailed game data (linescore, current matchup, decisions) ───────

    async function fetchDetailedGameData(gamePk) {
        try {
            const res  = await fetch(API.gameFeed(gamePk));
            const data = await res.json();
            if (!data?.liveData || !data?.gameData) return null;

            const { liveData, gameData } = data;
            const ls   = liveData.linescore || {};
            const code = gameData.status.statusCode;

            const state = {
                isLive:    LIVE_CODES.has(code),
                isFinal:   FINAL_CODES.has(code),
                isPreGame: !LIVE_CODES.has(code) && !FINAL_CODES.has(code),
                inningHalf:    ls.inningHalf === 'Top' ? 'TOP' : 'BOT',
                currentInning: ls.currentInning || '',
                basesStatus: {
                    first:  ls.offense?.first  || false,
                    second: ls.offense?.second || false,
                    third:  ls.offense?.third  || false,
                },
                outsCount:  ls.outs ?? 0,
                innings:    ls.innings || [],
                awayRuns:   ls.teams?.away?.runs   ?? 0,
                homeRuns:   ls.teams?.home?.runs   ?? 0,
                awayHits:   ls.teams?.away?.hits   ?? 0,
                homeHits:   ls.teams?.home?.hits   ?? 0,
                awayErrors: ls.teams?.away?.errors ?? 0,
                homeErrors: ls.teams?.home?.errors ?? 0,
                venue:         gameData.venue?.name || '',
                detailedState: gameData.status.detailedState,
            };

            // Probable pitchers (pre-game)
            if (gameData.probablePitchers) {
                const { away, home } = gameData.probablePitchers;
                if (away) state.awayPitcher = { id: away.id, name: away.fullName, record: `${away.wins||0}-${away.losses||0}`, era: away.era || '0.00' };
                if (home) state.homePitcher = { id: home.id, name: home.fullName, record: `${home.wins||0}-${home.losses||0}`, era: home.era || '0.00' };
            }

            // Current matchup (live)
            if (state.isLive && liveData.plays?.currentPlay?.matchup) {
                const { batter, pitcher } = liveData.plays.currentPlay.matchup;
                const bs = liveData.boxscore;
                const stat = (pid, team, type) => bs?.teams?.[team]?.players?.[`ID${pid}`]?.seasonStats?.[type] || {};

                if (ls.inningHalf === 'Top') {
                    if (batter)  { const s = stat(batter.id,'away','batting');   state.awayBatter  = { id: batter.id,  name: batter.fullName,  avg: s.avg||'—', ops: s.ops||'—', homeRuns: s.homeRuns ?? '—' }; }
                    if (pitcher) { const s = stat(pitcher.id,'home','pitching'); state.homePitcher = { id: pitcher.id, name: pitcher.fullName, era: s.era||'—', strikeOuts: s.strikeOuts ?? '—', inningsPitched: s.inningsPitched||'—' }; }
                } else {
                    if (pitcher) { const s = stat(pitcher.id,'away','pitching'); state.awayPitcher = { id: pitcher.id, name: pitcher.fullName, era: s.era||'—', strikeOuts: s.strikeOuts ?? '—', inningsPitched: s.inningsPitched||'—' }; }
                    if (batter)  { const s = stat(batter.id, 'home','batting');  state.homeBatter  = { id: batter.id,  name: batter.fullName,  avg: s.avg||'—', ops: s.ops||'—', homeRuns: s.homeRuns ?? '—' }; }
                }
            }

            // Decisions (final)
            if (state.isFinal && liveData.decisions) {
                const bs = liveData.boxscore;
                const decision = (d) => {
                    if (!d) return null;
                    const p = bs?.teams?.away?.players?.[`ID${d.id}`] || bs?.teams?.home?.players?.[`ID${d.id}`];
                    const s = p?.seasonStats?.pitching || {};
                    return {
                        id: d.id, name: d.fullName,
                        era: s.era || '0.00',
                        record: `${s.wins ?? 0}-${s.losses ?? 0}`,
                        saves:  s.saves ?? 0,
                    };
                };
                state.winningPitcher = decision(liveData.decisions.winner);
                state.losingPitcher  = decision(liveData.decisions.loser);
                state.savePitcher    = decision(liveData.decisions.save);
            }

            return state;
        } catch (e) {
            console.error('fetchDetailedGameData error:', e);
            return null;
        }
    }

    // ── SVG generators ────────────────────────────────────────────────────────

    function basesOutsSVG(bases = {}, outs = 0) {
        const navy = '#041e42';
        const red  = '#bf0d3d';
        const off  = '#eceff8';
        return `<svg width="68" height="48" viewBox="0 0 68 48" fill="none" style="display:block;">
            <circle cx="14" cy="42" r="4" fill="${outs>=1?red:off}" stroke="${red}" stroke-width="1.3"/>
            <circle cx="34" cy="42" r="4" fill="${outs>=2?red:off}" stroke="${red}" stroke-width="1.3"/>
            <circle cx="54" cy="42" r="4" fill="${outs>=3?red:off}" stroke="${red}" stroke-width="1.3"/>
            <rect x="29" y="4"  width="10" height="10" transform="rotate(45 34 9)"  fill="${bases.second?navy:off}" stroke="${navy}" stroke-width="1.3" opacity="0.85"/>
            <rect x="47" y="14" width="10" height="10" transform="rotate(45 52 19)" fill="${bases.first ?navy:off}" stroke="${navy}" stroke-width="1.3" opacity="0.85"/>
            <rect x="11" y="14" width="10" height="10" transform="rotate(45 16 19)" fill="${bases.third ?navy:off}" stroke="${navy}" stroke-width="1.3" opacity="0.85"/>
        </svg>`;
    }

    function lineScoreHTML(d, awayAbbr, homeAbbr) {
        const max = Math.min(d.innings.length, CONFIG.maxInnings);
        let h = `<div class="line-score-compact"><table><thead><tr><th></th>`;
        for (let i = 0; i < max; i++) h += `<th>${i+1}</th>`;
        h += `<th>R</th><th>H</th><th>E</th></tr></thead><tbody>`;

        [[awayAbbr,'away',d.awayRuns,d.awayHits,d.awayErrors],
         [homeAbbr,'home',d.homeRuns,d.homeHits,d.homeErrors]].forEach(([abbr, side, r, hits, e]) => {
            h += `<tr><td class="team-cell">${abbr}</td>`;
            for (let i = 0; i < max; i++) h += `<td>${d.innings[i]?.[side]?.runs ?? '—'}</td>`;
            h += `<td class="total">${r}</td><td>${hits}</td><td>${e}</td></tr>`;
        });

        h += `</tbody></table></div>`;
        return h;
    }

    function playerCardHTML(player, position, side = 'left') {
        if (!player) return '';
        const isPitcher = position === 'Pitcher';
        const stats = isPitcher
            ? [['ERA', player.era], ['K', player.strikeOuts], ['IP', player.inningsPitched]]
            : [['AVG', player.avg], ['HR', player.homeRuns], ['OPS', player.ops]];
        return `<div class="player-card ${side}">
            <img src="${API.headshot(player.id)}" alt="${player.name}" class="player-image" onerror="this.style.opacity='.3'">
            <div class="player-info">
                <div class="player-name">${fmtPitcherName(player.name, true)}</div>
                <div class="player-position">${position}</div>
                <div class="player-stats">${stats.map(([l,v]) => `<span>${l}: ${v}</span>`).join('')}</div>
            </div>
        </div>`;
    }

    function venueHTML(homeTeamId, venue) {
        if (!venue) return '';
        return `<div class="venue-info">
            <img src="${API.logo(homeTeamId)}" class="team-logo-venue" alt="">
            ${venue}
        </div>`;
    }

    // ── Layout builders ───────────────────────────────────────────────────────

    function buildPreGameLayout(game, d, awayAbbr, homeAbbr) {
        const awayLogo = API.logo(game.teams.away.team.id);
        const homeLogo = API.logo(game.teams.home.team.id);
        const awayRec  = getRecord(game.teams.away);
        const homeRec  = getRecord(game.teams.home);

        const pitcherSection = (p, side) => !p ? '' : `
            <div class="pitcher ${side}">
                ${p.id ? `<img src="${API.headshot(p.id)}" class="pitcher-headshot" alt="${p.name}" onerror="this.style.opacity='.3'">` : ''}
                <div class="pitcher-info">
                    <div class="pitcher-label">PROBABLE</div>
                    <div class="pitcher-name">${fmtPitcherName(p.name, true)}</div>
                    <div class="pitcher-stats">${p.record} · ${p.era} ERA</div>
                </div>
            </div>`;

        return `
            <div class="compact-game-box pre-game" data-pk="${game.gamePk}">
                <div class="compact-header">
                    <div class="team-info away">
                        <img src="${awayLogo}" class="team-logo-sm" alt="${awayAbbr}">
                        <span class="team-abbr">${awayAbbr}</span>
                        <span class="team-record">${awayRec}</span>
                    </div>
                    <div class="game-time">${fmtTime(game.gameDate)}</div>
                    <div class="team-info home">
                        <span class="team-record">${homeRec}</span>
                        <span class="team-abbr">${homeAbbr}</span>
                        <img src="${homeLogo}" class="team-logo-sm" alt="${homeAbbr}">
                    </div>
                </div>
                <div class="pitchers-row">
                    ${pitcherSection(d?.awayPitcher, 'away')}
                    <div class="vs-divider">VS</div>
                    ${pitcherSection(d?.homePitcher, 'home')}
                </div>
                ${venueHTML(game.teams.home.team.id, d?.venue || '')}
            </div>`;
    }

    function buildLiveLayout(game, d, awayAbbr, homeAbbr, awayScore, homeScore) {
        const awayLogo = API.logo(game.teams.away.team.id);
        const homeLogo = API.logo(game.teams.home.team.id);
        const awayRec  = getRecord(game.teams.away);
        const homeRec  = getRecord(game.teams.home);

        // Only show the CURRENT matchup — 2 players total, away always left, home always right.
        // TOP of inning  → away team batting, home team pitching
        // BOT of inning  → away team pitching, home team batting
        let matchup = '';
        if (d.inningHalf === 'TOP') {
            matchup = playerCardHTML(d.awayBatter,  'Batter',  'left')
                    + playerCardHTML(d.homePitcher, 'Pitcher', 'right');
        } else if (d.inningHalf === 'BOT') {
            matchup = playerCardHTML(d.awayPitcher, 'Pitcher', 'left')
                    + playerCardHTML(d.homeBatter,  'Batter',  'right');
        }

        return `
            <div class="compact-game-box live-game" data-pk="${game.gamePk}">
                <div class="live-header">
                    <div class="team-score-row away">
                        <div class="team-logo-stack">
                            <img src="${awayLogo}" class="team-logo-md" alt="${awayAbbr}">
                            <span class="team-record-sm">${awayRec}</span>
                        </div>
                        <span class="team-abbr-large">${awayAbbr}</span>
                        <span class="score-large">${awayScore}</span>
                    </div>
                    <div class="inning-indicator">
                        <div class="inning-text"><span class="live-ring"></span>${d.inningHalf} ${d.currentInning}</div>
                        ${basesOutsSVG(d.basesStatus, d.outsCount)}
                    </div>
                    <div class="team-score-row home">
                        <div class="team-logo-stack">
                            <img src="${homeLogo}" class="team-logo-md" alt="${homeAbbr}">
                            <span class="team-record-sm">${homeRec}</span>
                        </div>
                        <span class="team-abbr-large">${homeAbbr}</span>
                        <span class="score-large">${homeScore}</span>
                    </div>
                </div>
                ${lineScoreHTML(d, awayAbbr, homeAbbr)}
                ${matchup ? `<div class="player-matchup-container">${matchup}</div>` : ''}
                ${venueHTML(game.teams.home.team.id, d.venue)}
            </div>`;
    }

    function buildFinalLayout(game, d, awayAbbr, homeAbbr, awayScore, homeScore) {
        const awayLogo = API.logo(game.teams.away.team.id);
        const homeLogo = API.logo(game.teams.home.team.id);
        const awayRec  = getRecord(game.teams.away);
        const homeRec  = getRecord(game.teams.home);
        const finalLbl = getFinalLabel(d.detailedState, d.innings?.length);

        const awayWins = awayScore > homeScore;
        const homeWins = homeScore > awayScore;

        const decisionSection = (p, lbl) => !p ? '' : `
            <div class="pitcher-decision">
                ${p.id ? `<img src="${API.headshot(p.id)}" class="pitcher-headshot-small" alt="${p.name}" onerror="this.style.opacity='.3'">` : ''}
                <div class="pitcher-decision-info">
                    <span class="pitcher-result">${lbl}: ${fmtPitcherName(p.name)}</span>
                    <span class="pitcher-stats">${lbl === 'SV' ? `${p.saves} SV` : p.record} · ${p.era} ERA</span>
                </div>
            </div>`;

        const decisions = [
            decisionSection(d.winningPitcher, 'W'),
            decisionSection(d.losingPitcher,  'L'),
            decisionSection(d.savePitcher,    'SV'),
        ].filter(Boolean).join('');

        return `
            <div class="compact-game-box final-game" data-pk="${game.gamePk}">
                <div class="final-header">
                    <div class="team-final-row away ${awayWins ? 'winner' : awayScore !== homeScore ? 'loser' : ''}">
                        <img src="${awayLogo}" class="team-logo-sm" alt="${awayAbbr}">
                        <span class="team-abbr">${awayAbbr}</span>
                        <span class="team-record">${awayRec}</span>
                        <span class="score-md">${awayScore}</span>
                    </div>
                    <div class="final-label">${finalLbl}</div>
                    <div class="team-final-row home ${homeWins ? 'winner' : awayScore !== homeScore ? 'loser' : ''}">
                        <span class="score-md">${homeScore}</span>
                        <span class="team-record">${homeRec}</span>
                        <span class="team-abbr">${homeAbbr}</span>
                        <img src="${homeLogo}" class="team-logo-sm" alt="${homeAbbr}">
                    </div>
                </div>
                ${lineScoreHTML(d, awayAbbr, homeAbbr)}
                ${decisions ? `<div class="pitchers-final">${decisions}</div>` : ''}
                ${venueHTML(game.teams.home.team.id, d.venue)}
            </div>`;
    }

    // ── Build a card by picking the right layout ──────────────────────────────

    function buildCard(game, detailedData) {
        const awayId    = game.teams.away.team.id;
        const homeId    = game.teams.home.team.id;
        const awayAbbr  = TEAM_ABBR[awayId] || game.teams.away.team.abbreviation || '?';
        const homeAbbr  = TEAM_ABBR[homeId] || game.teams.home.team.abbreviation || '?';
        const awayScore = game.teams.away.score ?? 0;
        const homeScore = game.teams.home.score ?? 0;

        const d = detailedData;
        let html;
        if (!d || d.isPreGame)  html = buildPreGameLayout(game, d, awayAbbr, homeAbbr);
        else if (d.isLive)      html = buildLiveLayout(game, d, awayAbbr, homeAbbr, awayScore, homeScore);
        else if (d.isFinal)     html = buildFinalLayout(game, d, awayAbbr, homeAbbr, awayScore, homeScore);
        else                    html = buildPreGameLayout(game, d, awayAbbr, homeAbbr);

        const tmp = document.createElement('div');
        tmp.innerHTML = html.trim();
        const box = tmp.firstElementChild;

        box.addEventListener('click', () => {
            window.location.href = `floating-pop.html?gamePk=${game.gamePk}`;
        });

        const code = game.status.statusCode;
        return {
            box,
            isLive:  LIVE_CODES.has(code),
            isFinal: FINAL_CODES.has(code),
            sortKey: new Date(game.gameDate).getTime(),
        };
    }

    // ── Fetch and render ──────────────────────────────────────────────────────

    async function fetchGameData(dateStr, isRefresh = false) {
        clearInterval(refreshTimer);

        if (!isRefresh) {
            cardCache.clear();
            container.innerHTML = `
                <div class="state-msg">
                    <div class="state-spinner"></div>
                    Loading games…
                </div>`;
        }

        try {
            const res   = await fetch(API.schedule(dateStr));
            const data  = await res.json();
            const games = data.dates?.[0]?.games || [];

            if (!isRefresh && !games.length) {
                container.innerHTML = `<div class="state-msg">No games scheduled for this date.</div>`;
                return;
            }

            // Fetch detailed data for ALL games in parallel — needed for the rich layout
            const detailMap = {};
            await Promise.all(games.map(async g => {
                detailMap[g.gamePk] = await fetchDetailedGameData(g.gamePk);
            }));

            if (!isRefresh) {
                // ── Initial render: build all cards from scratch ──────────────
                container.innerHTML = '';

                const built = games.map(g => {
                    const card = buildCard(g, detailMap[g.gamePk]);
                    return { ...card, game: g };
                });

                built.sort((a, b) => {
                    if (a.isLive  && !b.isLive)  return -1;
                    if (!a.isLive &&  b.isLive)  return  1;
                    if (!a.isFinal && b.isFinal) return -1;
                    if (a.isFinal && !b.isFinal) return  1;
                    return a.sortKey - b.sortKey;
                });

                cardCache.clear();
                built.forEach(item => {
                    container.appendChild(item.box);
                    cardCache.set(item.game.gamePk, {
                        box: item.box,
                        sig: gameSig(item.game, detailMap[item.game.gamePk]),
                    });
                });

            } else {
                // ── Silent refresh: only rebuild cards whose data changed ────
                // Rich layouts are too complex to patch in place — but we can
                // still skip every unchanged card, which is the bulk of them.
                games.forEach(game => {
                    const newSig = gameSig(game, detailMap[game.gamePk]);
                    const cached = cardCache.get(game.gamePk);

                    if (!cached) {
                        // New game appeared mid-session
                        const card = buildCard(game, detailMap[game.gamePk]);
                        container.appendChild(card.box);
                        cardCache.set(game.gamePk, { box: card.box, sig: newSig });
                    } else if (cached.sig !== newSig) {
                        // Something visible changed — rebuild this card only
                        const card = buildCard(game, detailMap[game.gamePk]);
                        cached.box.replaceWith(card.box);
                        cached.box = card.box;
                        cached.sig = newSig;
                    }
                    // identical sig → skip entirely (most cards on most refreshes)
                });
            }

            // Auto-refresh for today only
            if (dateStr === baseballToday()) {
                const hasLive = games.some(g => LIVE_CODES.has(g.status.statusCode) || g.status.detailedState === 'Warmup');
                refreshTimer = setInterval(
                    () => fetchGameData(dateStr, true),
                    hasLive ? 30_000 : 60_000
                );
            }

        } catch (err) {
            console.error('fetchGameData error:', err);
            if (!isRefresh)
                container.innerHTML = `<div class="state-msg" style="color:#ef4444">Failed to load games.</div>`;
            // refresh failure: leave existing cards alone
        }
    }

    // ── Date navigation ───────────────────────────────────────────────────────

    function stepDate(days) {
        const d = parseYMD(dateInput.value || baseballToday());
        d.setDate(d.getDate() + days);
        const ymd = toYMD(d);
        setDateDisplay(ymd);
        fetchGameData(ymd, false);
    }

    datePrev?.addEventListener('click', () => stepDate(-1));
    dateNext?.addEventListener('click', () => stepDate(+1));

    dateInput?.addEventListener('change', () => {
        if (dateInput.value) { setDateDisplay(dateInput.value); fetchGameData(dateInput.value, false); }
    });

    todayBtn?.addEventListener('click', () => {
        const t = baseballToday();
        setDateDisplay(t);
        fetchGameData(t, false);
    });

    // ── Init ─────────────────────────────────────────────────────────────────

    const today = baseballToday();
    setDateDisplay(today);
    fetchGameData(today, false);

    setInterval(() => {
        const now = new Date();
        if (now.getHours() === 9 && now.getMinutes() === 0) {
            const nd = baseballToday();
            if (dateInput.value !== nd) { setDateDisplay(nd); fetchGameData(nd, false); }
        }
    }, 60_000);

});