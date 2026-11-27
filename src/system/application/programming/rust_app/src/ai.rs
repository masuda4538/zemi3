use serde::{Deserialize, Serialize};
use serde_json::json;
use std::time::Duration;

const OLLAMA_BASE_URL: &str = "http://127.0.0.1:11434";
const MODEL_NAME: &str = "gemma3:4b";

#[derive(Serialize)]
pub struct AiHintResult {
    pub hint: String,
    pub level: u8,
    pub source: String,
    pub analysis_type: String,
}

#[derive(Serialize)]
pub struct AiStatusResult {
    pub running: bool,
    pub model_installed: bool,
    pub model_name: String,
    pub message: String,
}

#[derive(Deserialize)]
struct OllamaResp {
    response: Option<String>,
}

#[derive(Deserialize)]
struct OllamaTagsResp {
    models: Option<Vec<OllamaModelInfo>>,
}

#[derive(Deserialize)]
struct OllamaModelInfo {
    name: String,
}

#[tauri::command]
pub async fn check_ai_status() -> Result<AiStatusResult, String> {
    let client = reqwest::Client::builder()
        .timeout(Duration::from_secs(2))
        .build()
        .map_err(|e| e.to_string())?;

    let url = format!("{}/api/tags", OLLAMA_BASE_URL);
    match client.get(&url).send().await {
        Ok(resp) if resp.status().is_success() => {
            let model_installed = match resp.json::<OllamaTagsResp>().await {
                Ok(data) => data
                    .models
                    .unwrap_or_default()
                    .iter()
                    .any(|m| m.name == MODEL_NAME || m.name.starts_with(MODEL_NAME)),
                Err(_) => false,
            };

            if model_installed {
                Ok(AiStatusResult {
                    running: true,
                    model_installed: true,
                    model_name: MODEL_NAME.to_string(),
                    message: format!("AI稼働中 ({})", MODEL_NAME),
                })
            } else {
                Ok(AiStatusResult {
                    running: true,
                    model_installed: false,
                    model_name: MODEL_NAME.to_string(),
                    message: format!("Ollama起動中 / {} 未導入", MODEL_NAME),
                })
            }
        }
        _ => Ok(AiStatusResult {
            running: false,
            model_installed: false,
            model_name: MODEL_NAME.to_string(),
            message: "AI未接続 (オフライン簡易ヒント)".to_string(),
        }),
    }
}

fn add_line_numbers(code: &str) -> String {
    code.lines()
        .enumerate()
        .map(|(idx, line)| format!("{:>2} | {}", idx + 1, line))
        .collect::<Vec<_>>()
        .join("\n")
}

fn extract_error_line(err: &str) -> Option<usize> {
    let mut last_line = None;
    for part in err.split("line ") {
        let digits: String = part.chars().take_while(|c| c.is_ascii_digit()).collect();
        if let Ok(n) = digits.parse::<usize>() {
            last_line = Some(n);
        }
    }
    last_line
}

