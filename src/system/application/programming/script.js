let isKidMode = true;
let isDetailOpen = false;
let activeMode = 'task';
let currentProjectKey = 'janken_game';
let currentFileKey = 'main.py';
const navigationHistoryStack = [];
let lastWorkedTaskId = 3;
const userTaskCodes = {};
let currentSelectedLang = 'python';

// 直近の実行結果（差分タブ・AI解説・履歴用）
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

const tasks = [
    { id: 1, category: 'output', difficulty: 'easy', diffLabel: '初級', title: '課題01: helloを出力', desc: 'print関数を使って画面に文字列を出力する最初の一歩です。', time: '3分', expected: 'hello', code: `print("hello")\n`, relatedDictIds: ['print'] },
    { id: 2, category: 'output', difficulty: 'easy', diffLabel: '初級', title: '課題02: 複数行のメッセージ', desc: '複数のprint文を使って複数行の文章を画面に表示させましょう。', time: '3分', expected: "1行目\n2行目", code: `print("1行目")\nprint("2行目")\n`, relatedDictIds: ['print'] },
    { id: 3, category: 'calc', difficulty: 'easy', diffLabel: '初級', title: '課題03: 年齢を表示しよう', desc: '変数と数値を組み合わせて「ねんれいは 10さいです」と出力します。', time: '5分', expected: 'ねんれいは 10さいです', code: `# 年齢(10歳)を表示するプログラムを作ろう！\nage = 10 + 5\nprint("ねんれいは " + str(age) + "さいです")\n`, relatedDictIds: ['print', 'str'] },
    { id: 4, category: 'calc', difficulty: 'medium', diffLabel: '中級', title: '課題04: 割り勘計算ツール', desc: '合計金額と人数を変数で受け取り、1人あたりの金額を計算します。', time: '8分', expected: '1人あたり: 500円', code: `total = 1500\npeople = 3\nprint("1人あたり: " + str(total // people) + "円")\n`, relatedDictIds: ['print', 'int'] },
    { id: 5, category: 'branch', difficulty: 'medium', diffLabel: '中級', title: '課題05: 偶数・奇数の判定', desc: 'if文と余り演算子(%)を使って数字の偶数・奇数を判定します。', time: '8分', expected: '偶数です', code: `num = 10\nif num % 2 == 0:\n    print("偶数です")\nelse:\n    print("奇数です")\n`, relatedDictIds: ['print', 'if'] },
    { id: 6, category: 'branch', difficulty: 'hard', diffLabel: '上級', title: '課題06: 成績ランク判定', desc: '得点に応じて「A」「B」「C」に3分岐させるプログラムです。', time: '12分', expected: '評価: A', code: `score = 85\nif score >= 80:\n    print("評価: A")\nelif score >= 60:\n    print("評価: B")\nelse:\n    print("評価: C")\n`, relatedDictIds: ['print', 'if'] },
    { id: 7, category: 'loop', difficulty: 'medium', diffLabel: '中級', title: '課題07: 1〜10のループ出力', desc: 'for文とrange関数を使って1から10までの数値を順に出力します。', time: '10分', expected: '1\n2\n3\n4\n5', code: `for i in range(1, 6):\n    print(i)\n`, relatedDictIds: ['print', 'for'] },
    { id: 8, category: 'loop', difficulty: 'hard', diffLabel: '上級', title: '課題08: リストの合計値計算', desc: 'リスト内の数値をループで足し合わせ、合計値を算出します。', time: '15分', expected: '合計: 60', code: `numbers = [10, 20, 30]\ntotal = 0\nfor n in numbers:\n    total += n\nprint("合計: " + str(total))\n`, relatedDictIds: ['print', 'for'] }
];

