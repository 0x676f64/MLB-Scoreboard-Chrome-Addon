// src/client/splash.ts
//
// CHANGES IN THIS REVISION
//   1. Expanded mode  — imports requestExpandedMode/getWebViewMode and injects a
//      full-screen button (setupExpand). Inline web views sit inside Reddit's
//      feed, which captures vertical scroll; expanded mode owns the viewport so
//      native scrolling works with zero touch handlers. Self-contained: no
//      HTML/CSS edits required.
//   2. Polling stops on terminal states (Final / Postponed) — a days-long
//      postgame thread no longer polls the MLB API forever.
//   3. Polling pauses while the post is off-screen (document.hidden) and
//      refreshes the moment it returns to view.
//   4. selectTodaysGame() now resolves "today" in US Eastern (matching the
//      server), not the viewer's local clock.
//
// NOTE: this file now imports from "@devvit/web/client". Make sure your client
// build runs esbuild with platform:"browser" (or conditions:["browser"]) so the
// import resolves to the browser entry rather than the server-panic stub.

import { requestExpandedMode, getWebViewMode, navigateTo } from "@devvit/web/client";

// ── Constants ─────────────────────────────────────────────────────────────

const FINAL_STATES: string[] = [
  "Final", "Game Over", "Final: Tied",
  "Completed Early", "Completed Early: Rain", "Completed Early: Mercy",
  "Cancelled", "Cancelled: Rain"
];
const PRE_GAME_STATES: string[] = ["Pre-Game", "Scheduled", "Warmup"];

const isFinalState = (s: string): boolean => FINAL_STATES.includes(s);
const isPreGameState = (s: string): boolean => PRE_GAME_STATES.includes(s);
const isSuspendedState = (s: string): boolean => s.startsWith("Suspended");
const isLiveState = (s: string): boolean =>
  !isFinalState(s) && !isPreGameState(s) &&
  !["Postponed", "Suspended", "Suspended: Rain", "Cancelled", "Cancelled: Rain", "Delayed"].includes(s);

// A game in one of these states is done changing — nothing left to poll for.
const isTerminalState = (s: string): boolean => isFinalState(s) || s === "Postponed";

// MLB-only team IDs — used by getLogoPath for the dark cap variants
const MLB_TEAM_IDS: Set<number> = new Set([
  108, 109, 110, 111, 112, 113, 114, 115, 116, 117,
  118, 119, 120, 121, 133, 134, 135, 136, 137, 138,
  139, 140, 141, 142, 143, 144, 145, 146, 147, 158
]);

// ── Pitch type catalog ────────────────────────────────────────────────────

type PitchInfo = { label: string; abbr: string; color: string };

const PITCH_MAP: Record<string, PitchInfo> = {
  FF: { label: "4-Seam",    abbr: "FF", color: "#e63946" },
  FA: { label: "4-Seam",    abbr: "FF", color: "#e63946" },
  FT: { label: "2-Seam",    abbr: "FT", color: "#c1121f" },
  SI: { label: "Sinker",    abbr: "SI", color: "#c1121f" },
  FC: { label: "Cutter",    abbr: "FC", color: "#f4a261" },
  SL: { label: "Slider",    abbr: "SL", color: "#2a9d8f" },
  ST: { label: "Sweeper",   abbr: "ST", color: "#fb8500" },
  SV: { label: "Slurve",    abbr: "SV", color: "#3a86ff" },
  CU: { label: "Curve",     abbr: "CU", color: "#457b9d" },
  KC: { label: "Knuck-Cur", abbr: "KC", color: "#457b9d" },
  CS: { label: "Slow Cur",  abbr: "CS", color: "#457b9d" },
  CH: { label: "Change",    abbr: "CH", color: "#8338ec" },
  FS: { label: "Splitter",  abbr: "FS", color: "#06d6a0" },
  FO: { label: "Forkball",  abbr: "FO", color: "#06d6a0" },
  KN: { label: "Knuckle",   abbr: "KN", color: "#adb5bd" },
  EP: { label: "Eephus",    abbr: "EP", color: "#adb5bd" },
  PO: { label: "Pitchout",  abbr: "PO", color: "#6c757d" },
  IN: { label: "Int. Ball", abbr: "IN", color: "#6c757d" },
};

function pitchInfo(code: string | undefined): PitchInfo {
  return PITCH_MAP[code || ""] ||
    { label: code || "?", abbr: code || "?", color: "#94a3b8" };
}

// ── Strike zone geometry ──────────────────────────────────────────────────

const ZONE_W = 120, ZONE_H = 155;
const SZ_LEFT = 22, SZ_RIGHT = 98, SZ_TOP = 24, SZ_BOT = 108;
const SZ_CX: number = (SZ_LEFT + SZ_RIGHT) / 2;
const PX_PER_FT: number = (SZ_RIGHT - SZ_LEFT) / 1.7;
const PZ_TOP_FT = 3.5, PZ_BOT_FT = 1.5;
const DZ_LEFT: number = SZ_LEFT + 6, DZ_RIGHT: number = SZ_RIGHT - 6;
const DZ_TOP: number = SZ_TOP + 5, DZ_BOT: number = SZ_BOT - 12;

function mapPx(pX: number): number { return SZ_CX + pX * PX_PER_FT; }

function mapPz(pZ: number): number {
  return SZ_BOT - ((pZ - PZ_BOT_FT) / (PZ_TOP_FT - PZ_BOT_FT)) * (SZ_BOT - SZ_TOP);
}

// ── Theme-aware SVG palette ────────────────────────────────────────────────
// The DOM flips via CSS tokens, but inline SVG strings bake their colors in, so
// the white-on-dark values here swap to navy-on-light when data-theme="light".
// Reds and the saturated chip colors read fine in both themes and stay put.
type SvgInk = {
  empty: string; faint: string; mid: string; strong: string;
  label: string; grid: string; chartBg: string; dotFill: string; dotRing: string;
};
function svgInk(): SvgInk {
  const light = document.documentElement.getAttribute("data-theme") === "light";
  return light
    ? { empty: "rgba(10,24,40,0.10)", faint: "rgba(10,24,40,0.32)", mid: "rgba(10,24,40,0.30)",
        strong: "rgba(10,24,40,0.62)", label: "rgba(10,24,40,0.50)", grid: "rgba(10,24,40,0.10)",
        chartBg: "rgba(10,24,40,0.05)", dotFill: "#0a1828", dotRing: "rgba(10,24,40,0.6)" }
    : { empty: "rgba(255,255,255,0.08)", faint: "rgba(255,255,255,0.35)", mid: "rgba(255,255,255,0.30)",
        strong: "rgba(255,255,255,0.55)", label: "rgba(255,255,255,0.45)", grid: "rgba(255,255,255,0.08)",
        chartBg: "rgba(255,255,255,0.04)", dotFill: "#fff", dotRing: "rgba(255,255,255,0.6)" };
}

// Soft-red palette for inline SVG. No hard #bf0d3d anywhere — the red is
// carried at alpha in both themes, and DARK gets the softer end (a saturated
// crimson on navy is what the mods kept flagging as harsh).
interface SvgRed {
  fill: string; fillDim: string; stroke: string; strokeDim: string;
  zone: string; zoneGrid: string; zoneFill: string;
  // Pitch dots run stronger than the rest of the red in light mode, and the
  // CURRENT pitch needs a ring that actually separates it from the surface —
  // white works on navy but vanishes on white, so light mode rings in navy.
  dot: string; dotBall: string; lastRing: string; dotOpacity: string;
}
function svgRed(): SvgRed {
  const light = document.documentElement.getAttribute("data-theme") === "light";
  return light
    ? { fill: "#bf0d3ca6", fillDim: "#bf0d3c8c", stroke: "#bf0d3c92", strokeDim: "#bf0d3c72",
        zone: "#bf0d3c85", zoneGrid: "#bf0d3c2e", zoneFill: "#bf0d3c0d",
        dot: "#bf0d3ce0", dotBall: "#2a9d5cf0", lastRing: "#002D72", dotOpacity: "0.82" }
    // Dark mode uses a LIGHTER red, not a fainter one: #bf0d3c at low alpha over
    // navy composites toward black, so the bases/zone went muddy and unreadable.
    : { fill: "#ff5c7fb3", fillDim: "#ff5c7f8a", stroke: "#ff5c7fa6", strokeDim: "#ff5c7f70",
        zone: "#ff5c7f8f", zoneGrid: "#ff5c7f38", zoneFill: "#ff5c7f12",
        dot: "#ff5c7fdb", dotBall: "#3fd18ae0", lastRing: "#ffffff", dotOpacity: "0.7" };
}

// Pitch dots are colored by RESULT, not pitch type. A fastball two feet off the
// plate was rendering red (the four-seam color) and reading as a strike; fans
// expect broadcast convention — red strike, green ball, gray foul, blue in play.
// The pitch TYPE is still shown as the abbreviation badge next to the velo.
function pitchOutcomeColor(p: any): string {
  // Two colors only, per Joe: green = ball, red = everything else (strike,
  // foul, in play). The pitch TYPE keeps its own color on the badge.
  const r = svgRed();
  return p?.details?.isBall ? r.dotBall : r.dot;
}

// Live matchup meta: handedness for both slots (RHB/LHB, RHP/LHP) plus the
// pitcher's running pitch count as {pitches}-{strikes}.
function slotHand(playerId: number | undefined, isBatter: boolean): string {
  if (playerId == null) return "";
  const bio: any = lastGameData?.gameData?.players?.["ID" + playerId];
  if (isBatter) {
    const side = bio?.batSide?.code;
    return side === "S" ? "SWH" : (side === "L" || side === "R") ? side + "HB" : "";
  }
  const hand = bio?.pitchHand?.code;
  return (hand === "L" || hand === "R") ? hand + "HP" : "";
}
function slotPitchCount(teamBox: any, playerId: number | undefined): string {
  if (playerId == null) return "";
  const p: any = teamBox?.players?.["ID" + playerId]?.stats?.pitching;
  const np = p?.numberOfPitches ?? p?.pitchesThrown;
  const st = p?.strikes;
  return np != null && st != null ? `${np}-${st}` : "";
}

function buildStrikeZoneSVG(pitches: any[]): string {
  const ink = svgInk();
  const red = svgRed();
  const dW = DZ_RIGHT - DZ_LEFT, dH = DZ_BOT - DZ_TOP;
  const d3 = dW / 3, d3h = dH / 3;
  const dots = pitches.map((p: any, i: number) => {
    const px = p.pitchData?.coordinates?.pX;
    const pz = p.pitchData?.coordinates?.pZ;
    if (px == null || pz == null) return "";
    const cx = mapPx(px), cy = mapPz(pz);
    const isLast = i === pitches.length - 1;
    return `<circle cx="${cx}" cy="${cy}" r="${isLast ? 7 : 5}"
      fill="${pitchOutcomeColor(p)}" stroke="${isLast ? red.lastRing : ink.faint}"
      stroke-width="${isLast ? 2 : 1}" opacity="${isLast ? 1 : red.dotOpacity}"/>
      <text x="${cx}" y="${cy + 0.5}" text-anchor="middle" dominant-baseline="middle"
      font-size="${isLast ? 7 : 6}" font-weight="700" fill="white"
      font-family="monospace" pointer-events="none">${i + 1}</text>`;
  }).join("");
  return `<svg viewBox="0 0 ${ZONE_W} ${ZONE_H}" xmlns="http://www.w3.org/2000/svg" style="overflow:visible;">
    <rect x="${DZ_LEFT}" y="${DZ_TOP}" width="${dW}" height="${dH}"
      fill="${red.zoneFill}" stroke="${red.zone}" stroke-width="1.5" rx="1"/>
    <line x1="${DZ_LEFT + d3}" y1="${DZ_TOP}" x2="${DZ_LEFT + d3}" y2="${DZ_BOT}"
      stroke="${red.zoneGrid}" stroke-width="0.8" stroke-dasharray="3,2"/>
    <line x1="${DZ_LEFT + d3 * 2}" y1="${DZ_TOP}" x2="${DZ_LEFT + d3 * 2}" y2="${DZ_BOT}"
      stroke="${red.zoneGrid}" stroke-width="0.8" stroke-dasharray="3,2"/>
    <line x1="${DZ_LEFT}" y1="${DZ_TOP + d3h}" x2="${DZ_RIGHT}" y2="${DZ_TOP + d3h}"
      stroke="${red.zoneGrid}" stroke-width="0.8" stroke-dasharray="3,2"/>
    <line x1="${DZ_LEFT}" y1="${DZ_TOP + d3h * 2}" x2="${DZ_RIGHT}" y2="${DZ_TOP + d3h * 2}"
      stroke="${red.zoneGrid}" stroke-width="0.8" stroke-dasharray="3,2"/>
    <polygon points="${DZ_LEFT},${DZ_BOT + 5} ${DZ_RIGHT},${DZ_BOT + 5} ${DZ_RIGHT},${DZ_BOT + 12} ${SZ_CX},${DZ_BOT + 20} ${DZ_LEFT},${DZ_BOT + 12}"
      fill="${ink.strong}" stroke="${ink.mid}" stroke-width="1"/>
    ${dots}
  </svg>`;
}

// ── Bases + outs scorebug ─────────────────────────────────────────────────

function buildBasesSVG(outs: number, onBase: any): string {
  const ink = svgInk();
  const red = svgRed();
  const outFill = (n: number): string =>
    outs >= n ? red.fill : ink.empty;
  const baseFill = (b: any): string =>
    b ? red.fill : ink.empty;
  return `<svg width="60" height="60" viewBox="0 0 58 79" xmlns="http://www.w3.org/2000/svg">
    <circle cx="13" cy="61" r="6" fill="${outFill(1)}" stroke="${red.stroke}" stroke-width="1.5"/>
    <circle cx="30" cy="61" r="6" fill="${outFill(2)}" stroke="${red.stroke}" stroke-width="1.5"/>
    <circle cx="47" cy="61" r="6" fill="${outFill(3)}" stroke="${red.stroke}" stroke-width="1.5"/>
    <rect x="17.6" y="29.7" width="14" height="14" transform="rotate(45 17.6 29.7)"
      fill="${baseFill(onBase?.third)}" stroke="${red.stroke}" stroke-width="1.5"/>
    <rect x="29.4" y="17.7" width="14" height="14" transform="rotate(45 29.4 17.7)"
      fill="${baseFill(onBase?.second)}" stroke="${red.stroke}" stroke-width="1.5"/>
    <rect x="41.6" y="29.7" width="14" height="14" transform="rotate(45 41.6 29.7)"
      fill="${baseFill(onBase?.first)}" stroke="${red.stroke}" stroke-width="1.5"/>
  </svg>`;
}

// ── Stat line helpers ─────────────────────────────────────────────────────

function getBatterSeasonStats(teamBox: any, batterId: number | undefined): string {
  if (!teamBox || !batterId) return "—";
  const stats = teamBox.players?.[`ID${batterId}`]?.seasonStats?.batting;
  if (!stats) return "—";
  const avg = stats.avg || "---";
  const hr = stats.homeRuns ?? 0;
  const rbi = stats.rbi ?? 0;
  return `${avg} · ${hr} HR · ${rbi} RBI`;
}

function getPitcherInGameLine(teamBox: any, pitcherId: number | undefined): string {
  if (!teamBox || !pitcherId) return "—";
  const player = teamBox.players?.[`ID${pitcherId}`];
  const game = player?.stats?.pitching;
  const season = player?.seasonStats?.pitching;
  if (!game && !season) return "—";
  const ip = game?.inningsPitched ?? "0.0";
  const k = game?.strikeOuts ?? 0;
  const era = season?.era ?? "—";
  return `${ip} IP · ${k} K · ${era} ERA`;
}

function getPitcherSeasonStats(teamBox: any, pitcherId: number | undefined): string {
  if (!teamBox || !pitcherId) return "—";
  const player = teamBox.players?.[`ID${pitcherId}`];
  const stats = player?.seasonStats?.pitching;
  if (!stats) return "—";
  const w = stats.wins ?? 0;
  const l = stats.losses ?? 0;
  const era = stats.era ?? "—";
  const k = stats.strikeOuts ?? 0;
  return `${w}-${l}  ·  ${era} ERA  ·  ${k} K`;
}

// ── Game-context label (postseason/ST/All-Star + doubleheader) ────────────

function abbreviateSeriesDesc(desc: string): string {
  if (!desc) return "Postseason";
  if (/world series/i.test(desc)) return "World Series";
  if (/american league championship/i.test(desc)) return "ALCS";
  if (/national league championship/i.test(desc)) return "NLCS";
  if (/american league division/i.test(desc)) return "ALDS";
  if (/national league division/i.test(desc)) return "NLDS";
  if (/american league wild card/i.test(desc)) return "AL Wild Card";
  if (/national league wild card/i.test(desc)) return "NL Wild Card";
  if (/wild card/i.test(desc)) return "Wild Card";
  return desc;
}

/**
 * Build a short, all-caps context label for the meta strip. Returns
 * empty string for regular-season single games (most cases), so the
 * pill auto-hides via `:empty { display: none }`.
 */
function getGameContextLabel(gameDataObj: any): string {
  const gameInfo = gameDataObj?.game || {};
  const gameType: string = gameInfo.type || gameInfo.gameType || "R";
  const parts: string[] = [];

  if (["F", "D", "L", "W"].includes(gameType)) {
    const seriesPrefix = abbreviateSeriesDesc(gameInfo.seriesDescription || "");
    const gameNum = gameInfo.seriesGameNumber;
    parts.push(gameNum ? `${seriesPrefix} Game ${gameNum}` : seriesPrefix);
  } else if (gameType === "S") {
    parts.push("Spring Training");
  } else if (gameType === "A") {
    parts.push("All-Star Game");
  } else if (gameType === "E") {
    parts.push("Exhibition");
  }

  const dh: string = gameInfo.doubleHeader || "N";
  const dhNum = gameInfo.gameNumber;
  if (dh !== "N" && dhNum) {
    parts.push(`Game ${dhNum} of 2`);
  }

  return parts.join(" · ").toUpperCase();
}

// ── State ─────────────────────────────────────────────────────────────────

