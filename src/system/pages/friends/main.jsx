// ═══════════════════════════════════════════════════════════════
//  フレンド：画面（見た目）　［このフォルダーの入口：main.jsx］　★ 今は見た目のイメージだけ
//  アチーブ・設定・アカウントと同じ形（core/components/SettingsLayout.jsx）：上にバー、左に項目、右に中身
//    フレンド一覧   … 名前とアイコン・オンライン（または最後のログイン）・アチーブの取得率。「すべて／オンライン」で しぼれる
//                     行を押すと「フレンド詳細」（FriendDetail）
//    フレンド詳細   … その人の名前とアイコン・オンライン（最後のログイン）・アチーブの取得率と、
//                     その人と送り合ったもの（手紙・問題・応援）。行を押すと中身が開く（問題は問題文と選択肢まで）
//    フレンドを追加 … 自分の ID と、相手の ID を入れる欄・届いた申請。★ 申請はまだ送れない（押すと「準備中」とお知らせ）
//    右はし（とても広い画面のときだけ）… 今オンラインのフレンド（押すとフレンド詳細）
//  ☆（一覧の行の右・詳細）… お気に入りにする・外す。お気に入りの人は、一覧の上のほうに ならぶ
//    お気に入りは favorites.js（その PC の中に覚えておく）。ホームでは、お気に入りの人が最初の広場、そうでない人が となりの広場にいる
//  ホームの広場のカード・ポストからも、フレンド詳細を開ける（だれを開くかは open-friend.js でメモしてわたす）
//  フレンドは、今は仮のデータ（friends-sample.js）。送り合ったものも仮のデータ（mail-sample.js）
//  core/App.jsx から user（ログインしている人）を受け取ります。
// ═══════════════════════════════════════════════════════════════
import { useEffect, useState } from "react";
import SettingsLayout, { AsideCard } from "../../core/components/SettingsLayout";
import Icon from "../../core/components/Icon";
import { notify } from "../../core/utils/notify.js";
import { FRIENDS_SAMPLE, lastLoginText } from "./friends-sample.js";
import { MAIL_SAMPLE, SENT_SAMPLE, MAIL_TYPES, STAMPS, CHOICE_MARKS } from "./mail-sample.js";
import { peekFriend, clearFriend } from "./open-friend.js";
import { loadFavorites, toggleFavorite } from "./favorites.js";
import "./friends.css";

/** 左の項目（上から順に並ぶ） */
const SECTIONS = [
  { id: "list", name: "フレンド一覧", icon: "friends", desc: "フレンドの、オンラインかどうか・最後のログイン・アチーブの取得率が見られます。押すと くわしく見られます。" },
  { id: "add", name: "フレンドを追加", icon: "userPlus", desc: "相手のログイン ID を入れて、フレンドの申請を送ります。" },
];

/** しぼりこみ */
const FILTERS = [
  { id: "all", name: "すべて" },
  { id: "online", name: "オンライン" },
];

/** 種類ごとのアイコン（送り合ったものの一覧） */
const KIND_ICON = { letter: "mail", quiz: "quiz", request: "userPlus", gift: "heart" };
/** 応援のスタンプのアイコン */
const STAMP_ICON = { cheer: "flag", star: "star", heart: "heart" };

/** 「準備中」のお知らせ */
const soon = (title) => notify({ type: "info", title: `${title}は準備中です`, message: "今は見た目のイメージだけで、まだ送れません。", key: "friends" });

