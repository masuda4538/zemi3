// ===================================================================
// Python 実行・自動採点・コンソールタブ・随時構文チェック
// ===================================================================

let syntaxCheckTimer = null;

async function runCode() {
    const code = document.getElementById('codeEditor').value;
    const consoleBody = document.getElementById('consoleBody');
    const aiText = document.getElementById('aiAdviceText');

    resetLastRunState();
    resetAiHintLevel();
    aiHintFetchedForCurrentRun = false;

    const tabBtnOutput = document.getElementById('tabBtnOutput');
    const tabBtnDiff = document.getElementById('tabBtnDiff');
    const tabBtnAi = document.getElementById('tabBtnAi');
    [tabBtnOutput, tabBtnDiff, tabBtnAi].forEach(btn => {
        if (btn) btn.className = 'text-xs font-bold text-slate-400 hover:text-white pb-0.5 flex items-center gap-1';
    });
    if (tabBtnOutput) {
        tabBtnOutput.className = 'text-xs font-bold text-white border-b-2 border-brand-500 pb-0.5 flex items-center gap-1';
    }

    consoleBody.innerHTML = `<div class="text-amber-400 font-bold">⏳ Rust バックエンドで実行中...</div>`;

    try {
        if (activeMode === 'task') {
            const task = tasks.find(t => t.id === lastWorkedTaskId) || tasks[0];
            userTaskCodes[task.id] = code;
            try { localStorage.setItem('codelab_task_codes', JSON.stringify(userTaskCodes)); } catch (e) {}

            const res = await invokeRust('grade_task_code', {
                code,
                expectedOutput: task.expected
            });

            const actualOut = (res?.output ?? '').trimEnd();
            const expectedOut = task.expected.trimEnd();
            const passed = Boolean(res?.passed);
            const score = res?.score ?? (passed ? 100 : 0);
            const errMsg = (res?.error ?? '').trim();

            lastRunState = {
                code,
                output: actualOut,
                expected: expectedOut,
                passed,
                error: errMsg
            };

            if (passed) {
                consoleBody.innerHTML = `
                    <div class="text-emerald-400 font-bold mb-1">🎉 合格！（${escapeHtml(score)}点）期待値と一致しました</div>
                    <pre class="text-slate-200 font-mono whitespace-pre-wrap">${escapeHtml(actualOut || '(出力なし)')}</pre>
                `;
                if (aiText) {
                    aiText.innerHTML = 'すばらしい！期待通りの結果が出せたね。<br>次の課題にも挑戦してみよう！';
                }
                const nextBtn = document.getElementById('btnNextHint');
                if (nextBtn) nextBtn.classList.add('hidden');
                appendHistoryRow(task.title, '合格', 'bg-emerald-100 text-emerald-800', '期待値と完全一致');
            } else {
                const isRuntimeErr = Boolean(errMsg);
                const relatedKey = (task.relatedDictIds && task.relatedDictIds[0]) ? task.relatedDictIds[0] : 'print';

                consoleBody.innerHTML = `
                    <div class="${isRuntimeErr ? 'text-rose-400' : 'text-amber-400'} font-bold mb-1">
                        ${isRuntimeErr ? '❌ プログラムエラーが発生しました' : `🤔 期待した結果と少しちがうみたい！（${escapeHtml(score)}点）`}
                    </div>
                    <div class="text-slate-400">出力結果: <span class="text-rose-400 font-bold whitespace-pre-wrap">${escapeHtml(actualOut || '(出力なし)')}</span></div>
                    <div class="text-slate-400">期待される結果: <span class="text-emerald-400 font-bold whitespace-pre-wrap">${escapeHtml(expectedOut)}</span></div>
                    ${errMsg ? `<pre class="mt-2 p-2 rounded bg-rose-950/60 border border-rose-500/30 text-rose-200 whitespace-pre-wrap">${escapeHtml(errMsg)}</pre>` : ''}

                    <div class="mt-3 pt-2.5 border-t border-slate-800 flex items-center gap-2 flex-wrap">
                        <button onclick="openAiHelpFromConsole()" class="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 shadow-sm transition-transform active:scale-95">
                            <i data-lucide="sparkles" class="w-3.5 h-3.5"></i>
                            <span>${isRuntimeErr ? '🚨 AIでエラー原因を分析する' : '💡 AIの解説・ヒントを見る'}</span>
                        </button>
                        <button onclick="openDictHelpFromConsole('${escapeHtml(relatedKey)}')" class="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-colors">
                            <i data-lucide="book" class="w-3.5 h-3.5 text-brand-400"></i>
                            <span>📖 関連する辞書(${escapeHtml(relatedKey)})を引く</span>
                        </button>
                    </div>
                `;
                appendHistoryRow(
                    task.title,
                    isRuntimeErr ? '実行エラー' : '論理エラー',
                    'bg-rose-100 text-rose-800',
                    isRuntimeErr ? errMsg.split('\n').pop() : `出力「${actualOut || '(なし)'}」/ 期待「${expectedOut}」`
                );
                fetchAiHintIntoPanel(code, buildCurrentAiPrompt(), 1);
            }
        } else {
            const proj = projectsData[currentProjectKey];
            if (proj && currentFileKey) {
                proj.files[currentFileKey] = code;
            }

            const res = await invokeRust('run_python_code', { code });
            const outText = (res?.output ?? '').toString();
            const errText = (res?.error ?? '').toString().trim();

            lastRunState = {
                code,
                output: outText,
                expected: '',
                passed: !errText,
                error: errText
            };

            if (errText) {
                consoleBody.innerHTML = `
                    <div class="text-rose-400 font-bold mb-1">❌ プログラムエラー (プロジェクト: ${escapeHtml(currentProjectKey)})</div>
                    ${outText ? `<pre class="text-slate-300 font-mono whitespace-pre-wrap mb-2">${escapeHtml(outText)}</pre>` : ''}
                    <pre class="p-2 rounded bg-rose-950/60 border border-rose-500/30 text-rose-200 font-mono whitespace-pre-wrap">${escapeHtml(errText)}</pre>
                    <div class="mt-3 pt-2.5 border-t border-slate-800 flex items-center gap-2">
                        <button onclick="openAiHelpFromConsole()" class="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 shadow-sm transition-transform active:scale-95">
                            <i data-lucide="sparkles" class="w-3.5 h-3.5"></i>
                            <span>🚨 AIでエラー原因を分析する</span>
                        </button>
                    </div>
                `;
                fetchAiHintIntoPanel(code, buildCurrentAiPrompt(), 1);
            } else {
                consoleBody.innerHTML = `
                    <div class="text-emerald-400 font-bold mb-1">✔ 実行が完了しました (プロジェクト: ${escapeHtml(currentProjectKey)})</div>
                    <pre class="text-slate-200 font-mono whitespace-pre-wrap">${escapeHtml(outText || '(出力なし)')}</pre>
                `;
                if (aiText) {
                    aiText.innerHTML = '正常に実行できたね！新しい処理を追加したり、別のファイルに分けてみよう！';
                }
                const nextBtn = document.getElementById('btnNextHint');
                if (nextBtn) nextBtn.classList.add('hidden');
            }
        }
    } catch (err) {
        const msg = err?.message || String(err);
        lastRunState = { code, output: '', expected: '', passed: false, error: msg };
        consoleBody.innerHTML = `
            <div class="text-rose-400 font-bold mb-1">⚠ Rust バックエンド呼び出しエラー</div>
            <pre class="text-rose-300 whitespace-pre-wrap">${escapeHtml(msg)}</pre>
        `;
    }

    if (window.lucide) lucide.createIcons();
}

