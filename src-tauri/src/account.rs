// ═══════════════════════════════════════════════════════════════
//  アカウントの処理（ログイン・新規登録・情報の変更・パスワードの変更）
//
//  テーブル：user / gender / language / user_language（db/sotsuken.sql）
//  パスワードは Argon2 で暗号化して保存します（元のパスワードは保存しない）。
//  画面から呼ぶ入口は commands.rs にあります。
// ═══════════════════════════════════════════════════════════════
use argon2::password_hash::rand_core::{OsRng, RngCore};
use argon2::password_hash::{PasswordHash, PasswordHasher, PasswordVerifier, SaltString};
use argon2::Argon2;
use serde::{Deserialize, Serialize};
use sqlx::{MySqlPool, Row};

use crate::db::db_error;

// ───────── 画面とやり取りするデータ ─────────

#[derive(Debug, Serialize, Clone)]
#[serde(rename_all = "camelCase")]
pub struct Gender {
    pub gender_id: i32,
    pub gender_name: String,
}

#[derive(Debug, Serialize, Clone)]
#[serde(rename_all = "camelCase")]
pub struct Language {
    pub language_id: String,
    pub language_name: String,
}

/// ログインしている人の情報（パスワードは入れない）
#[derive(Debug, Serialize, Clone)]
#[serde(rename_all = "camelCase")]
pub struct User {
    pub user_id: String,
    pub name: String,
    pub mail: String,
    pub gender_id: i32,
    pub gender_name: String,
    pub birth_date: String,
    pub languages: Vec<Language>,
    pub created_at: String,
    pub updated_at: String,
}

/// 新規登録で受け取る内容
#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct RegisterInput {
    pub user_id: String,
    pub name: String,
    pub password: String,
    pub mail: String,
    pub gender_id: i32,
    pub birth_date: String,
    #[serde(default)]
    pub language_ids: Vec<String>,
}

/// アカウント画面で変更する内容（ログイン ID は変更しない）
#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ProfileInput {
    pub name: String,
    pub mail: String,
    pub gender_id: i32,
    pub birth_date: String,
    #[serde(default)]
    pub language_ids: Vec<String>,
}

// ───────── 入力のチェック ─────────

pub fn check_user_id(id: &str) -> Result<(), String> {
    let len = id.chars().count();
    if len == 0 {
        return Err("ログイン ID を入力してください。".into());
    }
    if !(4..=16).contains(&len) {
        return Err("ログイン ID は 4〜16 文字にしてください。".into());
    }
    if !id.chars().all(|c| c.is_ascii_alphanumeric() || c == '_' || c == '-') {
        return Err("ログイン ID は半角英数字と _ - だけで入力してください。".into());
    }
    Ok(())
}

pub fn check_password(pw: &str) -> Result<(), String> {
    let len = pw.chars().count();
    if len == 0 {
        return Err("パスワードを入力してください。".into());
    }
    if !(8..=64).contains(&len) {
        return Err("パスワードは 8〜64 文字にしてください。".into());
    }
    Ok(())
}

fn check_profile(name: &str, mail: &str, birth_date: &str) -> Result<(), String> {
    if name.trim().is_empty() {
        return Err("名前を入力してください。".into());
    }
    if name.chars().count() > 255 {
        return Err("名前が長すぎます（255 文字まで）。".into());
    }
    let mail = mail.trim();
    if mail.is_empty() {
        return Err("メールアドレスを入力してください。".into());
    }
    let ok_mail = mail.len() <= 255
        && !mail.contains(char::is_whitespace)
        && mail.split_once('@').is_some_and(|(a, b)| !a.is_empty() && b.contains('.') && !b.starts_with('.') && !b.ends_with('.'));
    if !ok_mail {
        return Err("メールアドレスの形が正しくありません。".into());
    }
    if birth_date.trim().is_empty() {
        return Err("生年月日を入力してください。".into());
    }
    Ok(())
}