let gamePk: number | null = null;
let pollInterval: ReturnType<typeof setInterval> | null = null;
let lastGameData: any = null;
let postgameNotificationFired = false;
let postType: string | null = null;
let gameIsTerminal = false; // set once the game reaches Final/Postponed

// ── Visible error reporting (Devvit iframe-friendly) ──────────────────────
//
// The red overlay is a debugging aid, not something a normal viewer should ever
// see. reportError still logs to the console unconditionally; the on-screen
// banner only mounts when debug mode is on. Enable it with `?debug=1` in the
// URL (easiest in a browser) or by setting localStorage["mlb-scores-debug"]="1".

function isDebugEnabled(): boolean {
  try {
    const v = (new URLSearchParams(location.search).get("debug") || "").toLowerCase();
    if (v === "1" || v === "true" || v === "yes") return true;
  } catch { /* location unavailable — ignore */ }
  try {
    if (localStorage.getItem("mlb-scores-debug") === "1") return true;
  } catch { /* storage blocked — ignore */ }
  return false;
}

const DEBUG_OVERLAY: boolean = isDebugEnabled();

function reportError(label: string, e: unknown): void {
  console.error(`[${label}]`, e);
  if (!DEBUG_OVERLAY) return; // keep logging, but don't show the banner to viewers
  let overlay = document.getElementById("error-overlay");
  if (!overlay) {
    overlay = document.createElement("div");
    overlay.id = "error-overlay";
    overlay.style.cssText =
      "position:fixed;top:0;left:0;right:0;background:rgba(180,0,0,0.95);color:#fff;" +
      "padding:8px 12px;font-family:monospace;font-size:10px;z-index:99999;" +
      "max-height:40vh;overflow-y:auto;border-bottom:2px solid #fff;line-height:1.4;" +
      "white-space:pre-wrap;word-break:break-word;";
    overlay.onclick = () => overlay!.remove();
    document.body.appendChild(overlay);
  }
  const msg = e instanceof Error ? `${e.message}\n${e.stack || ""}` : String(e);
  const line = document.createElement("div");
  line.style.cssText = "padding:4px 0;border-bottom:1px solid rgba(255,255,255,0.2);";
  line.textContent = `[${label}] ${msg}`;
  overlay.appendChild(line);
}

window.addEventListener("error", (e) => reportError("window.error", e.error || e.message));
window.addEventListener("unhandledrejection", (e) => reportError("unhandled promise", e.reason));

// ── DOM helpers ───────────────────────────────────────────────────────────

const $ = (id: string): HTMLElement | null => document.getElementById(id);

// Universal fallback: the regular full-color mark exists for every team, so a
// missing dark-mode file degrades to it rather than showing a broken image.
function baseLogoPath(teamId: number): string {
  return `/teams/${teamId}.svg`;
}

function getLogoPath(teamId: number): string {
  const light = document.documentElement.getAttribute("data-theme") === "light";
  // Light card → the regular full-color marks at teams/ (these read well on
  // white). Dark card → the lightened dark-mode variants in teams/dark, which
  // exist only for MLB teams; non-MLB opponents (spring training, etc.) have
  // only the regular mark, so they use it in both themes.
  if (light) return `/teams/${teamId}.svg`;
  return MLB_TEAM_IDS.has(teamId) ? `/teams/dark/${teamId}.svg` : `/teams/${teamId}.svg`;
}

// onerror fallback for inline <img> logos — mirrors loadLogo below.
const logoFallbackAttr = (teamId: number): string =>
  `this.onerror=null;this.src='${baseLogoPath(teamId)}'`;

function loadLogo(imgEl: HTMLImageElement, teamId: number): void {
  imgEl.onerror = (): void => { imgEl.onerror = null; imgEl.src = baseLogoPath(teamId); };
  imgEl.src = getLogoPath(teamId);
}

// Game times render in the VIEWER'S local time zone (each user sees their own),
// which is intentionally different from the bot's Reddit post — the post always
// states the game's start in Eastern. Do not pin these to a fixed zone.
function formatGameTime(gameDate: string): string {
  const d = new Date(gameDate);
  const h = d.getHours();
  const m = d.getMinutes();
  const ampm = h >= 12 ? "PM" : "AM";
  return `${(h % 12) || 12}:${String(m).padStart(2, "0")} ${ampm}`;
}

function getTeamShortName(team: any): string {
  if (!team) return "";
  if (team.teamName) return team.teamName;
  if (team.clubName) return team.clubName;
  const name = team.name || "";
  if (name.includes("Red Sox")) return "Red Sox";
  if (name.includes("White Sox")) return "White Sox";
  if (name.includes("Blue Jays")) return "Blue Jays";
  const parts = name.split(" ");
  return parts[parts.length - 1] || team.abbreviation || "";
}

function formatPitcherName(fullName: string): string {
  const safe = (fullName || "").trim();
  if (!safe) return "TBD";
  const parts = safe.split(/\s+/);
  if (parts.length === 1) {
    return safe;
  }
  const last = parts.pop()!;
  const rest = parts.join(" ");
  return `${rest}<br>${last}`;
}

function hideAllStatePanes(): void {
  ["pregame-content", "live-content", "final-content", "postponed-content", "suspended-content"].forEach((id) => {
    const el = $(id);
    if (el) el.style.display = "none";
  });
}

// ── Expanded mode (the scroll fix) ────────────────────────────────────────
//
// Inline web views are embedded in Reddit's feed, which owns vertical scroll
// gestures — that's why inner scrolling never worked. requestExpandedMode opens
// the post full-screen, where the existing CSS `overflow-y: auto` scrolls
// natively. Must be triggered by a trusted click.
//
// The button ONLY expands. In full-screen, Reddit's own chrome (the X) is the
// single way back — we don't render a collapse control, which avoids the desync
// where exiting via the X left our button stuck in a stale "collapse" state.
// The button is hidden whenever the view is expanded. Mode can change in place
// on desktop without reloading the page, so visibility is reconciled against the
// live mode on resize, and the click handler refuses to expand when already
// expanded as a backstop against any double-expand error.

const EXPAND_ICON =
  '<svg viewBox="0 0 24 24" width="17" height="17" fill="none" stroke="currentColor" ' +
  'stroke-width="2" stroke-linecap="round" stroke-linejoin="round">' +
  '<path d="M8 3H5a2 2 0 0 0-2 2v3M16 3h3a2 2 0 0 1 2 2v3M21 16v3a2 2 0 0 1-2 2h-3M3 16v3a2 2 0 0 0 2 2h3"/></svg>';

function isExpandedMode(): boolean {
  try { return getWebViewMode() === "expanded"; } catch { return false; }
}

// ── Inline pager ────────────────────────────────────────────────────────────
// Reddit forbids scroll-trapping in the in-feed (inline) view. So inline we lock
// the body (no native scroll → the feed scrolls past untouched), bound the active
// panel to the visible area, and let people move through long panels (box score,
// plays) with up/down buttons that scroll the panel PROGRAMMATICALLY. A panel set
// to `overflow: hidden` won't capture a drag/wheel gesture (no trap), but its
// scrollBy()/scrollTop still work from a button click. Expanded mode is unchanged
// (native scroll). body.is-inline is toggled in setupExpand's sync().

const pagerScrollWired = new WeakSet<HTMLElement>();
let pagerRaf = 0;

function scheduleInlinePagerSync(): void {
  if (pagerRaf) return;
  pagerRaf = requestAnimationFrame(() => { pagerRaf = 0; updateInlinePager(); });
}

// The element the buttons scroll. For the box tab that's the inner panel wrap so
// the away/home toggle stays pinned; for every other tab, the active pane itself.
function inlinePagerRegion(): HTMLElement | null {
  const active = document.querySelector(".tab-content.tab-content-active") as HTMLElement | null;
  if (!active) return null;
  return (active.querySelector(".bs-panel-wrap") as HTMLElement | null) || active;
}

function updateInlinePager(): void {
  const pager = document.getElementById("inline-pager");
  if (!pager) return;
  const inline = document.body.classList.contains("is-inline");
  const region = inline ? inlinePagerRegion() : null;
  const needed = !!region && region.scrollHeight > region.clientHeight + 2;
  pager.classList.toggle("pager-active", inline && needed);
  if (!needed || !region) return;

  // Float just above the sticky tab-bar.
  const bar = document.querySelector(".tab-bar") as HTMLElement | null;
  pager.style.bottom = (bar ? bar.offsetHeight : 56) + 10 + "px";

  const up = document.getElementById("inline-pager-up") as HTMLButtonElement | null;
  const down = document.getElementById("inline-pager-down") as HTMLButtonElement | null;
  if (up) up.disabled = region.scrollTop <= 1;
  if (down) down.disabled = region.scrollTop >= region.scrollHeight - region.clientHeight - 1;

  if (!pagerScrollWired.has(region)) {
    region.addEventListener("scroll", scheduleInlinePagerSync, { passive: true });
    pagerScrollWired.add(region);
  }
}

function setupInlinePager(): void {
  const host = $("scorebug-content");
  if (!host || document.getElementById("inline-pager")) return;

  const chev = (d: string): string =>
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" ' +
    'stroke-linecap="round" stroke-linejoin="round"><path d="' + d + '"/></svg>';

  const pager = document.createElement("div");
  pager.id = "inline-pager";

  const mk = (id: string, label: string, path: string, dir: number): HTMLButtonElement => {
    const b = document.createElement("button");
    b.id = id;
    b.type = "button";
    b.className = "inline-pager-btn";
    b.setAttribute("aria-label", label);
    b.innerHTML = chev(path);
    b.addEventListener("click", () => {
      const region = inlinePagerRegion();
      if (!region) return;
      region.scrollBy({ top: dir * Math.round(region.clientHeight * 0.8), behavior: "smooth" });
    });
    return b;
  };

  pager.appendChild(mk("inline-pager-up", "Scroll up", "M18 15l-6-6-6 6", -1));
  pager.appendChild(mk("inline-pager-down", "Scroll down", "M6 9l6 6 6-6", 1));
  host.appendChild(pager);

  // One observer catches both tab switches (class changes) and the 10s poll's
  // innerHTML rewrites (which grow the plays list), so the buttons re-sync
  // without touching setupTabs or render.
  const obs = new MutationObserver(scheduleInlinePagerSync);
  obs.observe(host, { childList: true, subtree: true, attributes: true, attributeFilter: ["class", "style"] });
  window.addEventListener("resize", scheduleInlinePagerSync);

  updateInlinePager();
}

function setupExpand(): void {
  if (document.getElementById("expand-btn")) return;
  const host = $("scorebug-content") || document.body;

  const btn = document.createElement("button");
  btn.id = "expand-btn";
  btn.type = "button";
  btn.setAttribute("aria-label", "Open full screen");
  btn.innerHTML = EXPAND_ICON;
  btn.style.cssText =
    "position:absolute;top:10px;right:12px;z-index:40;width:25px;height:25px;" +
    "display:flex;align-items:center;justify-content:center;padding:0;" +
    "background:var(--bg-elev-2);color:var(--text-primary);border:1px solid var(--border-medium);" +
    "border-radius:6px;cursor:pointer;-webkit-tap-highlight-color:transparent;" +
    "backdrop-filter:blur(4px);-webkit-backdrop-filter:blur(4px);";

  // Visible only while inline; hidden in full-screen so the X is the way back.
  // Exiting expanded mode via Reddit's X doesn't reliably fire a resize event
  // (especially on desktop), so while hidden in expanded mode we poll the mode
  // and re-show the button the instant we're back inline, then stop polling.
  let modePoll = 0;
  const sync = (): void => {
    const expanded = isExpandedMode();
    btn.style.display = expanded ? "none" : "flex";
    // Inline (in-feed) views must not trap scroll: inline uses a bounded,
    // button-paged layout; expanded keeps native scroll. See setupInlinePager.
    document.body.classList.toggle("is-inline", !expanded);
    scheduleInlinePagerSync();
    if (expanded && !modePoll) {
      modePoll = window.setInterval(sync, 400);
    } else if (!expanded && modePoll) {
      window.clearInterval(modePoll);
      modePoll = 0;
    }
  };
  sync();
  window.addEventListener("resize", sync);
  document.addEventListener("visibilitychange", sync);

  btn.addEventListener("click", (event: MouseEvent) => {
    // Backstop: if we're somehow already expanded, just hide and bail rather
    // than calling requestExpandedMode twice (which throws "already expanded").
    if (isExpandedMode()) { sync(); return; }
    try {
      // "default" is this app's devvit.json post entrypoint (splash.html).
      requestExpandedMode(event, "default");
    } catch (e) {
      reportError("requestExpandedMode", e);
    }
    sync();
  });

  host.appendChild(btn);
}

// ── Light / dark theme toggle ──────────────────────────────────────────────
// The DOM recolors instantly from the CSS tokens under [data-theme="light"];
// the SVGs are rebuilt with the matching palette on toggle. By default the theme
// follows Reddit's color scheme (prefers-color-scheme); the in-app button
// overrides that, and the override persists in localStorage when available.

const SUN_ICON =
  '<svg viewBox="0 0 24 24" width="17" height="17" fill="none" stroke="currentColor" ' +
  'stroke-width="2" stroke-linecap="round" stroke-linejoin="round">' +
  '<circle cx="12" cy="12" r="4"/>' +
  '<path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/></svg>';
const MOON_ICON =
  '<svg viewBox="0 0 24 24" width="17" height="17" fill="none" stroke="currentColor" ' +
  'stroke-width="2" stroke-linecap="round" stroke-linejoin="round">' +
  '<path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z"/></svg>';

const THEME_KEY = "mlb-scores-theme";

function applyTheme(theme: string): void {
  if (theme === "light") document.documentElement.setAttribute("data-theme", "light");
  else document.documentElement.removeAttribute("data-theme");
}

// Reddit drives the web view's color scheme through prefers-color-scheme — its
// native light/dark toggle (and the preview toggle) flips that media feature.
// We follow it by default; a tap on the in-app button overrides and is saved.
function systemTheme(): string {
  try {
    return window.matchMedia("(prefers-color-scheme: light)").matches ? "light" : "dark";
  } catch { return "dark"; }
}

function savedTheme(): string | null {
  try {
    const v = localStorage.getItem(THEME_KEY);
    return v === "light" || v === "dark" ? v : null;
  } catch { return null; }
}

function resolveTheme(): string {
  // Manual override wins. Otherwise LIGHT is the default view — the app is
  // designed light-first now (navy chrome + light content), so we no longer
  // inherit Reddit's dark scheme by default. systemTheme() is kept for the
  // toggle's reference point.
  return savedTheme() ?? "light";
}

function setupThemeToggle(): void {
  if (document.getElementById("theme-btn")) return;
  const host = $("scorebug-content") || document.body;

  // Seed the attribute before the first render so the initial SVG ink is right.
  let theme = resolveTheme();
  applyTheme(theme);

  const btn = document.createElement("button");
  btn.id = "theme-btn";
  btn.type = "button";
  btn.style.cssText =
    "position:absolute;top:10px;left:12px;z-index:40;width:25px;height:25px;" +
    "display:flex;align-items:center;justify-content:center;padding:0;" +
    "background:var(--bg-elev-2);color:var(--text-primary);border:1px solid var(--border-medium);" +
    "border-radius:6px;cursor:pointer;-webkit-tap-highlight-color:transparent;" +
    "backdrop-filter:blur(4px);-webkit-backdrop-filter:blur(4px);";

  const paint = (): void => {
    // Show the icon for the mode you'll switch TO.
    btn.innerHTML = theme === "light" ? MOON_ICON : SUN_ICON;
    btn.setAttribute("aria-label", theme === "light" ? "Switch to dark mode" : "Switch to light mode");
  };
  paint();

  btn.addEventListener("click", () => {
    theme = theme === "light" ? "dark" : "light";
    applyTheme(theme);
    try { localStorage.setItem(THEME_KEY, theme); } catch { /* storage unavailable — session only */ }
    paint();
    // CSS DOM has already flipped; rebuild the SVGs with the new palette.
    try { if (lastGameData) render(lastGameData); } catch (e) { reportError("theme re-render", e); }
  });

  // Follow Reddit's native color-scheme toggle live: when the user (or the
  // preview toggle) flips the scheme, match it and drop any manual override so
  // the native control stays in charge.
  try {
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const onSchemeChange = (e: MediaQueryListEvent): void => {
      try { localStorage.removeItem(THEME_KEY); } catch { /* ignore */ }
      theme = e.matches ? "dark" : "light";
      applyTheme(theme);
      paint();
      try { if (lastGameData) render(lastGameData); } catch (err) { reportError("scheme re-render", err); }
    };
    if (mq.addEventListener) mq.addEventListener("change", onSchemeChange);
    else if ((mq as any).addListener) (mq as any).addListener(onSchemeChange); // legacy WebKit
  } catch { /* matchMedia unsupported */ }

  host.appendChild(btn);
}

// ── Pregame content ───────────────────────────────────────────────────────

function renderPregameContent(data: any, awayTeam: any, homeTeam: any): void {
  const teamsBox = data.liveData?.boxscore?.teams || {};
  const probables = data.gameData?.probablePitchers || {};
  const awayPid = probables.away?.id;
  const homePid = probables.home?.id;

  const awayLabel = $("pregame-away-pitcher-label");
  const homeLabel = $("pregame-home-pitcher-label");
  if (awayLabel) awayLabel.textContent = `${getTeamShortName(awayTeam).toUpperCase()} STARTER`;
  if (homeLabel) homeLabel.textContent = `${getTeamShortName(homeTeam).toUpperCase()} STARTER`;

  $("pregame-away-pitcher-name")!.innerHTML = formatPitcherName(probables.away?.fullName || "TBD");
  $("pregame-home-pitcher-name")!.innerHTML = formatPitcherName(probables.home?.fullName || "TBD");
  $("pregame-away-pitcher-stats")!.textContent = getPitcherSeasonStats(teamsBox.away, awayPid);
  $("pregame-home-pitcher-stats")!.textContent = getPitcherSeasonStats(teamsBox.home, homePid);

  const dt = new Date(data.gameData.datetime?.dateTime || Date.now());
  const dateStr = dt.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" }).toUpperCase();
  const timeStr = formatGameTime(data.gameData.datetime?.dateTime || dt.toISOString());
  $("pregame-first-pitch")!.textContent = `${dateStr}  ·  ${timeStr}`;
}