#[tauri::command]
pub async fn ask_ai_hint(
    user_code: String,
    task_prompt: String,
    hint_level: u8,
    error_message: Option<String>,
    is_kid_mode: Option<bool>,
) -> Result<AiHintResult, String> {
    let err_trimmed = error_message.unwrap_or_default().trim().to_string();
    let has_error = !err_trimmed.is_empty();
    let analysis_type = if has_error { "error" } else { "logic" }.to_string();
    let numbered_code = add_line_numbers(&user_code);

    let tone_instruction = if is_kid_mode.unwrap_or(true) {
        "小学生〜中学生にもわかるやさしい日本語（専門用語はかみ砕いて）で回答してください。"
    } else {
        "プログラミング初学者向けに丁寧でわかりやすい日本語で回答してください。"
    };

    let prompt = if has_error {
        let level_instruction = match hint_level {
            1 => "【第1段階（エラーの翻訳と場所）】：発生したエラーの意味をやさしい日本語で1文で説明し、コードの何行目に注目すべきかだけ伝えてください。修正後のコードはまだ書かないでください。",
            2 => "【第2段階（エラーの原因解説）】：エラーメッセージの内容をもとに、なぜその行でエラーが起きたのか（文法ルールや型の違いなど）を2〜3文でわかりやすく説明してください。",
            _ => "【第3段階（具体的な修正案）】：エラーを解消するために、何行目のどこをどう書き換えればよいか、具体的な修正後のPythonコード例を示して教えてください。",
        };

        format!(
            "あなたはプログラミング初学者向けのメンターAIです。{}\n\
            Pythonの実行中にプログラムエラーが発生しました。エラー内容と行番号付きコードの両方を分析してください。\n\n\
            【課題内容】\n{}\n\n\
            【受講者のコード（行番号付き）】\n{}\n\n\
            【発生したエラー内容】\n{}\n\n\
            【指示】\n{}",
            tone_instruction, task_prompt, numbered_code, err_trimmed, level_instruction
        )
    } else {
        let level_instruction = match hint_level {
            1 => "【第1段階（着眼点）】：どの行や変数、処理を見直すべきか、注目ポイントを1〜2文で示してください。答えはまだ教えないでください。",
            2 => "【第2段階（考え方の解説）】：期待される出力と実際の出力の違いがなぜ起きているか、考え方や計算手順、必要な関数の使い方をわかりやすく2〜3文で説明してください。",
            _ => "【第3段階（具体的な修正案）】：コードのどの部分をどう書き換えれば正解になるか、具体的な修正後のPythonコード片を挙げて教えてください。",
        };

        format!(
            "あなたはプログラミング初学者向けのメンターAIです。{}\n\n\
            【課題内容・実行結果】\n{}\n\n\
            【受講者のコード（行番号付き）】\n{}\n\n\
            【指示】\n{}",
            tone_instruction, task_prompt, numbered_code, level_instruction
        )
    };

    let client = reqwest::Client::builder()
        .timeout(Duration::from_secs(20))
        .build()
        .map_err(|e| e.to_string())?;

    let body = json!({
        "model": MODEL_NAME,
        "prompt": prompt,
        "stream": false
    });

    let url = format!("{}/api/generate", OLLAMA_BASE_URL);
    if let Ok(resp) = client.post(&url).json(&body).send().await {
        if let Ok(data) = resp.json::<OllamaResp>().await {
            if let Some(text) = data.response {
                let trimmed = text.trim().to_string();
                if !trimmed.is_empty() {
                    return Ok(AiHintResult {
                        hint: trimmed,
                        level: hint_level,
                        source: "ollama".to_string(),
                        analysis_type,
                    });
                }
            }
        }
    }

    let fallback = if has_error {
        generate_error_fallback(&err_trimmed, &user_code, hint_level)
    } else {
        generate_logic_fallback(&task_prompt, &user_code, hint_level)
    };

    Ok(AiHintResult {
        hint: fallback,
        level: hint_level,
        source: "fallback".to_string(),
        analysis_type,
    })
}