/// 生年月日が正しい日付で、1900 年〜今日の間か（日付の判定は MariaDB に任せる）
async fn check_birth_date(pool: &MySqlPool, birth_date: &str) -> Result<(), String> {
    let shape_ok = birth_date.len() == 10
        && birth_date.chars().enumerate().all(|(i, c)| if i == 4 || i == 7 { c == '-' } else { c.is_ascii_digit() });
    if !shape_ok {
        return Err("生年月日は YYYY-MM-DD の形で入力してください。".into());
    }
    // 2 月 30 日のような、ない日付をはじく
    let (y, m, d): (u32, u32, u32) = (
        birth_date[0..4].parse().unwrap_or(0),
        birth_date[5..7].parse().unwrap_or(0),
        birth_date[8..10].parse().unwrap_or(0),
    );
    let leap = (y % 4 == 0 && y % 100 != 0) || y % 400 == 0;
    let days = match m {
        1 | 3 | 5 | 7 | 8 | 10 | 12 => 31,
        4 | 6 | 9 | 11 => 30,
        2 if leap => 29,
        2 => 28,
        _ => 0,
    };
    if d == 0 || d > days {
        return Err("生年月日が正しくありません（ない日付です）。".into());
    }
    // 1900 年〜今日の間か（今日の日付は MariaDB に聞く）
    let row = sqlx::query("SELECT CAST(? BETWEEN '1900-01-01' AND CURDATE() AS SIGNED) AS ok")
    .bind(birth_date)
    .fetch_one(pool)
    .await
    .map_err(db_error)?;
    let ok: i64 = row.try_get("ok").map_err(db_error)?;
    if ok != 1 {
        return Err("生年月日が正しくありません（1900 年〜今日までの日付）。".into());
    }
    Ok(())
}

async fn check_gender(pool: &MySqlPool, gender_id: i32) -> Result<(), String> {
    let n: i64 = sqlx::query_scalar("SELECT COUNT(*) FROM gender WHERE gender_id = ?")
        .bind(gender_id)
        .fetch_one(pool)
        .await
        .map_err(db_error)?;
    if n == 0 {
        return Err("性別を選んでください。".into());
    }
    Ok(())
}

/// 選ばれた言語・試験（重複を除く）がすべて登録されているか
async fn check_languages(pool: &MySqlPool, ids: &[String]) -> Result<Vec<String>, String> {
    let mut unique: Vec<String> = Vec::new();
    for id in ids {
        if !unique.contains(id) {
            unique.push(id.clone());
        }
    }
    for id in &unique {
        let n: i64 = sqlx::query_scalar("SELECT COUNT(*) FROM language WHERE language_id = ?")
            .bind(id)
            .fetch_one(pool)
            .await
            .map_err(db_error)?;
        if n == 0 {
            return Err(format!("言語・試験（{id}）が見つかりません。画面を開き直してください。"));
        }
    }
    Ok(unique)
}

// ───────── パスワードの暗号化 ─────────

fn hash_password(pw: &str) -> Result<String, String> {
    let salt = SaltString::generate(&mut OsRng);
    Argon2::default()
        .hash_password(pw.as_bytes(), &salt)
        .map(|h| h.to_string())
        .map_err(|e| format!("パスワードを暗号化できませんでした：{e}"))
}

fn verify_password(pw: &str, hash: &str) -> bool {
    PasswordHash::new(hash)
        .map(|parsed| Argon2::default().verify_password(pw.as_bytes(), &parsed).is_ok())
        .unwrap_or(false)
}

/// 16 文字のランダムな ID（user_language_id・language_id に使う）
pub fn new_id() -> String {
    let mut bytes = [0u8; 8];
    OsRng.fill_bytes(&mut bytes);
    bytes.iter().map(|b| format!("{b:02x}")).collect()
}

// ───────── 一覧 ─────────

pub async fn list_genders(pool: &MySqlPool) -> Result<Vec<Gender>, String> {
    let rows = sqlx::query("SELECT gender_id, gender_name FROM gender ORDER BY gender_id")
        .fetch_all(pool)
        .await
        .map_err(db_error)?;
    rows.iter()
        .map(|r| Ok(Gender { gender_id: r.try_get("gender_id").map_err(db_error)?, gender_name: r.try_get("gender_name").map_err(db_error)? }))
        .collect()
}