// ── Live content ──────────────────────────────────────────────────────────

function renderLiveContent(data: any): void {
  const linescore = data.liveData?.linescore;
  const currentPlay = data.liveData?.plays?.currentPlay;
  if (!linescore || !currentPlay) return;

  const teamsBox = data.liveData.boxscore?.teams || {};
  const matchup = currentPlay.matchup || {};
  const batter = matchup.batter;
  const pitcher = matchup.pitcher;
  const count = currentPlay.count || { balls: 0, strikes: 0, outs: 0 };

  const awayBatting = linescore.inningHalf === "Top";
  const awaySlotPlayer = awayBatting ? batter : pitcher;
  const homeSlotPlayer = awayBatting ? pitcher : batter;
  const awaySlotIsBatter = awayBatting;
  const homeSlotIsBatter = !awayBatting;

  const awaySlotEl = $("live-player-away");
  const homeSlotEl = $("live-player-home");
  if (awaySlotEl) {
    awaySlotEl.classList.toggle("is-batter", awaySlotIsBatter);
    awaySlotEl.classList.toggle("is-pitcher", !awaySlotIsBatter);
  }
  if (homeSlotEl) {
    homeSlotEl.classList.toggle("is-batter", homeSlotIsBatter);
    homeSlotEl.classList.toggle("is-pitcher", !homeSlotIsBatter);
  }

  const awayTeamId = data.gameData?.teams?.away?.id;
  const homeTeamId = data.gameData?.teams?.home?.id;

  const getPlayerPos = (teamBox: any, playerId: number | undefined): string => {
    if (!teamBox || !playerId) return "";
    return teamBox.players?.[`ID${playerId}`]?.position?.abbreviation || "";
  };

  $("live-away-role")!.textContent = awaySlotIsBatter ? "BATTER" : "PITCHER";
  $("live-away-pos")!.textContent = awaySlotIsBatter
    ? getPlayerPos(teamsBox.away, awaySlotPlayer?.id)
    : slotPitchCount(teamsBox.away, awaySlotPlayer?.id);
  $("live-away-hand")!.textContent = slotHand(awaySlotPlayer?.id, awaySlotIsBatter);
  $("live-away-name")!.textContent = awaySlotPlayer?.fullName || "—";
  $("live-away-stats")!.textContent = awaySlotIsBatter
    ? getBatterSeasonStats(teamsBox.away, awaySlotPlayer?.id)
    : getPitcherInGameLine(teamsBox.away, awaySlotPlayer?.id);
  const awayLogoEl = $("live-away-team-logo") as HTMLImageElement | null;
  if (awayLogoEl && awayTeamId) loadLogo(awayLogoEl, awayTeamId);

  $("live-home-role")!.textContent = homeSlotIsBatter ? "BATTER" : "PITCHER";
  $("live-home-pos")!.textContent = homeSlotIsBatter
    ? getPlayerPos(teamsBox.home, homeSlotPlayer?.id)
    : slotPitchCount(teamsBox.home, homeSlotPlayer?.id);
  $("live-home-hand")!.textContent = slotHand(homeSlotPlayer?.id, homeSlotIsBatter);
  $("live-home-name")!.textContent = homeSlotPlayer?.fullName || "—";
  $("live-home-stats")!.textContent = homeSlotIsBatter
    ? getBatterSeasonStats(teamsBox.home, homeSlotPlayer?.id)
    : getPitcherInGameLine(teamsBox.home, homeSlotPlayer?.id);
  const homeLogoEl = $("live-home-team-logo") as HTMLImageElement | null;
  if (homeLogoEl && homeTeamId) loadLogo(homeLogoEl, homeTeamId);

  const onBase = linescore.offense || {};
  $("live-bases")!.innerHTML = buildBasesSVG(count.outs ?? 0, onBase);
  $("live-count")!.textContent = `${count.balls ?? 0}–${count.strikes ?? 0}`;

  const pitches = (currentPlay.playEvents || []).filter((e: any) => e.isPitch);
  $("live-zone-container")!.innerHTML = buildStrikeZoneSVG(pitches);

  const lastPitch = pitches[pitches.length - 1];
  const pitchEl = $("live-pitch-latest")!;
  if (lastPitch) {
    const info = pitchInfo(lastPitch.details?.type?.code);
    const velo = lastPitch.pitchData?.startSpeed?.toFixed(1) ?? "—";
    const isInPlay = lastPitch.details?.isInPlay;
    const isStrike = lastPitch.details?.isStrike;
    const isFoul = (lastPitch.details?.description || "").toLowerCase().includes("foul");
    // Label still tells the full story; the COLOR is only green/red.
    let resCls = "live-pr-ball";
    let resLbl = "BALL";
    if (isInPlay) { resCls = "live-pr-strike"; resLbl = "IN PLAY"; }
    else if (isFoul) { resCls = "live-pr-strike"; resLbl = "FOUL"; }
    else if (isStrike) { resCls = "live-pr-strike"; resLbl = "STRIKE"; }
    pitchEl.innerHTML = `
      <span class="live-pitch-num">PITCH ${pitches.length}</span>
      <span class="live-pitch-badge" style="background:${info.color}">${info.abbr}</span>
      <span class="live-pitch-type">${info.label}</span>
      <span class="live-pitch-velo">${velo} mph</span>
      <span class="live-pitch-result ${resCls}">${resLbl}</span>
    `;
  } else {
    pitchEl.innerHTML = '<span style="font-family:var(--font-mono);font-size:10px;color:var(--text-muted);">Waiting for first pitch…</span>';
  }

  const resultEvent = currentPlay.result?.event || "";
  const resultDesc = currentPlay.result?.description || "";
  const resultEl = $("live-result")!;
  if (resultEvent || resultDesc) {
    resultEl.innerHTML = `
      ${resultEvent ? `<div class="live-event">${resultEvent}</div>` : ""}
      ${resultDesc ? `<div class="live-desc">${resultDesc}</div>` : ""}
    `;
  } else {
    resultEl.innerHTML = "";
  }
}

// ── Box score ─────────────────────────────────────────────────────────────

function shortName(name: string): string {
  if (!name) return "";
  const parts = name.split(" ").filter(Boolean);
  if (parts.length === 0) return "";
  if (parts.length === 1) return parts[0] ?? "";

  const SUFFIX = ["Jr.", "Jr", "Sr.", "Sr", "II", "III", "IV", "V"];
  const lastPart = parts[parts.length - 1] ?? "";
  const useSecondToLast = SUFFIX.includes(lastPart) && parts.length > 2;
  const surname = useSecondToLast ? (parts[parts.length - 2] ?? "") : lastPart;
  const firstInitial = parts[0]?.[0] ?? "";
  return `${firstInitial}. ${surname}`;
}

function fmtAvg(v: any): string {
  if (!v || v === ".000" || v === "0.000") return ".000";
  const f = parseFloat(v);
  if (isNaN(f)) return ".000";
  return f < 1 ? "." + String(Math.round(f * 1000)).padStart(3, "0") : String(v);
}

function buildBattingRow(player: any, displayNum: number, s: any, isSub: boolean = false): string {
  const g = player.stats?.batting || {};
  const name = shortName(player.person?.fullName || "Unknown");
  const pos = player.position?.abbreviation || "";
  const ab = g.atBats ?? 0;
  const h = g.hits ?? 0;
  const r = g.runs ?? 0;
  const rbi = g.rbi ?? 0;
  const hr = g.homeRuns ?? 0;
  const bb = g.baseOnBalls ?? 0;
  const so = g.strikeOuts ?? 0;
  const lob = g.leftOnBase ?? 0;
  const avg = fmtAvg(s?.avg);
  const obp = fmtAvg(s?.obp);
  const slg = fmtAvg(s?.slg);
  // Substitutes share their slot's number: blank the number cell and indent the
  // name so the sub reads as nested under the starter it replaced (like a real box
  // score), instead of getting its own number and pushing the lineup past 9.
  const numCell = isSub ? "" : String(displayNum);
  const nameCell = isSub
    ? `<div class="bs-pname" style="padding-left:15px;opacity:.72">${name}</div>`
    : `<div class="bs-pname">${name}</div>`;
  return `<tr class="bs-row${isSub ? " bs-sub" : ""}" data-player-id="${player.person?.id ?? ""}">
    <td class="bs-num">${numCell}</td>
    <td class="bs-pos-cell"><span class="bs-pos">${pos}</span></td>
    <td class="bs-player">${nameCell}</td>
    <td>${ab}</td>
    <td class="${h > 0 ? "bs-hit" : ""}">${h}</td>
    <td>${r}</td>
    <td>${rbi}</td>
    <td class="${hr > 0 ? "bs-hr" : ""}">${hr}</td>
    <td>${bb}</td>
    <td>${so}</td>
    <td>${lob}</td>
    <td class="bs-avg bs-slash">${avg}</td>
    <td class="bs-avg bs-slash">${obp}</td>
    <td class="bs-avg bs-slash">${slg}</td>
  </tr>`;
}

function buildPitchingRow(player: any, s: any): string {
  const g = player.stats?.pitching || {};
  const name = shortName(player.person?.fullName || "Unknown");
  const ip = g.inningsPitched ?? "0.0";
  const h = g.hits ?? 0;
  const r = g.runs ?? 0;
  const er = g.earnedRuns ?? 0;
  const bb = g.baseOnBalls ?? 0;
  const so = g.strikeOuts ?? 0;
  const np = g.numberOfPitches ?? g.pitchesThrown ?? "";
  const strikes = g.strikes;
  const ps = np !== "" && strikes != null ? `${np}-${strikes}` : String(np);
  const wp = g.wildPitches ?? 0;
  const era = s?.era ?? "-.--";
  const erHasRuns = er > 0;
  return `<tr class="bs-row" data-player-id="${player.person?.id ?? ""}">
    <td class="bs-num"></td>
    <td class="bs-pos-cell"><span class="bs-pos p">P</span></td>
    <td class="bs-player"><div class="bs-pname">${name}</div></td>
    <td>${ip}</td>
    <td>${h}</td>
    <td class="${erHasRuns ? "bs-er" : ""}">${r}</td>
    <td class="${erHasRuns ? "bs-er" : ""}">${er}</td>
    <td>${bb}</td>
    <td>${so}</td>
    <td>${wp}</td>
    <td class="bs-ps">${ps}</td>
    <td class="bs-avg">${era}</td>
  </tr>`;
}

function buildBoxPanel(teamStats: any): string {
  if (!teamStats?.players) {
    return '<div class="bs-empty">Lineups not yet available</div>';
  }
  const rawBatters: number[] = teamStats.batters || [];
  const pitchers: number[] = teamStats.pitchers || [];

  const batters: number[] = rawBatters.filter((id: number) => {
    const pos = teamStats.players?.[`ID${id}`]?.position?.abbreviation;
    return pos && pos !== "P" && pos !== "Pitcher";
  });

  if (!batters.length && !pitchers.length) {
    return '<div class="bs-empty">Lineups not yet available</div>';
  }

  // Group batters into the 9 lineup slots using battingOrder. MLB encodes it as
  // slot*100 for starters (100, 200, … 900) and slot*100 + a sequence for subs who
  // entered that slot (e.g. 401, 402 in the 4-hole). Render nine numbered slots with
  // any substitutes nested under the slot they came into, so a game with 3 subs still
  // reads 1–9 instead of 10, 11, 12. Falls back to sequential numbering if the data
  // has no usable battingOrder, so the box score always renders.
  const slots: Record<number, any[]> = {};
  let haveOrder = false;
  for (const id of batters) {
    const player = teamStats.players?.[`ID${id}`];
    if (!player) continue;
    const bo = parseInt(String(player.battingOrder ?? ""), 10);
    if (!Number.isFinite(bo) || bo <= 0) continue;
    haveOrder = true;
    const slot = Math.floor(bo / 100);
    (slots[slot] = slots[slot] || []).push(player);
  }

  let battingRows: string;
  if (haveOrder) {
    const rows: string[] = [];
    for (let slot = 1; slot <= 9; slot++) {
      const group = slots[slot];
      if (!group || !group.length) continue;
      group.sort(
        (a: any, b: any) =>
          parseInt(String(a.battingOrder), 10) - parseInt(String(b.battingOrder), 10),
      );
      group.forEach((player: any, idx: number) => {
        rows.push(buildBattingRow(player, slot, player.seasonStats?.batting, idx > 0));
      });
    }
    battingRows = rows.join("");
  } else {
    battingRows = batters
      .map((id: number, i: number) => {
        const player = teamStats.players?.[`ID${id}`];
        if (!player) return "";
        return buildBattingRow(player, i + 1, player.seasonStats?.batting, false);
      })
      .filter(Boolean)
      .join("");
  }

  const pitchingRows = pitchers.map((id: number) => {
    const player = teamStats.players?.[`ID${id}`];
    if (!player) return "";
    const s = player.seasonStats?.pitching;
    return buildPitchingRow(player, s);
  }).filter(Boolean).join("");

  return `
    <div class="bs-section-hdr"><span class="bs-dot"></span>Batting</div>
    <table class="bs-table bs-table-batting">
      <thead>
        <tr>
          <th class="bs-th-num">#</th>
          <th class="bs-th-pos"></th>
          <th class="bs-th-player">Player</th>
          <th>AB</th><th>H</th><th>R</th><th>RBI</th><th>HR</th><th>BB</th><th>K</th><th>LOB</th><th class="bs-th-slash">AVG</th><th class="bs-th-slash">OBP</th><th class="bs-th-slash">SLG</th>
        </tr>
      </thead>
      <tbody>${battingRows || `<tr><td colspan="12" class="bs-empty">Awaiting first AB</td></tr>`}</tbody>
    </table>
    <div class="bs-section-hdr pitching"><span class="bs-dot"></span>Pitching</div>
    <table class="bs-table bs-table-pitching">
      <thead>
        <tr>
          <th class="bs-th-num"></th>
          <th class="bs-th-pos"></th>
          <th class="bs-th-player">Pitcher</th>
          <th>IP</th><th>H</th><th>R</th><th>ER</th><th>BB</th><th>K</th><th>WP</th><th>P-S</th><th>ERA</th>
        </tr>
      </thead>
      <tbody>${pitchingRows || `<tr><td colspan="12" class="bs-empty">No pitching data yet</td></tr>`}</tbody>
    </table>
    ${buildBoxNotes(teamStats)}
  `;
}

// TB / SB / E don't earn their own columns — real box scores carry them as a
// notes line under the tables, which also keeps the grid from overflowing.
function buildBoxNotes(teamBox: any): string {
  const players: any[] = Object.values(teamBox?.players || {});
  const notes: string[] = [];
  const sb = players
    .filter((p: any) => (p?.stats?.batting?.stolenBases ?? 0) > 0)
    .map((p: any) => `${shortName(p.person?.fullName || "")} ${p.stats.batting.stolenBases}`);
  if (sb.length) notes.push(`<span class="bs-note"><b>SB</b> ${sb.join(", ")}</span>`);
  const err = players
    .filter((p: any) => (p?.stats?.fielding?.errors ?? 0) > 0)
    .map((p: any) => `${shortName(p.person?.fullName || "")} ${p.stats.fielding.errors}`);
  if (err.length) notes.push(`<span class="bs-note"><b>E</b> ${err.join(", ")}</span>`);
  return notes.length ? `<div class="bs-notes">${notes.join("")}</div>` : "";
}

function renderBoxScore(data: any): void {
  const awayTeam = data.gameData?.teams?.away;
  const homeTeam = data.gameData?.teams?.home;
  const boxscore = data.liveData?.boxscore;
  if (!awayTeam || !homeTeam || !boxscore) return;

  const awayAbbrEl = $("bs-away-tab-abbr");
  const homeAbbrEl = $("bs-home-tab-abbr");
  if (awayAbbrEl) awayAbbrEl.textContent = awayTeam.abbreviation || "?";
  if (homeAbbrEl) homeAbbrEl.textContent = homeTeam.abbreviation || "?";

  const awayLogoEl = $("bs-away-tab-logo") as HTMLImageElement | null;
  const homeLogoEl = $("bs-home-tab-logo") as HTMLImageElement | null;
  if (awayLogoEl && awayTeam.id) loadLogo(awayLogoEl, awayTeam.id);
  if (homeLogoEl && homeTeam.id) loadLogo(homeLogoEl, homeTeam.id);

  const wrap = document.querySelector(".bs-panel-wrap") as HTMLElement | null;
  const savedScroll = wrap?.scrollTop ?? 0;

  const awayPanel = $("bs-away-panel");
  const homePanel = $("bs-home-panel");
  if (awayPanel) awayPanel.innerHTML = buildBoxPanel(boxscore.teams?.away);
  if (homePanel) homePanel.innerHTML = buildBoxPanel(boxscore.teams?.home);

  if (wrap) wrap.scrollTop = savedScroll;
}

function setupBoxScoreTeamTabs(): void {
  document.querySelectorAll(".bs-team-tab").forEach((btn) => {
    btn.addEventListener("click", () => {
      const team = (btn as HTMLElement).dataset.bsTeam;
      if (!team) return;
      document.querySelectorAll(".bs-team-tab").forEach((b) => b.classList.remove("active"));
      btn.classList.add("active");
      document.querySelectorAll(".bs-panel").forEach((p) => p.classList.remove("active"));
      $(`bs-${team}-panel`)?.classList.add("active");

      // Start the newly selected team's box score at the top, not wherever the
      // previous team was scrolled. Two scrollers to cover: the <body> in
      // expanded mode, and .bs-panel-wrap in inline mode (where the body doesn't
      // scroll — the panel wrap is the scroll region). Fires only on a team tap.
      document.body.scrollTop = 0;
      document.documentElement.scrollTop = 0;
      const wrap = document.querySelector(".bs-panel-wrap") as HTMLElement | null;
      if (wrap) wrap.scrollTop = 0;
    });
  });
}

// ── Plays (Scoring + All) ─────────────────────────────────────────────────

