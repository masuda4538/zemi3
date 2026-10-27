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
- 性別・言語と試験の一覧は `src/system/common/api.js` の `GENDERS`・`LANGUAGES` に書いてあります。
- あとでデータベースをつなぐときは、`src/system/common/api.js` の中身を Rust（`invoke`）を呼ぶ形に書きかえます。
  画面（各 `main.jsx`）は書きかえなくて大丈夫なように、関数の名前と返す形はそのままにしています。
- 設定画面の内容（テーマ・文字の大きさなど）は、その PC の中（localStorage）に保存します。
- 起動画面の黒猫は study-notes の起動画面の猫と同じ動きです（`src/system/start/friends.js`）。
- 画像は `public/images/` にファイルとして置き、画面からは `"/images/ファイル名"` で使います（例：`<img src="/images/logo.svg" />`）。

## フォルダーの中身

```
tauri-app/
├─ index.html
├─ package.json / package-lock.json
├─ vite.config.js
├─ public/                  … そのまま使うファイル
│  └─ images/               … ★ 画像はここに置く（今はロゴ logo.svg）
├─ src/                     … 画面側（React）
│  ├─ main.jsx              … 入口（さわらなくてよい）
│  ├─ App.jsx               … 全体（ログイン前は起動画面、ログイン後は左のサイドバー＋右の画面）
│  ├─ App.css               … 見た目（色・レイアウト・ホワイト／ダーク）
│  ├─ apps.js               … 左に並ぶ項目の一覧（名前・アイコン・色）
│  ├─ config.js             … アプリ名・ロゴの画像・キャッチコピー
│  ├─ components/           … 全体で使う部品（サイドバー・アイコン・見出し・入力フォーム・言語の選択）
│  └─ system/               … ★ 各項目のプログラムはここに書く
│     ├─ start/             main.jsx・start.js・start.css・friends.js・friends.css … 起動画面（ログイン・新規登録・黒猫たち）
│     ├─ common/            api.js（アカウントのデータ。今は仮）・validate.js（入力チェック）
│     ├─ home/              main.jsx（入口・画面）・home.js（処理）
│     ├─ programming/       main.jsx・programming.js        … プログラム学習
│     ├─ research/          main.jsx・research.js           … 情報収集
│     ├─ zukan/             main.jsx・zukan.js              … デジタル図鑑
│     ├─ quiz/              main.jsx・quiz.js               … 問題作成
│     ├─ settings/          main.jsx・settings.js・settings.css … 設定（PC の中に保存）
│     └─ account/           main.jsx・account.js・account.css … アカウント
└─ src-tauri/               … Rust 側と Tauri の設定（tauri.conf.json）
   └─ src/
      └─ lib.rs             … 入口（画面から呼ぶコマンドの一覧。今はなし）
```

### system の書き方

- `main.jsx` … そのフォルダーの入口（画面・見た目）。どのフォルダーも入口は `main.jsx` に統一しています。
  画面が大きくなったら、部品を別の `.jsx` に分けて `main.jsx` から import します。
- `〇〇.js` … 処理（プログラム）。計算・データの読み書き・DB や Rust の呼び出しなどを書きます。
- `.js` に `export function 名前() { … }` と書くと、`.jsx` で `import { 名前 } from "./〇〇.js";` として使えます。
- ファイルが大きくなったら、その項目のフォルダーの中にファイルを増やして分けます。
- 項目を増やすときは、`src/system` にフォルダーを作って `main.jsx` を置き、`src/apps.js` に 1 行足します（`load: () => import("./system/〇〇/main.jsx")`）。

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