fn to_language(r: &sqlx::mysql::MySqlRow) -> Result<Language, String> {
    Ok(Language {
        language_id: r.try_get("language_id").map_err(db_error)?,
        language_name: r.try_get("language_name").map_err(db_error)?,
    })
}

pub async fn list_languages(pool: &MySqlPool) -> Result<Vec<Language>, String> {
    let rows = sqlx::query("SELECT language_id, language_name FROM language ORDER BY language_name")
        .fetch_all(pool)
        .await
        .map_err(db_error)?;
    rows.iter().map(to_language).collect()
}

/// 言語・試験を追加する（同じ名前がすでにあれば、それを返す）
pub async fn add_language(pool: &MySqlPool, name: &str) -> Result<Language, String> {
    let name = name.trim();
    if name.is_empty() {
        return Err("言語・試験の名前を入力してください。".into());
    }
    if name.chars().count() > 255 {
        return Err("名前が長すぎます（255 文字まで）。".into());
    }
    let find = "SELECT language_id, language_name FROM language WHERE language_name = ?";
    if let Some(r) = sqlx::query(find).bind(name).fetch_optional(pool).await.map_err(db_error)? {
        return to_language(&r);
    }
    let id = new_id();
    sqlx::query("INSERT INTO language (language_id, language_name) VALUES (?, ?)")
        .bind(&id)
        .bind(name)
        .execute(pool)
        .await
        .map_err(db_error)?;
    Ok(Language { language_id: id, language_name: name.to_string() })
}

// ───────── アカウント ─────────

/// ログイン ID から、その人の情報を取り出す
pub async fn get_user(pool: &MySqlPool, user_id: &str) -> Result<User, String> {
    let r = sqlx::query(
        "SELECT u.user_id, u.name, u.mail, u.gender_id, g.gender_name,
                CAST(DATE_FORMAT(u.birth_date, '%Y-%m-%d') AS CHAR) AS birth_date,
                CAST(DATE_FORMAT(u.created_at, '%Y-%m-%d %H:%i') AS CHAR) AS created_at,
                CAST(DATE_FORMAT(u.updated_at, '%Y-%m-%d %H:%i') AS CHAR) AS updated_at
           FROM user u JOIN gender g ON g.gender_id = u.gender_id
          WHERE u.user_id = ?",
    )
    .bind(user_id)
    .fetch_optional(pool)
    .await
    .map_err(db_error)?
    .ok_or_else(|| "アカウントが見つかりません。".to_string())?;

    let langs = sqlx::query(
        "SELECT l.language_id, l.language_name
           FROM user_language ul JOIN language l ON l.language_id = ul.language_id
          WHERE ul.user_id = ?
          ORDER BY l.language_name",
    )
    .bind(user_id)
    .fetch_all(pool)
    .await
    .map_err(db_error)?;

    Ok(User {
        user_id: r.try_get("user_id").map_err(db_error)?,
        name: r.try_get("name").map_err(db_error)?,
        mail: r.try_get("mail").map_err(db_error)?,
        gender_id: r.try_get("gender_id").map_err(db_error)?,
        gender_name: r.try_get("gender_name").map_err(db_error)?,
        birth_date: r.try_get("birth_date").map_err(db_error)?,
        created_at: r.try_get("created_at").map_err(db_error)?,
        updated_at: r.try_get("updated_at").map_err(db_error)?,
        languages: langs.iter().map(to_language).collect::<Result<_, _>>()?,
    })
}

/// 言語・試験の登録をまるごと入れ替える（トランザクションの中で使う）
async fn replace_languages(tx: &mut sqlx::Transaction<'_, sqlx::MySql>, user_id: &str, ids: &[String]) -> Result<(), String> {
    sqlx::query("DELETE FROM user_language WHERE user_id = ?")
        .bind(user_id)
        .execute(&mut **tx)
        .await
        .map_err(db_error)?;
    for id in ids {
        sqlx::query("INSERT INTO user_language (user_language_id, user_id, language_id) VALUES (?, ?, ?)")
            .bind(new_id())
            .bind(user_id)
            .bind(id)
            .execute(&mut **tx)
            .await
            .map_err(db_error)?;
    }
    Ok(())
}

