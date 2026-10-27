# 卒業研究アプリ

Tauri 2 + React（JavaScript）+ Rust で作るデスクトップアプリです。
起動すると起動画面（ログイン・新規登録）が出て、ログインするとホームが開きます。
左のサイドバーで「ホーム・プログラム学習・情報収集・デジタル図鑑・問題作成」、左下で「設定・アカウント」を切り替えます。

## 起動する

環境構築（setup-kit）が終わった PC で、VS Code を WSL（Ubuntu-24.04）につないでから実行します。

```bash
cd ~/projects/tauri-app
mariadb < db/sotsuken.sql   # 初回だけ：データベース「sotsuken」とテーブルを作る
npm ci                      # 初回と、package-lock.json が変わったときだけ
npm run tauri dev           # アプリが最大化で起動する（初回は Rust のビルドで数分かかる）
```

## ログインとデータベース

- データベースは、その PC の MariaDB の `sotsuken`（ユーザー nkc-user / パスワード nkc）を使います。
- テーブルは `db/sotsuken.sql` で作ります（user / gender / language / user_language）。ER 図どおりで、それ以外のテーブルは作りません。何度流しても大丈夫です。
  - プログラム言語と試験は、どちらも `language` に入れます（同じ一覧）。
  - パスワードは Argon2 で暗号化して保存します（元のパスワードは保存しません）。
- 開発中（`npm run tauri dev`）は、ログイン ID とパスワードを空のまま「ログイン」を押すと、テスト用アカウント（ID：`devuser` ／ パスワード：`devpassword`）で入れます。初めて使うときに自動で作られます。exe では使えません。
- 新規登録は「言語・試験」以外すべて必須です。一覧にない言語・試験はその場で追加できます。
- アカウント画面で、名前・メール・性別・生年月日・言語と試験・パスワードを変更できます（ログイン ID は変更できません）。
- 設定画面の内容（テーマ・文字の大きさなど）はデータベースではなく、その PC の中（localStorage）に保存します。
- 別の PC の MariaDB につなぐときは、環境変数 `SOTSUKEN_DB_URL` で変えられます。
  例）`SOTSUKEN_DB_URL=mysql://nkc-user:nkc@192.168.0.10:3306/sotsuken npm run tauri dev`

## フォルダーの中身

```
tauri-app/
├─ index.html
├─ package.json / package-lock.json
├─ vite.config.js
├─ public/                  … そのまま使うファイル
│  └─ brand/                logo.svg・mascot.svg … ログイン画面のロゴとマスコット（仮の画像。置き換えて使う）
├─ src/                     … 画面側（React）
│  ├─ main.jsx              … 入口（さわらなくてよい）
│  ├─ App.jsx               … 全体（ログイン前は起動画面、ログイン後は左のサイドバー＋右の画面）
│  ├─ App.css               … 見た目（色・レイアウト・ホワイト／ダーク）
│  ├─ apps.js               … 左に並ぶ項目の一覧（名前・アイコン・色）
│  ├─ config.js             … アプリ名・ロゴとマスコットの画像・キャッチコピー
│  ├─ components/           … 全体で使う部品（サイドバー・アイコン・見出し・入力フォーム・言語の選択）
│  └─ system/               … ★ 各項目のプログラムはここに書く
│     ├─ start/             Start.jsx・start.js・start.css  … 起動画面（ログイン・新規登録）
│     ├─ common/            api.js（Rust を呼ぶ）・validate.js（入力チェック）
│     ├─ home/              Home.jsx（画面）・home.js（処理）
│     ├─ programming/       Programming.jsx・programming.js … プログラム学習
│     ├─ research/          Research.jsx・research.js       … 情報収集
│     ├─ zukan/             Zukan.jsx・zukan.js             … デジタル図鑑
│     ├─ quiz/              Quiz.jsx・quiz.js               … 問題作成
│     ├─ settings/          Settings.jsx・settings.js・settings.css … 設定（PC の中に保存）
│     └─ account/           Account.jsx・account.js・account.css … アカウント
├─ db/sotsuken.sql          … データベースとテーブルを作る SQL
└─ src-tauri/               … Rust 側と Tauri の設定（tauri.conf.json）
   └─ src/
      ├─ lib.rs             … 入口（コマンドの一覧）
      ├─ db.rs              … データベースへの接続
      ├─ account.rs         … ログイン・新規登録・アカウント変更の処理
      └─ commands.rs        … 画面から呼ぶコマンド
```

### system の書き方

- `〇〇.jsx` … 画面（見た目）。ボタンや表など、表示するものを書きます。
- `〇〇.js` … 処理（プログラム）。計算・データの読み書き・DB や Rust の呼び出しなどを書きます。
- `.js` に `export function 名前() { … }` と書くと、`.jsx` で `import { 名前 } from "./〇〇.js";` として使えます。
- ファイルが大きくなったら、その項目のフォルダーの中にファイルを増やして分けます。
- 項目を増やすときは、`src/system` にフォルダーを作り、`src/apps.js` に 1 行足します。

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
