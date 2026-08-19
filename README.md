# MLB Scoreboards

A live Game Thread experience for Major League Baseball communities on Reddit. Built on Devvit Web.

---

## Overview

MLB Scoreboards turns ordinary Reddit posts into real-time, data-rich scoreboards. Each post auto-renders its assigned game with score, situation, box score, scoring plays, win probability, and final wrap — all updating every 10 seconds while the game is in progress.

Beyond the live scoreboard itself, the app handles the full lifecycle of MLB threads for moderators: game threads, postgame threads, postponement notices, suspended-game displays, and off-day discussion threads — all generated based on schedule and game state.

The app runs in either of two modes, set per subreddit with no code changes:

- **Game Thread mode** (default) — the app is your subreddit's game-thread system: it posts game threads, and (optionally) automatic postgame threads, postponement notices, and off-day discussions.
- **Broadcast mode** — the app runs as an advanced/analytics **companion** alongside your existing game threads. Posts use a custom label instead of "Game Thread," and the app posts nothing automatically — only the threads a mod creates from the menu.

It is designed for both ends of the MLB subreddit spectrum:

- **Team subreddits** (r/Reds, r/Yankees, r/Dodgers, etc.) that want focused threads for only their team's games.
- **Aggregator subreddits** (r/MLBScoreboards and similar) that want a thread for every game on the slate.

A single per-subreddit setting — **MLB Team Filter** — switches between these two audiences.

---

## Features

### Thread modes

| Mode | Behavior |
|------|----------|
| **Game Thread** (default) | Standard operation. Posts a Game Thread per game; posts an automatic Postgame Thread when a game ends (if enabled); posts postponement notices and off-day discussions automatically. |
| **Broadcast** | Companion mode. Posts use a mod-defined **Broadcast label** ("Broadcast Thread", "Advanced View", "Live Scoreboard", etc.) instead of "Game Thread." The app **never auto-posts anything** — no postgame threads, no postponement notices, no off-day threads. Only mod-created threads are posted. Built for subs that want to keep their existing game threads and add a live second screen. |

### Thread types

| Thread | When |
|--------|------|
| **Game Thread** | Posted manually via mod menu. Pre-game probable pitchers, live in-game scoreboard, final wrap — the same post evolves through all three states. In Broadcast mode, titled with the Broadcast label. |
| **Postgame Thread** | Posted automatically the moment a game ends (or manually via mod menu). Title includes final score; supports custom mod-defined templates with placeholders. *Auto-posting is disabled in Broadcast mode.* |
| **Postponement Notice** | Posted automatically within ~1 minute of MLB officially postponing a game. Dedicated POSTPONED visual with reason and doubleheader note when applicable. *Disabled in Broadcast mode.* |
| **Suspended Game Display** | An existing thread automatically detects mid-game suspension. Shows SUSPENDED headline with the inning where play stopped. Linescore stays visible. |
| **Off-Day Discussion** | For team-specific subs only, Game Thread mode only. When the team has no game scheduled, the menu posts a discussion thread with last result and next scheduled game. In Broadcast mode, the menu simply reports no games. |

### Broadcast delay (spoiler protection)

An optional per-subreddit **Broadcast delay** holds the live scoreboard data back by a fixed number of seconds (Off / 5 / 8 / 10 / 12 / 15 / 20) so fans following along on a slightly delayed TV or stream aren't spoiled by seeing a play in the thread before it reaches their screen. It applies in **both** thread modes and is independent of the Thread type setting. Because each point-in-time snapshot from the MLB feed is complete and the selected moment only ever advances, no play or pitch is ever skipped — the game simply runs the chosen number of seconds behind.

### Scoreboard tabs

