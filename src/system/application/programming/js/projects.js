// ===================================================================
// 自由制作プロジェクト & ファイルツリー管理
// ===================================================================

function renderProjectCards() {
    const grid = document.getElementById('projectCardGrid');
    if (!grid) return;
    grid.innerHTML = '';

    const newCard = document.createElement('div');
    newCard.onclick = promptNewFolder;
    newCard.className = 'focus-ring card-hover-effect bg-white dark:bg-slate-900 p-4 rounded-xl border border-dashed border-slate-300 dark:border-slate-700 hover:border-brand-500 cursor-pointer flex flex-col items-center justify-center h-44 text-center';
    newCard.innerHTML = `
        <div class="w-10 h-10 rounded-full bg-brand-50 dark:bg-brand-950 flex items-center justify-center text-brand-600 mb-2">
            <i data-lucide="plus" class="w-5 h-5"></i>
        </div>
        <h3 class="font-bold text-xs text-slate-800 dark:text-slate-200">新規プロジェクト</h3>
        <p class="text-[11px] text-slate-400 mt-1">新しいフォルダを作成して制作を始める</p>
    `;
    grid.appendChild(newCard);

    Object.keys(projectsData).forEach(key => {
        const proj = projectsData[key];
        const card = document.createElement('div');
        card.className = 'focus-ring card-hover-effect bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 cursor-pointer flex flex-col justify-between h-44 shadow-xs relative group';
        card.innerHTML = `
            <div>
                <div class="flex items-center justify-between mb-2">
                    <span class="text-xs font-bold text-brand-600 dark:text-brand-400 flex items-center gap-1">
                        <i data-lucide="folder" class="w-4 h-4 fill-brand-500/20"></i> ${escapeHtml(proj.name)}
                    </span>
                    <button onclick="event.stopPropagation(); deleteFolder('${escapeHtml(key)}')" class="opacity-0 group-hover:opacity-100 p-1 text-slate-400 hover:text-rose-500 transition-opacity" title="フォルダを削除">
                        <i data-lucide="trash-2" class="w-3.5 h-3.5"></i>
                    </button>
                </div>
                <p class="text-xs text-slate-500 line-clamp-2">${escapeHtml(proj.desc)}</p>
            </div>
            <div>
                <div class="text-[10px] text-slate-400 font-mono mb-2 flex items-center justify-between">
                    <span>ファイル: ${Object.keys(proj.files).length}件</span>
                    <span>${escapeHtml(proj.updated)}</span>
                </div>
                <div class="pt-2 border-t border-slate-100 dark:border-slate-800 flex justify-between items-center text-xs text-brand-600 font-bold">
                    <span>このフォルダを開く</span>
                    <i data-lucide="chevron-right" class="w-4 h-4"></i>
                </div>
            </div>
        `;
        card.onclick = () => openProject(key);
        grid.appendChild(card);
    });
    if (window.lucide) lucide.createIcons();
}

function openProject(key) {
    currentProjectKey = key;
    const proj = projectsData[key];
    const firstFile = Object.keys(proj.files)[0] || 'main.py';
    currentFileKey = firstFile;

    resetLastRunState();
    resetAiHintLevel();
    aiHintFetchedForCurrentRun = false;

    document.getElementById('activeProjectBreadcrumb').innerText = `${proj.name} / ${firstFile}`;
    document.getElementById('currentProjectTreeLabel').innerText = proj.name.toUpperCase();
    document.getElementById('codeEditor').value = proj.files[firstFile] || '';
    document.getElementById('currentEditorFileName').innerHTML = `<i data-lucide="terminal" class="w-3.5 h-3.5 text-brand-500"></i> ${escapeHtml(firstFile)}`;
    document.getElementById('consoleBody').innerHTML = `<span class="text-slate-500">「うごかす！」ボタンを押すとRust側でPythonが実行されます。</span>`;

    switchView('editor-free');
    updateLineNumbers();
    scheduleSyntaxCheck();
}

function renderFileTree() {
    const container = document.getElementById('fileTreeItems');
    if (!container) return;
    container.innerHTML = '';
    const proj = projectsData[currentProjectKey];
    if (!proj) return;

    Object.keys(proj.files).forEach(f => {
        const item = document.createElement('div');
        const isActive = f === currentFileKey;
        item.className = isActive
            ? 'flex items-center justify-between px-2 py-1.5 rounded-lg text-xs font-bold bg-slate-200/70 dark:bg-slate-800 text-brand-600 dark:text-brand-400 cursor-pointer'
            : 'flex items-center justify-between px-2 py-1.5 rounded-lg text-xs text-slate-600 dark:text-slate-400 hover:bg-slate-200/40 dark:hover:bg-slate-800/60 cursor-pointer';
        item.innerHTML = `
            <span class="flex items-center gap-1.5"><i data-lucide="file" class="w-3.5 h-3.5"></i>${escapeHtml(f)}</span>
            ${isActive ? '<span class="text-[9px] text-slate-400 font-mono">active</span>' : ''}
        `;
        item.onclick = () => selectFile(f);
        container.appendChild(item);
    });
    if (window.lucide) lucide.createIcons();
}

function selectFile(f) {
    const proj = projectsData[currentProjectKey];
    if (proj && currentFileKey) {
        proj.files[currentFileKey] = document.getElementById('codeEditor').value;
    }
    currentFileKey = f;
    document.getElementById('codeEditor').value = proj.files[f] || '';
    document.getElementById('currentEditorFileName').innerHTML = `<i data-lucide="terminal" class="w-3.5 h-3.5 text-brand-500"></i> ${escapeHtml(f)}`;
    document.getElementById('activeProjectBreadcrumb').innerText = `${proj.name} / ${f}`;
    renderFileTree();
    updateLineNumbers();
    scheduleSyntaxCheck();
}

function promptNewFolder() {
    const name = prompt("新しいプロジェクト名（英数字）を入力してください：", "my_new_game");
    if (!name) return;
    const clean = name.trim().replace(/[^a-zA-Z0-9_-]/g, "");
    if (!clean || projectsData[clean]) {
        alert("無効な名前か、すでに存在しているプロジェクト名です。");
        return;
    }
    projectsData[clean] = {
        name: clean,
        desc: '新規作成されたプロジェクトフォルダ。',
        updated: 'たった今',
        files: { 'main.py': `# [main.py] 新しいプログラム\nprint("Hello from ${clean}!")\n` }
    };
    renderProjectCards();
}

function deleteFolder(key) {
    if (confirm(`フォルダ「${key}」を削除してもよろしいですか？\n中のファイルもすべて消去されます。`)) {
        delete projectsData[key];
        renderProjectCards();
    }
}

function promptNewFile() {
    const fName = prompt("新しいファイル名（例: utils.py）を入力してください：", "utils.py");
    if (!fName || !fName.endsWith('.py')) {
        alert(".py で終わるファイル名を入力してください。");
        return;
    }
    const proj = projectsData[currentProjectKey];
    if (proj.files[fName]) {
        alert("同名のファイルがすでに存在します。");
        return;
    }
    proj.files[fName] = `# [${fName}]\n`;
    selectFile(fName);
}

function openFileAction() {
    alert("【ファイル操作】\n・左のファイルツリーから新規作成・切替ができます\n・編集内容は自動保存されます");
}