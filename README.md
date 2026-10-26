# 卒業研究アプリ

Tauri 2 + React（JavaScript）+ Rust で作るデスクトップアプリです。
左のサイドバーで「ホーム・プログラム学習・情報収集・デジタル図鑑・問題作成・設定」を切り替えます。

## 起動する

環境構築（setup-kit）が終わった PC で、VS Code を WSL（Ubuntu-24.04）につないでから実行します。

```bash
cd ~/projects/tauri-app
npm ci              # 初回と、package-lock.json が変わったときだけ
npm run tauri dev   # アプリが最大化で起動する（初回は Rust のビルドで数分かかる）
```

## フォルダーの中身

```
tauri-app/
├─ index.html
├─ package.json / package-lock.json
├─ vite.config.js
├─ public/                  … アイコンなど、そのまま使うファイル
├─ src/                     … 画面側（React）
│  ├─ main.jsx              … 入口（さわらなくてよい）
│  ├─ App.jsx               … 全体（左のサイドバー＋右の画面）
│  ├─ App.css               … 見た目（色・レイアウト・ホワイト／ダーク）
│  ├─ apps.js               … 左に並ぶ項目の一覧（名前・アイコン・色）
│  ├─ config.js             … アプリ名
│  ├─ components/           … 全体で使う部品（サイドバー・アイコン・見出し）
│  └─ system/               … ★ 各項目のプログラムはここに書く
│     ├─ home/              Home.jsx（画面）・home.js（処理）
│     ├─ programming/       Programming.jsx・programming.js … プログラム学習
│     ├─ research/          Research.jsx・research.js       … 情報収集
│     ├─ zukan/             Zukan.jsx・zukan.js             … デジタル図鑑
│     ├─ quiz/              Quiz.jsx・quiz.js               … 問題作成
│     └─ settings/          Settings.jsx                    … 設定
└─ src-tauri/               … Rust 側と Tauri の設定（tauri.conf.json）
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
