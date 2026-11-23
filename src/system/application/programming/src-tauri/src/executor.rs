use regex::Regex;
use serde::Serialize;
use std::path::PathBuf;
use std::process::Stdio;
use std::time::Duration;
use tokio::io::AsyncReadExt;
use tokio::process::Command;
use tokio::time::timeout;
use tokio::io::AsyncWriteExt;

const TIMEOUT_SECS: u64 = 5;
const MAX_OUTPUT_BYTES: usize = 1024 * 1024; // 1 MiB

#[derive(Debug, Serialize, Clone)]
#[serde(rename_all = "camelCase")]
pub struct ExecutionResult {
    pub success: bool,
    pub stdout: String,
    pub stderr: String,
    pub timed_out: bool,
    pub truncated: bool,
    pub error_file: Option<String>,
    pub error_line: Option<u32>,
    pub error_type: Option<String>,
}

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct GradeResult {
    pub execution: ExecutionResult,
    pub is_passed: bool,
    pub score: u32,
    pub expected_output: String,
    pub actual_output: String,
    pub feedback: String,
}

fn resolve_python_path() -> PathBuf {
    let bundled = PathBuf::from("bundled_python/python.exe");
    if bundled.exists() {
        bundled
    } else {
        PathBuf::from("python")
    }
}

async fn read_limited<R: AsyncReadExt + Unpin>(mut reader: R, limit: usize) -> (String, bool) {
    let mut buf = Vec::new();
    let mut chunk = [0u8; 4096];
    let mut truncated = false;

    while let Ok(n) = reader.read(&mut chunk).await {
        if n == 0 {
            break;
        }
        if buf.len() + n > limit {
            let remain = limit.saturating_sub(buf.len());
            buf.extend_from_slice(&chunk[..remain]);
            truncated = true;
            break;
        }
        buf.extend_from_slice(&chunk[..n]);
    }

    (String::from_utf8_lossy(&buf).to_string(), truncated)
}

fn parse_traceback(stderr: &str) -> (Option<String>, Option<u32>, Option<String>) {
    let re_file = Regex::new(r#"File "([^"]+)", line (\d+)"#).unwrap();
    let mut error_file = None;
    let mut error_line = None;

    for cap in re_file.captures_iter(stderr) {
        let raw_path = &cap[1];
        let fname = std::path::Path::new(raw_path)
            .file_name()
            .and_then(|s| s.to_str())
            .unwrap_or(raw_path)
            .to_string();
        error_file = Some(fname);
        error_line = cap[2].parse::<u32>().ok();
    }

    let error_type = stderr
        .lines()
        .rev()
        .find(|line| !line.trim().is_empty())
        .and_then(|last| last.split(':').next())
        .map(|s| s.trim().to_string());

    (error_file, error_line, error_type)
}

#[tauri::command]
pub async fn run_python_code(
    project_dir: String,
    entry_file: String,
) -> Result<ExecutionResult, String> {
    let python = resolve_python_path();
    let work_dir = PathBuf::from(&project_dir);

    if !work_dir.exists() {
        return Err(format!("作業フォルダが見つかりません: {}", project_dir));
    }

    let mut child = Command::new(python)
        .arg("-u")
        .arg(&entry_file)
        .current_dir(&work_dir)
        .env("PYTHONIOENCODING", "utf-8")
        .stdout(Stdio::piped())
        .stderr(Stdio::piped())
        .kill_on_drop(true)
        .spawn()
        .map_err(|e| format!("Pythonの起動に失敗しました: {}", e))?;

    let stdout_pipe = child.stdout.take().ok_or("stdout取得失敗")?;
    let stderr_pipe = child.stderr.take().ok_or("stderr取得失敗")?;

    let exec_future = async {
        let (out_res, err_res) = tokio::join!(
            read_limited(stdout_pipe, MAX_OUTPUT_BYTES),
            read_limited(stderr_pipe, MAX_OUTPUT_BYTES)
        );
        let status = child.wait().await.map_err(|e| e.to_string())?;
        Ok::<_, String>((status, out_res, err_res))
    };

    match timeout(Duration::from_secs(TIMEOUT_SECS), exec_future).await {
        Ok(Ok((status, (stdout, out_trunc), (stderr, err_trunc)))) => {
            let truncated = out_trunc || err_trunc;
            let (error_file, error_line, error_type) = if !status.success() {
                parse_traceback(&stderr)
            } else {
                (None, None, None)
            };

            Ok(ExecutionResult {
                success: status.success() && !truncated,
                stdout,
                stderr,
                timed_out: false,
                truncated,
                error_file,
                error_line,
                error_type,
            })
        }
        Ok(Err(e)) => Err(e),
        Err(_) => {
            let _ = child.kill().await;
            Ok(ExecutionResult {
                success: false,
                stdout: String::new(),
                stderr: format!(
                    "実行時間が上限（{}秒）を超えたため停止しました。無限ループになっていないか確認しよう！",
                    TIMEOUT_SECS
                ),
                timed_out: true,
                truncated: false,
                error_file: Some(entry_file),
                error_line: None,
                error_type: Some("Timeout".to_string()),
            })
        }
    }
}

/// 課題の自動採点コマンド（期待出力との照合・80点以上合格判定）
#[tauri::command]
pub async fn grade_task_code(
    project_dir: String,
    entry_file: String,
    expected_output: String,
) -> Result<GradeResult, String> {
    let execution = run_python_code(project_dir, entry_file).await?;

    let norm_expected = expected_output.replace("\r\n", "\n").trim().to_string();
    let norm_actual = execution.stdout.replace("\r\n", "\n").trim().to_string();

    // エラー・タイムアウト時は必ず不合格
    if !execution.success || execution.timed_out {
        return Ok(GradeResult {
            execution,
            is_passed: false,
            score: 0,
            expected_output: norm_expected,
            actual_output: norm_actual,
            feedback: "エラーが発生しているため合格できません。まずはエラーを直してみよう！".to_string(),
        });
    }

    if norm_actual == norm_expected {
        Ok(GradeResult {
            execution,
            is_passed: true,
            score: 100,
            expected_output: norm_expected,
            actual_output: norm_actual,
            feedback: "完璧！期待通りの出力になったね！（100点 / 合格）".to_string(),
        })
    } else if !norm_actual.is_empty() {
        // 実行は通ったが出力が異なる場合（論理エラー・部分点）
        Ok(GradeResult {
            execution,
            is_passed: false,
            score: 50,
            expected_output: norm_expected,
            actual_output: norm_actual,
            feedback: "プログラムは動いたけれど、期待する出力と少し違うみたい。文字や計算式を見直してみよう！".to_string(),
        })
    } else {
        Ok(GradeResult {
            execution,
            is_passed: false,
            score: 20,
            expected_output: norm_expected,
            actual_output: norm_actual,
            feedback: "画面に何も表示されていないよ。print() を使って出力してみよう！".to_string(),
        })
    }
}
// ファイル末尾に追記
#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct SyntaxCheckResult {
    pub ok: bool,
    pub line: Option<u32>,
    pub column: Option<u32>,
    pub message: Option<String>,
}

