// ===================================================================
// 多言語構文辞書ビュー & サイドピックアップカード
// ===================================================================

function switchCardLanguage(itemId, lang, event) {
    if (event) event.stopPropagation();
    const cardEl = document.getElementById(`dictCard-${itemId}`);
    if (!cardEl) return;

    const item = dictionaryData.find(d => d.id === itemId);
    if (!item || !item.langs[lang]) return;

    const langData = item.langs[lang];

    cardEl.querySelectorAll('.card-lang-tab').forEach(tab => {
        const isCurrent = tab.getAttribute('data-lang') === lang;
        tab.className = isCurrent
            ? 'card-lang-tab px-2 py-0.5 rounded text-[10px] font-bold bg-indigo-600 text-white'
            : 'card-lang-tab px-2 py-0.5 rounded text-[10px] font-bold text-slate-400 hover:text-white';
    });

    cardEl.querySelector('.card-syntax-code').innerText = langData.example;
    cardEl.querySelector('.card-syntax-type').innerText = langData.syntax.split('\n')[0];
    cardEl.querySelector('.card-syntax-note').innerText = `💡 [${lang.toUpperCase()}] ${langData.note}`;
    cardEl.querySelector('.card-func-title').innerText = langData.name;
}

function tryDictSnippetInEditor(id, event) {
    if (event) event.stopPropagation();
    const item = dictionaryData.find(d => d.id === id);
    if (!item) return;

    const langData = item.langs[currentSelectedLang] || item.langs.python;
    goBackFromDict();

    setTimeout(() => {
        const ed = document.getElementById('codeEditor');
        if (ed) {
            ed.value += `\n# --- [${langData.name}] のサンプル ---\n${langData.snippet}\n`;
            ed.scrollTop = ed.scrollHeight;
            updateLineNumbers();
            scheduleSyntaxCheck();
        }
    }, 50);
}

function jumpToTaskFromDict(taskId, event) {
    if (event) event.stopPropagation();
    navigationHistoryStack.push({
        view: 'dict-view',
        taskId: lastWorkedTaskId,
        savedCode: document.getElementById('codeEditor').value,
        projectKey: currentProjectKey,
        fileKey: currentFileKey
    });
    selectTask(taskId, true);
}

function setDictCategory(cat) {
    selectedDictCategory = cat;
    document.querySelectorAll('.dictcat-btn').forEach(btn => {
        btn.className = 'dictcat-btn w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-200/50 dark:hover:bg-slate-800';
    });
    const activeBtn = document.getElementById(`dictcat-${cat}`);
    if (activeBtn) activeBtn.className = 'dictcat-btn w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs font-bold bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400';
    renderDictCards();
}

function toggleDictFavoritesOnly() {
    showFavoritesOnly = !showFavoritesOnly;
    const btn = document.getElementById('dictFavFilterBtn');
    btn.className = showFavoritesOnly
        ? 'px-2.5 py-1.5 bg-amber-500 text-white rounded-lg text-xs font-bold border border-amber-600 flex items-center gap-1 shadow-xs'
        : 'px-2.5 py-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-amber-50 dark:hover:bg-amber-950/40 text-slate-700 dark:text-slate-300 rounded-lg text-xs font-bold border border-slate-200 dark:border-slate-700 flex items-center gap-1';
    renderDictCards();
}

function handleDictSearch() {
    renderDictCards();
}

function toggleFavoriteItem(id, event) {
    if (event) event.stopPropagation();
    const item = dictionaryData.find(d => d.id === id);
    if (item) {
        item.isFavorite = !item.isFavorite;
        renderDictCards();
        renderSideDictCards();
    }
}

function openDictHelpFromConsole(keyword) {
    switchView('dict-view');
    const searchInput = document.getElementById('dictSearchInput');
    if (searchInput) {
        searchInput.value = keyword;
        handleDictSearch();
    }
}

