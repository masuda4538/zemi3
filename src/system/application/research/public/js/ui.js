// --- UI RENDERING, FILTERS & DETAIL PANEL ---
function renderCategoryNav() {
    const dropdown = document.getElementById('categoryDropdown');
    if (!dropdown) return;
    const regionArticles = SAMPLE_ARTICLES.filter(a => resolveArticleRegion(a) === state.currentRegion);
    dropdown.innerHTML = CATEGORIES.map(cat => {
        const count = cat === 'すべて' ? regionArticles.length : regionArticles.filter(a => a.category === cat).length;
        const isSelected = state.selectedCategory === cat ? 'selected' : '';
        return `<option value="${cat}" ${isSelected}>${cat} (${count})</option>`;
    }).join('');
}

function renderFrequentCategories() {
    const container = document.getElementById('frequentCategoriesContainer');
    if (!container) return;
    const sortedCategories = Object.keys(state.categoryVisits)
        .filter(cat => state.categoryVisits[cat] > 0)
        .sort((a, b) => state.categoryVisits[b] - state.categoryVisits[a])
        .slice(0, 5);

    if (sortedCategories.length === 0) {
        container.innerHTML = '<p class="text-[11px] text-slate-400 px-2 py-1">閲覧履歴がありません</p>';
        return;
    }

    container.innerHTML = sortedCategories.map(cat => {
        const visits = state.categoryVisits[cat];
        const isActive = state.selectedCategory === cat;
        return `
            <button onclick="setCategory('${cat}')" class="w-full px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center justify-between ${isActive ? 'bg-amber-500 text-white shadow-xs' : 'bg-amber-50/60 dark:bg-amber-950/30 text-amber-900 dark:text-amber-200 hover:bg-amber-100 dark:hover:bg-amber-900/50'}">
                <span>${cat}</span>
                <span class="text-[9px] bg-amber-200/80 dark:bg-amber-800/80 text-amber-950 dark:text-amber-100 px-1.5 py-0.5 rounded font-black">${visits}回</span>
            </button>
        `;
    }).join('');
}

