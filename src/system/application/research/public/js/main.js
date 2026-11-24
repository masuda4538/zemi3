// --- KEYBOARD SHORTCUTS & APP BOOTSTRAP ---
window.addEventListener('keydown', (e) => {
    const activeTag = document.activeElement?.tagName.toLowerCase();
    const isTyping = activeTag === 'input' || activeTag === 'textarea' || activeTag === 'select';

    if (e.key === 'Escape') {
        closeDetailPanel();
        closeGlossaryModal();
        hideContextMenu();
        if (state.sidebarOpenMobile) toggleSidebar();
    }

    if ((!isTyping && e.key === '/') || ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k')) {
        e.preventDefault();
        const input = document.getElementById('searchInput');
        if (input) input.focus();
    }

    if (e.altKey && e.key.toLowerCase() === 'r') {
        e.preventDefault();
        refreshArticlesFromAPI();
    }

    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'b') {
        e.preventDefault();
        toggleSidebar();
    }
});

window.addEventListener('click', () => { hideContextMenu(); });

window.onload = function() {
    loadLocalState();
    setViewFilter('all');
    initChart();
    fetchLiveNewsAPI();
};