export default function Friends({ user }) {
  const [current, setCurrent] = useState("list");
  // フレンド詳細を開いている人（userId。null ＝ 一覧）。ホームから来たときは、メモされた人を最初に開く
  const [detailId, setDetailId] = useState(() => (FRIENDS_SAMPLE.some((f) => f.userId === peekFriend()) ? peekFriend() : null));
  useEffect(() => { clearFriend(); }, []);   // メモは 1 回使ったら消す
  // お気に入り（userId の Set）。☆ を押すと切りかえて覚えておく
  const [favorites, setFavorites] = useState(() => loadFavorites(user?.userId));
  const flipFav = (userId) => setFavorites(toggleFavorite(user?.userId, userId));

  const friends = FRIENDS_SAMPLE;
  const online = friends.filter((f) => f.online);
  const items = SECTIONS.map((s) => (s.id === "list" ? { ...s, badge: String(friends.length) } : s));
  const section = SECTIONS.find((s) => s.id === current);
  const detail = current === "list" && friends.find((f) => f.userId === detailId);

  /** フレンド詳細を開く（一覧・右はし から） */
  const openDetail = (userId) => { setCurrent("list"); setDetailId(userId); };

  return (
    <SettingsLayout
      bar={{ icon: "friends", page: "フレンド", note: `${friends.length}人・オンライン ${online.length}人` }}
      items={items}
      current={current}
      onSelect={(id) => { setCurrent(id); setDetailId(null); }}
      title={detail ? `${detail.name} さん` : section.name}
      desc={detail ? "フレンドの くわしい様子と、送り合ったもの（手紙・問題・応援）が見られます。" : section.desc}
      aside={<OnlineAside online={online} onOpen={openDetail} />}
    >
      <p className="fr-sample"><Icon name="alert" />今は見た目のイメージです。フレンドは仮の人たちで、まだ本当の機能はありません。</p>
      {current === "list" && (detail
        ? <FriendDetail key={detail.userId} friend={detail} onBack={() => setDetailId(null)} fav={favorites.has(detail.userId)} onFav={() => flipFav(detail.userId)} />
        : <FriendList friends={friends} onOpen={openDetail} favorites={favorites} onFav={flipFav} />)}
      {current === "add" && <AddFriend user={user} />}
    </SettingsLayout>
  );
}