const dictionaryData = [
    {
        id: 'print',
        category: 'io',
        summary: '画面に文字や計算結果を出す',
        desc: 'カッコの中に入れた文字列や数値、計算結果を画面（コンソール）に出力します。',
        langs: {
            python: { name: 'print() 関数', kana: 'プリント', syntax: 'print("表示したい文字")', example: 'print("こんにちは")\n# 出力: こんにちは', snippet: 'print("こんにちは")', note: '末尾に自動で改行がつきます。セミコロンは不要です。' },
            javascript: { name: 'console.log()', kana: 'コンソール・ログ', syntax: 'console.log("表示したい文字");', example: 'console.log("こんにちは");\n// 出力: こんにちは', snippet: 'console.log("こんにちは");', note: 'ブラウザやNode.jsでコンソールに出力します。末尾にセミコロン(;)が標準です。' },
            c: { name: 'printf() 関数', kana: 'プリント・エフ', syntax: 'printf("フォーマット文字列\\n", 値);', example: '#include <stdio.h>\nprintf("こんにちは\\n");', snippet: 'printf("こんにちは\\n");', note: '#include <stdio.h> が必須。改行には \\n が必要です。' }
        },
        relatedTaskIds: [1, 2],
        isFavorite: true
    },
    {
        id: 'input',
        category: 'io',
        summary: 'キーボードから文字を受け取る',
        desc: 'ユーザーがキーボードで打ち込んだテキストを受け取って変数に保存します。',
        langs: {
            python: { name: 'input() 関数', kana: 'インプット', syntax: 'name = input("お名前は？")', example: 'age = input("年齢を入れてね: ")\nprint(age + "歳ですね")', snippet: 'name = input("お名前は？: ")', note: '入力された値は常に「文字列(str)」型になります。' },
            javascript: { name: 'prompt()', kana: 'プロンプト', syntax: 'let name = prompt("お名前は？");', example: 'let age = prompt("年齢を入れてね:");\nconsole.log(age + "歳ですね");', snippet: 'let name = prompt("お名前は？:");', note: 'ブラウザでは prompt() ダイアログで入力できます。' },
            c: { name: 'scanf() 関数', kana: 'スキャン・エフ', syntax: 'scanf("%d", &変数名);', example: 'int age;\nscanf("%d", &age);', snippet: 'scanf("%d", &age);', note: '変数のアドレス（&変数名）を指定します。' }
        },
        relatedTaskIds: [],
        isFavorite: false
    },
    {
        id: 'str',
        category: 'types',
        summary: '数字を文字の仲間に変換する',
        desc: '数値を文字列データに変換して文字同士をつなげられるようにします。',
        langs: {
            python: { name: 'str() 関数', kana: 'ストリング', syntax: 'str(数値データ)', example: 'age = 10\nprint("年齢は " + str(age) + "歳")', snippet: 'str(10)', note: 'Pythonは文字と数値を自動で連結できないため str() が必要です。' },
            javascript: { name: 'String() / .toString()', kana: 'ストリング', syntax: 'String(数値)', example: 'let age = 10;\nconsole.log("年齢は " + String(age) + "歳");', snippet: 'String(10)', note: 'JSは暗黙の型変換があるため "年齢は " + age でも動作します。' },
            c: { name: 'sprintf() 関数', kana: 'エス・プリント・エフ', syntax: 'sprintf(char配列, "%d", 数値);', example: 'char buf[16];\nsprintf(buf, "%d", 10);', snippet: 'sprintf(buf, "%d", 10);', note: '文字配列（バッファ）を用意して数値を書き込みます。' }
        },
        relatedTaskIds: [3, 4],
        isFavorite: true
    },
    {
        id: 'int',
        category: 'types',
        summary: '文字を整数の仲間に変換する',
        desc: '文字列の数字を、計算ができる整数の数値データに変換します。',
        langs: {
            python: { name: 'int() 関数', kana: 'イント', syntax: 'int("100")', example: 'num = int("50") + 10\nprint(num) # 出力: 60', snippet: 'int("100")', note: '小数を整数に丸める（切り捨て）際にも使います。' },
            javascript: { name: 'parseInt() / Number()', kana: 'パース・イント', syntax: 'parseInt("100", 10)', example: 'let num = parseInt("50", 10) + 10;\nconsole.log(num); // 60', snippet: 'parseInt("100", 10)', note: '第2引数に基数（10進数なら10）を指定するのが安全です。' },
            c: { name: 'atoi() 関数', kana: 'エー・トゥー・アイ', syntax: 'atoi("100")', example: '#include <stdlib.h>\nint num = atoi("50") + 10;', snippet: 'atoi("100")', note: '<stdlib.h> が必要です。' }
        },
        relatedTaskIds: [4],
        isFavorite: false
    },
    {
        id: 'if',
        category: 'syntax',
        summary: '条件によって動きを分岐させる',
        desc: '「もし〜なら」という条件判定を行います。',
        langs: {
            python: { name: 'if / elif / else', kana: 'イフ / エルイフ / エルス', syntax: 'if 条件式:\n    処理\nelif 別の条件:\n    処理\nelse:\n    処理', example: 'score = 80\nif score >= 70:\n    print("合格！")\nelse:\n    print("もう一息！")', snippet: 'if score >= 70:\n    print("合格！")\nelse:\n    print("もう一息！")', note: 'カッコは任意。末尾コロン(:)とインデントで表現します。' },
            javascript: { name: 'if / else if / else', kana: 'イフ / エルス・イフ', syntax: 'if (条件式) {\n    処理;\n} else {\n    処理;\n}', example: 'let score = 80;\nif (score >= 70) {\n    console.log("合格！");\n} else {\n    console.log("もう一息！");\n}', snippet: 'if (score >= 70) {\n    console.log("合格！");\n}', note: '条件式を丸括弧 () で囲み、処理を波括弧 {} で囲みます。' },
            c: { name: 'if / else if / else', kana: 'イフ / エルス・イフ', syntax: 'if (条件式) {\n    処理;\n} else {\n    処理;\n}', example: 'int score = 80;\nif (score >= 70) {\n    printf("合格！\\n");\n}', snippet: 'if (score >= 70) {\n    printf("合格！\\n");\n}', note: '型宣言（int score;）と各行末のセミコロンが必須です。' }
        },
        relatedTaskIds: [5, 6],
        isFavorite: true
    },
    {
        id: 'for',
        category: 'syntax',
        summary: '決められた回数だけ繰り返す',
        desc: '指定した回数分だけ同じ処理を連続して実行します。',
        langs: {
            python: { name: 'for文 / range()', kana: 'フォー / レンジ', syntax: 'for i in range(回数):\n    繰り返す処理', example: 'for i in range(3):\n    print("やっほー")', snippet: 'for i in range(3):\n    print("こんにちは")', note: 'range(3) は 0, 1, 2 の3回繰り返します。' },
            javascript: { name: 'for (初期化; 条件; 加算)', kana: 'フォー文', syntax: 'for (let i = 0; i < 回数; i++) {\n    処理;\n}', example: 'for (let i = 0; i < 3; i++) {\n    console.log("やっほー");\n}', snippet: 'for (let i = 0; i < 3; i++) {\n    console.log("こんにちは");\n}', note: 'カウンター変数 i の初期化、終了条件、増分を1行で定義します。' },
            c: { name: 'for (初期化; 条件; 加算)', kana: 'フォー文', syntax: 'for (int i = 0; i < 回数; i++) {\n    処理;\n}', example: 'for (int i = 0; i < 3; i++) {\n    printf("やっほー\\n");\n}', snippet: 'for (int i = 0; i < 3; i++) {\n    printf("こんにちは\\n");\n}', note: 'C99規格以降ならループ内で int i = 0 と宣言可能です。' }
        },
        relatedTaskIds: [7, 8],
        isFavorite: false
    }
];

