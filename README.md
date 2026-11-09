# 卒業研究アプリ

Tauri 2 + React（JavaScript）+ Rust で作るデスクトップアプリです。
起動すると起動画面（ログイン・新規登録）が出て、ログインするとホームが開きます。
左のサイドバーで「ホーム・プログラム学習・情報収集・デジタル図鑑・問題作成」、左下で「設定・アカウント」を切り替えます。

## 起動する

環境構築（setup-kit）が終わった PC で、VS Code を WSL（Ubuntu-24.04）につないでから実行します。

```bash
cd ~/projects/tauri-app
npm ci              # 初回と、package-lock.json が変わったときだけ
npm run tauri dev   # アプリが最大化で起動する（初回は Rust のビルドで数分かかる）
```

## ログインとデータ（今はデータベースなし）

- **今はデータベースを使っていません。** MariaDB が止まっていても、なくても動きます。
- ログインは、何を入力しても（空のままでも）入れます。空のときは「ゲスト」になります。
- 新規登録・アカウントの変更・パスワードの変更は、アプリを閉じるまでのあいだだけ覚えています（保存しません）。
- 性別・言語と試験の一覧は `src/system/main/common/api.js` の `GENDERS`・`LANGUAGES` に書いてあります。
- あとでデータベースをつなぐときは、`src/system/main/common/api.js` の中身を Rust（`invoke`）を呼ぶ形に書きかえます。
  画面（各 `main.jsx`）は書きかえなくて大丈夫なように、関数の名前と返す形はそのままにしています。
- 設定画面の内容（テーマ・文字の大きさなど）は、その PC の中（localStorage）に保存します。
- 起動画面の黒猫は study-notes の起動画面の猫と同じ動きです（`src/system/main/login/friends.js`）。
- 画像は `public/images/` にファイルとして置き、画面からは `"/images/ファイル名"` で使います（例：`<img src="/images/logo.svg" />`）。

## フォルダーの中身

```
tauri-app/
├─ index.html
├─ package.json / package-lock.json
├─ vite.config.js
├─ vite-apps.js            … 各アプリのページを普通の Web ページとして動かす設定（さわらなくてよい）
├─ public/                  … そのまま使うファイル
│  └─ images/               … ★ 画像はここに置く（今はロゴ logo.svg）
├─ src/                     … 画面側（React）
│  ├─ main.jsx              … 起動の入口（さわらなくてよい）
│  └─ system/
│     ├─ main/              … ★ アプリの土台（ログイン・画面の組み立て・みんなで使う部品）
│     │  ├─ App.jsx         … 全体（ログイン前は起動画面、ログイン後は左のサイドバー＋右の画面）
│     │  ├─ App.css         … 全体の見た目（色・レイアウト・ホワイト／ダーク）
│     │  ├─ apps.js         … 左に並ぶ項目の一覧（名前・アイコン・色・読み込むフォルダー）
│     │  ├─ config.js       … アプリ名・ロゴの画像・キャッチコピー
│     │  ├─ login/          … 起動画面（ログイン・新規登録・黒猫たち）
│     │  │                    main.jsx・login.js・login.css・friends.js・friends.css
│     │  ├─ frame/          … 各アプリの窓の中で使う app（bridge.js）と共通の見た目（frame.css）
│     │  ├─ components/     … みんなで使う部品（サイドバー・アイコン・入力フォーム・確認画面・言語の選択）
│     │  └─ common/         … みんなで使う処理（api.js：アカウントのデータ。今は仮／validate.js：入力チェック）
│     └─ application/       … ★ 各アプリの画面（担当者ごとにフォルダーを分ける）
│        ├─ home/           … ホーム（中の形はほかのアプリと同じ）
│        ├─ programming/    … プログラム学習（見本：レッスン一覧・できたチェック・Rust で FizzBuzz）
│        │  ├─ main.html        画面の入口（いちばん外はこれだけ。名前と場所は変えない）
│        │  ├─ css/style.css    見た目
│        │  ├─ js/main.js       動きの中心（ボタンを押したら何をするか）
│        │  ├─ js/data.js       データ（読む・足す・探す）
│        │  ├─ js/view.js       表示（データから HTML を作る）
│        │  ├─ images/          画像
│        │  ├─ data/            JSON などのデータ（はじめから入っている中身）
│        │  ├─ rust/main.rs     Rust の窓口（JS から呼ぶ関数を登録。名前と場所は変えない）
│        │  ├─ rust/logic.rs    Rust の処理（main.rs から呼ぶ）
│        │  └─ achievements/achievements.js  アチーブ（無くてもよい）
│        ├─ research/       … 情報収集（同じ形。見本：メモの追加・ことばとタグで探す・Rust で URL チェック）
│        ├─ zukan/          … デジタル図鑑（同じ形。見本：カード一覧・探す・くわしく・のせる・Rust でレア度）
│        ├─ quiz/           … 問題作成（同じ形。見本：4 択を解く・問題を作る・Rust でひょうか）
│        ├─ achieve/        main.jsx・achieve.js・achieve.css・Ring.jsx … アチーブ
│        ├─ settings/       main.jsx・settings.js・settings.css      … 設定（PC の中に保存）
│        └─ account/        main.jsx・account.js・account.css        … アカウント
└─ src-tauri/               … Rust 側と Tauri の設定（tauri.conf.json）
   └─ src/
      └─ lib.rs             … 入口（各アプリの rust/main.rs を読み込む。さわらなくてよい）
```

