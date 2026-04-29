class MLBLeaderboard {
    constructor() {
        this.currentCategory = 'hitting';
        this.currentYear     = '2026';
        this.currentTeam     = '';
        this.currentLeague   = '';
        this.allData         = [];
        this.currentPage     = 0;
        this.itemsPerPage    = 50;
        this.sortColumn      = null;
        this.sortDirection   = 'desc';

        this.leagueTeams = {
            AL: [108,110,111,114,116,117,118,133,136,139,140,141,142,145,147],
            NL: [109,112,113,115,119,120,121,134,135,137,138,143,144,146,158],
        };

        this.statConfigs = {
            hitting: {
                defaultSort: 'avg',
                defaultDir:  'desc',
                columns: [
                    { key: 'gamesPlayed',      label: 'G',     format: 'number' },
                    { key: 'plateAppearances', label: 'PA',    format: 'number' },
                    { key: 'atBats',           label: 'AB',    format: 'number' },
                    { key: 'avg',              label: 'AVG',   format: 'rate3' },
                    { key: 'homeRuns',         label: 'HR',    format: 'number' },
                    { key: 'rbi',              label: 'RBI',   format: 'number' },
                    { key: 'runs',             label: 'R',     format: 'number' },
                    { key: 'hits',             label: 'H',     format: 'number' },
                    { key: 'obp',              label: 'OBP',   format: 'rate3' },
                    { key: 'slg',              label: 'SLG',   format: 'rate3' },
                    { key: 'ops',              label: 'OPS',   format: 'rate3' },
                    { key: 'baseOnBalls',      label: 'BB',    format: 'number' },
                    { key: 'doubles',          label: '2B',    format: 'number' },
                    { key: 'triples',          label: '3B',    format: 'number' },
                    { key: 'stolenBases',      label: 'SB',    format: 'number' },
                    { key: 'caughtStealing',   label: 'CS',    format: 'number' },
                    { key: 'strikeOuts',       label: 'K',     format: 'number' },
                    { key: 'totalBases',       label: 'TB',    format: 'number' },
                    { key: 'babip',            label: 'BABIP', format: 'rate3' },
                    { key: 'hitByPitch',       label: 'HBP',   format: 'number' },
                    { key: 'sacFlies',         label: 'SF',    format: 'number' },
                    { key: 'intentionalWalks', label: 'IBB',   format: 'number' },
                ],
            },
            pitching: {
                defaultSort: 'strikeOuts',
                defaultDir:  'desc',
                columns: [
                    { key: 'era',               label: 'ERA',  format: 'era',     reverse: true },
                    { key: 'wins',              label: 'W',    format: 'number' },
                    { key: 'losses',            label: 'L',    format: 'number',  reverse: true },
                    { key: 'gamesPlayed',       label: 'G',    format: 'number' },
                    { key: 'gamesStarted',      label: 'GS',   format: 'number' },
                    { key: 'strikeOuts',        label: 'K',    format: 'number' },
                    { key: 'inningsPitched',    label: 'IP',   format: 'innings' },
                    { key: 'whip',              label: 'WHIP', format: 'whip',    reverse: true },
                    { key: 'hits',              label: 'H',    format: 'number',  reverse: true },
                    { key: 'runs',              label: 'R',    format: 'number',  reverse: true },
                    { key: 'earnedRuns',        label: 'ER',   format: 'number',  reverse: true },
                    { key: 'homeRuns',          label: 'HR',   format: 'number',  reverse: true },
                    { key: 'baseOnBalls',       label: 'BB',   format: 'number',  reverse: true },
                    { key: 'hitBatsmen',        label: 'HBP',  format: 'number',  reverse: true },
                    { key: 'wildPitches',       label: 'WP',   format: 'number',  reverse: true },
                    { key: 'avg',               label: 'OAvg', format: 'rate3',   reverse: true },
                    { key: 'strikeoutsPer9Inn', label: 'K/9',  format: 'decimal1' },
                    { key: 'walksPer9Inn',      label: 'BB/9', format: 'decimal1', reverse: true },
                ],
            },
        };

        this.init();
    }

    init() {
        this.bindEvents();
        this.loadTeams();
        this.loadLeaderboard();
    }

    // ── Number formatting ──────────────────────────────────────────────────────

    fmt(value, format) {
        if (value === undefined || value === null || value === '') return '—';
        const n = parseFloat(value);
        if (isNaN(n)) return '—';

        switch (format) {
            case 'rate3': {
                // AVG, OBP, SLG, OPS, BABIP, OAvg — strip leading zero
                const s = n.toFixed(3);
                if (n >= 1)  return s;           // 1.022 stays 1.022
                if (n <= 0)  return '.000';
                return s.startsWith('0.') ? s.slice(1) : s;
            }
            case 'era': {
                // ERA — keep leading zero (0.98, 2.45, 10.80)
                return n.toFixed(2);
            }
            case 'whip': {
                // WHIP — keep leading zero (0.975, 1.12)
                return n.toFixed(2);
            }
            case 'decimal1': {
                return n.toFixed(1);
            }
            case 'innings': {
                const whole = Math.floor(n);
                const outs  = Math.round((n - whole) * 3);
                return outs === 0 ? String(whole) : `${whole}.${outs}`;
            }
            case 'number':
            default:
                return String(Math.round(n));
        }
    }

    // ── Event wiring ──────────────────────────────────────────────────────────

    bindEvents() {
        // Tab buttons (Batting / Pitching)
        document.querySelectorAll('.lb-tab').forEach(btn => {
            btn.addEventListener('click', () => {
                document.querySelectorAll('.lb-tab').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                this.currentCategory = btn.dataset.category;
                this.currentPage = 0;
                this.loadLeaderboard();
            });
        });

        document.getElementById('yearSelect').addEventListener('change', e => {
            this.currentYear = e.target.value;
            this.currentPage = 0;
            this.loadLeaderboard();
        });

        document.getElementById('teamSelect').addEventListener('change', e => {
            this.currentTeam = e.target.value;
            this.currentPage = 0;
            this.loadLeaderboard();
        });

        document.getElementById('leagueSelect').addEventListener('change', e => {
            this.currentLeague = e.target.value;
            this.currentTeam = '';
            document.getElementById('teamSelect').value = '';
            this.currentPage = 0;
            this.loadLeaderboard();
        });

        document.getElementById('prevBtn').addEventListener('click', () => {
            if (this.currentPage > 0) { this.currentPage--; this.renderPage(); }
        });

        document.getElementById('nextBtn').addEventListener('click', () => {
            const max = Math.ceil(this.allData.length / this.itemsPerPage) - 1;
            if (this.currentPage < max) { this.currentPage++; this.renderPage(); }
        });
    }

    // ── Data loading ──────────────────────────────────────────────────────────

    async loadTeams() {
        try {
            const res  = await fetch('https://statsapi.mlb.com/api/v1/teams?sportId=1');
            const data = await res.json();
            const sel  = document.getElementById('teamSelect');
            sel.innerHTML = '<option value="">All Teams</option>';
            (data.teams || [])
                .sort((a, b) => a.name.localeCompare(b.name))
                .forEach(t => {
                    const opt = document.createElement('option');
                    opt.value = t.id;
                    opt.textContent = t.name;
                    sel.appendChild(opt);
                });
        } catch (e) {
            console.warn('Team list load failed:', e);
        }
    }

    async loadLeaderboard() {
        this.showLoading();

        try {
            const teamParam = this.currentTeam ? `&teamId=${this.currentTeam}` : '';
            const group     = this.currentCategory === 'hitting' ? 'hitting' : 'pitching';
            const url       = `https://statsapi.mlb.com/api/v1/stats?stats=season&season=${this.currentYear}&sportId=1&group=${group}&limit=500${teamParam}`;

            const res  = await fetch(url);
            if (!res.ok) throw new Error(`HTTP ${res.status}`);
            const data = await res.json();

            let players = (data.stats?.[0]?.splits || []).map(s => ({
                person: s.player,
                team:   s.team,
                stats:  s.stat,
            }));

            // League filter
            if (this.currentLeague && this.leagueTeams[this.currentLeague]) {
                const ids = this.leagueTeams[this.currentLeague];
                players = players.filter(p => ids.includes(p.team?.id));
            }

            // Apply default sort
            const cfg = this.statConfigs[this.currentCategory];
            this.sortColumn    = cfg.defaultSort;
            this.sortDirection = cfg.defaultDir;
            this.applySort(players);

            this.allData     = players;
            this.currentPage = 0;
            this.renderPage();

        } catch (err) {
            console.error('Leaderboard error:', err);
            this.showError();
        }
    }

    // ── Sort ─────────────────────────────────────────────────────────────────

    applySort(arr) {
        const col = this.sortColumn;
        const dir = this.sortDirection;
        arr.sort((a, b) => {
            const av = parseFloat(a.stats[col]) || 0;
            const bv = parseFloat(b.stats[col]) || 0;
            return dir === 'asc' ? av - bv : bv - av;
        });
    }

    sortBy(colKey, reverse = false) {
        if (this.sortColumn === colKey) {
            this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc';
        } else {
            this.sortColumn    = colKey;
            this.sortDirection = reverse ? 'asc' : 'desc';
        }
        this.applySort(this.allData);
        this.currentPage = 0;
        this.renderPage();
    }

    // ── Rendering ─────────────────────────────────────────────────────────────

    renderPage() {
        if (!this.allData.length) { this.showError('No data for the selected filters.'); return; }

        const cfg    = this.statConfigs[this.currentCategory];
        const start  = this.currentPage * this.itemsPerPage;
        const slice  = this.allData.slice(start, start + this.itemsPerPage);

        this.renderHeader(cfg);
        this.renderBody(slice, start, cfg);
        this.updatePagination();
        this.updateSortIndicators();

        document.getElementById('loading').style.display     = 'none';
        document.getElementById('error').style.display       = 'none';
        document.getElementById('leaderboardTable').style.display = '';
    }

    renderHeader(cfg) {
        const hdr = document.getElementById('tableHeader');
        const tr  = document.createElement('tr');

        tr.innerHTML = `
            <th class="col-rank">#</th>
            <th class="col-player" style="text-align:left;padding-left:10px;">Player</th>
            <th class="col-team">Team</th>`;

        cfg.columns.forEach(col => {
            const th        = document.createElement('th');
            th.textContent  = col.label;
            th.dataset.key  = col.key;
            th.addEventListener('click', () => this.sortBy(col.key, col.reverse || false));
            tr.appendChild(th);
        });

        hdr.innerHTML = '';
        hdr.appendChild(tr);
    }

    renderBody(slice, startRank, cfg) {
        const tbody = document.getElementById('tableBody');
        tbody.innerHTML = '';

        slice.forEach((player, i) => {
            const tr     = document.createElement('tr');
            tr.style.animationDelay = `${i * 12}ms`;

            const teamId = player.team?.id;
            const abbr   = player.team?.abbreviation || '—';
            const name   = player.team?.name || '';

            const logoHTML = teamId
                ? `<img src="https://www.mlbstatic.com/team-logos/${teamId}.svg"
                        alt="${abbr}" class="team-logo"
                        onerror="this.outerHTML='<span class=team-abbr-fallback>${abbr}</span>'">`
                : `<span class="team-abbr-fallback">${abbr}</span>`;

            tr.innerHTML = `
                <td class="col-rank">${startRank + i + 1}</td>
                <td class="col-player">${player.person?.fullName || '—'}</td>
                <td class="col-team" title="${name}">${logoHTML}</td>`;

            cfg.columns.forEach(col => {
                const td          = document.createElement('td');
                td.textContent    = this.fmt(player.stats[col.key], col.format);
                if (col.key === this.sortColumn) td.classList.add('highlight');
                tr.appendChild(td);
            });

            tbody.appendChild(tr);
        });
    }

    updatePagination() {
        const start = this.currentPage * this.itemsPerPage + 1;
        const end   = Math.min((this.currentPage + 1) * this.itemsPerPage, this.allData.length);
        const total = this.allData.length;
        const max   = Math.ceil(total / this.itemsPerPage) - 1;

        document.getElementById('currentRange').textContent  = `${start}–${end}`;
        document.getElementById('totalPlayers').textContent  = total;
        document.getElementById('prevBtn').disabled          = this.currentPage === 0;
        document.getElementById('nextBtn').disabled          = this.currentPage >= max;
    }

    updateSortIndicators() {
        document.querySelectorAll('#tableHeader th').forEach(th => {
            th.classList.remove('sort-asc', 'sort-desc');
            if (th.dataset.key === this.sortColumn) {
                th.classList.add(this.sortDirection === 'asc' ? 'sort-asc' : 'sort-desc');
            }
        });
    }

    // ── States ────────────────────────────────────────────────────────────────

    showLoading() {
        document.getElementById('loading').style.display          = 'flex';
        document.getElementById('error').style.display            = 'none';
        document.getElementById('leaderboardTable').style.display = 'none';
    }

    showError(msg = 'Failed to load data. Please try again.') {
        const el = document.getElementById('error');
        el.style.display  = 'flex';
        el.querySelector ? (el.childNodes[el.childNodes.length - 1].textContent = msg) : null;
        document.getElementById('loading').style.display          = 'none';
        document.getElementById('leaderboardTable').style.display = 'none';
    }
}

document.addEventListener('DOMContentLoaded', () => { new MLBLeaderboard(); });