async fn mail_used_by_other(pool: &MySqlPool, mail: &str, me: &str) -> Result<bool, String> {
    let n: i64 = sqlx::query_scalar("SELECT COUNT(*) FROM user WHERE mail = ? AND user_id <> ?")
        .bind(mail)
        .bind(me)
        .fetch_one(pool)
        .await
        .map_err(db_error)?;
    Ok(n > 0)
}

/// 新規登録
pub async fn register(pool: &MySqlPool, input: RegisterInput) -> Result<User, String> {
    let user_id = input.user_id.trim().to_string();
    check_user_id(&user_id)?;
    check_profile(&input.name, &input.mail, &input.birth_date)?;
    check_password(&input.password)?;
    check_gender(pool, input.gender_id).await?;
    check_birth_date(pool, input.birth_date.trim()).await?;
    let language_ids = check_languages(pool, &input.language_ids).await?;

    let used: i64 = sqlx::query_scalar("SELECT COUNT(*) FROM user WHERE user_id = ?")
        .bind(&user_id)
        .fetch_one(pool)
        .await
        .map_err(db_error)?;
    if used > 0 {
        return Err("このログイン ID はすでに使われています。別の ID にしてください。".into());
    }
    let mail = input.mail.trim().to_string();
    if mail_used_by_other(pool, &mail, &user_id).await? {
        return Err("このメールアドレスはすでに登録されています。".into());
    }

    let password = input.password.clone();
    let hash = run_blocking(move || hash_password(&password)).await?;

    let mut tx = pool.begin().await.map_err(db_error)?;
    sqlx::query(
        "INSERT INTO user (user_id, name, password, mail, gender_id, birth_date, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, NOW(), NOW())",
    )
    .bind(&user_id)
    .bind(input.name.trim())
    .bind(&hash)
    .bind(&mail)
    .bind(input.gender_id)
    .bind(input.birth_date.trim())
    .execute(&mut *tx)
    .await
    .map_err(|e| duplicate_message(e))?;
    replace_languages(&mut tx, &user_id, &language_ids).await?;
    tx.commit().await.map_err(db_error)?;

    get_user(pool, &user_id).await
}

/// ログイン（ID とパスワードが合っていれば、その人の情報を返す）
pub async fn login(pool: &MySqlPool, user_id: &str, password: &str) -> Result<User, String> {
    let user_id = user_id.trim();
    if user_id.is_empty() || password.is_empty() {
        return Err("ログイン ID とパスワードを入力してください。".into());
    }
    let hash: Option<String> = sqlx::query_scalar("SELECT password FROM user WHERE user_id = ?")
        .bind(user_id)
        .fetch_optional(pool)
        .await
        .map_err(db_error)?;
    let (pw, h) = (password.to_string(), hash.clone().unwrap_or_default());
    let ok = hash.is_some() && run_blocking(move || Ok(verify_password(&pw, &h))).await?;
    if !ok {
        return Err("ログイン ID またはパスワードが違います。".into());
    }
    get_user(pool, user_id).await
}

/// アカウント情報の変更
pub async fn update_profile(pool: &MySqlPool, user_id: &str, input: ProfileInput) -> Result<User, String> {
    check_profile(&input.name, &input.mail, &input.birth_date)?;
    check_gender(pool, input.gender_id).await?;
    check_birth_date(pool, input.birth_date.trim()).await?;
    let language_ids = check_languages(pool, &input.language_ids).await?;
    let mail = input.mail.trim().to_string();
    if mail_used_by_other(pool, &mail, user_id).await? {
        return Err("このメールアドレスはほかの人が使っています。".into());
    }

    let mut tx = pool.begin().await.map_err(db_error)?;
    let done = sqlx::query("UPDATE user SET name = ?, mail = ?, gender_id = ?, birth_date = ?, updated_at = NOW() WHERE user_id = ?")
        .bind(input.name.trim())
        .bind(&mail)
        .bind(input.gender_id)
        .bind(input.birth_date.trim())
        .bind(user_id)
        .execute(&mut *tx)
        .await
        .map_err(|e| duplicate_message(e))?;
    if done.rows_affected() == 0 {
        return Err("アカウントが見つかりません。".into());
    }
    replace_languages(&mut tx, user_id, &language_ids).await?;
    tx.commit().await.map_err(db_error)?;
    get_user(pool, user_id).await
}

