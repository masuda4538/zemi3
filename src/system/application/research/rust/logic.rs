// ═══════════════════════════════════════════════════════════════
//  情報収集：Rust の処理 ★ 自由に書きかえてよい
//  main.rs（窓口）から呼ばれる関数を書きます。JS から直接は呼べません（main.rs を通す）。
//  ・main.rs から使わせたい関数には pub を付ける
//  ・main.rs の  mod logic;  でつながっている → main.rs から logic::関数名() で呼ぶ
//  ・ファイルを増やしたら（このフォルダーに 〇〇.rs を作る）、main.rs に  mod 〇〇;  を足す
// ═══════════════════════════════════════════════════════════════

/// "https://www.example.com/page?x=1" から "example.com" を取り出す
pub fn site_of(url: &str) -> Result<String, String> {
    let url = url.trim();

    // 1. http:// か https:// で始まっているか
    let rest = url
        .strip_prefix("https://")
        .or_else(|| url.strip_prefix("http://"))
        .ok_or("URL は http:// か https:// で始めてください")?;

    // 2. 最初の / ? # の前までがサイトの名前（example.com:8080 の :8080 も外す）
    let host = rest.split(['/', '?', '#']).next().unwrap_or("");
    let host = host.split(':').next().unwrap_or("");

    // 3. 空だったり、. が無かったりしたらエラー
    if host.is_empty() || !host.contains('.') {
        return Err("URL のサイト名が読めませんでした".into());
    }

    // 4. www. は外して返す
    Ok(host.trim_start_matches("www.").to_lowercase())
}
