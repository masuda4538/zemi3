import { SAMPLE_ARTICLES, IT_DICTIONARY } from './config.js';
import {
    fetchGNewsArticles,
    getGNewsApiKey,
    setGNewsApiKey,
    getDailyUsageInfo
} from './gnews-api.js';
import {
    showToast,
    injectInlineGlossary,
    renderCategoryNav,
    renderFrequentCategories,
    renderHeroArticle,
    renderArticleCards,
    initChart
} from './ui-renderer.js';

let articles = [...SAMPLE_ARTICLES];

const state = {
    currentRegion: 'jp',
    currentView: 'all',
    selectedCategory: 'すべて',
    dateFilter: 'all',
    searchQuery: '',
    user: { isLoggedIn: false, userId: 'ゲストユーザー' },
    bookmarks: new Set(),
    readArticles: new Set(),
    memos: {},
    categoryVisits: {},
    activeArticleId: null,
    contextTargetArticleId: null,
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
            categoryVisits: state.categoryVisits,
            user: state.user
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
            if (parsed.user) state.user = parsed.user;
        }
    } catch (e) {
        console.warn('LocalStorage load error:', e);
    }
}

function updateQuotaIndicator() {
    const usage = getDailyUsageInfo();
    const badge = document.getElementById('freeQuotaBadge');
    if (badge) badge.innerText = `無料枠: ${usage.count}/${usage.limit}`;
}

function getFilteredArticles() {
    let list = articles.filter((art) => art.region === state.currentRegion);

    if (state.currentView === 'recommended') {
        const topCategories = Object.keys(state.categoryVisits)
            .sort((a, b) => state.categoryVisits[b] - state.categoryVisits[a]);
        list = list.filter((art) => {
            const isTopCategory = topCategories.slice(0, 2).includes(art.category);
            return isTopCategory || art.isTrending || state.bookmarks.has(art.id);
        });
    } else if (state.currentView === 'trending') {
        list = list.filter((art) => art.isTrending || art.viewsCount > 1000);
    } else if (state.currentView === 'bookmarks') {
        list = list.filter((art) => state.bookmarks.has(art.id));
    } else if (state.currentView === 'unread') {
        list = list.filter((art) => !state.readArticles.has(art.id));
    }

    if (state.selectedCategory !== 'すべて') {
        list = list.filter((art) => art.category === state.selectedCategory);
    }

    if (state.dateFilter !== 'all') {
        const now = Date.now();
        list = list.filter((art) => {
            const hoursDiff = (now - new Date(art.date).getTime()) / (1000 * 60 * 60);
            if (state.dateFilter === '24h') return hoursDiff <= 24;
            if (state.dateFilter === '7d') return hoursDiff <= 24 * 7;
            return true;
        });
    }

    if (state.searchQuery) {
        const q = state.searchQuery.toLowerCase();
        list = list.filter((art) =>
            art.title.toLowerCase().includes(q) ||
            art.description.toLowerCase().includes(q) ||
            art.source.toLowerCase().includes(q) ||
            art.category.toLowerCase().includes(q)
        );
    }

    return list;
}

export async function refreshArticlesFromAPI(forceRefresh = true) {
    const syncIcon = document.getElementById('syncIcon');
    const syncBtn = document.getElementById('syncBtn');
    if (syncIcon) syncIcon.classList.add('animate-spin');
    if (syncBtn) syncBtn.disabled = true;

    try {
        const { articles: gnewsArticles, fromCache } = await fetchGNewsArticles({
            region: state.currentRegion,
            query: state.searchQuery,
            forceRefresh
        });

        gnewsArticles.forEach((ga) => {
            if (!articles.some((a) => a.id === ga.id)) {
                articles.unshift(ga);
            }
        });

        if (fromCache) {
            showToast('キャッシュから記事を読み込みました（API枠消費なし）');
        } else {
            showToast('フィードを最新に更新しました');
        }
    } catch (err) {
        console.warn('GNews API取得エラー:', err);
        showToast(err.message || 'GNews APIの取得に失敗しました', true);
    } finally {
        if (syncIcon) syncIcon.classList.remove('animate-spin');
        if (syncBtn) syncBtn.disabled = false;
        updateQuotaIndicator();
        updateUI();
    }
}