// ───────── フレンド一覧（行を押すとフレンド詳細） ─────────
function FriendList({ friends, onOpen, favorites, onFav }) {
  const [filter, setFilter] = useState("all");
  // お気に入りの人を上に。次にオンラインの人。そのあとは最後のログインが新しい順
  const fav = (f) => (favorites.has(f.userId) ? 1 : 0);
  const sorted = [...friends].sort((a, b) => (fav(b) - fav(a)) || (b.online - a.online) || ((b.lastLogin?.getTime() ?? 0) - (a.lastLogin?.getTime() ?? 0)));
  const shown = filter === "online" ? sorted.filter((f) => f.online) : sorted;
  return (
    <section className="panel fr-card">
      <header className="fr-card-head">
        <span>{shown.length}人</span>
        <div className="seg" role="radiogroup" aria-label="しぼりこみ">
          {FILTERS.map((x) => (
            <button key={x.id} type="button" role="radio" aria-checked={filter === x.id} className={filter === x.id ? "active" : ""} onClick={() => setFilter(x.id)}>
              {x.name}
            </button>
          ))}
        </div>
      </header>
      {shown.length === 0 ? (
        <p className="fr-none">今オンラインのフレンドはいません。</p>
      ) : (
        <ul className="fr-list">
          {shown.map((f) => (
            <li key={f.userId} className="fr-item">
              <button type="button" className="fr-row is-link" style={{ "--c": f.color }} onClick={() => onOpen(f.userId)} aria-label={`${f.name} さんの くわしい様子を見る`}>
                <span className="fr-avatar">{f.name.slice(0, 1)}{f.online && <i aria-label="オンライン" />}</span>
                <span className="fr-who">
                  <b>{f.name}</b>
                  <small>ID：{f.userId}</small>
                </span>
                <span className="fr-status">
                  {f.online
                    ? <span className="fr-online"><i />オンライン</span>
                    : <><small>最後のログイン</small><b title={lastLoginText(f.lastLogin)}>{lastLoginText(f.lastLogin, false)}</b></>}
                </span>
                <span className="fr-achieve">
                  <small>アチーブ</small>
                  <span className="fr-bar"><i style={{ width: `${f.achieve}%` }} /></span>
                  <b>{f.achieve}%</b>
                </span>
                <span className="fr-go" aria-hidden="true">›</span>
              </button>
              <FavButton on={favorites.has(f.userId)} name={f.name} onClick={() => onFav(f.userId)} />
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

// ───────── フレンド詳細（その人のようすと、送り合ったもの） ─────────
/** ☆ ボタン（お気に入りにする・外す）。big … 詳細の大きいボタン（文字つき） */
function FavButton({ on, name, onClick, big = false }) {
  const label = on ? `${name} さんを お気に入りから外す` : `${name} さんを お気に入りにする`;
  return (
    <button type="button" className={`fr-fav${on ? " is-on" : ""}${big ? " is-big" : ""}`} aria-pressed={on} aria-label={label} title={label} onClick={onClick}>
      <span aria-hidden="true">{on ? "★" : "☆"}</span>{big && (on ? "お気に入り" : "お気に入りにする")}
    </button>
  );
}

function FriendDetail({ friend: f, onBack, fav, onFav }) {
  const [filter, setFilter] = useState("all");   // all ／ got（届いた） ／ sent（送った）
  const [openId, setOpenId] = useState(null);    // 中身を開いている行
  // 送り合ったもの：届いたもの（from がこの人）と、送ったもの（to がこの人）を、新しい順に
  const got = MAIL_SAMPLE.filter((m) => m.from.userId === f.userId).map((m) => ({ ...m, dir: "got" }));
  const sent = SENT_SAMPLE.filter((m) => m.to.userId === f.userId).map((m) => ({ ...m, dir: "sent" }));
  const all = [...got, ...sent].sort((a, b) => b.at - a.at);
  const shown = filter === "all" ? all : all.filter((m) => m.dir === filter);
  const quizCount = all.filter((m) => m.type === "quiz").length;
  const DIRS = [{ id: "all", name: "すべて" }, { id: "got", name: "届いた" }, { id: "sent", name: "送った" }];

  return (
    <>
      <button type="button" className="fr-back" onClick={onBack}>‹ フレンド一覧にもどる</button>
      <section className="panel fr-card fr-profile" style={{ "--c": f.color }}>
        <span className="fr-avatar is-big">{f.name.slice(0, 1)}{f.online && <i aria-label="オンライン" />}</span>
        <div className="fr-profile-main">
          <div className="fr-profile-name"><b>{f.name}</b><small>ID：{f.userId}</small></div>
          <div className="fr-profile-status">
            {f.online
              ? <span className="fr-online"><i />オンライン</span>
              : <span>最後のログイン <b>{lastLoginText(f.lastLogin)}</b></span>}
          </div>
          <div className="fr-achieve is-wide">
            <small>アチーブの取得率</small>
            <span className="fr-bar"><i style={{ width: `${f.achieve}%` }} /></span>
            <b>{f.achieve}%</b>
          </div>
        </div>
        <div className="fr-profile-btns">
          <FavButton big on={fav} name={f.name} onClick={onFav} />
          <button type="button" className="btn btn-primary" onClick={() => soon("手紙を送る機能")}><Icon name="mail" />手紙を送る</button>
          <button type="button" className="btn" onClick={() => soon("問題を送る機能")}><Icon name="quiz" />問題を送る</button>
        </div>
      </section>

      {/* 数のまとめ */}
      <ul className="fr-counts">
        <li><span>届いたもの</span><b>{got.length}</b></li>
        <li><span>送ったもの</span><b>{sent.length}</b></li>
        <li><span>問題のやりとり</span><b>{quizCount}</b></li>
      </ul>

      <section className="panel fr-card">
        <header className="fr-card-head">
          <strong>送り合ったもの</strong>
          <div className="seg" role="radiogroup" aria-label="しぼりこみ">
            {DIRS.map((x) => (
              <button key={x.id} type="button" role="radio" aria-checked={filter === x.id} className={filter === x.id ? "active" : ""} onClick={() => setFilter(x.id)}>
                {x.name}
              </button>
            ))}
          </div>
        </header>
        {shown.length === 0 ? <p className="fr-none">まだ ありません。</p> : (
          <ul className="fr-list">
            {shown.map((m) => {
              const open = openId === m.id;
              return (
                <li key={m.id} className={`fr-mail${open ? " is-open" : ""}`}>
                  <button type="button" className="fr-mail-row" aria-expanded={open} onClick={() => setOpenId(open ? null : m.id)}>
                    <span className={`fr-kind is-${m.type}`}><Icon name={KIND_ICON[m.type]} /></span>
                    <span className={`fr-dir is-${m.dir}`}>{m.dir === "got" ? "届いた" : "送った"}</span>
                    <span className="fr-mail-main">
                      <b>{mailTitle(m)}</b>
                      <small>{mailPreview(m)}</small>
                    </span>
                    <span className="fr-mail-time">{lastLoginText(m.at, false)}</span>
                    <span className="fr-mail-arrow" aria-hidden="true">›</span>
                  </button>
                  {open && <div className="fr-mail-body"><MailBody m={m} /></div>}
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </>
  );
}

/** 一覧の 1 行目 */
function mailTitle(m) {
  if (m.type === "quiz") return `問題「${m.quiz?.title ?? ""}」`;
  if (m.type === "gift") return `応援「${STAMPS[m.stamp] ?? ""}」`;
  return MAIL_TYPES[m.type]?.name ?? "";
}
/** 一覧の 2 行目 */
function mailPreview(m) {
  if (m.type === "quiz") return `${m.quiz?.questions?.length ?? 0}問${m.text ? `・${m.text}` : ""}`;
  return (m.text ?? "").replace(/\n/g, " ");
}

/** 開いたときの中身（手紙・問題・応援） */
function MailBody({ m }) {
  if (m.type === "quiz") return <QuizView quiz={m.quiz} note={m.text} canSolve={m.dir === "got"} />;
  if (m.type === "gift") {
    return (
      <div className="fr-gift">
        <span className={`fr-stamp is-${m.stamp}`}><Icon name={STAMP_ICON[m.stamp] ?? "heart"} /><b>{STAMPS[m.stamp]}</b></span>
        {m.text && <p>{m.text}</p>}
      </div>
    );
  }
  return <div className="fr-letter"><p>{m.text}</p></div>;
}

/** 問題：題名・問題の数・ひとこと・問題文と選択肢（正解は出さない） */
function QuizView({ quiz, note, canSolve }) {
  if (!quiz) return null;
  return (
    <div className="fr-quiz">
      <div className="fr-quiz-head">
        <span className="fr-kind is-quiz"><Icon name="quiz" /></span>
        <span><b>{quiz.title}</b><small>{quiz.questions.length}問</small></span>
        {canSolve && <button type="button" className="btn btn-primary" onClick={() => soon("問題を解く機能")}><Icon name="quiz" />問題作成で解く</button>}
      </div>
      {note && <p className="fr-quiz-note">{note}</p>}
      <ol className="fr-quiz-list">
        {quiz.questions.map((x, i) => (
          <li key={i}>
            <span className="fr-q-no">Q{i + 1}</span>
            <div>
              <p>{x.q}</p>
              <ul className="fr-choices">
                {x.choices.map((c, j) => <li key={j}><i>{CHOICE_MARKS[j] ?? j + 1}</i>{c}</li>)}
              </ul>
            </div>
          </li>
        ))}
      </ol>
    </div>
  );
}

// ───────── フレンドを追加（★ 見た目だけ。申請はまだ送れない） ─────────
function AddFriend({ user }) {
  const [id, setId] = useState("");
  const requests = MAIL_SAMPLE.filter((m) => m.type === "request");   // 届いた申請（ホームのポストにも届いている）
  const send = (e) => {
    e.preventDefault();
    soon("フレンドの申請");
  };
  return (
    <>
      <section className="panel fr-card fr-add">
        <div className="fr-add-row">
          <div>
            <strong>あなたの ID</strong>
            <p>この ID を相手に伝えると、フレンドに追加してもらえます。</p>
          </div>
          <code className="fr-my-id">{user?.userId ?? "—"}</code>
        </div>
        <form className="fr-add-row" onSubmit={send}>
          <div>
            <strong>相手の ID で追加</strong>
            <p>相手のログイン ID を入れて、申請を送ります。</p>
          </div>
          <div className="fr-add-form">
            <input className="input" value={id} onChange={(e) => setId(e.target.value)} placeholder="例：taro" aria-label="相手のログイン ID" />
            <button type="submit" className="btn btn-primary" disabled={!id.trim()}><Icon name="userPlus" />申請を送る</button>
          </div>
        </form>
      </section>
      <section className="panel fr-card">
        <header className="fr-card-head"><strong>届いた申請</strong></header>
        {requests.length === 0 ? <p className="fr-none">届いた申請はありません。</p> : (
          <ul className="fr-list">
            {requests.map((m) => (
              <li key={m.id} className="fr-row fr-request" style={{ "--c": m.from.color }}>
                <span className="fr-avatar">{m.from.name.slice(0, 1)}</span>
                <span className="fr-who">
                  <b>{m.from.name}</b>
                  <small>ID：{m.from.userId} ・ {lastLoginText(m.at, false)}</small>
                </span>
                <span className="fr-request-btns">
                  <button type="button" className="btn btn-primary" onClick={() => soon("フレンドの承認")}>承認する</button>
                  <button type="button" className="btn" onClick={() => soon("申請をことわる機能")}>ことわる</button>
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </>
  );
}

// ───────── 右はしの「おまけ」：今オンラインのフレンド（とても広い画面のときだけ出る。押すとフレンド詳細） ─────────
function OnlineAside({ online, onOpen }) {
  return (
    <AsideCard icon="friends" title="オンラインのフレンド">
      {online.length === 0 ? <p className="fr-none">今はいません。</p> : (
        <ul className="fr-aside-list">
          {online.map((f) => (
            <li key={f.userId} style={{ "--c": f.color }}>
              <button type="button" onClick={() => onOpen(f.userId)}>
                <span className="fr-avatar is-small">{f.name.slice(0, 1)}<i /></span>
                <b>{f.name}</b>
                <small>{f.achieve}%</small>
              </button>
            </li>
          ))}
        </ul>
      )}
    </AsideCard>
  );
}