function getEventBadge(eventType: string): string {
  if (!eventType) return "?";
  const exact: Record<string, string> = {
    "Single": "1B", "Double": "2B", "Triple": "3B", "Home Run": "HR",
    "Strikeout": "K", "Walk": "BB", "Intent Walk": "IBB",
    "Hit By Pitch": "HBP", "Grounded Into DP": "DP", "Field Error": "E",
    "Fielders Choice": "FC", "Fielders Choice Out": "FC", "Double Play": "DP",
    "Catcher Interference": "CI",
    "Caught Stealing 2B": "CS", "Caught Stealing 3B": "CS",
    "Pickoff Caught Stealing 2B": "CS", "Pickoff Caught Stealing 3B": "CS",
    "Stolen Base 2B": "SB", "Stolen Base 3B": "SB", "Stolen Base Home": "SB",
    "Sac Fly": "SAC", "Sac Bunt": "SAC", "Wild Pitch": "WP", "Passed Ball": "PB",
  };
  if (exact[eventType]) return exact[eventType];
  if (eventType.includes("Substitution") || eventType.includes("Switch")) return "↔";
  if (/error/i.test(eventType)) return "E";
  if (/out/i.test(eventType)) return "OUT";
  return eventType.slice(0, 3).toUpperCase();
}

function buildPlayScorebug(play: any): string {
  const count = play.count || {};
  const outs: number = count.outs ?? 0;
  const balls: number = count.balls ?? 0;
  const strikes: number = count.strikes ?? 0;
  const onBase = {
    first:  !!play.matchup?.postOnFirst,
    second: !!play.matchup?.postOnSecond,
    third:  !!play.matchup?.postOnThird,
  };
  const ink = svgInk();
  const red = svgRed();
  const outFill  = (n: number): string => outs >= n ? red.fill : ink.empty;
  const baseFill = (b: boolean): string => b ? red.fill : ink.empty;

  return `<div class="play-scorebug">
    <div class="play-count-mini">${balls}-${strikes}</div>
    <svg width="48" height="48" viewBox="0 0 58 79" xmlns="http://www.w3.org/2000/svg">
      <circle cx="13" cy="61" r="5" fill="${outFill(1)}" stroke="${red.stroke}" stroke-width="1"/>
      <circle cx="30" cy="61" r="5" fill="${outFill(2)}" stroke="${red.stroke}" stroke-width="1"/>
      <circle cx="47" cy="61" r="5" fill="${outFill(3)}" stroke="${red.stroke}" stroke-width="1"/>
      <rect x="17.6" y="29.7" width="14" height="14" transform="rotate(45 17.6 29.7)"
        fill="${baseFill(onBase.third)}"  stroke="${red.stroke}" stroke-width="1"/>
      <rect x="29.4" y="17.7" width="14" height="14" transform="rotate(45 29.4 17.7)"
        fill="${baseFill(onBase.second)}" stroke="${red.stroke}" stroke-width="1"/>
      <rect x="41.6" y="29.7" width="14" height="14" transform="rotate(45 41.6 29.7)"
        fill="${baseFill(onBase.first)}"  stroke="${red.stroke}" stroke-width="1"/>
    </svg>
  </div>`;
}

function buildPlayCard(play: any, awayAbbr: string, homeAbbr: string, showScore: boolean): string {
  const inning = play.about?.inning ?? 1;
  const isTop = play.about?.isTopInning;
  const inningTxt = `${isTop ? "▲" : "▼"} ${inning}`;
  const event = play.result?.event || "—";
  const eventBadge = getEventBadge(event);
  const desc = play.result?.description || "";

  const hitData = play.playEvents?.find((e: any) => e?.hitData)?.hitData || {};
  const exitVelo = hitData.launchSpeed ? `${Math.round(hitData.launchSpeed)} mph` : "";
  const launchAngle = hitData.launchAngle != null ? `${Math.round(hitData.launchAngle)}°` : "";
  const distance = hitData.totalDistance ? `${Math.round(hitData.totalDistance)} ft` : "";
  const hasStatcast = exitVelo || launchAngle || distance;

  let scoreHtml = "";
  if (showScore && play.result?.awayScore != null && play.result?.homeScore != null) {
    const rbiHtml = play.result.rbi > 0 ? `<span class="play-rbi">+${play.result.rbi} RBI</span>` : "";
    scoreHtml = `<div class="play-score-line">
      <span class="play-score">${awayAbbr} ${play.result.awayScore} — ${homeAbbr} ${play.result.homeScore}</span>
      ${rbiHtml}
    </div>`;
  }

  let statcastHtml = "";
  if (hasStatcast) {
    const chips: string[] = [];
    if (exitVelo) chips.push(`<div class="play-chip"><span class="play-chip-l">Exit Velo</span><span class="play-chip-v">${exitVelo}</span></div>`);
    if (launchAngle) chips.push(`<div class="play-chip"><span class="play-chip-l">Angle</span><span class="play-chip-v">${launchAngle}</span></div>`);
    if (distance) chips.push(`<div class="play-chip"><span class="play-chip-l">Distance</span><span class="play-chip-v">${distance}</span></div>`);
    statcastHtml = `<div class="play-statcast">${chips.join("")}</div>`;
  }

  return `<div class="play-card" data-clip-key="${playClipId(play)}">
    <div class="play-main">
      <div class="play-header">
        <span class="play-inning">${inningTxt}</span>
        <span class="play-event-badge">${eventBadge}</span>
        <span class="play-event-text">${event}</span>
      </div>
      <div class="play-desc">${desc}</div>
      ${scoreHtml}
      ${statcastHtml}
    </div>
    ${buildPlayScorebug(play)}
  </div>`;
}

function renderScoringPlays(data: any): void {
  const container = $("scoring-plays-list");
  if (!container) return;

  const tabEl = $("tab-scoring");
  const savedScroll = tabEl?.scrollTop ?? 0;

  const allPlays = data.liveData?.plays?.allPlays || [];
  const scoringIdx = data.liveData?.plays?.scoringPlays || [];
  const awayAbbr = data.gameData?.teams?.away?.abbreviation || "AWAY";
  const homeAbbr = data.gameData?.teams?.home?.abbreviation || "HOME";

  if (!scoringIdx.length) {
    container.innerHTML = '<div class="plays-empty">No scoring plays yet</div>';
    return;
  }

  const cards = [...scoringIdx].reverse().map((idx: number) => {
    const play = allPlays[idx];
    if (!play) return "";
    return buildPlayCard(play, awayAbbr, homeAbbr, true);
  }).filter(Boolean).join("");

  container.innerHTML = cards;
  if (tabEl) tabEl.scrollTop = savedScroll;
}

function renderAllPlays(data: any): void {
  const container = $("all-plays-list");
  if (!container) return;

  const tabEl = $("tab-plays");
  const savedScroll = tabEl?.scrollTop ?? 0;

  const allPlays = data.liveData?.plays?.allPlays || [];
  const awayAbbr = data.gameData?.teams?.away?.abbreviation || "AWAY";
  const homeAbbr = data.gameData?.teams?.home?.abbreviation || "HOME";

  if (!allPlays.length) {
    container.innerHTML = '<div class="plays-empty">Awaiting first play</div>';
    return;
  }

  const completed = allPlays.filter((p: any) => p.result?.event);
  if (!completed.length) {
    container.innerHTML = '<div class="plays-empty">Awaiting first play</div>';
    return;
  }

  const cards = [...completed].reverse().map((play: any) =>
    buildPlayCard(play, awayAbbr, homeAbbr, false)
  ).join("");

  container.innerHTML = cards;
  if (tabEl) tabEl.scrollTop = savedScroll;
}

// ── Final / wrap content ──────────────────────────────────────────────────

function renderFinalContent(data: any): void {
  const awayTeamId = data.gameData?.teams?.away?.id;
  const homeTeamId = data.gameData?.teams?.home?.id;
  const linescore = data.liveData?.linescore;
  const decisions = data.liveData?.decisions || {};
  const winner = decisions.winner;
  const loser = decisions.loser;
  const teamsBox = data.liveData?.boxscore?.teams || {};

  const awayRuns = linescore?.teams?.away?.runs ?? 0;
  const homeRuns = linescore?.teams?.home?.runs ?? 0;
  const awayWon = awayRuns > homeRuns;
  const homeWon = homeRuns > awayRuns;

  const awayLogoEl = $("final-away-team-logo") as HTMLImageElement | null;
  const homeLogoEl = $("final-home-team-logo") as HTMLImageElement | null;
  if (awayLogoEl && awayTeamId) loadLogo(awayLogoEl, awayTeamId);
  if (homeLogoEl && homeTeamId) loadLogo(homeLogoEl, homeTeamId);

  let awayPitcher: any = null;
  let homePitcher: any = null;
  let awayDecision = "";
  let homeDecision = "";

  if (awayWon) {
    awayPitcher = winner; homePitcher = loser;
    awayDecision = "W"; homeDecision = "L";
  } else if (homeWon) {
    awayPitcher = loser; homePitcher = winner;
    awayDecision = "L"; homeDecision = "W";
  }

  const getFinalPitcherLine = (teamBox: any, pitcherId: number | undefined): string => {
    if (!teamBox || !pitcherId) return "—";
    const game = teamBox.players?.[`ID${pitcherId}`]?.stats?.pitching;
    if (!game) return "—";
    const ip = game.inningsPitched ?? "0.0";
    const h = game.hits ?? 0;
    const er = game.earnedRuns ?? 0;
    const k = game.strikeOuts ?? 0;
    return `${ip} IP · ${h} H · ${er} ER · ${k} K`;
  };

  $("final-away-pitcher-name")!.textContent = awayPitcher?.fullName || "—";
  $("final-away-pitcher-stats")!.textContent = getFinalPitcherLine(teamsBox.away, awayPitcher?.id);
  const awayDecEl = $("final-away-decision")!;
  awayDecEl.textContent = awayDecision || "—";
  awayDecEl.classList.remove("win", "loss");
  if (awayDecision === "W") awayDecEl.classList.add("win");
  else if (awayDecision === "L") awayDecEl.classList.add("loss");

  $("final-home-pitcher-name")!.textContent = homePitcher?.fullName || "—";
  $("final-home-pitcher-stats")!.textContent = getFinalPitcherLine(teamsBox.home, homePitcher?.id);
  const homeDecEl = $("final-home-decision")!;
  homeDecEl.textContent = homeDecision || "—";
  homeDecEl.classList.remove("win", "loss");
  if (homeDecision === "W") homeDecEl.classList.add("win");
  else if (homeDecision === "L") homeDecEl.classList.add("loss");

  // Save pitcher (upside-down pyramid slot): center on wide, wraps below W/L on narrow.
  const save = decisions.save;
  const saveSlot = $("final-pitcher-save");
  const decGrid = document.querySelector(".final-decisions");
  if (saveSlot) {
    if (save?.id) {
      const saveTeamBox = awayWon ? teamsBox.away : teamsBox.home;
      const saveTeamId = awayWon ? awayTeamId : homeTeamId;
      const saveLogoEl = $("final-save-team-logo") as HTMLImageElement | null;
      if (saveLogoEl && saveTeamId) loadLogo(saveLogoEl, saveTeamId);
      $("final-save-pitcher-name")!.textContent = save.fullName || "—";
      $("final-save-pitcher-stats")!.textContent = getFinalPitcherLine(saveTeamBox, save.id);
      saveSlot.style.display = "";
      decGrid?.classList.add("has-save");
    } else {
      saveSlot.style.display = "none";
      decGrid?.classList.remove("has-save");
    }
  }

  const performers = data.liveData?.boxscore?.topPerformers || [];
  for (let i = 0; i < 3; i++) {
    const slot = $(`final-performer-${i + 1}`);
    if (!slot) continue;
    const performer = performers[i];
    if (!performer?.player) {
      slot.style.display = "none";
      continue;
    }
    slot.style.display = "";
    const name = performer.player.person?.fullName || "—";
    const type = performer.type;
    const isPitcher = type === "pitcher" || type === "starter";
    let stats = "—";
    if (isPitcher) {
      const p = performer.player.stats?.pitching;
      if (p?.summary) stats = p.summary;
      else if (p) stats = `${p.inningsPitched || "0"} IP · ${p.earnedRuns ?? 0} ER · ${p.strikeOuts ?? 0} K`;
    } else {
      const b = performer.player.stats?.batting;
      if (b?.summary) stats = b.summary;
      else if (b) stats = `${b.hits ?? 0}-${b.atBats ?? 0} · ${b.runs ?? 0} R · ${b.rbi ?? 0} RBI`;
    }
    const nameEl = slot.querySelector(".final-performer-name") as HTMLElement | null;
    const statsEl = slot.querySelector(".final-performer-stats") as HTMLElement | null;
    if (nameEl) nameEl.textContent = name;
    if (statsEl) statsEl.textContent = stats;
  }
}

// ── Postponed content ─────────────────────────────────────────────────────

function renderPostponedContent(data: any): void {
  const game = data.gameData;

  // Reason for postponement
  const reason = game?.status?.reason || "";
  const reasonEl = $("postponed-reason");
  if (reasonEl) {
    reasonEl.textContent = reason
      ? `Due to ${reason.toLowerCase()}`
      : "Postponed by Major League Baseball";
  }

  // Doubleheader note — only if the postponed game has been rescheduled
  // as part of a DH on its new date.
  const gameInfo = game?.game || {};
  const dh = gameInfo.doubleHeader || "N";
  const dhNum = gameInfo.gameNumber;
  const dhEl = $("postponed-dh-note");
  if (dhEl) {
    if (dh !== "N" && dhNum) {
      dhEl.textContent = `Now scheduled as Game ${dhNum} of a doubleheader`;
      dhEl.style.display = "block";
    } else {
      dhEl.style.display = "none";
    }
  }

  // Teams (for the "between" line)
  const away = game?.teams?.away?.name || "";
  const home = game?.teams?.home?.name || "";
  const teamsEl = $("postponed-teams");
  if (teamsEl) {
    teamsEl.textContent = away && home ? `${away} at ${home}` : "";
  }
}

// ── Suspended content ─────────────────────────────────────────────────────

function renderSuspendedContent(data: any): void {
  const game = data.gameData;
  const linescore = data.liveData?.linescore;

  // Inning info ("BOTTOM 2ND", "TOP 5TH", etc.)
  const inningEl = $("suspended-inning");
  if (inningEl) {
    const half = linescore?.inningHalf;
    const inning = linescore?.currentInning;
    if (half && inning) {
      const halfTxt = half === "Top" ? "TOP" : "BOTTOM";
      inningEl.textContent = `${halfTxt} ${ordinalInning(inning)}`;
    } else {
      inningEl.textContent = "";
    }
  }

  // Teams ("Tigers at Pirates")
  const away = game?.teams?.away?.name || "";
  const home = game?.teams?.home?.name || "";
  const teamsEl = $("suspended-teams");
  if (teamsEl) {
    teamsEl.textContent = away && home ? `${away} at ${home}` : "";
  }

  // Reason for suspension
  const reason = game?.status?.reason || "";
  const reasonEl = $("suspended-reason");
  if (reasonEl) {
    reasonEl.textContent = reason
      ? `Due to ${reason.toLowerCase()}`
      : "Game has been suspended";
  }

  // Makeup date — when game will resume. Check multiple potential field
  // locations defensively since MLB's API surfaces this inconsistently.
  const reschedRaw =
    game?.rescheduleDate ||
    game?.rescheduleGameDate ||
    game?.rescheduledTo ||
    game?.datetime?.rescheduleDate ||
    game?.game?.rescheduleDate ||
    null;
  const makeupEl = $("suspended-makeup-note");
  if (makeupEl) {
    if (reschedRaw) {
      const dt = new Date(reschedRaw);
      const dateStr = dt.toLocaleDateString("en-US", {
        weekday: "long", month: "long", day: "numeric"
      });
      const timeStr = formatGameTime(reschedRaw);
      makeupEl.textContent = `Resumes ${dateStr} at ${timeStr}`;
      makeupEl.style.display = "block";
    } else {
      makeupEl.style.display = "none";
    }
  }

  // Doubleheader note — if the resumption is scheduled as part of a DH.
  const gameInfo = game?.game || {};
  const dh = gameInfo.doubleHeader || "N";
  const dhNum = gameInfo.gameNumber;
  const dhEl = $("suspended-dh-note");
  if (dhEl) {
    if (dh !== "N" && dhNum) {
      dhEl.textContent = `Continues as Game ${dhNum} of a doubleheader`;
      dhEl.style.display = "block";
    } else {
      dhEl.style.display = "none";
    }
  }
}

function ordinalInning(n: number): string {
  if (n === 1) return "1ST";
  if (n === 2) return "2ND";
  if (n === 3) return "3RD";
  if (n >= 21) {
    const last = n % 10;
    if (last === 1) return `${n}ST`;
    if (last === 2) return `${n}ND`;
    if (last === 3) return `${n}RD`;
  }
  return `${n}TH`;
}

// ── Win Probability ───────────────────────────────────────────────────────

const MLB_TEAM_COLORS: Record<number, string> = {
  108: "#BA0021", 109: "#A71930", 110: "#DF4601", 111: "#BD3039",
  112: "#0E3386", 113: "#C6011F", 114: "#E50022", 115: "#7C6BAF",
  116: "#FA4616", 117: "#EB6E1F", 118: "#004687", 119: "#005A9C",
  120: "#AB0003", 121: "#FF5910", 133: "#003831", 134: "#FDB827",
  135: "#FFC72C", 136: "#005C5C", 137: "#FD5A1E", 138: "#C41E3A",
  139: "#8FBCE6", 140: "#003278", 141: "#134A8E", 142: "#D31145",
  143: "#E81828", 144: "#CE1141", 145: "#C4CED4", 146: "#00A3E0",
  147: "#C4CED3", 158: "#ffc52f", 159: "#000088", 160: "#cc0000",
};

const WBC_COLORS: Record<string, string> = {
  "Japan": "#BC002D", "USA": "#BF0A30", "Korea": "#CD2E3A",
  "Venezuela": "#CF0921", "Mexico": "#006847", "Puerto Rico": "#ED0000",
  "Dominican Republic": "#002D62", "Canada": "#FF0000",
  "Cuba": "#002A8F", "Italy": "#009246",
};

