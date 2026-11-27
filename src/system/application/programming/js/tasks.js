// ===================================================================
// 課題演習（フィルタ・カード描画・課題選択・続きから再開）
// ===================================================================

function renderResumeTaskCard() {
    const task = tasks.find(t => t.id === lastWorkedTaskId) || tasks[2];
    document.getElementById('resumeTaskTitle').innerText = task.title;
    document.getElementById('resumeTaskDesc').innerText = task.desc;
}

function resumeLastTask() {
    selectTask(lastWorkedTaskId);
}

function setCategory(cat) {
    selectedCategory = cat;
    document.querySelectorAll('.cat-btn').forEach(btn => {
        btn.className = 'cat-btn w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-200/50 dark:hover:bg-slate-800';
    });
    const activeBtn = document.getElementById(`cat-${cat}`);
    if (activeBtn) activeBtn.className = 'cat-btn w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs font-bold bg-slate-200/80 dark:bg-slate-800 text-brand-600 dark:text-brand-400';
    renderTasks();
}

function setDifficulty(diff) {
    selectedDifficulty = diff;
    document.querySelectorAll('.diff-btn').forEach(btn => {
        btn.className = 'diff-btn px-2.5 py-1 rounded-lg text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800';
    });
    const activeBtn = document.getElementById(`diff-${diff}`);
    if (activeBtn) activeBtn.className = 'diff-btn px-2.5 py-1 rounded-lg text-xs font-bold bg-brand-600 text-white shadow-xs';
    renderTasks();
}

function renderTasks() {
    const grid = document.getElementById('taskGrid');
    const notice = document.getElementById('emptyNotice');
    if (!grid) return;
    grid.innerHTML = '';

    const filtered = tasks.filter(t => {
        const matchCat = (selectedCategory === 'all' || t.category === selectedCategory);
        const matchDiff = (selectedDifficulty === 'all' || t.difficulty === selectedDifficulty);
        return matchCat && matchDiff;
    });

    document.getElementById('matchCountBadge').innerText = `該当 ${filtered.length} 件`;
    if (filtered.length === 0) {
        notice.classList.remove('hidden');
        return;
    }
    notice.classList.add('hidden');

    filtered.forEach(task => {
        const diffBadgeClass = task.difficulty === 'easy'
            ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
            : (task.difficulty === 'medium' ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300' : 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300');

        let dictTagsHtml = '';
        if (task.relatedDictIds && task.relatedDictIds.length > 0) {
            const tagBadges = task.relatedDictIds.map(dId => {
                const dObj = dictionaryData.find(d => d.id === dId);
                const label = dObj ? dObj.langs.python.name.split(' ')[0] : dId;
                return `
                    <button onclick="jumpToDictFromTaskCard('${dId}', event)" class="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[9px] font-bold bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-950/60 dark:hover:bg-indigo-900/60 text-indigo-600 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 transition-colors" title="辞書を見る: ${escapeHtml(label)}">
                        <i data-lucide="book-open" class="w-2.5 h-2.5 text-indigo-500"></i>
                        <span>${escapeHtml(label)}</span>
                    </button>
                `;
            }).join('');

            dictTagsHtml = `
                <div class="pt-2 border-t border-slate-100 dark:border-slate-800/80 flex items-center gap-1.5 flex-wrap">
                    <span class="text-[9px] font-bold text-slate-400">使う関数:</span>
                    <div class="flex flex-wrap gap-1">${tagBadges}</div>
                </div>
            `;
        }

        const card = document.createElement('div');
        card.className = 'focus-ring card-hover-effect bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 cursor-pointer flex flex-col justify-between min-h-[12rem] shadow-xs space-y-2';
        card.innerHTML = `
            <div>
                <div class="flex items-center justify-between mb-2">
                    <span class="text-[10px] font-bold px-2 py-0.5 rounded ${diffBadgeClass}">${task.diffLabel}</span>
                    <span class="text-[10px] text-slate-400">目安: ${task.time}</span>
                </div>
                <h3 class="font-bold text-xs text-slate-900 dark:text-white mb-1">${escapeHtml(task.title)}</h3>
                <p class="text-[11px] text-slate-500 line-clamp-2">${escapeHtml(task.desc)}</p>
            </div>

            <div class="space-y-2">
                ${dictTagsHtml}
                <div class="pt-2 border-t border-slate-100 dark:border-slate-800 flex justify-between items-center text-xs text-brand-600 font-bold">
                    <span>挑戦する</span>
                    <i data-lucide="chevron-right" class="w-4 h-4"></i>
                </div>
            </div>
        `;
        card.onclick = () => selectTask(task.id, true);
        grid.appendChild(card);
    });
    if (window.lucide) lucide.createIcons();
}

function jumpToDictFromTaskCard(dictId, event) {
    if (event) event.stopPropagation();
    switchView('dict-view');
    const searchInput = document.getElementById('dictSearchInput');
    if (searchInput) {
        searchInput.value = dictId;
        handleDictSearch();
    }
}

function selectTask(taskId, isNewSelect = true) {
    lastWorkedTaskId = taskId;
    try {
        localStorage.setItem('codelab_last_task', taskId.toString());
    } catch (e) {}

    resetLastRunState();
    resetAiHintLevel();
    aiHintFetchedForCurrentRun = false;

    const task = tasks.find(t => t.id === taskId) || tasks[0];

    document.getElementById('taskBannerTitle').innerText = task.title;

    const formattedExpected = task.expected.includes('\n')
        ? task.expected.replace(/\n/g, ' ↵ ')
        : task.expected;
    document.getElementById('taskBannerExpected').innerText = formattedExpected;

    document.getElementById('rightTaskTitle').innerText = task.title;
    document.getElementById('rightTaskDesc').innerText = task.desc;
    document.getElementById('rightTaskExpectedBadge').innerText = `目標: ${formattedExpected}`;

    if (!isNewSelect && userTaskCodes[taskId]) {
        document.getElementById('codeEditor').value = userTaskCodes[taskId];
    } else if (isNewSelect) {
        document.getElementById('codeEditor').value = userTaskCodes[taskId] || task.code;
    }

    document.getElementById('currentEditorFileName').innerHTML = `<i data-lucide="terminal" class="w-3.5 h-3.5 text-brand-500"></i> task_${taskId}.py`;
    document.getElementById('consoleBody').innerHTML = `<span class="text-slate-500">「うごかす！」ボタンを押すとRust側でPythonが実行されます。</span>`;

    const aiText = document.getElementById('aiAdviceText');
    if (aiText) {
        aiText.innerHTML = '「うごかす！」を押したあと、下のコンソールから「💡 AIの解説・ヒントを見る」を押すと段階的なアドバイスが表示されるよ！';
    }

    switchView('editor-task');
    updateLineNumbers();
    scheduleSyntaxCheck();
}