function renderDictCards() {
    const grid = document.getElementById('dictCardGrid');
    const notice = document.getElementById('dictEmptyNotice');
    if (!grid) return;
    grid.innerHTML = '';

    const query = (document.getElementById('dictSearchInput')?.value || '').trim().toLowerCase();

    const filtered = dictionaryData.filter(item => {
        const matchCat = (selectedDictCategory === 'all' || item.category === selectedDictCategory);
        const matchFav = !showFavoritesOnly || item.isFavorite;
        const matchQuery = !query ||
            item.langs.python.name.toLowerCase().includes(query) ||
            item.langs.javascript.name.toLowerCase().includes(query) ||
            item.langs.c.name.toLowerCase().includes(query) ||
            item.summary.toLowerCase().includes(query) ||
            item.desc.toLowerCase().includes(query);
        return matchCat && matchFav && matchQuery;
    });

    if (filtered.length === 0) {
        notice.classList.remove('hidden');
        return;
    }
    notice.classList.add('hidden');

    filtered.forEach(item => {
        const currentLangData = item.langs[currentSelectedLang] || item.langs.python;

        let relatedTasksHtml = '';
        if (item.relatedTaskIds && item.relatedTaskIds.length > 0) {
            const taskBadges = item.relatedTaskIds.map(tId => {
                const tObj = tasks.find(t => t.id === tId);
                if (!tObj) return '';
                return `
                    <button onclick="jumpToTaskFromDict(${tObj.id}, event)" class="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-blue-50 hover:bg-blue-100 dark:bg-blue-950/50 dark:hover:bg-blue-900/60 text-blue-600 dark:text-blue-300 border border-blue-200 dark:border-blue-800 transition-colors" title="「${escapeHtml(tObj.title)}」を解く">
                        <span>🎯 課題0${tObj.id}</span>
                        <i data-lucide="external-link" class="w-2.5 h-2.5"></i>
                    </button>
                `;
            }).join('');

            relatedTasksHtml = `
                <div class="pt-2 border-t border-slate-100 dark:border-slate-800/80 space-y-1">
                    <span class="text-[10px] font-bold text-slate-400 block">この構文を使う課題：</span>
                    <div class="flex flex-wrap gap-1">${taskBadges}</div>
                </div>
            `;
        }

        const card = document.createElement('div');
        card.id = `dictCard-${item.id}`;
        card.className = 'focus-ring card-hover-effect bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col justify-between space-y-3';
        card.innerHTML = `
            <div class="space-y-2">
                <div class="flex items-center justify-between">
                    <span class="text-[10px] font-bold px-2 py-0.5 rounded bg-indigo-100 text-indigo-800 dark:bg-indigo-950 dark:text-indigo-300">
                        ${item.category === 'io' ? '入出力' : (item.category === 'types' ? '型・データ' : '制御構文')}
                    </span>
                    <button onclick="toggleFavoriteItem('${item.id}', event)" class="p-1 text-slate-400 hover:text-amber-400 transition-colors">
                        <i data-lucide="star" class="w-4 h-4 ${item.isFavorite ? 'text-amber-400 fill-amber-400' : ''}"></i>
                    </button>
                </div>

                <div>
                    <div class="flex items-baseline gap-1.5">
                        <h3 class="font-extrabold text-sm text-slate-900 dark:text-white font-mono card-func-title">${escapeHtml(currentLangData.name)}</h3>
                        ${isKidMode ? `<span class="text-[10px] text-slate-400">(${escapeHtml(currentLangData.kana)})</span>` : ''}
                    </div>
                    <p class="text-xs font-bold text-indigo-600 dark:text-indigo-400 mt-0.5">【${escapeHtml(item.summary)}】</p>
                </div>
                <p class="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">${escapeHtml(item.desc)}</p>
            </div>

            <div class="space-y-1.5 pt-2 border-t border-slate-100 dark:border-slate-800">
                <div class="flex items-center justify-between">
                    <span class="text-[10px] font-bold text-slate-400">言語を切り替えて比較：</span>
                    <div class="flex bg-slate-950 p-0.5 rounded gap-0.5">
                        <button onclick="switchCardLanguage('${item.id}', 'python', event)" data-lang="python" class="card-lang-tab px-2 py-0.5 rounded text-[10px] font-bold ${currentSelectedLang === 'python' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'}">Python</button>
                        <button onclick="switchCardLanguage('${item.id}', 'javascript', event)" data-lang="javascript" class="card-lang-tab px-2 py-0.5 rounded text-[10px] font-bold ${currentSelectedLang === 'javascript' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'}">JS</button>
                        <button onclick="switchCardLanguage('${item.id}', 'c', event)" data-lang="c" class="card-lang-tab px-2 py-0.5 rounded text-[10px] font-bold ${currentSelectedLang === 'c' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'}">C</button>
                    </div>
                </div>

                <div class="p-2.5 rounded-lg bg-slate-900 text-slate-200 font-mono text-[11px] overflow-x-auto min-h-[3.6rem] flex items-center">
                    <code class="card-syntax-code leading-relaxed whitespace-pre">${escapeHtml(currentLangData.example)}</code>
                </div>

                <p class="text-[10px] text-amber-600 dark:text-amber-400/90 font-medium card-syntax-note">
                    💡 [${currentSelectedLang.toUpperCase()}] ${escapeHtml(currentLangData.note)}
                </p>
            </div>

            ${relatedTasksHtml}

            <div class="flex items-center justify-between pt-1 border-t border-slate-100 dark:border-slate-800">
                <span class="text-slate-400 text-[10px]">型: <code class="text-brand-500 font-mono card-syntax-type">${escapeHtml(currentLangData.syntax.split('\n')[0])}</code></span>
                <button onclick="tryDictSnippetInEditor('${item.id}', event)" class="px-2 py-1 bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-950/60 dark:hover:bg-indigo-900/60 text-indigo-600 dark:text-indigo-300 rounded text-[10px] font-bold border border-indigo-200 dark:border-indigo-800 flex items-center gap-1">
                    <i data-lucide="corner-down-left" class="w-3 h-3"></i>エディタで試す
                </button>
            </div>
        `;
        grid.appendChild(card);
    });
    if (window.lucide) lucide.createIcons();
}

