// ═══════════════════════════════════════════════════════════════
//  画面（React）から呼ぶ入口（コマンド）
//  画面側では invoke("コマンド名", { 引数 }) で呼びます（src/system/common/api.js）。
//
//  ログインしている人の ID は Rust 側（Session）で覚えておきます。
//  アカウントの変更は「ログインしている本人」の分だけできます。
// ═══════════════════════════════════════════════════════════════
use std::sync::Mutex;
use tauri::State;

use crate::account::{self, Gender, Language, ProfileInput, RegisterInput, User};
use crate::db::Db;

/// ログインしている人のログイン ID（ログアウト中は None）
#[derive(Default)]
pub struct Session(Mutex<Option<String>>);

impl Session {
    fn set(&self, user_id: Option<String>) {
        *self.0.lock().unwrap() = user_id;
    }
    fn current(&self) -> Result<String, String> {
        self.0.lock().unwrap().clone().ok_or_else(|| "ログインしていません。もう一度ログインしてください。".to_string())
    }
}

/// データベースにつながるか（起動画面で確認する）
#[tauri::command]
pub async fn db_status(db: State<'_, Db>) -> Result<(), String> {
    db.pool().await.map(|_| ())
}

#[tauri::command]
pub async fn list_genders(db: State<'_, Db>) -> Result<Vec<Gender>, String> {
    account::list_genders(&db.pool().await?).await
}

#[tauri::command]
pub async fn list_languages(db: State<'_, Db>) -> Result<Vec<Language>, String> {
    account::list_languages(&db.pool().await?).await
}

#[tauri::command]
pub async fn add_language(db: State<'_, Db>, name: String) -> Result<Language, String> {
    account::add_language(&db.pool().await?, &name).await
}

/// 新規登録（登録できたら、そのままログインした状態になる）
#[tauri::command]
pub async fn register(db: State<'_, Db>, session: State<'_, Session>, input: RegisterInput) -> Result<User, String> {
    let user = account::register(&db.pool().await?, input).await?;
    session.set(Some(user.user_id.clone()));
    Ok(user)
}

#[tauri::command]
pub async fn login(db: State<'_, Db>, session: State<'_, Session>, user_id: String, password: String) -> Result<User, String> {
    let user = account::login(&db.pool().await?, &user_id, &password).await?;
    session.set(Some(user.user_id.clone()));
    Ok(user)
}

/// 開発中だけ：入力なしでテスト用アカウント（devuser / devpassword）でログインする
/// exe（npm run tauri build）では使えません。
#[tauri::command]
pub async fn dev_login(db: State<'_, Db>, session: State<'_, Session>) -> Result<User, String> {
    if !cfg!(debug_assertions) {
        return Err("ログイン ID とパスワードを入力してください。".into());
    }
    let user = account::dev_user(&db.pool().await?).await?;
    session.set(Some(user.user_id.clone()));
    Ok(user)
}

#[tauri::command]
pub fn logout(session: State<'_, Session>) {
    session.set(None);
}

/// ログインしている人の情報（最新）
#[tauri::command]
pub async fn get_me(db: State<'_, Db>, session: State<'_, Session>) -> Result<User, String> {
    let me = session.current()?;
    account::get_user(&db.pool().await?, &me).await
}

#[tauri::command]
pub async fn update_me(db: State<'_, Db>, session: State<'_, Session>, input: ProfileInput) -> Result<User, String> {
    let me = session.current()?;
    account::update_profile(&db.pool().await?, &me, input).await
}

#[tauri::command]
pub async fn change_password(db: State<'_, Db>, session: State<'_, Session>, current: String, next: String) -> Result<(), String> {
    let me = session.current()?;
    account::change_password(&db.pool().await?, &me, &current, &next).await
}