| Tab | Contents |
|-----|----------|
| **Live / Pregame / Wrap / PPD / Suspended** | State-aware default tab. Pregame shows probable pitchers and first pitch. Live shows the active batter and pitcher, K-zone with numbered pitch dots, base/outs scorebug, latest-pitch chip with velocity and result. Wrap shows W/L pitcher decisions and top performers. Postponed and Suspended states get their own news-style displays. |
| **Box Score** | Batting and pitching tables for both teams. Toggle between away and home with an animated underline. Internal scroll preserves position across polls. |
| **Scoring Plays** | Every run-producing event with mini-scorebug, RBI counter, and Statcast chips (exit velocity, launch angle, distance). |
| **All Plays** | Full play log, newest first, filtered to completed plays. |
| **Win Probability** | Inning-by-inning chart with team-colored polygons. Hover any zone on desktop or tap on mobile to see the play that drove the swing, the WP delta, and the resulting probabilities. |

### Inline vs. expanded rendering

The in-feed (inline) view complies with Reddit's no-scroll-trapping rule: the body doesn't capture scroll, so the feed scrolls past cleanly. Long panels (box score, plays) are navigated with up/down pager buttons that scroll the panel programmatically (an `overflow: hidden` panel still responds to `scrollBy`, so gestures pass through to the feed). Expanded mode restores native scroll.

### Game-type context

Every type of MLB game is handled with appropriate title prefixes and an in-card context pill:

- **Regular Season** — Standard titles. No prefix.
- **Spring Training** — "Spring Training" prefix; visible context pill in card.
- **Postseason** — Title and context pill reflect the series and game number ("ALDS Game 3", "World Series Game 7", "AL Wild Card", etc.). All four rounds detected automatically.
- **All-Star Game** — "All-Star Game" prefix; visible context pill.
- **Exhibition** — "Exhibition" prefix; visible context pill.
- **Doubleheaders** — "(Game 1)" / "(Game 2)" suffix on every title. Context pill reads "GAME 1 OF 2". Combinations like postseason doubleheaders render correctly ("[ALDS Game 3] ... (Game 1)").

### Custom postgame titles

Mods can configure signature subreddit phrases for win/loss postgame posts. Both fields support placeholders:

- `{team}` — your team's name
- `{opp}` — opponent's name
- `{teamScore}` — your team's score
- `{oppScore}` — opponent's score

**Example:** `THEEEE YANKEES WIN! {team} {teamScore}, {opp} {oppScore}` produces `THEEEE YANKEES WIN! New York Yankees 7, Boston Red Sox 3`.

For postseason games, a bracketed context prefix is auto-prepended (e.g. `[ALDS Game 3] THEEEE YANKEES WIN!...`). Doubleheader suffix appends automatically.

### Design

- Theme-aware: follows the reader's Reddit light/dark scheme, with an in-app toggle. MLB-aligned red (`#bf0d3d`) and navy (`#0a1828`) palette.
- Per-team color theming on the Win Probability chart, with a dark-mode-tuned palette so historically dark colors (Padres brown, Dodgers navy, etc.) stay readable on dark backgrounds.
- Custom branded scrollbar with a white-to-red gradient that glows on hover.
- Rubik / Oswald / DM Mono typography.
- State-aware body classes (`is-pregame`, `is-live`, `is-final`, `is-postponed`, `is-suspended`) enable per-state CSS overrides.

---

## Installation

MLB Scoreboards is **published and installable via direct link** — currently *unlisted* (approved and installable, but not yet surfaced in the Apps directory search). Public directory listing is in progress.

- **Install:** https://developers.reddit.com/apps/mlb-scores
- **See it live:** https://www.reddit.com/r/MLBScoreboards/ (best during a game)

