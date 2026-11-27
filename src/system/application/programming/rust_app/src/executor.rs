use serde::Serialize;
use std::process::Stdio;
use std::time::Duration;
use tokio::process::Command;
use tokio::time::timeout;

#[derive(Serialize)]
pub struct RunResult {
    pub output: String,
    pub error: String,
}

#[derive(Serialize)]
pub struct GradeResult {
    pub output: String,
    pub passed: bool,
    pub score: u32,
    pub error: String,
}

#[derive(Serialize)]
pub struct SyntaxResult {
    pub has_error: bool,
    pub error_message: String,
}

async fn exec_python(args: &[&str]) -> Result<(String, String, bool), String> {
    let candidates = ["python", "py"];
    for cmd in candidates {
        let mut child = match Command::new(cmd)
            .args(args)
            // ★ Windows環境での文字化けを防ぐためUTF-8を強制
            .env("PYTHONIOENCODING", "utf-8")
            .env("PYTHONUTF8", "1")
            .stdout(Stdio::piped())
            .stderr(Stdio::piped())
            .spawn()
        {
            Ok(c) => c,
            Err(_) => continue,
        };

        let res = timeout(Duration::from_secs(5), child.wait_with_output()).await;
        return match res {
            Ok(Ok(out)) => {
                let stdout = String::from_utf8_lossy(&out.stdout).to_string();
                let stderr = String::from_utf8_lossy(&out.stderr).to_string();
                Ok((stdout, stderr, out.status.success()))
            }
            Ok(Err(e)) => Err(format!("実行エラー: {}", e)),
            Err(_) => Err("タイムアウト: 5秒以内に終了しませんでした。".to_string()),
        };
    }
    Err("Pythonが見つかりません（python / py コマンドがPATHに通っているか確認してください）。".to_string())
}

#[tauri::command]
pub async fn run_python_code(code: String) -> Result<RunResult, String> {
    let (stdout, stderr, _ok) = exec_python(&["-c", &code]).await?;
    Ok(RunResult {
        output: stdout,
        error: stderr,
    })
}

#[tauri::command]
pub async fn grade_task_code(code: String, expected_output: String) -> Result<GradeResult, String> {
    let (stdout, stderr, ok) = exec_python(&["-c", &code]).await?;
    let actual = stdout.replace("\r\n", "\n").trim().to_string();
    let expected = expected_output.replace("\r\n", "\n").trim().to_string();
    let passed = ok && stderr.is_empty() && actual == expected;

    Ok(GradeResult {
        output: actual,
        passed,
        score: if passed { 100 } else { 0 },
        error: stderr,
    })
}

#[tauri::command]
pub async fn check_python_syntax(code: String) -> Result<SyntaxResult, String> {
    let script = "import sys, ast; ast.parse(sys.argv[1])";
    let (_stdout, stderr, ok) = exec_python(&["-c", script, &code]).await?;
    Ok(SyntaxResult {
        has_error: !ok,
        error_message: stderr.lines().last().unwrap_or("").to_string(),
    })
}
