// ===================================================================
// エディタ表示設定・テーマ・表示モード・レイアウト制御
// ===================================================================

function updateLineNumbers() {
    const editor = document.getElementById('codeEditor');
    const lineNumbers = document.getElementById('editorLineNumbers');
    if (!editor || !lineNumbers) return;

    const lineCount = editor.value.split('\n').length;
    let linesText = '';
    for (let i = 1; i <= Math.max(1, lineCount); i++) {
        linesText += i + '\n';
    }
    lineNumbers.textContent = linesText;
}

function updateLineNumberSetting() {
    const select = document.getElementById('settingShowLineNumbers');
    if (!select) return;
    editorPreferences.showLineNumbers = (select.value === 'true');
    applyLineNumberSetting();
    try {
        localStorage.setItem('codelab_editor_pref', JSON.stringify(editorPreferences));
    } catch (e) {}
}

function applyLineNumberSetting() {
    const lineNumbers = document.getElementById('editorLineNumbers');
    if (!lineNumbers) return;
    lineNumbers.classList.toggle('hidden-lines', !editorPreferences.showLineNumbers);
}

function updateEditorFontSize() {
    const select = document.getElementById('settingFontSize');
    if (!select) return;
    editorPreferences.fontSize = select.value;
    applyEditorFontSize();
    try {
        localStorage.setItem('codelab_editor_pref', JSON.stringify(editorPreferences));
    } catch (e) {}
}

function applyEditorFontSize() {
    const editor = document.getElementById('codeEditor');
    const lineNumbers = document.getElementById('editorLineNumbers');
    if (!editor || !lineNumbers) return;

    ['small', 'medium', 'large', 'xlarge'].forEach(s => {
        editor.classList.remove(`editor-font-${s}`);
        lineNumbers.classList.remove(`editor-font-${s}`);
    });

    editor.classList.add(`editor-font-${editorPreferences.fontSize}`);
    lineNumbers.classList.add(`editor-font-${editorPreferences.fontSize}`);
}

function resetAllSettingsToDefault() {
    if (!confirm("アプリの設定（テーマ、表示モード、レイアウト、文字サイズ、行番号表示）をすべて初期状態に戻しますか？")) {
        return;
    }

    try {
        localStorage.removeItem('codelab_theme');
        localStorage.removeItem('codelab_kid_mode');
        localStorage.removeItem('codelab_layout');
        localStorage.removeItem('codelab_editor_pref');
        localStorage.removeItem('codelab_tour_done');
    } catch (e) {
        console.warn('LocalStorage clear error:', e);
    }

    setThemeMode('light', false);
    setAudienceMode(true, false);
    layoutConfig = { taskPos: 'right', aiPos: 'right', dictPos: 'right' };
    editorPreferences = { showLineNumbers: true, fontSize: 'medium' };

    if (document.getElementById('settingTaskPos')) document.getElementById('settingTaskPos').value = 'right';
    if (document.getElementById('settingAiPos')) document.getElementById('settingAiPos').value = 'right';
    if (document.getElementById('settingDictPos')) document.getElementById('settingDictPos').value = 'right';
    if (document.getElementById('settingShowLineNumbers')) document.getElementById('settingShowLineNumbers').value = 'true';
    if (document.getElementById('settingFontSize')) document.getElementById('settingFontSize').value = 'medium';

    applyLayoutPreset('standard');
    applyLineNumberSetting();
    applyEditorFontSize();
    renderDynamicLayout();

    alert("すべての設定を初期状態にリセットしました。");
}

function loadSavedPreferences() {
    try {
        const savedTheme = localStorage.getItem('codelab_theme') || 'light';
        setThemeMode(savedTheme, false);

        const savedKidMode = localStorage.getItem('codelab_kid_mode');
        setAudienceMode(savedKidMode !== null ? (savedKidMode === 'true') : true, false);

        const savedEditorPref = localStorage.getItem('codelab_editor_pref');
        if (savedEditorPref) {
            editorPreferences = JSON.parse(savedEditorPref);
            if (document.getElementById('settingShowLineNumbers')) {
                document.getElementById('settingShowLineNumbers').value = editorPreferences.showLineNumbers.toString();
            }
            if (document.getElementById('settingFontSize')) {
                document.getElementById('settingFontSize').value = editorPreferences.fontSize || 'medium';
            }
        }
        applyLineNumberSetting();
        applyEditorFontSize();

        const savedLayout = localStorage.getItem('codelab_layout');
        if (savedLayout) {
            layoutConfig = JSON.parse(savedLayout);
            if (document.getElementById('settingTaskPos')) {
                document.getElementById('settingTaskPos').value = layoutConfig.taskPos || 'right';
                document.getElementById('settingAiPos').value = layoutConfig.aiPos || 'right';
                document.getElementById('settingDictPos').value = layoutConfig.dictPos || 'right';
            }
        }

        const savedTaskId = localStorage.getItem('codelab_last_task');
        if (savedTaskId) lastWorkedTaskId = parseInt(savedTaskId, 10);

        const savedCodes = localStorage.getItem('codelab_task_codes');
        if (savedCodes) Object.assign(userTaskCodes, JSON.parse(savedCodes));
    } catch (err) {
        console.warn('LocalStorage load error:', err);
    }
}

