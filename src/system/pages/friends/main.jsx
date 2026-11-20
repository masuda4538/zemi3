// ═══════════════════════════════════════════════════════════════
//  フレンド：画面（見た目）　［このフォルダーの入口：main.jsx］　★ 今は見た目のイメージだけ
//  アチーブ・設定・アカウントと同じ形（core/components/SettingsLayout.jsx）：上にバー、左に項目、右に中身
//    フレンド一覧   … 名前とアイコン・オンライン（または最後のログイン）・アチーブの取得率。「すべて／オンライン」で しぼれる
//    フレンドを追加 … 自分の ID と、相手の ID を入れる欄。★ 申請はまだ送れない（押すと「準備中」とお知らせ）
//    右はし（とても広い画面のときだけ）… 今オンラインのフレンド
//  フレンドは、今は仮のデータ（friends-sample.js）。ホームの広場にも同じフレンドが歩いています（application/home/js/plaza.js）
//  core/App.jsx から user（ログインしている人）を受け取ります。
// ═══════════════════════════════════════════════════════════════
import { useState } from "react";
import SettingsLayout, { AsideCard } from "../../core/components/SettingsLayout";
import Icon from "../../core/components/Icon";
import { notify } from "../../core/utils/notify.js";
import { FRIENDS_SAMPLE, lastLoginText } from "./friends-sample.js";
import "./friends.css";

/** 左の項目（上から順に並ぶ） */
const SECTIONS = [
  { id: "list", name: "フレンド一覧", icon: "friends", desc: "フレンドの、オンラインかどうか・最後のログイン・アチーブの取得率が見られます。" },
  { id: "add", name: "フレンドを追加", icon: "userPlus", desc: "相手のログイン ID を入れて、フレンドの申請を送ります。" },
];

/** しぼりこみ */
const FILTERS = [
  { id: "all", name: "すべて" },
  { id: "online", name: "オンライン" },
];

export default function Friends({ user }) {
  const [current, setCurrent] = useState("list");
  const friends = FRIENDS_SAMPLE;
  const online = friends.filter((f) => f.online);
  const items = SECTIONS.map((s) => (s.id === "list" ? { ...s, badge: String(friends.length) } : s));
  const section = SECTIONS.find((s) => s.id === current);

  return (
    <SettingsLayout
      bar={{ icon: "friends", page: "フレンド", note: `${friends.length}人・オンライン ${online.length}人` }}
      items={items}
      current={current}
      onSelect={setCurrent}
      title={section.name}
      desc={section.desc}
      aside={<OnlineAside online={online} />}
    >
      <p className="fr-sample"><Icon name="alert" />今は見た目のイメージです。フレンドは仮の人たちで、まだ本当の機能はありません。</p>
      {current === "list" && <FriendList friends={friends} />}
      {current === "add" && <AddFriend user={user} />}
    </SettingsLayout>
  );
}

// ───────── フレンド一覧 ─────────
function FriendList({ friends }) {
  const [filter, setFilter] = useState("all");
  // オンラインの人を上に。そのあとは最後のログインが新しい順
  const sorted = [...friends].sort((a, b) => (b.online - a.online) || ((b.lastLogin?.getTime() ?? 0) - (a.lastLogin?.getTime() ?? 0)));
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
            <li key={f.userId} className="fr-row" style={{ "--c": f.color }}>
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
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

// ───────── フレンドを追加（★ 見た目だけ。申請はまだ送れない） ─────────
function AddFriend({ user }) {
  const [id, setId] = useState("");
  const send = (e) => {
    e.preventDefault();
    notify({ type: "info", title: "フレンドの申請は準備中です", message: "今は見た目のイメージだけで、まだ申請は送れません。", key: "friends" });
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
        <p className="fr-none">届いた申請はありません。</p>
      </section>
    </>
  );
}

// ───────── 右はしの「おまけ」：今オンラインのフレンド（とても広い画面のときだけ出る） ─────────
function OnlineAside({ online }) {
  return (
    <AsideCard icon="friends" title="オンラインのフレンド">
      {online.length === 0 ? <p className="fr-none">今はいません。</p> : (
        <ul className="fr-aside-list">
          {online.map((f) => (
            <li key={f.userId} style={{ "--c": f.color }}>
              <span className="fr-avatar is-small">{f.name.slice(0, 1)}<i /></span>
              <b>{f.name}</b>
              <small>{f.achieve}%</small>
            </li>
          ))}
        </ul>
      )}
    </AsideCard>
  );
}