function getTeamColor(id: number | undefined, name: string = ""): string {
  if (id && MLB_TEAM_COLORS[id]) return MLB_TEAM_COLORS[id]!;
  if (name && WBC_COLORS[name]) return WBC_COLORS[name]!;
  return "#535557";
}

function escapeHtml(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

let winProbCache: any[] | null = null;

async function fetchWinProb(): Promise<any[] | null> {
  if (!gamePk) return null;
  try {
    const res = await fetch(`/api/winprob/${gamePk}`);
    if (!res.ok) return winProbCache;
    const data = await res.json();
    if (Array.isArray(data)) {
      winProbCache = data;
      return data;
    }
    return winProbCache;
  } catch (e) {
    console.error("fetchWinProb error:", e);
    return winProbCache;
  }
}

async function renderWinProb(): Promise<void> {
  const container = $("tab-winprob");
  if (!container) return;

  if (!lastGameData) {
    container.innerHTML = '<div class="placeholder">Waiting for game data…</div>';
    return;
  }

  const awayTeam = lastGameData.gameData?.teams?.away;
  const homeTeam = lastGameData.gameData?.teams?.home;
  if (!awayTeam || !homeTeam) {
    container.innerHTML = '<div class="placeholder">Waiting for game data…</div>';
    return;
  }

  if (!container.querySelector(".wp-summary")) {
    container.innerHTML = '<div class="placeholder">Loading win probability…</div>';
  }

  const wpData = await fetchWinProb();
  if (!wpData || !wpData.length) {
    container.innerHTML = '<div class="placeholder">Win probability not available</div>';
    return;
  }

  // Broadcast delay: the game feed (lastGameData) may be time-shifted behind the
  // full win-prob series, so trim win-prob to plays that have already happened in
  // the current (possibly delayed) view — otherwise the chart would spoil upcoming
  // swings. In real-time this is a no-op, since the feed is already current.
  const curAbi = lastGameData?.liveData?.plays?.currentPlay?.about?.atBatIndex;
  const wp =
    typeof curAbi === "number"
      ? wpData.filter((d: any) => typeof d.atBatIndex !== "number" || d.atBatIndex <= curAbi)
      : wpData;
  if (!wp.length) {
    container.innerHTML = '<div class="placeholder">Win probability not available yet</div>';
    return;
  }

  const awayId: number = awayTeam.id;
  const homeId: number = homeTeam.id;
  const awayName: string = awayTeam.name || "";
  const homeName: string = homeTeam.name || "";
  const awayAbbr: string = awayTeam.abbreviation || awayTeam.teamName || "AWY";
  const homeAbbr: string = homeTeam.abbreviation || homeTeam.teamName || "HOM";
  const awayColor = getTeamColor(awayId, awayName);
  const homeColor = getTeamColor(homeId, homeName);

  const latest = wp[wp.length - 1];
  const homeProb = Math.round(latest.homeTeamWinProbability ?? 50);
  const awayProb = Math.round(latest.awayTeamWinProbability ?? 50);

  const W = 520, H = 125;
  const PL = 36, PR = 16, PT = 10, PB = 22;
  const CW = W - PL - PR;
  const CH = H - PT - PB;
  const stepX = CW / Math.max(1, wp.length - 1);
  const midY = PT + CH / 2;

  const pts = wp.map((d: any, i: number) => ({
    x: PL + i * stepX,
    y: PT + CH / 2 + (((d.homeTeamWinProbability ?? 50) - 50) / 50) * (CH / 2),
    homeProb: d.homeTeamWinProbability ?? 50,
    awayProb: d.awayTeamWinProbability ?? 50,
    added: d.homeTeamWinProbabilityAdded,
    event: d.result?.event || "",
    desc: d.result?.description || "",
    inning: d.about?.inning || 0,
    isTop: !!d.about?.isTopInning,
  }));

  const linePoints = pts.map((p) => `${p.x},${p.y}`).join(" ");
  const polyPts = [`${PL},${midY}`, ...pts.map((p) => `${p.x},${p.y}`), `${PL + CW},${midY}`].join(" ");

  const ink = svgInk();
  let inningLines = "";
  let lastInn = 0;
  pts.forEach((p) => {
    if (p.inning && p.inning !== lastInn && p.isTop) {
      lastInn = p.inning;
      inningLines += `
        <line x1="${p.x}" y1="${PT}" x2="${p.x}" y2="${PT + CH}" stroke="${ink.grid}" stroke-width="1" stroke-dasharray="3,3"/>
        <line x1="${p.x}" y1="${PT + CH}" x2="${p.x}" y2="${PT + CH + 5}" stroke="${ink.mid}" stroke-width="1"/>
        <text x="${p.x}" y="${PT + CH + 15}" text-anchor="middle" font-size="8" fill="${ink.strong}" font-family="DM Mono, monospace">${p.inning}</text>`;
    }
  });

  const zones = pts.map((p, i) => {
    const prev = pts[i - 1];
    const next = pts[i + 1];
    const x = i === 0 ? PL : (prev ? prev.x + (p.x - prev.x) / 2 : PL);
    const nx = i === pts.length - 1 ? PL + CW : (next ? p.x + (next.x - p.x) / 2 : PL + CW);
    const added = p.added != null ? p.added.toFixed(1) : "N/A";
    const sign = (p.added ?? 0) >= 0 ? "+" : "";
    const acls = (p.added ?? 0) >= 0 ? "wp-pos" : "wp-neg";
    const inn = p.inning ? `${p.isTop ? "Top" : "Bot"} ${p.inning}` : "";
    return `<rect x="${x}" y="${PT}" width="${nx - x}" height="${CH}" class="wp-zone"
      data-x="${p.x}" data-y="${p.y}"
      data-home="${p.homeProb.toFixed(1)}" data-away="${p.awayProb.toFixed(1)}"
      data-added="${added}" data-acls="${acls}" data-sign="${sign}"
      data-event="${escapeHtml(p.event)}" data-desc="${escapeHtml(p.desc)}" data-inn="${inn}"/>`;
  }).join("");

  container.innerHTML = `
    <div class="wp-summary">
      <div class="wp-team wp-team-away">
        <img class="wp-team-logo" src="${getLogoPath(awayId)}" onerror="${logoFallbackAttr(awayId)}" alt="${awayAbbr}">
        <span class="wp-team-pct" style="color:${awayColor}">${awayProb}%</span>
      </div>
      <div class="wp-title">WIN PROBABILITY</div>
      <div class="wp-team wp-team-home">
        <span class="wp-team-pct" style="color:${homeColor}">${homeProb}%</span>
        <img class="wp-team-logo" src="${getLogoPath(homeId)}" onerror="${logoFallbackAttr(homeId)}" alt="${homeAbbr}">
      </div>
    </div>

    <div class="wp-prob-bar">
      <div class="wp-prob-bar-fill" style="width:${awayProb}%;background:${awayColor};"></div>
      <div class="wp-prob-bar-fill" style="width:${homeProb}%;background:${homeColor};"></div>
    </div>

    <div class="wp-chart-wrap">
      <div class="wp-tooltip" id="wp-tooltip"></div>
      <svg class="wp-chart" viewBox="0 0 ${W} ${H}" preserveAspectRatio="xMidYMid meet">
        <rect x="${PL}" y="${PT}" width="${CW}" height="${CH}" fill="${ink.chartBg}" rx="2"/>
        <defs>
          <clipPath id="wp-clip-top"><rect x="${PL}" y="${PT}" width="${CW}" height="${CH / 2}"/></clipPath>
          <clipPath id="wp-clip-bot"><rect x="${PL}" y="${PT + CH / 2}" width="${CW}" height="${CH / 2}"/></clipPath>
        </defs>
        <polygon points="${polyPts}" fill="${awayColor}" opacity="0.9" clip-path="url(#wp-clip-top)"/>
        <polygon points="${polyPts}" fill="${homeColor}" opacity="0.9" clip-path="url(#wp-clip-bot)"/>
        <line x1="${PL}" y1="${midY}" x2="${PL + CW}" y2="${midY}" stroke="${ink.mid}" stroke-width="1" stroke-dasharray="4,3"/>
        <text x="${PL - 4}" y="${midY + 3}" text-anchor="end" font-size="8" fill="${ink.strong}" font-family="DM Mono, monospace">50%</text>
        <text x="${PL - 4}" y="${PT + 6}" text-anchor="end" font-size="8" fill="${awayColor}" font-family="DM Mono, monospace">${awayAbbr}</text>
        <text x="${PL - 4}" y="${PT + CH + 2}" text-anchor="end" font-size="8" fill="${homeColor}" font-family="DM Mono, monospace">${homeAbbr}</text>
        ${inningLines}
        <polyline points="${linePoints}" fill="none" stroke="${ink.strong}" stroke-width="1.2" stroke-linejoin="round"/>
        ${zones}
        <circle id="wp-dot" cx="0" cy="0" r="4" fill="${ink.dotFill}" stroke="${ink.dotRing}" stroke-width="2" style="display:none;pointer-events:none;"/>
        <text x="${PL + CW / 2}" y="${H - 2}" text-anchor="middle" font-size="9" fill="${ink.label}" font-family="DM Mono, monospace">INNING</text>
      </svg>
    </div>

    <div class="wp-legend">
      <div class="wp-legend-item"><span class="wp-legend-swatch" style="background:${awayColor}"></span>${awayName}</div>
      <div class="wp-legend-item"><span class="wp-legend-swatch" style="background:${homeColor}"></span>${homeName}</div>
    </div>
  `;

  wireWinProbHover(awayAbbr, homeAbbr, awayColor, homeColor);
}

function wireWinProbHover(awayAbbr: string, homeAbbr: string, awayColor: string, homeColor: string): void {
  const chart = document.querySelector(".wp-chart") as SVGElement | null;
  const tooltip = $("wp-tooltip");
  const dot = document.getElementById("wp-dot");
  if (!chart || !tooltip || !dot) return;

  const showFor = (z: SVGElement): void => {
    const ds = (z as unknown as HTMLElement).dataset;
    dot.setAttribute("cx", ds.x || "0");
    dot.setAttribute("cy", ds.y || "0");
    (dot as unknown as HTMLElement).style.display = "block";
    const addedLine = ds.added !== "N/A"
      ? `<div class="${ds.acls}">${ds.sign}${ds.added}% WP shift</div>`
      : "";
    tooltip.innerHTML = `
      ${ds.inn ? `<div class="wp-tt-inn">${ds.inn}</div>` : ""}
      ${ds.event ? `<div class="wp-tt-event">${ds.event}</div>` : ""}
      ${ds.desc ? `<div class="wp-tt-desc">${ds.desc}</div>` : ""}
      ${addedLine}
      <div class="wp-tt-probs"><span style="color:${awayColor}">${awayAbbr} ${ds.away}%</span><span style="color:${homeColor}">${homeAbbr} ${ds.home}%</span></div>`;
    tooltip.style.display = "block";
  };

  const hide = (): void => {
    tooltip.style.display = "none";
    (dot as unknown as HTMLElement).style.display = "none";
  };

  chart.querySelectorAll(".wp-zone").forEach((zone) => {
    const z = zone as SVGElement;
    z.addEventListener("mouseenter", () => showFor(z));
    z.addEventListener("mouseleave", hide);
    z.addEventListener("click", (e: Event) => {
      e.stopPropagation();
      showFor(z);
    });
  });
}

function setupWinProbDismiss(): void {
  document.addEventListener("click", (e: MouseEvent) => {
    const tip = document.getElementById("wp-tooltip");
    if (!tip || tip.style.display === "none") return;
    const target = e.target as Element | null;
    if (target?.closest(".wp-chart")) return;
    tip.style.display = "none";
    const dotEl = document.getElementById("wp-dot");
    if (dotEl) (dotEl as unknown as HTMLElement).style.display = "none";
  });
}

// ── Game selection ────────────────────────────────────────────────────────

async function selectGameForThisPost(): Promise<number | null> {
  try {
    const res = await fetch("/api/post-game");
    if (res.ok) {
      const data = await res.json();
      if (data?.postType) postType = data.postType;
      if (data?.gamePk) return Number(data.gamePk);
    }
  } catch (e) {
    /* no bound game resolvable → ended bookend */
  }
  // No game is bound to this post: its render mapping has expired (threads older
  // than ~180 days) or was never written. We deliberately DON'T fall back to
  // today's game here — that made an archived thread display whatever was on the
  // current schedule. Returning null lets init() show a neutral "thread ended"
  // bookend.
  return null;
}

// Terminal "ended" bookend, shown when no game is bound to this post (render
// mapping expired past ~180 days, or was never written). Replaces the old
// fall-back-to-today's-game behavior so an archived thread never displays an
// unrelated current game. Paints into the loading overlay and leaves the
// scoreboard hidden with polling never started, so it's a final state.
function renderEndedState(): void {
  const host = $("loading-state");
  if (!host) return;
  host.innerHTML = `
    <div class="ended-display">
      <div class="ended-headline">Thread Ended</div>
      <div class="ended-divider"></div>
      <div class="ended-text">This game thread is no longer live. Live scoreboards appear here only while a game is in progress.</div>
    </div>`;
}

// ── Fetch and render ──────────────────────────────────────────────────────

async function fetchAndRender(pk: number): Promise<void> {
  try {
    const res = await fetch(`/api/game/${pk}`);
    const data = await res.json();
    if (!data?.gameData || !data?.liveData) {
      console.error("Game data unavailable");
      return;
    }
    render(data);
  } catch (e) {
    console.error("fetchAndRender error:", e);
  }
}

function render(data: any): void {
  lastGameData = data;
  const game = data.gameData;
  const linescore = data.liveData.linescore;
  // For postponement posts, force "Postponed" status regardless of what
  // /feed/live reports — that endpoint can lag the actual postponement
  // by hours, but we know definitively from post-type that this is a
  // postponement notice.
  const statusText: string = postType === "postponed"
    ? "Postponed"
    : game.status.detailedState;
  const awayTeam = game.teams.away;
  const homeTeam = game.teams.home;

  document.body.classList.toggle("is-pregame", isPreGameState(statusText));
  document.body.classList.toggle("is-live", isLiveState(statusText));
  document.body.classList.toggle("is-final", isFinalState(statusText));
  document.body.classList.toggle("is-postponed", statusText === "Postponed");
  document.body.classList.toggle("is-suspended", isSuspendedState(statusText));

  void maybeNotifyPostgame(statusText);

  const loading = $("loading-state")!;
  const content = $("scorebug-content")!;
  loading.style.display = "none";
  content.style.display = "";

  const venueName = game.venue?.name || "";
  const dt = new Date(game.datetime?.dateTime || Date.now());
  const dateStr = dt.toLocaleDateString("en-US", { month: "short", day: "numeric" }).toUpperCase();
  const timeStr = formatGameTime(game.datetime?.dateTime || dt.toISOString());
  $("venue-info")!.textContent = `${venueName.toUpperCase()} · ${dateStr} · ${timeStr}`;

  const broadcasts = game.broadcasts || [];
  const tvBroadcast = broadcasts.find((b: any) => b.type === "TV" && b.isNational);
  $("network-info")!.textContent = tvBroadcast?.name || "";

  // Postseason / Spring Training / Doubleheader context pill
  const contextEl = $("game-context");
  if (contextEl) {
    contextEl.textContent = getGameContextLabel(game);
  }

  (($("away-logo")) as HTMLImageElement).alt = awayTeam.name;
  (($("home-logo")) as HTMLImageElement).alt = homeTeam.name;
  loadLogo($("away-logo") as HTMLImageElement, awayTeam.id);
  loadLogo($("home-logo") as HTMLImageElement, homeTeam.id);

  $("away-name")!.textContent = getTeamShortName(awayTeam);
  $("home-name")!.textContent = getTeamShortName(homeTeam);

  const awayRec = awayTeam.record;
  const homeRec = homeTeam.record;
  $("away-record")!.textContent = awayRec ? `${awayRec.wins}-${awayRec.losses}` : "";
  $("home-record")!.textContent = homeRec ? `${homeRec.wins}-${homeRec.losses}` : "";

  $("away-score")!.textContent = String(linescore?.teams?.away?.runs ?? 0);
  $("home-score")!.textContent = String(linescore?.teams?.home?.runs ?? 0);

  const badge = $("status-badge")!;
  const inning = $("inning-info")!;
  const countBlock = $("status-count")!;

  hideAllStatePanes();

  if (isFinalState(statusText)) {
    badge.textContent = "FINAL";
    badge.style.background = "";
    const n = linescore?.currentInning || 9;
    inning.textContent = n !== 9 ? `F/${n}` : "";
    inning.style.color = "";
    countBlock.style.display = "none";
    $("dynamic-tab-label")!.textContent = "WRAP";
    const finEl = $("final-content");
    if (finEl) finEl.style.display = "block";
    try { renderFinalContent(data); } catch (e) { reportError("renderFinalContent", e); }
  } else if (isPreGameState(statusText)) {
    badge.textContent = "";
    inning.textContent = timeStr;
    inning.style.color = "var(--text-secondary)";
    countBlock.style.display = "none";
    $("dynamic-tab-label")!.textContent = "GAME INFO";
    const preEl = $("pregame-content");
    if (preEl) preEl.style.display = "block";
    try { renderPregameContent(data, awayTeam, homeTeam); } catch (e) { reportError("renderPregameContent", e); }
  } else if (statusText === "Postponed") {
    badge.textContent = "POSTPONED";
    badge.style.background = "";
    const reason = game?.status?.reason || "";
    inning.textContent = reason ? reason.toUpperCase() : "";
    inning.style.color = "var(--text-secondary)";
    countBlock.style.display = "none";
    $("dynamic-tab-label")!.textContent = "POSTPONED";
    const ppdEl = $("postponed-content");
    if (ppdEl) ppdEl.style.display = "block";
    try { renderPostponedContent(data); } catch (e) { reportError("renderPostponedContent", e); }
  } else if (isSuspendedState(statusText)) {
    badge.textContent = "SUSPENDED";
    badge.style.background = "";
    const half = linescore?.inningHalf === "Top" ? "▲" : "▼";
    inning.textContent = linescore?.currentInning
      ? `${half} ${linescore.currentInning}`
      : "";
    inning.style.color = "";
    countBlock.style.display = "none";
    $("dynamic-tab-label")!.textContent = "SUSPENDED";
    const susEl = $("suspended-content");
    if (susEl) susEl.style.display = "block";
    try { renderSuspendedContent(data); } catch (e) { reportError("renderSuspendedContent", e); }
  } else if (isLiveState(statusText)) {
    badge.textContent = "LIVE";
    badge.style.background = "";
    const half = linescore?.inningHalf === "Top" ? "▲" : "▼";
    inning.textContent = `${half} ${linescore?.currentInning || ""}`;
    inning.style.color = "";

    const cp = data.liveData?.plays?.currentPlay;
    const count = cp?.count;
    if (count) {
      $("balls")!.textContent = String(count.balls ?? 0);
      $("strikes")!.textContent = String(count.strikes ?? 0);
      $("outs")!.textContent = String(count.outs ?? 0);
      countBlock.style.display = "flex";
    } else {
      countBlock.style.display = "none";
    }
    $("dynamic-tab-label")!.textContent = "LIVE";
    const liveEl = $("live-content");
    if (liveEl) liveEl.style.display = "block";
    try { renderLiveContent(data); } catch (e) { reportError("renderLiveContent", e); }
  } else {
    badge.textContent = statusText.toUpperCase();
    badge.style.background = "var(--text-muted)";
    inning.textContent = "";
    countBlock.style.display = "none";
    $("dynamic-tab-label")!.textContent = statusText.toUpperCase();
  }

  try { renderWeather(data); } catch (e) { reportError("renderWeather", e); }

  try { renderLinescore(linescore, awayTeam, homeTeam, isFinalState(statusText)); }
  catch (e) { reportError("renderLinescore", e); }

  if ($("tab-box")?.classList.contains("tab-content-active")) {
    try { renderBoxScore(data); }
    catch (e) { reportError("renderBoxScore", e); }
  }

  if ($("tab-plays")?.classList.contains("tab-content-active")) {
    try { renderScoringPlays(data); }
    catch (e) { reportError("renderScoringPlays", e); }
    void augmentScoringVideos();
    void augmentStatcast();
    void renderHighlights();
    try { renderAllPlays(data); }
    catch (e) { reportError("renderAllPlays", e); }
  }

  if ($("tab-winprob")?.classList.contains("tab-content-active")) {
    void renderWinProb();
  }

  // Once the game is final or postponed there's nothing more to fetch — stop
  // the loop so a multi-day postgame thread isn't polling the MLB API forever.
  if (isTerminalState(statusText)) {
    gameIsTerminal = true;
    stopPolling();
  }
}

// ── Linescore ─────────────────────────────────────────────────────────────

function renderLinescore(linescore: any, awayTeam: any, homeTeam: any, isFinal: boolean): void {
  if (!linescore) return;
  const innings = linescore.innings || [];
  const currentInning = linescore.currentInning;
  const maxInnings = Math.max(9, innings.length);

  const awayRuns = linescore.teams?.away?.runs ?? 0;
  const homeRuns = linescore.teams?.home?.runs ?? 0;
  const awayIsLoser = isFinal && homeRuns > awayRuns;
  const homeIsLoser = isFinal && awayRuns > homeRuns;

  let headerCells = '<th class="ls-team-col"></th>';
  for (let i = 1; i <= maxInnings; i++) {
    headerCells += `<th class="ls-inning-h${i === currentInning ? ' ls-current' : ""}">${i}</th>`;
  }
  headerCells += '<th class="ls-total ls-r-header">R</th><th class="ls-total ls-h-header">H</th><th class="ls-total ls-e-header">E</th>';

  const buildRow = (teamKey: "away" | "home", team: any): string => {
    const abbr = team.abbreviation || team.teamName?.slice(0, 3).toUpperCase() || "—";
    let cells = `<td class="ls-team-col">
      <img class="ls-team-logo" src="${getLogoPath(team.id)}" onerror="${logoFallbackAttr(team.id)}" alt="${abbr}">
      <span class="ls-team-abbr">${abbr}</span>
    </td>`;
    for (let i = 1; i <= maxInnings; i++) {
      const inn = innings.find((x: any) => x.num === i);
      const runs = inn?.[teamKey]?.runs;
      const isCurrent = i === currentInning;
      let cls = "ls-inning";
      if (runs == null) cls += " ls-empty";
      else if (runs === 0) cls += " ls-zero";
      else cls += " ls-nonzero";
      if (isCurrent) cls += " ls-current";
      cells += `<td class="${cls}">${runs == null ? "–" : runs}</td>`;
    }
    const t = linescore.teams[teamKey];
    const r = t?.runs ?? 0;
    const h = t?.hits ?? 0;
    const e = t?.errors ?? 0;
    cells += `<td class="ls-total ls-r-value ${r === 0 ? "ls-zero" : "ls-nonzero"}">${r}</td>`;
    cells += `<td class="ls-total ls-h-value ${h === 0 ? "ls-zero" : "ls-nonzero"}">${h}</td>`;
    cells += `<td class="ls-total ls-e-value">${e}</td>`;
    return cells;
  };

  const awayRowClass = awayIsLoser ? "ls-row-loser" : "";
  const homeRowClass = homeIsLoser ? "ls-row-loser" : "";

  $("linescore-container")!.innerHTML = `
    <table class="linescore-compact">
      <thead><tr>${headerCells}</tr></thead>
      <tbody>
        <tr class="ls-row-away ${awayRowClass}">${buildRow("away", awayTeam)}</tr>
        <tr class="ls-row-home ${homeRowClass}">${buildRow("home", homeTeam)}</tr>
      </tbody>
    </table>`;
}

// ── Tab switching ─────────────────────────────────────────────────────────

// Plays tab: a sliding Scoring / All toggle over the two play lists (merged from
// the old separate tabs). Scoring is the default. Switching slides the thumb and
// animates the newly-shown list in.
function setPlaysView(which: "highlights" | "scoring" | "all"): void {
  const toggle = $("plays-toggle");
  const lists: Record<string, HTMLElement | null> = {
    highlights: $("highlights-list"),
    scoring: $("scoring-plays-list"),
    all: $("all-plays-list"),
  };
  const show = lists[which];
  if (!toggle || !show) return;
  toggle.setAttribute("data-active", which);
  toggle.querySelectorAll<HTMLElement>(".plays-seg").forEach((seg) => {
    seg.classList.toggle("is-active", seg.getAttribute("data-plays") === which);
  });
  Object.keys(lists).forEach((k) => { const l = lists[k]; if (l) l.hidden = k !== which; });
  show.classList.remove("plays-list-enter");
  void show.offsetWidth; // reflow so the enter animation replays each switch
  show.classList.add("plays-list-enter");
}

function setupPlaysToggle(): void {
  const toggle = $("plays-toggle");
  if (!toggle) return;
  toggle.querySelectorAll<HTMLElement>(".plays-seg").forEach((seg) => {
    seg.addEventListener("click", () => {
      const which = seg.getAttribute("data-plays");
      if (which === "highlights" || which === "scoring" || which === "all") setPlaysView(which);
      if (which === "highlights") void renderHighlights();
    });
  });
}

function setupTabs(): void {
  document.querySelectorAll(".tab").forEach((btn) => {
    btn.addEventListener("click", () => {
      const targetTab = (btn as HTMLElement).dataset.tab;
      if (!targetTab) return;
      document.body.classList.toggle("on-box-tab", targetTab === "box");
      // Every tab except the live one condenses the scorebug (animated) so the
      // data gets the vertical room. "dynamic" is the live/game-info tab.
      document.body.classList.toggle("compact-top", targetTab !== "dynamic");
      document.body.classList.toggle("on-standings-tab", targetTab === "standings");
      document.querySelectorAll(".tab").forEach((t) => t.classList.remove("tab-active"));
      btn.classList.add("tab-active");
      document.querySelectorAll(".tab-content").forEach((c) => c.classList.remove("tab-content-active"));
      $(`tab-${targetTab}`)?.classList.add("tab-content-active");

      // A newly selected tab always starts at the top. Two scrollers to reset:
      // the <body> in expanded mode, and the newly-active panel itself in inline
      // mode (where the body doesn't scroll — the panel is the scroll region).
      // Without the panel reset, a tab paged down inline would reopen mid-page.
      // (Fires only on an explicit tab tap, never on the 10s poll.)
      document.body.scrollTop = 0;
      document.documentElement.scrollTop = 0;
      const region = inlinePagerRegion();
      if (region) region.scrollTop = 0;

      if (targetTab === "box" && lastGameData) {
        try { renderBoxScore(lastGameData); } catch (e) { reportError("renderBoxScore", e); }
      }
      if (targetTab === "plays") {
        if (lastGameData) {
          try { renderScoringPlays(lastGameData); } catch (e) { reportError("renderScoringPlays", e); }
          try { renderAllPlays(lastGameData); } catch (e) { reportError("renderAllPlays", e); }
          void augmentScoringVideos();
          void augmentStatcast();
        }
        setPlaysView("scoring");
      }
      if (targetTab === "winprob") {
        void renderWinProb();
      }
      if (targetTab === "standings") {
        setStandLeague("AL");
      }
    });
  });
}

// ── Polling ───────────────────────────────────────────────────────────────

function startPolling(): void {
  if (pollInterval) clearInterval(pollInterval);
  pollInterval = setInterval(() => {
    // Skip the fetch while the post is scrolled off-screen / backgrounded.
    if (document.hidden || gamePk == null) return;
    void fetchAndRender(gamePk);
  }, 10000);
}

function stopPolling(): void {
  if (pollInterval) {
    clearInterval(pollInterval);
    pollInterval = null;
  }
}

// ── Postgame notification ──────────────────────────────────────────────────

async function maybeNotifyPostgame(statusText: string): Promise<void> {
  if (postgameNotificationFired) return;
  if (!isFinalState(statusText)) return;
  postgameNotificationFired = true;
  try {
    await fetch("/api/postgame-check", { method: "POST" });
  } catch (e) {
    console.error("postgame notify failed:", e);
  }
}

// ── Init ──────────────────────────────────────────────────────────────────

// ═══ Restored features: top-bar buttons + overlay, weather, scoring videos ═══

const GRAPH_ICON = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 18 L9 12 L13 16 L21 6"/><polyline points="15 6 21 6 21 12"/></svg>';
const TV_ICON = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="7" width="20" height="13" rx="2"/><path d="M8 3l4 4 4-4"/></svg>';
const FEED_TV_ICON = TV_ICON;
const FEED_RADIO_ICON = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="14" r="2.5"/><path d="M4.9 9.9a10 10 0 0 1 14.2 0"/><path d="M7.8 12.8a6 6 0 0 1 8.4 0"/></svg>';
const CHEV_UP_ICON = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M6 15l6-6 6 6"/></svg>';
const CHEV_DOWN_ICON = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M6 9l6 6 6-6"/></svg>';
const OVERLAY_CLOSE_ICON = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 6l12 12M18 6L6 18"/></svg>';
const VIDEO_ICON = '<svg viewBox="0 0 24 24" fill="currentColor" stroke="none"><path d="M8 5v14l11-7z"/></svg>';
const WX_SUN_ICON = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="4.5"/><path d="M12 2v2M12 20v2M4.2 4.2l1.4 1.4M18.4 18.4l1.4 1.4M2 12h2M20 12h2M4.2 19.8l1.4-1.4M18.4 5.6l1.4-1.4"/></svg>';
const WX_CLOUD_ICON = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17.5 19a4.5 4.5 0 0 0 .5-8.97A6 6 0 0 0 6.34 9.5 4 4 0 0 0 7 19z"/></svg>';
const WX_PARTLY_ICON = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="8" cy="8.5" r="2.6"/><path d="M8 3.4v1.2M4.1 4.6l.8.8M3 8.5h1.2M11.9 4.6l-.8.8"/><path d="M17 19a4 4 0 0 0 .4-7.98A5.2 5.2 0 0 0 7.6 12 4 4 0 0 0 8 19z"/></svg>';
const WX_RAIN_ICON = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17.5 14a4.5 4.5 0 0 0 .5-8.97A6 6 0 0 0 6.34 4.5 4 4 0 0 0 7 14z"/><path d="M8 18v1.5M12 18v2.5M16 18v1.5"/></svg>';
const WX_SNOW_ICON = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17.5 14a4.5 4.5 0 0 0 .5-8.97A6 6 0 0 0 6.34 4.5 4 4 0 0 0 7 14z"/><path d="M8 18.5v.01M12 20v.01M16 18.5v.01"/></svg>';
const WX_ROOF_ICON = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 12a9 9 0 0 1 18 0"/><path d="M2 12h20M6 12v6M18 12v6M6 18h12"/></svg>';

interface OverlayItem { label: string; sub?: string; url?: string; img?: string; icon?: string; }
let infoOverlayEl: HTMLElement | null = null;

function overlayRowsHtml(items: OverlayItem[]): string {
  return items.map((it, i) => {
    const visual = it.img ? `<img class="info-row-logo" src="${it.img}" alt="">` : it.icon ? `<span class="info-row-icon">${it.icon}</span>` : "";
    const inner = visual + '<span class="info-row-text"><span class="info-row-label">' + it.label + "</span>" + (it.sub ? '<span class="info-row-sub">' + it.sub + "</span>" : "") + "</span>";
    const style = `animation-delay:${50 + i * 55}ms`;
    return it.url ? `<button class="info-row" type="button" data-url="${it.url}" style="${style}">${inner}</button>` : `<div class="info-row is-static" style="${style}">${inner}</div>`;
  }).join("");
}
function wireOverlayRows(ov: HTMLElement): void {
  ov.querySelectorAll<HTMLElement>(".info-row[data-url]").forEach((row) => {
    row.addEventListener("click", () => { const url = row.getAttribute("data-url"); if (!url) return; try { navigateTo(url); } catch (e) { reportError("navigateTo", e); } });
  });
  ov.querySelectorAll<HTMLImageElement>(".info-row-logo").forEach((img) => { img.addEventListener("error", () => { img.style.display = "none"; }); });
}
function closeInfoOverlay(): void {
  const ov = infoOverlayEl; if (!ov) return;
  ov.classList.remove("is-open");
  window.setTimeout(() => { if (ov && !ov.classList.contains("is-open")) ov.style.display = "none"; }, 220);
}
function openInfoOverlay(title: string, items: OverlayItem[]): void {
  const host = $("scorebug-content") || document.body;
  let ov = infoOverlayEl;
  if (!ov) { ov = document.createElement("div"); ov.className = "info-overlay"; ov.addEventListener("click", (e) => { if (e.target === ov) closeInfoOverlay(); }); host.appendChild(ov); infoOverlayEl = ov; }
  ov.innerHTML = '<div class="info-panel"><div class="info-panel-head"><span class="info-panel-title">' + title + '</span><button class="info-panel-close" type="button" aria-label="Close">' + OVERLAY_CLOSE_ICON + '</button></div><div class="info-panel-body">' + overlayRowsHtml(items) + "</div></div>";
  ov.querySelector(".info-panel-close")?.addEventListener("click", closeInfoOverlay);
  wireOverlayRows(ov);
  ov.style.display = "flex"; void ov.offsetWidth; ov.classList.add("is-open");
  syncOverlayScroll();
}
function setOverlayRows(items: OverlayItem[]): void {
  const ov = infoOverlayEl; if (!ov) return;
  const body = ov.querySelector(".info-panel-body"); if (!body) return;
  body.innerHTML = overlayRowsHtml(items); wireOverlayRows(ov);
  syncOverlayScroll();
}
// Guardrail for long overlay lists (e.g. teams with many TV/radio feeds): the
// panel is capped to the overlay's padding, and when the list overflows we add
// paging arrows in INLINE mode (touch scroll doesn't reach the web view there —
// same trap as the main card, and scrollBy from a button is the proven fix).
// Expanded mode scrolls natively, so no arrows.
function syncOverlayScroll(): void {
  const ov = infoOverlayEl; if (!ov) return;
  const panel = ov.querySelector<HTMLElement>(".info-panel");
  const body = ov.querySelector<HTMLElement>(".info-panel-body, .pl-scroll");
  if (!panel || !body) return;
  panel.querySelector(".info-scroll")?.remove();
  window.requestAnimationFrame(() => {
    if (!document.body.classList.contains("is-inline")) return;
    if (body.scrollHeight <= body.clientHeight + 4) return;
    const bar = document.createElement("div");
    bar.className = "info-scroll";
    bar.innerHTML =
      '<button class="info-scroll-btn" type="button" aria-label="Scroll up" data-dir="-1">' + CHEV_UP_ICON + "</button>" +
      '<button class="info-scroll-btn" type="button" aria-label="Scroll down" data-dir="1">' + CHEV_DOWN_ICON + "</button>";
    bar.querySelectorAll<HTMLElement>(".info-scroll-btn").forEach((b) => {
      b.addEventListener("click", () => {
        const dir = Number(b.getAttribute("data-dir")) || 1;
        body.scrollBy({ top: dir * 150, behavior: "smooth" });
      });
    });
    panel.appendChild(bar);
  });
}

function mkTopMiniButton(id: string, label: string, icon: string, side: "left" | "right", offsetPx: number): HTMLButtonElement {
  const b = document.createElement("button");
  b.id = id; b.type = "button"; b.className = "topbar-mini-btn"; b.setAttribute("aria-label", label); b.innerHTML = icon;
  b.style.cssText = "position:absolute;top:10px;" + side + ":" + offsetPx + "px;z-index:40;width:25px;height:25px;display:flex;align-items:center;justify-content:center;padding:0;background:var(--bg-elev-2);color:var(--text-primary);border:1px solid var(--border-medium);border-radius:6px;cursor:pointer;-webkit-tap-highlight-color:transparent;backdrop-filter:blur(4px);-webkit-backdrop-filter:blur(4px);";
  return b;
}
function setupGraphButton(): void {
  if (document.getElementById("graph-btn")) return;
  const host = $("scorebug-content") || document.body;
  const btn = mkTopMiniButton("graph-btn", "Analytics links", GRAPH_ICON, "right", 44);
  btn.addEventListener("click", () => {
    if (gamePk == null) return;
    const od = lastGameData?.gameData?.datetime?.officialDate;
    const date = typeof od === "string" && od ? od : new Date().toISOString().slice(0, 10);
    openInfoOverlay("Analytics", [
      { label: "Baseball Savant", sub: "Statcast game feed", img: "assets/logos/savant.png", url: `https://baseballsavant.mlb.com/gamefeed?gamePk=${gamePk}` },
      { label: "MLB.com Gameday", sub: "Official game page", img: "assets/logos/mlb.png", url: `https://www.mlb.com/gameday/${gamePk}` },
      { label: "FanGraphs", sub: "Live scoreboard for the day", img: "assets/logos/fangraphs.png", url: `https://www.fangraphs.com/scores?date=${date}` },
      { label: "Baseball-Reference", sub: "Box scores (posts next day)", img: "assets/logos/baseball-reference.png", url: "https://www.baseball-reference.com/boxes/index.fcgi" },
    ]);
  });
  host.appendChild(btn);
}
async function fetchBroadcastItems(pk: number): Promise<OverlayItem[]> {
  try {
    const res = await fetch(`/api/broadcasts/${pk}`);
    if (!res.ok) return [{ label: "Broadcast info unavailable" }];
    const data: any = await res.json();
    const game: any = data?.dates?.[0]?.games?.[0];
    const casts: any[] = game?.broadcasts || [];
    if (casts.length === 0) return [{ label: "No listed broadcasts" }];
    const tier = (b: any): string => { if (b?.isNational) return "National"; const ha = String(b?.homeAway || "").toLowerCase(); if (ha === "away") return "Away feed"; if (ha === "home") return "Home feed"; return "Broadcast"; };
    const rank = (b: any): number => { const t = tier(b); return t === "National" ? 0 : t === "Away feed" ? 1 : t === "Home feed" ? 2 : 3; };
    const seen = new Set<string>();
    const items: OverlayItem[] = [];
    casts.slice().sort((a, b) => rank(a) - rank(b)).forEach((b) => {
      const name = String(b?.name || b?.callSign || "").trim();
      if (!name) return;
      const kind = String(b?.type || "").toUpperCase();
      const dedup = name + "|" + kind + "|" + tier(b);
      if (seen.has(dedup)) return; seen.add(dedup);
      const isTv = kind.includes("TV");
      items.push({ label: name, sub: kind ? `${tier(b)} · ${kind}` : tier(b), icon: isTv ? FEED_TV_ICON : FEED_RADIO_ICON });
    });
    return items.length ? items : [{ label: "No listed broadcasts" }];
  } catch (e) { reportError("fetchBroadcastItems", e); return [{ label: "Broadcast info unavailable" }]; }
}
function setupTvButton(): void {
  if (document.getElementById("tv-btn")) return;
  const host = $("scorebug-content") || document.body;
  const btn = mkTopMiniButton("tv-btn", "Where to watch", TV_ICON, "left", 44);
  btn.addEventListener("click", async () => {
    if (gamePk == null) return;
    openInfoOverlay("Where to Watch", [{ label: "Loading…" }]);
    const items = await fetchBroadcastItems(gamePk);
    setOverlayRows(items);
  });
  host.appendChild(btn);
}

function weatherCategory(cond: string): string {
  const c = cond.toLowerCase();
  if (/(rain|drizzle|shower|thunder)/.test(c)) return "rain";
  if (/(snow|flurr|wintry)/.test(c)) return "snow";
  if (/(partly|mostly cloudy|partly sunny)/.test(c)) return "partly";
  if (/(cloud|overcast|hazy|fog|mist)/.test(c)) return "cloud";
  if (/(clear|sunny|fair)/.test(c)) return "sun";
  return "cloud";
}
function weatherIconFor(cat: string): string {
  switch (cat) { case "rain": return WX_RAIN_ICON; case "snow": return WX_SNOW_ICON; case "partly": return WX_PARTLY_ICON; case "sun": return WX_SUN_ICON; default: return WX_CLOUD_ICON; }
}
function renderWeather(data: any): void {
  const lineEl = $("linescore-container");
  const parent = lineEl?.parentElement;
  if (!lineEl || !parent) return;
  let strip = $("weather-strip");
  if (!strip) { strip = document.createElement("div"); strip.id = "weather-strip"; strip.className = "weather-strip"; parent.insertBefore(strip, lineEl); }
  const w = data?.gameData?.weather;
  const cond = String(w?.condition || "").trim();
  const temp = String(w?.temp || "").trim();
  if (!cond && !temp) { strip.style.display = "none"; return; }
  strip.style.display = "";
  if (/dome|roof|indoor/i.test(cond)) { strip.innerHTML = '<span class="weather-pill wx-roof"><span class="weather-icon">' + WX_ROOF_ICON + '</span><span class="weather-text">Roof Closed</span></span>'; return; }
  const cat = weatherCategory(cond);
  const tempTxt = temp ? `${temp}°` : "";
  const sep = cond && tempTxt ? " · " : "";
  strip.innerHTML = `<span class="weather-pill wx-${cat}"><span class="weather-icon">${weatherIconFor(cat)}</span><span class="weather-text">${cond}${sep}${tempTxt}</span></span>`;
}

let clipMapCache: { pk: number; map: Record<string, string>; ts: number } | null = null;
async function getClipMap(pk: number): Promise<Record<string, string>> {
  const now = Date.now();
  if (clipMapCache && clipMapCache.pk === pk && now - clipMapCache.ts < 30000) return clipMapCache.map;
  try { const res = await fetch(`/api/clips/${pk}`); if (!res.ok) return clipMapCache?.map || {}; const map = (await res.json()) as Record<string, string>; clipMapCache = { pk, map, ts: now }; return map; } catch (e) { reportError("getClipMap", e); return clipMapCache?.map || {}; }
}
function playClipId(play: any): string {
  const evs = play?.playEvents;
  if (!Array.isArray(evs)) return "";
  for (let i = evs.length - 1; i >= 0; i--) { const pid = evs[i]?.playId; if (pid) return String(pid); }
  return "";
}
interface StatcastEntry { xba: string; ev: string; la: string; dist: string; barrel: number; }
let statcastCache: { pk: number; map: Record<string, StatcastEntry>; ts: number } | null = null;
async function getStatcastMap(pk: number): Promise<Record<string, StatcastEntry>> {
  const now = Date.now();
  if (statcastCache && statcastCache.pk === pk && now - statcastCache.ts < 30000) return statcastCache.map;
  try {
    const res = await fetch(`/api/statcast/${pk}`);
    if (!res.ok) return statcastCache?.map || {};
    const map = (await res.json()) as Record<string, StatcastEntry>;
    statcastCache = { pk, map, ts: now };
    return map;
  } catch (e) { reportError("getStatcastMap", e); return statcastCache?.map || {}; }
}
async function augmentStatcast(): Promise<void> {
  if (gamePk == null) return;
  const lists = [$("scoring-plays-list"), $("all-plays-list")].filter((x): x is HTMLElement => !!x);
  if (!lists.length) return;
  const cards: HTMLElement[] = [];
  lists.forEach((l) => l.querySelectorAll<HTMLElement>(".play-card[data-clip-key]").forEach((c) => cards.push(c)));
  if (!cards.length) return;
  const map = await getStatcastMap(gamePk);
  cards.forEach((card) => {
    const keyId = card.getAttribute("data-clip-key");
    if (!keyId) return;
    const sc = map[keyId];
    if (!sc || !sc.xba) return;
    if (card.querySelector(".play-statcast")) return;
    const bits: string[] = [];
    if (sc.ev) bits.push(`<span class="sc-ev${sc.barrel ? " sc-barrel" : ""}">${sc.ev} mph</span>`);
    if (sc.la) bits.push(`<span class="sc-la">${sc.la}°</span>`);
    bits.push(`<span class="sc-xba">xBA ${sc.xba}</span>`);
    const strip = document.createElement("div");
    strip.className = "play-statcast";
    strip.innerHTML = bits.join("");
    (card.querySelector(".play-main") || card).appendChild(strip);
  });
}

// ═══ Highlights (curated MLB clips — same content feed as the scoring videos) ═══
interface HlItem { t: string; u: string; }
let hlCache: { pk: number; items: HlItem[]; ts: number } | null = null;
async function fetchHighlights(pk: number): Promise<HlItem[]> {
  const now = Date.now();
  if (hlCache && hlCache.pk === pk && now - hlCache.ts < 60000) return hlCache.items;
  try {
    const res = await fetch(`/api/highlights/${pk}`);
    if (!res.ok) return hlCache?.items || [];
    const items = (await res.json()) as HlItem[];
    hlCache = { pk, items: Array.isArray(items) ? items : [], ts: now };
    return hlCache.items;
  } catch (e) { reportError("fetchHighlights", e); return hlCache?.items || []; }
}
async function renderHighlights(): Promise<void> {
  if (gamePk == null) return;
  const list = $("highlights-list");
  if (!list) return;
  const items = await fetchHighlights(gamePk);
  if (!items.length) {
    list.innerHTML = '<div class="hl-empty">No highlights yet — they appear here as MLB posts them.</div>';
    return;
  }
  list.innerHTML = items.map((it, i) =>
    `<button class="hl-row" type="button" data-i="${i}"><span class="hl-play">` +
    VIDEO_ICON + `</span><span class="hl-title"></span></button>`).join("");
  list.querySelectorAll<HTMLElement>(".hl-row").forEach((row) => {
    const i = Number(row.getAttribute("data-i"));
    const it = items[i];
    if (!it) return;
    const titleEl = row.querySelector(".hl-title");
    if (titleEl) titleEl.textContent = it.t; // textContent — titles are external text
    row.addEventListener("click", () => { try { navigateTo(it.u); } catch (e) { reportError("navigateTo(hl)", e); } });
  });
}

async function augmentScoringVideos(): Promise<void> {
  if (gamePk == null) return;
  const container = $("scoring-plays-list");
  if (!container) return;
  const cards = container.querySelectorAll<HTMLElement>(".play-card[data-clip-key]");
  if (cards.length === 0) return;
  const map = await getClipMap(gamePk);
  cards.forEach((card) => {
    const key = card.getAttribute("data-clip-key");
    if (!key) return;
    const url = map[key];
    if (!url) return;
    if (card.querySelector(".play-video-btn")) return;
    const btn = document.createElement("button");
    btn.type = "button"; btn.className = "play-video-btn"; btn.setAttribute("aria-label", "Watch this play");
    btn.innerHTML = VIDEO_ICON + "<span>VIDEO</span>";
    btn.addEventListener("click", (e) => { e.stopPropagation(); try { navigateTo(url); } catch (err) { reportError("navigateTo(video)", err); } });
    (card.querySelector(".play-main") || card).appendChild(btn);
  });
}

// ═══ Standings tab (AL / NL / Wild Card / Bracket) ═══
const STAND_DIVISION_NAMES: Record<number, string> = { 201: "AL East", 202: "AL Central", 200: "AL West", 204: "NL East", 205: "NL Central", 203: "NL West" };
const STAND_TEAM_ABBR: Record<number, string> = { 108:"LAA",109:"ARI",110:"BAL",111:"BOS",112:"CHC",113:"CIN",114:"CLE",115:"COL",116:"DET",117:"HOU",118:"KC",119:"LAD",120:"WSH",121:"NYM",133:"OAK",134:"PIT",135:"SD",136:"SEA",137:"SF",138:"STL",139:"TB",140:"TEX",141:"TOR",142:"MIN",143:"PHI",144:"ATL",145:"CWS",146:"MIA",147:"NYY",158:"MIL" };

let standCache: any = null;
let standCacheTs = 0;
let standActiveLeague = "AL";
let standLoaded = false;

async function fetchStandingsData(): Promise<any> {
  const now = Date.now();
  if (standCache && now - standCacheTs < 120000) return standCache;
  const res = await fetch("/api/standings");
  if (!res.ok) throw new Error("standings fetch failed");
  const data = await res.json();
  standCache = data; standCacheTs = now;
  return data;
}
function standAbbr(team: any): string {
  const id = team?.id;
  return (id != null && STAND_TEAM_ABBR[id]) || String(team?.abbreviation || team?.name?.split(" ").pop() || "").toUpperCase();
}
function standPct(p: any): string {
  if (!p || p === "0") return ".000";
  const f = parseFloat(p);
  return f < 1 ? "." + String(Math.round(f * 1000)).padStart(3, "0") : f.toFixed(3);
}
function standGB(leadW: number, leadL: number, w: number, l: number): string {
  if (w === leadW && l === leadL) return "—";
  const gb = ((leadW - w) + (l - leadL)) / 2;
  return gb % 1 === 0 ? String(gb) : gb.toFixed(1);
}
function standTeamRow(team: any, rank: number, isFirst: boolean, gb: string, clinchLine: boolean): string {
  const id = team?.team?.id;
  const abbr = standAbbr(team?.team);
  const p = parseFloat(team?.winningPercentage) || 0;
  const barPct = Math.max(0, Math.min(100, ((p - 0.35) / 0.35) * 100));
  return `<div class="stand-row${isFirst ? " leader" : ""}${clinchLine ? " playoff-line" : ""}">` +
    `<span class="stand-pos${isFirst ? " first" : ""}">${rank}</span>` +
    `<span class="stand-team"><img class="stand-logo" src="${getLogoPath(id)}" onerror="${logoFallbackAttr(id)}" alt="${abbr}"><span class="stand-abbr">${abbr}</span></span>` +
    `<span class="stand-stat">${team?.wins ?? 0}</span>` +
    `<span class="stand-stat">${team?.losses ?? 0}</span>` +
    `<span class="stand-stat muted">${gb}</span>` +
    `<span class="stand-stat muted">${team?.runsScored ?? "—"}</span>` +
    `<span class="stand-stat muted">${team?.runsAllowed ?? "—"}</span>` +
    `<span class="stand-stat ${(team?.runDifferential ?? 0) > 0 ? "pos" : (team?.runDifferential ?? 0) < 0 ? "neg" : ""}">${(team?.runDifferential ?? 0) > 0 ? "+" : ""}${team?.runDifferential ?? "—"}</span>` +
    `<span class="stand-pct"><span class="stand-pct-val">${standPct(team?.winningPercentage)}</span><span class="stand-bar"><span class="stand-bar-fill" style="width:${barPct}%"></span></span></span>` +
    `</div>`;
}
function standColHdr(): string {
  return '<div class="stand-col-hdr"><span>#</span><span class="stand-col-team">Team</span><span>W</span><span>L</span><span>GB</span><span>R</span><span>RA</span><span>DIFF</span><span class="stand-col-pct">PCT</span></div>';
}
function standDivisionCard(record: any): string {
  const name = STAND_DIVISION_NAMES[record?.division?.id] || "Division";
  const teams = [...(record?.teamRecords || [])].sort((a: any, b: any) => parseFloat(b.winningPercentage) - parseFloat(a.winningPercentage));
  const lead = teams[0];
  const rows = teams.map((t: any, i: number) => standTeamRow(t, i + 1, i === 0, standGB(lead?.wins || 0, lead?.losses || 0, t.wins, t.losses), false)).join("");
  return `<div class="stand-card"><div class="stand-card-hdr"><span class="stand-card-dot"></span><span class="stand-card-name">${name}</span></div>${standColHdr()}${rows}</div>`;
}
function standWildcardCards(data: any): string {
  return ["AL", "NL"].map((lg) => {
    const leagueId = lg === "AL" ? 103 : 104;
    const wc: any[] = [];
    (data?.records || []).forEach((rec: any) => { if (rec?.league?.id !== leagueId) return; (rec.teamRecords || []).forEach((t: any) => { if (t.wildCardRank && parseInt(t.wildCardRank) <= 8) wc.push(t); }); });
    wc.sort((a, b) => parseInt(a.wildCardRank) - parseInt(b.wildCardRank));
    const rows = wc.map((t) => { const rank = parseInt(t.wildCardRank); const gbRaw = t.wildCardGamesBack || t.gamesBack; const gb = !gbRaw || gbRaw === "-" || gbRaw === "0.0" || gbRaw === 0 ? "—" : gbRaw; return standTeamRow(t, rank, rank <= 3, gb, rank === 4); }).join("");
    return `<div class="stand-card"><div class="stand-card-hdr"><span class="stand-card-dot"></span><span class="stand-card-name">${lg} Wild Card</span><span class="stand-wc-badge">3 spots</span></div>${standColHdr()}${rows}</div>`;
  }).join("");
}
const TEAM_DIVISION: Record<number, number> = {
  110:201,111:201,147:201,139:201,141:201,          // AL East
  145:202,114:202,116:202,118:202,142:202,          // AL Central
  117:200,108:200,133:200,136:200,140:200,          // AL West
  144:204,146:204,121:204,143:204,120:204,          // NL East
  112:205,113:205,158:205,134:205,138:205,          // NL Central
  109:203,115:203,119:203,135:203,137:203,          // NL West
};
let sbCache: { date: string; data: any; ts: number } | null = null;
async function fetchScoreboard(): Promise<any> {
  // Pin the slate to THIS thread's game date — an old thread should keep
  // showing its own day's division games, not drift to today's.
  const od = lastGameData?.gameData?.datetime?.officialDate;
  const date = typeof od === "string" && /^\d{4}-\d{2}-\d{2}$/.test(od) ? od : "";
  const now = Date.now();
  if (sbCache && sbCache.date === date && now - sbCache.ts < 60000) return sbCache.data;
  const res = await fetch(date ? `/api/scoreboard/${date}` : "/api/scoreboard");
  if (!res.ok) throw new Error("scoreboard fetch failed");
  const data = await res.json();
  sbCache = { date, data, ts: now };
  return data;
}
function sbStatusHtml(g: any): string {
  const abstract = String(g?.status?.abstractGameState || "");
  if (abstract === "Live") {
    const ls = g?.linescore || {};
    const inn = ls.currentInning ?? "";
    const st = String(ls.inningState || "");
    const mark = st === "Top" ? "\u25B2" : st === "Bottom" ? "\u25BC" : st === "Middle" ? "M" : st === "End" ? "E" : "";
    return `<span class="sb-live-dot"></span><span class="sb-inn">${mark}${inn}</span>`;
  }
  if (abstract === "Final") {
    const inn = g?.linescore?.currentInning;
    return `<span class="sb-final">F${typeof inn === "number" && inn > 9 ? "/" + inn : ""}</span>`;
  }
  let time = "";
  // No timeZone option — this runs on the viewer's device, so the start time
  // renders in THEIR local zone (Central user sees Central, etc.).
  try { time = new Date(g.gameDate).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" }); } catch { time = ""; }
  return `<span class="sb-time">${time}</span>`;
}
function sbTeamRow(side: any): string {
  const id = side?.team?.id;
  const abbr = (id != null && STAND_TEAM_ABBR[id]) || String(side?.team?.abbreviation || "").toUpperCase() || "—";
  const score = side?.score ?? "";
  return `<div class="sb-team"><img class="sb-logo" src="${getLogoPath(id)}" onerror="${logoFallbackAttr(id)}" alt=""><span class="sb-abbr">${abbr}</span><span class="sb-score">${score}</span></div>`;
}
async function renderDivOpp(): Promise<string> {
  const data = await fetchScoreboard();
  const games: any[] = data?.sched?.dates?.[0]?.games || [];
  const cfgTeam: number | null = data?.teamId != null && /^\d+$/.test(String(data.teamId)) ? Number(data.teamId) : null;
  const divs = new Set<number>();
  const cfgDiv = cfgTeam != null ? TEAM_DIVISION[cfgTeam] : undefined;
  if (cfgDiv != null) {
    // A configured sub team owns the view: its division only.
    divs.add(cfgDiv);
  } else {
    // No team configured (an all-games sub): show BOTH clubs' divisions.
    const awayId = lastGameData?.gameData?.teams?.away?.id;
    const homeId = lastGameData?.gameData?.teams?.home?.id;
    const da = typeof awayId === "number" ? TEAM_DIVISION[awayId] : undefined;
    const dh = typeof homeId === "number" ? TEAM_DIVISION[homeId] : undefined;
    if (da != null) divs.add(da);
    if (dh != null) divs.add(dh);
  }
  const inDiv = (g: any): boolean => {
    if (divs.size === 0) return true; // nothing derivable — whole slate
    const a = g?.teams?.away?.team?.id, hm = g?.teams?.home?.team?.id;
    const ga = TEAM_DIVISION[a], gh = TEAM_DIVISION[hm];
    return (ga != null && divs.has(ga)) || (gh != null && divs.has(gh));
  };
  const rows = games
    .filter((g) => g?.gamePk !== gamePk)
    .filter(inDiv)
    .map((g) => `<div class="sb-box"><div class="sb-status">${sbStatusHtml(g)}</div>${sbTeamRow(g.teams?.away)}${sbTeamRow(g.teams?.home)}</div>`)
    .join("");
  return rows ? `<div class="sb-grid">${rows}</div>` : '<div class="stand-msg">No division games today.</div>';
}

async function loadStandingsView(): Promise<void> {
  standLoaded = true;
  const body = $("stand-body");
  if (!body) return;
  const lg = standActiveLeague;
  body.innerHTML = '<div class="stand-msg">Loading…</div>';
  if (lg === "DIV") {
    try { body.innerHTML = await renderDivOpp(); }
    catch (e) { reportError("renderDivOpp", e); body.innerHTML = '<div class="stand-msg">Could not load the scoreboard.</div>'; }
    return;
  }
  try {
    const data = await fetchStandingsData();
    if (lg === "WC") { body.innerHTML = standWildcardCards(data); return; }
    const divIds = lg === "AL" ? [201, 202, 200] : [204, 205, 203];
    const cards = divIds.map((id) => { const rec = (data?.records || []).find((r: any) => r?.division?.id === id); return rec ? standDivisionCard(rec) : ""; }).join("");
    body.innerHTML = cards || '<div class="stand-msg">No standings available.</div>';
  } catch (e) {
    reportError("loadStandingsView", e);
    body.innerHTML = '<div class="stand-msg">Could not load standings.</div>';
  }
}
function setStandLeague(lg: string): void {
  standActiveLeague = lg;
  const nav = $("stand-nav");
  if (nav) { nav.setAttribute("data-active", lg); nav.querySelectorAll<HTMLElement>(".stand-seg").forEach((s) => s.classList.toggle("is-active", s.getAttribute("data-league") === lg)); }
  void loadStandingsView();
}
function setupStandings(): void {
  const nav = $("stand-nav");
  if (!nav) return;
  nav.querySelectorAll<HTMLElement>(".stand-seg").forEach((seg) => { seg.addEventListener("click", () => { const lg = seg.getAttribute("data-league"); if (lg) setStandLeague(lg); }); });
  // Re-render on theme change so team logos swap to the correct light/dark variant.
  const obs = new MutationObserver(() => { if (standLoaded) void loadStandingsView(); });
  obs.observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });
}