### system の書き方

- **main** … アプリの土台です。ログイン・画面の組み立て・みんなで使う部品が入っています。
  みんなに影響するので、変えるときは声をかけてから変えます。
- **application** … 各アプリの画面です。自分の担当のフォルダーの中だけを変えます。
- アチーブ・設定・アカウントは React で作っていて、入口は `main.jsx` です（`main/apps.js` がここを読み込みます）。
- `main.jsx` … 画面（見た目）。大きくなったら、部品を別の `.jsx` に分けて `main.jsx` から import します。
- `〇〇.js` … 処理（プログラム）。計算・データの読み書き・DB や Rust の呼び出しなどを書きます。
  `export function 名前() { … }` と書くと、`.jsx` で `import { 名前 } from "./〇〇.js";` として使えます。
- `〇〇.css` … 見た目。クラス名はフォルダー名から始めます（例：`.quiz-card`）。CSS はアプリ全体で共通なので、ほかの画面とぶつからないようにするためです。
- **ホーム・プログラム学習・情報収集・デジタル図鑑・問題作成は、普通の Web ページ（HTML・CSS・JS）と Rust で作ります。**
  フォルダーの中は全部、自由に書きかえてよいです（フォルダーを作るのも自由）。いちばん外は `main.html` だけで、ほかは種類ごとのフォルダーに入れます。
  左のアイコンを押すと、フォルダー名と同じページの `main.html` が、右側の窓（iframe）の中に開きます。
  - `main.html` … 画面の入口（名前と場所だけは変えない）。普通の Web ページと同じく `<html>` `<head>` `<body>` を書き、
    CSS・JS・画像は `<link>` `<script type="module">` `<img>` で、自分でパスを書いてつなぐ（最初は `css/style.css`・`js/main.js` につないである）
  - `css/` … このページの中だけに効く（クラス名は自由）。色は `var(--primary)` など、部品は `btn` `panel` `input` が最初から使える
  - `js/` … `document.getElementById` など普通の書き方。アプリの機能は `app` から使う
    （`app.notify({ … })` お知らせ、`app.unlock("id")` アチーブ、`await app.invoke("hello", { … })` Rust、`app.open("quiz")` ページを開く）
  - `images/`・`data/` … 画像・JSON など。HTML や `fetch("./data/〇〇.json")` から使う
  - `rust/main.rs` … Rust の窓口（名前と場所だけは変えない）。`#[tauri::command]` を付けた関数を、いちばん下の `crate::commands![ ]` に並べる
  - `rust/` のほかのファイル … Rust の処理。`main.rs` に `mod 〇〇;` と書いてつなぎ、`〇〇::関数名()` で呼ぶ
  - `achievements/achievements.js` … アチーブ（名前・説明。数をためるものは `goal: 10`）。無くてもよい
  - 保存すると、そのページの窓だけが新しくなる（ログインしたまま）
  - 4 つのアプリには、動く見本が入っている。JS は「data.js（データ）→ main.js（つなぐ）→ view.js（表示）」に分けてある。
    ファイルを増やすときは `js/` に作って `main.js` から `import`、まとめたいときは中身を `main.js` に貼って `import` を消すだけ
  - 見本で足したデータは、今はアプリを閉じると消える（保存は、各アプリの `js/data.js` の中だけを書きかえれば足せる）
  - しくみ：`main/components/HtmlFolder.jsx`（窓）・`main/frame/bridge.js`（app）・`main/frame/frame.css`（共通の見た目）・`vite-apps.js`
- みんなで使う部品・処理は、`application/〇〇/` から次のように読み込みます。
  ```js
  import { Field } from "../../main/components/Form";
  import { getMe } from "../../main/common/api.js";
  ```
- HTML・CSS・JS のページを増やすときは、`src/system/application` にフォルダーを作って `main.html` を置き、`src/system/main/apps.js` に 1 行足します（`id` をフォルダー名と同じにして `load: HTML_FOLDER`）。Rust も使うときは `src-tauri/src/lib.rs` にも足します。

## GitHub の使い方

### はじめて取ってくる

```bash
cd ~/projects
git clone https://github.com/masuda4538/zemi3.git tauri-app
cd tauri-app
git switch 自分のブランチ名
npm ci
```

### 作業して上げる

```bash
git status                  # 変えたファイルを確認
git add -A
git commit -m "何をしたか"
git push
```

### ほかの人の変更を取り込む

```bash
git pull
npm ci   # package-lock.json が変わっていたら
```

### 注意

- `node_modules` と `src-tauri/target` は PC ごとに作られるので GitHub には上げません（`.gitignore` 済み）。
- `package-lock.json` と `src-tauri/Cargo.lock` は上げます（全員が同じバージョンで動くように）。
- プロジェクトは Ubuntu の中（`~/projects/tauri-app`）に置きます。Windows のデスクトップなどに置いたり、エクスプローラーでコピーしたりすると、動かなくなったり、全部のファイルが「変更あり」になったりします。
- `Permission denied` が出たときは `rm -rf node_modules src-tauri/target` をしてから `npm ci` をやり直します。