/// コードを実行せず、Pythonの構文エラーだけを高速にチェックする
#[tauri::command]
pub async fn check_python_syntax(code: String) -> Result<SyntaxCheckResult, String> {
    if code.trim().is_empty() {
        return Ok(SyntaxCheckResult {
            ok: true,
            line: None,
            column: None,
            message: None,
        });
    }

    let python = resolve_python_path();
    let checker = r#"
import sys, json
src = sys.stdin.read()
try:
    compile(src, '<editor>', 'exec')
    print(json.dumps({'ok': True}))
except SyntaxError as e:
    print(json.dumps({'ok': False, 'line': e.lineno, 'column': e.offset, 'message': e.msg}))
"#;

    let mut child = Command::new(python)
        .arg("-c")
        .arg(checker)
        .env("PYTHONIOENCODING", "utf-8")
        .stdin(Stdio::piped())
        .stdout(Stdio::piped())
        .stderr(Stdio::piped())
        .kill_on_drop(true)
        .spawn()
        .map_err(|e| format!("構文チェック起動失敗: {}", e))?;

    if let Some(mut stdin) = child.stdin.take() {
        let _ = stdin.write_all(code.as_bytes()).await;
        // stdin を drop して EOF を通知
    }

    match timeout(Duration::from_secs(2), child.wait_with_output()).await {
        Ok(Ok(output)) => {
            let stdout = String::from_utf8_lossy(&output.stdout);
            if let Ok(val) = serde_json::from_str::<serde_json::Value>(stdout.trim()) {
                let ok = val["ok"].as_bool().unwrap_or(true);
                let line = val["line"].as_u64().map(|v| v as u32);
                let column = val["column"].as_u64().map(|v| v as u32);
                let message = val["message"].as_str().map(|s| s.to_string());
                return Ok(SyntaxCheckResult {
                    ok,
                    line,
                    column,
                    message,
                });
            }
            Ok(SyntaxCheckResult {
                ok: true,
                line: None,
                column: None,
                message: None,
            })
        }
        _ => Ok(SyntaxCheckResult {
            ok: true,
            line: None,
            column: None,
            message: None,
        }),
    }
}