// ═══ Tap-a-player → season stat box (Stage 1: bio + season stats, no fetch) ═══
interface PlStat { name: string; label: string; fmt?: (v: any) => string; }
const PL_RATE = (v: any): string => { const f = parseFloat(v); return isNaN(f) ? "-" : f.toFixed(3).replace(/^0+/, ""); };
const PL_F2 = (v: any): string => { const f = parseFloat(v); return isNaN(f) ? "-" : f.toFixed(2); };
const PL_F1 = (v: any): string => { const f = parseFloat(v); return isNaN(f) ? "-" : f.toFixed(1); };
const PLAYER_HITTING_STATS: PlStat[] = [
  { name: "avg", label: "AVG", fmt: PL_RATE }, { name: "homeRuns", label: "HR" }, { name: "rbi", label: "RBI" },
  { name: "ops", label: "OPS", fmt: PL_RATE }, { name: "obp", label: "OBP", fmt: PL_RATE }, { name: "slg", label: "SLG", fmt: PL_RATE },
  { name: "hits", label: "H" }, { name: "runs", label: "R" }, { name: "doubles", label: "2B" }, { name: "triples", label: "3B" },
  { name: "stolenBases", label: "SB" }, { name: "baseOnBalls", label: "BB" }, { name: "strikeOuts", label: "SO" }, { name: "plateAppearances", label: "PA" }, { name: "totalBases", label: "TB" },
];
const PLAYER_PITCHING_STATS: PlStat[] = [
  { name: "era", label: "ERA", fmt: PL_F2 }, { name: "whip", label: "WHIP", fmt: PL_RATE }, { name: "strikeOuts", label: "K" }, { name: "wins", label: "W" }, { name: "losses", label: "L" },
  { name: "saves", label: "SV" }, { name: "holds", label: "HLD" }, { name: "inningsPitched", label: "IP", fmt: PL_F1 },
  { name: "strikeoutWalkRatio", label: "K/BB", fmt: PL_F2 }, { name: "hits", label: "H" }, { name: "runs", label: "R" }, { name: "homeRuns", label: "HR" },
  { name: "baseOnBalls", label: "BB" }, { name: "gamesPlayed", label: "G" }, { name: "gamesStarted", label: "GS" },
];

