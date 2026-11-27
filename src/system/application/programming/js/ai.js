// ===================================================================
// AI (Ollama) 稼働ステータス監視 & 3段階エラー/差分分析
// ===================================================================

function ensureAiStatusUi() {
    const aiPanelBtn = document.getElementById('headerAiPanelBtn');
    if (aiPanelBtn && !document.getElementById('aiStatusBadge')) {
        const badge = document.createElement('button');
        badge.id = 'aiStatusBadge';
        badge.type = 'button';
        badge.onclick = () => checkAiConnectionStatus(true);
        badge.title = 'クリックでAI (Ollama) の接続状態を再確認';
        badge.className = 'px-2 py-1 rounded-full text-[11px] font-bold border flex items-center gap-1.5 transition-colors bg-slate-100 dark:bg-slate-800 text-slate-500 border-slate-300 dark:border-slate-700';
        badge.innerHTML = '<span class="w-2 h-2 rounded-full bg-slate-400"></span><span>AI確認中...</span>';
        aiPanelBtn.parentNode.insertBefore(badge, aiPanelBtn);
    }

    const rightAiBox = document.getElementById('rightAiBox');
    if (rightAiBox && !document.getElementById('aiPanelStatusLine')) {
        const line = document.createElement('div');
        line.id = 'aiPanelStatusLine';
        line.className = 'flex items-center justify-between text-[10px] px-2 py-1 rounded-lg bg-white/70 dark:bg-slate-900/60 border border-indigo-200/60 dark:border-indigo-800/50 text-slate-500';
        line.innerHTML = '<span>接続先を確認中...</span>';
        const adviceEl = document.getElementById('aiAdviceText');
        if (adviceEl) {
            rightAiBox.insertBefore(line, adviceEl);
        } else {
            rightAiBox.appendChild(line);
        }
    }
}

async function checkAiConnectionStatus(manual = false) {
    ensureAiStatusUi();
    const badge = document.getElementById('aiStatusBadge');
    const panelLine = document.getElementById('aiPanelStatusLine');

    if (manual && badge) {
        badge.innerHTML = '<span class="w-2 h-2 rounded-full bg-amber-400 animate-ping"></span><span>確認中...</span>';
    }

    try {
        const res = await invokeRust('check_ai_status');
        if (res?.running && res?.model_installed) {
            if (badge) {
                badge.className = 'px-2 py-1 rounded-full text-[11px] font-bold border flex items-center gap-1.5 transition-colors bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30';
                badge.innerHTML = `<span class="w-2 h-2 rounded-full bg-emerald-500"></span><span>AI稼働中 (${escapeHtml(res.model_name)})</span>`;
            }
            if (panelLine) {
                panelLine.innerHTML = `<span class="text-emerald-600 dark:text-emerald-400 font-bold">● Ollama 接続OK (${escapeHtml(res.model_name)})</span><button onclick="checkAiConnectionStatus(true)" class="underline text-slate-400 hover:text-slate-600">再確認</button>`;
            }
        } else if (res?.running && !res?.model_installed) {
            if (badge) {
                badge.className = 'px-2 py-1 rounded-full text-[11px] font-bold border flex items-center gap-1.5 transition-colors bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30';
                badge.innerHTML = '<span class="w-2 h-2 rounded-full bg-amber-500"></span><span>モデル未導入</span>';
            }
            if (panelLine) {
                panelLine.innerHTML = `<span class="text-amber-600 dark:text-amber-400 font-bold">● Ollama起動中 / ${escapeHtml(res.model_name)} 未導入</span><button onclick="checkAiConnectionStatus(true)" class="underline text-slate-400 hover:text-slate-600">再確認</button>`;
            }
        } else {
            if (badge) {
                badge.className = 'px-2 py-1 rounded-full text-[11px] font-bold border flex items-center gap-1.5 transition-colors bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/30';
                badge.innerHTML = '<span class="w-2 h-2 rounded-full bg-rose-500"></span><span>AI未接続</span>';
            }
            if (panelLine) {
                panelLine.innerHTML = '<span class="text-rose-500 font-bold">● Ollama 未起動（簡易分析で動作中）</span><button onclick="checkAiConnectionStatus(true)" class="underline text-slate-400 hover:text-slate-600">再確認</button>';
            }
        }
    } catch (e) {
        if (badge) {
            badge.className = 'px-2 py-1 rounded-full text-[11px] font-bold border flex items-center gap-1.5 transition-colors bg-slate-200/70 dark:bg-slate-800 text-slate-500 border-slate-300 dark:border-slate-700';
            badge.innerHTML = '<span class="w-2 h-2 rounded-full bg-slate-400"></span><span>AIオフライン</span>';
        }
    }
}

