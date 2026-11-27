// ===================================================================
// 画面遷移・エディタイベント・アプリ起動時初期化
// ===================================================================

function getCurrentVisibleView() {
    if (!document.getElementById('view-tasks-container').classList.contains('hidden')) return 'tasks';
    if (!document.getElementById('view-projects-container').classList.contains('hidden')) return 'projects';
    if (!document.getElementById('view-dict-container').classList.contains('hidden')) return 'dict-view';
    if (!document.getElementById('view-editor-container').classList.contains('hidden')) {
        return activeMode === 'task' ? 'editor-task' : 'editor-free';
    }
    if (!document.getElementById('view-history-container').classList.contains('hidden')) return 'history';
    if (!document.getElementById('view-settings-container').classList.contains('hidden')) return 'settings';
    return 'tasks';
}

function switchView(view, pushHistory = true) {
    const currentVisible = getCurrentVisibleView();

    if (currentVisible === 'editor-task' && lastWorkedTaskId) {
        userTaskCodes[lastWorkedTaskId] = document.getElementById('codeEditor').value;
        try {
            localStorage.setItem('codelab_task_codes', JSON.stringify(userTaskCodes));
            localStorage.setItem('codelab_last_task', lastWorkedTaskId.toString());
        } catch (e) {}
    } else if (currentVisible === 'editor-free') {
        const proj = projectsData[currentProjectKey];
        if (proj && currentFileKey) {
            proj.files[currentFileKey] = document.getElementById('codeEditor').value;
        }
    }

    if (pushHistory && currentVisible !== view) {
        navigationHistoryStack.push({
            view: currentVisible,
            taskId: lastWorkedTaskId,
            savedCode: document.getElementById('codeEditor').value,
            projectKey: currentProjectKey,
            fileKey: currentFileKey
        });
    }

    if (view === 'dict-view') {
        const peek = navigationHistoryStack[navigationHistoryStack.length - 1];
        const lastV = peek ? peek.view : 'tasks';
        const labelMap = {
            'tasks': '課題一覧へ戻る',
            'editor-task': `課題(${peek?.taskId || lastWorkedTaskId})へ戻る`,
            'editor-free': '制作エディタへ戻る',
            'projects': 'プロジェクト選択へ戻る',
            'history': '履歴へ戻る',
            'settings': '設定へ戻る'
        };
        document.getElementById('dictBackBtnLabel').innerText = labelMap[lastV] || '戻る';
    }

    ['tasks', 'projects', 'dict', 'editor', 'history', 'settings'].forEach(v => {
        document.getElementById(`view-${v}-container`).classList.add('hidden');
    });

    const taskCategoryNav = document.getElementById('taskCategoryNavSection');
    const dictCategoryNav = document.getElementById('dictCategoryNavSection');
    const fileTree = document.getElementById('fileTreeSection');
    const headerControls = document.getElementById('editorHeaderControls');
    const headerFileBtn = document.getElementById('headerFileBtn');
    const headerLangSelector = document.getElementById('headerLangSelector');
    const headerAiPanelBtn = document.getElementById('headerAiPanelBtn');
    const badge = document.getElementById('currentModeBadge');
    const projectBanner = document.getElementById('projectNavBanner');

    ['tasks', 'projects', 'history', 'dict', 'settings'].forEach(v => {
        const btn = document.getElementById(`nav-${v}`);
        if (btn) {
            const isTarget = (view === 'tasks' && v === 'tasks') ||
                (view === 'editor-task' && v === 'tasks') ||
                (view === 'projects' && v === 'projects') ||
                (view === 'editor-free' && v === 'projects') ||
                (view === 'dict-view' && v === 'dict') ||
                (view === v);
            btn.className = isTarget
                ? 'focus-ring w-full flex items-center justify-between px-2.5 py-2 rounded-lg text-xs font-extrabold bg-brand-500 text-white shadow-xs transition-all'
                : 'focus-ring w-full flex items-center justify-between px-2.5 py-2 rounded-lg text-xs font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-200/60 dark:hover:bg-slate-800 transition-all';
        }
    });

    if (view === 'tasks') {
        activeMode = 'task';
        document.getElementById('view-tasks-container').classList.remove('hidden');
        headerControls.classList.add('hidden');
        headerLangSelector.classList.add('hidden');
        headerAiPanelBtn.classList.add('hidden');
        badge.classList.remove('hidden');
        taskCategoryNav.classList.remove('hidden');
        dictCategoryNav.classList.add('hidden');
        fileTree.classList.add('hidden');
        badge.innerText = '🎯 課題演習：問題選択';
        badge.className = 'px-2.5 py-1 text-xs font-bold rounded-full bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/30';
        renderResumeTaskCard();
        renderTasks();
    } else if (view === 'projects') {
        activeMode = 'free';
        document.getElementById('view-projects-container').classList.remove('hidden');
        headerControls.classList.add('hidden');
        headerLangSelector.classList.add('hidden');
        headerAiPanelBtn.classList.add('hidden');
        badge.classList.remove('hidden');
        taskCategoryNav.classList.add('hidden');
        dictCategoryNav.classList.add('hidden');
        fileTree.classList.add('hidden');
        badge.innerText = '📁 自由制作：プロジェクト選択';
        badge.className = 'px-2.5 py-1 text-xs font-bold rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30';
        renderProjectCards();
    } else if (view === 'dict-view') {
        activeMode = 'dict';
        document.getElementById('view-dict-container').classList.remove('hidden');
        headerControls.classList.add('hidden');
        headerLangSelector.classList.remove('hidden');
        headerAiPanelBtn.classList.add('hidden');
        badge.classList.remove('hidden');
        taskCategoryNav.classList.add('hidden');
        dictCategoryNav.classList.remove('hidden');
        fileTree.classList.add('hidden');
        badge.innerText = '📖 構文辞書：多言語カード';
        badge.className = 'px-2.5 py-1 text-xs font-bold rounded-full bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/30';
        renderDictCards();
    } else if (view === 'editor-task') {
        activeMode = 'task';
        document.getElementById('view-editor-container').classList.remove('hidden');
        headerControls.classList.remove('hidden');
        headerFileBtn.classList.add('hidden');
        headerLangSelector.classList.add('hidden');
        headerAiPanelBtn.classList.remove('hidden');
        badge.classList.remove('hidden');
        taskCategoryNav.classList.add('hidden');
        dictCategoryNav.classList.add('hidden');
        fileTree.classList.add('hidden');
        projectBanner.classList.add('hidden');
        badge.innerText = '🎯 課題演習モード中';
        badge.className = 'px-2.5 py-1 text-xs font-bold rounded-full bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/30';
    } else if (view === 'editor-free') {
        activeMode = 'free';
        document.getElementById('view-editor-container').classList.remove('hidden');
        headerControls.classList.remove('hidden');
        headerFileBtn.classList.remove('hidden');
        headerLangSelector.classList.remove('hidden');
        headerAiPanelBtn.classList.remove('hidden');
        badge.classList.remove('hidden');
        taskCategoryNav.classList.add('hidden');
        dictCategoryNav.classList.add('hidden');
        fileTree.classList.remove('hidden');
        projectBanner.classList.remove('hidden');
        badge.innerText = `📁 自由制作：${currentProjectKey}`;
        badge.className = 'px-2.5 py-1 text-xs font-bold rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30';
        renderFileTree();
    } else if (view === 'history') {
        document.getElementById('view-history-container').classList.remove('hidden');
        headerControls.classList.add('hidden');
        headerLangSelector.classList.add('hidden');
        headerAiPanelBtn.classList.add('hidden');
        badge.classList.remove('hidden');
        badge.innerText = '📊 学習履歴・カルテ';
        badge.className = 'px-2.5 py-1 text-xs font-bold rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/30';
        taskCategoryNav.classList.add('hidden');
        dictCategoryNav.classList.add('hidden');
        fileTree.classList.add('hidden');
    } else if (view === 'settings') {
        document.getElementById('view-settings-container').classList.remove('hidden');
        headerControls.classList.add('hidden');
        headerLangSelector.classList.add('hidden');
        headerAiPanelBtn.classList.add('hidden');
        badge.classList.add('hidden');
        taskCategoryNav.classList.add('hidden');
        dictCategoryNav.classList.add('hidden');
        fileTree.classList.add('hidden');
    }

    renderDynamicLayout();
    updateLineNumbers();
    if (window.lucide) lucide.createIcons();
}