Questions or help getting set up: [u/0xgod](https://reddit.com/u/0xgod).

---

## Configuration

After installation, configure via **Mod Tools → Community Apps → mlb-scores → Settings**.

| Setting | Description |
|---------|-------------|
| **MLB Team Filter** | The team your subreddit follows. Threads only post for that team's games. Choose **All Teams (post every game)** for league-wide subs. |
| **Auto-post postgame threads** | When enabled (default), a Postgame Thread posts automatically when a game ends. Disable for single-thread subs — postponement notices still fire since they're informational. (No effect in Broadcast mode, which never auto-posts.) |
| **Thread type** | **Game Thread** (default) for standard operation, or **Broadcast Thread** to run as a hands-off companion. See *Thread modes* above. |
| **Broadcast label** | Only used in Broadcast mode — the wording used in place of "Game Thread" in post titles (e.g. "Broadcast Thread", "Advanced View", "Live Scoreboard"). Defaults to "Broadcast Thread". |
| **Broadcast delay** | Delays the live scoreboard data by a fixed number of seconds (Off / 5 / 8 / 10 / 12 / 15 / 20) so viewers on a slightly delayed TV or stream aren't spoiled. Applies in **both** thread modes, independent of Thread type. No plays are skipped — the scoreboard just runs this far behind. Defaults to Off. |
| **Postgame Win Title** | Optional custom title template used when the configured team wins. Supports the placeholders above. Leave blank for the default. |
| **Postgame Loss Title** | Optional custom title template used when the configured team loses. Same placeholders. Leave blank for the default. |

Custom titles only apply when a specific team is configured. "All Teams" subs always use the default format.

---

## Usage

Open the moderator menu on your subreddit (the `⋯` icon) and select:

- **Post today's MLB game threads** — Posts a thread for every game on today's slate (using your Broadcast label in Broadcast mode). In Game Thread mode, if the configured team has no game today, posts an Off-Day Discussion instead; in Broadcast mode, it simply reports no games. Skips games that already have threads.
- **Post postgame threads for completed games** — Sweeps recent games and creates Postgame Thread or Postponement Notice posts for any that need them. Works as a mod override even in Broadcast mode.
- **Allow re-posting removed game threads** — Clears today's dedup keys so removed threads can be re-posted.

In Game Thread mode, postgame threads and postponement notices fire automatically via a background cron, so day-to-day mod work is usually just running the morning menu.

---

## Tech Stack

- **Platform** — Devvit Web (Reddit's Node.js app platform)
- **Frontend** — Vanilla TypeScript, no framework. Inline-rendered `splash.html` with state-aware tab navigation, CSS custom properties, and inline SVG (K-zone, Win Probability, mini-scorebugs)
- **Backend** — Node.js server bundled as CommonJS, with Redis for dedup keys, post-to-gamePk mapping, and post-type tracking
- **Data** — [MLB Stats API](https://statsapi.mlb.com) for schedule, live game feed, and win probability. No wrapper library — the client calls the app's own `/api/*` routes; the server proxies MLB and short-caches responses in Redis, so upstream load is flat regardless of audience.

---

## Project Structure

```
mlb-scores/
├── devvit.json              # App manifest — permissions, post entrypoints, menu, settings, triggers
├── public/
│   ├── splash.html          # Scoreboard markup
│   ├── splash.css           # Design system + tab layouts + Win Prob styles
│   ├── splash.ts            # Rendering, polling, win prob, tab switching, inline pager
│   ├── diamond.png          # Background graphic
│   └── teams/               # Team logo SVGs (light + dark variants)
├── src/
│   └── server/
│       └── server.ts        # MLB API proxies, menu handlers, triggers, settings readers
└── tools/
    └── build.ts             # Build watcher
```

---

## Development

```bash
# Install / update the Devvit toolchain (local to the project)
npm install @devvit/web@latest devvit@latest

# Build (compiles the client to public/splash.js and the server to dist/server)
npm run build

# Watch mode during development
npm run dev

# Push a new version to Reddit's servers
devvit upload

# Submit a version for review / the public directory
devvit publish
```

**Deploying an update:** after `devvit upload`, bump the installed version on each subreddit's app-settings page — a post runs the app version it was created with, so a fresh upload only takes effect on posts created after the installed version is bumped. Test on newly created posts.

**Upload vs. publish:** `upload` pushes a build to Reddit and lets you run it on subs you moderate (private to you until published). `publish` submits a version into review / the public directory. Iterate with `upload`; `publish` only when a new version should become the public one.

---

## Architecture Notes

### Post-type tracking

Each thread the app creates is tagged in Redis with both its `gamePk` (which game) and its `postType` (`game`, `postgame`, `postponed`, or implicit off-day). When the splash loads, it reads both. This lets the splash force the correct UI state regardless of what `/feed/live` currently reports — important because the live-feed endpoint can lag MLB's official postponement announcement by hours, while the cron-driven postponement notice is posted within a minute.

### Per-post game linking

When the bulk poster creates a thread, it writes a `post-game:{postId} → gamePk` mapping to Redis. The splash calls `/api/post-game` on load to look up which game its post is for. If no mapping exists (an archived thread whose mapping expired past ~180 days), it renders a neutral "Thread Ended" bookend rather than guessing a game. This means a sub can have multiple threads on the same day, each rendering its own game, with zero ambiguity.

### ET-anchored scheduling

The Devvit server runs in UTC. Clicking the menu at 11pm ET would otherwise fetch tomorrow's games. `todayDateStr()` uses `sv-SE` locale formatting with the `America/New_York` timezone to anchor "today" to MLB's scheduling day. The same logic underpins postponement detection, postgame sweeps, and off-day fallback.

### Game status detection

MLB Stats API's status codes are nuanced:

- **Postponed** (`codedGameState === "D"`) carries `abstractGameState: "Final"` even though no play happened. Detected before the Final branch in `handlePostgameOrPostponement`.
- **Suspended** (`codedGameState === "U"`) carries `abstractGameState: "Live"` — game paused mid-play. The cron correctly ignores suspended games (postgame branch requires `abstractGameState === "Final"`). The splash detects suspended state via a `startsWith("Suspended")` check.
- **Cancelled** (`codedGameState === "C"`) is skipped entirely — no postgame thread.

State helpers (`isFinalState`, `isPreGameState`, `isLiveState`, `isSuspendedState`) live at the top of `splash.ts` and are the single source of truth for state branching.

### Cron sweep

A 1-minute scheduler iterates today's and yesterday's games, calling `handlePostgameOrPostponement` for each. Final games get postgame threads; postponed games get postponement notices. **In Broadcast mode the sweep is a no-op** (it early-returns), so the companion never auto-posts. Off-day threads are never created via cron — they're menu-only, Game Thread mode only.

### Polling lifecycle

The splash polls `/api/game/{pk}` every 10 seconds while a game is live, pauses when the post scrolls out of view (`document.hidden`), and stops entirely once the game reaches a terminal state (Final / Postponed), so a days-long postgame thread doesn't poll forever.

### Auto-cleanup on delete/remove

The `on-post-delete` and `on-mod-action` triggers (the latter filtering for `removelink` / `spamlink`) call `cleanDedupForPost`, which removes all Redis keys associated with that post: the game/postgame/postponed dedup key, the `post-game` reverse lookup, and the `post-type` marker. Off-day threads have their own keying handled separately.

### Anti-flicker scroll preservation

The box score and plays tabs save scroll position before re-render and restore it after, so background 10-second polls don't snap the user back to the top mid-scroll.

---

## Roadmap

- [ ] Pre-game scheduled auto-posting via Devvit scheduler (currently mod-triggered)
- [ ] Adaptive polling: 2s during live at-bats, 30s pregame, 10s default
- [ ] Network broadcast logos (ESPN, FOX, Apple TV+, etc.) in the meta strip
- [ ] Optional auto-pin of created game threads
- [ ] Auto-flair created posts
- [ ] Standings widget on the dashboard
- [ ] Favorite-team notifications
- [ ] WBC support (`sportId=51`)
- [ ] Skip Spring Training setting for subs that don't want spring coverage

---

## Credits

Built by [u/0xgod](https://reddit.com/u/0xgod).

Data provided by the [MLB Stats API](https://statsapi.mlb.com).

Not affiliated with Major League Baseball Properties, Inc.

---

## License

MIT License — see [LICENSE](./LICENSE) for full text.

Copyright (c) 2026 0X676F64