function plAdvancedCells(stats: any, isPitcher: boolean): string {
  if (!stats) return "";
  const num = (v: any): number => parseFloat(v);
  const cell = (val: string, lbl: string): string => `<div class="pl-adv-i"><span class="pl-adv-v">${val}</span><span class="pl-adv-l">${lbl}</span></div>`;
  const out: string[] = [];
  if (isPitcher) {
    const ip = num(stats.inningsPitched), so = num(stats.strikeOuts), bb = num(stats.baseOnBalls), hr = num(stats.homeRuns);
    if (ip > 0) {
      if (!isNaN(so)) out.push(cell(((so * 9) / ip).toFixed(1), "K/9"));
      if (!isNaN(bb)) out.push(cell(((bb * 9) / ip).toFixed(1), "BB/9"));
      if (!isNaN(hr)) out.push(cell(((hr * 9) / ip).toFixed(1), "HR/9"));
    }
  } else {
    const slg = num(stats.slg), avg = num(stats.avg), pa = num(stats.plateAppearances), bb = num(stats.baseOnBalls), so = num(stats.strikeOuts);
    if (!isNaN(slg) && !isNaN(avg)) out.push(cell((slg - avg).toFixed(3).replace(/^0+/, ""), "ISO"));
    if (pa > 0 && !isNaN(bb)) out.push(cell(((bb / pa) * 100).toFixed(1) + "%", "BB%"));
    if (pa > 0 && !isNaN(so)) out.push(cell(((so / pa) * 100).toFixed(1) + "%", "K%"));
  }
  return out.join("");
}