function updateUI() {
    const userNameEl = document.getElementById('userName');
    if (userNameEl) userNameEl.innerText = state.user.userId;
    const userRoleEl = document.getElementById('userRole');
    if (userRoleEl) userRoleEl.innerText = getGNewsApiKey() ? 'GNews Free連携中' : 'APIキー未設定';
    const userAvatarEl = document.getElementById('userAvatar');
    if (userAvatarEl) userAvatarEl.innerText = state.user.userId.charAt(0).toUpperCase();
    const userAvatarSidebar = document.getElementById('userAvatarSidebar');
    if (userAvatarSidebar) userAvatarSidebar.innerText = state.user.userId.charAt(0).toUpperCase();

    const regionArticles = articles.filter((a) => a.region === state.currentRegion);
    document.getElementById('badge-all-count').innerText = regionArticles.length;

    const topCat = Object.keys(state.categoryVisits)
        .sort((x, y) => state.categoryVisits[y] - state.categoryVisits[x])[0];
    document.getElementById('badge-recommended-count').innerText =
        regionArticles.filter((a) => a.category === topCat || a.isTrending).length;
    document.getElementById('badge-bookmark-count').innerText =
        regionArticles.filter((a) => state.bookmarks.has(a.id)).length;
    document.getElementById('badge-unread-count').innerText =
        regionArticles.filter((a) => !state.readArticles.has(a.id)).length;

    const isJp = state.currentRegion === 'jp';
    document.getElementById('regionJpBtn').className =
        `px-2 py-1 rounded flex items-center space-x-1 transition-all ${isJp ? 'bg-white dark:bg-slate-700 shadow-xs text-slate-900 dark:text-white font-bold' : 'text-slate-600 dark:text-slate-400'}`;
    document.getElementById('regionGlobalBtn').className =
        `px-2 py-1 rounded flex items-center space-x-1 transition-all ${!isJp ? 'bg-white dark:bg-slate-700 shadow-xs text-slate-900 dark:text-white font-bold' : 'text-slate-600 dark:text-slate-400'}`;

    const titles = {
        all: 'すべての記事',
        recommended: '🔥 おススメ記事',
        trending: '📈 急上昇トレンド',
        bookmarks: 'ブックマーク一覧',
        unread: '未読記事一覧',
        analytics: 'ITトレンド分析'
    };
    document.getElementById('viewTitle').innerHTML = `<span>${titles[state.currentView] || '記事一覧'}</span>`;

    const feedView = document.getElementById('feedView');
    const heroContainer = document.getElementById('heroFeaturedContainer');
    const analyticsView = document.getElementById('analyticsView');
    const emptyState = document.getElementById('emptyState');
    const resultCountBadge = document.getElementById('resultCountBadge');

    if (state.currentView === 'analytics') {
        feedView.classList.add('hidden');
        heroContainer.classList.add('hidden');
        analyticsView.classList.remove('hidden');
        emptyState.classList.add('hidden');
        resultCountBadge.innerText = 'チャート表示';
    } else {
        analyticsView.classList.add('hidden');
        const filtered = getFilteredArticles();
        resultCountBadge.innerText = `${filtered.length} 件`;

        if (filtered.length === 0) {
            feedView.classList.add('hidden');
            heroContainer.classList.add('hidden');
            emptyState.classList.remove('hidden');
        } else {
            emptyState.classList.add('hidden');
            feedView.classList.remove('hidden');
            const topArticle = [...filtered].sort((a, b) => b.viewsCount - a.viewsCount)[0];
            if (topArticle && !state.searchQuery && ['all', 'recommended', 'trending'].includes(state.currentView)) {
                renderHeroArticle(topArticle, heroContainer, state);
                heroContainer.classList.remove('hidden');
                renderArticleCards(filtered.filter((a) => a.id !== topArticle.id), state);
            } else {
                heroContainer.classList.add('hidden');
                renderArticleCards(filtered, state);
            }
        }
    }

    renderCategoryNav(articles, state);
    renderFrequentCategories(state);
    updateQuotaIndicator();
    saveLocalState();
    if (window.lucide) lucide.createIcons();
}

export function toggleSidebar() {
    const sidebar = document.getElementById('desktopSidebar');
    const backdrop = document.getElementById('sidebarBackdrop');
    if (!sidebar) return;

    if (window.innerWidth < 768) {
        state.sidebarOpenMobile = !state.sidebarOpenMobile;
        sidebar.classList.toggle('-translate-x-full', !state.sidebarOpenMobile);
        backdrop?.classList.toggle('opacity-0', !state.sidebarOpenMobile);
        backdrop?.classList.toggle('pointer-events-none', !state.sidebarOpenMobile);
    } else {
        state.sidebarCollapsedDesktop = !state.sidebarCollapsedDesktop;
        sidebar.classList.toggle('md:-ml-60', state.sidebarCollapsedDesktop);
    }
}