function setAudienceMode(isKid, save = true) {
    isKidMode = isKid;
    const kidBtn = document.getElementById('audienceSelectKidBtn');
    const adultBtn = document.getElementById('audienceSelectAdultBtn');

    if (kidBtn && adultBtn) {
        if (isKidMode) {
            kidBtn.className = 'flex-1 py-2 px-3 rounded-lg border-2 border-brand-500 bg-white text-slate-900 font-bold text-xs flex items-center justify-center gap-2 shadow-xs transition-all';
            adultBtn.className = 'flex-1 py-2 px-3 rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold text-xs flex items-center justify-center gap-2 transition-all';
        } else {
            adultBtn.className = 'flex-1 py-2 px-3 rounded-lg border-2 border-brand-500 bg-white text-slate-900 font-bold text-xs flex items-center justify-center gap-2 shadow-xs transition-all';
            kidBtn.className = 'flex-1 py-2 px-3 rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold text-xs flex items-center justify-center gap-2 transition-all';
        }
    }

    if (save) {
        try {
            localStorage.setItem('codelab_kid_mode', isKidMode.toString());
        } catch (e) {}
    }

    if (typeof renderDictCards === 'function') renderDictCards();
    if (typeof renderSideDictCards === 'function') renderSideDictCards();
}

function setThemeMode(mode, save = true) {
    const html = document.documentElement;
    const lightBtn = document.getElementById('themeSelectLightBtn');
    const darkBtn = document.getElementById('themeSelectDarkBtn');

    if (mode === 'dark') {
        html.classList.add('dark');
        if (darkBtn && lightBtn) {
            darkBtn.className = 'flex-1 py-2 px-3 rounded-lg border-2 border-indigo-500 bg-slate-800 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-xs transition-all';
            lightBtn.className = 'flex-1 py-2 px-3 rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-100 dark:bg-slate-900 text-slate-700 dark:text-slate-400 font-bold text-xs flex items-center justify-center gap-2 transition-all';
        }
    } else {
        html.classList.remove('dark');
        if (darkBtn && lightBtn) {
            lightBtn.className = 'flex-1 py-2 px-3 rounded-lg border-2 border-brand-500 bg-white text-slate-900 font-bold text-xs flex items-center justify-center gap-2 shadow-xs transition-all';
            darkBtn.className = 'flex-1 py-2 px-3 rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-400 font-bold text-xs flex items-center justify-center gap-2 transition-all';
        }
    }

    if (save) {
        try {
            localStorage.setItem('codelab_theme', mode);
        } catch (e) {}
    }
}

function changeGlobalLanguage(lang) {
    currentSelectedLang = lang;

    ['python', 'javascript', 'c'].forEach(l => {
        const btn = document.getElementById(`langBtn-${l}`);
        if (btn) {
            btn.className = (l === lang)
                ? 'px-2 py-1 rounded text-[11px] font-bold bg-white dark:bg-slate-700 text-brand-600 dark:text-brand-300 shadow-xs transition-all'
                : 'px-2 py-1 rounded text-[11px] font-bold text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-all';
        }
    });

    const engineNames = {
        'python': 'Python Engine (Rust)',
        'javascript': 'Node.js / V8 Engine',
        'c': 'GCC / Clang Engine'
    };
    const engineLabel = document.getElementById('engineVersionLabel');
    if (engineLabel) engineLabel.innerText = engineNames[lang];

    renderDictCards();
    renderSideDictCards();
}

function toggleSidebar() {
    const sidebar = document.getElementById('desktopSidebar');
    sidebar.classList.toggle('md:-ml-60');
    sidebar.classList.toggle('-translate-x-full');
}