/// パスワードの変更（今のパスワードが合っているときだけ）
pub async fn change_password(pool: &MySqlPool, user_id: &str, current: &str, next: &str) -> Result<(), String> {
    if current.is_empty() {
        return Err("今のパスワードを入力してください。".into());
    }
    check_password(next)?;
    let hash: Option<String> = sqlx::query_scalar("SELECT password FROM user WHERE user_id = ?")
        .bind(user_id)
        .fetch_optional(pool)
        .await
        .map_err(db_error)?;
    let hash = hash.ok_or_else(|| "アカウントが見つかりません。".to_string())?;
    let cur = current.to_string();
    if !run_blocking(move || Ok(verify_password(&cur, &hash))).await? {
        return Err("今のパスワードが違います。".into());
    }
    let pw = next.to_string();
    let new_hash = run_blocking(move || hash_password(&pw)).await?;
    sqlx::query("UPDATE user SET password = ?, updated_at = NOW() WHERE user_id = ?")
        .bind(&new_hash)
        .bind(user_id)
        .execute(pool)
        .await
        .map_err(db_error)?;
    Ok(())
}

/// 同時に同じ ID・メールで登録されたとき（UNIQUE 違反）のメッセージ
fn duplicate_message(e: sqlx::Error) -> String {
    if let sqlx::Error::Database(db) = &e {
        if db.is_unique_violation() {
            return if db.message().contains("mail") {
                "このメールアドレスはすでに登録されています。".into()
            } else {
                "このログイン ID はすでに使われています。".into()
            };
        }
    }
    db_error(e)
}

/// 時間のかかる計算（パスワードの暗号化）を、画面を止めずに別のスレッドで行う
async fn run_blocking<T: Send + 'static>(f: impl FnOnce() -> Result<T, String> + Send + 'static) -> Result<T, String> {
    tokio::task::spawn_blocking(f).await.map_err(|e| format!("処理に失敗しました：{e}"))?
}

// ───────── 開発中だけ使うテスト用アカウント ─────────

pub const DEV_USER_ID: &str = "devuser";
pub const DEV_PASSWORD: &str = "devpassword";

/// テスト用アカウント（devuser / devpassword）を返す。まだなければ作る
pub async fn dev_user(pool: &MySqlPool) -> Result<User, String> {
    let exists: i64 = sqlx::query_scalar("SELECT COUNT(*) FROM user WHERE user_id = ?")
        .bind(DEV_USER_ID)
        .fetch_one(pool)
        .await
        .map_err(db_error)?;
    if exists == 0 {
        let gender_id: Option<i32> = sqlx::query_scalar("SELECT MIN(gender_id) FROM gender")
            .fetch_one(pool)
            .await
            .map_err(db_error)?;
        let gender_id = gender_id.ok_or_else(|| "gender テーブルが空です。db/sotsuken.sql を流してください。".to_string())?;
        let hash = run_blocking(|| hash_password(DEV_PASSWORD)).await?;
        sqlx::query(
            "INSERT INTO user (user_id, name, password, mail, gender_id, birth_date, created_at, updated_at)
             VALUES (?, 'テスト ユーザー', ?, 'devuser@example.invalid', ?, '2000-01-01', NOW(), NOW())",
        )
        .bind(DEV_USER_ID)
        .bind(&hash)
        .bind(gender_id)
        .execute(pool)
        .await
        .map_err(|e| duplicate_message(e))?;
    }
    get_user(pool, DEV_USER_ID).await
}