function formatCode() {
    const ed = document.getElementById('codeEditor');
    ed.value = ed.value.trim() + '\n';
    updateLineNumbers();
    scheduleSyntaxCheck();
}

function insertSnippet(type) {
    const ed = document.getElementById('codeEditor');
    if (type === 'print') ed.value += '\nprint("こんにちは")';
    updateLineNumbers();
    scheduleSyntaxCheck();
}

async function switchConsoleTab(tab) {
    const tabBtnOutput = document.getElementById('tabBtnOutput');
    const tabBtnDiff = document.getElementById('tabBtnDiff');
    const tabBtnAi = document.getElementById('tabBtnAi');
    const consoleBody = document.getElementById('consoleBody');

    [tabBtnOutput, tabBtnDiff, tabBtnAi].forEach(btn => {
        if (btn) btn.className = 'text-xs font-bold text-slate-400 hover:text-white pb-0.5 flex items-center gap-1';
    });

    if (tab === 'output') {
        tabBtnOutput.className = 'text-xs font-bold text-white border-b-2 border-brand-500 pb-0.5 flex items-center gap-1';
        if (lastRunState.error) {
            consoleBody.innerHTML = `<pre class="text-rose-300 font-mono whitespace-pre-wrap">${escapeHtml(lastRunState.error)}</pre>`;
        } else if (lastRunState.output) {
            consoleBody.innerHTML = `<pre class="text-slate-200 font-mono whitespace-pre-wrap">${escapeHtml(lastRunState.output)}</pre>`;
        } else {
            consoleBody.innerHTML = `<span class="text-slate-400">実行結果がここに表示されます。</span>`;
        }
    } else if (tab === 'diff') {
        tabBtnDiff.className = 'text-xs font-bold text-white border-b-2 border-brand-500 pb-0.5 flex items-center gap-1';
        const task = tasks.find(t => t.id === lastWorkedTaskId);
        const expected = lastRunState.expected || task?.expected || '';
        const actual = lastRunState.output || '(未実行)';
        consoleBody.innerHTML = `
            <div class="text-slate-400 font-bold mb-1">差分比較 (Diff):</div>
            <div class="text-emerald-400 whitespace-pre-wrap">+ 期待値: ${escapeHtml(expected)}</div>
            <div class="text-rose-400 whitespace-pre-wrap">- 実際の出力: ${escapeHtml(actual)}</div>
        `;
    } else if (tab === 'ai') {
        tabBtnAi.className = 'text-xs font-bold text-indigo-400 border-b-2 border-indigo-500 pb-0.5 flex items-center gap-1';
        const currentError = (lastRunState.error || '').trim();
        const isErrorAnalysis = currentError.length > 0;
        consoleBody.innerHTML = `<div class="text-indigo-400 font-bold animate-pulse">${
            isErrorAnalysis
                ? `🚨 AIがプログラムエラーを分析中... (ヒント ${currentAiHintLevel}/3)`
                : `🤖 AIエラー分析（ヒント ${currentAiHintLevel}/3）を取得中...`
        }</div>`;

        const code = document.getElementById('codeEditor').value;
        try {
            const res = await invokeRust('ask_ai_hint', {
                userCode: code,
                taskPrompt: buildCurrentAiPrompt(),
                hintLevel: currentAiHintLevel,
                errorMessage: isErrorAnalysis ? currentError : null,
                isKidMode
            });
            consoleBody.innerHTML = `
                <div class="flex items-center justify-between mb-1.5">
                    <span class="text-indigo-400 font-bold flex items-center gap-1"><i data-lucide="sparkles" class="w-3.5 h-3.5"></i> AI分析 (ヒント ${currentAiHintLevel}/3)</span>
                    ${currentAiHintLevel < 3 ? `<button onclick="nextConsoleAiHintStep()" class="px-2 py-0.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded text-[10px] font-bold">次のヒント (${currentAiHintLevel + 1}/3) ▶</button>` : ''}
                </div>
                <div class="text-slate-300 leading-relaxed">${renderAiResultHtml(res, currentError)}</div>
            `;
            checkAiConnectionStatus(false);
        } catch (e) {
            consoleBody.innerHTML = `<div class="text-rose-400">AI分析の取得に失敗しました: ${escapeHtml(e?.message || e)}</div>`;
        }
    }
    if (window.lucide) lucide.createIcons();
}

function scheduleSyntaxCheck() {
    clearTimeout(syntaxCheckTimer);
    syntaxCheckTimer = setTimeout(async () => {
        const editor = document.getElementById('codeEditor');
        const label = document.getElementById('engineVersionLabel');
        if (!editor || !label) return;

        const code = editor.value;
        try {
            const res = await invokeRust('check_python_syntax', { code });
            if (res?.has_error) {
                label.innerText = `⚠ 構文エラー: ${res.error_message || '要確認'}`;
                label.className = 'text-[10px] text-rose-400 font-mono font-bold';
            } else {
                label.innerText = '✓ 構文OK | Python Engine (Rust)';
                label.className = 'text-[10px] text-emerald-400 font-mono';
            }
        } catch (e) {
            // Tauri外ブラウザ表示時は無視
        }
    }, 450);
}