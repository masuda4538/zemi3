# object（もの）

アプリのいろいろな画面で使う「もの」（キャラクター・絵・部品）をまとめるフォルダーです。
1 つのものにつき 1 つのフォルダーで、中に **絵と動き（`〇〇.js`）** と **見た目（`〇〇.css`）**、画像があれば `images/` を入れます。
使う画面は、ここから `import` して持ってきます（置く場所・大きさは、使う画面の CSS で決めます）。

| フォルダー | もの | 使い方 |
|---|---|---|
| `character/` | キャラクター「スタッピー」（絵・動き・なでる・ことば） | `mountCharacter(入れる場所, { … })`（くわしくは `character.js` の上） |
| `post/` | 赤い丸ポスト | `drawPost(入れる場所)` |
| `fountain/` | 噴水 | `drawFountain(入れる場所)` → `{ svg, rim }` |
| `wheel/` | 観覧車 | `drawWheel(入れる場所)` |
| `coaster/` | ジェットコースター | `drawCoaster(入れる場所)` |
| `board/` | 掲示板（木のわく ＋ コルクボード）と、押しピン・マスキングテープ・紙のカード・ノート・付箋などの部品（`cb-…` のクラス） | `drawBoard(入れる場所, { label, title, legs })` → `{ body }`、`boardIcon("book")` |
| `tree/` | 大きい木 | `drawTree(入れる場所)` → `{ svg, foot }` |
| `flowers/` | 花ばたけ | `drawFlowerField(入れる場所, { count, path })` |
| `person/` | フレンドの人形 | `personSvg("クラス名")`（SVG の文字を返す） |

- どの「もの」も、外がわに `data-time="morning" / "day" / "evening" / "night"` があると、時間帯に合わせて色が変わります（ホームの広場）。
- 設定の「アニメーションを減らす」（`html` の `reduce-motion`）のときは、動きが止まります。
- 画像はデータベースに入れず、それぞれのフォルダーの `images/` に置きます（例：`character/images/`）。
- 今使っているところ：ホーム（`application/home/js/main.js`・`plaza.js`・`ranking.js`）、ログインの画面（スタッピーの絵）、スタート画面（スタッピーの絵）。
