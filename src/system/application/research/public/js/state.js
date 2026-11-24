// --- APPLICATION STATE & PERSISTENCE ---
let state = {
    currentRegion: 'jp',
    currentView: 'all',
    selectedCategory: 'すべて',
    dateFilter: 'all',
    searchQuery: '',
    bookmarks: new Set(),
    readArticles: new Set(),
    memos: {},
    categoryVisits: {},
    activeArticleId: null,
    contextTargetArticleId: null,
    aiSummaryActive: false,
    aiTranslated: false,
    sidebarOpenMobile: false,
    sidebarCollapsedDesktop: false
};

let memoSaveTimeout = null;

function saveLocalState() {
    try {
        const payload = {
            bookmarks: Array.from(state.bookmarks),
            readArticles: Array.from(state.readArticles),
            memos: state.memos,
            categoryVisits: state.categoryVisits
        };
        localStorage.setItem('techfeed_desktop_v2_1', JSON.stringify(payload));
    } catch (e) {
        console.warn('LocalStorage save error:', e);
    }
}

function loadLocalState() {
    try {
        const data = localStorage.getItem('techfeed_desktop_v2_1');
        if (data) {
            const parsed = JSON.parse(data);
            if (parsed.bookmarks) state.bookmarks = new Set(parsed.bookmarks);
            if (parsed.readArticles) state.readArticles = new Set(parsed.readArticles);
            if (parsed.memos) state.memos = parsed.memos;
            if (parsed.categoryVisits) state.categoryVisits = parsed.categoryVisits;
        }
    } catch (e) {
        console.warn('LocalStorage load error:', e);
    }
}

function toggleDarkMode() {
    document.documentElement.classList.toggle('dark');
}

function toggleSidebar() {
    const sidebar = document.getElementById('desktopSidebar');
    const backdrop = document.getElementById('sidebarBackdrop');
    if (!sidebar) return;

    const isMobile = window.innerWidth < 768;
    if (isMobile) {
        state.sidebarOpenMobile = !state.sidebarOpenMobile;
        if (state.sidebarOpenMobile) {
            sidebar.classList.remove('-translate-x-full');
            if (backdrop) backdrop.classList.remove('opacity-0', 'pointer-events-none');
        } else {
            sidebar.classList.add('-translate-x-full');
            if (backdrop) backdrop.classList.add('opacity-0', 'pointer-events-none');
        }
    } else {
        state.sidebarCollapsedDesktop = !state.sidebarCollapsedDesktop;
        if (state.sidebarCollapsedDesktop) {
            sidebar.classList.add('md:-ml-60');
        } else {
            sidebar.classList.remove('md:-ml-60');
        }
    }
}

function showToast(msg) {
    const toast = document.createElement('div');
    toast.className = 'fixed bottom-5 right-5 z-50 bg-slate-900 text-white dark:bg-brand-600 text-xs px-3.5 py-2.5 rounded-xl shadow-lg border border-slate-700/50 flex items-center space-x-2 transition-all transform translate-y-2 opacity-0';
    toast.innerHTML = `<i data-lucide="check-circle" class="w-4 h-4 text-emerald-400"></i><span>${msg}</span>`;
    document.body.appendChild(toast);
    if (window.lucide) lucide.createIcons();
    setTimeout(() => toast.classList.remove('translate-y-2', 'opacity-0'), 50);
    setTimeout(() => {
        toast.classList.add('opacity-0', 'translate-y-2');
        setTimeout(() => toast.remove(), 300);
    }, 2500);
}
