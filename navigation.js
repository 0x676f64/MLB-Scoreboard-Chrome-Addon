document.addEventListener('DOMContentLoaded', () => {

    // ── Navigation helper ─────────────────────────────────────────────────────
    // Uses window.location.href so navigation works in both the Chrome extension
    // popup context and regular browser previews.

    const go = (page) => { window.location.href = page; };

    // ── Bottom nav buttons ────────────────────────────────────────────────────

    const homeBtn      = document.getElementById('home-btn');
    const standingsBtn = document.getElementById('standings-btn');
    const statsBtn     = document.getElementById('stats-btn');
    const playerBtn    = document.getElementById('player-btn');

    if (homeBtn)      homeBtn.addEventListener('click',      () => go('default.html'));
    if (standingsBtn) standingsBtn.addEventListener('click', () => go('standings.html'));
    if (statsBtn)     statsBtn.addEventListener('click',     () => go('stats.html'));
    if (playerBtn)    playerBtn.addEventListener('click',    () => go('player-stats.html'));

    // ── Back button (stats-dashboard → team grid) ─────────────────────────────
    // history.back() is unreliable inside Chrome extension popups — the popup
    // history is often empty or resets between opens. A direct href is always safe.

    const backBtn = document.getElementById('back-btn');
    if (backBtn) backBtn.addEventListener('click', () => go('stats.html'));

});