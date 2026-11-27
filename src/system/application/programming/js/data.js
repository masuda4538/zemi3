// ===================================================================
// 課題データ・多言語構文辞書・自由制作初期データ・ツアー定義
// ===================================================================

const tasks = [
    { id: 1, category: 'output', difficulty: 'easy', diffLabel: '初級', title: '課題01: helloを出力', desc: 'print関数を使って画面に文字列を出力する最初の一歩です。', time: '3分', expected: 'hello', code: `print("hello")\n`, relatedDictIds: ['print'] },
    { id: 2, category: 'output', difficulty: 'easy', diffLabel: '初級', title: '課題02: 複数行のメッセージ', desc: '複数のprint文を使って複数行の文章を画面に表示させましょう。', time: '3分', expected: "1行目\n2行目", code: `print("1行目")\nprint("2行目")\n`, relatedDictIds: ['print'] },
    { id: 3, category: 'calc', difficulty: 'easy', diffLabel: '初級', title: '課題03: 年齢を表示しよう', desc: '変数と数値を組み合わせて「ねんれいは 10さいです」と出力します。', time: '5分', expected: 'ねんれいは 10さいです', code: `# 年齢(10歳)を表示するプログラムを作ろう！\nage = 10 + 5\nprint("ねんれいは " + str(age) + "さいです")\n`, relatedDictIds: ['print', 'str'] },
    { id: 4, category: 'calc', difficulty: 'medium', diffLabel: '中級', title: '課題04: 割り勘計算ツール', desc: '合計金額と人数を変数で受け取り、1人あたりの金額を計算します。', time: '8分', expected: '1人あたり: 500円', code: `total = 1500\npeople = 3\nprint("1人あたり: " + str(total // people) + "円")\n`, relatedDictIds: ['print', 'int'] },
    { id: 5, category: 'branch', difficulty: 'medium', diffLabel: '中級', title: '課題05: 偶数・奇数の判定', desc: 'if文と余り演算子(%)を使って数字の偶数・奇数を判定します。', time: '8分', expected: '偶数です', code: `num = 10\nif num % 2 == 0:\n    print("偶数です")\nelse:\n    print("奇数です")\n`, relatedDictIds: ['print', 'if'] },
    { id: 6, category: 'branch', difficulty: 'hard', diffLabel: '上級', title: '課題06: 成績ランク判定', desc: '得点に応じて「A」「B」「C」に3分岐させるプログラムです。', time: '12分', expected: '評価: A', code: `score = 85\nif score >= 80:\n    print("評価: A")\nelif score >= 60:\n    print("評価: B")\nelse:\n    print("評価: C")\n`, relatedDictIds: ['print', 'if'] },
    { id: 7, category: 'loop', difficulty: 'medium', diffLabel: '中級', title: '課題07: 1〜5のループ出力', desc: 'for文とrange関数を使って1から5までの数値を順に出力します。', time: '10分', expected: '1\n2\n3\n4\n5', code: `for i in range(1, 6):\n    print(i)\n`, relatedDictIds: ['print', 'for'] },
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

const tourSteps = [
    { view: 'tasks', target: '#nav-tasks', title: '① 課題演習メニュー', text: '初級から上級まで、段階的なプログラミング問題を選んで挑戦できるモードだよ！' },
    { view: 'tasks', target: '#taskGrid', title: '② 課題カード一覧', text: '解きたいお題カードを選んでみよう。「使う関数」を押せば構文辞書もすぐに確認できるよ。' },
    { view: 'editor-task', target: '#codeEditor', title: '③ コードエディタ', text: 'ここにPythonのプログラムを直接書くよ！行番号も表示されて見やすくなっているよ。' },
    { view: 'editor-task', target: '#tour-run-btn', title: '④ うごかす！ボタン', text: 'プログラムが書けたらここを押そう！Rust側でPythonが実行されて下のコンソールに結果が届くよ。' },
    { view: 'editor-task', target: '#consoleBody', title: '⑤ 出力コンソール ＆ AI解説', text: '実行結果やエラーが表示されるよ。困ったときは「💡 AIの解説・ヒントを見る」ボタンから段階的なヒントをチェックしよう！' },
    { view: 'dict-view', target: '#nav-dict', title: '⑥ 多言語対応・構文辞書', text: 'printやstrの使い方がいつでも調べられるよ。PythonだけでなくJavaScriptやC言語の書き方とも比較できるんだ！' }
];