let selectedDictCategory = 'all';
let showFavoritesOnly = false;
let selectedCategory = 'all';
let selectedDifficulty = 'all';

const projectsData = {
    'janken_game': {
        name: 'janken_game',
        desc: 'じゃんけんの手を判定して勝敗を出すミニゲームプログラム。',
        updated: '2026/11/16 10:15',
        files: {
            'main.py': `# [main.py] じゃんけんゲーム\nimport random\n\nuser_hand = "グー"\ncpu_hand = random.choice(["グー", "チョキ", "パー"])\nprint(f"あなた: {user_hand} / CPU: {cpu_hand}")\nif user_hand == cpu_hand:\n    print("結果: あいこ")\nelse:\n    print("結果: 勝負あり！")\n`,
            'rules.py': `# [rules.py] 勝敗判定ルール\ndef judge(u, c):\n    if u == c:\n        return "あいこ"\n    return "勝ち！"\n`
        }
    },
    'calc_tool': {
        name: 'calc_tool',
        desc: '税込み計算や割り勘計算を行う計算スクリプト集。',
        updated: '2026/11/15 16:30',
        files: {
            'main.py': `# [main.py] 計算ツール\nprice = 1000\nprint("税込: " + str(int(price * 1.1)) + "円")\n`,
            'math_utils.py': `# [math_utils.py]\ndef calc(p):\n    return int(p * 1.1)\n`
        }
    }
};