function toggleDetailPanel() {
    const panel = document.getElementById('detailPanel');
    isDetailOpen = !isDetailOpen;
    panel.classList.toggle('translate-x-full', !isDetailOpen);
}

function applyLayoutPreset(preset) {
    ['standard', 'inline', 'separated'].forEach(p => {
        const el = document.getElementById(`presetLabel-${p}`);
        if (el) {
            el.className = (p === preset)
                ? 'border-2 border-brand-500 rounded-xl p-3 cursor-pointer bg-brand-50/50 dark:bg-brand-950/20 block relative'
                : 'border border-slate-300 dark:border-slate-700 rounded-xl p-3 cursor-pointer hover:border-brand-400 block relative';
        }
    });

    if (preset === 'standard') {
        layoutConfig = { taskPos: 'right', aiPos: 'right', dictPos: 'right' };
    } else if (preset === 'inline') {
        layoutConfig = { taskPos: 'top', aiPos: 'bottom', dictPos: 'right' };
    } else if (preset === 'separated') {
        layoutConfig = { taskPos: 'top', aiPos: 'right', dictPos: 'view' };
    }
    document.getElementById('settingTaskPos').value = layoutConfig.taskPos;
    document.getElementById('settingAiPos').value = layoutConfig.aiPos;
    document.getElementById('settingDictPos').value = layoutConfig.dictPos;

    saveLayoutToStorage();
    renderDynamicLayout();
}

function updatePartPositions() {
    layoutConfig.taskPos = document.getElementById('settingTaskPos').value;
    layoutConfig.aiPos = document.getElementById('settingAiPos').value;
    layoutConfig.dictPos = document.getElementById('settingDictPos').value;

    saveLayoutToStorage();
    renderDynamicLayout();
}

function saveLayoutToStorage() {
    try {
        localStorage.setItem('codelab_layout', JSON.stringify(layoutConfig));
    } catch (e) {}
}

function renderDynamicLayout() {
    const topTaskBanner = document.getElementById('taskBanner');
    const rightTaskBox = document.getElementById('rightTaskBox');
    const rightAiBox = document.getElementById('rightAiBox');
    const tabBtnAi = document.getElementById('tabBtnAi');
    const rightDictBox = document.getElementById('rightDictBox');

    if (activeMode === 'task') {
        if (layoutConfig.taskPos === 'top') {
            topTaskBanner.classList.remove('hidden');
            rightTaskBox.classList.add('hidden');
        } else if (layoutConfig.taskPos === 'right') {
            topTaskBanner.classList.add('hidden');
            rightTaskBox.classList.remove('hidden');
        } else {
            topTaskBanner.classList.add('hidden');
            rightTaskBox.classList.add('hidden');
        }
    } else {
        topTaskBanner.classList.add('hidden');
        rightTaskBox.classList.add('hidden');
    }

    if (layoutConfig.aiPos === 'bottom') {
        rightAiBox.classList.add('hidden');
        tabBtnAi.classList.remove('hidden');
    } else {
        rightAiBox.classList.remove('hidden');
        tabBtnAi.classList.add('hidden');
    }

    if (layoutConfig.dictPos === 'right') {
        rightDictBox.classList.remove('hidden');
    } else {
        rightDictBox.classList.add('hidden');
    }

    updateMiniPreview();
}

function updateMiniPreview() {
    const prevTaskTop = document.getElementById('previewTaskTop');
    const prevAiTab = document.getElementById('previewAiTab');
    const prevTaskRight = document.getElementById('previewTaskRight');
    const prevAiRight = document.getElementById('previewAiRight');
    const prevDictRight = document.getElementById('previewDictRight');
    const prevRightPanel = document.getElementById('previewRightPanel');

    if (!prevTaskTop) return;

    prevTaskTop.classList.toggle('hidden', layoutConfig.taskPos !== 'top');
    prevTaskRight.classList.toggle('hidden', layoutConfig.taskPos !== 'right');
    prevAiTab.classList.toggle('hidden', layoutConfig.aiPos !== 'bottom');
    prevAiRight.classList.toggle('hidden', layoutConfig.aiPos !== 'right');
    prevDictRight.classList.toggle('hidden', layoutConfig.dictPos !== 'right');

    const isRightEmpty = (layoutConfig.taskPos !== 'right') && (layoutConfig.aiPos !== 'right') && (layoutConfig.dictPos !== 'right');
    prevRightPanel.classList.toggle('hidden', isRightEmpty);
}