function goBackFromDict() {
    if (navigationHistoryStack.length > 0) {
        const target = navigationHistoryStack.pop();
        if (target.view === 'editor-task' && target.taskId) {
            selectTask(target.taskId, false);
        } else if (target.view === 'editor-free') {
            currentProjectKey = target.projectKey;
            currentFileKey = target.fileKey;
            switchView('editor-free', false);
        } else {
            switchView(target.view || 'tasks', false);
        }
    } else {
        switchView('tasks', false);
    }
}

window.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
        const current = getCurrentVisibleView();
        if (current === 'dict-view') {
            e.preventDefault();
            goBackFromDict();
        } else if (isDetailOpen) {
            toggleDetailPanel();
        }
    }
});

function setupEditorEvents() {
    const editor = document.getElementById('codeEditor');
    const lineNumbers = document.getElementById('editorLineNumbers');
    if (!editor || !lineNumbers) return;

    editor.addEventListener('input', () => {
        if (activeMode === 'task' && lastWorkedTaskId) {
            userTaskCodes[lastWorkedTaskId] = editor.value;
        } else if (activeMode === 'free' && projectsData[currentProjectKey] && currentFileKey) {
            projectsData[currentProjectKey].files[currentFileKey] = editor.value;
        }
        updateLineNumbers();
        scheduleSyntaxCheck();
    });

    editor.addEventListener('scroll', () => {
        lineNumbers.scrollTop = editor.scrollTop;
    });

    editor.addEventListener('keydown', (e) => {
        if (e.key === 'Tab') {
            e.preventDefault();
            const start = editor.selectionStart;
            const end = editor.selectionEnd;
            editor.setRangeText('    ', start, end, 'end');
            updateLineNumbers();
            scheduleSyntaxCheck();
        }
        if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
            e.preventDefault();
            runCode();
        }
    });
}

window.onload = () => {
    loadSavedPreferences();
    setupEditorEvents();
    ensureAiStatusUi();
    ensureAiHintControls();
    if (window.lucide) lucide.createIcons();
    switchView('tasks');
    renderSideDictCards();
    renderDynamicLayout();
    updateLineNumbers();

    // Ollama 稼働チェック（起動時 + 15秒ごと）
    checkAiConnectionStatus(false);
    setInterval(() => checkAiConnectionStatus(false), 15000);

    try {
        const tourDone = localStorage.getItem('codelab_tour_done');
        if (!tourDone) {
            setTimeout(startTour, 400);
        }
    } catch (e) {}
};