export const $ = s => document.querySelector(s);

// HTMLエスケープ
export const esc = s => String(s).replace(/[&<>"]/g, c => ({
  "&": "&amp;",
  "<": "&lt;",
  ">": "&gt;",
  '"': "&quot;"
}[c]));

// サイドバーの件数更新
export function updateNavCounts(itemCount, tagCount) {
  const nHome = $("#n-home");
  const nTags = $("#n-tags");

  if (nHome) nHome.textContent = itemCount;
  if (nTags) nTags.textContent = tagCount;
}

/* 確認ダイアログ */
let onYes = null;

export function confirmDlg(m, s, fn) {
  $("#dmsg").textContent = m;
  $("#dsub").textContent = s;
  onYes = fn;
  $("#dbg").classList.add("on");
  $("#dno").focus();
}

// 共通初期化
export function initCommon() {
  if (innerWidth <= 720) {
    $("#nav").classList.add("closed");
  }

  $("#burger").onclick = () => {
    $("#nav").classList.toggle("closed");
  };

  addEventListener("keydown", e => {
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "b") {
      e.preventDefault();
      $("#nav").classList.toggle("closed");
    }
  });

  // テーマ設定
  const savedTheme = localStorage.getItem("zukan_theme");

  if (savedTheme) {
    document.documentElement.dataset.theme = savedTheme;
  }

  $("#theme").onclick = () => {
    const d = document.documentElement;
    const dark = d.dataset.theme
      ? d.dataset.theme === "dark"
      : matchMedia("(prefers-color-scheme:dark)").matches;

    const next = dark ? "light" : "dark";

    d.dataset.theme = next;
    localStorage.setItem("zukan_theme", next);
  };

  // ダイアログ操作
  if ($("#dno")) {
    $("#dno").onclick = () => {
      $("#dbg").classList.remove("on");
      onYes = null;
    };
  }

  if ($("#dyes")) {
    $("#dyes").onclick = () => {
      $("#dbg").classList.remove("on");

      if (onYes) onYes();
      onYes = null;
    };
  }

  // Lucideアイコンの更新
  let tm;

  new MutationObserver(() => {
    clearTimeout(tm);

    tm = setTimeout(() => {
      if (window.lucide) lucide.createIcons();
    }, 0);
  }).observe(document.body, {
    childList: true,
    subtree: true
  });

  if (window.lucide) lucide.createIcons();
}