document.addEventListener("DOMContentLoaded", async () => {

    // ── DOM Construction ──────────────────────────────────────────────────────

    const popupContainer = document.createElement("div");
    popupContainer.id = "popup-container";

    const gameInfo = document.createElement("div");
    gameInfo.id = "game-info";

    const awayTeamContainer = document.createElement("div");
    awayTeamContainer.classList.add("team-container");
    const awayLogo = document.createElement("img");
    awayLogo.id = "away-logo";
    awayLogo.classList.add("team-logo");
    const awayRecord = document.createElement("p");
    awayRecord.id = "away-record";
    awayRecord.classList.add("team-record");
    awayTeamContainer.appendChild(awayLogo);
    awayTeamContainer.appendChild(awayRecord);

    const gameStatusContainer = document.createElement("div");
    gameStatusContainer.classList.add("game-status");
    const awayScore = document.createElement("p");
    awayScore.id = "away-score";
    awayScore.classList.add("team-score");
    const homeScore = document.createElement("p");
    homeScore.id = "home-score";
    homeScore.classList.add("team-score");
    const inningInfo = document.createElement("p");
    inningInfo.id = "inning-info";
    inningInfo.classList.add("inning");
    const stadiumInfo = document.createElement("p");
    stadiumInfo.id = "stadium-info";
    stadiumInfo.classList.add("stadium");
    const centerElements = document.createElement("div");
    centerElements.id = "center-elements";
    centerElements.appendChild(inningInfo);
    centerElements.appendChild(stadiumInfo);
    gameStatusContainer.appendChild(awayScore);
    gameStatusContainer.appendChild(centerElements);
    gameStatusContainer.appendChild(homeScore);

    const homeTeamContainer = document.createElement("div");
    homeTeamContainer.classList.add("team-container");
    const homeLogo = document.createElement("img");
    homeLogo.id = "home-logo";
    homeLogo.classList.add("team-logo");
    const homeRecord = document.createElement("p");
    homeRecord.id = "home-record";
    homeRecord.classList.add("team-record");
    homeTeamContainer.appendChild(homeLogo);
    homeTeamContainer.appendChild(homeRecord);

    gameInfo.appendChild(awayTeamContainer);
    gameInfo.appendChild(gameStatusContainer);
    gameInfo.appendChild(homeTeamContainer);
    popupContainer.appendChild(gameInfo);

    // Tabs
    const tabSection = document.createElement("div");
    tabSection.id = "tab-section";
    const tabsContainer = document.createElement("div");
    tabsContainer.id = "tabs-container";

    const dynamicTab = document.createElement("button");
    dynamicTab.id = "dynamic-tab";
    dynamicTab.classList.add("tab-button", "active");
    dynamicTab.textContent = "Loading...";

    const boxscoreTab = document.createElement("button");
    boxscoreTab.id = "boxscore-tab";
    boxscoreTab.classList.add("tab-button");
    boxscoreTab.textContent = "Box Score";

    const scoringPlaysTab = document.createElement("button");
    scoringPlaysTab.id = "scoring-plays-tab";
    scoringPlaysTab.classList.add("tab-button");
    scoringPlaysTab.textContent = "Scoring Plays";

    const allPlaysTab = document.createElement("button");
    allPlaysTab.id = "all-plays-tab";
    allPlaysTab.classList.add("tab-button");
    allPlaysTab.textContent = "All Plays";

    const winProbTab = document.createElement("button");
    winProbTab.id = "win-prob-tab";
    winProbTab.classList.add("tab-button");
    winProbTab.textContent = "Win Prob";

    tabsContainer.appendChild(dynamicTab);
    tabsContainer.appendChild(boxscoreTab);
    tabsContainer.appendChild(scoringPlaysTab);
    tabsContainer.appendChild(allPlaysTab);
    tabsContainer.appendChild(winProbTab);
    tabSection.appendChild(tabsContainer);
    popupContainer.appendChild(tabSection);

    // Player info + scorebug
    const awayPlayerInfo = document.createElement("div");
    awayPlayerInfo.id = "away-player-info";
    awayPlayerInfo.classList.add("player-info");
    const awayPlayerStats = document.createElement("div");
    awayPlayerStats.id = "away-player-stats";
    awayPlayerInfo.appendChild(awayPlayerStats);

    const scorebugContainer = document.createElement("div");
    scorebugContainer.id = "scorebug";

    const homePlayerInfo = document.createElement("div");
    homePlayerInfo.id = "home-player-info";
    homePlayerInfo.classList.add("player-info");
    const homePlayerStats = document.createElement("div");
    homePlayerStats.id = "home-player-stats";
    homePlayerInfo.appendChild(homePlayerStats);

    const gameplayInfoContainer = document.createElement("div");
    gameplayInfoContainer.id = "gameplay-info-container";
    const scorebugWrapper = document.createElement("div");
    scorebugWrapper.id = "scorebug-wrapper";
    scorebugWrapper.appendChild(scorebugContainer);
    const leftSpacer = document.createElement("div");
    leftSpacer.className = "spacer";
    const rightSpacer = document.createElement("div");
    rightSpacer.className = "spacer";

    gameplayInfoContainer.appendChild(awayPlayerInfo);
    gameplayInfoContainer.appendChild(leftSpacer);
    gameplayInfoContainer.appendChild(scorebugWrapper);
    gameplayInfoContainer.appendChild(rightSpacer);
    gameplayInfoContainer.appendChild(homePlayerInfo);
    popupContainer.appendChild(gameplayInfoContainer);

    // Tab content containers (hidden by default)
    const boxScoreContainer = document.createElement("div");
    boxScoreContainer.id = "boxscore-content";
    boxScoreContainer.style.display = "none";
    popupContainer.appendChild(boxScoreContainer);

    document.body.appendChild(popupContainer);

    // ── Layout CSS ────────────────────────────────────────────────────────────

    const styleElement = document.createElement("style");
    styleElement.textContent = `
        * { box-sizing: border-box; }

        body {
            width: 667px;
            font-family: "Rubik", sans-serif;
            min-height: 667px;
            transform: scale(0.9);
            transform-origin: top left;
            margin: 0;
            padding: 0;
        }

        /* ── Game Info Header ── */
        #game-info {
            display: flex;
            align-items: center;
            justify-content: space-between;
            padding: 10px 16px;
            background: #f7fafc;
            border-bottom: 1px solid rgba(4,30,66,0.08);
        }

        .team-container {
            display: flex;
            flex-direction: column;
            align-items: center;
            gap: 4px;
            min-width: 80px;
        }

        .team-logo {
            width: 72px;
            height: 72px;
            object-fit: contain;
        }

        .team-record {
            font-size: 11px;
            color: rgba(4,30,66,0.5);
            margin: 0;
            font-weight: 600;
        }

        .game-status {
            display: flex;
            align-items: center;
            justify-content: center;
            flex: 1;
            gap: 16px;
        }

        .team-score {
            font-size: 42px;
            font-weight: 800;
            color: #041e42;
            margin: 0;
            line-height: 1;
            letter-spacing: -2px;
        }

        #center-elements {
            text-align: center;
            display: flex;
            flex-direction: column;
            align-items: center;
            gap: 3px;
        }

        .inning {
            font-size: 22px;
            font-weight: 800;
            color: #bf0d3d;
            margin: 0;
            letter-spacing: 0.5px;
            text-transform: uppercase;
            line-height: 1;
        }

        .stadium {
            font-size: 9px;
            color: rgba(4,30,66,0.4);
            margin: 0;
        }

        /* ── Gameplay / Live Container ── */
        #gameplay-info-container {
            display: flex;
            justify-content: space-between;
            align-items: center;
            width: 100%;
            padding: 5px 10px;
            gap: 6px;
            background: #f7fafc;
            border-bottom: 1px solid rgba(4, 30, 66, 0.29);
            margin-left: 30px;
        }

        #scorebug-wrapper {
            flex: 0 0 auto;
            display: flex;
            align-items: center;
            justify-content: center;
        }

        .player-info {
            flex: 1;
            padding: 4px 6px;
            background: transparent;
            border-radius: 6px;
            min-width: 0;
        }

        .spacer { display: none; }

        /* ── Scorebug ── */
        .scorebug {
            display: flex;
            flex-direction: column;
            align-items: center;
            gap: 2px;
            background: transparent;
            padding: 2px 4px;
        }

        .balls-strikes {
            font-size: 13px;
            font-weight: 700;
            color: #041e42;
            letter-spacing: 1px;
        }

        .player-name {
            font-weight: 700;
            margin-bottom: 3px;
            font-size: 13px;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
            color: #041e42;
        }

        .player-position {
            font-style: italic;
            margin-bottom: 3px;
            color: #bf0d3d;
            font-size: 11px;
        }

        .player-stat {
            margin: 1px 0;
            font-size: 11px;
            color: #333;
        }

        /* ── Decision Pitcher (Final) ── */
        .decision-pitcher {
            display: flex;
            flex-direction: row;
            align-items: center;
            justify-content: center;
            gap: 6px;
            width: 100%;
        }

        .decision-pitcher-image {
            width: 50px;
            height: 50px;
            border-radius: 50%;
            border: 2px solid #bf0d3d;
            background: #041e42;
            object-fit: cover;
            flex-shrink: 0;
        }

        .decision-pitcher-info {
            display: flex;
            flex-direction: row;
            align-items: center;
            gap: 5px;
        }

        .winning-pitcher {
            font-size: 13px;
            font-weight: 800;
            color: #078359;
            background: rgba(16,185,129,0.1);
            padding: 2px 6px;
            border-radius: 4px;
        }

        .losing-pitcher {
            font-size: 13px;
            font-weight: 800;
            color: #ef4444;
            background: rgba(239,68,68,0.1);
            padding: 2px 6px;
            border-radius: 4px;
        }

        .decision-pitcher-name {
            margin: 0;
            font-size: 11px;
            font-weight: 600;
            text-align: left;
            line-height: 1.3;
            color: #041e42;
        }

        /* ── Pre-game lineup ── */
        .prob-stats {
            font-size: 12px;
            color: #555;
            margin: 4px 0 10px;
            font-weight: 500;
            line-height: 1.5;
        }

        .lineup {
            font-size: 13px;
            color: #222;
            margin: 0;
            line-height: 1;
            padding: 5px 0;
            border-bottom: 1px solid rgba(4,30,66,0.05);
            display: flex;
            align-items: center;
            gap: 4px;
        }

        .lineup:last-child { border-bottom: none; }

        .hand { color: #bf0d3d; font-weight: 800; font-size: 10px; display: inline-block; width: 12px; flex-shrink: 0; }
        .field { color: #888; font-size: 11px; font-weight: 600; margin-left: auto; }
        .avg { color: #041e42; font-weight: 700; font-size: 11px; margin-left: 4px; }
        .starter-hand { color: #bf0d3d; font-weight: 800; font-size: 12px; }

        /* Pre-game full-width two-column layout */
        #gameplay-info-container.pregame {
            padding: 0;
            gap: 0;
            align-items: stretch;
        }

        #gameplay-info-container.pregame .player-info {
            flex: 1;
            max-width: none;
            padding: 16px 18px;
            background: white;
            border-right: 1px solid rgba(4,30,66,0.08);
            overflow-y: auto;
            max-height: 420px;
        }

        #gameplay-info-container.pregame .player-info:last-child {
            border-right: none;
        }

        #gameplay-info-container.pregame #scorebug-wrapper,
        #gameplay-info-container.pregame .spacer {
            display: none;
        }

        .player-position {
            font-size: 10px;
            font-weight: 800;
            color: rgba(4,30,66,0.35);
            text-transform: uppercase;
            letter-spacing: 1px;
            margin: 0 0 4px;
        }

        .player-name {
            font-weight: 700;
            margin: 0 0 3px;
            font-size: 15px;
            color: #041e42;
        }

        .player-stat {
            margin: 2px 0;
            font-size: 12px;
            color: #333;
        }

        /* ── Top Performers ── */
        .top-performers-section {
            background: white;
            padding: 8px 10px;
            border-top: 1px solid rgba(4,30,66,0.06);
        }

        .top-performers-row {
            display: flex;
            justify-content: space-around;
            gap: 4px;
            margin-top: 4px;
        }

        .top-performer {
            display: flex;
            flex-direction: column;
            align-items: center;
            text-align: center;
            flex: 1;
            min-width: 0;
        }

        .performer-image {
            width: 42px;
            height: 42px;
            border-radius: 50%;
            border: 2px solid #bf0d3d;
            background: #041e42;
            object-fit: cover;
        }

        .performer-name {
            font-size: 10px;
            font-weight: 700;
            color: #041e42;
            margin: 3px 0 1px;
            line-height: 1.2;
        }

        .performer-stats {
            font-size: 9px;
            color: #555;
            margin: 0;
            line-height: 1.3;
        }

        /* ── Video Buttons ── */
        .video-buttons-section {
            background: white;
            border-top: 1px solid rgba(4,30,66,0.06);
        }

        /* ── Live At-Bat Widget ── */
        #live-at-bat {
            width: 100%;
            background: white;
            border-top: 1px solid rgba(4,30,66,0.07);
            padding: 8px 10px 10px;
        }

        /* Top section: zone left, players right */
        .lab-main-row {
            display: flex;
            gap: 10px;
            align-items: flex-start;
        }

        /* Zone column */
        .lab-zone-col {
            flex: 0 0 108px;
            display: flex;
            flex-direction: column;
            align-items: center;
            gap: 3px;
        }

        .lab-zone-label {
            font-size: 8px;
            font-weight: 700;
            color: rgba(4,30,66,0.3);
            text-transform: uppercase;
            letter-spacing: 1px;
        }

        .lab-count-pills {
            display: flex;
            align-items: center;
            gap: 5px;
            margin-top: 1px;
        }

        .lab-count-group {
            display: flex;
            align-items: center;
            gap: 3px;
        }

        .lab-dot {
            width: 7px;
            height: 7px;
            border-radius: 50%;
            border: 1.5px solid #bf0d3d;
            background: transparent;
            transition: background 0.15s;
        }

        .lab-dot.ball.on  { background: #10b981; border-color: #10b981; }
        .lab-dot.strike.on { background: #bf0d3d; }

        .lab-count-lbl {
            font-size: 8px;
            font-weight: 700;
            color: rgba(4,30,66,0.4);
        }

        .lab-pill-divider {
            width: 1px;
            height: 10px;
            background: rgba(4,30,66,0.12);
        }

        /* Info column */
        .lab-info-col {
            flex: 1;
            min-width: 0;
            display: flex;
            flex-direction: column;
            gap: 4px;
        }

        /* Batter + pitcher side by side */
        .lab-players-row {
            display: flex;
            gap: 6px;
        }

        .lab-player-card {
            flex: 1;
            display: flex;
            align-items: center;
            gap: 5px;
            background: rgba(4,30,66,0.03);
            border-radius: 6px;
            padding: 4px 5px;
            min-width: 0;
        }

        .lab-headshot {
            width: 28px;
            height: 28px;
            border-radius: 50%;
            border: 1.5px solid #bf0d3d;
            object-fit: cover;
            background: #041e42;
            flex-shrink: 0;
        }

        .lab-pitcher-photo {
            width: 28px;
            height: 28px;
            border-radius: 50%;
            border: 1.5px solid rgba(4,30,66,0.3);
            object-fit: cover;
            background: #041e42;
            flex-shrink: 0;
        }

        .lab-player-info { min-width: 0; flex: 1; }

        .lab-player-role {
            font-size: 8px;
            font-weight: 700;
            color: rgba(4,30,66,0.35);
            text-transform: uppercase;
            letter-spacing: 0.5px;
        }

        .lab-player-name {
            font-size: 11px;
            font-weight: 700;
            color: #041e42;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
        }

        .lab-hand-badge {
            display: inline-block;
            background: #041e42;
            color: white;
            font-size: 7px;
            font-weight: 700;
            padding: 1px 3px;
            border-radius: 3px;
            margin-left: 2px;
            vertical-align: middle;
        }

        /* In-game stats row under players */
        .lab-igstats-row {
            display: flex;
            gap: 4px;
        }

        .lab-igstat-group {
            flex: 1;
            display: flex;
            gap: 3px;
        }

        .lab-igstat {
            flex: 1;
            text-align: center;
            background: rgba(4,30,66,0.03);
            border-radius: 4px;
            padding: 2px 2px;
        }

        .lab-igstat-lbl {
            font-size: 7px;
            color: rgba(4,30,66,0.4);
            font-weight: 700;
            text-transform: uppercase;
            display: block;
        }

        .lab-igstat-val {
            font-size: 11px;
            font-weight: 700;
            color: #041e42;
            display: block;
            line-height: 1.2;
        }

        .lab-count-avg {
            font-size: 9px;
            color: #666;
            text-align: center;
        }

        /* Pitch log */
        .lab-log-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-top: 6px;
        }

        .lab-log-title {
            font-size: 8px;
            font-weight: 700;
            color: rgba(4,30,66,0.35);
            text-transform: uppercase;
            letter-spacing: 0.8px;
        }

        .lab-pitch-count-badge {
            font-size: 8px;
            color: rgba(4,30,66,0.4);
            font-weight: 600;
        }

        .lab-pitchlog {
            max-height: 90px;
            overflow-y: auto;
            scrollbar-width: thin;
            scrollbar-color: rgba(4,30,66,0.15) transparent;
        }

        .lab-pitchlog::-webkit-scrollbar { width: 3px; }
        .lab-pitchlog::-webkit-scrollbar-thumb { background: rgba(4,30,66,0.15); border-radius: 2px; }

        .lab-pitch-row {
            display: flex;
            align-items: center;
            gap: 5px;
            padding: 3px 0;
            border-bottom: 1px solid rgba(4,30,66,0.04);
        }

        .lab-pitch-row:last-child { border-bottom: none; }

        .lab-pitch-num {
            font-size: 8px;
            color: rgba(4,30,66,0.3);
            width: 12px;
            text-align: right;
            flex-shrink: 0;
        }

        .lab-pitch-badge {
            font-size: 8px;
            font-weight: 700;
            color: white;
            padding: 1px 4px;
            border-radius: 3px;
            flex-shrink: 0;
            min-width: 22px;
            text-align: center;
        }

        .lab-pitch-type {
            font-size: 10px;
            color: #041e42;
            flex: 1;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
        }

        .lab-pitch-velo {
            font-size: 10px;
            font-weight: 600;
            color: #041e42;
            flex-shrink: 0;
            min-width: 52px;
            text-align: right;
        }

        .lab-pitch-spin {
            font-size: 9px;
            color: rgba(4,30,66,0.5);
            flex-shrink: 0;
            min-width: 48px;
            text-align: right;
        }

        .lab-pitch-result {
            font-size: 8px;
            font-weight: 700;
            padding: 1px 5px;
            border-radius: 3px;
            flex-shrink: 0;
        }

        .pr-strike { background: #ef4444; color: white; }
        .pr-ball   { background: #10b981; color: white; }
        .pr-contact{ background: #f59e0b; color: white; }
        .pr-foul   { background: #8b5cf6; color: white; }

        /* Play result + statcast section */
        .lab-result-section {
            margin-top: 6px;
            padding-top: 6px;
            border-top: 1px solid rgba(4,30,66,0.07);
        }

        .lab-play-event {
            font-size: 13px;
            font-weight: 800;
            color: #041e42;
            margin-bottom: 3px;
        }

        .lab-play-desc {
            font-size: 12px;
            color: #333;
            line-height: 1.4;
            margin-bottom: 6px;
        }

        .lab-statcast-row {
            display: flex;
            gap: 6px;
        }

        .lab-sc-chip {
            flex: 1;
            background: linear-gradient(135deg, #f8f9fa, #e8eef8);
            border-radius: 6px;
            padding: 5px 6px;
            text-align: center;
            border-left: 2px solid #bf0d3d;
        }

        .lab-sc-lbl {
            font-size: 8px;
            font-weight: 700;
            color: rgba(4,30,66,0.45);
            text-transform: uppercase;
            letter-spacing: 0.5px;
            display: block;
        }

        .lab-sc-val {
            font-size: 14px;
            font-weight: 800;
            color: #bf0d3d;
            display: block;
            line-height: 1.2;
        }

        /* ── Scoring Plays / All Plays ── */
        #scoring-plays-container,
        #all-plays-container {
            width: 100%;
            padding: 8px;
            background: #f0f4f8;
        }

        .play-item {
            display: flex;
            align-items: flex-start;
            margin-bottom: 10px;
            padding: 8px;
            background: white;
            border-radius: 8px;
            box-shadow: 0 1px 4px rgba(4,30,66,0.07);
            position: relative;
        }

        .game-start-item {
            text-align: center;
            padding: 12px 8px;
            margin-bottom: 10px;
            background: linear-gradient(135deg, #041e42, #0a2d5e);
            color: white;
            border-radius: 8px;
        }

        .content-wrapper {
            display: flex;
            flex: 1;
            align-items: stretch;
            gap: 10px;
        }

        .game-situation {
            display: flex;
            flex-direction: row;
            align-items: center;
            justify-content: center;
            padding: 6px;
            border-radius: 6px;
            min-width: 80px;
            align-self: stretch;
        }

        .statcast-stats {
            display: flex;
            gap: 10px;
            margin-top: 6px;
            border-radius: 6px;
            border-left: 3px solid #bf0d3d;
        }

        .stat-item { text-align: center; flex: 1; }

        /* ── Player stat panels (live batter/pitcher) ── */
    `;
    document.head.appendChild(styleElement);

    // ── Constants ─────────────────────────────────────────────────────────────

    const FINAL_STATES = [
        "Final", "Game Over", "Final: Tied",
        "Completed Early", "Completed Early: Rain", "Completed Early: Mercy",
        "Cancelled", "Cancelled: Rain"
    ];

    const PRE_GAME_STATES = ["Pre-Game", "Scheduled", "Warmup"];

    const isFinalState   = (s) => FINAL_STATES.includes(s);
    const isPreGameState = (s) => PRE_GAME_STATES.includes(s);
    const isLiveState    = (s) => !isFinalState(s) && !isPreGameState(s) &&
                                   !["Postponed","Suspended","Suspended: Rain","Cancelled","Cancelled: Rain","Delayed"].includes(s);

    // ── Live At-Bat: Pitch Map & Zone ─────────────────────────────────────────

    const PITCH_MAP = {
        FF: { label:'4-Seam',    abbr:'FF', color:'#e63946' },
        FA: { label:'4-Seam',    abbr:'FF', color:'#e63946' },
        FT: { label:'2-Seam',    abbr:'FT', color:'#c1121f' },
        SI: { label:'Sinker',    abbr:'SI', color:'#c1121f' },
        FC: { label:'Cutter',    abbr:'FC', color:'#f4a261' },
        SL: { label:'Slider',    abbr:'SL', color:'#2a9d8f' },
        ST: { label:'Sweeper',   abbr:'ST', color:'#fb8500' },
        SV: { label:'Slurve',    abbr:'SV', color:'#3a86ff' },
        CU: { label:'Curveball', abbr:'CU', color:'#457b9d' },
        KC: { label:'Knuck-Cur', abbr:'KC', color:'#457b9d' },
        CS: { label:'Slow Cur',  abbr:'CS', color:'#457b9d' },
        CH: { label:'Changeup',  abbr:'CH', color:'#8338ec' },
        FS: { label:'Splitter',  abbr:'FS', color:'#06d6a0' },
        FO: { label:'Forkball',  abbr:'FO', color:'#06d6a0' },
        KN: { label:'Knuckle',   abbr:'KN', color:'#adb5bd' },
        EP: { label:'Eephus',    abbr:'EP', color:'#adb5bd' },
        PO: { label:'Pitchout',  abbr:'PO', color:'#6c757d' },
        IN: { label:'Int. Ball', abbr:'IN', color:'#6c757d' },
    };

    const LEAGUE_AVG_BY_COUNT = {
        '0-0':.248,'0-1':.215,'0-2':.141,
        '1-0':.273,'1-1':.234,'1-2':.158,
        '2-0':.299,'2-1':.262,'2-2':.178,
        '3-0':.330,'3-1':.303,'3-2':.216,
    };

    const pitchInfo = (code) => PITCH_MAP[code] || { label: code||'?', abbr: code||'?', color:'#94a3b8' };

    // Zone geometry
    const ZONE_W=120, ZONE_H=155;
    const SZ_LEFT=22, SZ_RIGHT=98, SZ_TOP=24, SZ_BOT=108;
    const SZ_CX = (SZ_LEFT + SZ_RIGHT) / 2;
    const PX_PER_FT = (SZ_RIGHT - SZ_LEFT) / 1.7;
    const PZ_TOP_FT=3.5, PZ_BOT_FT=1.5;
    const mapPx = (pX) => SZ_CX + pX * PX_PER_FT;
    const mapPz = (pZ) => SZ_BOT - (pZ - PZ_BOT_FT) / (PZ_TOP_FT - PZ_BOT_FT) * (SZ_BOT - SZ_TOP);

    function buildStrikeZoneSVG(pitches = []) {
        const zW = SZ_RIGHT - SZ_LEFT;
        const zH = SZ_BOT - SZ_TOP;
        const z3 = zW / 3, z3h = zH / 3;

        const dots = pitches.map((p, i) => {
            const px = p.pitchData?.coordinates?.pX;
            const pz = p.pitchData?.coordinates?.pZ;
            if (px == null || pz == null) return '';
            const cx = mapPx(px);
            const cy = mapPz(pz);
            const info = pitchInfo(p.details?.type?.code);
            const isLast = i === pitches.length - 1;
            return `
                <circle cx="${cx}" cy="${cy}" r="${isLast ? 7 : 5}"
                    fill="${info.color}" stroke="${isLast ? '#fff' : 'rgba(255,255,255,0.35)'}"
                    stroke-width="${isLast ? 2 : 1}" opacity="${isLast ? 1 : 0.6}"/>
                <text x="${cx}" y="${cy+0.5}" text-anchor="middle" dominant-baseline="middle"
                    font-size="${isLast ? 7 : 6}" font-weight="700" fill="white"
                    font-family="monospace" pointer-events="none">${i+1}</text>`;
        }).join('');

        return `<svg width="100%" viewBox="0 0 ${ZONE_W} ${ZONE_H}" xmlns="http://www.w3.org/2000/svg" style="display:block;overflow:visible;">
            <rect x="${SZ_LEFT}" y="${SZ_TOP}" width="${zW}" height="${zH}"
                fill="rgba(191,13,61,0.04)" stroke="#bf0d3d" stroke-width="1.5" rx="1"/>
            <line x1="${SZ_LEFT+z3}"   y1="${SZ_TOP}" x2="${SZ_LEFT+z3}"   y2="${SZ_BOT}" stroke="rgba(191,13,61,0.2)" stroke-width="0.8" stroke-dasharray="3,2"/>
            <line x1="${SZ_LEFT+z3*2}" y1="${SZ_TOP}" x2="${SZ_LEFT+z3*2}" y2="${SZ_BOT}" stroke="rgba(191,13,61,0.2)" stroke-width="0.8" stroke-dasharray="3,2"/>
            <line x1="${SZ_LEFT}" y1="${SZ_TOP+z3h}"   x2="${SZ_RIGHT}" y2="${SZ_TOP+z3h}"   stroke="rgba(191,13,61,0.2)" stroke-width="0.8" stroke-dasharray="3,2"/>
            <line x1="${SZ_LEFT}" y1="${SZ_TOP+z3h*2}" x2="${SZ_RIGHT}" y2="${SZ_TOP+z3h*2}" stroke="rgba(191,13,61,0.2)" stroke-width="0.8" stroke-dasharray="3,2"/>
            <polygon points="${SZ_LEFT},${SZ_BOT+5} ${SZ_RIGHT},${SZ_BOT+5} ${SZ_RIGHT},${SZ_BOT+12} ${SZ_CX},${SZ_BOT+20} ${SZ_LEFT},${SZ_BOT+12}"
                fill="white" stroke="rgba(148,163,184,0.45)" stroke-width="1.2"/>
            ${dots}
        </svg>`;
    }

    function buildRunnerSVG(offense = {}) {
        const on1 = !!offense.first, on2 = !!offense.second, on3 = !!offense.third;
        const bs = 7, sw = 1.8;
        const fill   = (on) => on ? '#bf0d3d' : 'transparent';
        const stroke = (on) => on ? '#e63946' : 'rgba(4,30,66,0.25)';
        const base = (cx, cy, active) =>
            `<rect x="${cx-bs}" y="${cy-bs}" width="${bs*2}" height="${bs*2}"
                transform="rotate(45 ${cx} ${cy})"
                fill="${fill(active)}" stroke="${stroke(active)}" stroke-width="${sw}" rx="1"/>`;
        return `<svg width="48" height="48" viewBox="0 0 64 58" fill="none" xmlns="http://www.w3.org/2000/svg">
            ${base(32, 8, on2)}${base(10, 30, on3)}${base(54, 30, on1)}
        </svg>`;
    }

    // Count-average cache
    const _batterCountCache = {};

    async function fetchBatterAvgAtCount(batterId, balls, strikes) {
        const key = `${balls}-${strikes}`;
        const cacheKey = `${batterId}-${key}`;
        if (_batterCountCache[cacheKey] !== undefined) return _batterCountCache[cacheKey];
        try {
            const res = await fetch(`https://statsapi.mlb.com/api/v1/people/${batterId}/stats?stats=byCount&group=hitting&season=2025&gameType=R`);
            const d = await res.json();
            const splits = d.stats?.[0]?.splits || [];
            for (const s of splits) {
                const k = s.split?.description?.replace(/ count/i,'').trim();
                if (k === key && s.stat?.avg) {
                    const val = parseFloat(s.stat.avg);
                    _batterCountCache[cacheKey] = val;
                    return val;
                }
            }
        } catch(e) { /* silent */ }
        const lg = LEAGUE_AVG_BY_COUNT[key] || null;
        _batterCountCache[cacheKey] = lg;
        return lg;
    }

    // ── Visibility Management ─────────────────────────────────────────────────

    const originalDisplayValues = {};

    function storeOriginalDisplay(elementId) {
        const el = document.getElementById(elementId);
        if (el && !originalDisplayValues[elementId]) {
            originalDisplayValues[elementId] = window.getComputedStyle(el).display || 'block';
        }
    }

    function toggleContainers(showDynamic, isBoxscoreTab=false, isScoringPlaysTab=false, isAllPlaysTab=false, isWinProbTab=false) {
        const gameInfoEl        = document.getElementById('game-info');
        const gameplayEl        = document.getElementById('gameplay-info-container');
        const videoButtonsEl    = document.getElementById('video-buttons');
        const topPerformerEl    = document.getElementById('top-performers');
        const liveAtBatEl       = document.getElementById('live-at-bat');
        const boxScoreEl        = document.getElementById('boxscore-content');
        const scoringPlaysEl    = document.getElementById('scoring-plays-container');
        const allPlaysEl        = document.getElementById('all-plays-container');
        const winProbEl         = document.getElementById('win-prob-container');

        ['game-info','gameplay-info-container'].forEach(storeOriginalDisplay);

        if (showDynamic) {
            if (gameInfoEl)     gameInfoEl.style.display     = originalDisplayValues['game-info'] || 'flex';
            if (gameplayEl)     gameplayEl.style.display     = originalDisplayValues['gameplay-info-container'] || 'flex';
            if (videoButtonsEl) videoButtonsEl.style.display = '';
            if (topPerformerEl) topPerformerEl.style.display = '';
            // live-at-bat visibility controlled by renderLiveAtBat tab guard
        } else {
            if (gameInfoEl)     gameInfoEl.style.display     = originalDisplayValues['game-info'] || 'flex';
            if (gameplayEl)     gameplayEl.style.display     = 'none';
            if (videoButtonsEl) videoButtonsEl.style.display = 'none';
            if (topPerformerEl) topPerformerEl.style.display = 'none';
            if (liveAtBatEl)    liveAtBatEl.style.display    = 'none';
        }

        if (boxScoreEl)      boxScoreEl.style.display      = isBoxscoreTab    ? 'block' : 'none';
        if (scoringPlaysEl)  scoringPlaysEl.style.display  = isScoringPlaysTab? 'block' : 'none';
        if (allPlaysEl)      allPlaysEl.style.display      = isAllPlaysTab    ? 'block' : 'none';
        if (winProbEl)       winProbEl.style.display       = isWinProbTab     ? 'block' : 'none';
    }

    // ── Tab Routing ───────────────────────────────────────────────────────────

    function openGameDetailsPage(tabType) {
        switch(tabType) {
            case 'live': case 'wrap': case 'pre-game': case 'game-info':
                break; // dynamic content driven by updatePlayerInfo
            case 'boxscore':       loadBoxScore();       break;
            case 'scoring-plays':  loadScoringPlays();   break;
            case 'all-plays':      loadAllPlays();       break;
            case 'win-prob':       loadWinProbability(); break;
            default: console.warn(`Unknown tab type: ${tabType}`);
        }
    }

    dynamicTab.addEventListener('click', () => {
        document.querySelectorAll('.tab-button').forEach(t => t.classList.remove('active'));
        dynamicTab.classList.add('active');
        toggleContainers(true, false, false, false, false);
        openGameDetailsPage(dynamicTab.textContent.toLowerCase().replace(/\s+/g,'-'));
    });

    boxscoreTab.addEventListener('click', () => {
        document.querySelectorAll('.tab-button').forEach(t => t.classList.remove('active'));
        boxscoreTab.classList.add('active');
        toggleContainers(false, true, false, false, false);
        openGameDetailsPage('boxscore');
    });

    scoringPlaysTab.addEventListener('click', () => {
        document.querySelectorAll('.tab-button').forEach(t => t.classList.remove('active'));
        scoringPlaysTab.classList.add('active');
        toggleContainers(false, false, true, false, false);
        openGameDetailsPage('scoring-plays');
    });

    allPlaysTab.addEventListener('click', () => {
        document.querySelectorAll('.tab-button').forEach(t => t.classList.remove('active'));
        allPlaysTab.classList.add('active');
        toggleContainers(false, false, false, true, false);
        openGameDetailsPage('all-plays');
    });

    winProbTab.addEventListener('click', () => {
        document.querySelectorAll('.tab-button').forEach(t => t.classList.remove('active'));
        winProbTab.classList.add('active');
        toggleContainers(false, false, false, false, true);
        openGameDetailsPage('win-prob');
    });

    // ── Auto-refresh interval (only while on dynamic tab) ────────────────────

    setInterval(() => {
        if (!gamePk) return;
        const activeTab = document.querySelector('.tab-button.active');
        if (activeTab?.id === 'dynamic-tab') {
            fetchGameDetails(gamePk);
            fetchGameData(gamePk);
        }
    }, 2000);

    toggleContainers(true);

    // ── Init ──────────────────────────────────────────────────────────────────

    let videoMatcher = null;
    function initializeVideoMatcher() {
        if (!videoMatcher) videoMatcher = new MLBVideoMatcher();
        return videoMatcher;
    }

    const params = new URLSearchParams(window.location.search);
    const gamePk = params.get("gamePk");

    if (gamePk) {
        fetchGameDetails(gamePk);
        fetchGameData(gamePk);
    }

    function formatGameTime(gameDate) {
        const d = new Date(gameDate);
        const h = d.getHours(), m = d.getMinutes();
        const ampm = h >= 12 ? "PM" : "AM";
        return `${(h % 12) || 12}:${String(m).padStart(2,'0')} ${ampm}`;
    }

    function getFinalInningText(linescore) {
        const n = linescore.currentInning || 9;
        return n !== 9 ? `FINAL/${n}` : 'FINAL';
    }

    // ── Auto-refresh for live games ───────────────────────────────────────────

    let gameRefreshInterval = null;
    let currentGamePk = null;

    function startAutoRefresh(pk) {
        if (gameRefreshInterval && currentGamePk === pk) return;
        stopAutoRefresh();
        currentGamePk = pk;
        gameRefreshInterval = setInterval(() => fetchGameDetails(pk), 2000);
    }

    function stopAutoRefresh() {
        if (gameRefreshInterval) {
            clearInterval(gameRefreshInterval);
            gameRefreshInterval = null;
            currentGamePk = null;
        }
    }

    // ── fetchGameDetails ──────────────────────────────────────────────────────

    async function fetchGameDetails(pk) {
        try {
            const response = await fetch(`https://statsapi.mlb.com/api/v1.1/game/${pk}/feed/live`);
            const data = await response.json();
            if (!data?.gameData || !data?.liveData) {
                inningInfo.textContent = "Game data unavailable.";
                return;
            }

            const game      = data.gameData;
            const linescore = data.liveData.linescore;
            const awayTeam  = game.teams.away;
            const homeTeam  = game.teams.home;
            const statusText = game.status.detailedState;

            // Update dynamic tab label
            const dynTabEl = document.getElementById("dynamic-tab");
            if (dynTabEl) {
                if (isFinalState(statusText)) {
                    dynTabEl.textContent = "Wrap";
                } else if (isPreGameState(statusText)) {
                    dynTabEl.textContent = "Game Info";
                } else if (["Warmup","Delayed","Postponed","Suspended","Cancelled","Cancelled: Rain"].includes(statusText)) {
                    dynTabEl.textContent = statusText;
                } else {
                    dynTabEl.textContent = "Live";
                }
            }

            // Inning text
            let inningText = "", inningStyle = "";
            if (statusText === "Suspended: Rain" || statusText === "Suspended") {
                inningText = "SUSP";
                inningStyle = "color:#bf0d3d;";
            } else if (statusText === "Cancelled" || statusText === "Cancelled: Rain") {
                inningText = "CXLD";
                inningStyle = "color:#bf0d3d;";
            } else if (statusText === "Postponed") {
                inningText = "PPD";
                inningStyle = "color:#bf0d3d;";
            } else if (isFinalState(statusText)) {
                inningText  = getFinalInningText(linescore);
                inningStyle = "color:#bf0d3d;";
            } else if (isPreGameState(statusText)) {
                inningText  = formatGameTime(game.datetime.dateTime);
                inningStyle = "color:rgba(4,30,66,0.55);font-size:11px;";
            } else {
                const half = linescore.inningHalf === "Top" ? "▲" : "▼";
                inningText = `${half} ${linescore.currentInning || ''}`;
                inningStyle = "color:#bf0d3d;";
            }

            // DOM updates
            awayLogo.src    = `https://www.mlbstatic.com/team-logos/${awayTeam.id}.svg`;
            awayLogo.alt    = awayTeam.name;
            awayScore.textContent = linescore.teams.away.runs ?? 0;
            awayRecord.textContent = `${game.teams.away.record?.wins ?? 0}-${game.teams.away.record?.losses ?? 0}`;

            inningInfo.textContent = inningText;
            inningInfo.style       = inningStyle;

            homeScore.textContent = linescore.teams.home.runs ?? 0;
            homeLogo.src  = `https://www.mlbstatic.com/team-logos/${homeTeam.id}.svg`;
            homeLogo.alt  = homeTeam.name;
            homeRecord.textContent = `${game.teams.home.record?.wins ?? 0}-${game.teams.home.record?.losses ?? 0}`;

            updatePlayerInfo(data);

            if (isLiveState(statusText)) {
                startAutoRefresh(pk);
            } else {
                stopAutoRefresh();
            }

        } catch (err) {
            console.error("fetchGameDetails error:", err);
            inningInfo.textContent = "Error loading game.";
        }
    }

    // ── updatePlayerInfo ──────────────────────────────────────────────────────

    function updatePlayerInfo(data) {
        const gameState   = data.gameData.status.detailedState;
        const currentPlay = data.liveData.plays.currentPlay;
        const inningState = data.liveData.linescore.inningHalf;
        const awayBattingOrder = data.liveData.boxscore.teams.away.battingOrder;
        const homeBattingOrder = data.liveData.boxscore.teams.home.battingOrder;

        const awayPS = document.getElementById("away-player-stats");
        const homePS = document.getElementById("home-player-stats");
        awayPS.innerHTML = "";
        homePS.innerHTML = "";

        // ── FINAL ─────────────────────────────────────────────────────────────
        if (isFinalState(gameState)) {
            const isTied = gameState === "Final: Tied";

            if (!isTied && data.liveData.decisions?.winner && data.liveData.decisions?.loser) {
                const { winner, loser } = data.liveData.decisions;
                const winnerImg = `https://img.mlbstatic.com/mlb-photos/image/upload/d_people:generic:headshot:67:current.png/w_100,h_100,c_fill,q_auto:best/v1/people/${winner.id}/headshot/67/current`;
                const loserImg  = `https://img.mlbstatic.com/mlb-photos/image/upload/d_people:generic:headshot:67:current.png/w_100,h_100,c_fill,q_auto:best/v1/people/${loser.id}/headshot/67/current`;

                const decisionHTML = (imgSrc, name, cls, label) => `
                    <div class="decision-pitcher">
                        <img src="${imgSrc}" alt="${name}" class="decision-pitcher-image"
                            onerror="this.src='https://content.mlb.com/images/headshots/current/60x60/generic_player@2x.png'">
                        <div class="decision-pitcher-info">
                            <span class="${cls}">${label}</span>
                            <span class="decision-pitcher-name">
                                <span>${name.split(" ")[0]}</span><br>
                                <span>${name.split(" ").slice(1).join(" ")}</span>
                            </span>
                        </div>
                    </div>`;

                awayPS.innerHTML = decisionHTML(winnerImg, winner.fullName, 'winning-pitcher', 'W');
                homePS.innerHTML = decisionHTML(loserImg,  loser.fullName,  'losing-pitcher',  'L');
            }

            // Hide live-at-bat widget
            const lab = document.getElementById('live-at-bat');
            if (lab) lab.style.display = 'none';

            const gameplayEl = document.getElementById("gameplay-info-container");
            if (!gameplayEl) return;

            const isSpringTraining = ["S","E"].includes(data?.gameData?.game?.type);

            if (isSpringTraining) {
                const existing = document.getElementById("video-buttons");
                if (existing) existing.style.display = "none";
            } else {
                _createVideoButtons(data, gameplayEl);
            }

            _createTopPerformers(data, gameplayEl);
            return;
        }

        // ── PRE-GAME ──────────────────────────────────────────────────────────
        if (isPreGameState(gameState)) {
            document.getElementById("scorebug-wrapper").style.display = "none";
            document.getElementById("tabs-container").style.display = "none";
            const lab = document.getElementById('live-at-bat');
            if (lab) lab.style.display = 'none';

            // Apply pregame class for full-width layout
            const gameplayEl = document.getElementById('gameplay-info-container');
            if (gameplayEl) gameplayEl.classList.add('pregame');

            const buildPlayerRow = (battingOrder, teamKey) =>
                Array.from({length:9}, (_, i) => {
                    const pid = battingOrder[i];
                    if (!pid) return { name:'', hand:'', field:'', avg:'---' };
                    const player = data.gameData.players[`ID${pid}`];
                    const stats  = data.liveData.boxscore.teams[teamKey].players[`ID${pid}`];
                    return {
                        name:  player?.boxscoreName || '',
                        hand:  player?.batSide?.code || '',
                        field: player?.primaryPosition?.abbreviation || '',
                        avg:   stats?.seasonStats?.batting?.avg || '---'
                    };
                });

            const awayPlayers = buildPlayerRow(awayBattingOrder, 'away');
            const homePlayers = buildPlayerRow(homeBattingOrder, 'home');
            const pitchers = data.gameData.probablePitchers || {};

            const pitcherBlock = (pitcher, hand, seasonStats, players) => {
                const hasP = pitcher?.id;
                const lineupHtml = players.map((p, i) =>
                    `<p class="lineup"><span>${i+1}.</span> <span class="hand">${p.hand}</span> <span style="flex:1;font-size:13px;">${p.name}</span> <span class="field">${p.field}</span><span class="avg">${p.avg}</span></p>`
                ).join('');
                return `
                    <p class="player-position">Probable Pitcher</p>
                    <p class="player-name">${hasP ? `${pitcher.fullName} <span class="starter-hand">${hand}</span>` : 'TBD'}</p>
                    <p class="prob-stats">${hasP ? `${seasonStats?.era||'---'} ERA · ${seasonStats?.inningsPitched||'0'} IP · ${seasonStats?.strikeOuts||'0'} K` : '--- · --- IP · --- K'}</p>
                    ${lineupHtml}`;
            };

            const awayPitcher = pitchers.away;
            const homePitcher = pitchers.home;
            const awayHand    = awayPitcher?.id ? data.gameData.players[`ID${awayPitcher.id}`]?.pitchHand?.code||'' : '';
            const homeHand    = homePitcher?.id ? data.gameData.players[`ID${homePitcher.id}`]?.pitchHand?.code||'' : '';
            const awaySS      = awayPitcher?.id ? data.liveData.boxscore.teams.away.players[`ID${awayPitcher.id}`]?.seasonStats?.pitching : null;
            const homeSS      = homePitcher?.id ? data.liveData.boxscore.teams.home.players[`ID${homePitcher.id}`]?.seasonStats?.pitching : null;

            awayPS.innerHTML = pitcherBlock(awayPitcher, awayHand, awaySS, awayPlayers);
            homePS.innerHTML = pitcherBlock(homePitcher, homeHand, homeSS, homePlayers);
            return;
        }

        // ── LIVE ──────────────────────────────────────────────────────────────
        if (currentPlay) {
            // Remove pregame class if switching from pre-game
            const gameplayEl = document.getElementById('gameplay-info-container');
            if (gameplayEl) gameplayEl.classList.remove('pregame');

            const matchup  = currentPlay.matchup;
            const batter   = matchup?.batter;
            const pitcher  = matchup?.pitcher;
            const allPlayers = {
                ...data.liveData?.boxscore?.teams?.away?.players,
                ...data.liveData?.boxscore?.teams?.home?.players
            };

            // Batter stats
            const batterId   = batter?.id;
            const batterData = batterId ? allPlayers[`ID${batterId}`] : null;
            const batterSeason = batterData?.seasonStats?.batting || {};

            // Pitcher stats
            const pitcherId   = pitcher?.id;
            const pitcherData = pitcherId ? allPlayers[`ID${pitcherId}`] : null;
            const pitcherSeason = pitcherData?.seasonStats?.pitching || {};

            const fmtAvg = (n) => {
                if (!n || n === '---') return '---';
                const f = parseFloat(n);
                return f < 1 ? '.' + String(Math.round(f*1000)).padStart(3,'0') : f.toFixed(3);
            };

            if (batter) {
                awayPS.innerHTML = `
                    <div style="display:flex;align-items:center;gap:6px;margin-bottom:5px;">
                        <img src="https://midfield.mlbstatic.com/v1/people/${batterId}/spots/60"
                            style="width:36px;height:36px;border-radius:50%;border:1.5px solid #bf0d3d;background:#041e42;object-fit:cover;flex-shrink:0;"
                            onerror="this.src='https://img.mlbstatic.com/mlb-photos/image/upload/d_people:generic:headshot:67:current.png/w_60,q_auto:best/v1/people/generic/headshot/67/current.png'">
                        <div style="min-width:0;">
                            <div style="font-weight:700;font-size:11px;color:#041e42;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${batter.fullName}</div>
                            <div style="font-size:9px;color:#bf0d3d;font-weight:600;text-transform:uppercase;letter-spacing:.3px;">Batter</div>
                        </div>
                    </div>
                    <div style="display:flex;gap:4px;">
                        <div style="background:rgba(4,30,66,0.04);border-radius:5px;padding:3px 5px;text-align:center;flex:1;">
                            <div style="font-size:7px;color:rgba(4,30,66,0.4);font-weight:700;text-transform:uppercase;">AVG</div>
                            <div style="font-size:12px;font-weight:700;color:#041e42;">${fmtAvg(batterSeason.avg)}</div>
                        </div>
                        <div style="background:rgba(4,30,66,0.04);border-radius:5px;padding:3px 5px;text-align:center;flex:1;">
                            <div style="font-size:7px;color:rgba(4,30,66,0.4);font-weight:700;text-transform:uppercase;">OPS</div>
                            <div style="font-size:12px;font-weight:700;color:#041e42;">${batterSeason.ops||'---'}</div>
                        </div>
                        <div style="background:rgba(4,30,66,0.04);border-radius:5px;padding:3px 5px;text-align:center;flex:1;">
                            <div style="font-size:7px;color:rgba(4,30,66,0.4);font-weight:700;text-transform:uppercase;">HR</div>
                            <div style="font-size:12px;font-weight:700;color:#041e42;">${batterSeason.homeRuns||'0'}</div>
                        </div>
                    </div>`;
            }

            if (pitcher) {
                homePS.innerHTML = `
                    <div style="display:flex;align-items:center;gap:6px;margin-bottom:5px;">
                        <img src="https://midfield.mlbstatic.com/v1/people/${pitcherId}/spots/60"
                            style="width:36px;height:36px;border-radius:50%;border:1.5px solid rgba(4,30,66,0.3);background:#041e42;object-fit:cover;flex-shrink:0;"
                            onerror="this.src='https://img.mlbstatic.com/mlb-photos/image/upload/d_people:generic:headshot:67:current.png/w_60,q_auto:best/v1/people/generic/headshot/67/current.png'">
                        <div style="min-width:0;">
                            <div style="font-weight:700;font-size:11px;color:#041e42;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${pitcher.fullName}</div>
                            <div style="font-size:9px;color:rgba(4,30,66,0.45);font-weight:600;text-transform:uppercase;letter-spacing:.3px;">Pitcher</div>
                        </div>
                    </div>
                    <div style="display:flex;gap:4px;">
                        <div style="background:rgba(4,30,66,0.04);border-radius:5px;padding:3px 5px;text-align:center;flex:1;">
                            <div style="font-size:7px;color:rgba(4,30,66,0.4);font-weight:700;text-transform:uppercase;">ERA</div>
                            <div style="font-size:12px;font-weight:700;color:#041e42;">${pitcherSeason.era||'---'}</div>
                        </div>
                        <div style="background:rgba(4,30,66,0.04);border-radius:5px;padding:3px 5px;text-align:center;flex:1;">
                            <div style="font-size:7px;color:rgba(4,30,66,0.4);font-weight:700;text-transform:uppercase;">IP</div>
                            <div style="font-size:12px;font-weight:700;color:#041e42;">${pitcherSeason.inningsPitched||'0'}</div>
                        </div>
                        <div style="background:rgba(4,30,66,0.04);border-radius:5px;padding:3px 5px;text-align:center;flex:1;">
                            <div style="font-size:7px;color:rgba(4,30,66,0.4);font-weight:700;text-transform:uppercase;">K</div>
                            <div style="font-size:12px;font-weight:700;color:#041e42;">${pitcherSeason.strikeOuts||'0'}</div>
                        </div>
                    </div>`;
            }

            document.getElementById('scorebug-wrapper').style.display = '';
            renderLiveAtBat(data);
        }
    }

    // ── renderLiveAtBat ───────────────────────────────────────────────────────

    async function renderLiveAtBat(data) {
        // Only show live at-bat widget when the dynamic (Live) tab is active
        const activeTab = document.querySelector('.tab-button.active');
        if (!activeTab || activeTab.id !== 'dynamic-tab') return;

        let container = document.getElementById('live-at-bat');
        if (!container) {
            container = document.createElement('div');
            container.id = 'live-at-bat';
            const gameplayEl = document.getElementById('gameplay-info-container');
            if (gameplayEl?.parentNode) {
                gameplayEl.parentNode.insertBefore(container, gameplayEl.nextSibling);
            } else {
                document.getElementById('popup-container').appendChild(container);
            }
        }

        const status = data.gameData?.status?.detailedState;
        if (isFinalState(status) || isPreGameState(status)) {
            container.style.display = 'none';
            return;
        }
        container.style.display = '';

        const cp      = data.liveData?.plays?.currentPlay;
        const ls      = data.liveData?.linescore;
        const offense = ls?.offense || {};
        if (!cp) { container.style.display = 'none'; return; }

        const batter    = cp.matchup?.batter;
        const pitcher   = cp.matchup?.pitcher;
        const batSide   = cp.matchup?.batSide?.code;
        const pitSide   = cp.matchup?.pitchHand?.code;
        const count     = cp.count || { balls:0, strikes:0, outs:0 };
        const pitches   = cp.playEvents?.filter(e => e.isPitch) || [];
        const batterId  = batter?.id;
        const pitcherId = pitcher?.id;
        const outs      = count.outs ?? 0;
        const half      = ls?.inningHalf === 'Top' ? '▲' : '▼';
        const inningOrd = ls?.currentInningOrdinal || '';

        // Pitcher game stats
        const allPlayers = {
            ...data.liveData?.boxscore?.teams?.away?.players,
            ...data.liveData?.boxscore?.teams?.home?.players
        };
        const pd = allPlayers?.[`ID${pitcherId}`];
        const ps = pd?.stats?.pitching || {};
        const batterData = batterId ? allPlayers[`ID${batterId}`] : null;
        const batterSeason = batterData?.seasonStats?.batting || {};
        const pitcherSeason = pd?.seasonStats?.pitching || {};

        const fmtAvg = (n) => {
            if (!n || n === '---') return '.---';
            const f = parseFloat(n);
            return f < 1 ? '.' + String(Math.round(f*1000)).padStart(3,'0') : f.toFixed(3);
        };
        const lastName = (name) => name ? name.split(' ').pop() : '';

        const hitData = cp.playEvents?.find(e => e?.hitData)?.hitData || null;
        const exitVelo    = hitData?.launchSpeed   ? `${hitData.launchSpeed.toFixed(1)} mph`    : '--';
        const launchAngle = hitData?.launchAngle   ? `${Math.round(hitData.launchAngle)}°`      : '--';
        const distance    = hitData?.totalDistance ? `${Math.round(hitData.totalDistance)} ft`  : '--';
        const resultEvt   = cp.result?.event || '';
        const lastDesc    = pitches[pitches.length-1]?.details?.description || cp.result?.description || '';

        const pitchRows = [...pitches].reverse().map((p, i) => {
            const info     = pitchInfo(p.details?.type?.code);
            const velo     = p.pitchData?.startSpeed?.toFixed(1) ?? '--';
            const spin     = p.pitchData?.breaks?.spinRate ? `${Math.round(p.pitchData.breaks.spinRate)} rpm` : '--';
            const isInPlay = p.details?.isInPlay;
            const isStrike = p.details?.isStrike;
            const isFoul   = p.details?.description?.toLowerCase().includes('foul');
            const resCls   = isInPlay ? 'pr-contact' : isFoul ? 'pr-foul' : isStrike ? 'pr-strike' : 'pr-ball';
            const resLbl   = isInPlay ? 'IN PLAY' : isFoul ? 'FOUL' : isStrike ? 'STR' : 'BALL';
            return `<div class="lab-pitch-row">
                <div class="lab-pitch-num">${pitches.length - i}</div>
                <div class="lab-pitch-badge" style="background:${info.color}">${info.abbr}</div>
                <div class="lab-pitch-type">${info.label}</div>
                <div class="lab-pitch-velo">${velo} mph</div>
                <div class="lab-pitch-spin">${spin}</div>
                <div class="lab-pitch-result ${resCls}">${resLbl}</div>
            </div>`;
        }).join('');

        container.innerHTML = `
            <div class="lab-main-row">
                <div class="lab-zone-col">
                    <div class="lab-zone-label">Strike Zone</div>
                    ${buildStrikeZoneSVG(pitches)}
                    <div class="lab-count-pills">
                        <div class="lab-count-group">
                            ${[0,1,2,3].map(i=>`<div class="lab-dot ball ${i<count.balls?'on':''}"></div>`).join('')}
                            <span class="lab-count-lbl">B</span>
                        </div>
                        <div class="lab-pill-divider"></div>
                        <div class="lab-count-group">
                            ${[0,1,2].map(i=>`<div class="lab-dot strike ${i<count.strikes?'on':''}"></div>`).join('')}
                            <span class="lab-count-lbl">S</span>
                        </div>
                    </div>
                </div>
                <div class="lab-info-col">
                    <div class="lab-players-row">
                        <div class="lab-player-card">
                            <img src="https://midfield.mlbstatic.com/v1/people/${batterId}/spots/60" class="lab-headshot" alt=""
                                onerror="this.src='https://img.mlbstatic.com/mlb-photos/image/upload/d_people:generic:headshot:67:current.png/w_60,q_auto:best/v1/people/generic/headshot/67/current.png'">
                            <div class="lab-player-info">
                                <div class="lab-player-role">Batter</div>
                                <div class="lab-player-name">${lastName(batter?.fullName)}<span class="lab-hand-badge">${batSide==='L'?'L':'R'}</span></div>
                                <div class="lab-count-avg">&nbsp;</div>
                            </div>
                        </div>
                        ${pitcherId && pd ? `<div class="lab-player-card">
                            <img src="https://midfield.mlbstatic.com/v1/people/${pitcherId}/spots/60" class="lab-pitcher-photo" alt=""
                                onerror="this.style.display='none'">
                            <div class="lab-player-info">
                                <div class="lab-player-role">Pitcher${pitSide ? ` · <span style="color:#bf0d3d">${pitSide}HP</span>` : ''}</div>
                                <div class="lab-player-name">${lastName(pitcher?.fullName)}</div>
                                <div style="font-size:9px;color:rgba(4,30,66,0.4);">${ps.numberOfPitches ?? pitches.length} PC</div>
                            </div>
                        </div>` : ''}
                    </div>
                    <div class="lab-igstats-row">
                        <div class="lab-igstat-group">
                            <div class="lab-igstat"><span class="lab-igstat-lbl">AVG</span><span class="lab-igstat-val">${fmtAvg(batterSeason.avg)}</span></div>
                            <div class="lab-igstat"><span class="lab-igstat-lbl">OPS</span><span class="lab-igstat-val">${batterSeason.ops||'---'}</span></div>
                            <div class="lab-igstat"><span class="lab-igstat-lbl">HR</span><span class="lab-igstat-val">${batterSeason.homeRuns||'0'}</span></div>
                        </div>
                        ${pd ? `<div style="width:1px;background:rgba(4,30,66,0.08);margin:0 2px;"></div>
                        <div class="lab-igstat-group">
                            <div class="lab-igstat"><span class="lab-igstat-lbl">ERA</span><span class="lab-igstat-val">${pitcherSeason.era||'---'}</span></div>
                            <div class="lab-igstat"><span class="lab-igstat-lbl">IP</span><span class="lab-igstat-val">${ps.inningsPitched||'0.0'}</span></div>
                            <div class="lab-igstat"><span class="lab-igstat-lbl">K</span><span class="lab-igstat-val">${ps.strikeOuts||'0'}</span></div>
                        </div>` : ''}
                    </div>
                    <div class="lab-log-header">
                        <span class="lab-log-title">This At-Bat</span>
                        <span class="lab-pitch-count-badge">${pitches.length} pitch${pitches.length!==1?'es':''}</span>
                    </div>
                    <div class="lab-pitchlog">
                        ${pitchRows || '<div style="font-size:10px;color:#999;padding:3px 0;">Waiting for first pitch…</div>'}
                    </div>
                </div>
            </div>
            ${(resultEvt || lastDesc || exitVelo !== '--') ? `
            <div class="lab-result-section">
                ${resultEvt ? `<div class="lab-play-event">${resultEvt}</div>` : ''}
                ${lastDesc  ? `<div class="lab-play-desc">${lastDesc}</div>`   : ''}
                <div class="lab-statcast-row">
                    <div class="lab-sc-chip"><span class="lab-sc-lbl">Exit Velo</span><span class="lab-sc-val">${exitVelo}</span></div>
                    <div class="lab-sc-chip"><span class="lab-sc-lbl">Launch Angle</span><span class="lab-sc-val">${launchAngle}</span></div>
                    <div class="lab-sc-chip"><span class="lab-sc-lbl">Distance</span><span class="lab-sc-val">${distance}</span></div>
                </div>
            </div>` : ''}
        `;

        if (batterId) {
            fetchBatterAvgAtCount(batterId, count.balls, count.strikes).then(avg => {
                const el = container.querySelector('.lab-count-avg');
                if (!el || avg == null) return;
                const color = avg >= .280 ? '#10b981' : avg >= .220 ? '#eab308' : '#ef4444';
                const fmt   = avg < 1 ? '.' + String(Math.round(avg*1000)).padStart(3,'0') : avg.toFixed(3);
                el.innerHTML = `<span style="color:${color};font-weight:700;">${fmt}</span> avg ${count.balls}-${count.strikes}`;
            });
        }
    }

    // ── fetchGameData (inning text refresh + scorebug + pitch data) ───────────

    async function fetchGameData(pk) {
        try {
            const response = await fetch(`https://statsapi.mlb.com/api/v1.1/game/${pk}/feed/live`);
            const data = await response.json();

            updateScorebug(data);
            updatePlayerInfo(data);

            const game       = data.gameData;
            const linescore  = data.liveData.linescore;
            const statusText = game.status.detailedState;
            let inningText = "", inningStyle = "";

            if (statusText === "Suspended: Rain" || statusText === "Suspended") {
                inningText = "SUSP"; inningStyle = "color:#bf0d3d;";
            } else if (statusText === "Cancelled" || statusText === "Cancelled: Rain") {
                inningText = "CXLD"; inningStyle = "color:#bf0d3d;";
            } else if (statusText === "Postponed") {
                inningText = "PPD"; inningStyle = "color:#bf0d3d;";
            } else if (isFinalState(statusText)) {
                inningText  = getFinalInningText(linescore);
                inningStyle = "color:#bf0d3d;";
            } else if (isPreGameState(statusText)) {
                inningText  = formatGameTime(game.datetime.dateTime);
                inningStyle = "color:rgba(4,30,66,0.55);font-size:11px;";
            } else {
                const half = linescore.inningHalf === "Top" ? "▲" : "▼";
                inningText = `${half} ${linescore.currentInning||''}`;
                inningStyle = "color:#bf0d3d;";
            }

            inningInfo.textContent = inningText;
            inningInfo.style       = inningStyle;

            // Hide live-at-bat for non-live states
            if (isFinalState(statusText) || isPreGameState(statusText)) {
                const lab = document.getElementById('live-at-bat');
                if (lab) lab.style.display = 'none';
            }

        } catch (err) {
            console.error("fetchGameData error:", err);
        }
    }

    // ── updateScorebug ────────────────────────────────────────────────────────

    function updateScorebug(data) {
        const statusText = data.gameData.status.detailedState;

        if (isFinalState(statusText) || statusText === "Cancelled" || statusText === "Cancelled: Rain") {
            scorebugContainer.innerHTML = "";
            document.getElementById("scorebug-wrapper").style.display = "none";
            return;
        }

        if (!data.liveData?.plays?.currentPlay) return;

        document.getElementById("scorebug-wrapper").style.display = "";

        const cp = data.liveData.plays.currentPlay;
        let count = cp.count || { balls:0, strikes:0, outs:0 };
        const endEvents = ["strikeout","walk","hit","field_out"];
        if (isFinalState(statusText) || isPreGameState(statusText) || endEvents.includes(cp.result?.eventType)) {
            count = { balls:0, strikes:0, outs: count.outs };
        }

        const onBase = data.liveData?.linescore?.offense || {};
        scorebugContainer.innerHTML = `
            <div class="scorebug">
                ${generatedSVGField(count, onBase)}
                <div class="balls-strikes">${count.balls}–${count.strikes}</div>
            </div>`;
    }

    // ── generatedSVGField (scorebug) ──────────────────────────────────────────

    function generatedSVGField(count, onBase) {
        const outFill  = (n) => count.outs >= n ? '#bf0d3d' : '#f0f4f8';
        const baseFill = (b) => b ? '#bf0d3d' : '#f0f4f8';
        return `
            <svg width="110" height="110" viewBox="0 0 58 79" fill="none" xmlns="http://www.w3.org/2000/svg">
                <circle cx="13" cy="61" r="6" fill="${outFill(1)}" stroke="#bf0d3d" stroke-width="1.5" opacity="0.85"/>
                <circle cx="30" cy="61" r="6" fill="${outFill(2)}" stroke="#bf0d3d" stroke-width="1.5" opacity="0.85"/>
                <circle cx="47" cy="61" r="6" fill="${outFill(3)}" stroke="#bf0d3d" stroke-width="1.5" opacity="0.85"/>
                <rect x="17.6" y="29.7" width="14" height="14" transform="rotate(45 17.6 29.7)" fill="${baseFill(onBase.third)}"  stroke="#bf0d3d" stroke-width="1.5" opacity="0.85"/>
                <rect x="29.4" y="17.7" width="14" height="14" transform="rotate(45 29.4 17.7)" fill="${baseFill(onBase.second)}" stroke="#bf0d3d" stroke-width="1.5" opacity="0.85"/>
                <rect x="41.6" y="29.7" width="14" height="14" transform="rotate(45 41.6 29.7)" fill="${baseFill(onBase.first)}"  stroke="#bf0d3d" stroke-width="1.5" opacity="0.85"/>
            </svg>`;
    }

    function renderLivePitchData() { /* removed — handled by #live-at-bat widget */ }

    // ── Private helpers: video buttons + top performers ───────────────────────

    function _createVideoButtons(data, gameplayEl) {
        if (document.getElementById("video-buttons")) return;

        const container = document.createElement("div");
        container.id = "video-buttons";
        container.classList.add("video-buttons-section");

        container.innerHTML = `
            <div style="display:flex;justify-content:center;gap:12px;padding:12px 0;">
                <button id="game-recap-btn" style="
                    background:linear-gradient(135deg,rgba(248,249,250,0.95),rgba(217,230,243,0.95));
                    border:1px solid rgba(4,30,66,0.1);padding:6px 12px;border-radius:10px;
                    font-family:'Rubik',sans-serif;font-size:11px;font-weight:700;cursor:pointer;
                    box-shadow:0 2px 8px rgba(0,0,0,0.1);display:flex;align-items:center;gap:6px;
                    transition:all 0.2s;">
                    <img src="assets/icons/video-camera.png" style="width:14px;height:14px;" onerror="this.style.display='none'"/>
                    Game Recap
                </button>
                <button id="condensed-game-btn" style="
                    background:linear-gradient(135deg,rgba(248,249,250,0.95),rgba(217,230,243,0.95));
                    border:1px solid rgba(4,30,66,0.1);padding:6px 12px;border-radius:10px;
                    font-family:'Rubik',sans-serif;font-size:11px;font-weight:700;cursor:pointer;
                    box-shadow:0 2px 8px rgba(0,0,0,0.1);display:flex;align-items:center;gap:6px;
                    transition:all 0.2s;">
                    <img src="assets/icons/video-camera.png" style="width:14px;height:14px;" onerror="this.style.display='none'"/>
                    Condensed Game
                </button>
            </div>`;

        gameplayEl.parentNode.insertBefore(container, gameplayEl.nextSibling);

        // Fetch and wire video
        (async () => {
            try {
                const res = await fetch(`https://statsapi.mlb.com/api/v1/game/${data.gamePk}/content`);
                const contentData = await res.json();
                const items = contentData?.highlights?.highlights?.items || [];
                const recap     = items[0];
                const condensed = items[1];

                const extractMp4 = (h) => {
                    if (!h?.playbacks) return null;
                    const mp4s = h.playbacks.filter(p => p.url?.toLowerCase().endsWith('.mp4'));
                    if (!mp4s.length) return null;
                    for (const q of ['2500K','1800K','1200K','800K']) {
                        const m = mp4s.find(p => p.name?.includes(q));
                        if (m) return m.url;
                    }
                    return mp4s[0].url;
                };

                const openVideo = (highlight, url) => (e) => {
                    e.stopPropagation();
                    if (!url) { alert('Video not available'); return; }
                    const vm = initializeVideoMatcher();
                    if (vm?.createVideoPlayer) {
                        const tmp = document.createElement('div');
                        tmp.style.position = 'relative';
                        document.body.appendChild(tmp);
                        vm.createVideoPlayer({ title: highlight.title||'', url, id: highlight.id||'' }, tmp, e.target);
                        setTimeout(() => tmp.parentNode && tmp.remove(), 1000);
                    } else {
                        window.open(url, '_blank');
                    }
                };

                const recapBtn     = document.getElementById("game-recap-btn");
                const condensedBtn = document.getElementById("condensed-game-btn");
                if (recapBtn)     recapBtn.addEventListener('click',     openVideo(recap||{},     extractMp4(recap)));
                if (condensedBtn) condensedBtn.addEventListener('click', openVideo(condensed||{}, extractMp4(condensed)));

                const hover = (btn) => {
                    btn.addEventListener('mouseover', () => { btn.style.transform='scale(1.05)'; btn.style.boxShadow='0 4px 14px rgba(0,0,0,0.15)'; });
                    btn.addEventListener('mouseleave', () => { btn.style.transform=''; btn.style.boxShadow='0 2px 8px rgba(0,0,0,0.1)'; });
                };
                if (recapBtn)     hover(recapBtn);
                if (condensedBtn) hover(condensedBtn);
            } catch(e) { console.warn('Video fetch failed:', e); }
        })();
    }

    function _createTopPerformers(data, gameplayEl) {
        if (document.getElementById("top-performers")) return;

        const container = document.createElement("div");
        container.id = "top-performers";
        container.classList.add("top-performers-section");

        const performers = (data.liveData.boxscore.topPerformers || []).slice(0, 3);

        const getStats = (player) => {
            if (!player?.player) return { name:"N/A", stats:"No stats", imageUrl:"" };
            const name     = player.player.person.fullName;
            const pid      = player.player.person.id;
            const imageUrl = `https://img.mlbstatic.com/mlb-photos/image/upload/d_people:generic:headshot:67:current.png/w_100,h_100,c_fill,q_auto:best/v1/people/${pid}/headshot/67/current`;
            let stats = "No stats";

            const isPitcher = player.type === "pitcher" || player.type === "starter";
            const isHitter  = player.type === "hitter";

            if (isPitcher) {
                const p = player.player.stats?.pitching;
                if (p?.summary) { stats = p.summary; }
                else if (p)     { stats = `${p.inningsPitched||'0'} IP, ${p.hits||0} H, ${p.earnedRuns||0} ER, ${p.strikeOuts||0} K`; }
            } else if (isHitter) {
                const b = player.player.stats?.batting;
                if (b?.summary) { stats = b.summary; }
                else if (b)     { stats = `${b.hits||0}-${b.atBats||0}, ${b.runs||0} R, ${b.rbi||0} RBI`; }
            } else {
                stats = player.player.stats?.pitching?.summary || player.player.stats?.batting?.summary || "No stats";
            }
            return { name, stats, imageUrl };
        };

        const rows = performers.map(p => {
            const { name, stats, imageUrl } = getStats(p);
            const parts = name.split(" ");
            const first = parts[0];
            const last  = parts.slice(1).join(" ");
            return `
                <div class="top-performer">
                    <img src="${imageUrl}" alt="${name}" class="performer-image"
                        onerror="this.src='https://content.mlb.com/images/headshots/current/60x60/generic_player@2x.png'">
                    <p class="performer-name"><span>${first}</span> <span>${last}</span></p>
                    <p class="performer-stats">${stats}</p>
                </div>`;
        }).join('');

        container.innerHTML = `
            <div style="text-align:center;font-weight:700;font-size:10px;color:rgba(4,30,66,0.4);text-transform:uppercase;letter-spacing:1.5px;margin-bottom:6px;">Top Performers</div>
            <div class="top-performers-row">${rows}</div>`;

        const videoButtonsEl = document.getElementById("video-buttons");
        const insertAfter = videoButtonsEl || gameplayEl;
        insertAfter.parentNode.insertBefore(container, insertAfter.nextSibling);
    }

    // ── Box Score ─────────────────────────────────────────────────────────────

    async function loadBoxScore() {
        boxScoreContainer.style.display = "block";
        boxScoreContainer.innerHTML = `<p style="text-align:center;padding:20px;color:#555;font-family:'Rubik',sans-serif;">Loading Box Score…</p>`;

        if (!gamePk) { boxScoreContainer.innerHTML = "<p>No gamePk found.</p>"; return; }

        async function fetchAbbr(teamId) {
            try {
                const r = await fetch(`https://statsapi.mlb.com/api/v1/teams/${teamId}`);
                const d = await r.json();
                return d.teams[0].abbreviation || "??";
            } catch { return "??"; }
        }

        try {
            const [gameRes, lineupRes] = await Promise.all([
                fetch(`https://statsapi.mlb.com/api/v1.1/game/${gamePk}/feed/live`),
                fetch(`https://statsapi.mlb.com/api/v1/schedule?hydrate=lineups&sportId=1&gamePk=${gamePk}`)
            ]);
            const gameData   = await gameRes.json();
            const lineupData = await lineupRes.json();

            const linescore = gameData?.liveData?.linescore;
            const boxscore  = gameData?.liveData?.boxscore;
            if (!linescore || !boxscore) {
                boxScoreContainer.innerHTML = "<p>Box score data not available.</p>";
                return;
            }

            const awayTeamId = gameData.gameData.teams.away.id;
            const homeTeamId = gameData.gameData.teams.home.id;
            const [awayAbbr, homeAbbr] = await Promise.all([fetchAbbr(awayTeamId), fetchAbbr(homeTeamId)]);

            const awayTeam  = gameData.gameData.teams.away;
            const homeTeam  = gameData.gameData.teams.home;
            const awayStats = boxscore.teams.away;
            const homeStats = boxscore.teams.home;
            const innings   = linescore.innings;

            const gameInfo    = lineupData.dates?.[0]?.games?.[0];
            const awayLineup  = gameInfo?.teams?.away?.lineup || [];
            const homeLineup  = gameInfo?.teams?.home?.lineup || [];

            const getPlayerStats = (playerId, teamStats, isHitter=true) => {
                const player = teamStats.players[`ID${playerId}`];
                if (!player) return null;
                if (isHitter) {
                    const g = player.stats?.batting || {};
                    const s = player.seasonStats?.batting || {};
                    return { name:player.person?.fullName||'Unknown', position:player.position?.abbreviation||'',
                             ab:g.atBats||0, r:g.runs||0, h:g.hits||0, rbi:g.rbi||0,
                             bb:g.baseOnBalls||0, so:g.strikeOuts||0, seasonAvg:s.avg||'.000' };
                } else {
                    const g = player.stats?.pitching || {};
                    const s = player.seasonStats?.pitching || {};
                    return { name:player.person?.fullName||'Unknown', position:player.position?.abbreviation||'P',
                             ip:g.inningsPitched||'0.0', h:g.hits||0, r:g.runs||0, er:g.earnedRuns||0,
                             bb:g.baseOnBalls||0, so:g.strikeOuts||0, seasonEra:s.era||'0.00' };
                }
            };

            const getAllBatters = (teamStats) =>
                (teamStats.batters||[]).reduce((acc, id) => {
                    const player = teamStats.players[`ID${id}`];
                    if (!player?.stats?.batting) return acc;
                    const g = player.stats.batting;
                    const s = player.seasonStats?.batting || {};
                    acc.push({ id, name:player.person?.fullName||'Unknown', position:player.position?.abbreviation||'',
                               battingOrder:player.battingOrder||99, ab:g.atBats||0, r:g.runs||0, h:g.hits||0,
                               rbi:g.rbi||0, bb:g.baseOnBalls||0, so:g.strikeOuts||0, seasonAvg:s.avg||'.000' });
                    return acc;
                }, []).sort((a,b) => a.battingOrder - b.battingOrder);

            const shortName = (name) => {
                const parts   = name.split(' ');
                const SUFFIX  = ['Jr.','Jr','Sr.','Sr','II','III','IV','V'];
                const lastPart = parts[parts.length-1];
                const last    = SUFFIX.includes(lastPart) && parts.length>2 ? parts[parts.length-2] : lastPart;
                return name.length > 15 && parts.length >= 2 ? `${parts[0][0]}. ${last}` : name;
            };

            const battingRow = (player, order, teamStats) => {
                const id    = player.person?.id || player.id;
                let stats   = id ? getPlayerStats(id, teamStats, true) : null;
                if (!stats && player.person?.fullName) {
                    stats = getAllBatters(teamStats).find(b => b.name === player.person.fullName) || null;
                }
                const name  = player.person?.fullName || player.name || 'Unknown';
                const pos   = player.position?.abbreviation || '';
                if (!stats) return `<tr><td class="batting-order">${order}</td><td class="player-name-boxscore" title="${name}">${name}</td><td class="position">${pos}</td><td>0</td><td>0</td><td>0</td><td>0</td><td>0</td><td>0</td><td>.000</td></tr>`;
                return `<tr><td class="batting-order">${order}</td><td class="player-name-boxscore" title="${stats.name}">${shortName(stats.name)}</td><td class="position">${stats.position}</td><td>${stats.ab}</td><td>${stats.r}</td><td>${stats.h}</td><td>${stats.rbi}</td><td>${stats.bb}</td><td>${stats.so}</td><td>${stats.seasonAvg}</td></tr>`;
            };

            const pitchingRow = (pitcher, teamStats) => {
                const id    = pitcher.person?.id;
                const stats = getPlayerStats(id, teamStats, false);
                const name  = pitcher.person?.fullName || 'Unknown';
                const pos   = pitcher.position?.abbreviation || 'P';
                if (!stats) return `<tr class="pitcher-row"><td class="batting-order">P</td><td class="player-name-boxscore">${name}</td><td class="position">${pos}</td><td>-</td><td>-</td><td>-</td><td>-</td><td>-</td><td>-</td><td>-</td></tr>`;
                return `<tr class="pitcher-row"><td class="batting-order">P</td><td class="player-name-boxscore" title="${stats.name}">${shortName(stats.name)}</td><td class="position">${stats.position}</td><td>${stats.ip}</td><td>${stats.h}</td><td>${stats.r}</td><td>${stats.er}</td><td>${stats.bb}</td><td>${stats.so}</td><td>${stats.seasonEra}</td></tr>`;
            };

            const teamContent = (lineup, teamStats) => {
                let batters = [];
                if (lineup?.length) {
                    batters = lineup.filter(p => !['P','Pitcher'].includes(p.position?.abbreviation));
                } else {
                    batters = getAllBatters(teamStats)
                        .filter(b => !['P','Pitcher'].includes(b.position))
                        .map(b => ({ person:{id:b.id,fullName:b.name}, position:{abbreviation:b.position} }));
                }
                const pitchers = (teamStats.pitchers||[]).map(id => {
                    const p = teamStats.players[`ID${id}`];
                    return p ? { person:p.person, position:p.position } : null;
                }).filter(Boolean);

                return `
                    <div class="stats-table-wrapper">
                        <div class="section-subtitle">Batting</div>
                        <table class="stats-table">
                            <thead><tr><th>#</th><th>Player</th><th>Pos</th><th>AB</th><th>R</th><th>H</th><th>RBI</th><th>BB</th><th>K</th><th>AVG</th></tr></thead>
                            <tbody>${batters.map((p,i) => battingRow(p, i+1, teamStats)).join('')}</tbody>
                        </table>
                        <div class="section-subtitle">Pitching</div>
                        <table class="stats-table">
                            <thead><tr><th></th><th>Pitcher</th><th>Pos</th><th>IP</th><th>H</th><th>R</th><th>ER</th><th>BB</th><th>K</th><th>ERA</th></tr></thead>
                            <tbody>${pitchers.map(p => pitchingRow(p, teamStats)).join('')}</tbody>
                        </table>
                    </div>`;
            };

            boxScoreContainer.innerHTML = `
            <style>
                .boxscore-container { width:100%; max-width:100%; font-family:'Rubik',sans-serif; background:#f0f4f8; }
                .linescore-wrapper { padding:8px; background:white; border-bottom:2px solid rgba(4,30,66,0.08); }
                .boxscore-table { width:100%; border-collapse:collapse; background:white; border-radius:6px; overflow:hidden; box-shadow:0 2px 8px rgba(4,30,66,0.1); table-layout:fixed; }
                .boxscore-table thead { background:#041e42; }
                .boxscore-table th { padding:6px 2px; text-align:center; font-weight:700; font-size:8px; color:white; border-right:1px solid rgba(255,255,255,0.15); }
                .boxscore-table th:last-child { border-right:none; }
                .boxscore-table td { padding:6px 2px; text-align:center; border-right:1px solid rgba(4,30,66,0.06); font-weight:600; color:#041e42; font-size:9px; }
                .boxscore-table tbody tr:hover { background:rgba(191,13,61,0.05); }
                .team-name { display:flex; align-items:center; justify-content:center; gap:3px; }
                .team-logo-boxscore { width:16px; height:16px; }
                .total-stats { background:rgba(191,13,61,0.1) !important; font-weight:800; }
                .tab-navigation { display:flex; background:white; border-bottom:2px solid #041e42; }
                .tab-button-boxscore { flex:1; display:flex; align-items:center; justify-content:center; gap:6px; padding:10px 6px; background:rgba(4,30,66,0.03); border:none; cursor:pointer; font-family:'Rubik',sans-serif; font-weight:600; font-size:10px; color:rgba(4,30,66,0.5); transition:all 0.2s; border-bottom:2px solid transparent; }
                .tab-button-boxscore:hover { background:rgba(4,30,66,0.07); color:#041e42; }
                .tab-button-boxscore.active { background:white; border-bottom-color:#bf0d3d; color:#bf0d3d; }
                .tab-button-boxscore img { width:18px; height:18px; }
                .tab-content { display:none; }
                .tab-content.active { display:block; }
                .stats-table-wrapper { padding:10px; }
                .section-subtitle { background:rgba(4,30,66,0.06); padding:6px 10px; font-weight:700; font-size:10px; color:#041e42; border-left:3px solid #bf0d3d; margin-bottom:6px; margin-top:12px; }
                .section-subtitle:first-child { margin-top:0; }
                .stats-table { width:100%; border-collapse:collapse; font-size:10px; background:white; border-radius:6px; overflow:hidden; box-shadow:0 1px 4px rgba(4,30,66,0.08); }
                .stats-table thead { background:rgba(4,30,66,0.05); }
                .stats-table th { padding:6px 3px; text-align:center; font-weight:700; font-size:8px; color:#041e42; border-bottom:1px solid rgba(4,30,66,0.1); }
                .stats-table td { padding:5px 3px; text-align:center; border-bottom:1px solid rgba(4,30,66,0.05); font-weight:500; }
                .stats-table tbody tr:hover { background:rgba(191,13,61,0.04); }
                .stats-table tbody tr:last-child td { border-bottom:none; }
                .player-name-boxscore { text-align:left !important; font-weight:700; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; max-width:120px; }
                .batting-order { font-weight:800; color:#041e42; background:rgba(4,30,66,0.08); }
                .position { font-weight:700; font-size:8px; color:rgba(4,30,66,0.6); }
                .pitcher-row { background:rgba(191,13,61,0.03); }
                .pitcher-row .batting-order { background:rgba(191,13,61,0.12); }
                .stats-table th:nth-child(2), .stats-table td:nth-child(2) { width:28%; text-align:left; }
            </style>
            <div class="boxscore-container">
                <div class="linescore-wrapper">
                    <table class="boxscore-table">
                        <thead><tr>
                            <th>Team</th>
                            ${innings.map((_,i) => `<th>${i+1}</th>`).join('')}
                            <th>R</th><th>H</th><th>E</th>
                        </tr></thead>
                        <tbody>
                            <tr>
                                <td class="team-name"><img src="https://www.mlbstatic.com/team-logos/${awayTeamId}.svg" alt="${awayAbbr}" class="team-logo-boxscore"></td>
                                ${innings.map(inn => `<td>${inn.away?.runs ?? '--'}</td>`).join('')}
                                <td class="total-stats">${linescore.teams.away.runs ?? '--'}</td>
                                <td class="total-stats">${linescore.teams.away.hits ?? '--'}</td>
                                <td class="total-stats">${linescore.teams.away.errors ?? '--'}</td>
                            </tr>
                            <tr>
                                <td class="team-name"><img src="https://www.mlbstatic.com/team-logos/${homeTeamId}.svg" alt="${homeAbbr}" class="team-logo-boxscore"></td>
                                ${innings.map(inn => `<td>${inn.home?.runs ?? '--'}</td>`).join('')}
                                <td class="total-stats">${linescore.teams.home.runs ?? '--'}</td>
                                <td class="total-stats">${linescore.teams.home.hits ?? '--'}</td>
                                <td class="total-stats">${linescore.teams.home.errors ?? '--'}</td>
                            </tr>
                        </tbody>
                    </table>
                </div>
                <div class="tab-navigation">
                    <button class="tab-button-boxscore active" data-tab="away">
                        <img src="https://www.mlbstatic.com/team-logos/${awayTeamId}.svg" alt="${awayTeam.name}">
                        <span>${awayTeam.name}</span>
                    </button>
                    <button class="tab-button-boxscore" data-tab="home">
                        <img src="https://www.mlbstatic.com/team-logos/${homeTeamId}.svg" alt="${homeTeam.name}">
                        <span>${homeTeam.name}</span>
                    </button>
                </div>
                <div class="tab-content active" id="away-content">${teamContent(awayLineup, awayStats)}</div>
                <div class="tab-content" id="home-content">${teamContent(homeLineup, homeStats)}</div>
            </div>`;

            // Tab handlers
            boxScoreContainer.querySelectorAll('.tab-button-boxscore').forEach(btn => {
                btn.addEventListener('click', function() {
                    boxScoreContainer.querySelectorAll('.tab-button-boxscore').forEach(b => b.classList.remove('active'));
                    boxScoreContainer.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
                    this.classList.add('active');
                    boxScoreContainer.querySelector(`#${this.dataset.tab}-content`)?.classList.add('active');
                });
            });

        } catch (err) {
            console.error("loadBoxScore error:", err);
            boxScoreContainer.innerHTML = "<p>Error loading box score.</p>";
        }
    }

    // ── All Plays ─────────────────────────────────────────────────────────────

    let allPlaysRefreshInterval = null;
    let lastPlayCount = 0;
    let allPlaysRefreshActive = false;

    async function loadAllPlays() {
        let container = document.getElementById('all-plays-container');
        if (!container) {
            container = document.createElement('div');
            container.id = 'all-plays-container';
            document.getElementById('popup-container').appendChild(container);
        }

        try {
            const response = await fetch(`https://statsapi.mlb.com/api/v1.1/game/${gamePk}/feed/live`);
            const gameData = await response.json();
            window.cachedGameData = gameData;

            const allPlays   = gameData.liveData?.plays?.allPlays || [];
            const gameInfo   = gameData.gameData;
            const gameStatus = gameData.gameData?.status?.detailedState;
            const isLive     = isLiveState(gameStatus);

            const currentCount = allPlays.length;
            const hasNew = currentCount > lastPlayCount;
            lastPlayCount = currentCount;

            if (hasNew || container.children.length === 0) {
                container.innerHTML = '';

                // Header
                if (gameInfo?.venue?.name) {
                    const header = document.createElement('div');
                    header.className = 'game-start-item';
                    const dt = new Date(gameInfo.datetime?.dateTime || gameInfo.gameDate);
                    const city  = gameInfo.venue?.location?.city || '';
                    const state = gameInfo.venue?.location?.state || '';
                    header.innerHTML = `
                        <div style="font-size:11px;opacity:0.7;font-family:'Rubik';">First Pitch</div>
                        <div style="font-size:18px;font-weight:700;font-family:'Rubik';">${dt.toLocaleTimeString([],{hour:'2-digit',minute:'2-digit'})} · ${gameInfo.venue.name}</div>
                        <div style="font-size:11px;opacity:0.6;font-family:'Rubik';">${city}${state ? ', '+state : ''}</div>`;
                    container.appendChild(header);
                }

                [...allPlays].reverse().forEach((play, i) => {
                    setTimeout(() => {
                        const item = createPlayItem(play, gameData);
                        container.appendChild(item);
                    }, i * 30);
                });
            }

            // Auto-refresh
            if (isLive && !allPlaysRefreshActive) {
                allPlaysRefreshActive = true;
                allPlaysRefreshInterval = setInterval(async () => {
                    if (document.querySelector('.tab-button.active')?.id !== 'all-plays-tab') return;
                    delete window.cachedGameData;
                    await loadAllPlays();
                }, 10000);
            } else if (!isLive && allPlaysRefreshInterval) {
                clearInterval(allPlaysRefreshInterval);
                allPlaysRefreshInterval = null;
                allPlaysRefreshActive = false;
            }

        } catch (err) {
            console.error("loadAllPlays error:", err);
            container.innerHTML = '<div style="text-align:center;padding:20px;color:#666;">Error loading plays.</div>';
        }
    }

    function createPlayItem(play, gameData) {
        const div = document.createElement('div');
        div.className = 'play-item';

        const inning    = play.about?.inning || 1;
        const isTop     = play.about?.isTopInning;
        const inningTxt = `${isTop?'Top':'Bot'} ${inning}`;
        const playerId  = play.matchup?.batter?.id;
        const playerName = (() => {
            if (!playerId || !gameData.gameData?.players) return 'Unknown';
            const p = gameData.gameData.players[`ID${playerId}`];
            return p ? `${p.firstName} ${p.lastName}` : 'Unknown';
        })();

        const eventIcon = getEventIcon(play.result?.event);
        const baserunners = {
            first:  !!play.matchup?.postOnFirst,
            second: !!play.matchup?.postOnSecond,
            third:  !!play.matchup?.postOnThird
        };
        const count = {
            balls:   play.count?.balls   || 0,
            strikes: play.count?.strikes || 0,
            outs:    play.count?.outs    || 0
        };

        const statcastEvent = play.playEvents?.find(e => e?.hitData) || {};
        const sd = statcastEvent.hitData || {};
        const exitVelo    = sd.launchSpeed    ? `${Math.round(sd.launchSpeed)} mph` : '--';
        const launchAngle = sd.launchAngle    ? `${Math.round(sd.launchAngle)}°`  : '--';
        const distance    = sd.totalDistance  ? `${Math.round(sd.totalDistance)} ft` : '--';

        div.innerHTML = `
            <div class="inning-indicator" style="position:absolute;top:7px;left:7px;background:#bf0d3d;color:white;padding:2px 6px;border-radius:4px;font-size:11px;font-weight:700;">${inningTxt}</div>
            <div style="flex-shrink:0;margin-right:10px;margin-left:50px;position:relative;">
                <img style="width:52px;height:52px;border-radius:50%;border:2px solid #bf0d3d;background:#041e42;object-fit:cover;"
                    src="https://midfield.mlbstatic.com/v1/people/${playerId}/spots/60" alt="${playerName}">
                <div style="position:absolute;bottom:-4px;right:-4px;width:22px;height:22px;border-radius:50%;background:#bf0d3d;display:flex;align-items:center;justify-content:center;font-size:9px;font-weight:800;color:white;border:2px solid white;">${eventIcon}</div>
            </div>
            <div class="content-wrapper">
                <div class="play-details" style="flex:1;margin-top:4px;">
                    <div style="border:2px solid #041e42;color:#041e42;padding:3px 8px;border-radius:999px;font-weight:700;font-size:14px;display:inline-block;margin-bottom:4px;">${play.result?.event||'Unknown'}</div>
                    <p style="color:#333;font-size:13px;line-height:1.35;margin:0 0 6px;font-weight:400;">${play.result?.description||'No description'}</p>
                    <div class="statcast-stats">
                        <div class="stat-item"><div style="font-size:9px;color:rgba(4,30,66,0.5);font-weight:700;text-transform:uppercase;">Exit Velo</div><div style="font-size:13px;font-weight:800;color:#bf0d3d;">${exitVelo}</div></div>
                        <div class="stat-item"><div style="font-size:9px;color:rgba(4,30,66,0.5);font-weight:700;text-transform:uppercase;">Angle</div><div style="font-size:13px;font-weight:800;color:#bf0d3d;">${launchAngle}</div></div>
                        <div class="stat-item"><div style="font-size:9px;color:rgba(4,30,66,0.5);font-weight:700;text-transform:uppercase;">Distance</div><div style="font-size:13px;font-weight:800;color:#bf0d3d;">${distance}</div></div>
                    </div>
                </div>
                <div class="game-situation">
                    <div style="font-size:11px;font-weight:700;color:#bf0d3d;">${count.balls}-${count.strikes}</div>
                    ${generateSVGField(count, baserunners)}
                </div>
            </div>`;
        return div;
    }

    // ── Scoring Plays ─────────────────────────────────────────────────────────

    let scoringPlaysRefreshInterval = null;

    async function loadScoringPlays() {
        let container = document.getElementById('scoring-plays-container');
        if (!container) {
            container = document.createElement('div');
            container.id = 'scoring-plays-container';
            container.style.cssText = 'width:100%;padding:8px;background:#f0f4f8;font-family:Rubik,sans-serif;';
            document.getElementById('popup-container').appendChild(container);
        }

        try {
            const response = await fetch(`https://statsapi.mlb.com/api/v1.1/game/${gamePk}/feed/live`);
            const gameData = await response.json();
            window.cachedGameData = gameData;

            const statusText  = gameData.gameData?.status?.detailedState || '';
            const isLive      = isLiveState(statusText);
            const scoringPlays = gameData.liveData?.plays?.scoringPlays || [];
            const allPlays     = gameData.liveData?.plays?.allPlays || [];
            const gameInfo     = gameData.gameData;

            if (scoringPlaysRefreshInterval) {
                clearInterval(scoringPlaysRefreshInterval);
                scoringPlaysRefreshInterval = null;
            }

            if (isLive) {
                scoringPlaysRefreshInterval = setInterval(async () => {
                    delete window.cachedGameData;
                    await loadScoringPlays();
                }, 30000);
            }

            container.innerHTML = '';

            // Status bar
            const statusBar = document.createElement('div');
            statusBar.style.cssText = `text-align:center;padding:6px;margin-bottom:8px;border-radius:6px;font-weight:700;font-size:12px;font-family:'Rubik',sans-serif;${isLive?'background:#041e42;color:white;':'background:#041e42;color:white;'}`;
            statusBar.textContent = isLive ? '🔴 LIVE — auto-refreshing' : `Status: ${statusText}`;
            container.appendChild(statusBar);

            if (!scoringPlays.length) {
                const msg = document.createElement('p');
                msg.style.cssText = 'text-align:center;color:#555;margin-top:16px;font-family:Rubik,sans-serif;';
                msg.textContent = 'No scoring plays yet.';
                container.appendChild(msg);
                return;
            }

            scoringPlays.forEach((idx, i) => {
                const play = allPlays[idx];
                if (play) container.appendChild(createScoringPlayItem(play, gameInfo, i));
            });

        } catch (err) {
            console.error("loadScoringPlays error:", err);
            container.innerHTML = '<p style="text-align:center;color:#666;padding:16px;">Error loading scoring plays.</p>';
        }
    }

    function createScoringPlayItem(play, gameInfo, index) {
        const div = document.createElement('div');
        div.className = 'play-item';
        div.style.cssText = `opacity:0;transform:translateY(-8px);animation:slideIn 0.25s ease-out ${index*0.08}s forwards;`;

        const batter     = play.matchup?.batter;
        const playerId   = batter?.id || '';
        const playerName = batter?.fullName || 'Unknown';
        const half       = play.about?.halfInning === 'top' ? 'Top' : 'Bot';
        const inningTxt  = `${half} ${play.about?.inning||1}`;
        const eventType  = play.result?.event || '';
        const eventIcon  = getEventIcon(eventType);
        const baserunners = {
            first:  !!play.matchup?.postOnFirst,
            second: !!play.matchup?.postOnSecond,
            third:  !!play.matchup?.postOnThird
        };
        const count = { balls:play.count?.balls||0, strikes:play.count?.strikes||0, outs:play.count?.outs||0 };

        let scoreRbiHtml = '';
        if (play.result?.homeScore !== undefined) {
            const away = gameInfo.teams?.away?.abbreviation || 'Away';
            const home = gameInfo.teams?.home?.abbreviation || 'Home';
            scoreRbiHtml += `<div style="color:#041e42;font-weight:700;font-size:12px;margin-top:3px;">${away} ${play.result.awayScore} – ${home} ${play.result.homeScore}</div>`;
        }
        if (play.result?.rbi > 0) {
            scoreRbiHtml += `<div style="color:#10b981;font-weight:700;font-size:12px;">RBI: ${play.result.rbi}</div>`;
        }

        const sd = play.playEvents?.find(e => e?.hitData)?.hitData || {};
        const exitVelo    = sd.launchSpeed   ? `${Math.round(sd.launchSpeed)} mph` : '--';
        const launchAngle = sd.launchAngle   ? `${Math.round(sd.launchAngle)}°`  : '--';
        const distance    = sd.totalDistance ? `${Math.round(sd.totalDistance)} ft` : '--';

        div.innerHTML = `
            <div class="inning-indicator" style="position:absolute;top:7px;left:7px;background:#bf0d3d;color:white;padding:2px 6px;border-radius:4px;font-size:11px;font-weight:700;">${inningTxt}</div>
            <div style="flex-shrink:0;margin-right:10px;margin-left:50px;position:relative;">
                <img style="width:52px;height:52px;border-radius:50%;border:2px solid #bf0d3d;background:#041e42;object-fit:cover;"
                    src="https://midfield.mlbstatic.com/v1/people/${playerId}/spots/60" alt="${playerName}">
                <div style="position:absolute;bottom:-4px;right:-4px;width:22px;height:22px;border-radius:50%;background:#bf0d3d;display:flex;align-items:center;justify-content:center;font-size:9px;font-weight:800;color:white;border:2px solid white;">${eventIcon}</div>
            </div>
            <div class="content-wrapper">
                <div class="play-details" style="flex:1;margin-top:4px;">
                    <div style="border:2px solid #041e42;color:#041e42;padding:3px 8px;border-radius:999px;font-weight:700;font-size:14px;display:inline-block;margin-bottom:4px;">${play.result?.event||'Unknown'}</div>
                    <p style="color:#333;font-size:13px;line-height:1.35;margin:0 0 4px;font-weight:400;">${play.result?.description||''}</p>
                    ${scoreRbiHtml}
                    <div class="statcast-stats">
                        <div class="stat-item"><div style="font-size:9px;color:rgba(4,30,66,0.5);font-weight:700;text-transform:uppercase;">Exit Velo</div><div style="font-size:13px;font-weight:800;color:#bf0d3d;">${exitVelo}</div></div>
                        <div class="stat-item"><div style="font-size:9px;color:rgba(4,30,66,0.5);font-weight:700;text-transform:uppercase;">Angle</div><div style="font-size:13px;font-weight:800;color:#bf0d3d;">${launchAngle}</div></div>
                        <div class="stat-item"><div style="font-size:9px;color:rgba(4,30,66,0.5);font-weight:700;text-transform:uppercase;">Distance</div><div style="font-size:13px;font-weight:800;color:#bf0d3d;">${distance}</div></div>
                    </div>
                </div>
                <div class="game-situation">
                    <div style="font-size:11px;font-weight:700;color:#bf0d3d;">${count.balls}-${count.strikes}</div>
                    ${generateSVGField(count, baserunners)}
                </div>
            </div>`;

        try { initializeVideoMatcher().addVideoButtonToPlay(div, gamePk, play); } catch(e) { /* no video */ }
        return div;
    }

    // ── Shared SVG field (all plays / scoring plays) ──────────────────────────

    function generateSVGField(count, onBase) {
        const outFill  = (n) => count.outs >= n ? '#bf0d3d' : '#e2e8f0';
        const baseFill = (b) => b ? '#bf0d3d' : '#e2e8f0';
        return `<svg width="54" height="54" viewBox="0 0 58 79" fill="none" xmlns="http://www.w3.org/2000/svg">
            <circle cx="13" cy="61" r="6" fill="${outFill(1)}" stroke="#bf0d3d" stroke-width="1" opacity="0.85"/>
            <circle cx="30" cy="61" r="6" fill="${outFill(2)}" stroke="#bf0d3d" stroke-width="1" opacity="0.85"/>
            <circle cx="47" cy="61" r="6" fill="${outFill(3)}" stroke="#bf0d3d" stroke-width="1" opacity="0.85"/>
            <rect x="17.6" y="29.7" width="14" height="14" transform="rotate(45 17.6 29.7)" fill="${baseFill(onBase.third)}"  stroke="#bf0d3d" stroke-width="1" opacity="0.85"/>
            <rect x="29.4" y="17.7" width="14" height="14" transform="rotate(45 29.4 17.7)" fill="${baseFill(onBase.second)}" stroke="#bf0d3d" stroke-width="1" opacity="0.85"/>
            <rect x="41.6" y="29.7" width="14" height="14" transform="rotate(45 41.6 29.7)" fill="${baseFill(onBase.first)}"  stroke="#bf0d3d" stroke-width="1" opacity="0.85"/>
        </svg>`;
    }

    // ── Shared event icon helper ──────────────────────────────────────────────

    function getEventIcon(eventType) {
        if (!eventType) return '?';
        const exact = {
            'Single':'1B','Double':'2B','Triple':'3B','Home Run':'HR',
            'Strikeout':'K','Walk':'BB','Intent Walk':'BB','Hit By Pitch':'HBP',
            'Grounded Into DP':'DP','Field Error':'E','Fielders Choice':'FC',
            'Fielders Choice Out':'FC','Double Play':'DP','Catcher Interference':'E2',
            'Caught Stealing 2B':'CS','Caught Stealing 3B':'CS',
            'Pickoff Caught Stealing 2B':'CS','Pickoff Caught Stealing 3B':'CS',
        };
        if (exact[eventType]) return exact[eventType];
        if (eventType.includes('Substitution') || eventType.includes('Switch')) return '↔';
        if (eventType.match(/out|Out/)) return 'OUT';
        if (eventType.includes('Sac')) return 'SAC';
        if (eventType.includes('Error')) return 'E';
        return '?';
    }

    // ── slideIn animation ─────────────────────────────────────────────────────

    if (!document.querySelector('#popup-slide-in-style')) {
        const s = document.createElement('style');
        s.id = 'popup-slide-in-style';
        s.textContent = `@keyframes slideIn { to { opacity:1; transform:translateY(0); } }`;
        document.head.appendChild(s);
    }

    // ── Win Probability ───────────────────────────────────────────────────────

    const MLB_TEAM_COLORS = {
        108:'#BA0021',109:'#A71930',110:'#DF4601',111:'#BD3039',112:'#0E3386',
        113:'#C6011F',114:'#00385D',115:'#333366',116:'#0C2340',117:'#EB6E1F',
        118:'#004687',119:'#005A9C',120:'#AB0003',121:'#002D72',133:'#003831',
        134:'#FDB827',135:'#2F241D',136:'#005C5C',137:'#FD5A1E',138:'#C41E3A',
        139:'#8FBCE6',140:'#003278',141:'#134A8E',142:'#002B5C',143:'#E81828',
        144:'#CE1141',145:'#27251F',146:'#00A3E0',147:'#0C2340',158:'#12284B',
    };

    const WBC_COLORS = {
        "Japan":'#BC002D',"USA":'#BF0A30',"Korea":'#CD2E3A',"Venezuela":'#CF0921',
        "Mexico":'#006847',"Puerto Rico":'#ED0000',"Dominican Republic":'#002D62',
        "Canada":'#FF0000',"Cuba":'#002A8F',"Italy":'#009246',
    };

    const getTeamColor = (id, name='') =>
        MLB_TEAM_COLORS[id] || (name && WBC_COLORS[name]) || '#535557';

    async function loadWinProbability() {
        let container = document.getElementById('win-prob-container');
        if (!container) {
            container = document.createElement('div');
            container.id = 'win-prob-container';
            container.style.cssText = 'width:100%;padding:10px;font-family:Rubik,sans-serif;display:none;';
            document.getElementById('popup-container').appendChild(container);
        }

        container.style.display = 'block';
        container.innerHTML = '<p style="text-align:center;padding:20px;color:#555;">Loading Win Probability…</p>';

        try {
            const [wpRes, gameRes] = await Promise.all([
                fetch(`https://statsapi.mlb.com/api/v1/game/${gamePk}/winProbability`),
                fetch(`https://statsapi.mlb.com/api/v1.1/game/${gamePk}/feed/live`)
            ]);

            const activeTab = document.querySelector('.tab-button.active');
            if (!activeTab || activeTab.id !== 'win-prob-tab') {
                container.style.display = 'none';
                return;
            }

            const wpData   = await wpRes.json();
            const gameData = await gameRes.json();

            const away = gameData.gameData.teams.away;
            const home = gameData.gameData.teams.home;
            const awayColor = getTeamColor(away.id, away.name);
            const homeColor = getTeamColor(home.id, home.name);
            const awayAbbr  = away.abbreviation || away.teamName;
            const homeAbbr  = home.abbreviation || home.teamName;

            if (!wpData?.length) {
                container.innerHTML = `<p style="text-align:center;color:#555;padding:20px;">Win probability data not available.</p>`;
                return;
            }

            const latest   = wpData[wpData.length - 1];
            const homeProb = Math.round(latest.homeTeamWinProbability);
            const awayProb = Math.round(latest.awayTeamWinProbability);

            const W=520, H=200, PL=36, PR=16, PT=16, PB=28;
            const CW = W-PL-PR, CH = H-PT-PB;
            const stepX = CW / (wpData.length - 1 || 1);
            const midY  = PT + CH/2;

            const pts = wpData.map((d,i) => ({
                x: PL + i*stepX,
                y: PT + CH/2 + ((d.homeTeamWinProbability - 50)/50) * (CH/2),
                homeProb: d.homeTeamWinProbability,
                awayProb: d.awayTeamWinProbability,
                added:    d.homeTeamWinProbabilityAdded,
                event:    d.result?.event       || '',
                desc:     d.result?.description || '',
                inning:   d.about?.inning        || '',
                isTop:    d.about?.isTopInning,
            }));

            const linePoints = pts.map(p=>`${p.x},${p.y}`).join(' ');
            const polyPts    = [`${PL},${midY}`, ...pts.map(p=>`${p.x},${p.y}`), `${PL+CW},${midY}`].join(' ');

            let inningLines = '', lastInn = 0;
            pts.forEach(p => {
                if (p.inning && p.inning !== lastInn && p.isTop) {
                    lastInn = p.inning;
                    inningLines += `
                        <line x1="${p.x}" y1="${PT}" x2="${p.x}" y2="${PT+CH}" stroke="rgba(4,30,66,0.1)" stroke-width="1" stroke-dasharray="3,3"/>
                        <line x1="${p.x}" y1="${PT+CH}" x2="${p.x}" y2="${PT+CH+5}" stroke="#041e42" stroke-width="1"/>
                        <text x="${p.x}" y="${PT+CH+15}" text-anchor="middle" font-size="8" fill="#041e42" font-family="Rubik">${p.inning}</text>`;
                }
            });

            const tooltipId = `wp-tip-${gamePk}`;

            container.innerHTML = `
                <style>
                    #${tooltipId} {
                        position:absolute;background:#041e42;color:white;padding:8px 10px;
                        border-radius:8px;font-size:11px;font-family:Rubik,sans-serif;
                        pointer-events:none;display:none;max-width:190px;line-height:1.5;
                        z-index:100;border-left:3px solid #bf0d3d;box-shadow:0 4px 12px rgba(0,0,0,0.3);
                    }
                    #${tooltipId} .tt-event { font-weight:700;font-size:12px;color:#bf0d3d;margin-bottom:2px; }
                    #${tooltipId} .tt-desc  { color:#ccc;font-size:10px;margin-bottom:4px; }
                    #${tooltipId} .tt-probs { display:flex;justify-content:space-between;gap:10px;margin-top:4px;
                                             border-top:1px solid rgba(255,255,255,0.12);padding-top:4px; }
                    .tt-away { color:${awayColor};font-weight:600;filter:brightness(1.8); }
                    .tt-home { color:${homeColor};font-weight:600;filter:brightness(1.8); }
                    .tt-pos  { color:#10b981;font-size:10px; }
                    .tt-neg  { color:#ef4444;font-size:10px; }
                    .wp-dot  { display:none;pointer-events:none; }
                </style>

                <div style="text-align:center;font-weight:700;font-size:10px;color:rgba(4,30,66,0.4);text-transform:uppercase;letter-spacing:1.5px;margin-bottom:8px;">Win Probability</div>

                <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px;padding:0 4px;">
                    <div style="display:flex;align-items:center;gap:6px;">
                        <img src="https://www.mlbstatic.com/team-logos/${away.id}.svg" style="width:22px;height:22px;">
                        <span style="font-size:22px;font-weight:800;color:#041e42;">${awayProb}%</span>
                    </div>
                    <div style="font-size:9px;color:#999;font-weight:600;letter-spacing:0.5px;">WIN PROBABILITY</div>
                    <div style="display:flex;align-items:center;gap:6px;">
                        <span style="font-size:22px;font-weight:800;color:#bf0d3d;">${homeProb}%</span>
                        <img src="https://www.mlbstatic.com/team-logos/${home.id}.svg" style="width:22px;height:22px;">
                    </div>
                </div>

                <div style="display:flex;height:5px;border-radius:3px;overflow:hidden;margin:0 4px 10px;">
                    <div style="width:${awayProb}%;background:${awayColor};transition:width 0.5s;"></div>
                    <div style="width:${homeProb}%;background:${homeColor};transition:width 0.5s;"></div>
                </div>

                <div style="position:relative;width:100%;">
                    <div id="${tooltipId}"></div>
                    <svg id="wp-svg-${gamePk}" width="100%" viewBox="0 0 ${W} ${H}" style="overflow:visible;display:block;">
                        <rect x="${PL}" y="${PT}" width="${CW}" height="${CH}" fill="#f7fafc" rx="3"/>
                        <polygon points="${polyPts}" fill="${awayColor}" opacity="0.85" clip-path="url(#ct-${gamePk})"/>
                        <polygon points="${polyPts}" fill="${homeColor}" opacity="0.85" clip-path="url(#cb-${gamePk})"/>
                        <defs>
                            <clipPath id="ct-${gamePk}"><rect x="${PL}" y="${PT}" width="${CW}" height="${CH/2}"/></clipPath>
                            <clipPath id="cb-${gamePk}"><rect x="${PL}" y="${PT+CH/2}" width="${CW}" height="${CH/2}"/></clipPath>
                        </defs>
                        <line x1="${PL}" y1="${PT+CH/2}" x2="${PL+CW}" y2="${PT+CH/2}" stroke="#bbb" stroke-width="1" stroke-dasharray="4,3"/>
                        <text x="${PL-4}" y="${PT+CH/2+4}" text-anchor="end" font-size="8" fill="#999" font-family="Rubik">50%</text>
                        <text x="${PL-4}" y="${PT+5}"    text-anchor="end" font-size="8" fill="${awayColor}" font-family="Rubik">${awayAbbr}</text>
                        <text x="${PL-4}" y="${PT+CH+4}" text-anchor="end" font-size="8" fill="${homeColor}" font-family="Rubik">${homeAbbr}</text>
                        ${inningLines}
                        <polyline points="${linePoints}" fill="none" stroke="rgba(4,30,66,0.5)" stroke-width="1.5" stroke-linejoin="round"/>
                        ${pts.map((p,i) => {
                            const x    = i===0 ? PL : pts[i-1].x + (p.x-pts[i-1].x)/2;
                            const nx   = i===pts.length-1 ? PL+CW : p.x + (pts[i+1].x-p.x)/2;
                            const sign = (p.added??0) >= 0 ? '+' : '';
                            const acls = (p.added??0) >= 0 ? 'tt-pos' : 'tt-neg';
                            const inn  = p.inning ? `${p.isTop?'Top':'Bot'} ${p.inning}` : '';
                            const safeDesc  = (p.desc||'').replace(/'/g,"\\'").replace(/"/g,'&quot;');
                            const safeEvent = (p.event||'').replace(/'/g,"\\'");
                            return `<rect x="${x}" y="${PT}" width="${nx-x}" height="${CH}" fill="transparent"
                                class="wp-zone" style="cursor:crosshair;"
                                data-x="${p.x}" data-y="${p.y}"
                                data-home="${p.homeProb.toFixed(1)}" data-away="${p.awayProb.toFixed(1)}"
                                data-added="${p.added!=null?p.added.toFixed(1):'N/A'}"
                                data-acls="${acls}" data-sign="${sign}"
                                data-event="${safeEvent}" data-desc="${safeDesc}" data-inn="${inn}"/>`;
                        }).join('')}
                        <circle id="wp-dot-${gamePk}" cx="0" cy="0" r="4" fill="white" stroke="rgba(4,30,66,0.5)" stroke-width="2" class="wp-dot"/>
                        <text x="${PL+CW/2}" y="${H-2}" text-anchor="middle" font-size="9" fill="#041e42" font-family="Rubik">Inning</text>
                    </svg>
                </div>

                <div style="display:flex;justify-content:center;gap:16px;margin-top:6px;font-size:11px;">
                    <div style="display:flex;align-items:center;gap:5px;"><div style="width:12px;height:4px;background:${awayColor};border-radius:2px;"></div>${away.name}</div>
                    <div style="display:flex;align-items:center;gap:5px;"><div style="width:12px;height:4px;background:${homeColor};border-radius:2px;"></div>${home.name}</div>
                </div>`;

            // Hover
            const svg     = document.getElementById(`wp-svg-${gamePk}`);
            const tooltip = document.getElementById(tooltipId);
            const dot     = document.getElementById(`wp-dot-${gamePk}`);
            const wrapper = svg.parentElement;

            svg.querySelectorAll('.wp-zone').forEach(zone => {
                zone.addEventListener('mouseenter', () => {
                    dot.setAttribute('cx', zone.dataset.x);
                    dot.setAttribute('cy', zone.dataset.y);
                    dot.style.display = 'block';
                    const addedLine = zone.dataset.added !== 'N/A'
                        ? `<span class="${zone.dataset.acls}">${zone.dataset.sign}${zone.dataset.added}% WP shift</span>` : '';
                    tooltip.innerHTML = `
                        ${zone.dataset.inn ? `<div style="font-size:9px;color:#888;margin-bottom:2px;">${zone.dataset.inn}</div>` : ''}
                        ${zone.dataset.event ? `<div class="tt-event">${zone.dataset.event}</div>` : ''}
                        ${zone.dataset.desc  ? `<div class="tt-desc">${zone.dataset.desc}</div>`  : ''}
                        ${addedLine}
                        <div class="tt-probs">
                            <span class="tt-away">${awayAbbr} ${zone.dataset.away}%</span>
                            <span class="tt-home">${homeAbbr} ${zone.dataset.home}%</span>
                        </div>`;
                    tooltip.style.display = 'block';
                });

                zone.addEventListener('mousemove', (e) => {
                    const rect = wrapper.getBoundingClientRect();
                    let left = e.clientX - rect.left + 12;
                    let top  = e.clientY - rect.top  - 10;
                    if (left + 190 > rect.width) left = e.clientX - rect.left - 202;
                    if (top < 0) top = 0;
                    tooltip.style.left = `${left}px`;
                    tooltip.style.top  = `${top}px`;
                });

                zone.addEventListener('mouseleave', () => {
                    tooltip.style.display = 'none';
                    dot.style.display = 'none';
                });
            });

        } catch (err) {
            console.error("loadWinProbability error:", err);
            const active = document.querySelector('.tab-button.active');
            if (active?.id === 'win-prob-tab') {
                container.innerHTML = '<p style="text-align:center;color:#666;padding:20px;">Error loading win probability.</p>';
            } else {
                container.style.display = 'none';
            }
        }
    }

    // ── Visibility change — pause refresh when hidden ─────────────────────────

    document.addEventListener('visibilitychange', () => {
        if (document.hidden) {
            if (allPlaysRefreshInterval) { clearInterval(allPlaysRefreshInterval); allPlaysRefreshActive = false; }
        } else {
            const active = document.querySelector('.tab-button.active');
            if (active?.id === 'all-plays-tab') loadAllPlays();
        }
    });

});