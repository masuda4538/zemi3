# 学習支援アプリ

Tauri 2 + React（JavaScript）+ Rust で作るデスクトップアプリです。
起動すると、スタート画面のあとにログインの画面が出ます（ログインか新規登録をすると使えます。ゲストでは使えません）。
左のサイドバーで「ホーム・プログラム学習・情報収集・デジタル図鑑・問題作成」、左下で「アチーブ・設定・アカウント」を切り替えます。
一度ログインしたら、ログアウトするまで覚えています（次の起動からはすぐホームが開く）。最後に使ってから 3 か月以上たったときは、もう一度ログインします。

## 起動する

環境構築（**setup-kit v2.1.0.0 以降**の「環境を作る」）が終わった Windows の PC で、VS Code（WSL にはつながない）のターミナルから実行します。
setup-kit の「アプリが動くか試す」で、このプロジェクトがビルド・起動できるかを先に確かめられます。

```powershell
cd C:\zemi\system1\tauri-app
npm ci              # 初回と、package-lock.json が変わったときだけ
npm run tauri dev   # アプリが最大化で起動する（初回は Rust のビルドで 5〜10 分かかる）
```

- Windows のアプリとして開くので、日本語入力（半角/全角・変換キー）やマウスカーソルは、ふだんの Windows と同じです。
- PC に保存する記録（設定・アチーブ・ログイン日・使った時間）は `C:\Users\<名前>\AppData\Roaming\com.nkc-user.tauri-app\` に入ります。
- 以前の環境（WSL）から移ってきたときは、setup-kit の「WSL から移す」でプロジェクトをコピーできます。WSL 用の `node_modules` は Windows では使えないので、`npm ci` をやり直します。

### 使う版（全員でそろえる）

| 道具 | 版 | 決めているファイル |
|---|---|---|
| Rust | 1.99.1 | `rust-toolchain.toml`（このフォルダーで動かすと、rustup が自動でこの版を使う。無ければ自動で入る） |
| Node.js | 26 系 | `package.json` の `"engines"`・`.nvmrc`（違う版で `npm run tauri` を動かすと、注意が出る） |

版を上げるときは、これらのファイルと setup-kit の `tools\config.ps1` を同じ数字に変えて、全員で「差分を直す」を押します。

### 以前の環境（WSL）で動かすとき

WSL でも `npm run tauri dev` で動きます。ただし WSL のアプリは Linux のアプリなので、Windows の日本語入力（半角/全角）は使えません。
起動するときに日本語入力（fcitx5 ＋ Mozc）を自動で用意するので（`scripts/tauri.js`）、アプリの入力欄で **Ctrl + Space** で日本語 ⇄ 英字 を切りかえます。

## ログインとデータ（今はデータベースなし）

- **今はデータベースを使っていません。** MariaDB が止まっていても、なくても動きます。
- ログインは、ログイン ID を入れれば入れます（パスワードはまだ確かめていません）。
- ログインしている人（新規登録・アカウントの変更をふくむ）は、PC の中のファイル（AppData の `session.json`）に保存し、ログアウトすると消します。
- 起動したときにログインしていなければ、ログインの画面（`src/system/log_in/LoginScreen.jsx`）を出します。
- ログイン・新規登録・ログアウト・ログインを覚えておく処理は、`src/system/log_in/session.js` にまとめてあります。
- 最後に使ってから 3 か月（`log_in/session.js` の `SESSION_MONTHS`）以上たったら、もう一度ログインしてもらいます（同じ ID で入ると、名前・アイコンは元のまま）。
- 性別・言語と試験の一覧は `src/system/core/storage/account.js` の `GENDERS`・`LANGUAGES` に書いてあります。
- あとでデータベースをつなぐときは、`src/system/log_in/session.js`（ログイン・新規登録）と `src/system/core/storage/account.js`（プロフィールの変更）の中身を Rust（`invoke`）を呼ぶ形に書きかえます。
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
│     ├─ start-end/         … ★ スタート画面と終了画面
│     │  ├─ loading-screen.html  起動したときの青いロード画面（見た目。HTML と CSS）
│     │  ├─ loading-screen.js    ロード画面を消す（出しておく時間）
│     │  └─ exit-confirm.js      × で閉じるときの「アプリを閉じますか？」（文）
│     ├─ log_in/            … ★ ログインの処理（ログイン・新規登録・ログアウト）
│     │  ├─ LoginScreen.jsx      起動したときのログインの画面（login-screen.css が見た目）
│     │  ├─ LoginForm.jsx        ログイン／新規登録の入力（login-form.css が見た目）
│     │  ├─ register.js          新規登録のステップと入力チェック
│     │  └─ session.js           ログイン・新規登録・ログアウト・ログインを覚えておく（3 か月で期限切れ）
│     ├─ core/              … アプリの土台（画面の組み立て・みんなで使う部品。ふだんはさわらない）
│     │  ├─ App.jsx         … 全体（左のサイドバー＋右の画面。ログインしている人を持つ）
│     │  ├─ App.css         … 全体の見た目（レイアウト）
│     │  ├─ page-list.js    … 左に並ぶ項目の一覧（名前・アイコン・色・読み込むフォルダー）
│     │  ├─ config.js       … アプリ名
│     │  ├─ shortcuts.js    … キーボードのショートカット
│     │  ├─ styles/         … theme.css（色・文字）・cursor.css（マウスカーソル）・scrollbar.css（細いスクロールバー）
│     │  ├─ components/     … みんなで使う部品（アイコン・入力フォーム・確認画面・窓・お知らせ など）
│     │  │                     AppFrame.jsx（各アプリの窓）・SidebarFrame.jsx（左のサイドバーの窓）
│     │  ├─ frame/          … 各アプリの窓の中で使う app（bridge.js）と共通の見た目（frame.css）
│     │  ├─ storage/        … PC に保存するデータ（achievements.js：アチーブ／logins.js：ログインした日／
│     │  │                     usage.js：使った時間／stats.js：アプリごとの学習時間と大事な数／account.js：プロフィールの変更。今は仮）
│     │  ├─ effects/        … mouse-effects.js（クリックの波紋・軌跡）・scrollbar.js（細いスクロールバー）
│     │  └─ utils/          … notify.js（右上のお知らせ）・validate.js（入力チェック）
│     ├─ pages/             … アチーブ・設定・アカウントの画面（React。さわらない）
│     │  ├─ achievements/   main.jsx・achievement-list.js・achievements.css・Ring.jsx … アチーブ
│     │  ├─ settings/       main.jsx・settings.js・settings.css・ShortcutEditor.jsx … 設定（PC の中に保存）
│     │  └─ account/        main.jsx・account.js・account.css … アカウント（プロフィールの変更）
│     ├─ sidebar/           … 左のサイドバー（普通の HTML・CSS・JS。窓の中に出す）
│     ├─ home_setting/      … ★ ホームのカードに出す学習時間の内訳と大事な数（1 アプリ 1 ファイル。自分の担当のファイルだけ書きかえる）
│     │                        programming.js  research.js  zukan.js  quiz.js（今は例。時間は app.startStudy("id")、数は app.addStat("id")）
│     ├─ achieve_setting/   … ★ 各ページのアチーブ（1 ページ 1 ファイル。自分の担当のファイルだけ書きかえる）
│     │  ├─ home.js  programming.js  research.js  zukan.js  quiz.js   … 各アプリ
│     │  └─ timer.js  achieve.js  settings.js  account.js           … タイマー・アチーブ・設定・アカウント
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
│        ├─ quiz/           … 問題作成（同上）
│        └─ timer/          … タイマー（ストップウォッチ・カウントダウン・ポモドーロ。ほかのページを見ている間も動き続ける）
└─ src-tauri/               … Rust 側と Tauri の設定（tauri.conf.json）
   └─ src/
      └─ lib.rs             … 入口（各アプリの rust/main.rs を読み込む。さわらなくてよい）
   build.rs                 … rust/main.rs があるアプリを自動で探す（さわらなくてよい）
```

