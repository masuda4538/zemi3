// ═══════════════════════════════════════════════════════════════
//  Rust を作る前に動くプログラム ★ このファイルは触らなくて大丈夫です
//  src/system/application/<id>/rust/main.rs があるフォルダーを探して、
//  lib.rs から読み込むための一覧（apps.rs）を自動で作ります。
//  → アプリのフォルダーに rust/main.rs を置くだけで、Rust が使えるようになる（lib.rs を書きかえなくてよい）
//  → rust/main.rs が無いアプリは、Rust を使わないだけ（エラーにならない）
// ═══════════════════════════════════════════════════════════════
use std::{env, fs, path::Path};

fn main() {
    let apps_dir = Path::new("../src/system/application");
    println!("cargo:rerun-if-changed={}", apps_dir.display());   // フォルダーが変わったら作り直す

    // rust/main.rs があるアプリを集める
    let mut ids: Vec<String> = fs::read_dir(apps_dir)
        .map(|dir| {
            dir.flatten()
                .filter(|e| e.path().join("rust").join("main.rs").is_file())
                .filter_map(|e| e.file_name().into_string().ok())
                .collect()
        })
        .unwrap_or_default();
    ids.sort();

    // lib.rs が読み込む apps.rs を作る
    let mut code = String::from("// 自動で作ったファイル（build.rs）。書きかえても消えます\n");
    for id in &ids {
        let file = fs::canonicalize(apps_dir.join(id).join("rust").join("main.rs")).unwrap();
        code += &format!("#[path = {:?}]\nmod {};\n", file.to_string_lossy(), module_name(id));
    }
    code += "\n/// アプリの id から、そのアプリの rust/main.rs に渡す\n";
    code += "fn route<R: tauri::Runtime>(app: &str, invoke: tauri::ipc::Invoke<R>) -> bool {\n    match app {\n";
    for id in &ids {
        code += &format!("        {:?} => {}::handle(invoke),\n", id, module_name(id));
    }
    code += "        _ => false,\n    }\n}\n";

    let out = Path::new(&env::var("OUT_DIR").unwrap()).join("apps.rs");
    if fs::read_to_string(&out).ok().as_deref() != Some(code.as_str()) {
        fs::write(&out, code).unwrap();
    }

    tauri_build::build()
}

/// フォルダー名を Rust の名前にする（英数字以外は _ にして、前に app_ を付ける）
fn module_name(id: &str) -> String {
    let body: String = id.chars().map(|c| if c.is_ascii_alphanumeric() { c } else { '_' }).collect();
    format!("app_{body}")
}
