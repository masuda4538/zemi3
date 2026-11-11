# 学習支援アプリ

Tauri 2 + React（JavaScript）+ Rust で作るデスクトップアプリです。
起動するとすぐにホームが開きます（ログインしていなくても、ゲストとして全部使えます）。
左のサイドバーで「ホーム・プログラム学習・情報収集・デジタル図鑑・問題作成」、左下で「アチーブ・設定・アカウント」を切り替えます。
ログインは左下の「アカウント」から行います。一度ログインしたら、ログアウトするまで覚えています。

## 起動する

環境構築（setup-kit）が終わった PC で、VS Code を WSL（Ubuntu-24.04）につないでから実行します。

```bash
cd ~/projects/tauri-app
npm ci              # 初回と、package-lock.json が変わったときだけ
npm run tauri dev   # アプリが最大化で起動する（初回は Rust のビルドで数分かかる）
```

## ログインとデータ（今はデータベースなし）

- **今はデータベースを使っていません。** MariaDB が止まっていても、なくても動きます。
- ログインは、ログイン ID を入れれば入れます（パスワードはまだ確かめていません）。
- ログインしている人（新規登録・アカウントの変更をふくむ）は、PC の中のファイル（AppData の `session.json`）に保存し、ログアウトすると消します。
- ログインしていないとき（ゲスト）は、アチーブを記録しません。
- 性別・言語と試験の一覧は `src/system/main/common/api.js` の `GENDERS`・`LANGUAGES` に書いてあります。
- あとでデータベースをつなぐときは、`src/system/main/common/api.js` の中身を Rust（`invoke`）を呼ぶ形に書きかえます。
  画面（各 `main.jsx`）は書きかえなくて大丈夫なように、関数の名前と返す形はそのままにしています。
- 設定画面の内容（テーマ・文字の大きさなど）は、その PC の中（AppData の `settings.json`）に保存します。
- 画像は `public/images/` にファイルとして置き、画面からは `"/images/ファイル名"` で使います（例：`<img src="/images/cat.png" />`）。

## フォルダーの中身

```
tauri-app/
├─ index.html
├─ package.json / package-lock.json
├─ vite.config.js
├─ vite-apps.js            … 各アプリのページを普通の Web ページとして動かす設定（さわらなくてよい）
├─ public/                  … そのまま使うファイル
│  └─ images/               … アプリ全体で使う画像を置く（今は空。各アプリの画像は、そのアプリのフォルダーに置く）
├─ src/                     … 画面側（React）
│  ├─ main.jsx              … 起動の入口（さわらなくてよい）
│  └─ system/
│     ├─ main/              … ★ アプリの土台（画面の組み立て・みんなで使う部品）
│     │  ├─ App.jsx         … 全体（左のサイドバー＋右の画面。ログインしている人を持つ）
│     │  ├─ App.css         … 全体の見た目（レイアウト）。色は theme.css
│     │  ├─ apps.js         … 左に並ぶ項目の一覧（名前・アイコン・色・読み込むフォルダー）
│     │  ├─ config.js       … アプリ名
│     │  ├─ frame/          … 各アプリの窓の中で使う app（bridge.js）と共通の見た目（frame.css）
│     │  ├─ components/     … みんなで使う部品（アイコン・入力フォーム・確認画面・窓・出すボタン など）
│     │  └─ common/         … みんなで使う処理（api.js：アカウントのデータ。今は仮／validate.js：入力チェック）
│     ├─ pages/             … アチーブ・設定・アカウントの画面（React。さわらない）
│     │  ├─ achieve/        main.jsx・achieve.js・achieve.css・Ring.jsx … アチーブ
│     │  ├─ settings/       main.jsx・settings.js・settings.css・ShortcutEditor.jsx … 設定（PC の中に保存）
│     │  └─ account/        main.jsx・LoginForm.jsx・register.js・account.js・account.css … アカウント・ログイン・新規登録
│     ├─ sidebar/           … 左のサイドバー（普通の HTML・CSS・JS。窓の中に出す）
│     ├─ achieve_setting/   … ★ 各ページのアチーブ（1 ページ 1 ファイル。自分の担当のファイルだけ書きかえる）
│     │  ├─ home.js  programming.js  research.js  zukan.js  quiz.js   … 各アプリ
│     │  └─ achieve.js  settings.js  account.js                     … アチーブ・設定・アカウント
│     └─ application/       … ★ 各アプリの画面（担当者ごとにフォルダーを分ける）
│        ├─ home/           … ホーム（作り方の見本）
│        │  ├─ index.html       画面の入口（名前と場所は変えない）
│        │  ├─ css/style.css    見た目
│        │  ├─ js/main.js       動き
│        │  ├─ images/  data/   画像・データ
│        │  ├─ rust/main.rs     Rust の窓口（JS から呼ぶ関数を登録）
│        │  └─ rust/logic.rs    Rust の処理（main.rs から呼ぶ）
│        ├─ programming/    … プログラム学習（今は index.html だけ。中は担当者が自由に作る）
│        ├─ research/       … 情報収集（同上）
│        ├─ zukan/          … デジタル図鑑（同上）
│        └─ quiz/           … 問題作成（同上）
└─ src-tauri/               … Rust 側と Tauri の設定（tauri.conf.json）
   └─ src/
      └─ lib.rs             … 入口（各アプリの rust/main.rs を読み込む。さわらなくてよい）
   build.rs                 … rust/main.rs があるアプリを自動で探す（さわらなくてよい）
```

