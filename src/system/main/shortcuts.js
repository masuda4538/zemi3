// ═══════════════════════════════════════════════════════════════
//  キーボードのショートカット（登録できる操作の一覧と、キーの読み取り）
//    ・登録した内容は設定（settings.json の settings.shortcuts）に保存します（application/settings/settings.js）
//    ・押したときの動きは App.jsx、登録する画面は application/settings/ShortcutEditor.jsx
//  キーは "Ctrl+Shift+D" のような文字で持ちます（"" は「なし」）。
//  操作を増やすときは、下の ACTIONS に 1 行足して、App.jsx の runShortcut に動きを足します。
// ═══════════════════════════════════════════════════════════════
import { PAGES, BOTTOM_PAGES } from "./apps";

/** 最初のショートカット（ページは上から Ctrl + 1, 2, 3 …） */
const PAGE_DEFAULTS = { settings: "Ctrl+,", account: "" };

/** 登録できる操作 { id, name, group, initial（最初のキー） } */
export const ACTIONS = [
  ...PAGES.map((p, i) => ({ id: `page:${p.id}`, name: `${p.name}を開く`, group: "ページを開く", initial: i < 9 ? `Ctrl+${i + 1}` : "" })),
  ...BOTTOM_PAGES.map((p) => ({ id: `page:${p.id}`, name: `${p.name}を開く`, group: "ページを開く", initial: PAGE_DEFAULTS[p.id] ?? "" })),
  { id: "sidebar", name: "サイドバーを隠す／出す", group: "画面", initial: "Ctrl+B" },
  { id: "theme", name: "ホワイト／ダークを切り替える", group: "画面", initial: "Ctrl+Shift+D" },
  { id: "logout", name: "ログアウト", group: "アカウント", initial: "" },
];

/** 最初のショートカット { 操作の id: キー } （settings.js の DEFAULTS で使う） */
export const DEFAULT_SHORTCUTS = Object.fromEntries(ACTIONS.map((a) => [a.id, a.initial]));

/** 文字の入力などで使うので、登録できないキー */
const RESERVED = ["Ctrl+C", "Ctrl+V", "Ctrl+X", "Ctrl+A", "Ctrl+Z", "Ctrl+Y", "Ctrl+Shift+Z", "Ctrl+R", "Alt+F4", "F5", "F12"];

// キーボードの場所（e.code）→ 表示する名前。日本語キーボードでも Shift でも同じ名前になるように e.code を使う
const CODE_NAMES = {
  Comma: ",", Period: ".", Slash: "/", Semicolon: ";", Quote: "'", BracketLeft: "[", BracketRight: "]",
  Backslash: "\\", Minus: "-", Equal: "=", Backquote: "`", IntlRo: "\\", IntlYen: "¥",
  Space: "Space", Enter: "Enter", Tab: "Tab", Backspace: "Backspace", Delete: "Delete", Insert: "Insert",
  Home: "Home", End: "End", PageUp: "PageUp", PageDown: "PageDown",
  ArrowUp: "↑", ArrowDown: "↓", ArrowLeft: "←", ArrowRight: "→",
};
const MODIFIER_CODES = ["ControlLeft", "ControlRight", "ShiftLeft", "ShiftRight", "AltLeft", "AltRight", "MetaLeft", "MetaRight"];

/** キーの名前（押したのが Ctrl などだけのときは ""） */
function keyName(code) {
  if (MODIFIER_CODES.includes(code)) return "";
  if (/^Key[A-Z]$/.test(code)) return code.slice(3);           // KeyA → A
  if (/^Digit[0-9]$/.test(code)) return code.slice(5);         // Digit1 → 1
  if (/^Numpad[0-9]$/.test(code)) return code.slice(6);        // Numpad1 → 1
  if (/^F([1-9]|1[0-2])$/.test(code)) return code;             // F1〜F12
  return CODE_NAMES[code] ?? "";
}

/** 押したキー（keydown のイベント）→ "Ctrl+Shift+D"。Ctrl などだけを押したときは "" */
export function comboFromEvent(e) {
  const key = keyName(e.code);
  if (!key) return "";
  const mods = [];
  if (e.ctrlKey || e.metaKey) mods.push("Ctrl");
  if (e.altKey) mods.push("Alt");
  if (e.shiftKey) mods.push("Shift");
  return [...mods, key].join("+");
}

/** 画面に出す形 "Ctrl+Shift+D" → "Ctrl + Shift + D"（"" は「なし」） */
export const formatCombo = (combo) => (combo ? combo.split("+").join(" + ") : "なし");

/** 登録してよいキーか（だめなら理由、よければ ""） */
export function checkCombo(combo) {
  if (!combo) return "";
  if (RESERVED.includes(combo)) return `「${formatCombo(combo)}」はコピーや貼り付けなどで使うので登録できません。`;
  const parts = combo.split("+");
  const hasMod = parts.includes("Ctrl") || parts.includes("Alt");
  const isF = /^F([1-9]|1[0-2])$/.test(parts[parts.length - 1]);
  if (!hasMod && !isF) return "文字の入力とかぶらないように、Ctrl か Alt と組み合わせてください（F1〜F12 は 1 つでも登録できます）。";
  return "";
}

/** そのキーを使っている操作（なければ null） */
export const actionOfCombo = (shortcuts, combo) =>
  (combo ? ACTIONS.find((a) => shortcuts[a.id] === combo) ?? null : null);
