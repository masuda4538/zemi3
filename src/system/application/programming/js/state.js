// ===================================================================
// 共有状態変数 & Tauri v2 通信・共通ユーティリティ
// ===================================================================

let isKidMode = true;
let isDetailOpen = false;
let activeMode = 'task';
let currentProjectKey = 'janken_game';
let currentFileKey = 'main.py';
const navigationHistoryStack = [];
let lastWorkedTaskId = 3;
const userTaskCodes = {};
let currentSelectedLang = 'python';

let selectedDictCategory = 'all';
let showFavoritesOnly = false;
let selectedCategory = 'all';
let selectedDifficulty = 'all';

// AI 段階的ヒント管理（1: 着眼点/エラー翻訳 -> 2: 原因・考え方 -> 3: 具体的な修正コード）
let currentAiHintLevel = 1;
let aiHintFetchedForCurrentRun = false;

// 直近の実行結果（差分タブ・AIエラー分析・履歴用）
let lastRunState = {
    code: '',
    output: '',
    expected: '',
    passed: false,
    error: ''
};

let editorPreferences = {
    showLineNumbers: true,
    fontSize: 'medium'
};

let layoutConfig = {
    taskPos: 'right',
    aiPos: 'right',
    dictPos: 'right'
};

// 共通の呼び出し関数
async function invokeRust(cmd, args = {}) {
    // 1. ゼミ共通基盤の app.invoke があれば優先して使用
    if (window.app && typeof window.app.invoke === 'function') {
        return await window.app.invoke(cmd, args);
    }
    // 2. 単独起動・フォールバック用 (Tauri v2 標準)
    if (window.__TAURI__?.core?.invoke) {
        return await window.__TAURI__.core.invoke(cmd, args);
    }
    throw new Error('Rust バックエンドに接続できません。zemi3 の npm run tauri dev から開いてください。');
}

function escapeHtml(str) {
    return String(str ?? '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

function formatHintMarkdown(text) {
    return escapeHtml(text)
        .replace(/```python\s*([\s\S]*?)```/g, '<pre class="bg-slate-900 text-emerald-300 p-2 rounded my-1.5 font-mono text-[11px] overflow-x-auto whitespace-pre-wrap">$1</pre>')
        .replace(/```([\s\S]*?)```/g, '<pre class="bg-slate-900 text-slate-200 p-2 rounded my-1.5 font-mono text-[11px] overflow-x-auto whitespace-pre-wrap">$1</pre>')
        .replace(/\*\*(.*?)\*\*/g, '<strong class="text-slate-900 dark:text-white">$1</strong>')
        .replace(/`([^`]+)`/g, '<code class="bg-slate-200 dark:bg-slate-800 px-1 py-0.5 rounded text-brand-600 dark:text-brand-400 font-mono font-bold">$1</code>')
        .replace(/\n/g, '<br>');
}

function resetLastRunState() {
    lastRunState = {
        code: '',
        output: '',
        expected: '',
        passed: false,
        error: ''
    };
}

function appendHistoryRow(taskTitle, statusText, badgeClass, memoText) {
    const tbody = document.querySelector('#view-history-container tbody');
    if (!tbody) return;
    const now = new Date();
    const stamp = `${now.getFullYear()}/${String(now.getMonth() + 1).padStart(2, '0')}/${String(now.getDate()).padStart(2, '0')} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
    const tr = document.createElement('tr');
    tr.innerHTML = `
        <td class="py-2.5 font-mono">${escapeHtml(stamp)}</td>
        <td>${escapeHtml(taskTitle)}</td>
        <td><span class="px-1.5 py-0.5 rounded ${badgeClass} text-[10px] font-bold">${escapeHtml(statusText)}</span></td>
        <td>${escapeHtml(memoText)}</td>
    `;
    tbody.prepend(tr);
}