### system の書き方

- **core** … アプリの土台です。ログイン・画面の組み立て・みんなで使う部品が入っています。
  みんなに影響するので、変えるときは声をかけてから変えます。
- **application** … 各アプリの画面です。自分の担当のフォルダーの中だけを変えます。
- アチーブ・設定・アカウントは React で作っていて、`src/system/pages/` の中にあります。入口は `main.jsx` です（`core/page-list.js` がここを読み込みます）。
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
  - しくみ：`core/components/AppFrame.jsx`（窓）・`core/frame/bridge.js`（app）・`core/frame/frame.css`（共通の見た目）・`vite-apps.js`
- **アチーブ** … `src/system/achieve_setting/<ページの id>.js` に、1 ページ 1 ファイルで書きます（例：問題作成 → `quiz.js`、設定 → `settings.js`）。
  自分のアプリのファイルだけを書きかえるので、ほかの人とコンフリクトしません。ファイルを置くだけで自動で読み込まれます。
  - 1 行に 1 つ `{ id: "first-open", name: "名前", desc: "説明" }`（絵はそのアプリのアイコンが自動で付きます）。数をためるものは `goal: 10` を足す
  - レア度（カードの枠の色）は `rarity: "bronze"`（ブロンズ）/ `"silver"`（シルバー）/ `"gold"`（ゴールド）。書かなければ bronze
  - 手に入れるときは、そのアプリの JS で `app.unlock("first-open")`・`app.addProgress("open-10")`
    （アチーブ・設定・アカウントの React では `unlockAchievement("settings", "night-mode")`）
  - アプリを増やしたら、同じ名前（id）のファイルを作る
- みんなで使う部品・処理は、`src/system/pages/〇〇/`（React の画面）から次のように読み込みます。HTML のアプリからは `app` を使います。
  ```js
  import { Field } from "../../core/components/Form";
  import { getMe } from "../../core/storage/account.js";
  ```
- HTML・CSS・JS のページを増やすときは、`src/system/application` にフォルダーを作って `index.html` を置き、`src/system/core/page-list.js` に 1 行足します（`id` をフォルダー名と同じにして `load: HTML_FOLDER`）。Rust は `rust/main.rs` を置けば自動で読み込まれます。

## GitHub の使い方

### はじめて取ってくる

```powershell
cd C:\zemi\system1
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
- プロジェクトは `C:\zemi\system1` に置きます（OneDrive と同期している「ドキュメント」「デスクトップ」には置かない）。
- `node_modules` のエラーが出たときは、`node_modules` フォルダーを消してから `npm ci` をやり直します。
