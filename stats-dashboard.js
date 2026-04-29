document.addEventListener('DOMContentLoaded', async () => {

    // ── URL params ────────────────────────────────────────────────────────────

    const params     = new URLSearchParams(window.location.search);
    const teamId     = parseInt(params.get('teamId'));
    const teamName   = params.get('teamName') || '';

    // ── Team metadata ─────────────────────────────────────────────────────────

    const TEAM_META = {
        108: { city: 'Los Angeles',   name: 'Angels',        abbr: 'LAA', league: 103 },
        109: { city: 'Arizona',       name: 'Diamondbacks',  abbr: 'ARI', league: 104 },
        110: { city: 'Baltimore',     name: 'Orioles',       abbr: 'BAL', league: 103 },
        111: { city: 'Boston',        name: 'Red Sox',       abbr: 'BOS', league: 103 },
        112: { city: 'Chicago',       name: 'Cubs',          abbr: 'CHC', league: 104 },
        113: { city: 'Cincinnati',    name: 'Reds',          abbr: 'CIN', league: 104 },
        114: { city: 'Cleveland',     name: 'Guardians',     abbr: 'CLE', league: 103 },
        115: { city: 'Colorado',      name: 'Rockies',       abbr: 'COL', league: 104 },
        116: { city: 'Detroit',       name: 'Tigers',        abbr: 'DET', league: 103 },
        117: { city: 'Houston',       name: 'Astros',        abbr: 'HOU', league: 103 },
        118: { city: 'Kansas City',   name: 'Royals',        abbr: 'KC',  league: 103 },
        119: { city: 'Los Angeles',   name: 'Dodgers',       abbr: 'LAD', league: 104 },
        120: { city: 'Washington',    name: 'Nationals',     abbr: 'WSH', league: 104 },
        121: { city: 'New York',      name: 'Mets',          abbr: 'NYM', league: 104 },
        133: { city: 'Oakland',       name: 'Athletics',     abbr: 'ATH', league: 103 },
        134: { city: 'Pittsburgh',    name: 'Pirates',       abbr: 'PIT', league: 104 },
        135: { city: 'San Diego',     name: 'Padres',        abbr: 'SD',  league: 104 },
        136: { city: 'Seattle',       name: 'Mariners',      abbr: 'SEA', league: 103 },
        137: { city: 'San Francisco', name: 'Giants',        abbr: 'SF',  league: 104 },
        138: { city: 'St. Louis',     name: 'Cardinals',     abbr: 'STL', league: 104 },
        139: { city: 'Tampa Bay',     name: 'Rays',          abbr: 'TB',  league: 103 },
        140: { city: 'Texas',         name: 'Rangers',       abbr: 'TEX', league: 103 },
        141: { city: 'Toronto',       name: 'Blue Jays',     abbr: 'TOR', league: 103 },
        142: { city: 'Minnesota',     name: 'Twins',         abbr: 'MIN', league: 103 },
        143: { city: 'Philadelphia',  name: 'Phillies',      abbr: 'PHI', league: 104 },
        144: { city: 'Atlanta',       name: 'Braves',        abbr: 'ATL', league: 104 },
        145: { city: 'Chicago',       name: 'White Sox',     abbr: 'CWS', league: 103 },
        146: { city: 'Miami',         name: 'Marlins',       abbr: 'MIA', league: 104 },
        147: { city: 'New York',      name: 'Yankees',       abbr: 'NYY', league: 103 },
        158: { city: 'Milwaukee',     name: 'Brewers',       abbr: 'MIL', league: 104 },
    };

    const meta = TEAM_META[teamId];

    if (!teamId || !meta) {
        document.getElementById('stats-grid').innerHTML =
            '<div style="padding:40px;text-align:center;color:#64748b;font-family:Rubik,sans-serif;">Invalid team. <a href="stats.html">Go back</a></div>';
        return;
    }

    // ── Populate static header ────────────────────────────────────────────────

    document.title = `${meta.name} Stats — XLabs`;
    document.getElementById('team-logo-large').src =
        `https://www.mlbstatic.com/team-logos/team-cap-on-dark/${teamId}.svg`;
    document.getElementById('team-city-el').textContent = meta.city.toUpperCase();
    document.getElementById('team-name-el').textContent = meta.name;

    // ── Stat configuration ────────────────────────────────────────────────────

    const BATTING_STATS = [
        { key: 'homeRuns',      label: 'Home Runs',       goodHigh: true  },
        { key: 'avg',           label: 'Batting Avg',      goodHigh: true  },
        { key: 'ops',           label: 'OPS',              goodHigh: true  },
        { key: 'runs',          label: 'Runs Scored',      goodHigh: true  },
        { key: 'hits',          label: 'Hits',             goodHigh: true  },
        { key: 'rbi',           label: 'RBI',              goodHigh: true  },
        { key: 'baseOnBalls',   label: 'Walks',            goodHigh: true  },
        { key: 'xbh',           label: 'Extra Base Hits',  goodHigh: true  },
        { key: 'stolenBases',   label: 'Stolen Bases',     goodHigh: true  },
        { key: 'totalBases',    label: 'Total Bases',      goodHigh: true  },
        { key: 'strikeOuts',    label: 'Strikeouts',       goodHigh: false },
        { key: 'leftOnBase',    label: 'Left On Base',     goodHigh: false },
    ];

    const PITCHING_STATS = [
        { key: 'era',               label: 'ERA',             goodHigh: false },
        { key: 'whip',              label: 'WHIP',            goodHigh: false },
        { key: 'strikeOuts',        label: 'Strikeouts',      goodHigh: true  },
        { key: 'strikeoutsPer9Inn', label: 'K/9',             goodHigh: true  },
        { key: 'avg',               label: 'Opp. Avg',        goodHigh: false },
        { key: 'ops',               label: 'Opp. OPS',        goodHigh: false },
        { key: 'hits',              label: 'Hits Allowed',     goodHigh: false },
        { key: 'homeRuns',          label: 'HR Allowed',       goodHigh: false },
        { key: 'runs',              label: 'Runs Allowed',     goodHigh: false },
        { key: 'groundIntoDoublePlay', label: 'GIDP Induced', goodHigh: true  },
        { key: 'holds',             label: 'Holds',            goodHigh: true  },
        { key: 'stolenBases',       label: 'SB Allowed',       goodHigh: false },
    ];

    // Continuous blue (0) → gray (50) → red (100).
    // 0 = pure blue, 50 = neutral gray, 100 = pure red — no hard tier breaks.
    function pctColor(pct) {
        const v = Math.max(0, Math.min(100, pct)) / 100;
        let r, g, b;
        if (v <= 0.5) {
            // Blue → Gray
            const f = v * 2;
            r = Math.round(40  + 88  * f);   // 40  → 128
            g = Math.round(80  + 48  * f);   // 80  → 128
            b = Math.round(220 - 92  * f);   // 220 → 128
        } else {
            // Gray → Red
            const f = (v - 0.5) * 2;
            r = Math.round(128 + 127 * f);   // 128 → 255
            g = Math.round(128 - 128 * f);   // 128 → 0
            b = Math.round(128 - 128 * f);   // 128 → 0
        }
        return `rgb(${r},${g},${b})`;
    }

    function ordinal(n) {
        const s = ['th','st','nd','rd'];
        const v = n % 100;
        return n + (s[(v - 20) % 10] || s[v] || s[0]);
    }

    // Number formatting — baseball convention:
    //   AVG, OPS  → leading zero dropped  (.300, .825) — even when OPS > 1 the rule only strips when value < 1
    //   ERA, WHIP → leading zero kept     (3.45, 0.975) — ERA is rate per 9; WHIP often < 1 for elite pitchers
    //   K/9       → one decimal, kept     (9.8)
    //   Everything else → whole number
    function fmtValue(key, val) {
        const n = parseFloat(val) || 0;

        if (key === 'avg') {
            const s = n.toFixed(3);
            return s.startsWith('0.') ? s.slice(1) : s;   // .300 not 0.300
        }
        if (key === 'ops') {
            const s = n.toFixed(3);
            return s.startsWith('0.') ? s.slice(1) : s;   // .825 not 0.825; 1.022 stays 1.022
        }
        if (key === 'era')               return n.toFixed(2);   // 3.45 or 0.98 — keep zero
        if (key === 'whip')              return n.toFixed(3);   // 0.975 — keep zero
        if (key === 'strikeoutsPer9Inn') return n.toFixed(1);   // 9.8
        return String(Math.round(n));
    }

    // ── Data fetching ─────────────────────────────────────────────────────────

    async function fetchAll() {
        const [hitRes, pitRes, standRes] = await Promise.all([
            fetch(`https://statsapi.mlb.com/api/v1/teams/stats?season=2026&group=hitting&stats=season&sportId=1`),
            fetch(`https://statsapi.mlb.com/api/v1/teams/stats?season=2026&group=pitching&stats=season&sportId=1`),
            fetch(`https://statsapi.mlb.com/api/v1/standings?leagueId=103,104&season=2026`),
        ]);
        const [hitData, pitData, standData] = await Promise.all([
            hitRes.json(), pitRes.json(), standRes.json()
        ]);

        // Compute XBH for all splits
        hitData.stats[0].splits.forEach(s => {
            s.stat.xbh = (parseInt(s.stat.doubles)||0)
                       + (parseInt(s.stat.triples)||0)
                       + (parseInt(s.stat.homeRuns)||0);
        });

        return { hitData, pitData, standData };
    }

    // ── Process stats into { value, percentile, rank } per stat key ──────────

    function processGroup(allData, statConfig) {
        const splits = allData.stats[0].splits;
        const total  = splits.length;
        const teamSplit = splits.find(s => s.team.id === teamId);
        if (!teamSplit) return null;

        const result = {};

        statConfig.forEach(({ key, label, goodHigh }) => {
            const vals = splits.map(s => parseFloat(s.stat[key]) || 0);
            const teamVal = parseFloat(teamSplit.stat[key]) || 0;

            // Rank in MLB (1 = best for goodHigh, 1 = best for goodLow)
            const sorted = [...vals].sort((a, b) => goodHigh ? b - a : a - b);
            const rank = sorted.indexOf(teamVal) + 1;

            // Percentile
            const rawPct = vals.filter(v => v < teamVal).length / (total - 1);
            const pct = Math.round(goodHigh ? rawPct * 100 : (1 - rawPct) * 100);

            result[key] = {
                label,
                value: fmtValue(key, teamVal),
                percentile: Math.max(1, Math.min(99, pct)),
                rank,
                total,
            };
        });

        return result;
    }

    // ── Render team record from standings ─────────────────────────────────────

    function renderRecord(standData) {
        const recordEl = document.getElementById('team-record-el');
        for (const rec of standData.records) {
            const found = rec.teamRecords.find(t => t.team.id === teamId);
            if (found) {
                const w   = found.wins;
                const l   = found.losses;
                const pct = parseFloat(found.winningPercentage).toFixed(3);
                const div = rec.division?.nameShort || '';
                const pos = found.divisionRank || '?';
                recordEl.innerHTML =
                    `<span class="record-wins">${w}-${l}</span>` +
                    ` <span style="color:rgba(255,255,255,0.35)">·</span> ` +
                    `${pct}` +
                    `<span class="record-rank">${ordinal(parseInt(pos))} ${div}</span>`;
                return;
            }
        }
        recordEl.textContent = '— Record unavailable';
    }

    // ── Render stat cards ─────────────────────────────────────────────────────

    function renderCards(statsObj) {
        const grid = document.getElementById('stats-grid');
        grid.innerHTML = '';
        grid.classList.add('tab-fade-in');

        const cards = Object.values(statsObj).map(({ label, value, percentile, rank, total }) => {
            const color = pctColor(percentile);
            return `
                <div class="stat-card" style="--card-color:${color}">
                    <div class="sc-label">${label}</div>
                    <div class="sc-value" style="color:${color}">${value}</div>
                    <div class="sc-bar-wrap">
                        <div class="sc-track">
                            <div class="sc-fill" data-w="${percentile}"
                                 style="background:${color}; width:0%">
                                <div class="sc-circle" style="background:${color}">${percentile}</div>
                            </div>
                        </div>
                    </div>
                    <div class="sc-rank">${rank} of ${total} MLB</div>
                </div>`;
        }).join('');

        grid.innerHTML = cards;

        // Double rAF: first commit paints width:0%; second triggers the transition
        requestAnimationFrame(() => {
            requestAnimationFrame(() => {
                grid.querySelectorAll('.sc-fill').forEach(el => {
                    el.style.width = el.dataset.w + '%';
                });
            });
        });
    }

    // ── Tab wiring ────────────────────────────────────────────────────────────

    let hittingStats  = null;
    let pitchingStats = null;
    let activeTab     = 'batting';

    const tabBatting  = document.getElementById('tab-batting');
    const tabPitching = document.getElementById('tab-pitching');

    function switchTab(tab) {
        if (tab === activeTab) return;
        activeTab = tab;

        tabBatting.classList.toggle('active', tab === 'batting');
        tabPitching.classList.toggle('active', tab === 'pitching');

        const stats = tab === 'batting' ? hittingStats : pitchingStats;
        if (stats) renderCards(stats);
    }

    tabBatting.addEventListener('click',  () => switchTab('batting'));
    tabPitching.addEventListener('click', () => switchTab('pitching'));

    // ── Init ──────────────────────────────────────────────────────────────────

    try {
        const { hitData, pitData, standData } = await fetchAll();

        renderRecord(standData);

        hittingStats  = processGroup(hitData,  BATTING_STATS);
        pitchingStats = processGroup(pitData,  PITCHING_STATS);

        if (!hittingStats) {
            throw new Error('Team not found in stats data');
        }

        renderCards(hittingStats);

    } catch (err) {
        console.error('Stats dashboard error:', err);
        document.getElementById('stats-grid').innerHTML = `
            <div style="grid-column:1/-1;display:flex;flex-direction:column;
                        align-items:center;gap:8px;padding:48px 24px;
                        color:#ef4444;font-family:Rubik,sans-serif;font-size:12px;">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none"
                     stroke="currentColor" stroke-width="2">
                    <circle cx="12" cy="12" r="10"/>
                    <line x1="12" y1="8" x2="12" y2="12"/>
                    <line x1="12" y1="16" x2="12.01" y2="16"/>
                </svg>
                Could not load stats. Please try again.
            </div>`;
    }

    // Reset popup height after content loads
    requestAnimationFrame(() => {
        document.documentElement.style.height = 'auto';
        document.body.style.height = 'auto';
    });
});