// ===================================================================
// Tauri v2 (Rust バックエンド) 通信ヘルパー
// ===================================================================
async function invokeRust(cmd, args = {}) {
    const tauriInvoke = window.__TAURI__?.core?.invoke;
    if (typeof tauriInvoke !== 'function') {
        throw new Error('Tauri バックエンドに接続できません（cargo run で起動したウィンドウ内で実行してください）。');
    }
    return await tauriInvoke(cmd, args);
}

function escapeHtml(str) {
    return String(str ?? '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
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

// ===================================================================
// 使い方ガイドツアー
// ===================================================================
const tourSteps = [
    {
        view: 'tasks',
        target: '#nav-tasks',
        title: '① 課題演習メニュー',
        text: '初級から上級まで、段階的なプログラミング問題を選んで挑戦できるモードだよ！'
    },
    {
        view: 'tasks',
        target: '#taskGrid',
        title: '② 課題カード一覧',
        text: '解きたいお題カードを選んでみよう。「使う関数」を押せば構文辞書もすぐに確認できるよ。'
    },
    {
        view: 'editor-task',
        target: '#codeEditor',
        title: '③ コードエディタ',
        text: 'ここにPythonのプログラムを直接書くよ！行番号も表示されて見やすくなっているよ。'
    },
    {
        view: 'editor-task',
        target: '#tour-run-btn',
        title: '④ うごかす！ボタン',
        text: 'プログラムが書けたらここを押そう！Rust側でPythonが実行されて下のコンソールに結果が届くよ。'
    },
    {
        view: 'editor-task',
        target: '#consoleBody',
        title: '⑤ 出力コンソール ＆ AI解説',
        text: '実行結果が表示されるよ。間違えたときは「💡 AIの解説を見る」ボタンからヒントをチェックしよう！'
    },
    {
        view: 'dict-view',
        target: '#nav-dict',
        title: '⑥ 多言語対応・構文辞書',
        text: 'printやstrの使い方がいつでも調べられるよ。PythonだけでなくJavaScriptやC言語の書き方とも比較できるんだ！'
    }
];

let currentTourIndex = 0;

function startTour() {
    currentTourIndex = 0;
    document.getElementById('tourBackdrop').classList.remove('hidden');
    document.getElementById('tourCard').classList.remove('hidden');
    renderTourStep();
}

function renderTourStep() {
    const step = tourSteps[currentTourIndex];

    if (step.view) {
        if (step.view === 'editor-task' && getCurrentVisibleView() !== 'editor-task') {
            selectTask(lastWorkedTaskId, false);
        } else if (step.view !== getCurrentVisibleView()) {
            switchView(step.view, false);
        }
    }

    setTimeout(() => {
        const targetEl = document.querySelector(step.target);
        const card = document.getElementById('tourCard');

        document.getElementById('tourStepBadge').innerText = `Step ${currentTourIndex + 1}/${tourSteps.length}`;
        document.getElementById('tourTitle').innerHTML = step.title;
        document.getElementById('tourText').innerText = step.text;

        document.getElementById('tourPrevBtn').style.visibility = (currentTourIndex === 0) ? 'hidden' : 'visible';
        document.getElementById('tourNextBtn').innerText = (currentTourIndex === tourSteps.length - 1) ? 'ツアーを完了する' : '次へ ▶';

        document.querySelectorAll('.tour-highlight').forEach(el => {
            el.classList.remove('tour-highlight');
        });

        if (targetEl) {
            targetEl.classList.add('tour-highlight');
            targetEl.scrollIntoView({ behavior: 'smooth', block: 'nearest' });

            const rect = targetEl.getBoundingClientRect();
            const cardWidth = 320;
            const cardHeight = card.offsetHeight || 180;

            let top = 0;
            let left = 0;

            if (step.target === '#codeEditor') {
                top = rect.top + 24;
                left = rect.right - cardWidth - 24;
            } else if (step.target === '#tour-run-btn') {
                top = rect.bottom + 14;
                left = rect.left - 40;
            } else if (step.target === '#consoleBody') {
                top = rect.top - cardHeight - 16;
                left = rect.left + 24;
            } else if (step.target.startsWith('#nav-')) {
                top = rect.top - 10;
                left = rect.right + 18;
            } else {
                top = rect.bottom + 12;
                left = rect.left;
                if (top + cardHeight > window.innerHeight) {
                    top = rect.top - cardHeight - 12;
                }
            }

            if (left + cardWidth > window.innerWidth - 16) left = window.innerWidth - cardWidth - 16;
            if (left < 16) left = 16;
            if (top < 16) top = 16;
            if (top + cardHeight > window.innerHeight - 16) top = window.innerHeight - cardHeight - 16;

            card.style.top = `${top}px`;
            card.style.left = `${left}px`;
        }

        if (window.lucide) lucide.createIcons();
    }, 150);
}

function nextTourStep() {
    if (currentTourIndex < tourSteps.length - 1) {
        currentTourIndex++;
        renderTourStep();
    } else {
        endTour();
    }
}

function prevTourStep() {
    if (currentTourIndex > 0) {
        currentTourIndex--;
        renderTourStep();
    }
}

function endTour() {
    document.getElementById('tourBackdrop').classList.add('hidden');
    document.getElementById('tourCard').classList.add('hidden');
    document.querySelectorAll('.tour-highlight').forEach(el => {
        el.classList.remove('tour-highlight');
    });
    try {
        localStorage.setItem('codelab_tour_done', 'true');
    } catch (e) {}
}

// ===================================================================
// エディタ表示設定（行番号・文字サイズ・設定保存）
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
    if (editorPreferences.showLineNumbers) {
        lineNumbers.classList.remove('hidden-lines');
    } else {
        lineNumbers.classList.add('hidden-lines');
    }
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
        } catch (e) {
            console.warn('LocalStorage save error:', e);
        }
    }

    renderDictCards();
    renderSideDictCards();
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
        } catch (e) {
            console.warn('LocalStorage save error:', e);
        }
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