### system の書き方

- **main** … アプリの土台です。ログイン・画面の組み立て・みんなで使う部品が入っています。
  みんなに影響するので、変えるときは声をかけてから変えます。
- **application** … 各アプリの画面です。自分の担当のフォルダーの中だけを変えます。
- アチーブ・設定・アカウントは React で作っていて、`src/system/pages/` の中にあります。入口は `main.jsx` です（`main/apps.js` がここを読み込みます）。
- `main.jsx` … 画面（見た目）。大きくなったら、部品を別の `.jsx` に分けて `main.jsx` から import します。
- `〇〇.js` … 処理（プログラム）。計算・データの読み書き・DB や Rust の呼び出しなどを書きます。
  `export function 名前() { … }` と書くと、`.jsx` で `import { 名前 } from "./〇〇.js";` として使えます。
- `〇〇.css` … 見た目。クラス名はフォルダー名から始めます（例：`.quiz-card`）。CSS はアプリ全体で共通なので、ほかの画面とぶつからないようにするためです。
- **ホーム・プログラム学習・情報収集・デジタル図鑑・問題作成は、普通の Web ページ（HTML・CSS・JS）と Rust で作ります。**
  フォルダーの中は全部、自由に書きかえてよいです（フォルダーを作るのも自由）。いちばん外は `index.html` だけで、ほかは種類ごとのフォルダーに入れます。
  左のアイコンを押すと、フォルダー名と同じページの `index.html` が、右側の窓（iframe）の中に開きます。
  左のサイドバーも同じく窓の中の HTML です（`src/system/sidebar/index.html`）。画面は「左の窓（サイドバー）＋右の窓（アプリ）」の組み合わせです。
  - `index.html` … 画面の入口（名前と場所だけは変えない）。普通の Web ページと同じく `<html>` `<head>` `<body>` を書き、
    CSS・JS・画像は `<link>` `<script type="module">` `<img>` で、自分でパスを書いてつなぐ（最初は `css/style.css`・`js/main.js` につないである）
  - `css/` … このページの中だけに効く（クラス名は自由）。色は `var(--primary)` など、部品は `btn` `panel` `input` が最初から使える
  - `js/` … `document.getElementById` など普通の書き方。アプリの機能は `app` から使う
    （`app.notify({ … })` お知らせ、`app.unlock("id")` アチーブ、`await app.invoke("hello", { … })` Rust、`app.open("quiz")` ページを開く）
  - `images/`・`data/` … 画像・JSON など。HTML や `fetch("./data/〇〇.json")` から使う
  - `rust/main.rs` … Rust の窓口（名前と場所だけは変えない）。`#[tauri::command]` を付けた関数を、いちばん下の `crate::commands![ ]` に並べる
  - `rust/` のほかのファイル … Rust の処理。`main.rs` に `mod 〇〇;` と書いてつなぎ、`〇〇::関数名()` で呼ぶ
  - 保存すると、そのページの窓だけが新しくなる（ログインしたまま）
  - 4 つのアプリは `index.html` だけ。CSS・JS・画像・Rust は、必要になったらフォルダーを作って足す（ホームが見本）
  - Rust は `rust/main.rs` を作るだけで自動で読み込まれる（`src-tauri/build.rs` が探す。`lib.rs` は書きかえなくてよい）
  - しくみ：`main/components/HtmlFolder.jsx`（窓）・`main/frame/bridge.js`（app）・`main/frame/frame.css`（共通の見た目）・`vite-apps.js`
- **アチーブ** … `src/system/achieve_setting/<ページの id>.js` に、1 ページ 1 ファイルで書きます（例：問題作成 → `quiz.js`、設定 → `settings.js`）。
  自分のアプリのファイルだけを書きかえるので、ほかの人とコンフリクトしません。ファイルを置くだけで自動で読み込まれます。
  - 1 行に 1 つ `{ id: "first-open", name: "名前", desc: "説明", icon: "quiz" }`。数をためるものは `goal: 10` を足す
  - レア度（カードの枠の色）は `rarity: "bronze"`（ブロンズ）/ `"silver"`（シルバー）/ `"gold"`（ゴールド）。書かなければ bronze
  - 手に入れるときは、そのアプリの JS で `app.unlock("first-open")`・`app.addProgress("open-10")`
    （アチーブ・設定・アカウントの React では `unlockAchievement("settings", "night-mode")`）
  - アプリを増やしたら、同じ名前（id）のファイルを作る
- みんなで使う部品・処理は、`src/system/pages/〇〇/`（React の画面）から次のように読み込みます。HTML のアプリからは `app` を使います。
  ```js
  import { Field } from "../../main/components/Form";
  import { getMe } from "../../main/common/api.js";
  ```
- HTML・CSS・JS のページを増やすときは、`src/system/application` にフォルダーを作って `index.html` を置き、`src/system/main/apps.js` に 1 行足します（`id` をフォルダー名と同じにして `load: HTML_FOLDER`）。Rust は `rust/main.rs` を置けば自動で読み込まれます。

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