fn generate_error_fallback(err: &str, code: &str, level: u8) -> String {
    let line_label = extract_error_line(err)
        .map(|n| format!("**{}行目付近**", n))
        .unwrap_or_else(|| "エラーが出ている行".to_string());
    let summary_line = err.lines().last().unwrap_or(err);

    if err.contains("IndentationError") {
        match level {
            1 => format!("🚨 **【インデント（字下げ）エラー】** {} の行頭のスペース数に問題があるよ！", line_label),
            2 => "💡 **【原因】** Pythonでは `if` や `for` の次の行は、半角スペース4つぶん字下げ（インデント）をそろえるルールがあるよ。全角スペースが混ざっていないかも確認しよう。".to_string(),
            _ => "🛠️ **【直し方】** `if` / `elif` / `else` / `for` の直後の行を `Tab` キー（半角スペース4つ）でそろえ、不要な先頭スペースを消してみよう！".to_string(),
        }
    } else if err.contains("SyntaxError") {
        match level {
            1 => format!("🚨 **【文法エラー（SyntaxError）】** {} の書き方にルール違反があるよ！", line_label),
            2 => "💡 **【原因】** カッコ `()` やクォーテーション `\"` の閉じ忘れ、`if` / `for` 行末のコロン `:` の付け忘れ、または全角文字が記号に混ざっている可能性が高いよ。".to_string(),
            _ => format!("🛠️ **【直し方】** {} とその1つ上の行を見直して、以下をチェックしよう：\n- `\"` や `(` がペアで閉じているか\n- `if` / `elif` / `else` / `for` の末尾に `:` があるか\n- カッコや記号が半角になっているか\n\nエラー詳細: `{}`", line_label, summary_line),
        }
    } else if err.contains("NameError") {
        match level {
            1 => format!("🚨 **【名前エラー（NameError）】** {} で、まだ作られていない変数や関数名を使っているよ！", line_label),
            2 => format!("💡 **【原因】** `{}` と出ているよ。変数名や `print` などのスペルミス（大文字・小文字の違い含む）、または変数に値を入れる前に使っていないか確認しよう。", summary_line),
            _ => format!("🛠️ **【直し方】** {} で使っている名前のスペルを、定義した行（`変数名 = ...`）と1文字ずつ見比べてそろえよう。文字列のつもりなら `\"...\"` で囲む必要があるよ！", line_label),
        }
    } else if err.contains("TypeError") {
        match level {
            1 => format!("🚨 **【型エラー（TypeError）】** {} で、データの種類（文字と数字など）が合っていないよ！", line_label),
            2 => "💡 **【原因】** Pythonでは文字列（`\"...\"`）と数値（`10` など）をそのまま `+` でつなげることができないよ。".to_string(),
            _ => {
                if code.contains('+') {
                    "🛠️ **【直し方】** 数字を文字とつなぐときは `str(...)` で囲もう！\n\n```python\nprint(\"結果: \" + str(数値の変数))\n```".to_string()
                } else {
                    format!("🛠️ **【直し方】** {} で関数に渡している値の種類や個数が合っているか確認しよう。\nエラー詳細: `{}`", line_label, summary_line)
                }
            }
        }
    } else if err.contains("ZeroDivisionError") {
        match level {
            1 => format!("🚨 **【0除算エラー】** {} で「0で割り算」をしてしまっているよ！", line_label),
            2 => "💡 **【原因】** プログラムではどんな数字も 0 で割ることはできないんだ。割る数が入っている変数を確認しよう。".to_string(),
            _ => "🛠️ **【直し方】** `/` や `//` や `%` の右側にある変数や数値が `0` にならないように見直そう！".to_string(),
        }
    } else if err.contains("IndexError") {
        match level {
            1 => format!("🚨 **【範囲外エラー（IndexError）】** {} でリストの長さを超えた番号を取り出そうとしているよ！", line_label),
            2 => "💡 **【原因】** Pythonのリストの番号は `0` から始まるよ。3つ入っているリストの最後の番号は `2` になるんだ。".to_string(),
            _ => "🛠️ **【直し方】** `リスト[番号]` の番号や `range(...)` の回数がリストの個数を超えていないか直してみよう！".to_string(),
        }
    } else if err.contains("ValueError") {
        match level {
            1 => format!("🚨 **【値エラー（ValueError）】** {} で変換や計算できない値が渡されているよ！", line_label),
            2 => "💡 **【原因】** たとえば数字以外の文字を `int(...)` で整数に変換しようとしたときなどに発生するよ。".to_string(),
            _ => format!("🛠️ **【直し方】** {} に渡している中身が正しい形式（数字だけなど）になっているか確認しよう。\nエラー詳細: `{}`", line_label, summary_line),
        }
    } else {
        match level {
            1 => format!("🚨 **【プログラムエラー】** {} でエラーが発生したよ：`{}`", line_label, summary_line),
            2 => format!("💡 **【原因】** 実行時に `{}` が起きたよ。該当行のスペル・記号・変数の値を確認してみよう。", summary_line),
            _ => format!("🛠️ **【直し方】** {} のコードを1つずつ見直して、`{}` の原因になっている部分を書き換えて再実行してみよう。", line_label, summary_line),
        }
    }
}

fn generate_logic_fallback(task: &str, code: &str, level: u8) -> String {
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
            _ => "🛠️ **【具体的な直し方】**\n```python\nif num % 2 == 0:\n    print(\"偶数です\")\nelse:\n    print(\"奇数です\")\n```".to_string(),
        }
    } else {
        match level {
            1 => "🔍 **【注目ポイント】** コードの最後の行と、画面の「期待される出力」を見比べてみよう！".to_string(),
            2 => "💡 **【考え方】** 出力結果の文字（スペースや改行、余計な記号）が目標と少しずれている可能性があるよ。".to_string(),
            _ => "🛠️ **【具体的な直し方】** 目標の文字列と一文字ずつ一致するように `print(...)` の中の文字を整えてみよう！".to_string(),
        }
    }
}