// ===================================================================
// レイアウト制御
// ===================================================================
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
    } catch (e) {
        console.warn('LocalStorage save error:', e);
    }
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

// ===================================================================
// 画面遷移
// ===================================================================
function switchView(view, pushHistory = true) {
    if (getCurrentVisibleView() === 'editor-task' && lastWorkedTaskId) {
        userTaskCodes[lastWorkedTaskId] = document.getElementById('codeEditor').value;
        try {
            localStorage.setItem('codelab_task_codes', JSON.stringify(userTaskCodes));
            localStorage.setItem('codelab_last_task', lastWorkedTaskId.toString());
        } catch (e) {}
    } else if (getCurrentVisibleView() === 'editor-free') {
        const proj = projectsData[currentProjectKey];
        if (proj && currentFileKey) {
            proj.files[currentFileKey] = document.getElementById('codeEditor').value;
        }
    }

    const currentVisible = getCurrentVisibleView();

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

    document.getElementById('view-tasks-container').classList.add('hidden');
    document.getElementById('view-projects-container').classList.add('hidden');
    document.getElementById('view-dict-container').classList.add('hidden');
    document.getElementById('view-editor-container').classList.add('hidden');
    document.getElementById('view-history-container').classList.add('hidden');
    document.getElementById('view-settings-container').classList.add('hidden');

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

// ===================================================================
// 辞書ビュー
// ===================================================================
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

function renderResumeTaskCard() {
    const task = tasks.find(t => t.id === lastWorkedTaskId) || tasks[2];
    document.getElementById('resumeTaskTitle').innerText = task.title;
    document.getElementById('resumeTaskDesc').innerText = task.desc;
}

function resumeLastTask() {
    selectTask(lastWorkedTaskId);
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
                    <button onclick="jumpToTaskFromDict(${tObj.id}, event)" class="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-blue-50 hover:bg-blue-100 dark:bg-blue-950/50 dark:hover:bg-blue-900/60 text-blue-600 dark:text-blue-300 border border-blue-200 dark:border-blue-800 transition-colors" title="「${tObj.title}」を解く">
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
                        <h3 class="font-extrabold text-sm text-slate-900 dark:text-white font-mono card-func-title">${currentLangData.name}</h3>
                        ${isKidMode ? `<span class="text-[10px] text-slate-400">(${currentLangData.kana})</span>` : ''}
                    </div>
                    <p class="text-xs font-bold text-indigo-600 dark:text-indigo-400 mt-0.5">【${item.summary}】</p>
                </div>
                <p class="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">${item.desc}</p>
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
                    <code class="card-syntax-code leading-relaxed">${escapeHtml(currentLangData.example)}</code>
                </div>

                <p class="text-[10px] text-amber-600 dark:text-amber-400/90 font-medium card-syntax-note">
                    💡 [${currentSelectedLang.toUpperCase()}] ${currentLangData.note}
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
                <span class="font-bold text-xs text-brand-600 dark:text-brand-400 font-mono">${currentLangData.name}</span>
                ${taskLinkHtml}
            </div>
            <div class="p-1.5 rounded bg-slate-900 text-slate-200 font-mono text-[10px]">
                <code>${escapeHtml(currentLangData.example.split('\n')[0])}</code>
            </div>
            <div class="text-[9px] text-slate-400">
                【${item.summary}】 (${currentSelectedLang.toUpperCase()})
            </div>
        `;
        container.appendChild(card);
    });
    if (window.lucide) lucide.createIcons();
}

// ===================================================================
// 課題一覧・課題選択
// ===================================================================
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
                    <button onclick="jumpToDictFromTaskCard('${dId}', event)" class="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[9px] font-bold bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-950/60 dark:hover:bg-indigo-900/60 text-indigo-600 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 transition-colors" title="辞書を見る: ${label}">
                        <i data-lucide="book-open" class="w-2.5 h-2.5 text-indigo-500"></i>
                        <span>${label}</span>
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
                <h3 class="font-bold text-xs text-slate-900 dark:text-white mb-1">${task.title}</h3>
                <p class="text-[11px] text-slate-500 line-clamp-2">${task.desc}</p>
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

    switchView('editor-task');
    updateLineNumbers();
    scheduleSyntaxCheck();
}

// ===================================================================
// 自由制作プロジェクト
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
                        <i data-lucide="folder" class="w-4 h-4 fill-brand-500/20"></i> ${proj.name}
                    </span>
                    <button onclick="event.stopPropagation(); deleteFolder('${key}')" class="opacity-0 group-hover:opacity-100 p-1 text-slate-400 hover:text-rose-500 transition-opacity" title="フォルダを削除">
                        <i data-lucide="trash-2" class="w-3.5 h-3.5"></i>
                    </button>
                </div>
                <p class="text-xs text-slate-500 line-clamp-2">${proj.desc}</p>
            </div>
            <div>
                <div class="text-[10px] text-slate-400 font-mono mb-2 flex items-center justify-between">
                    <span>ファイル: ${Object.keys(proj.files).length}件</span>
                    <span>${proj.updated}</span>
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

    document.getElementById('activeProjectBreadcrumb').innerText = `${proj.name} / ${firstFile}`;
    document.getElementById('currentProjectTreeLabel').innerText = proj.name.toUpperCase();
    document.getElementById('codeEditor').value = proj.files[firstFile] || '';
    document.getElementById('currentEditorFileName').innerHTML = `<i data-lucide="terminal" class="w-3.5 h-3.5 text-brand-500"></i> ${firstFile}`;
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
            <span class="flex items-center gap-1.5"><i data-lucide="file" class="w-3.5 h-3.5"></i>${f}</span>
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
    document.getElementById('currentEditorFileName').innerHTML = `<i data-lucide="terminal" class="w-3.5 h-3.5 text-brand-500"></i> ${f}`;
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

// ===================================================================
// Rust バックエンド連携：実行・自動採点・構文チェック・AIヒント
// ===================================================================
async function runCode() {
    const code = document.getElementById('codeEditor').value;
    const consoleBody = document.getElementById('consoleBody');
    const aiText = document.getElementById('aiAdviceText');

    // 出力タブをアクティブに戻す
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
                aiText.innerHTML = `
                    すばらしい！期待通りの結果が出せたね。<br>
                    次の課題にも挑戦してみよう！
                `;
                appendHistoryRow(task.title, '合格', 'bg-emerald-100 text-emerald-800', '期待値と完全一致');
            } else {
                const isRuntimeErr = Boolean(errMsg);
                const relatedKey = (task.relatedDictIds && task.relatedDictIds[0]) ? task.relatedDictIds[0] : 'print';

                consoleBody.innerHTML = `
                    <div class="${isRuntimeErr ? 'text-rose-400' : 'text-amber-400'} font-bold mb-1">
                        ${isRuntimeErr ? '❌ 実行エラーが発生しました' : `🤔 期待した結果と少しちがうみたい！（${escapeHtml(score)}点）`}
                    </div>
                    <div class="text-slate-400">出力結果: <span class="text-rose-400 font-bold whitespace-pre-wrap">${escapeHtml(actualOut || '(出力なし)')}</span></div>
                    <div class="text-slate-400">期待される結果: <span class="text-emerald-400 font-bold whitespace-pre-wrap">${escapeHtml(expectedOut)}</span></div>
                    ${errMsg ? `<pre class="mt-2 text-rose-300 whitespace-pre-wrap">${escapeHtml(errMsg)}</pre>` : ''}

                    <div class="mt-3 pt-2.5 border-t border-slate-800 flex items-center gap-2 flex-wrap">
                        <button onclick="openAiHelpFromConsole()" class="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 shadow-sm transition-transform active:scale-95">
                            <i data-lucide="sparkles" class="w-3.5 h-3.5"></i>
                            <span>💡 AIの解説・ヒントを見る</span>
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
                await fetchAiHintIntoPanel(code, `${task.title}: ${task.desc}\n期待される出力: ${task.expected}`);
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
                    <div class="text-rose-400 font-bold mb-1">❌ 実行エラー (プロジェクト: ${escapeHtml(currentProjectKey)})</div>
                    ${outText ? `<pre class="text-slate-300 font-mono whitespace-pre-wrap mb-2">${escapeHtml(outText)}</pre>` : ''}
                    <pre class="text-rose-300 font-mono whitespace-pre-wrap">${escapeHtml(errText)}</pre>
                `;
                await fetchAiHintIntoPanel(code, `自由制作 (${currentFileKey}) のエラー:\n${errText}`);
            } else {
                consoleBody.innerHTML = `
                    <div class="text-emerald-400 font-bold mb-1">✔ 実行が完了しました (プロジェクト: ${escapeHtml(currentProjectKey)})</div>
                    <pre class="text-slate-200 font-mono whitespace-pre-wrap">${escapeHtml(outText || '(出力なし)')}</pre>
                `;
                aiText.innerHTML = `
                    正常に実行できたね！新しい処理を追加したり、別のファイルに分けてみよう！
                `;
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

async function fetchAiHintIntoPanel(userCode, taskPrompt) {
    const aiText = document.getElementById('aiAdviceText');
    if (!aiText) return;
    aiText.innerHTML = `<span class="text-indigo-500 font-bold">AIがコードを分析中...</span>`;
    try {
        const res = await invokeRust('ask_ai_hint', {
            userCode,
            taskPrompt,
            hintLevel: 1
        });
        const hint = res?.hint || (typeof res === 'string' ? res : '');
        if (hint) {
            aiText.innerHTML = escapeHtml(hint).replace(/\n/g, '<br>');
            return;
        }
    } catch (e) {
        // Ollama 未起動・エラー時はフォールバック
    }
    aiText.innerHTML = `
        計算式や文字列のつなぎ方、スペース・改行が<strong>期待される出力</strong>と一致しているか見直してみよう！
    `;
}

async function openAiHelpFromConsole() {
    const task = tasks.find(t => t.id === lastWorkedTaskId);
    const code = document.getElementById('codeEditor').value;
    await fetchAiHintIntoPanel(
        code,
        task ? `${task.title}: ${task.desc}\n期待される出力: ${task.expected}` : '自由制作'
    );

    if (layoutConfig.aiPos === 'bottom') {
        switchConsoleTab('ai');
    } else {
        if (!isDetailOpen) toggleDetailPanel();
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
        consoleBody.innerHTML = `<div class="text-indigo-400 font-bold">🤖 AIエラー分析を取得中...</div>`;
        const task = tasks.find(t => t.id === lastWorkedTaskId);
        const code = document.getElementById('codeEditor').value;
        try {
            const res = await invokeRust('ask_ai_hint', {
                userCode: code,
                taskPrompt: task ? `${task.title}: ${task.desc}\n期待される出力: ${task.expected}` : '自由制作',
                hintLevel: 1
            });
            const hint = res?.hint || '計算式や出力内容が期待値と合っているか確認してみよう！';
            consoleBody.innerHTML = `
                <div class="text-indigo-400 font-bold mb-1 flex items-center gap-1"><i data-lucide="sparkles" class="w-3.5 h-3.5"></i> AIエラー分析:</div>
                <div class="text-slate-300 whitespace-pre-wrap">${escapeHtml(hint)}</div>
            `;
        } catch (e) {
            consoleBody.innerHTML = `<div class="text-rose-400">AI分析の取得に失敗しました: ${escapeHtml(e?.message || e)}</div>`;
        }
    }
    if (window.lucide) lucide.createIcons();
}

function openFileAction() {
    alert("【ファイル操作】\n・左のファイルツリーから新規作成・切替ができます\n・編集内容は自動保存されます");
}

// 入力時の随時構文チェック（Rust check_python_syntax 連携）
let syntaxCheckTimer = null;
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
            // Tauri外で開いた場合は無視
        }
    }, 450);
}

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
    if (window.lucide) lucide.createIcons();
    switchView('tasks');
    renderSideDictCards();
    renderDynamicLayout();
    updateLineNumbers();

    try {
        const tourDone = localStorage.getItem('codelab_tour_done');
        if (!tourDone) {
            setTimeout(startTour, 400);
        }
    } catch (e) {}
};