function renderSideDictCards() {
    const container = document.getElementById('sideDictCardsContainer');
    if (!container) return;
    container.innerHTML = '';

    dictionaryData.slice(0, 3).forEach(item => {
        const currentLangData = item.langs[currentSelectedLang] || item.langs.python;

        let taskLinkHtml = '';
        if (item.relatedTaskIds && item.relatedTaskIds.length > 0) {
            const firstTaskId = item.relatedTaskIds[0];
            taskLinkHtml = `
                <button onclick="jumpToTaskFromDict(${firstTaskId}, event); toggleDetailPanel();" class="text-[9px] text-blue-600 dark:text-blue-400 font-bold hover:underline flex items-center gap-0.5">
                    <span>課題0${firstTaskId}で挑戦</span>
                    <i data-lucide="chevron-right" class="w-2.5 h-2.5"></i>
                </button>
            `;
        }

        const card = document.createElement('div');
        card.className = 'p-3 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 rounded-xl space-y-1.5';
        card.innerHTML = `
            <div class="flex items-center justify-between">
                <span class="font-bold text-xs text-brand-600 dark:text-brand-400 font-mono">${escapeHtml(currentLangData.name)}</span>
                ${taskLinkHtml}
            </div>
            <div class="p-1.5 rounded bg-slate-900 text-slate-200 font-mono text-[10px]">
                <code>${escapeHtml(currentLangData.example.split('\n')[0])}</code>
            </div>
            <div class="text-[9px] text-slate-400">
                【${escapeHtml(item.summary)}】 (${currentSelectedLang.toUpperCase()})
            </div>
        `;
        container.appendChild(card);
    });
    if (window.lucide) lucide.createIcons();
}