export function setRegion(r) { state.currentRegion = r; updateUI(); }
export function setCategory(cat) {
    state.selectedCategory = cat;
    const dropdown = document.getElementById('categoryDropdown');
    if (dropdown && dropdown.value !== cat) dropdown.value = cat;
    if (state.sidebarOpenMobile) toggleSidebar();
    updateUI();
}

export function setViewFilter(view) {
    state.currentView = view;
    ['all', 'recommended', 'trending', 'bookmarks', 'unread', 'analytics'].forEach((v) => {
        const btn = document.getElementById(`nav-${v}`);
        if (btn) {
            btn.className = v === view
                ? 'w-full flex items-center justify-between px-2.5 py-2 rounded-lg text-xs font-extrabold bg-brand-500 text-white shadow-xs transition-all'
                : 'w-full flex items-center justify-between px-2.5 py-2 rounded-lg text-xs font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-200/60 dark:hover:bg-slate-800 transition-all';
        }
    });
    if (state.sidebarOpenMobile) toggleSidebar();
    updateUI();
}

export function setDateFilter(d) {
    state.dateFilter = d;
    ['all', '24h', '7d'].forEach((k) => {
        const btn = document.getElementById(`date-${k}`);
        if (btn) {
            btn.className = k === d
                ? 'px-2 py-1 rounded transition-all bg-white dark:bg-slate-700 shadow-xs text-slate-900 dark:text-white font-bold text-[11px]'
                : 'px-2 py-1 rounded transition-all text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white text-[11px]';
        }
    });
    updateUI();
}

export function handleSearch() {
    const input = document.getElementById('searchInput');
    state.searchQuery = input.value.trim();
    document.getElementById('clearSearchBtn').classList.toggle('hidden', !state.searchQuery);
    updateUI();
}

export function clearSearch() {
    document.getElementById('searchInput').value = '';
    state.searchQuery = '';
    document.getElementById('clearSearchBtn').classList.add('hidden');
    updateUI();
}

export function resetFilters() {
    state.selectedCategory = 'すべて';
    state.dateFilter = 'all';
    clearSearch();
    setViewFilter('all');
}

export function toggleBookmark(id, event) {
    if (event) event.stopPropagation();
    if (state.bookmarks.has(id)) state.bookmarks.delete(id);
    else state.bookmarks.add(id);
    updateUI();
    if (state.activeArticleId === id) updateDetailBookmarkIcon();
}

export function openGlossaryModal(term, event) {
    if (event) event.stopPropagation();
    const dictKey = Object.keys(IT_DICTIONARY).find((k) => k.toLowerCase() === term.toLowerCase());
    const info = IT_DICTIONARY[dictKey] || {
        category: 'IT Term',
        summary: `${term} に関するナレッジ情報`,
        detail: 'この用語の詳細はローカルデータベースに登録可能です。'
    };
    document.getElementById('glossaryTerm').innerText = term;
    document.getElementById('glossaryCategory').innerText = info.category;
    document.getElementById('glossarySummary').innerText = info.summary;
    document.getElementById('glossaryDetail').innerText = info.detail;
    document.getElementById('glossaryModal').classList.remove('opacity-0', 'pointer-events-none');
    if (window.lucide) lucide.createIcons();
}

export function closeGlossaryModal() {
    document.getElementById('glossaryModal').classList.add('opacity-0', 'pointer-events-none');
}

