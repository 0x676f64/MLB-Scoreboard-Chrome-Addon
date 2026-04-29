// scrollbar.js — horizontal scroll controls for the leaderboard table.
// Runs after DOMContentLoaded so the table container is guaranteed to exist.

document.addEventListener('DOMContentLoaded', () => {

    const leftBtn   = document.getElementById('scrollLeft');
    const rightBtn  = document.getElementById('scrollRight');
    const container = document.getElementById('tableContainer');

    if (!leftBtn || !rightBtn || !container) return;

    const SCROLL_AMOUNT = 180;   // px per click

    leftBtn.addEventListener('click', () => {
        container.scrollBy({ left: -SCROLL_AMOUNT, behavior: 'smooth' });
    });

    rightBtn.addEventListener('click', () => {
        container.scrollBy({ left: SCROLL_AMOUNT, behavior: 'smooth' });
    });

    // Update button opacity based on scroll position
    function syncButtons() {
        const atStart = container.scrollLeft <= 0;
        const atEnd   = container.scrollLeft >= container.scrollWidth - container.clientWidth - 1;
        leftBtn.style.opacity  = atStart ? '0.25' : '1';
        rightBtn.style.opacity = atEnd   ? '0.25' : '1';
        leftBtn.disabled  = atStart;
        rightBtn.disabled = atEnd;
    }

    container.addEventListener('scroll', syncButtons, { passive: true });

    // Re-sync when the table re-renders (MutationObserver watches for table changes)
    const observer = new MutationObserver(syncButtons);
    observer.observe(container, { childList: true, subtree: true });

    syncButtons();   // initial state
});