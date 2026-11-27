use serde::Serialize;
use std::process::Stdio;
use std::time::Duration;
use tokio::process::Command;
use tokio::time::timeout;

#[derive(Serialize)]
pub struct TaskGradeResult {
    pub passed: bool,
    pub score: u32,
    pub output: String,
    pub error: String,
}

#[derive(Serialize)]
pub struct SyntaxCheckResult {
    pub has_error: bool,
    pub error_message: String,
}

#[derive(Serialize)]
pub struct RunResult {
    pub output: String,
    pub error: String,
    pub success: bool,
}

async fn exec_python(args: &[&str]) -> Result<(String, String, bool), String> {
    let candidates = ["python", "py"];
    for cmd in candidates {
        let child = match Command::new(cmd)
            .args(args)
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
    let (stdout, stderr, success) = exec_python(&["-c", &code]).await?;
    Ok(RunResult {
        output: stdout,
        error: stderr,
        success,
    })
}

#[tauri::command]
pub async fn grade_task_code(
    code: String,
    expected_output: String,
) -> Result<TaskGradeResult, String> {
    let (stdout, stderr, success) = exec_python(&["-c", &code]).await?;

    let norm_actual = stdout.replace("\r\n", "\n").trim().to_string();
    let norm_expected = expected_output.replace("\r\n", "\n").trim().to_string();

    let passed = success && (norm_actual == norm_expected);
    let score = if passed { 100 } else { 0 };

    Ok(TaskGradeResult {
        passed,
        score,
        output: stdout,
        error: stderr,
    })
}

#[tauri::command]
pub async fn check_python_syntax(code: String) -> Result<SyntaxCheckResult, String> {
    let script = format!(
        "import py_compile, sys\ntry:\n    compile({:?}, '<string>', 'exec')\nexcept SyntaxError as e:\n    sys.stderr.write(str(e))\n    sys.exit(1)",
        code
    );
    match exec_python(&["-c", &script]).await {
        Ok((_, stderr, success)) => {
            if success {
                Ok(SyntaxCheckResult {
                    has_error: false,
                    error_message: String::new(),
                })
            } else {
                Ok(SyntaxCheckResult {
                    has_error: true,
                    error_message: stderr.trim().to_string(),
                })
            }
        }
        Err(e) => Ok(SyntaxCheckResult {
            has_error: true,
            error_message: e,
        }),
    }
}