export function openDetailPanel(id) {
    const art = articles.find((a) => a.id === id);
    if (!art) return;
    state.activeArticleId = id;
    state.readArticles.add(id);
    if (art.category) state.categoryVisits[art.category] = (state.categoryVisits[art.category] || 0) + 1;

    document.getElementById('detailTitle').innerText = art.title;
    document.getElementById('detailSource').innerText = art.source;
    document.getElementById('detailDate').innerText = new Date(art.date).toLocaleString('ja-JP');
    document.getElementById('detailDescription').innerHTML = injectInlineGlossary(art.description, true);
    document.getElementById('detailCategoryBadge').innerText = art.category;
    document.getElementById('detailRegionBadge').innerText = art.region.toUpperCase();
    document.getElementById('detailExternalUrl').href = art.url;

    document.getElementById('myMemoArea').value = state.memos[id] || '';
    document.getElementById('memoSavedBadge').classList.add('opacity-0');
    document.getElementById('aiResultBox').classList.add('hidden');
    state.aiTranslated = false;
    document.getElementById('transLangLabel').innerText = art.region === 'jp' ? '英語翻訳' : '日本語翻訳';
    updateDetailBookmarkIcon();

    document.getElementById('detailBackdrop').classList.remove('opacity-0', 'pointer-events-none');
    document.getElementById('detailPanel').classList.remove('translate-x-full');
    updateUI();
}

export function closeDetailPanel() {
    document.getElementById('detailBackdrop').classList.add('opacity-0', 'pointer-events-none');
    document.getElementById('detailPanel').classList.add('translate-x-full');
    state.activeArticleId = null;
}

function updateDetailBookmarkIcon() {
    const btn = document.getElementById('detailBookmarkBtn');
    if (!btn) return;
    const isBookmarked = state.bookmarks.has(state.activeArticleId);
    btn.innerHTML = `<i data-lucide="star" class="w-4 h-4 ${isBookmarked ? 'text-amber-400 fill-amber-400' : ''}"></i>`;
    if (window.lucide) lucide.createIcons();
}

export function toggleBookmarkFromDetail() {
    if (state.activeArticleId) toggleBookmark(state.activeArticleId);
}

export function generateAiSummary() {
    const art = articles.find((a) => a.id === state.activeArticleId);
    if (!art) return;

    const btn = document.getElementById('aiSummaryBtn');
    const label = document.getElementById('aiSummaryLabel');
    const icon = document.getElementById('aiSummaryIcon');
    const box = document.getElementById('aiResultBox');
    const pointsList = document.getElementById('aiSummaryPoints');
    const timeBadge = document.getElementById('aiInferenceTime');

    const startTime = performance.now();
    btn.disabled = true;
    label.innerText = 'ローカルAI推論中...';
    if (icon) {
        icon.setAttribute('data-lucide', 'loader-2');
        icon.classList.add('animate-spin');
        if (window.lucide) lucide.createIcons();
    }

    setTimeout(() => {
        const elapsed = ((performance.now() - startTime) / 1000).toFixed(2);
        if (timeBadge) timeBadge.innerText = `推論完了 (${elapsed}s)`;

        pointsList.innerHTML = `
            <li><strong>要点1:</strong> ${art.category} 分野における最新の機能更新とアーキテクチャの改善。</li>
            <li><strong>要点2:</strong> ローカル環境での高速処理および効率的なリソース最適化。</li>
            <li><strong>要点3:</strong> 次期開発プロセスやインフラ設計への導入推奨。</li>
        `;
        box.classList.remove('hidden');
        btn.disabled = false;
        label.innerText = 'AI要約を再生成';

        const currentIcon = document.getElementById('aiSummaryIcon');
        if (currentIcon) {
            currentIcon.setAttribute('data-lucide', 'wand-2');
            currentIcon.classList.remove('animate-spin');
            if (window.lucide) lucide.createIcons();
        }
    }, 650);
}

export function toggleAiTranslation() {
    const art = articles.find((a) => a.id === state.activeArticleId);
    if (!art) return;

    const btn = document.getElementById('aiTranslateBtn');
    const desc = document.getElementById('detailDescription');
    const label = document.getElementById('transLangLabel');

    if (!state.aiTranslated) {
        btn.disabled = true;
        label.innerText = '翻訳中...';
        setTimeout(() => {
            state.aiTranslated = true;
            btn.disabled = false;
            label.innerText = '原文に戻す';
            const transText = art.region === 'jp'
                ? `[AI Translation / EN]: ${art.description}`
                : `[AIローカル翻訳 / JP]: ${art.description}`;
            desc.innerHTML = injectInlineGlossary(transText, true);
        }, 450);
    } else {
        state.aiTranslated = false;
        label.innerText = art.region === 'jp' ? '英語翻訳' : '日本語翻訳';
        desc.innerHTML = injectInlineGlossary(art.description, true);
    }
}

