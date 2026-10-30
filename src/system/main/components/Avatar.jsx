// ═══════════════════════════════════════════════════════════════
//  アカウントのアイコン（丸）
//    画像があれば画像、なければ名前の 1 文字
//    <Avatar user={user} size={48} />
//  画像は user.avatar（アカウント → プロフィール で変えられる）
// ═══════════════════════════════════════════════════════════════
export default function Avatar({ user, size = 40, className = "" }) {
  const letter = [...(user?.name ?? "").trim()][0] ?? "?";
  return (
    <span className={`avatar ${className}`} style={{ width: size, height: size, fontSize: Math.round(size * 0.42) }} aria-hidden="true">
      {user?.avatar ? <img src={user.avatar} alt="" draggable={false} /> : letter}
    </span>
  );
}