function ensureAiHintControls() {
    const rightAiBox = document.getElementById('rightAiBox');
    if (!rightAiBox) return;

    let badge = document.getElementById('aiHintLevelBadge');
    if (!badge) {
        const spans = rightAiBox.querySelectorAll('span');
        spans.forEach(s => {
            if (s.innerText.includes('ヒント')) {
                s.id = 'aiHintLevelBadge';
                badge = s;
            }
        });
    }

    if (!document.getElementById('btnNextHint')) {
        const footer = document.createElement('div');
        footer.className = 'pt-2 border-t border-indigo-200/60 dark:border-indigo-800/60 flex items-center justify-between gap-2';
        footer.innerHTML = `
            <span class="text-[10px] text-slate-400" id="aiHintStepDesc">第1段階: 着眼点</span>
            <button id="btnNextHint" onclick="nextAiHintStep()" class="px-2.5 py-1 bg-indigo-600 hover:bg-indigo-700 text-white rounded text-[11px] font-bold flex items-center gap-1 shadow-xs transition-transform active:scale-95">
                <span>次のヒント (2/3)</span>
                <i data-lucide="chevron-right" class="w-3 h-3"></i>
            </button>
        `;
        rightAiBox.appendChild(footer);
        if (window.lucide) lucide.createIcons();
    }
}

function resetAiHintLevel() {
    currentAiHintLevel = 1;
    updateAiHintUiLevel(1);
}

function updateAiHintUiLevel(level) {
    ensureAiHintControls();
    const badge = document.getElementById('aiHintLevelBadge');
    const stepDesc = document.getElementById('aiHintStepDesc');
    const nextBtn = document.getElementById('btnNextHint');
    const isErrMode = Boolean((lastRunState.error || '').trim());

    if (badge) badge.innerText = `ヒント ${level}/3`;
    if (stepDesc) {
        const descs = isErrMode
            ? ['第1段階: エラーの意味と場所', '第2段階: エラーの原因解説', '第3段階: 具体的な修正コード']
            : ['第1段階: 着眼点', '第2段階: 考え方・原因', '第3段階: 具体的な修正コード'];
        stepDesc.innerText = descs[level - 1] || '';
    }
    if (nextBtn) {
        if (level < 3) {
            nextBtn.classList.remove('hidden');
            nextBtn.innerHTML = `<span>次のヒント (${level + 1}/3)</span><i data-lucide="chevron-right" class="w-3 h-3"></i>`;
        } else {
            nextBtn.classList.add('hidden');
        }
        if (window.lucide) lucide.createIcons();
    }
}

function buildCurrentAiPrompt() {
    if (activeMode === 'task') {
        const task = tasks.find(t => t.id === lastWorkedTaskId) || tasks[0];
        let prompt = `${task.title}: ${task.desc}\n期待される出力: ${task.expected}`;
        if (lastRunState.output) prompt += `\n実際の出力: ${lastRunState.output}`;
        if (lastRunState.error) prompt += `\nエラー内容: ${lastRunState.error}`;
        return prompt;
    }
    let prompt = `自由制作 (${currentProjectKey}/${currentFileKey})`;
    if (lastRunState.error) prompt += `\nエラー内容: ${lastRunState.error}`;
    return prompt;
}