function updateUI() {
    const regionArticles = SAMPLE_ARTICLES.filter(a => resolveArticleRegion(a) === state.currentRegion);

    const badgeAllCount = document.getElementById('badge-all-count');
    if (badgeAllCount) badgeAllCount.innerText = regionArticles.length;

    const recommendedCount = regionArticles.filter(a => {
        const topCat = Object.keys(state.categoryVisits).sort((x, y) => state.categoryVisits[y] - state.categoryVisits[x])[0];
        return a.category === topCat || a.isTrending;
    }).length;
    const badgeRecommendedCount = document.getElementById('badge-recommended-count');
    if (badgeRecommendedCount) badgeRecommendedCount.innerText = recommendedCount;

    const bookmarkCount = regionArticles.filter(a => state.bookmarks.has(a.id)).length;
    const badgeBookmarkCount = document.getElementById('badge-bookmark-count');
    if (badgeBookmarkCount) badgeBookmarkCount.innerText = bookmarkCount;

    const unreadCount = regionArticles.filter(a => !state.readArticles.has(a.id)).length;
    const badgeUnreadCount = document.getElementById('badge-unread-count');
    if (badgeUnreadCount) badgeUnreadCount.innerText = unreadCount;

    const isJp = state.currentRegion === 'jp';
    const regionJpBtn = document.getElementById('regionJpBtn');
    if (regionJpBtn) regionJpBtn.className = `px-2 py-1 rounded flex items-center space-x-1 transition-all ${isJp ? 'bg-white dark:bg-slate-700 shadow-xs text-slate-900 dark:text-white font-bold' : 'text-slate-600 dark:text-slate-400'}`;
    const regionGlobalBtn = document.getElementById('regionGlobalBtn');
    if (regionGlobalBtn) regionGlobalBtn.className = `px-2 py-1 rounded flex items-center space-x-1 transition-all ${!isJp ? 'bg-white dark:bg-slate-700 shadow-xs text-slate-900 dark:text-white font-bold' : 'text-slate-600 dark:text-slate-400'}`;

    const titles = {
        'all': 'すべての記事',
        'recommended': '🔥 おススメ記事',
        'trending': '📈 急上昇トレンド',
        'bookmarks': 'ブックマーク一覧',
        'unread': '未読記事一覧',
        'analytics': 'ITトレンド分析'
    };
    const viewTitleEl = document.getElementById('viewTitle');
    if (viewTitleEl) viewTitleEl.innerHTML = `<span>${titles[state.currentView] || '記事一覧'}</span>`;

    const hasActiveFilters = state.selectedCategory !== 'すべて' || state.dateFilter !== 'all' || state.searchQuery !== '' || (state.currentView !== 'all' && state.currentView !== 'analytics');
    const headerResetBtn = document.getElementById('headerResetFiltersBtn');
    if (headerResetBtn) {
        headerResetBtn.disabled = !hasActiveFilters;
        headerResetBtn.className = hasActiveFilters
            ? 'px-2.5 py-1.5 rounded-xl text-xs font-bold bg-rose-50 dark:bg-rose-950/50 hover:bg-rose-100 dark:hover:bg-rose-900/60 text-rose-600 dark:text-rose-300 border border-rose-300/80 dark:border-rose-800/80 shadow-xs transition-all shrink-0 flex items-center gap-1.5 active:scale-95 cursor-pointer'
            : 'px-2.5 py-1.5 rounded-xl text-xs font-bold bg-slate-200/50 dark:bg-slate-800/50 text-slate-400 dark:text-slate-500 border border-slate-300/40 dark:border-slate-700/40 transition-all shrink-0 flex items-center gap-1.5 opacity-60 cursor-default';
    }

    const feedView = document.getElementById('feedView');
    const heroContainer = document.getElementById('heroFeaturedContainer');
    const analyticsView = document.getElementById('analyticsView');
    const emptyState = document.getElementById('emptyState');
    const resultCountBadge = document.getElementById('resultCountBadge');

    if (state.currentView === 'analytics') {
        if (feedView) feedView.classList.add('hidden');
        if (heroContainer) heroContainer.classList.add('hidden');
        if (analyticsView) analyticsView.classList.remove('hidden');
        if (emptyState) emptyState.classList.add('hidden');
        if (resultCountBadge) resultCountBadge.innerText = 'チャート表示';
    } else {
        if (analyticsView) analyticsView.classList.add('hidden');
        const articles = getFilteredArticles();
        if (resultCountBadge) resultCountBadge.innerText = `${articles.length} 件`;

        if (articles.length === 0) {
            if (feedView) feedView.classList.add('hidden');
            if (heroContainer) heroContainer.classList.add('hidden');
            if (emptyState) emptyState.classList.remove('hidden');
        } else {
            if (emptyState) emptyState.classList.add('hidden');
            if (feedView) feedView.classList.remove('hidden');
            renderFeedContent(articles);
        }
    }

    renderCategoryNav();
    renderFrequentCategories();
    saveLocalState();
    if (window.lucide) lucide.createIcons();
}

function renderFeedContent(articles) {
    const heroContainer = document.getElementById('heroFeaturedContainer');
    const topArticle = [...articles].sort((a, b) => b.viewsCount - a.viewsCount)[0];

    if (topArticle && !state.searchQuery && ['all', 'recommended', 'trending'].includes(state.currentView)) {
        renderHeroArticle(topArticle, heroContainer);
        heroContainer.classList.remove('hidden');
        renderArticleCards(articles.filter(a => a.id !== topArticle.id));
    } else {
        heroContainer.classList.add('hidden');
        renderArticleCards(articles);
    }
}

