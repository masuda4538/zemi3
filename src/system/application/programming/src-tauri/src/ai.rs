use serde::{Deserialize, Serialize};
use std::time::Duration;

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct AiHintRequest {
    pub caller_file: String,
    pub caller_code: String,
    pub error_file: Option<String>,
    pub error_code: Option<String>,
    pub error_msg: String,
    pub hint_level: u8, // 1: 箇所特定, 2: 概念解説, 3: 修正方針
    pub is_kid_mode: bool,
}

#[derive(Serialize)]
struct OllamaRequest {
    model: String,
    prompt: String,
    stream: bool,
}

#[derive(Deserialize)]
struct OllamaResponse {
    response: String,
}

#[tauri::command]
pub async fn ask_ai_hint(req: AiHintRequest) -> Result<String, String> {
    let level_instruction = match req.hint_level {
        1 => "答えのコードは書かず、どのファイルの何行目付近に注目すべきかだけ2〜3行で短く教えてください。",
        2 => "答えのコードは書かず、エラーの原因になっているPythonのルールや考え方をやさしく説明してください。",
        _ => "修正の方針と、短い書き換え例を提示してください。",
    };

    let tone = if req.is_kid_mode {
        "小学生にもわかるやさしい日本語（ひらがな多め）で話してください。"
    } else {
        "初学者向けに丁寧で分かりやすい日本語で説明してください。"
    };

    // 別ファイル起因エラーの場合は両方のコードをプロンプトに含める
    let code_context = match (&req.error_file, &req.error_code) {
        (Some(ef), Some(ec)) if ef != &req.caller_file => format!(
            "別ファイルを呼び出した際にエラーが起きました。両方のコードを参照して、どちらのファイルをどう直すべきか説明してください。\n\
             【呼び出し元: {}】\n{}\n\n【エラー発生先: {}】\n{}",
            req.caller_file, req.caller_code, ef, ec
        ),
        _ => format!("【コード: {}】\n{}", req.caller_file, req.caller_code),
    };

    let prompt = format!(
        "あなたはプログラミング学習メンターです。{}\n{}\n\n{}\n\n【エラー・状況】\n{}",
        tone, level_instruction, code_context, req.error_msg
    );

    // 4Bモデルの初回ロード・推論に対応するためタイムアウトを60秒に設定
    let client = reqwest::Client::builder()
        .timeout(Duration::from_secs(60))
        .build()
        .map_err(|e| e.to_string())?;

    let payload = OllamaRequest {
        model: "gemma3:4b".to_string(), // ★ gemma3:4b を指定
        prompt,
        stream: false,
    };

    if let Ok(resp) = client
        .post("http://localhost:11434/api/generate")
        .json(&payload)
        .send()
        .await
    {
        if resp.status().is_success() {
            if let Ok(data) = resp.json::<OllamaResponse>().await {
                if !data.response.trim().is_empty() {
                    return Ok(data.response.trim().to_string());
                }
            }
        }
    }

    // Ollama未起動・モデル未導入時のフォールバック
    let summary = req.error_msg.lines().last().unwrap_or(&req.error_msg);
    let fallback = match req.hint_level {
        1 => format!(
            "【ヒント1：注目ポイント】\n「{}」が起きているよ。エラーが出た行とその1つ上の行のスペルやカッコを確認してみよう！（※Ollama / gemma3:4b 未起動のため簡易ヒント表示中）",
            summary
        ),
        2 => format!(
            "【ヒント2：考え方】\nエラー内容「{}」は、変数名の間違い・型の違い・記号の抜けなどでよく起きるよ。呼び出し元と呼び出し先の名前や引数が一致しているか見比べてみよう。",
            summary
        ),
        _ => format!(
            "【ヒント3：修正方針】\nまずは「{}」の原因になっている行をシンプルに書き直すか、print() で変数の途中結果を表示して確認してみよう。",
            summary
        ),
    };

    Ok(fallback)
}