export function handleMemoInput() {
    if (!state.activeArticleId) return;
    state.memos[state.activeArticleId] = document.getElementById('myMemoArea').value;
    const badge = document.getElementById('memoSavedBadge');
    badge.classList.remove('opacity-0');
    clearTimeout(memoSaveTimeout);
    memoSaveTimeout = setTimeout(() => badge.classList.add('opacity-0'), 1200);
    saveLocalState();
}

export function handleContextMenu(e, id) {
    e.preventDefault();
    state.contextTargetArticleId = id;
    const menu = document.getElementById('contextMenu');
    menu.style.left = `${Math.min(e.clientX, window.innerWidth - 200)}px`;
    menu.style.top = `${Math.min(e.clientY, window.innerHeight - 160)}px`;
    menu.classList.remove('hidden');
}

export function hideContextMenu() {
    document.getElementById('contextMenu')?.classList.add('hidden');
}

export function contextAction(action) {
    const id = state.contextTargetArticleId;
    const art = articles.find((a) => a.id === id);
    if (!id || !art) return;

    if (action === 'detail') openDetailPanel(id);
    else if (action === 'bookmark') toggleBookmark(id);
    else if (action === 'openExternal') window.open(art.url, '_blank', 'noopener,noreferrer');
    else if (action === 'copyLink') {
        navigator.clipboard?.writeText(art.url);
        showToast('URLをクリップボードにコピーしました');
    }
    hideContextMenu();
}

export function openAuthModal() {
    const apiKeyInput = document.getElementById('gnewsApiKeyInput');
    if (apiKeyInput) apiKeyInput.value = getGNewsApiKey();
    const userIdInput = document.getElementById('authUserId');
    if (userIdInput && state.user.isLoggedIn) userIdInput.value = state.user.userId;

    document.getElementById('logoutSection').classList.toggle('hidden', !state.user.isLoggedIn);
    document.getElementById('authModal').classList.remove('opacity-0', 'pointer-events-none');
}

export function closeAuthModal() {
    document.getElementById('authModal').classList.add('opacity-0', 'pointer-events-none');
}

export function handleAuthSubmit(e) {
    e.preventDefault();
    const id = document.getElementById('authUserId').value.trim();
    const apiKey = document.getElementById('gnewsApiKeyInput').value;

    setGNewsApiKey(apiKey);
    if (id) {
        state.user.isLoggedIn = true;
        state.user.userId = id;
    }
    updateUI();
    closeAuthModal();
    showToast('GNews APIキーと設定を保存しました');
}

export function handleLogout() {
    state.user.isLoggedIn = false;
    state.user.userId = 'ゲストユーザー';
    updateUI();
    closeAuthModal();
    showToast('ログアウトしました');
}

export function toggleDarkMode() {
    document.documentElement.classList.toggle('dark');
}

window.appHandlers = {
    toggleSidebar,
    setRegion,
    setCategory,
    setViewFilter,
    setDateFilter,
    handleSearch,
    clearSearch,
    resetFilters,
    refreshArticlesFromAPI: () => refreshArticlesFromAPI(true),
    toggleBookmark,
    toggleBookmarkFromDetail,
    openGlossaryModal,
    closeGlossaryModal,
    openDetailPanel,
    closeDetailPanel,
    generateAiSummary,
    toggleAiTranslation,
    handleMemoInput,
    handleContextMenu,
    hideContextMenu,
    contextAction,
    openAuthModal,
    closeAuthModal,
    handleAuthSubmit,
    handleLogout,
    toggleDarkMode
};

window.addEventListener('click', hideContextMenu);
window.addEventListener('keydown', (e) => {
    const activeTag = document.activeElement?.tagName.toLowerCase();
    const isTyping = activeTag === 'input' || activeTag === 'textarea' || activeTag === 'select';
    if (e.key === 'Escape') {
        closeDetailPanel();
        closeGlossaryModal();
        closeAuthModal();
        hideContextMenu();
        if (state.sidebarOpenMobile) toggleSidebar();
    }
    if ((!isTyping && e.key === '/') || ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k')) {
        e.preventDefault();
        document.getElementById('searchInput')?.focus();
    }
    if (e.altKey && e.key.toLowerCase() === 'r') {
        e.preventDefault();
        refreshArticlesFromAPI(true);
    }
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'b') {
        e.preventDefault();
        toggleSidebar();
    }
});

window.addEventListener('DOMContentLoaded', () => {
    loadLocalState();
    setViewFilter('all');
    initChart();
    if (getGNewsApiKey()) {
        refreshArticlesFromAPI(false);
    }
});