function renderHeroArticle(art, container) {
    const isBookmarked = state.bookmarks.has(art.id);
    const hasMemo = !!state.memos[art.id];
    const formattedDate = new Date(art.date).toLocaleDateString('ja-JP', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
    const fallbackImg = getSVGPlaceholder(art.category);
    const displayImg = art.image || getCategoryImage(art.category);
    // Keep cards clean: glossary links enabled in Hero and Detail view, disabled in small grid snippets
    const glossaryDescription = injectInlineGlossary(art.description, true);

    container.innerHTML = `
        <div oncontextmenu="handleContextMenu(event, '${art.id}')" class="relative bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white rounded-2xl overflow-hidden shadow-xl border border-indigo-500/30 group card-hover-effect">
            <div class="absolute -right-20 -bottom-20 w-80 h-80 bg-brand-500/10 rounded-full blur-3xl pointer-events-none"></div>
            <div class="flex flex-col md:flex-row items-stretch min-h-[210px]">
                <div onclick="openDetailPanel('${art.id}')" class="w-full md:w-5/12 relative cursor-pointer overflow-hidden min-h-[170px]">
                    <img src="${displayImg}" onerror="this.onerror=null; this.src='${fallbackImg}';" alt="${art.title}" class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 ease-out">
                    <div class="absolute inset-0 bg-gradient-to-t md:bg-gradient-to-r from-slate-950/90 via-slate-950/40 to-transparent"></div>
                    <div class="absolute top-3 left-3 flex items-center space-x-2 z-10">
                        <span class="px-2.5 py-1 bg-gradient-to-r from-amber-500 to-rose-500 text-white font-black text-[10px] rounded-lg shadow-md flex items-center gap-1 uppercase tracking-wider">
                            <i data-lucide="flame" class="w-3.5 h-3.5 fill-white"></i> トレンド
                        </span>
                        <span class="px-2 py-0.5 bg-slate-900/80 backdrop-blur-md text-brand-300 font-extrabold text-[10px] rounded border border-brand-500/30">${art.category}</span>
                    </div>
                    <div class="absolute bottom-3 left-3 text-slate-300 text-[10px] font-mono flex items-center space-x-2">
                        <span><i data-lucide="eye" class="w-3 h-3 inline mr-1 text-brand-400"></i>${art.viewsCount.toLocaleString()} views</span>
                        <span>•</span><span>${formattedDate}</span>
                    </div>
                </div>
                <div class="w-full md:w-7/12 p-4 sm:p-5 flex flex-col justify-between space-y-3 relative z-10">
                    <div>
                        <div class="flex items-center justify-between text-xs text-slate-400 mb-2">
                            <span class="font-bold text-brand-400 flex items-center space-x-1"><i data-lucide="check-circle-2" class="w-3.5 h-3.5"></i><span>${art.source}</span></span>
                            ${hasMemo ? '<span class="text-[10px] bg-amber-500/20 text-amber-300 px-2 py-0.5 rounded font-bold border border-amber-500/30">📝 メモ保存済み</span>' : ''}
                        </div>
                        <h2 onclick="openDetailPanel('${art.id}')" class="text-base sm:text-lg font-black text-white hover:text-brand-300 cursor-pointer transition-colors leading-snug line-clamp-2">${art.title}</h2>
                        <div class="mt-2 text-xs text-slate-300 leading-relaxed line-clamp-2 font-normal user-select-text">${glossaryDescription}</div>
                    </div>
                    <div class="pt-3 border-t border-slate-800 flex items-center justify-between text-xs">
                        <span class="text-[10px] text-slate-400 flex items-center gap-1 font-mono"><i data-lucide="sparkles" class="w-3 h-3 text-indigo-400"></i> AI要約利用可能</span>
                        <div class="flex items-center space-x-2">
                            <button onclick="toggleBookmark('${art.id}', event)" aria-label="ブックマーク切替" class="p-2 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-amber-400 transition-colors border border-slate-700">
                                <i data-lucide="star" class="w-4 h-4 ${isBookmarked ? 'text-amber-400 fill-amber-400' : ''}"></i>
                            </button>
                            <button onclick="openDetailPanel('${art.id}')" class="px-3.5 py-2 bg-gradient-to-r from-brand-600 to-indigo-600 text-white rounded-lg text-xs font-bold transition-all shadow-md flex items-center space-x-1">
                                <span>詳細・AI分析</span><i data-lucide="arrow-right" class="w-3.5 h-3.5"></i>
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `;
}

function renderArticleCards(articles) {
    const container = document.getElementById('feedView');
    container.innerHTML = articles.map(art => {
        const isBookmarked = state.bookmarks.has(art.id);
        const isRead = state.readArticles.has(art.id);
        const hasMemo = !!state.memos[art.id];
        const formattedDate = new Date(art.date).toLocaleDateString('ja-JP', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
        const fallbackImg = getSVGPlaceholder(art.category);
        const displayImg = art.image || getCategoryImage(art.category);
        const plainSnippet = String(art.description || '').replace(/<[^>]*>/g, '').trim();

        return `
            <div oncontextmenu="handleContextMenu(event, '${art.id}')" class="card-hover-effect w-full h-[310px] bg-white dark:bg-slate-900 rounded-xl border border-slate-200/80 dark:border-slate-800/80 overflow-hidden shadow-xs flex flex-col justify-between group relative ${isRead ? 'opacity-75' : ''}">
                <div onclick="openDetailPanel('${art.id}')" class="w-full h-36 shrink-0 overflow-hidden bg-slate-100 dark:bg-slate-800 cursor-pointer relative">
                    <img src="${displayImg}" onerror="this.onerror=null; this.src='${fallbackImg}';" loading="lazy" alt="${art.title}" class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300 ease-out">
                    <div class="absolute inset-0 bg-gradient-to-t from-slate-950/70 via-slate-950/10 to-transparent opacity-80 group-hover:opacity-60 transition-opacity"></div>
                    <div class="absolute top-2.5 left-2.5 flex items-center space-x-1 z-10 flex-wrap gap-y-1">
                        <span class="text-[9px] font-extrabold px-2 py-0.5 bg-slate-900/85 backdrop-blur-md text-white rounded shadow-xs border border-white/10">${art.category}</span>
                        ${art.isTrending ? '<span class="text-[9px] font-extrabold px-2 py-0.5 bg-rose-600/90 text-white rounded flex items-center shadow-xs"><i data-lucide="flame" class="w-2.5 h-2.5 mr-0.5"></i> HOT</span>' : ''}
                        ${!isRead ? '<span class="w-2 h-2 rounded-full bg-emerald-500 ring-2 ring-white/20" title="未読"></span>' : ''}
                    </div>
                </div>
                <div class="p-3.5 flex-1 flex flex-col justify-between min-h-0 overflow-hidden">
                    <div class="min-w-0">
                        <div class="h-5 flex items-center justify-between mb-1.5 shrink-0">
                            <div class="flex items-center space-x-1">
                                ${hasMemo ? '<span class="text-[9px] bg-amber-100 dark:bg-amber-900/40 text-amber-800 dark:text-amber-300 px-1.5 py-0.5 rounded font-bold">📝 メモ</span>' : ''}
                            </div>
                            <span class="text-[10px] text-slate-400 font-mono">${formattedDate}</span>
                        </div>
                        <h3 onclick="openDetailPanel('${art.id}')" class="h-9 font-bold text-slate-900 dark:text-white text-xs hover:text-brand-600 dark:hover:text-brand-400 cursor-pointer line-clamp-2 overflow-hidden break-words transition-colors leading-[1.35] mb-1.5">${art.title}</h3>
                        <p onclick="openDetailPanel('${art.id}')" class="h-9 text-[11px] text-slate-600 dark:text-slate-400 leading-[1.45] line-clamp-2 overflow-hidden break-words font-normal cursor-pointer">${plainSnippet}</p>
                    </div>
                    <div class="h-8 pt-2 shrink-0 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-xs text-slate-500">
                        <span class="font-bold text-slate-600 dark:text-slate-400 truncate max-w-[110px] text-[10px]">${art.source}</span>
                        <div class="flex items-center space-x-1 shrink-0">
                            <button onclick="toggleBookmark('${art.id}', event)" aria-label="ブックマーク切替" class="p-1.5 rounded hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-amber-400 transition-colors">
                                <i data-lucide="star" class="w-3.5 h-3.5 ${isBookmarked ? 'text-amber-400 fill-amber-400' : ''}"></i>
                            </button>
                            <button onclick="openDetailPanel('${art.id}')" class="px-2.5 py-1 bg-slate-100 dark:bg-slate-800 hover:bg-brand-500 hover:text-white dark:hover:bg-brand-600 text-slate-700 dark:text-slate-200 rounded text-[11px] font-bold transition-all flex items-center space-x-0.5">
                                <span>詳細</span><i data-lucide="chevron-right" class="w-3 h-3"></i>
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }).join('');
}

function handleContextMenu(e, id) {
    e.preventDefault();
    state.contextTargetArticleId = id;
    const menu = document.getElementById('contextMenu');
    const x = Math.min(e.clientX, window.innerWidth - 200);
    const y = Math.min(e.clientY, window.innerHeight - 160);
    menu.style.left = `${x}px`;
    menu.style.top = `${y}px`;
    menu.classList.remove('hidden');
}

function hideContextMenu() {
    const menu = document.getElementById('contextMenu');
    if (menu) menu.classList.add('hidden');
}

function contextAction(action) {
    const id = state.contextTargetArticleId;
    if (!id) return;
    const art = SAMPLE_ARTICLES.find(a => a.id === id);
    if (action === 'detail') openDetailPanel(id);
    else if (action === 'bookmark') toggleBookmark(id);
    else if (action === 'openExternal' && art) window.open(art.url, '_blank');
    else if (action === 'copyLink' && art) {
        const tempInput = document.createElement('input');
        tempInput.value = art.url;
        document.body.appendChild(tempInput);
        tempInput.select();
        document.execCommand('copy');
        document.body.removeChild(tempInput);
        showToast('URLをクリップボードにコピーしました');
    }
    hideContextMenu();
}

function setRegion(r) { state.currentRegion = r; updateUI(); }

function setCategory(cat) {
    state.selectedCategory = cat;
    const dropdown = document.getElementById('categoryDropdown');
    if (dropdown && dropdown.value !== cat) dropdown.value = cat;
    if (state.sidebarOpenMobile) toggleSidebar();
    updateUI();
}

function setViewFilter(view) {
    state.currentView = view;
    ['all', 'recommended', 'trending', 'bookmarks', 'unread', 'analytics'].forEach(v => {
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

function setDateFilter(d) {
    state.dateFilter = d;
    ['all', '24h', '7d'].forEach(k => {
        const btn = document.getElementById(`date-${k}`);
        if (btn) {
            btn.className = k === d
                ? 'px-2 py-1 rounded transition-all bg-white dark:bg-slate-700 shadow-xs text-slate-900 dark:text-white font-bold text-[11px]'
                : 'px-2 py-1 rounded transition-all text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white text-[11px]';
        }
    });
    updateUI();
}

function handleSearch() {
    const input = document.getElementById('searchInput');
    state.searchQuery = input.value.trim();
    document.getElementById('clearSearchBtn').classList.toggle('hidden', !state.searchQuery);
    updateUI();
}

function clearSearch() {
    document.getElementById('searchInput').value = '';
    state.searchQuery = '';
    document.getElementById('clearSearchBtn').classList.add('hidden');
    updateUI();
}

function resetFilters(notify = false) {
    state.selectedCategory = 'すべて';
    const dropdown = document.getElementById('categoryDropdown');
    if (dropdown) dropdown.value = 'すべて';

    state.dateFilter = 'all';
    ['all', '24h', '7d'].forEach(k => {
        const btn = document.getElementById(`date-${k}`);
        if (btn) {
            btn.className = k === 'all'
                ? 'px-2 py-1 rounded transition-all bg-white dark:bg-slate-700 shadow-xs text-slate-900 dark:text-white font-bold text-[11px]'
                : 'px-2 py-1 rounded transition-all text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white text-[11px]';
        }
    });

    document.getElementById('searchInput').value = '';
    state.searchQuery = '';
    document.getElementById('clearSearchBtn').classList.add('hidden');

    setViewFilter('all');
    if (notify) showToast('絞り込みをリセットしました');
}

function toggleBookmark(id, event) {
    if (event) event.stopPropagation();
    if (state.bookmarks.has(id)) state.bookmarks.delete(id);
    else state.bookmarks.add(id);
    updateUI();
    if (state.activeArticleId === id) updateDetailBookmarkIcon();
}

function openDetailPanel(id) {
    const art = SAMPLE_ARTICLES.find(a => a.id === id);
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

    const memoArea = document.getElementById('myMemoArea');
    if (memoArea) memoArea.value = state.memos[id] || '';
    document.getElementById('memoSavedBadge').classList.add('opacity-0');
    document.getElementById('aiResultBox').classList.add('hidden');

    state.aiSummaryActive = false;
    state.aiTranslated = false;
    document.getElementById('transLangLabel').innerText = art.region === 'jp' ? '英語翻訳' : '日本語翻訳';
    updateDetailBookmarkIcon();

    const backdrop = document.getElementById('detailBackdrop');
    const panel = document.getElementById('detailPanel');
    backdrop.classList.remove('opacity-0', 'pointer-events-none');
    panel.classList.remove('scale-95', 'opacity-0');
    panel.classList.add('scale-100', 'opacity-100');
    updateUI();
}

function closeDetailPanel() {
    const backdrop = document.getElementById('detailBackdrop');
    const panel = document.getElementById('detailPanel');
    backdrop.classList.add('opacity-0', 'pointer-events-none');
    panel.classList.remove('scale-100', 'opacity-100');
    panel.classList.add('scale-95', 'opacity-0');
    state.activeArticleId = null;
}

function updateDetailBookmarkIcon() {
    const btn = document.getElementById('detailBookmarkBtn');
    if (!btn) return;
    const isBookmarked = state.bookmarks.has(state.activeArticleId);
    btn.innerHTML = `<i data-lucide="star" class="w-4 h-4 ${isBookmarked ? 'text-amber-400 fill-amber-400' : ''}"></i>`;
    if (window.lucide) lucide.createIcons();
}

function toggleBookmarkFromDetail() {
    if (state.activeArticleId) toggleBookmark(state.activeArticleId);
}

function handleMemoInput() {
    if (!state.activeArticleId) return;
    const val = document.getElementById('myMemoArea').value;
    state.memos[state.activeArticleId] = val;
    const badge = document.getElementById('memoSavedBadge');
    badge.classList.remove('opacity-0');
    clearTimeout(memoSaveTimeout);
    memoSaveTimeout = setTimeout(() => { badge.classList.add('opacity-0'); }, 1200);
    saveLocalState();
}
