// ═══════════════════════════════════════════════════════════════
//  データベース（MariaDB）への接続
//
//  つなぎ先：この PC の MariaDB の「sotsuken」データベース（nkc-user / nkc）
//  別の場所につなぎたいときは、環境変数 SOTSUKEN_DB_URL で変えられます。
//    例）SOTSUKEN_DB_URL=mysql://nkc-user:nkc@192.168.0.10:3306/sotsuken npm run tauri dev
//
//  アプリの起動時ではなく、最初に使うときに接続します（MariaDB が止まっていてもアプリは起動する）。
// ═══════════════════════════════════════════════════════════════
use sqlx::mysql::{MySqlPool, MySqlPoolOptions};
use std::time::Duration;
use tokio::sync::Mutex;

pub const DEFAULT_URL: &str = "mysql://nkc-user:nkc@127.0.0.1:3306/sotsuken";

#[derive(Default)]
pub struct Db {
    pool: Mutex<Option<MySqlPool>>,
}

impl Db {
    /// 接続（まだつないでいなければ、ここでつなぐ）
    pub async fn pool(&self) -> Result<MySqlPool, String> {
        let mut slot = self.pool.lock().await;
        if let Some(pool) = slot.as_ref() {
            return Ok(pool.clone());
        }
        let url = std::env::var("SOTSUKEN_DB_URL").unwrap_or_else(|_| DEFAULT_URL.to_string());
        let pool = MySqlPoolOptions::new()
            .max_connections(5)
            .acquire_timeout(Duration::from_secs(5))
            .connect(&url)
            .await
            .map_err(connect_message)?;
        *slot = Some(pool.clone());
        Ok(pool)
    }
}

/// つながらなかった理由を、わかりやすい言葉にする
fn connect_message(e: sqlx::Error) -> String {
    if let sqlx::Error::Database(db) = &e {
        match db.code().as_deref() {
            Some("42000") if db.message().contains("Unknown database") => {
                return "データベース「sotsuken」がありません。ターミナルで mariadb < db/sotsuken.sql を実行してください。".into();
            }
            Some("28000") => {
                return "MariaDB にログインできません（ユーザー名かパスワードが違います）。".into();
            }
            _ => {}
        }
    }
    match e {
        sqlx::Error::Io(_) | sqlx::Error::PoolTimedOut => {
            "MariaDB につながりません。MariaDB が動いているか確認してください（sudo service mariadb start）。".into()
        }
        other => format!("データベースにつながりません：{other}"),
    }
}

/// データベースのエラーを、画面に出す文にする
pub fn db_error(e: sqlx::Error) -> String {
    format!("データベースのエラー：{e}")
}