function buildPlayerBox(playerId: string): string {
  const data = lastGameData;
  if (!data) return '<div class="pl-box"><div class="pl-msg">No player data available.</div></div>';
  const bio: any = data.gameData?.players?.["ID" + playerId] || {};
  let seasonBat: any = null, seasonPit: any = null, teamId: any = null, teamName = "";
  const teams: any = data.liveData?.boxscore?.teams || {};
  for (const side of ["away", "home"]) {
    const p: any = teams[side]?.players?.["ID" + playerId];
    if (p) { seasonBat = p.seasonStats?.batting; seasonPit = p.seasonStats?.pitching; teamId = teams[side]?.team?.id; teamName = teams[side]?.team?.name || ""; break; }
  }
  const name = bio.fullName || "Player";
  const pos = bio.primaryPosition?.abbreviation || "";
  const posName = bio.primaryPosition?.name || pos;
  const isPitcher = pos === "P";
  const stats: any = isPitcher ? seasonPit : seasonBat;
  let logoSrc = "";
  if (teamId != null) logoSrc = MLB_TEAM_IDS.has(teamId) ? `/teams/dark/${teamId}.svg` : `/teams/${teamId}.svg`;
  const logo = teamId != null ? `<img class="pl-team-logo" src="${logoSrc}" onerror="${logoFallbackAttr(teamId)}" alt="">` : "";
  const details: string[] = [];
  if (bio.primaryNumber) details.push(`<span>#${bio.primaryNumber}</span>`);
  if (bio.currentAge) details.push(`<span>Age ${bio.currentAge}</span>`);
  if (bio.batSide?.code && bio.pitchHand?.code) details.push(`<span>B/T ${bio.batSide.code}/${bio.pitchHand.code}</span>`);
  const sv = (statName: string, fmt?: (v: any) => string): string => {
    const raw = stats ? stats[statName] : null;
    if (raw == null || raw === "") return "\u2014";
    return fmt ? fmt(raw) : String(raw);
  };
  let body = '<div class="pl-msg">No season stats yet.</div>';
  if (stats) {
    const trio: Array<[string, string]> = isPitcher
      ? [["ERA", sv("era", PL_F2)], ["IP", sv("inningsPitched", PL_F1)], ["K", sv("strikeOuts")]]
      : [["AVG", sv("avg", PL_RATE)], ["OBP", sv("obp", PL_RATE)], ["SLG", sv("slg", PL_RATE)]];
    const tiles: Array<[string, string]> = isPitcher
      ? [["W", sv("wins")], ["L", sv("losses")], ["SV", sv("saves")], ["HLD", sv("holds")]]
      : [["HR", sv("homeRuns")], ["RBI", sv("rbi")], ["R", sv("runs")], ["SB", sv("stolenBases")]];
    const rows: Array<[string, string]> = isPitcher
      ? [["WHIP", sv("whip", PL_RATE)], ["Hits", sv("hits")], ["Runs", sv("runs")], ["Home Runs", sv("homeRuns")], ["Walks", sv("baseOnBalls")], ["K/BB", sv("strikeoutWalkRatio", PL_F2)], ["Games", sv("gamesPlayed")], ["Starts", sv("gamesStarted")]]
      : [["Hits", sv("hits")], ["Doubles", sv("doubles")], ["Triples", sv("triples")], ["Walks", sv("baseOnBalls")], ["Strikeouts", sv("strikeOuts")], ["Plate App.", sv("plateAppearances")], ["Total Bases", sv("totalBases")], ["OPS", sv("ops", PL_RATE)]];
    const adv = plAdvancedCells(stats, isPitcher);
    body =
      `<div class="pl-trio">${trio.map(([l, v]) => `<div class="pl-trio-i"><div class="pl-trio-v">${v}</div><div class="pl-trio-l">${l}</div></div>`).join("")}</div>` +
      `<div class="pl-tiles">${tiles.map(([l, v]) => `<div class="pl-tile"><div class="pl-tile-v">${v}</div><div class="pl-tile-l">${l}</div></div>`).join("")}</div>` +
      `<div class="pl-rows">${rows.map(([l, v]) => `<div class="pl-r"><span class="pl-r-l">${l}</span><span class="pl-r-v">${v}</span></div>`).join("")}</div>` +
      (adv ? `<div class="pl-adv">${adv}</div>` : "");
  }
  // Header sits OUTSIDE the scroller (pinned by flex, no position:sticky — sticky
  // inside a programmatically scrolled container is a known WebKit blank trigger).
  return `<div class="pl-box"><div class="pl-hdr"><button class="info-panel-close" type="button" aria-label="Close">${OVERLAY_CLOSE_ICON}</button><div class="pl-name">${name}</div>` +
    `<div class="pl-meta"><span>${posName}</span><span class="pl-dot"></span>${logo}<span>${teamName}</span></div>` +
    (details.length ? `<div class="pl-meta pl-details">${details.join('<span class="pl-dot"></span>')}</div>` : "") +
    `</div><div class="pl-scroll"><div class="pl-form" id="pl-form"></div>` + body + "</div></div>";
}

let plCurrentId = "";
async function fetchPlayerRecent(id: string, group: string): Promise<{ label: string; sub: string; cls: string } | null> {
  try {
    const res = await fetch(`/api/player-recent/${id}/${group}`);
    if (!res.ok) return null;
    const data: any = await res.json();
    const games: any[] = data?.stats?.[0]?.splits || [];
    if (!games.length) return null;
    if (group === "hitting") {
      let ab = 0, h = 0;
      games.forEach((g) => { ab += Number(g.stat?.atBats) || 0; h += Number(g.stat?.hits) || 0; });
      if (ab <= 0) return null;
      const avg = h / ab;
      const disp = avg.toFixed(3).replace(/^0+/, "");
      const cls = avg > 0.285 ? "hot" : avg >= 0.225 ? "steady" : "cold";
      const word = cls === "hot" ? "Hot" : cls === "steady" ? "Steady" : "Cold";
      return { label: `${word} · last ${games.length}`, sub: `${disp} AVG`, cls };
    } else {
      let er = 0, ip = 0;
      games.forEach((g) => {
        er += Number(g.stat?.earnedRuns) || 0;
        const s = String(g.stat?.inningsPitched || "0");
        if (s.includes(".")) { const p = s.split("."); ip += (Number(p[0]) || 0) + (Number(p[1]) || 0) / 3; }
        else ip += Number(s) || 0;
      });
      if (ip <= 0) return null;
      const era = (er / ip) * 9;
      const disp = era.toFixed(2);
      const cls = era < 3.0 ? "hot" : era <= 3.9 ? "steady" : "cold";
      const word = cls === "hot" ? "Hot" : cls === "steady" ? "Steady" : "Cold";
      return { label: `${word} · last ${games.length}`, sub: `${disp} ERA`, cls };
    }
  } catch (e) { reportError("fetchPlayerRecent", e); return null; }
}
async function openPlayer(playerId: string): Promise<void> {
  plCurrentId = playerId;
  openPlayerOverlay(buildPlayerBox(playerId));
  const data = lastGameData;
  if (!data) return;
  const bio: any = data.gameData?.players?.["ID" + playerId];
  const group = bio?.primaryPosition?.abbreviation === "P" ? "pitching" : "hitting";
  const loadEl = $("pl-form");
  if (loadEl) loadEl.innerHTML = '<span class="pl-form-load">Checking recent form…</span>';
  const form = await fetchPlayerRecent(playerId, group);
  if (plCurrentId !== playerId) return; // user tapped a different player mid-fetch
  const el = $("pl-form");
  if (!el) return;
  if (!form) { el.innerHTML = ""; return; }
  el.innerHTML = `<span class="pl-badge pl-${form.cls}"><span class="pl-badge-word">${form.label}</span><span class="pl-badge-val">${form.sub}</span></span>`;
}

function openPlayerOverlay(html: string): void {
  const host = $("scorebug-content") || document.body;
  let ov = infoOverlayEl;
  if (!ov) { ov = document.createElement("div"); ov.className = "info-overlay"; ov.addEventListener("click", (e) => { if (e.target === ov) closeInfoOverlay(); }); host.appendChild(ov); infoOverlayEl = ov; }
  ov.innerHTML = '<div class="info-panel pl-panel">' + html + "</div>";
  ov.querySelector(".info-panel-close")?.addEventListener("click", closeInfoOverlay);
  ov.style.display = "flex"; void ov.offsetWidth; ov.classList.add("is-open");
  syncOverlayScroll();
}

function setupPlayerTaps(): void {
  const box = $("tab-box");
  if (!box) return;
  box.addEventListener("click", (e) => {
    const target = e.target as HTMLElement | null;
    const row = target?.closest?.(".bs-row[data-player-id]") as HTMLElement | null;
    if (!row) return;
    const id = row.getAttribute("data-player-id");
    if (!id) return;
    void openPlayer(id);
  });
}

(async (): Promise<void> => {
  setupTabs();
  setupPlaysToggle();
  setupBoxScoreTeamTabs();
  setupWinProbDismiss();
  setupThemeToggle();
  setupExpand();
  setupGraphButton();
  setupTvButton();
  setupStandings();
  setupPlayerTaps();
  setupInlinePager();

  // When the post returns to view, refresh immediately (only while the poll is
  // still alive — i.e. not after a terminal-state stop).
  document.addEventListener("visibilitychange", () => {
    if (!document.hidden && pollInterval !== null && gamePk != null) {
      void fetchAndRender(gamePk);
    }
  });

  gamePk = await selectGameForThisPost();
  if (!gamePk) {
    renderEndedState();
    return;
  }
  await fetchAndRender(gamePk);

  // Don't start the loop at all if the game was already over on load.
  if (!gameIsTerminal) startPolling();
})();