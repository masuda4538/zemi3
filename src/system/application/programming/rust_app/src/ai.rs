use serde::{Deserialize, Serialize};
use serde_json::json;
use std::time::Duration;

#[derive(Serialize)]
pub struct AiHintResult {
    pub hint: String,
    pub level: u8,
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
    let level_instruction = match hint_level {
        1 => "【第1段階（着眼点）】：どの行や変数、処理を見直すべきか、注目ポイントを1〜2文で示してください。答えはまだ教えないでください。",
        2 => "【第2段階（考え方の解説）】：期待される出力と実際の出力の違いがなぜ起きているか、考え方や計算手順、必要な関数の使い方をわかりやすく2〜3文で説明してください。",
        _ => "【第3段階（具体的な修正案）】：コードのどの部分をどう書き換えれば正解になるか、具体的な修正後のコード片や書き換え例を挙げて具体的に教えてください。",
    };

    let prompt = format!(
        "あなたはプログラミング初学者向けのやさしいメンターAIです。\n\
        課題内容:\n{}\n\n\
        受講者のコード:\n{}\n\n\
        指示:\n{}\n\
        わかりやすい日本語で回答してください。",
        task_prompt, user_code, level_instruction
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
                    return Ok(AiHintResult {
                        hint: trimmed,
                        level: hint_level,
                    });
                }
            }
        }
    }

    // ローカルLLM未起動時の具体的フォールバック
    let fallback = generate_fallback_hint(&task_prompt, &user_code, hint_level);
    Ok(AiHintResult {
        hint: fallback,
        level: hint_level,
    })
}

fn generate_fallback_hint(task: &str, code: &str, level: u8) -> String {
    if task.contains("年齢") || code.contains("age") {
        match level {
            1 => "🔍 **【注目ポイント】** 変数 `age` の計算式（`10 + 5`）に注目してみよう！".to_string(),
            2 => "💡 **【考え方】** 目標の出力は「10さい」なのに、今は「15さい」になっているよ。5を足す必要があるかな？".to_string(),
            _ => "🛠️ **【具体的な直し方】**\n`age = 10 + 5` を `age = 10` に書き換えてみよう！\n\n```python\nage = 10\nprint(\"ねんれいは \" + str(age) + \"さいです\")\n```".to_string(),
        }
    } else if task.contains("偶数") || task.contains("奇数") {
        match level {
            1 => "🔍 **【注目ポイント】** `if num % 2 == 0:` の条件判定と、その後の `print` 文の文字に注目しよう！".to_string(),
            2 => "💡 **【考え方】** 2で割った余りが0なら「偶数」、それ以外なら「奇数」だよ。期待される出力フォーマットと一致しているか確認しよう。".to_string(),
            _ => "🛠️ **【具体的な直し方】**\n```python\nif num % 2 == 0:\n    print(str(num) + \" は ぐうすう です\")\nelse:\n    print(str(num) + \" は きすう です\")\n```".to_string(),
        }
    } else {
        match level {
            1 => "🔍 **【注目ポイント】** コードの最後の行と、画面右上の「期待される出力」を見比べてみよう！".to_string(),
            2 => "💡 **【考え方】** 出力結果の文字（スペースや改行、余計な記号）が目標と少しずれている可能性があるよ。".to_string(),
            _ => "🛠️ **【具体的な直し方】** 目標の文字列と一文字ずつ一致するように `print(...)` の中の文字を整えてみよう！".to_string(),
        }
    }
}