function renderAiResultHtml(res, currentError) {
    const hint = res?.hint || (typeof res === 'string' ? res : '');
    const isOllama = res?.source === 'ollama';
    const isErrResult = res?.analysis_type === 'error' || currentError.length > 0;

    const sourceBadge = isOllama
        ? '<span class="inline-block px-1.5 py-0.5 rounded bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 text-[10px] font-bold">⚡ Ollama (gemma3:4b)</span>'
        : '<span class="inline-block px-1.5 py-0.5 rounded bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300 text-[10px] font-bold">📝 簡易分析</span>';

    const modeBadge = isErrResult
        ? '<span class="inline-block px-1.5 py-0.5 rounded bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-300 text-[10px] font-bold">🚨 エラー内容分析</span>'
        : '<span class="inline-block px-1.5 py-0.5 rounded bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300 text-[10px] font-bold">🤔 出力の差分分析</span>';

    const errSummary = isErrResult && currentError
        ? `<div class="mb-2 p-1.5 rounded bg-rose-950/80 text-rose-200 font-mono text-[10px] border border-rose-500/40 overflow-x-auto whitespace-pre-wrap">${escapeHtml(currentError.split('\n').slice(-2).join('\n'))}</div>`
        : '';

    return `<div class="mb-1.5 flex items-center gap-1.5 flex-wrap">${modeBadge}${sourceBadge}</div>${errSummary}${formatHintMarkdown(hint)}`;
}

async function nextAiHintStep() {
    if (currentAiHintLevel < 3) {
        currentAiHintLevel++;
        updateAiHintUiLevel(currentAiHintLevel);
        const code = document.getElementById('codeEditor').value;
        await fetchAiHintIntoPanel(code, buildCurrentAiPrompt(), currentAiHintLevel);
    }
}

async function nextConsoleAiHintStep() {
    if (currentAiHintLevel < 3) {
        currentAiHintLevel++;
        updateAiHintUiLevel(currentAiHintLevel);
        await switchConsoleTab('ai');
    }
}

async function fetchAiHintIntoPanel(userCode, taskPrompt, level = 1) {
    ensureAiStatusUi();
    ensureAiHintControls();
    updateAiHintUiLevel(level);

    const aiText = document.getElementById('aiAdviceText');
    if (!aiText) return;

    const currentError = (lastRunState.error || '').trim();
    const isErrorAnalysis = currentError.length > 0;

    aiText.innerHTML = `<span class="text-indigo-500 font-bold animate-pulse">${
        isErrorAnalysis
            ? `🚨 AIがプログラムエラーを分析中... (${level}/3)`
            : `AIがヒント(${level}/3)を分析中...`
    }</span>`;

    try {
        const res = await invokeRust('ask_ai_hint', {
            userCode,
            taskPrompt,
            hintLevel: level,
            errorMessage: isErrorAnalysis ? currentError : null,
            isKidMode
        });

        if (res?.hint || typeof res === 'string') {
            aiText.innerHTML = renderAiResultHtml(res, currentError);
            aiHintFetchedForCurrentRun = true;
            checkAiConnectionStatus(false);
            return;
        }
    } catch (e) {
        console.warn('AI Hint Error:', e);
    }

    aiText.innerHTML = 'エラーメッセージや計算式、文字列のつなぎ方を見直してみよう！';
}

async function openAiHelpFromConsole() {
    const code = document.getElementById('codeEditor').value;

    const panel = document.getElementById('detailPanel');
    if (panel) {
        isDetailOpen = true;
        panel.classList.remove('translate-x-full');
    }

    const rightAiBox = document.getElementById('rightAiBox');
    if (rightAiBox) {
        rightAiBox.classList.remove('hidden');
        rightAiBox.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }

    ensureAiStatusUi();
    ensureAiHintControls();

    if (!aiHintFetchedForCurrentRun) {
        resetAiHintLevel();
        await fetchAiHintIntoPanel(code, buildCurrentAiPrompt(), 1);
    }
}