use serde::{Deserialize, Serialize};
use serde_json::json;
use std::time::Duration;

#[derive(Serialize)]
pub struct AiHintResult {
    pub hint: String,
}

#[derive(Deserialize)]
struct OllamaResp {
    response: Option<String>,
}

#[tauri::command]
pub async fn ask_ai_hint(
    user_code: String,
    task_prompt: String,
    hint_level: u8,
) -> Result<AiHintResult, String> {
    let prompt = format!(
        "あなたはプログラミング初学者向けのメンターです。答えのコード全文は書かず、レベル{}の短いヒントを日本語で1〜2文で伝えてください。\n課題: {}\nコード:\n{}",
        hint_level, task_prompt, user_code
    );

    let client = reqwest::Client::builder()
        .timeout(Duration::from_secs(10))
        .build()
        .map_err(|e| e.to_string())?;

    let body = json!({
        "model": "gemma3:4b",
        "prompt": prompt,
        "stream": false
    });

    if let Ok(resp) = client
        .post("http://127.0.0.1:11434/api/generate")
        .json(&body)
        .send()
        .await
    {
        if let Ok(data) = resp.json::<OllamaResp>().await {
            if let Some(text) = data.response {
                let trimmed = text.trim().to_string();
                if !trimmed.is_empty() {
                    return Ok(AiHintResult { hint: trimmed });
                }
            }
        }
    }

    Ok(AiHintResult {
        hint: "計算式や文字列のつなぎ方、スペース・改行が期待される出力と一致しているか見直してみよう！".to_string(),
    })
}
