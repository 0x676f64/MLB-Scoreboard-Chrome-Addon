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
    scoringPlaysTab.textContent = "Scoring";

    const allPlaysTab = document.createElement("button");
    allPlaysTab.id = "all-plays-tab";
    allPlaysTab.classList.add("tab-button");
    allPlaysTab.textContent = "Plays";

    const winProbTab = document.createElement("button");
    winProbTab.id = "win-prob-tab";
    winProbTab.classList.add("tab-button");
    winProbTab.textContent = "Win %";

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

    const boxScoreContainer = document.createElement("div");
    boxScoreContainer.id = "boxscore-content";
    boxScoreContainer.style.display = "none";
    popupContainer.appendChild(boxScoreContainer);

    document.body.appendChild(popupContainer);

    // ── Styles ────────────────────────────────────────────────────────────────

    const styleElement = document.createElement("style");
    styleElement.textContent = `
        * { box-sizing: border-box; }

        html { scrollbar-width: none; }
        html::-webkit-scrollbar { display: none; }

        body {
            font-family: 'Rubik', sans-serif;
            background: #f0f4f8;
            margin: 0;
            padding: 0;
            width: 100%;
        }

        #popup-container {
            width: 100%;
            min-height: 100%;
            display: flex;
            flex-direction: column;
            background: #f0f4f8;
        }

        /* ── Game Info Header ── */
        #game-info {
            display: flex;
            align-items: center;
            justify-content: space-between;
            padding: 8px 12px 6px;
            background: #f7fafc;
            border-bottom: 1px solid rgba(4,30,66,0.08);
        }

        .team-container {
            display: flex;
            flex-direction: column;
            align-items: center;
            gap: 3px;
            min-width: 60px;
        }

        .team-logo {
            width: 56px;
            height: 56px;
            object-fit: contain;
        }

        .team-record {
            font-size: 10px;
            color: rgba(4,30,66,0.5);
            margin: 0;
            font-weight: 600;
        }

        .game-status {
            display: flex;
            align-items: center;
            justify-content: center;
            flex: 1;
            gap: 3rem;
        }

        .team-score {
            font-size: 36px;
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
            gap: 2px;
        }

        .inning {
            font-size: 18px;
            font-weight: 800;
            color: #bf0d3d;
            margin: 0;
            letter-spacing: 0.5px;
            text-transform: uppercase;
            line-height: 1;
        }

        .stadium {
            font-size: 8px;
            color: rgba(4,30,66,0.4);
            margin: 0;
        }

        /* ── Tabs ── */
        #tab-section {
            width: 100%;
            padding: 5px 8px;
            background: #f7fafc;
            border-bottom: 1px solid rgba(4,30,66,0.07);
        }

        #tabs-container {
            display: flex;
            justify-content: center;
            width: 100%;
            background-color: #041e41;
            border-radius: 8px;
            overflow: hidden;
            padding: 2px;
            gap: 1px;
        }

        .tab-button {
            flex-grow: 1;
            padding: 5px 2px;
            border: none;
            background-color: transparent;
            cursor: pointer;
            font-size: 9px;
            font-weight: 700;
            color: rgba(255,255,255,0.75);
            transition: background-color 0.2s ease, color 0.2s ease;
            border-radius: 6px;
            white-space: nowrap;
            text-align: center;
            font-family: 'Rubik', sans-serif;
        }

        .tab-button.active {
            background-color: #bf0d3d;
            color: white;
        }

        .tab-button:hover:not(.active) {
            background-color: rgba(255,255,255,0.12);
            color: white;
        }

        /* ── Gameplay Container ── */
        #gameplay-info-container {
            display: flex;
            justify-content: space-between;
            align-items: center;
            width: 100%;
            padding: 5px 8px;
            gap: 4px;
            background: #f7fafc;
            border-bottom: 1px solid rgba(4,30,66,0.07);
        }

        #scorebug-wrapper {
            flex: 0 0 auto;
            display: flex;
            align-items: center;
            justify-content: center;
        }

        .player-info {
            flex: 1;
            padding: 3px 4px;
            background: transparent;
            border-radius: 5px;
            min-width: 0;
        }

        .spacer { display: none; }

        /* ── Scorebug ── */
        .scorebug {
            display: flex;
            flex-direction: column;
            align-items: center;
            gap: 2px;
            padding: 2px 3px;
        }

        .balls-strikes {
            font-size: 12px;
            font-weight: 700;
            color: #041e42;
            letter-spacing: 1px;
        }

        /* ── Player cards (live) ── */
        .player-name {
            font-weight: 700;
            margin-bottom: 2px;
            font-size: 11px;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
            color: #041e42;
        }

        .player-position {
            font-size: 9px;
            font-weight: 800;
            color: rgba(4,30,66,0.35);
            text-transform: uppercase;
            letter-spacing: 0.8px;
            margin: 0 0 3px;
        }

        .player-stat {
            margin: 1px 0;
            font-size: 10px;
            color: #333;
        }

        /* ── Decision Pitchers (Final) ── */
        .decision-pitcher {
            display: flex;
            flex-direction: row;
            align-items: center;
            justify-content: center;
            gap: 5px;
            width: 100%;
            margin-top: 1.2rem;
        }

        .decision-pitcher-image {
            width: 52px;
            height: 52px;
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
            gap: 4px;
        }

        .winning-pitcher {
            font-size: 13px;
            font-weight: 800;
            color: #10b981;
            background: rgba(16,185,129,0.1);
            padding: 2px 5px;
            border-radius: 4px;
        }

        .losing-pitcher {
            font-size: 13px;
            font-weight: 800;
            color: #ef4444;
            background: rgba(239,68,68,0.1);
            padding: 2px 5px;
            border-radius: 4px;
        }

        .decision-pitcher-name {
            margin: 0;
            font-size: 10px;
            font-weight: 600;
            text-align: left;
            line-height: 1.3;
            color: #041e42;
        }

        /* ── Pre-game layout ── */
        .prob-stats {
            font-size: 10px;
            color: #555;
            margin: 2px 0 6px;
            font-weight: 500;
            line-height: 1.4;
        }

        .lineup {
            font-size: 10px;
            color: #222;
            margin: 0;
            line-height: 1;
            padding: 3px 0;
            border-bottom: 1px solid rgba(4,30,66,0.05);
            display: flex;
            align-items: center;
            gap: 3px;
        }

        .lineup:last-child { border-bottom: none; }
        .hand { color: #bf0d3d; font-weight: 800; font-size: 9px; display: inline-block; width: 10px; flex-shrink: 0; }
        .field { color: #888; font-size: 9px; font-weight: 600; margin-left: auto; }
        .avg { color: #041e42; font-weight: 700; font-size: 9px; margin-left: 3px; }
        .starter-hand { color: #bf0d3d; font-weight: 800; font-size: 10px; }

        /* Pre-game — single-panel lineup card */
        #gameplay-info-container.pregame {
            padding: 0;
            flex-direction: column;
            align-items: stretch;
        }

        #gameplay-info-container.pregame .player-info,
        #gameplay-info-container.pregame #scorebug-wrapper,
        #gameplay-info-container.pregame .spacer {
            display: none !important;
        }

        /* ── Pregame Lineup Card ── */
        #pregame-lineup-card {
            width: 100%;
            background: white;
            overflow: hidden;
        }

        .plc-selector {
            display: flex;
            align-items: center;
            justify-content: center;
            background: #f7fafc;
            border-bottom: 2px solid rgba(4,30,66,0.07);
            padding: 12px 10px 10px;
            gap: 8px;
        }

        .plc-team-btn {
            flex: 1;
            display: flex;
            flex-direction: column;
            align-items: center;
            gap: 7px;
            padding: 10px 6px 8px;
            background: transparent;
            border: 2px solid transparent;
            border-radius: 10px;
            cursor: pointer;
            transition: all 0.18s ease;
            opacity: 0.38;
        }

        .plc-team-btn.active {
            opacity: 1;
            border-bottom-color: #bf0d3d;
            background: rgba(191,13,61,0.04);
        }

        .plc-logo {
            width: 100px;
            height: 100px;
            object-fit: contain;
        }

        .plc-team-abbr {
            font-size: 11px;
            font-weight: 800;
            color: #041e42;
            font-family: 'Rubik', sans-serif;
            letter-spacing: 0.5px;
        }

        .plc-at {
            font-size: 13px;
            font-weight: 700;
            color: rgba(4,30,66,0.25);
            flex-shrink: 0;
            align-self: center;
        }

        .plc-panel {
            padding: 10px;
            max-height: 420px;
            overflow-y: auto;
            scrollbar-width: thin;
            scrollbar-color: rgba(4,30,66,0.15) transparent;
        }

        .plc-panel::-webkit-scrollbar { width: 3px; }
        .plc-panel::-webkit-scrollbar-thumb { background: rgba(4,30,66,0.15); border-radius: 2px; }

        /* Probable pitcher card */
        .plc-pp {
            display: flex;
            align-items: center;
            gap: 10px;
            padding: 10px 12px;
            background: linear-gradient(135deg, #041e42, #0a2d5e);
            border-radius: 10px;
            margin-bottom: 10px;
        }

        .plc-pp-img {
            width: 52px;
            height: 52px;
            border-radius: 50%;
            border: 2px solid #bf0d3d;
            object-fit: cover;
            background: #0a2d5e;
            flex-shrink: 0;
        }

        .plc-pp-info { min-width: 0; flex: 1; }

        .plc-pp-label {
            font-size: 8px;
            font-weight: 700;
            color: rgba(255,255,255,0.4);
            text-transform: uppercase;
            letter-spacing: 0.8px;
            margin-bottom: 2px;
        }

        .plc-pp-name {
            font-size: 14px;
            font-weight: 800;
            color: white;
            margin-bottom: 3px;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
        }

        .plc-hand {
            display: inline-block;
            background: #bf0d3d;
            color: white;
            font-size: 8px;
            font-weight: 800;
            padding: 1px 4px;
            border-radius: 3px;
            vertical-align: middle;
            margin-left: 4px;
        }

        .plc-pp-stats {
            font-size: 11px;
            color: rgba(255,255,255,0.6);
            font-weight: 500;
        }

        /* Lineup rows */
        .plc-rows { display: flex; flex-direction: column; gap: 2px; }

        .plc-row {
            display: flex;
            align-items: center;
            gap: 6px;
            padding: 5px 6px;
            border-radius: 6px;
            border-bottom: 1px solid rgba(4,30,66,0.05);
            transition: background 0.12s;
        }

        .plc-row:last-child { border-bottom: none; }
        .plc-row:hover { background: rgba(191,13,61,0.04); }

        .plc-num {
            font-size: 10px;
            font-weight: 800;
            color: rgba(4,30,66,0.35);
            width: 14px;
            text-align: center;
            flex-shrink: 0;
        }

        .plc-headshot {
            width: 32px;
            height: 32px;
            border-radius: 50%;
            border: 1.5px solid rgba(4,30,66,0.12);
            object-fit: cover;
            background: #e8eef8;
            flex-shrink: 0;
        }

        .plc-bathand {
            font-size: 9px;
            font-weight: 800;
            color: #bf0d3d;
            width: 10px;
            flex-shrink: 0;
            text-align: center;
        }

        .plc-name {
            font-size: 12px;
            font-weight: 600;
            color: #041e42;
            flex: 1;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
        }

        .plc-pos {
            font-size: 9px;
            font-weight: 700;
            color: rgba(4,30,66,0.4);
            width: 24px;
            text-align: right;
            flex-shrink: 0;
        }

        .plc-avg {
            font-size: 11px;
            font-weight: 700;
            color: #041e42;
            width: 34px;
            text-align: right;
            flex-shrink: 0;
        }

        /* ── Top Performers ── */
        .top-performers-section {
            background: transparent;
            padding: 6px 8px;
            border-top: 1px solid rgba(4,30,66,0.06);
            margin-top: 1.2rem;
        }

        .top-performers-row {
            display: flex;
            justify-content: space-around;
            gap: 3px;
            margin-top: 3px;
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
            width: 50px;
            height: 50px;
            border-radius: 50%;
            border: 2px solid #bf0d3d;
            background: #041e42;
            object-fit: cover;
        }

        .performer-name {
            font-size: 10px;
            font-weight: 700;
            color: #041e42;
            margin: 2px 0 1px;
            line-height: 1.2;
        }

        .performer-stats {
            font-size: 9px;
            color: #555;
            margin: 0;
            line-height: 1.3;
        }

        /* ── Video buttons ── */
        .video-buttons-section {
            background: white;
            border-top: 1px solid rgba(4,30,66,0.06);
        }

        /* ── Live At-Bat Widget ── */
        #live-at-bat {
            width: 100%;
            background: white;
            border-top: 1px solid rgba(4,30,66,0.07);
            padding: 6px 8px 8px;
        }

        .lab-main-row {
            display: flex;
            gap: 8px;
            align-items: flex-start;
        }

        .lab-zone-col {
            flex: 0 0 90px;
            display: flex;
            flex-direction: column;
            align-items: center;
            gap: 3px;
        }

        .lab-zone-label {
            font-size: 7px;
            font-weight: 700;
            color: rgba(4,30,66,0.3);
            text-transform: uppercase;
            letter-spacing: 0.8px;
        }

        .lab-count-pills {
            display: flex;
            align-items: center;
            gap: 4px;
            margin-top: 1px;
        }

        .lab-count-group {
            display: flex;
            align-items: center;
            gap: 2px;
        }

        .lab-dot {
            width: 9px;
            height: 9px;
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
            height: 12px;
            background: rgba(4,30,66,0.12);
        }

        .lab-info-col {
            flex: 1;
            min-width: 0;
            display: flex;
            flex-direction: column;
            gap: 3px;
        }

        .lab-players-row {
            display: flex;
            gap: 4px;
        }

        .lab-player-card {
            flex: 1;
            display: flex;
            align-items: center;
            gap: 4px;
            background: rgba(4,30,66,0.03);
            border-radius: 5px;
            padding: 3px 4px;
            min-width: 0;
        }

        .lab-headshot {
            width: 24px;
            height: 24px;
            border-radius: 50%;
            border: 1.5px solid #bf0d3d;
            object-fit: cover;
            background: #041e42;
            flex-shrink: 0;
        }

        .lab-pitcher-photo {
            width: 24px;
            height: 24px;
            border-radius: 50%;
            border: 1.5px solid rgba(4,30,66,0.3);
            object-fit: cover;
            background: #041e42;
            flex-shrink: 0;
        }

        .lab-player-info { min-width: 0; flex: 1; }

        .lab-player-role {
            font-size: 7px;
            font-weight: 700;
            color: rgba(4,30,66,0.35);
            text-transform: uppercase;
            letter-spacing: 0.5px;
        }

        .lab-player-name {
            font-size: 10px;
            font-weight: 700;
            color: #041e42;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
        }

        .lab-igstats-row {
            display: flex;
            gap: 3px;
        }

        .lab-igstat-group {
            flex: 1;
            display: flex;
            gap: 2px;
        }

        .lab-igstat {
            flex: 1;
            text-align: center;
            background: rgba(4,30,66,0.03);
            border-radius: 4px;
            padding: 2px 2px;
        }

        .lab-igstat-lbl {
            font-size: 6px;
            color: rgba(4,30,66,0.4);
            font-weight: 700;
            text-transform: uppercase;
            display: block;
        }

        .lab-igstat-val {
            font-size: 10px;
            font-weight: 700;
            color: #041e42;
            display: block;
            line-height: 1.2;
        }

        .lab-count-avg {
            font-size: 8px;
            color: #666;
            text-align: center;
        }

        .lab-log-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-top: 5px;
        }

        .lab-log-title {
            font-size: 7px;
            font-weight: 700;
            color: rgba(4,30,66,0.35);
            text-transform: uppercase;
            letter-spacing: 0.8px;
        }

        .lab-pitch-count-badge {
            font-size: 7px;
            color: rgba(4,30,66,0.4);
            font-weight: 600;
        }

        .lab-pitchlog {
            max-height: 80px;
            overflow-y: auto;
            scrollbar-width: thin;
            scrollbar-color: rgba(4,30,66,0.15) transparent;
        }

        .lab-pitchlog::-webkit-scrollbar { width: 3px; }
        .lab-pitchlog::-webkit-scrollbar-thumb { background: rgba(4,30,66,0.15); border-radius: 2px; }

        .lab-pitch-row {
            display: flex;
            align-items: center;
            gap: 4px;
            padding: 1px 0;
            border-bottom: 1px solid rgba(4,30,66,0.04);
        }

        .lab-pitch-row:last-child { border-bottom: none; }

        .lab-pitch-num {
            font-size: 7px;
            color: rgba(4,30,66,0.3);
            width: 10px;
            text-align: right;
            flex-shrink: 0;
        }

        .lab-pitch-badge {
            font-size: 7px;
            font-weight: 700;
            color: white;
            padding: 1px 3px;
            border-radius: 3px;
            flex-shrink: 0;
            min-width: 18px;
            text-align: center;
        }

        .lab-pitch-type {
            font-size: 9px;
            color: #041e42;
            flex: 1;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
        }

        .lab-pitch-velo {
            font-size: 9px;
            font-weight: 600;
            color: #041e42;
            flex-shrink: 0;
            min-width: 44px;
            text-align: right;
        }

        .lab-pitch-spin {
            font-size: 8px;
            color: rgba(4,30,66,0.5);
            flex-shrink: 0;
            min-width: 40px;
            text-align: right;
        }

        .lab-pitch-result {
            font-size: 7px;
            font-weight: 700;
            padding: 1px 4px;
            border-radius: 3px;
            flex-shrink: 0;
        }

        .pr-strike { background: #ef4444; color: white; }
        .pr-ball   { background: #10b981; color: white; }
        .pr-contact{ background: #f59e0b; color: white; }
        .pr-foul   { background: #8b5cf6; color: white; }

        .lab-result-section {
            margin-top: 5px;
            padding-top: 5px;
            border-top: 1px solid rgba(4,30,66,0.07);
            display: flex;
            gap: 8px;
            align-items: flex-start;
        }

        .lab-statcast-row {
            display: flex;
            flex-direction: column;
            gap: 3px;
            flex-shrink: 0;
            width: 55%;
        }

        .lab-sc-chip {
            background: rgba(4,30,66,0.04);
            border-radius: 4px;
            padding: 3px 5px;
            display: flex;
            justify-content: space-between;
            align-items: center;
            gap: 4px;
        }

        .lab-sc-lbl {
            font-size: 7px;
            font-weight: 700;
            color: rgba(4,30,66,0.6);
            text-transform: uppercase;
            letter-spacing: 0.3px;
        }

        .lab-sc-val {
            font-size: 11px;
            font-weight: 800;
            color: #bf0d3d;
            line-height: 1;
        }

        .lab-result-text {
            flex: 1;
            min-width: 0;
        }

        .lab-play-event {
            font-size: 12px;
            font-weight: 800;
            color: #041e42;
            margin-bottom: 3px;
        }

        .lab-play-desc {
            font-size: 10px;
            font-weight: 500;
            color: #444;
            line-height: 1.4;
            margin: 0;
        }

        /* ── Scoring / All Plays ── */
        #scoring-plays-container,
        #all-plays-container {
            width: 100%;
            padding: 6px;
            background: #f0f4f8;
        }

        .play-item {
            display: flex;
            align-items: flex-start;
            margin-bottom: 8px;
            padding: 7px;
            background: white;
            border-radius: 8px;
            box-shadow: 0 1px 4px rgba(4,30,66,0.07);
            position: relative;
        }

        .game-start-item {
            text-align: center;
            padding: 10px 6px;
            margin-bottom: 8px;
            background: linear-gradient(135deg, #041e42, #0a2d5e);
            color: white;
            border-radius: 8px;
        }

        .content-wrapper {
            display: flex;
            flex: 1;
            align-items: stretch;
            gap: 8px;
        }

        .game-situation {
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            padding: 5px;
            background: linear-gradient(135deg, #f8f9fa, #e8eef8);
            border-radius: 6px;
            min-width: 64px;
            align-self: stretch;
        }

        .statcast-stats {
            display: flex;
            gap: 6px;
            margin-top: 5px;
            padding: 5px 6px;
            background: linear-gradient(135deg, #f8f9fa, #e8eef8);
            border-radius: 6px;
            border-left: 3px solid #bf0d3d;
        }

        .stat-item { text-align: center; flex: 1; }

        /* ── Box Score ── */
        #boxscore-content { display: none; }

        /* ── Win Prob ── */
        #win-prob-container { display: none; }

        /* ── Slide-in animation ── */
        @keyframes slideIn { to { opacity:1; transform:translateY(0); } }
    `;
    document.head.appendChild(styleElement);

    // ── Constants ─────────────────────────────────────────────────────────────

    const FINAL_STATES = [
        "Final","Game Over","Final: Tied",
        "Completed Early","Completed Early: Rain","Completed Early: Mercy",
        "Cancelled","Cancelled: Rain"
    ];
    const PRE_GAME_STATES = ["Pre-Game","Scheduled","Warmup"];

    const isFinalState   = (s) => FINAL_STATES.includes(s);
    const isPreGameState = (s) => PRE_GAME_STATES.includes(s);
    const isLiveState    = (s) => !isFinalState(s) && !isPreGameState(s) &&
        !["Postponed","Suspended","Suspended: Rain","Cancelled","Cancelled: Rain","Delayed"].includes(s);

    // ── Pitch Map ─────────────────────────────────────────────────────────────

    const PITCH_MAP = {
        FF:{label:'4-Seam',abbr:'FF',color:'#e63946'},FA:{label:'4-Seam',abbr:'FF',color:'#e63946'},
        FT:{label:'2-Seam',abbr:'FT',color:'#c1121f'},SI:{label:'Sinker',abbr:'SI',color:'#c1121f'},
        FC:{label:'Cutter',abbr:'FC',color:'#f4a261'},SL:{label:'Slider',abbr:'SL',color:'#2a9d8f'},
        ST:{label:'Sweeper',abbr:'ST',color:'#fb8500'},SV:{label:'Slurve',abbr:'SV',color:'#3a86ff'},
        CU:{label:'Curveball',abbr:'CU',color:'#457b9d'},KC:{label:'Knuck-Cur',abbr:'KC',color:'#457b9d'},
        CS:{label:'Slow Cur',abbr:'CS',color:'#457b9d'},CH:{label:'Changeup',abbr:'CH',color:'#8338ec'},
        FS:{label:'Splitter',abbr:'FS',color:'#06d6a0'},FO:{label:'Forkball',abbr:'FO',color:'#06d6a0'},
        KN:{label:'Knuckle',abbr:'KN',color:'#adb5bd'},EP:{label:'Eephus',abbr:'EP',color:'#adb5bd'},
        PO:{label:'Pitchout',abbr:'PO',color:'#6c757d'},IN:{label:'Int. Ball',abbr:'IN',color:'#6c757d'},
    };

    const LEAGUE_AVG_BY_COUNT = {
        '0-0':.248,'0-1':.215,'0-2':.141,'1-0':.273,'1-1':.234,'1-2':.158,
        '2-0':.299,'2-1':.262,'2-2':.178,'3-0':.330,'3-1':.303,'3-2':.216,
    };

    const pitchInfo = (code) => PITCH_MAP[code] || {label:code||'?',abbr:code||'?',color:'#94a3b8'};

    // Zone geometry
    const ZONE_W=110,ZONE_H=140;
    const SZ_LEFT=20,SZ_RIGHT=90,SZ_TOP=22,SZ_BOT=100;
    const SZ_CX=(SZ_LEFT+SZ_RIGHT)/2;
    const PX_PER_FT=(SZ_RIGHT-SZ_LEFT)/1.7;
    const PZ_TOP_FT=3.5,PZ_BOT_FT=1.5;
    const mapPx=(pX)=>SZ_CX+pX*PX_PER_FT;
    const mapPz=(pZ)=>SZ_BOT-(pZ-PZ_BOT_FT)/(PZ_TOP_FT-PZ_BOT_FT)*(SZ_BOT-SZ_TOP);
    const DZ_LEFT=SZ_LEFT+5,DZ_RIGHT=SZ_RIGHT-5,DZ_TOP=SZ_TOP+4,DZ_BOT=SZ_BOT-10;

    function buildStrikeZoneSVG(pitches=[]) {
        const dW=DZ_RIGHT-DZ_LEFT,dH=DZ_BOT-DZ_TOP;
        const d3=dW/3,d3h=dH/3;
        const dots=pitches.map((p,i)=>{
            const px=p.pitchData?.coordinates?.pX,pz=p.pitchData?.coordinates?.pZ;
            if(px==null||pz==null)return'';
            const cx=mapPx(px),cy=mapPz(pz),info=pitchInfo(p.details?.type?.code),isLast=i===pitches.length-1;
            return`<circle cx="${cx}" cy="${cy}" r="${isLast?6:4}" fill="${info.color}"
                stroke="${isLast?'#fff':'rgba(255,255,255,0.35)'}" stroke-width="${isLast?1.5:1}"
                opacity="${isLast?1:0.6}"/>
                <text x="${cx}" y="${cy+0.5}" text-anchor="middle" dominant-baseline="middle"
                font-size="${isLast?6:5}" font-weight="700" fill="white" font-family="monospace">${i+1}</text>`;
        }).join('');
        return`<svg width="100%" viewBox="0 0 ${ZONE_W} ${ZONE_H}" xmlns="http://www.w3.org/2000/svg" style="display:block;overflow:visible;">
            <rect x="${DZ_LEFT}" y="${DZ_TOP}" width="${dW}" height="${dH}" fill="rgba(191,13,61,0.04)" stroke="#bf0d3d" stroke-width="1.5" rx="1"/>
            <line x1="${DZ_LEFT+d3}" y1="${DZ_TOP}" x2="${DZ_LEFT+d3}" y2="${DZ_BOT}" stroke="rgba(191,13,61,0.2)" stroke-width="0.8" stroke-dasharray="3,2"/>
            <line x1="${DZ_LEFT+d3*2}" y1="${DZ_TOP}" x2="${DZ_LEFT+d3*2}" y2="${DZ_BOT}" stroke="rgba(191,13,61,0.2)" stroke-width="0.8" stroke-dasharray="3,2"/>
            <line x1="${DZ_LEFT}" y1="${DZ_TOP+d3h}" x2="${DZ_RIGHT}" y2="${DZ_TOP+d3h}" stroke="rgba(191,13,61,0.2)" stroke-width="0.8" stroke-dasharray="3,2"/>
            <line x1="${DZ_LEFT}" y1="${DZ_TOP+d3h*2}" x2="${DZ_RIGHT}" y2="${DZ_TOP+d3h*2}" stroke="rgba(191,13,61,0.2)" stroke-width="0.8" stroke-dasharray="3,2"/>
            <polygon points="${DZ_LEFT},${DZ_BOT+4} ${DZ_RIGHT},${DZ_BOT+4} ${DZ_RIGHT},${DZ_BOT+10} ${SZ_CX},${DZ_BOT+16} ${DZ_LEFT},${DZ_BOT+10}"
                fill="white" stroke="rgba(148,163,184,0.45)" stroke-width="1"/>
            ${dots}
        </svg>`;
    }

    const _batterCountCache={};
    async function fetchBatterAvgAtCount(batterId,balls,strikes){
        const key=`${balls}-${strikes}`,cacheKey=`${batterId}-${key}`;
        if(_batterCountCache[cacheKey]!==undefined)return _batterCountCache[cacheKey];
        try{
            const res=await fetch(`https://statsapi.mlb.com/api/v1/people/${batterId}/stats?stats=byCount&group=hitting&season=2025&gameType=R`);
            const d=await res.json();
            for(const s of(d.stats?.[0]?.splits||[])){
                const k=s.split?.description?.replace(/ count/i,'').trim();
                if(k===key&&s.stat?.avg){const v=parseFloat(s.stat.avg);_batterCountCache[cacheKey]=v;return v;}
            }
        }catch(e){}
        const lg=LEAGUE_AVG_BY_COUNT[key]||null;
        _batterCountCache[cacheKey]=lg;return lg;
    }

    // ── Visibility ────────────────────────────────────────────────────────────

    const originalDisplayValues={};
    function storeOriginalDisplay(id){
        const el=document.getElementById(id);
        if(el&&!originalDisplayValues[id])originalDisplayValues[id]=window.getComputedStyle(el).display||'block';
    }

    function toggleContainers(showDynamic,isBoxscoreTab=false,isScoringPlaysTab=false,isAllPlaysTab=false,isWinProbTab=false){
        const gameInfoEl      =document.getElementById('game-info');
        const gameplayEl      =document.getElementById('gameplay-info-container');
        const videoButtonsEl  =document.getElementById('video-buttons');
        const topPerformerEl  =document.getElementById('top-performers');
        const liveAtBatEl     =document.getElementById('live-at-bat');
        const boxScoreEl      =document.getElementById('boxscore-content');
        const scoringPlaysEl  =document.getElementById('scoring-plays-container');
        const allPlaysEl      =document.getElementById('all-plays-container');
        const winProbEl       =document.getElementById('win-prob-container');

        ['game-info','gameplay-info-container'].forEach(storeOriginalDisplay);

        if(showDynamic){
            if(gameInfoEl)  gameInfoEl.style.display  =originalDisplayValues['game-info']||'flex';
            if(gameplayEl)  gameplayEl.style.display  =originalDisplayValues['gameplay-info-container']||'flex';
            if(videoButtonsEl)videoButtonsEl.style.display='';
            if(topPerformerEl)topPerformerEl.style.display='';
        }else{
            if(gameInfoEl)  gameInfoEl.style.display  =originalDisplayValues['game-info']||'flex';
            if(gameplayEl)  gameplayEl.style.display  ='none';
            if(videoButtonsEl)videoButtonsEl.style.display='none';
            if(topPerformerEl)topPerformerEl.style.display='none';
            if(liveAtBatEl) liveAtBatEl.style.display ='none';
        }

        if(boxScoreEl)   boxScoreEl.style.display   =isBoxscoreTab    ?'block':'none';
        if(scoringPlaysEl)scoringPlaysEl.style.display=isScoringPlaysTab?'block':'none';
        if(allPlaysEl)   allPlaysEl.style.display   =isAllPlaysTab    ?'block':'none';
        if(winProbEl)    winProbEl.style.display    =isWinProbTab     ?'block':'none';
    }

    // ── Tab Routing ───────────────────────────────────────────────────────────

    function openGameDetailsPage(tabType){
        switch(tabType){
            case'live':case'wrap':case'pre-game':case'game-info':break;
            case'boxscore':      loadBoxScore();      break;
            case'scoring':
            case'scoring-plays': loadScoringPlays();  break;
            case'plays':
            case'all-plays':     loadAllPlays();      break;
            case'win-%':
            case'win-prob':      loadWinProbability();break;
            default:console.warn(`Unknown tab type: ${tabType}`);
        }
    }

    dynamicTab.addEventListener('click',()=>{
        document.querySelectorAll('.tab-button').forEach(t=>t.classList.remove('active'));
        dynamicTab.classList.add('active');
        toggleContainers(true,false,false,false,false);
        openGameDetailsPage(dynamicTab.textContent.toLowerCase().replace(/\s+/g,'-'));
    });

    boxscoreTab.addEventListener('click',()=>{
        document.querySelectorAll('.tab-button').forEach(t=>t.classList.remove('active'));
        boxscoreTab.classList.add('active');
        toggleContainers(false,true,false,false,false);
        openGameDetailsPage('boxscore');
    });

    scoringPlaysTab.addEventListener('click',()=>{
        document.querySelectorAll('.tab-button').forEach(t=>t.classList.remove('active'));
        scoringPlaysTab.classList.add('active');
        toggleContainers(false,false,true,false,false);
        openGameDetailsPage('scoring-plays');
    });

    allPlaysTab.addEventListener('click',()=>{
        document.querySelectorAll('.tab-button').forEach(t=>t.classList.remove('active'));
        allPlaysTab.classList.add('active');
        toggleContainers(false,false,false,true,false);
        openGameDetailsPage('all-plays');
    });

    winProbTab.addEventListener('click',()=>{
        document.querySelectorAll('.tab-button').forEach(t=>t.classList.remove('active'));
        winProbTab.classList.add('active');
        toggleContainers(false,false,false,false,true);
        openGameDetailsPage('win-prob');
    });

    // Auto-refresh (dynamic tab only)
    setInterval(()=>{
        if(!gamePk)return;
        const activeTab=document.querySelector('.tab-button.active');
        if(activeTab?.id==='dynamic-tab'){fetchGameDetails(gamePk);fetchGameData(gamePk);}
    },2000);

    toggleContainers(true);

    // ── Video Matcher ─────────────────────────────────────────────────────────

    let videoMatcher=null;
    function initializeVideoMatcher(){
        if(!videoMatcher)videoMatcher=new MLBVideoMatcher();
        return videoMatcher;
    }

    // Persists whichever team tab the user last clicked in the pregame lineup card.
    // Survives the 2-second refresh cycle so the selection is never reset.
    let pregameActiveTeam = 'away';

    // ── Init ──────────────────────────────────────────────────────────────────

    const params=new URLSearchParams(window.location.search);
    const gamePk=params.get("gamePk");
    if(gamePk){fetchGameDetails(gamePk);fetchGameData(gamePk);}

    function formatGameTime(gameDate){
        const d=new Date(gameDate),h=d.getHours(),m=d.getMinutes(),ampm=h>=12?"PM":"AM";
        return`${(h%12)||12}:${String(m).padStart(2,'0')} ${ampm}`;
    }

    function getFinalInningText(linescore){
        const n=linescore.currentInning||9;
        return n!==9?`FINAL/${n}`:'FINAL';
    }

    let gameRefreshInterval=null,currentGamePk=null;

    function startAutoRefresh(pk){
        if(gameRefreshInterval&&currentGamePk===pk)return;
        stopAutoRefresh();
        currentGamePk=pk;
        gameRefreshInterval=setInterval(()=>fetchGameDetails(pk),2000);
    }

    function stopAutoRefresh(){
        if(gameRefreshInterval){clearInterval(gameRefreshInterval);gameRefreshInterval=null;currentGamePk=null;}
    }

    // ── fetchGameDetails ──────────────────────────────────────────────────────

    async function fetchGameDetails(pk){
        try{
            const response=await fetch(`https://statsapi.mlb.com/api/v1.1/game/${pk}/feed/live`);
            const data=await response.json();
            if(!data?.gameData||!data?.liveData){inningInfo.textContent="Game data unavailable.";return;}

            const game=data.gameData,linescore=data.liveData.linescore;
            const awayTeam=game.teams.away,homeTeam=game.teams.home;
            const statusText=game.status.detailedState;

            const dynTabEl=document.getElementById("dynamic-tab");
            if(dynTabEl){
                if(isFinalState(statusText))dynTabEl.textContent="Wrap";
                else if(isPreGameState(statusText))dynTabEl.textContent="Game Info";
                else if(["Warmup","Delayed","Postponed","Suspended","Cancelled","Cancelled: Rain"].includes(statusText))dynTabEl.textContent=statusText;
                else dynTabEl.textContent="Live";
            }

            let inningText="",inningStyle="";
            if(statusText==="Suspended: Rain"||statusText==="Suspended"){inningText="SUSP";inningStyle="color:#bf0d3d;";}
            else if(statusText==="Cancelled"||statusText==="Cancelled: Rain"){inningText="CXLD";inningStyle="color:#bf0d3d;";}
            else if(statusText==="Postponed"){inningText="PPD";inningStyle="color:#bf0d3d;";}
            else if(isFinalState(statusText)){inningText=getFinalInningText(linescore);inningStyle="color:#bf0d3d;";}
            else if(isPreGameState(statusText)){inningText=formatGameTime(game.datetime.dateTime);inningStyle="color:rgba(4,30,66,0.55);font-size:10px;";}
            else{const half=linescore.inningHalf==="Top"?"▲":"▼";inningText=`${half} ${linescore.currentInning||''}`;inningStyle="color:#bf0d3d;";}

            awayLogo.src=`https://www.mlbstatic.com/team-logos/${awayTeam.id}.svg`;
            awayLogo.alt=awayTeam.name;
            awayScore.textContent=linescore.teams.away.runs??0;
            awayRecord.textContent=`${game.teams.away.record?.wins??0}-${game.teams.away.record?.losses??0}`;
            inningInfo.textContent=inningText;inningInfo.style=inningStyle;
            homeScore.textContent=linescore.teams.home.runs??0;
            homeLogo.src=`https://www.mlbstatic.com/team-logos/${homeTeam.id}.svg`;
            homeLogo.alt=homeTeam.name;
            homeRecord.textContent=`${game.teams.home.record?.wins??0}-${game.teams.home.record?.losses??0}`;

            updatePlayerInfo(data);
            if(isLiveState(statusText))startAutoRefresh(pk);else stopAutoRefresh();

        }catch(err){console.error("fetchGameDetails error:",err);inningInfo.textContent="Error loading game.";}
    }

    // ── updatePlayerInfo ──────────────────────────────────────────────────────

    function updatePlayerInfo(data){
        const gameState=data.gameData.status.detailedState;
        const currentPlay=data.liveData.plays.currentPlay;
        const awayBattingOrder=data.liveData.boxscore.teams.away.battingOrder;
        const homeBattingOrder=data.liveData.boxscore.teams.home.battingOrder;
        const awayPS=document.getElementById("away-player-stats");
        const homePS=document.getElementById("home-player-stats");
        awayPS.innerHTML="";homePS.innerHTML="";

        // ── FINAL ──────────────────────────────────────────────────────────────
        if(isFinalState(gameState)){
            const isTied=gameState==="Final: Tied";
            if(!isTied&&data.liveData.decisions?.winner&&data.liveData.decisions?.loser){
                const{winner,loser}=data.liveData.decisions;
                const wImg=`https://img.mlbstatic.com/mlb-photos/image/upload/d_people:generic:headshot:67:current.png/w_100,h_100,c_fill,q_auto:best/v1/people/${winner.id}/headshot/67/current`;
                const lImg=`https://img.mlbstatic.com/mlb-photos/image/upload/d_people:generic:headshot:67:current.png/w_100,h_100,c_fill,q_auto:best/v1/people/${loser.id}/headshot/67/current`;
                const decHTML=(img,name,cls,label)=>`
                    <div class="decision-pitcher">
                        <img src="${img}" alt="${name}" class="decision-pitcher-image"
                            onerror="this.src='https://content.mlb.com/images/headshots/current/60x60/generic_player@2x.png'">
                        <div class="decision-pitcher-info">
                            <span class="${cls}">${label}</span>
                            <span class="decision-pitcher-name">
                                <span>${name.split(" ")[0]}</span><br>
                                <span>${name.split(" ").slice(1).join(" ")}</span>
                            </span>
                        </div>
                    </div>`;
                awayPS.innerHTML=decHTML(wImg,winner.fullName,'winning-pitcher','W');
                homePS.innerHTML=decHTML(lImg,loser.fullName,'losing-pitcher','L');
            }

            const lab=document.getElementById('live-at-bat');
            if(lab)lab.style.display='none';

            const gameplayEl=document.getElementById("gameplay-info-container");
            if(!gameplayEl)return;

            const isSpringTraining=["S","E"].includes(data?.gameData?.game?.type);
            if(isSpringTraining){const ev=document.getElementById("video-buttons");if(ev)ev.style.display="none";}
            else _createVideoButtons(data,gameplayEl);
            _createTopPerformers(data,gameplayEl);
            return;
        }

        // ── PRE-GAME ────────────────────────────────────────────────────────────
        if(isPreGameState(gameState)){
            document.getElementById("scorebug-wrapper").style.display="none";
            document.getElementById("tabs-container").style.display="none";
            const lab=document.getElementById('live-at-bat');if(lab)lab.style.display='none';
            const gameplayEl=document.getElementById('gameplay-info-container');
            if(gameplayEl)gameplayEl.classList.add('pregame');

            // Gather pitcher data
            const pitchers=data.gameData.probablePitchers||{};
            const awayP=pitchers.away,homeP=pitchers.home;
            const awayHand=awayP?.id?data.gameData.players[`ID${awayP.id}`]?.pitchHand?.code||'':'';
            const homeHand=homeP?.id?data.gameData.players[`ID${homeP.id}`]?.pitchHand?.code||'':'';
            const awaySS=awayP?.id?data.liveData.boxscore.teams.away.players[`ID${awayP.id}`]?.seasonStats?.pitching:null;
            const homeSS=homeP?.id?data.liveData.boxscore.teams.home.players[`ID${homeP.id}`]?.seasonStats?.pitching:null;

            // Build batting-order player rows
            const buildPlayers=(battingOrder,teamKey)=>Array.from({length:9},(_,i)=>{
                const pid=battingOrder[i];if(!pid)return null;
                const player=data.gameData.players[`ID${pid}`];
                const stats=data.liveData.boxscore.teams[teamKey].players[`ID${pid}`];
                return{
                    id:pid,
                    name:player?.boxscoreName||'',
                    hand:player?.batSide?.code||'',
                    field:player?.primaryPosition?.abbreviation||'',
                    avg:stats?.seasonStats?.batting?.avg||'---',
                };
            }).filter(Boolean);

            const awayPlayers=buildPlayers(awayBattingOrder,'away');
            const homePlayers=buildPlayers(homeBattingOrder,'home');
            const awayTeam=data.gameData.teams.away;
            const homeTeam=data.gameData.teams.home;

            // Build the inner HTML for one team's panel
            const buildPanelHTML=(pitcher,hand,seasonStats,players)=>{
                const pid=pitcher?.id||null;
                const pitcherImg=pid
                    ?`https://img.mlbstatic.com/mlb-photos/image/upload/d_people:generic:headshot:67:current.png/w_100,h_100,c_fill,q_auto:best/v1/people/${pid}/headshot/67/current`
                    :'https://content.mlb.com/images/headshots/current/60x60/generic_player@2x.png';
                const ppStats=pid&&seasonStats
                    ?`${seasonStats.era||'---'} ERA · ${seasonStats.inningsPitched||'0'} IP · ${seasonStats.strikeOuts||'0'} K`
                    :'Stats unavailable';
                const handBadge=hand?`<span class="plc-hand">${hand}</span>`:'';
                const ppHTML=`
                    <div class="plc-pp">
                        <img src="${pitcherImg}" class="plc-pp-img"
                            onerror="this.src='https://content.mlb.com/images/headshots/current/60x60/generic_player@2x.png'">
                        <div class="plc-pp-info">
                            <div class="plc-pp-label">Probable Pitcher</div>
                            <div class="plc-pp-name">${pitcher?.fullName||'TBD'}${handBadge}</div>
                            <div class="plc-pp-stats">${ppStats}</div>
                        </div>
                    </div>`;
                const rowsHTML=players.map((p,i)=>`
                    <div class="plc-row">
                        <span class="plc-num">${i+1}</span>
                        <img src="https://midfield.mlbstatic.com/v1/people/${p.id}/spots/60"
                            class="plc-headshot"
                            onerror="this.src='https://img.mlbstatic.com/mlb-photos/image/upload/d_people:generic:headshot:67:current.png/w_60,q_auto:best/v1/people/generic/headshot/67/current.png'">
                        <span class="plc-bathand">${p.hand}</span>
                        <span class="plc-name">${p.name}</span>
                        <span class="plc-pos">${p.field}</span>
                        <span class="plc-avg">${p.avg}</span>
                    </div>`).join('');
                return ppHTML+`<div class="plc-rows">${rowsHTML}</div>`;
            };

            // Remove any stale card
            document.getElementById('pregame-lineup-card')?.remove();

            const card=document.createElement('div');
            card.id='pregame-lineup-card';

            // Use the persisted selection — never reset to 'away' on refresh
            const activeOnBuild = pregameActiveTeam;

            card.innerHTML=`
                <div class="plc-selector">
                    <button class="plc-team-btn ${activeOnBuild==='away'?'active':''}" data-team="away">
                        <img src="https://www.mlbstatic.com/team-logos/${awayTeam.id}.svg" class="plc-logo">
                        <span class="plc-team-abbr">${awayTeam.abbreviation||awayTeam.teamName||'Away'}</span>
                    </button>
                    <div class="plc-at">@</div>
                    <button class="plc-team-btn ${activeOnBuild==='home'?'active':''}" data-team="home">
                        <img src="https://www.mlbstatic.com/team-logos/${homeTeam.id}.svg" class="plc-logo">
                        <span class="plc-team-abbr">${homeTeam.abbreviation||homeTeam.teamName||'Home'}</span>
                    </button>
                </div>
                <div class="plc-panel" id="plc-away-panel" style="display:${activeOnBuild==='away'?'block':'none'};">${buildPanelHTML(awayP,awayHand,awaySS,awayPlayers)}</div>
                <div class="plc-panel" id="plc-home-panel" style="display:${activeOnBuild==='home'?'block':'none'};">${buildPanelHTML(homeP,homeHand,homeSS,homePlayers)}</div>`;

            if(gameplayEl)gameplayEl.appendChild(card);

            // Team toggle — write selection back to the persistent variable
            card.querySelectorAll('.plc-team-btn').forEach(btn=>{
                btn.addEventListener('click',()=>{
                    card.querySelectorAll('.plc-team-btn').forEach(b=>b.classList.remove('active'));
                    btn.classList.add('active');
                    const t=btn.dataset.team;
                    pregameActiveTeam = t;   // persist so next refresh restores this choice
                    document.getElementById('plc-away-panel').style.display=t==='away'?'block':'none';
                    document.getElementById('plc-home-panel').style.display=t==='home'?'block':'none';
                });
            });

            return;
        }

        // ── LIVE ────────────────────────────────────────────────────────────────
        if(currentPlay){
            const gameplayEl=document.getElementById('gameplay-info-container');
            if(gameplayEl)gameplayEl.classList.remove('pregame');

            const matchup=currentPlay.matchup;
            const batter=matchup?.batter,pitcher=matchup?.pitcher;
            const allPlayers={
                ...data.liveData?.boxscore?.teams?.away?.players,
                ...data.liveData?.boxscore?.teams?.home?.players
            };

            const batterId=batter?.id;
            const batterData=batterId?allPlayers[`ID${batterId}`]:null;
            const batterSeason=batterData?.seasonStats?.batting||{};
            const pitcherId=pitcher?.id;
            const pitcherData=pitcherId?allPlayers[`ID${pitcherId}`]:null;
            const pitcherSeason=pitcherData?.seasonStats?.pitching||{};

            const fmtAvg=(n)=>{if(!n||n==='---')return'---';const f=parseFloat(n);return f<1?'.'+String(Math.round(f*1000)).padStart(3,'0'):f.toFixed(3);};

            if(batter){
                const batHand=currentPlay.matchup?.batSide?.code||'';
                const batBadge=batHand?`<span style="display:inline-block;background:#bf0d3d;color:white;font-size:6px;font-weight:800;padding:1px 3px;border-radius:2px;margin-left:3px;vertical-align:middle;">${batHand}HB</span>`:'';
                awayPS.innerHTML=`
                    <div style="display:flex;align-items:center;gap:5px;margin-bottom:4px;">
                        <img src="https://midfield.mlbstatic.com/v1/people/${batterId}/spots/60"
                            style="width:30px;height:30px;border-radius:50%;border:1.5px solid #bf0d3d;background:#041e42;object-fit:cover;flex-shrink:0;"
                            onerror="this.src='https://img.mlbstatic.com/mlb-photos/image/upload/d_people:generic:headshot:67:current.png/w_60,q_auto:best/v1/people/generic/headshot/67/current.png'">
                        <div style="min-width:0;">
                            <div style="font-weight:700;font-size:10px;color:#041e42;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${batter.fullName}${batBadge}</div>
                            <div style="font-size:8px;color:#bf0d3d;font-weight:600;text-transform:uppercase;letter-spacing:.3px;">Batter</div>
                        </div>
                    </div>
                    <div style="display:flex;gap:3px;">
                        <div style="background:rgba(4,30,66,0.04);border-radius:4px;padding:2px 4px;text-align:center;flex:1;">
                            <div style="font-size:6px;color:rgba(4,30,66,0.4);font-weight:700;text-transform:uppercase;">AVG</div>
                            <div style="font-size:11px;font-weight:700;color:#041e42;">${fmtAvg(batterSeason.avg)}</div>
                        </div>
                        <div style="background:rgba(4,30,66,0.04);border-radius:4px;padding:2px 4px;text-align:center;flex:1;">
                            <div style="font-size:6px;color:rgba(4,30,66,0.4);font-weight:700;text-transform:uppercase;">OPS</div>
                            <div style="font-size:11px;font-weight:700;color:#041e42;">${batterSeason.ops||'---'}</div>
                        </div>
                        <div style="background:rgba(4,30,66,0.04);border-radius:4px;padding:2px 4px;text-align:center;flex:1;">
                            <div style="font-size:6px;color:rgba(4,30,66,0.4);font-weight:700;text-transform:uppercase;">HR</div>
                            <div style="font-size:11px;font-weight:700;color:#041e42;">${batterSeason.homeRuns||'0'}</div>
                        </div>
                    </div>`;
            }

            if(pitcher){
                const pitHand=currentPlay.matchup?.pitchHand?.code||'';
                const pitBadge=pitHand?`<span style="display:inline-block;background:#041e42;color:white;font-size:6px;font-weight:800;padding:1px 3px;border-radius:2px;margin-left:3px;vertical-align:middle;">${pitHand}HP</span>`:'';
                homePS.innerHTML=`
                    <div style="display:flex;align-items:center;gap:5px;margin-bottom:4px;">
                        <img src="https://midfield.mlbstatic.com/v1/people/${pitcherId}/spots/60"
                            style="width:30px;height:30px;border-radius:50%;border:1.5px solid rgba(4,30,66,0.3);background:#041e42;object-fit:cover;flex-shrink:0;"
                            onerror="this.src='https://img.mlbstatic.com/mlb-photos/image/upload/d_people:generic:headshot:67:current.png/w_60,q_auto:best/v1/people/generic/headshot/67/current.png'">
                        <div style="min-width:0;">
                            <div style="font-weight:700;font-size:10px;color:#041e42;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${pitcher.fullName}${pitBadge}</div>
                            <div style="font-size:8px;color:rgba(4,30,66,0.45);font-weight:600;text-transform:uppercase;letter-spacing:.3px;">Pitcher</div>
                        </div>
                    </div>
                    <div style="display:flex;gap:3px;">
                        <div style="background:rgba(4,30,66,0.04);border-radius:4px;padding:2px 4px;text-align:center;flex:1;">
                            <div style="font-size:6px;color:rgba(4,30,66,0.4);font-weight:700;text-transform:uppercase;">ERA</div>
                            <div style="font-size:11px;font-weight:700;color:#041e42;">${pitcherSeason.era||'---'}</div>
                        </div>
                        <div style="background:rgba(4,30,66,0.04);border-radius:4px;padding:2px 4px;text-align:center;flex:1;">
                            <div style="font-size:6px;color:rgba(4,30,66,0.4);font-weight:700;text-transform:uppercase;">IP</div>
                            <div style="font-size:11px;font-weight:700;color:#041e42;">${pitcherSeason.inningsPitched||'0'}</div>
                        </div>
                        <div style="background:rgba(4,30,66,0.04);border-radius:4px;padding:2px 4px;text-align:center;flex:1;">
                            <div style="font-size:6px;color:rgba(4,30,66,0.4);font-weight:700;text-transform:uppercase;">K</div>
                            <div style="font-size:11px;font-weight:700;color:#041e42;">${pitcherSeason.strikeOuts||'0'}</div>
                        </div>
                    </div>`;
            }

            document.getElementById('scorebug-wrapper').style.display='';
            renderLiveAtBat(data);
        }
    }

    // ── renderLiveAtBat ───────────────────────────────────────────────────────

    async function renderLiveAtBat(data){
        const activeTab=document.querySelector('.tab-button.active');
        if(!activeTab||activeTab.id!=='dynamic-tab')return;

        let container=document.getElementById('live-at-bat');
        if(!container){
            container=document.createElement('div');
            container.id='live-at-bat';
            const gameplayEl=document.getElementById('gameplay-info-container');
            if(gameplayEl?.parentNode)gameplayEl.parentNode.insertBefore(container,gameplayEl.nextSibling);
            else document.getElementById('popup-container').appendChild(container);
        }

        const status=data.gameData?.status?.detailedState;
        if(isFinalState(status)||isPreGameState(status)){container.style.display='none';return;}
        container.style.display='';

        const cp=data.liveData?.plays?.currentPlay;
        const ls=data.liveData?.linescore;
        if(!cp){container.style.display='none';return;}

        const count=cp.count||{balls:0,strikes:0,outs:0};
        const pitches=cp.playEvents?.filter(e=>e.isPitch)||[];
        const batter=cp.matchup?.batter,pitcher=cp.matchup?.pitcher;
        const batterId=batter?.id,pitcherId=pitcher?.id;

        const allPlayers={
            ...data.liveData?.boxscore?.teams?.away?.players,
            ...data.liveData?.boxscore?.teams?.home?.players
        };
        const pd=allPlayers?.[`ID${pitcherId}`];
        const batterData=batterId?allPlayers[`ID${batterId}`]:null;
        const batterSeason=batterData?.seasonStats?.batting||{};
        const pitcherSeason=pd?.seasonStats?.pitching||{};

        const hitData=cp.playEvents?.find(e=>e?.hitData)?.hitData||null;
        const exitVelo=hitData?.launchSpeed?`${hitData.launchSpeed.toFixed(1)} mph`:'--';
        const launchAngle=hitData?.launchAngle?`${Math.round(hitData.launchAngle)}\xb0`:'--';
        const distance=hitData?.totalDistance?`${Math.round(hitData.totalDistance)} ft`:'--';
        const resultEvt=cp.result?.event||'';
        const lastDesc=pitches[pitches.length-1]?.details?.description||cp.result?.description||'';

        const pitchRows=[...pitches].reverse().map((p,i)=>{
            const info=pitchInfo(p.details?.type?.code);
            const velo=p.pitchData?.startSpeed?.toFixed(1)??'--';
            const spin=p.pitchData?.breaks?.spinRate?`${Math.round(p.pitchData.breaks.spinRate)} rpm`:'--';
            const isInPlay=p.details?.isInPlay,isStrike=p.details?.isStrike;
            const isFoul=p.details?.description?.toLowerCase().includes('foul');
            const resCls=isInPlay?'pr-contact':isFoul?'pr-foul':isStrike?'pr-strike':'pr-ball';
            const resLbl=isInPlay?'IN PLAY':isFoul?'FOUL':isStrike?'STR':'BALL';
            return`<div class="lab-pitch-row">
                <div class="lab-pitch-num">${pitches.length-i}</div>
                <div class="lab-pitch-badge" style="background:${info.color}">${info.abbr}</div>
                <div class="lab-pitch-type">${info.label}</div>
                <div class="lab-pitch-velo">${velo} mph</div>
                <div class="lab-pitch-spin">${spin}</div>
                <div class="lab-pitch-result ${resCls}">${resLbl}</div>
            </div>`;
        }).join('');

        container.innerHTML=`
            <div class="lab-main-row">
                <div class="lab-zone-col">
                    <div class="lab-zone-label">Zone</div>
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
                    <div class="lab-pitchlog">
                        ${pitchRows||'<div style="font-size:9px;color:#999;padding:2px 0;">Waiting for first pitch…</div>'}
                    </div>
                </div>
            </div>
            ${(resultEvt||lastDesc||exitVelo!=='--')?`
            <div class="lab-result-section">
                <div class="lab-statcast-row">
                    <div class="lab-sc-chip"><span class="lab-sc-lbl">Exit Velo</span><span class="lab-sc-val">${exitVelo}</span></div>
                    <div class="lab-sc-chip"><span class="lab-sc-lbl">Angle</span><span class="lab-sc-val">${launchAngle}</span></div>
                    <div class="lab-sc-chip"><span class="lab-sc-lbl">Distance</span><span class="lab-sc-val">${distance}</span></div>
                </div>
                <div class="lab-result-text">
                    ${resultEvt?`<div class="lab-play-event">${resultEvt}</div>`:''}
                    ${lastDesc?`<div class="lab-play-desc">${lastDesc}</div>`:''}
                </div>
            </div>`:''}
        `;

        if(batterId){
            fetchBatterAvgAtCount(batterId,count.balls,count.strikes).then(avg=>{
                const el=container.querySelector('.lab-count-avg');
                if(!el||avg==null)return;
                const color=avg>=.280?'#10b981':avg>=.220?'#eab308':'#ef4444';
                const fmt=avg<1?'.'+String(Math.round(avg*1000)).padStart(3,'0'):avg.toFixed(3);
                el.innerHTML=`<span style="color:${color};font-weight:700;">${fmt}</span> avg ${count.balls}-${count.strikes}`;
            });
        }
    }

    // ── fetchGameData ─────────────────────────────────────────────────────────

    async function fetchGameData(pk){
        try{
            const response=await fetch(`https://statsapi.mlb.com/api/v1.1/game/${pk}/feed/live`);
            const data=await response.json();
            updateScorebug(data);updatePlayerInfo(data);
            const game=data.gameData,linescore=data.liveData.linescore;
            const statusText=game.status.detailedState;
            let inningText="",inningStyle="";
            if(statusText==="Suspended: Rain"||statusText==="Suspended"){inningText="SUSP";inningStyle="color:#bf0d3d;";}
            else if(statusText==="Cancelled"||statusText==="Cancelled: Rain"){inningText="CXLD";inningStyle="color:#bf0d3d;";}
            else if(statusText==="Postponed"){inningText="PPD";inningStyle="color:#bf0d3d;";}
            else if(isFinalState(statusText)){inningText=getFinalInningText(linescore);inningStyle="color:#bf0d3d;";}
            else if(isPreGameState(statusText)){inningText=formatGameTime(game.datetime.dateTime);inningStyle="color:rgba(4,30,66,0.55);font-size:10px;";}
            else{const half=linescore.inningHalf==="Top"?"▲":"▼";inningText=`${half} ${linescore.currentInning||''}`;inningStyle="color:#bf0d3d;";}
            inningInfo.textContent=inningText;inningInfo.style=inningStyle;
            if(isFinalState(statusText)||isPreGameState(statusText)){const lab=document.getElementById('live-at-bat');if(lab)lab.style.display='none';}
        }catch(err){console.error("fetchGameData error:",err);}
    }

    // ── updateScorebug ────────────────────────────────────────────────────────

    function updateScorebug(data){
        const statusText=data.gameData.status.detailedState;
        if(isFinalState(statusText)||statusText==="Cancelled"||statusText==="Cancelled: Rain"){
            scorebugContainer.innerHTML="";document.getElementById("scorebug-wrapper").style.display="none";return;
        }
        if(!data.liveData?.plays?.currentPlay)return;
        document.getElementById("scorebug-wrapper").style.display="";
        const cp=data.liveData.plays.currentPlay;
        let count=cp.count||{balls:0,strikes:0,outs:0};
        const endEvents=["strikeout","walk","hit","field_out"];
        if(isFinalState(statusText)||isPreGameState(statusText)||endEvents.includes(cp.result?.eventType))
            count={balls:0,strikes:0,outs:count.outs};
        const onBase=data.liveData?.linescore?.offense||{};
        scorebugContainer.innerHTML=`<div class="scorebug">${generatedSVGField(count,onBase)}<div class="balls-strikes">${count.balls}–${count.strikes}</div></div>`;
    }

    function generatedSVGField(count,onBase){
        const outFill=(n)=>count.outs>=n?'#bf0d3d':'#f0f4f8';
        const baseFill=(b)=>b?'#bf0d3d':'#f0f4f8';
        return`<svg width="60" height="60" viewBox="0 0 58 79" fill="none" xmlns="http://www.w3.org/2000/svg">
            <circle cx="13" cy="61" r="6" fill="${outFill(1)}" stroke="#bf0d3d" stroke-width="1.5" opacity="0.85"/>
            <circle cx="30" cy="61" r="6" fill="${outFill(2)}" stroke="#bf0d3d" stroke-width="1.5" opacity="0.85"/>
            <circle cx="47" cy="61" r="6" fill="${outFill(3)}" stroke="#bf0d3d" stroke-width="1.5" opacity="0.85"/>
            <rect x="17.6" y="29.7" width="14" height="14" transform="rotate(45 17.6 29.7)" fill="${baseFill(onBase.third)}"  stroke="#bf0d3d" stroke-width="1.5" opacity="0.85"/>
            <rect x="29.4" y="17.7" width="14" height="14" transform="rotate(45 29.4 17.7)" fill="${baseFill(onBase.second)}" stroke="#bf0d3d" stroke-width="1.5" opacity="0.85"/>
            <rect x="41.6" y="29.7" width="14" height="14" transform="rotate(45 41.6 29.7)" fill="${baseFill(onBase.first)}"  stroke="#bf0d3d" stroke-width="1.5" opacity="0.85"/>
        </svg>`;
    }

    // ── Private helpers ───────────────────────────────────────────────────────

    function _createVideoButtons(data,gameplayEl){
        if(document.getElementById("video-buttons"))return;
        const container=document.createElement("div");
        container.id="video-buttons";
        container.classList.add("video-buttons-section");
        container.innerHTML=`
            <div style="display:flex;justify-content:center;gap:8px;padding:10px 0;">
                <button id="game-recap-btn" style="background:linear-gradient(135deg,rgba(248,249,250,0.95),rgba(217,230,243,0.95));border:1px solid rgba(4,30,66,0.1);padding:5px 10px;border-radius:8px;font-family:'Rubik',sans-serif;font-size:10px;font-weight:700;cursor:pointer;box-shadow:0 2px 6px rgba(0,0,0,0.1);display:flex;align-items:center;gap:5px;transition:all 0.2s;">
                    <img src="assets/icons/video-camera.png" style="width:12px;height:12px;" onerror="this.style.display='none'"/>Game Recap
                </button>
                <button id="condensed-game-btn" style="background:linear-gradient(135deg,rgba(248,249,250,0.95),rgba(217,230,243,0.95));border:1px solid rgba(4,30,66,0.1);padding:5px 10px;border-radius:8px;font-family:'Rubik',sans-serif;font-size:10px;font-weight:700;cursor:pointer;box-shadow:0 2px 6px rgba(0,0,0,0.1);display:flex;align-items:center;gap:5px;transition:all 0.2s;">
                    <img src="assets/icons/video-camera.png" style="width:12px;height:12px;" onerror="this.style.display='none'"/>Condensed
                </button>
            </div>`;
        gameplayEl.parentNode.insertBefore(container,gameplayEl.nextSibling);
        (async()=>{
            try{
                const res=await fetch(`https://statsapi.mlb.com/api/v1/game/${data.gamePk}/content`);
                const contentData=await res.json();
                const items=contentData?.highlights?.highlights?.items||[];
                const recap=items[0],condensed=items[1];
                const extractMp4=(h)=>{
                    if(!h?.playbacks)return null;
                    const mp4s=h.playbacks.filter(p=>p.url?.toLowerCase().endsWith('.mp4'));
                    if(!mp4s.length)return null;
                    for(const q of['2500K','1800K','1200K','800K']){const m=mp4s.find(p=>p.name?.includes(q));if(m)return m.url;}
                    return mp4s[0].url;
                };
                const openVideo=(highlight,url)=>(e)=>{
                    e.stopPropagation();
                    if(!url){alert('Video not available');return;}
                    const vm=initializeVideoMatcher();
                    if(vm?.createVideoPlayer){
                        const tmp=document.createElement('div');tmp.style.position='relative';document.body.appendChild(tmp);
                        vm.createVideoPlayer({title:highlight.title||'',url,id:highlight.id||''},tmp,e.target);
                        setTimeout(()=>tmp.parentNode&&tmp.remove(),1000);
                    }else window.open(url,'_blank');
                };
                const recapBtn=document.getElementById("game-recap-btn");
                const condensedBtn=document.getElementById("condensed-game-btn");
                if(recapBtn)recapBtn.addEventListener('click',openVideo(recap||{},extractMp4(recap)));
                if(condensedBtn)condensedBtn.addEventListener('click',openVideo(condensed||{},extractMp4(condensed)));
                [recapBtn,condensedBtn].forEach(btn=>{
                    if(!btn)return;
                    btn.addEventListener('mouseover',()=>{btn.style.transform='scale(1.05)';btn.style.boxShadow='0 4px 12px rgba(0,0,0,0.15)';});
                    btn.addEventListener('mouseleave',()=>{btn.style.transform='';btn.style.boxShadow='0 2px 6px rgba(0,0,0,0.1)';});
                });
            }catch(e){console.warn('Video fetch failed:',e);}
        })();
    }

    function _createTopPerformers(data,gameplayEl){
        if(document.getElementById("top-performers"))return;
        const container=document.createElement("div");
        container.id="top-performers";
        container.classList.add("top-performers-section");
        const performers=(data.liveData.boxscore.topPerformers||[]).slice(0,3);
        const getStats=(player)=>{
            if(!player?.player)return{name:"N/A",stats:"No stats",imageUrl:""};
            const name=player.player.person.fullName,pid=player.player.person.id;
            const imageUrl=`https://img.mlbstatic.com/mlb-photos/image/upload/d_people:generic:headshot:67:current.png/w_100,h_100,c_fill,q_auto:best/v1/people/${pid}/headshot/67/current`;
            let stats="No stats";
            const isPitcher=player.type==="pitcher"||player.type==="starter";
            const isHitter=player.type==="hitter";
            if(isPitcher){const p=player.player.stats?.pitching;if(p?.summary)stats=p.summary;else if(p)stats=`${p.inningsPitched||'0'} IP, ${p.hits||0} H, ${p.earnedRuns||0} ER, ${p.strikeOuts||0} K`;}
            else if(isHitter){const b=player.player.stats?.batting;if(b?.summary)stats=b.summary;else if(b)stats=`${b.hits||0}-${b.atBats||0}, ${b.runs||0} R, ${b.rbi||0} RBI`;}
            else stats=player.player.stats?.pitching?.summary||player.player.stats?.batting?.summary||"No stats";
            return{name,stats,imageUrl};
        };
        const rows=performers.map(p=>{
            const{name,stats,imageUrl}=getStats(p);
            const parts=name.split(" ");
            return`<div class="top-performer">
                <img src="${imageUrl}" alt="${name}" class="performer-image" onerror="this.src='https://content.mlb.com/images/headshots/current/60x60/generic_player@2x.png'">
                <p class="performer-name"><span>${parts[0]}</span> <span>${parts.slice(1).join(" ")}</span></p>
                <p class="performer-stats">${stats}</p>
            </div>`;
        }).join('');
        container.innerHTML=`
            <div style="text-align:center;font-weight:700;font-size:9px;color:rgba(4,30,66,0.4);text-transform:uppercase;letter-spacing:1.5px;margin-bottom:5px;">Top Performers</div>
            <div class="top-performers-row">${rows}</div>`;
        const videoButtonsEl=document.getElementById("video-buttons");
        const insertAfter=videoButtonsEl||gameplayEl;
        insertAfter.parentNode.insertBefore(container,insertAfter.nextSibling);
    }

    // ── Box Score ─────────────────────────────────────────────────────────────

    async function loadBoxScore(){
        boxScoreContainer.style.display="block";
        boxScoreContainer.innerHTML=`<p style="text-align:center;padding:16px;color:#555;font-family:'Rubik',sans-serif;font-size:12px;">Loading Box Score…</p>`;
        if(!gamePk){boxScoreContainer.innerHTML="<p>No gamePk found.</p>";return;}

        async function fetchAbbr(teamId){
            try{const r=await fetch(`https://statsapi.mlb.com/api/v1/teams/${teamId}`);const d=await r.json();return d.teams[0].abbreviation||"??";}
            catch{return"??";}
        }

        try{
            const[gameRes,lineupRes]=await Promise.all([
                fetch(`https://statsapi.mlb.com/api/v1.1/game/${gamePk}/feed/live`),
                fetch(`https://statsapi.mlb.com/api/v1/schedule?hydrate=lineups&sportId=1&gamePk=${gamePk}`)
            ]);
            const gameData=await gameRes.json(),lineupData=await lineupRes.json();
            const linescore=gameData?.liveData?.linescore,boxscore=gameData?.liveData?.boxscore;
            if(!linescore||!boxscore){boxScoreContainer.innerHTML="<p>Box score data not available.</p>";return;}

            const awayTeamId=gameData.gameData.teams.away.id,homeTeamId=gameData.gameData.teams.home.id;
            const[awayAbbr,homeAbbr]=await Promise.all([fetchAbbr(awayTeamId),fetchAbbr(homeTeamId)]);
            const awayTeam=gameData.gameData.teams.away,homeTeam=gameData.gameData.teams.home;
            const awayStats=boxscore.teams.away,homeStats=boxscore.teams.home;
            const innings=linescore.innings;
            const gameInfo=lineupData.dates?.[0]?.games?.[0];
            const awayLineup=gameInfo?.teams?.away?.lineup||[];
            const homeLineup=gameInfo?.teams?.home?.lineup||[];

            const getPlayerStats=(playerId,teamStats,isHitter=true)=>{
                const player=teamStats.players[`ID${playerId}`];if(!player)return null;
                if(isHitter){const g=player.stats?.batting||{},s=player.seasonStats?.batting||{};
                    return{name:player.person?.fullName||'Unknown',position:player.position?.abbreviation||'',
                        ab:g.atBats||0,r:g.runs||0,h:g.hits||0,rbi:g.rbi||0,bb:g.baseOnBalls||0,so:g.strikeOuts||0,seasonAvg:s.avg||'.000'};}
                else{const g=player.stats?.pitching||{},s=player.seasonStats?.pitching||{};
                    return{name:player.person?.fullName||'Unknown',position:player.position?.abbreviation||'P',
                        ip:g.inningsPitched||'0.0',h:g.hits||0,r:g.runs||0,er:g.earnedRuns||0,bb:g.baseOnBalls||0,so:g.strikeOuts||0,seasonEra:s.era||'0.00'};}
            };

            const getAllBatters=(teamStats)=>(teamStats.batters||[]).reduce((acc,id)=>{
                const player=teamStats.players[`ID${id}`];if(!player?.stats?.batting)return acc;
                const g=player.stats.batting,s=player.seasonStats?.batting||{};
                acc.push({id,name:player.person?.fullName||'Unknown',position:player.position?.abbreviation||'',
                    battingOrder:player.battingOrder||99,ab:g.atBats||0,r:g.runs||0,h:g.hits||0,
                    rbi:g.rbi||0,bb:g.baseOnBalls||0,so:g.strikeOuts||0,seasonAvg:s.avg||'.000'});
                return acc;
            },[]).sort((a,b)=>a.battingOrder-b.battingOrder);

            const shortName=(name)=>{
                const parts=name.split(' ');const SUFFIX=['Jr.','Jr','Sr.','Sr','II','III','IV','V'];
                const lastPart=parts[parts.length-1];
                const last=SUFFIX.includes(lastPart)&&parts.length>2?parts[parts.length-2]:lastPart;
                return name.length>14&&parts.length>=2?`${parts[0][0]}. ${last}`:name;
            };

            const battingRow=(player,order,teamStats)=>{
                const id=player.person?.id||player.id;
                let stats=id?getPlayerStats(id,teamStats,true):null;
                if(!stats&&player.person?.fullName){stats=getAllBatters(teamStats).find(b=>b.name===player.person.fullName)||null;}
                const name=player.person?.fullName||player.name||'Unknown';
                const pos=player.position?.abbreviation||'';
                if(!stats)return`<tr><td class="bo">${order}</td><td class="pn" title="${name}">${name}</td><td class="pp">${pos}</td><td>0</td><td>0</td><td>0</td><td>0</td><td>0</td><td>0</td><td>.000</td></tr>`;
                return`<tr><td class="bo">${order}</td><td class="pn" title="${stats.name}">${shortName(stats.name)}</td><td class="pp">${stats.position}</td><td>${stats.ab}</td><td>${stats.r}</td><td>${stats.h}</td><td>${stats.rbi}</td><td>${stats.bb}</td><td>${stats.so}</td><td>${stats.seasonAvg}</td></tr>`;
            };

            const pitchingRow=(pitcher,teamStats)=>{
                const id=pitcher.person?.id,stats=getPlayerStats(id,teamStats,false);
                const name=pitcher.person?.fullName||'Unknown';
                if(!stats)return`<tr class="pr"><td class="bo">P</td><td class="pn">${name}</td><td class="pp">P</td><td>-</td><td>-</td><td>-</td><td>-</td><td>-</td><td>-</td><td>-</td></tr>`;
                return`<tr class="pr"><td class="bo">P</td><td class="pn" title="${stats.name}">${shortName(stats.name)}</td><td class="pp">${stats.position}</td><td>${stats.ip}</td><td>${stats.h}</td><td>${stats.r}</td><td>${stats.er}</td><td>${stats.bb}</td><td>${stats.so}</td><td>${stats.seasonEra}</td></tr>`;
            };

            const teamContent=(lineup,teamStats)=>{
                let batters=[];
                if(lineup?.length)batters=lineup.filter(p=>!['P','Pitcher'].includes(p.position?.abbreviation));
                else batters=getAllBatters(teamStats).filter(b=>!['P','Pitcher'].includes(b.position)).map(b=>({person:{id:b.id,fullName:b.name},position:{abbreviation:b.position}}));
                const pitchers=(teamStats.pitchers||[]).map(id=>{const p=teamStats.players[`ID${id}`];return p?{person:p.person,position:p.position}:null;}).filter(Boolean);
                return`<div class="stw">
                    <div class="ss">Batting</div>
                    <table class="st"><thead><tr><th>#</th><th>Player</th><th>P</th><th>AB</th><th>R</th><th>H</th><th>RBI</th><th>BB</th><th>K</th><th>AVG</th></tr></thead>
                    <tbody>${batters.map((p,i)=>battingRow(p,i+1,teamStats)).join('')}</tbody></table>
                    <div class="ss">Pitching</div>
                    <table class="st"><thead><tr><th></th><th>Pitcher</th><th>P</th><th>IP</th><th>H</th><th>R</th><th>ER</th><th>BB</th><th>K</th><th>ERA</th></tr></thead>
                    <tbody>${pitchers.map(p=>pitchingRow(p,teamStats)).join('')}</tbody></table>
                </div>`;
            };

            boxScoreContainer.innerHTML=`
            <style>
                .bsc{width:100%;font-family:'Rubik',sans-serif;background:#f0f4f8;}
                .lsw{padding:6px;background:white;border-bottom:2px solid rgba(4,30,66,0.08);}
                .bst{width:100%;border-collapse:collapse;background:white;border-radius:5px;overflow:hidden;box-shadow:0 1px 4px rgba(4,30,66,0.1);table-layout:fixed;}
                .bst thead{background:#041e42;}.bst th{padding:4px 2px;text-align:center;font-weight:700;font-size:7px;color:white;border-right:1px solid rgba(255,255,255,0.15);}
                .bst td{padding:4px 2px;text-align:center;border-right:1px solid rgba(4,30,66,0.06);font-weight:600;color:#041e42;font-size:8px;}
                .bst tbody tr:hover{background:rgba(191,13,61,0.05);}.tn{display:flex;align-items:center;justify-content:center;gap:2px;}.tlb{width:14px;height:14px;}.ts{background:rgba(191,13,61,0.1)!important;font-weight:800;}
                .tnav{display:flex;background:white;border-bottom:2px solid #041e42;}
                .tbb{flex:1;display:flex;align-items:center;justify-content:center;gap:5px;padding:8px 4px;background:rgba(4,30,66,0.03);border:none;cursor:pointer;font-family:'Rubik',sans-serif;font-weight:600;font-size:9px;color:rgba(4,30,66,0.5);transition:all 0.2s;border-bottom:2px solid transparent;}
                .tbb.active{background:white;border-bottom-color:#bf0d3d;color:#bf0d3d;}.tbb img{width:16px;height:16px;}
                .tc{display:none;}.tc.active{display:block;}
                .stw{padding:8px;}.ss{background:rgba(4,30,66,0.06);padding:5px 8px;font-weight:700;font-size:9px;color:#041e42;border-left:3px solid #bf0d3d;margin-bottom:5px;margin-top:10px;}
                .ss:first-child{margin-top:0;}
                .st{width:100%;border-collapse:collapse;font-size:9px;background:white;border-radius:5px;overflow:hidden;box-shadow:0 1px 3px rgba(4,30,66,0.08);}
                .st thead{background:rgba(4,30,66,0.05);}.st th{padding:5px 2px;text-align:center;font-weight:700;font-size:7px;color:#041e42;border-bottom:1px solid rgba(4,30,66,0.1);}
                .st td{padding:4px 2px;text-align:center;border-bottom:1px solid rgba(4,30,66,0.05);font-weight:500;}
                .st tbody tr:last-child td{border-bottom:none;}.st tbody tr:hover{background:rgba(191,13,61,0.04);}
                .pn{text-align:left!important;font-weight:700;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:80px;}
                .bo{font-weight:800;color:#041e42;background:rgba(4,30,66,0.08);}.pp{font-weight:700;font-size:7px;color:rgba(4,30,66,0.6);}
                .pr{background:rgba(191,13,61,0.03);}.pr .bo{background:rgba(191,13,61,0.12);}
                .st th:nth-child(2),.st td:nth-child(2){width:28%;text-align:left;}
            </style>
            <div class="bsc">
                <div class="lsw">
                    <table class="bst">
                        <thead><tr><th>Team</th>${innings.map((_,i)=>`<th>${i+1}</th>`).join('')}<th>R</th><th>H</th><th>E</th></tr></thead>
                        <tbody>
                            <tr><td class="tn"><img src="https://www.mlbstatic.com/team-logos/${awayTeamId}.svg" class="tlb" alt="${awayAbbr}"></td>${innings.map(inn=>`<td>${inn.away?.runs??'--'}</td>`).join('')}<td class="ts">${linescore.teams.away.runs??'--'}</td><td class="ts">${linescore.teams.away.hits??'--'}</td><td class="ts">${linescore.teams.away.errors??'--'}</td></tr>
                            <tr><td class="tn"><img src="https://www.mlbstatic.com/team-logos/${homeTeamId}.svg" class="tlb" alt="${homeAbbr}"></td>${innings.map(inn=>`<td>${inn.home?.runs??'--'}</td>`).join('')}<td class="ts">${linescore.teams.home.runs??'--'}</td><td class="ts">${linescore.teams.home.hits??'--'}</td><td class="ts">${linescore.teams.home.errors??'--'}</td></tr>
                        </tbody>
                    </table>
                </div>
                <div class="tnav">
                    <button class="tbb active" data-tab="away"><img src="https://www.mlbstatic.com/team-logos/${awayTeamId}.svg"><span>${awayTeam.name}</span></button>
                    <button class="tbb" data-tab="home"><img src="https://www.mlbstatic.com/team-logos/${homeTeamId}.svg"><span>${homeTeam.name}</span></button>
                </div>
                <div class="tc active" id="away-content">${teamContent(awayLineup,awayStats)}</div>
                <div class="tc" id="home-content">${teamContent(homeLineup,homeStats)}</div>
            </div>`;

            boxScoreContainer.querySelectorAll('.tbb').forEach(btn=>{
                btn.addEventListener('click',function(){
                    boxScoreContainer.querySelectorAll('.tbb').forEach(b=>b.classList.remove('active'));
                    boxScoreContainer.querySelectorAll('.tc').forEach(c=>c.classList.remove('active'));
                    this.classList.add('active');
                    boxScoreContainer.querySelector(`#${this.dataset.tab}-content`)?.classList.add('active');
                });
            });

        }catch(err){console.error("loadBoxScore error:",err);boxScoreContainer.innerHTML="<p>Error loading box score.</p>";}
    }

    // ── Shared helpers ────────────────────────────────────────────────────────

    function getEventIcon(eventType){
        if(!eventType)return'?';
        const exact={'Single':'1B','Double':'2B','Triple':'3B','Home Run':'HR','Strikeout':'K','Walk':'BB','Intent Walk':'BB','Hit By Pitch':'HBP','Grounded Into DP':'DP','Field Error':'E','Fielders Choice':'FC','Fielders Choice Out':'FC','Double Play':'DP','Catcher Interference':'E2','Caught Stealing 2B':'CS','Caught Stealing 3B':'CS','Pickoff Caught Stealing 2B':'CS','Pickoff Caught Stealing 3B':'CS'};
        if(exact[eventType])return exact[eventType];
        if(eventType.includes('Substitution')||eventType.includes('Switch'))return'↔';
        if(eventType.match(/out|Out/))return'OUT';
        if(eventType.includes('Sac'))return'SAC';
        if(eventType.includes('Error'))return'E';
        return'?';
    }

    function generateSVGField(count,onBase){
        const outFill=(n)=>count.outs>=n?'#bf0d3d':'#e2e8f0';
        const baseFill=(b)=>b?'#bf0d3d':'#e2e8f0';
        return`<svg width="48" height="48" viewBox="0 0 58 79" fill="none" xmlns="http://www.w3.org/2000/svg">
            <circle cx="13" cy="61" r="6" fill="${outFill(1)}" stroke="#bf0d3d" stroke-width="1" opacity="0.85"/>
            <circle cx="30" cy="61" r="6" fill="${outFill(2)}" stroke="#bf0d3d" stroke-width="1" opacity="0.85"/>
            <circle cx="47" cy="61" r="6" fill="${outFill(3)}" stroke="#bf0d3d" stroke-width="1" opacity="0.85"/>
            <rect x="17.6" y="29.7" width="14" height="14" transform="rotate(45 17.6 29.7)" fill="${baseFill(onBase.third)}"  stroke="#bf0d3d" stroke-width="1" opacity="0.85"/>
            <rect x="29.4" y="17.7" width="14" height="14" transform="rotate(45 29.4 17.7)" fill="${baseFill(onBase.second)}" stroke="#bf0d3d" stroke-width="1" opacity="0.85"/>
            <rect x="41.6" y="29.7" width="14" height="14" transform="rotate(45 41.6 29.7)" fill="${baseFill(onBase.first)}"  stroke="#bf0d3d" stroke-width="1" opacity="0.85"/>
        </svg>`;
    }

    function createPlayItem(play,gameData){
        const div=document.createElement('div');
        div.className='play-item';
        const inning=play.about?.inning||1,isTop=play.about?.isTopInning;
        const inningTxt=`${isTop?'Top':'Bot'} ${inning}`;
        const playerId=play.matchup?.batter?.id;
        const playerName=(()=>{if(!playerId||!gameData.gameData?.players)return'Unknown';const p=gameData.gameData.players[`ID${playerId}`];return p?`${p.firstName} ${p.lastName}`:'Unknown';})();
        const eventIcon=getEventIcon(play.result?.event);
        const baserunners={first:!!play.matchup?.postOnFirst,second:!!play.matchup?.postOnSecond,third:!!play.matchup?.postOnThird};
        const count={balls:play.count?.balls||0,strikes:play.count?.strikes||0,outs:play.count?.outs||0};
        const sd=play.playEvents?.find(e=>e?.hitData)?.hitData||{};
        const exitVelo=sd.launchSpeed?`${Math.round(sd.launchSpeed)} mph`:'--';
        const launchAngle=sd.launchAngle?`${Math.round(sd.launchAngle)}°`:'--';
        const distance=sd.totalDistance?`${Math.round(sd.totalDistance)} ft`:'--';
        div.innerHTML=`
            <div style="position:absolute;top:6px;left:6px;background:#bf0d3d;color:white;padding:2px 5px;border-radius:4px;font-size:10px;font-weight:700;">${inningTxt}</div>
            <div style="flex-shrink:0;margin-right:8px;margin-left:44px;position:relative;">
                <img style="width:44px;height:44px;border-radius:50%;border:2px solid #bf0d3d;background:#041e42;object-fit:cover;"
                    src="https://midfield.mlbstatic.com/v1/people/${playerId}/spots/60" alt="${playerName}">
                <div style="position:absolute;bottom:-4px;right:-4px;width:18px;height:18px;border-radius:50%;background:#bf0d3d;display:flex;align-items:center;justify-content:center;font-size:7px;font-weight:800;color:white;border:2px solid white;">${eventIcon}</div>
            </div>
            <div class="content-wrapper">
                <div class="play-details" style="flex:1;margin-top:3px;">
                    <div style="border:2px solid #041e41;color:#041e41;padding:2px 6px;border-radius:999px;font-weight:700;font-size:11px;display:inline-block;margin-bottom:3px;">${play.result?.event||'Unknown'}</div>
                    <p style="color:#333;font-size:11px;line-height:1.3;margin:0 0 4px;font-weight:400;">${play.result?.description||'No description'}</p>
                    <div class="statcast-stats">
                        <div class="stat-item"><div style="font-size:7px;color:rgba(4,30,66,0.5);font-weight:700;text-transform:uppercase;">EV</div><div style="font-size:11px;font-weight:800;color:#bf0d3d;">${exitVelo}</div></div>
                        <div class="stat-item"><div style="font-size:7px;color:rgba(4,30,66,0.5);font-weight:700;text-transform:uppercase;">Angle</div><div style="font-size:11px;font-weight:800;color:#bf0d3d;">${launchAngle}</div></div>
                        <div class="stat-item"><div style="font-size:7px;color:rgba(4,30,66,0.5);font-weight:700;text-transform:uppercase;">Dist</div><div style="font-size:11px;font-weight:800;color:#bf0d3d;">${distance}</div></div>
                    </div>
                </div>
                <div class="game-situation">
                    <div style="font-size:10px;font-weight:700;color:#bf0d3d;">${count.balls}-${count.strikes}</div>
                    ${generateSVGField(count,baserunners)}
                </div>
            </div>`;
        return div;
    }

    // ── All Plays ─────────────────────────────────────────────────────────────

    let allPlaysRefreshInterval=null,lastPlayCount=0,allPlaysRefreshActive=false;

    async function loadAllPlays(){
        let container=document.getElementById('all-plays-container');
        if(!container){
            container=document.createElement('div');
            container.id='all-plays-container';
            document.getElementById('popup-container').appendChild(container);
        }
        try{
            const response=await fetch(`https://statsapi.mlb.com/api/v1.1/game/${gamePk}/feed/live`);
            const gameData=await response.json();
            window.cachedGameData=gameData;
            const allPlays=gameData.liveData?.plays?.allPlays||[];
            const gameInfo=gameData.gameData;
            const gameStatus=gameData.gameData?.status?.detailedState;
            const isLive=isLiveState(gameStatus);
            const currentCount=allPlays.length,hasNew=currentCount>lastPlayCount;
            lastPlayCount=currentCount;
            if(hasNew||container.children.length===0){
                container.innerHTML='';
                if(gameInfo?.venue?.name){
                    const header=document.createElement('div');
                    header.className='game-start-item';
                    const dt=new Date(gameInfo.datetime?.dateTime||gameInfo.gameDate);
                    const city=gameInfo.venue?.location?.city||'',state=gameInfo.venue?.location?.state||'';
                    header.innerHTML=`<div style="font-size:10px;opacity:0.7;font-family:'Rubik';">First Pitch</div>
                        <div style="font-size:14px;font-weight:700;font-family:'Rubik';">${dt.toLocaleTimeString([],{hour:'2-digit',minute:'2-digit'})} · ${gameInfo.venue.name}</div>
                        <div style="font-size:10px;opacity:0.6;font-family:'Rubik';">${city}${state?', '+state:''}</div>`;
                    container.appendChild(header);
                }
                [...allPlays].reverse().forEach((play,i)=>{
                    setTimeout(()=>{container.appendChild(createPlayItem(play,gameData));},i*30);
                });
            }
            if(isLive&&!allPlaysRefreshActive){
                allPlaysRefreshActive=true;
                allPlaysRefreshInterval=setInterval(async()=>{
                    if(document.querySelector('.tab-button.active')?.id!=='all-plays-tab')return;
                    delete window.cachedGameData;await loadAllPlays();
                },10000);
            }else if(!isLive&&allPlaysRefreshInterval){
                clearInterval(allPlaysRefreshInterval);allPlaysRefreshInterval=null;allPlaysRefreshActive=false;
            }
        }catch(err){console.error("loadAllPlays error:",err);container.innerHTML='<div style="text-align:center;padding:16px;color:#666;font-size:12px;">Error loading plays.</div>';}
    }

    // ── Scoring Plays ─────────────────────────────────────────────────────────

    let scoringPlaysRefreshInterval=null;

    async function loadScoringPlays(){
        let container=document.getElementById('scoring-plays-container');
        if(!container){
            container=document.createElement('div');
            container.id='scoring-plays-container';
            container.style.cssText='width:100%;padding:6px;background:#f0f4f8;font-family:Rubik,sans-serif;';
            document.getElementById('popup-container').appendChild(container);
        }
        try{
            const response=await fetch(`https://statsapi.mlb.com/api/v1.1/game/${gamePk}/feed/live`);
            const gameData=await response.json();
            window.cachedGameData=gameData;
            const statusText=gameData.gameData?.status?.detailedState||'';
            const isLive=isLiveState(statusText);
            const scoringPlays=gameData.liveData?.plays?.scoringPlays||[];
            const allPlays=gameData.liveData?.plays?.allPlays||[];
            const gameInfo=gameData.gameData;
            if(scoringPlaysRefreshInterval){clearInterval(scoringPlaysRefreshInterval);scoringPlaysRefreshInterval=null;}
            if(isLive)scoringPlaysRefreshInterval=setInterval(async()=>{delete window.cachedGameData;await loadScoringPlays();},30000);
            container.innerHTML='';
            const statusBar=document.createElement('div');
            statusBar.style.cssText=`text-align:center;padding:5px;margin-bottom:6px;border-radius:5px;font-weight:700;font-size:11px;font-family:'Rubik',sans-serif;background:#041e42;color:white;`;
            statusBar.textContent=isLive?'🔴 LIVE — auto-refreshing':`Status: ${statusText}`;
            container.appendChild(statusBar);
            if(!scoringPlays.length){
                const msg=document.createElement('p');msg.style.cssText='text-align:center;color:#555;margin-top:12px;font-family:Rubik,sans-serif;font-size:12px;';msg.textContent='No scoring plays yet.';container.appendChild(msg);return;
            }
            scoringPlays.forEach((idx,i)=>{const play=allPlays[idx];if(play)container.appendChild(createScoringPlayItem(play,gameInfo,i));});
        }catch(err){console.error("loadScoringPlays error:",err);container.innerHTML='<p style="text-align:center;color:#666;padding:12px;font-size:12px;">Error loading scoring plays.</p>';}
    }

    function createScoringPlayItem(play,gameInfo,index){
        const div=document.createElement('div');
        div.className='play-item';
        div.style.cssText=`opacity:0;transform:translateY(-6px);animation:slideIn 0.2s ease-out ${index*0.06}s forwards;`;
        const batter=play.matchup?.batter;
        const playerId=batter?.id||'',playerName=batter?.fullName||'Unknown';
        const half=play.about?.halfInning==='top'?'Top':'Bot';
        const inningTxt=`${half} ${play.about?.inning||1}`;
        const eventType=play.result?.event||'',eventIcon=getEventIcon(eventType);
        const baserunners={first:!!play.matchup?.postOnFirst,second:!!play.matchup?.postOnSecond,third:!!play.matchup?.postOnThird};
        const count={balls:play.count?.balls||0,strikes:play.count?.strikes||0,outs:play.count?.outs||0};
        let scoreRbiHtml='';
        if(play.result?.homeScore!==undefined){const away=gameInfo.teams?.away?.abbreviation||'Away',home=gameInfo.teams?.home?.abbreviation||'Home';scoreRbiHtml+=`<div style="color:#041e42;font-weight:700;font-size:11px;margin-top:2px;">${away} ${play.result.awayScore} – ${home} ${play.result.homeScore}</div>`;}
        if(play.result?.rbi>0)scoreRbiHtml+=`<div style="color:#10b981;font-weight:700;font-size:11px;">RBI: ${play.result.rbi}</div>`;
        const sd=play.playEvents?.find(e=>e?.hitData)?.hitData||{};
        const exitVelo=sd.launchSpeed?`${Math.round(sd.launchSpeed)} mph`:'--';
        const launchAngle=sd.launchAngle?`${Math.round(sd.launchAngle)}°`:'--';
        const distance=sd.totalDistance?`${Math.round(sd.totalDistance)} ft`:'--';
        div.innerHTML=`
            <div style="position:absolute;top:6px;left:6px;background:#bf0d3d;color:white;padding:2px 5px;border-radius:4px;font-size:10px;font-weight:700;">${inningTxt}</div>
            <div style="flex-shrink:0;margin-right:8px;margin-left:44px;position:relative;">
                <img style="width:44px;height:44px;border-radius:50%;border:2px solid #bf0d3d;background:#041e42;object-fit:cover;"
                    src="https://midfield.mlbstatic.com/v1/people/${playerId}/spots/60" alt="${playerName}">
                <div style="position:absolute;bottom:-4px;right:-4px;width:18px;height:18px;border-radius:50%;background:#bf0d3d;display:flex;align-items:center;justify-content:center;font-size:7px;font-weight:800;color:white;border:2px solid white;">${eventIcon}</div>
            </div>
            <div class="content-wrapper">
                <div class="play-details" style="flex:1;margin-top:3px;">
                    <div style="border:2px solid #041e42;color:#041e42;padding:2px 6px;border-radius:999px;font-weight:700;font-size:11px;display:inline-block;margin-bottom:3px;">${play.result?.event||'Unknown'}</div>
                    <p style="color:#333;font-size:11px;line-height:1.3;margin:0 0 3px;font-weight:400;">${play.result?.description||''}</p>
                    ${scoreRbiHtml}
                    <div class="statcast-stats">
                        <div class="stat-item"><div style="font-size:7px;color:rgba(4,30,66,0.5);font-weight:700;text-transform:uppercase;">EV</div><div style="font-size:11px;font-weight:800;color:#bf0d3d;">${exitVelo}</div></div>
                        <div class="stat-item"><div style="font-size:7px;color:rgba(4,30,66,0.5);font-weight:700;text-transform:uppercase;">Angle</div><div style="font-size:11px;font-weight:800;color:#bf0d3d;">${launchAngle}</div></div>
                        <div class="stat-item"><div style="font-size:7px;color:rgba(4,30,66,0.5);font-weight:700;text-transform:uppercase;">Dist</div><div style="font-size:11px;font-weight:800;color:#bf0d3d;">${distance}</div></div>
                    </div>
                </div>
                <div class="game-situation">
                    <div style="font-size:10px;font-weight:700;color:#bf0d3d;">${count.balls}-${count.strikes}</div>
                    ${generateSVGField(count,baserunners)}
                </div>
            </div>`;
        try{initializeVideoMatcher().addVideoButtonToPlay(div,gamePk,play);}catch(e){}
        return div;
    }

    // ── Win Probability ───────────────────────────────────────────────────────

    const MLB_TEAM_COLORS={108:'#BA0021',109:'#A71930',110:'#DF4601',111:'#BD3039',112:'#0E3386',113:'#C6011F',114:'#00385D',115:'#333366',116:'#0C2340',117:'#EB6E1F',118:'#004687',119:'#005A9C',120:'#AB0003',121:'#002D72',133:'#003831',134:'#FDB827',135:'#2F241D',136:'#005C5C',137:'#FD5A1E',138:'#C41E3A',139:'#8FBCE6',140:'#003278',141:'#134A8E',142:'#002B5C',143:'#E81828',144:'#CE1141',145:'#27251F',146:'#00A3E0',147:'#0C2340',158:'#12284B'};
    const WBC_COLORS={"Japan":'#BC002D',"USA":'#BF0A30',"Korea":'#CD2E3A',"Venezuela":'#CF0921',"Mexico":'#006847',"Puerto Rico":'#ED0000',"Dominican Republic":'#002D62',"Canada":'#FF0000',"Cuba":'#002A8F',"Italy":'#009246'};
    const getTeamColor=(id,name='')=>MLB_TEAM_COLORS[id]||(name&&WBC_COLORS[name])||'#535557';

    async function loadWinProbability(){
        let container=document.getElementById('win-prob-container');
        if(!container){
            container=document.createElement('div');
            container.id='win-prob-container';
            container.style.cssText='width:100%;padding:8px;font-family:Rubik,sans-serif;display:none;';
            document.getElementById('popup-container').appendChild(container);
        }
        container.style.display='block';
        container.innerHTML='<p style="text-align:center;padding:16px;color:#555;font-size:12px;">Loading Win Probability…</p>';
        try{
            const[wpRes,gameRes]=await Promise.all([
                fetch(`https://statsapi.mlb.com/api/v1/game/${gamePk}/winProbability`),
                fetch(`https://statsapi.mlb.com/api/v1.1/game/${gamePk}/feed/live`)
            ]);
            const activeTab=document.querySelector('.tab-button.active');
            if(!activeTab||activeTab.id!=='win-prob-tab'){container.style.display='none';return;}
            const wpData=await wpRes.json(),gameData=await gameRes.json();
            const away=gameData.gameData.teams.away,home=gameData.gameData.teams.home;
            const awayColor=getTeamColor(away.id,away.name),homeColor=getTeamColor(home.id,home.name);
            const awayAbbr=away.abbreviation||away.teamName,homeAbbr=home.abbreviation||home.teamName;
            if(!wpData?.length){container.innerHTML=`<p style="text-align:center;color:#555;padding:16px;font-size:12px;">Win probability data not available.</p>`;return;}
            const latest=wpData[wpData.length-1];
            const homeProb=Math.round(latest.homeTeamWinProbability),awayProb=Math.round(latest.awayTeamWinProbability);

            // Chart dims for narrow window
            const W=340,H=160,PL=30,PR=12,PT=12,PB=22;
            const CW=W-PL-PR,CH=H-PT-PB;
            const stepX=CW/(wpData.length-1||1);
            const midY=PT+CH/2;

            const pts=wpData.map((d,i)=>({
                x:PL+i*stepX,y:PT+CH/2+((d.homeTeamWinProbability-50)/50)*(CH/2),
                homeProb:d.homeTeamWinProbability,awayProb:d.awayTeamWinProbability,
                added:d.homeTeamWinProbabilityAdded,event:d.result?.event||'',
                desc:d.result?.description||'',inning:d.about?.inning||'',isTop:d.about?.isTopInning,
            }));

            const linePoints=pts.map(p=>`${p.x},${p.y}`).join(' ');
            const polyPts=[`${PL},${midY}`,...pts.map(p=>`${p.x},${p.y}`),`${PL+CW},${midY}`].join(' ');

            let inningLines='',lastInn=0;
            pts.forEach(p=>{
                if(p.inning&&p.inning!==lastInn&&p.isTop){
                    lastInn=p.inning;
                    inningLines+=`<line x1="${p.x}" y1="${PT}" x2="${p.x}" y2="${PT+CH}" stroke="rgba(4,30,66,0.1)" stroke-width="1" stroke-dasharray="3,3"/>
                    <line x1="${p.x}" y1="${PT+CH}" x2="${p.x}" y2="${PT+CH+4}" stroke="#041e42" stroke-width="1"/>
                    <text x="${p.x}" y="${PT+CH+12}" text-anchor="middle" font-size="7" fill="#041e42" font-family="Rubik">${p.inning}</text>`;
                }
            });

            const tooltipId=`wp-tip-${gamePk}`;
            container.innerHTML=`
                <style>
                    #${tooltipId}{position:absolute;background:#041e42;color:white;padding:6px 8px;border-radius:7px;font-size:10px;font-family:Rubik,sans-serif;pointer-events:none;display:none;max-width:160px;line-height:1.4;z-index:100;border-left:3px solid #bf0d3d;box-shadow:0 4px 10px rgba(0,0,0,0.3);}
                    #${tooltipId} .tt-event{font-weight:700;font-size:11px;color:#bf0d3d;margin-bottom:2px;}
                    #${tooltipId} .tt-desc{color:#ccc;font-size:9px;margin-bottom:3px;}
                    #${tooltipId} .tt-probs{display:flex;justify-content:space-between;gap:8px;margin-top:3px;border-top:1px solid rgba(255,255,255,0.12);padding-top:3px;}
                    .tt-away{color:${awayColor};font-weight:600;filter:brightness(1.8);}
                    .tt-home{color:${homeColor};font-weight:600;filter:brightness(1.8);}
                    .tt-pos{color:#10b981;font-size:9px;}.tt-neg{color:#ef4444;font-size:9px;}
                </style>
                <div style="text-align:center;font-weight:700;font-size:9px;color:rgba(4,30,66,0.4);text-transform:uppercase;letter-spacing:1.5px;margin-bottom:6px;">Win Probability</div>
                <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px;padding:0 2px;">
                    <div style="display:flex;align-items:center;gap:5px;"><img src="https://www.mlbstatic.com/team-logos/${away.id}.svg" style="width:18px;height:18px;"><span style="font-size:18px;font-weight:800;color:#041e42;">${awayProb}%</span></div>
                    <div style="font-size:8px;color:#999;font-weight:600;letter-spacing:0.5px;">WIN PROBABILITY</div>
                    <div style="display:flex;align-items:center;gap:5px;"><span style="font-size:18px;font-weight:800;color:#bf0d3d;">${homeProb}%</span><img src="https://www.mlbstatic.com/team-logos/${home.id}.svg" style="width:18px;height:18px;"></div>
                </div>
                <div style="display:flex;height:4px;border-radius:2px;overflow:hidden;margin:0 2px 8px;">
                    <div style="width:${awayProb}%;background:${awayColor};"></div><div style="width:${homeProb}%;background:${homeColor};"></div>
                </div>
                <div style="position:relative;width:100%;">
                    <div id="${tooltipId}"></div>
                    <svg id="wp-svg-${gamePk}" width="100%" viewBox="0 0 ${W} ${H}" style="overflow:visible;display:block;">
                        <rect x="${PL}" y="${PT}" width="${CW}" height="${CH}" fill="#f7fafc" rx="2"/>
                        <polygon points="${polyPts}" fill="${awayColor}" opacity="0.85" clip-path="url(#ct-${gamePk})"/>
                        <polygon points="${polyPts}" fill="${homeColor}" opacity="0.85" clip-path="url(#cb-${gamePk})"/>
                        <defs>
                            <clipPath id="ct-${gamePk}"><rect x="${PL}" y="${PT}" width="${CW}" height="${CH/2}"/></clipPath>
                            <clipPath id="cb-${gamePk}"><rect x="${PL}" y="${PT+CH/2}" width="${CW}" height="${CH/2}"/></clipPath>
                        </defs>
                        <line x1="${PL}" y1="${midY}" x2="${PL+CW}" y2="${midY}" stroke="#bbb" stroke-width="1" stroke-dasharray="3,2"/>
                        <text x="${PL-3}" y="${midY+3}" text-anchor="end" font-size="7" fill="#999" font-family="Rubik">50%</text>
                        <text x="${PL-3}" y="${PT+4}" text-anchor="end" font-size="7" fill="${awayColor}" font-family="Rubik">${awayAbbr}</text>
                        <text x="${PL-3}" y="${PT+CH+3}" text-anchor="end" font-size="7" fill="${homeColor}" font-family="Rubik">${homeAbbr}</text>
                        ${inningLines}
                        <polyline points="${linePoints}" fill="none" stroke="rgba(4,30,66,0.5)" stroke-width="1.5" stroke-linejoin="round"/>
                        ${pts.map((p,i)=>{
                            const x=i===0?PL:pts[i-1].x+(p.x-pts[i-1].x)/2;
                            const nx=i===pts.length-1?PL+CW:p.x+(pts[i+1].x-p.x)/2;
                            const sign=(p.added??0)>=0?'+':'';
                            const acls=(p.added??0)>=0?'tt-pos':'tt-neg';
                            const inn=p.inning?`${p.isTop?'Top':'Bot'} ${p.inning}`:'';
                            const safeDesc=(p.desc||'').replace(/'/g,"\\'").replace(/"/g,'&quot;');
                            const safeEvent=(p.event||'').replace(/'/g,"\\'");
                            return`<rect x="${x}" y="${PT}" width="${nx-x}" height="${CH}" fill="transparent" class="wp-zone" style="cursor:crosshair;"
                                data-x="${p.x}" data-y="${p.y}" data-home="${p.homeProb.toFixed(1)}" data-away="${p.awayProb.toFixed(1)}"
                                data-added="${p.added!=null?p.added.toFixed(1):'N/A'}" data-acls="${acls}" data-sign="${sign}"
                                data-event="${safeEvent}" data-desc="${safeDesc}" data-inn="${inn}"/>`;
                        }).join('')}
                        <circle id="wp-dot-${gamePk}" cx="0" cy="0" r="3" fill="white" stroke="rgba(4,30,66,0.5)" stroke-width="2" style="display:none;pointer-events:none;"/>
                        <text x="${PL+CW/2}" y="${H-1}" text-anchor="middle" font-size="7" fill="#041e42" font-family="Rubik">Inning</text>
                    </svg>
                </div>
                <div style="display:flex;justify-content:center;gap:12px;margin-top:5px;font-size:10px;">
                    <div style="display:flex;align-items:center;gap:4px;"><div style="width:10px;height:3px;background:${awayColor};border-radius:2px;"></div>${away.name}</div>
                    <div style="display:flex;align-items:center;gap:4px;"><div style="width:10px;height:3px;background:${homeColor};border-radius:2px;"></div>${home.name}</div>
                </div>`;

            const svg=document.getElementById(`wp-svg-${gamePk}`);
            const tooltip=document.getElementById(tooltipId);
            const dot=document.getElementById(`wp-dot-${gamePk}`);
            const wrapper=svg.parentElement;

            svg.querySelectorAll('.wp-zone').forEach(zone=>{
                zone.addEventListener('mouseenter',()=>{
                    dot.setAttribute('cx',zone.dataset.x);dot.setAttribute('cy',zone.dataset.y);dot.style.display='block';
                    const addedLine=zone.dataset.added!=='N/A'?`<span class="${zone.dataset.acls}">${zone.dataset.sign}${zone.dataset.added}% WP shift</span>`:'';
                    tooltip.innerHTML=`
                        ${zone.dataset.inn?`<div style="font-size:8px;color:#888;margin-bottom:2px;">${zone.dataset.inn}</div>`:''}
                        ${zone.dataset.event?`<div class="tt-event">${zone.dataset.event}</div>`:''}
                        ${zone.dataset.desc?`<div class="tt-desc">${zone.dataset.desc}</div>`:''}
                        ${addedLine}
                        <div class="tt-probs"><span class="tt-away">${awayAbbr} ${zone.dataset.away}%</span><span class="tt-home">${homeAbbr} ${zone.dataset.home}%</span></div>`;
                    tooltip.style.display='block';
                });
                zone.addEventListener('mousemove',(e)=>{
                    const rect=wrapper.getBoundingClientRect();
                    let left=e.clientX-rect.left+10,top=e.clientY-rect.top-8;
                    if(left+160>rect.width)left=e.clientX-rect.left-170;
                    if(top<0)top=0;
                    tooltip.style.left=`${left}px`;tooltip.style.top=`${top}px`;
                });
                zone.addEventListener('mouseleave',()=>{tooltip.style.display='none';dot.style.display='none';});
            });

        }catch(err){
            console.error("loadWinProbability error:",err);
            const active=document.querySelector('.tab-button.active');
            if(active?.id==='win-prob-tab')container.innerHTML='<p style="text-align:center;color:#666;padding:16px;font-size:12px;">Error loading win probability.</p>';
            else container.style.display='none';
        }
    }

    // ── Visibility change ─────────────────────────────────────────────────────

    document.addEventListener('visibilitychange',()=>{
        if(document.hidden){if(allPlaysRefreshInterval){clearInterval(allPlaysRefreshInterval);allPlaysRefreshActive=false;}}
        else{const active=document.querySelector('.tab-button.active');if(active?.id==='all-plays-tab')loadAllPlays();}
    });

    // ── slideIn animation ─────────────────────────────────────────────────────

    if(!document.querySelector('#fp-slide-in-style')){
        const s=document.createElement('style');s.id='fp-slide-in-style';
        s.textContent=`@keyframes slideIn{to{opacity:1;transform:translateY(0);}}`;
        document.head.appendChild(s);
    }

});