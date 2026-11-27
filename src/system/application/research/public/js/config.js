// --- CLIENT API ENDPOINTS (APIキーはサーバー側の .env で安全に管理) ---
const API_CONFIG = {
    NEWS_PROXY_ENDPOINT: "/api/news",
    AI_PROXY_ENDPOINT: "/api/ai/summary"
};

// --- CATEGORY IMAGES & TECH ILLUSTRATIONS ---
const CATEGORY_IMAGES = {
    "AI/LLM": "c146cc35.jpeg",
    "フロントエンド": "e6efd90f.jpeg",
    "バックエンド": "fb4a78b1.jpeg",
    "Cloud/DevOps": "5554af5c.jpeg"
};

const CATEGORIES = ["すべて", "AI/LLM", "フロントエンド", "バックエンド", "Cloud/DevOps", "セキュリティ", "モバイル"];

// --- IT GLOSSARY DATABASE ---
const IT_DICTIONARY = {
    "ローカルLLM": { category: "AI / ML", summary: "端末やローカル環境で直接実行する軽量な大規模言語モデル。", detail: "プライバシー保護やAPI通信コストゼロ化に優れ、OllamaやTauri環境のネイティブアプリで急普及中。" },
    "Tauri": { category: "デスクトップ / Rust", summary: "Web技術(HTML/JS)とRustを用いて超軽量デスクトップアプリを構築するフレームワーク。", detail: "Electronに比べてメモリ消費が極めて少なく、高速なシステムAPIアクセスを提供。" },
    "Rust": { category: "言語", summary: "メモリ安全性とC/C++並みの超高速な実行速度を両立したシステムプログラミング言語。", detail: "ガベージコレクションなしでコンパイル時にメモリ安全性を保証。" },
    "Kubernetes": { category: "Cloud / DevOps", summary: "コンテナ化されたアプリケーションの自動デプロイ・スケール管理ツール。", detail: "通称k8s。クラウドネイティブインフラの業界標準。" },
    "SBOM": { category: "セキュリティ", summary: "Software Bill of Materials (ソフトウェア部品表)。", detail: "使用ライブラリや依存関係を明細化した構成リスト。サプライチェーンセキュリティに必須。" },
    "VLAN": { category: "ネットワーク", summary: "Virtual Local Area Network (仮想LAN)。", detail: "スイッチ内でネットワークを論理的に分割し、セキュリティと帯域効率を高める技術。" },
    "Subnet": { category: "ネットワーク", summary: "サブネット (ネットワーク分割単位)。", detail: "IPアドレス空間を細分化し、ブロードキャストドメインを最適化する手法。" },
    "React": { category: "フロントエンド", summary: "UIコンポーネント指向のJavaScriptライブラリ。", detail: "仮想DOM（Virtual DOM）と宣言的UI記述により効率的な開発を可能に。" }
};
