export const GNEWS_CONFIG = {
    topHeadlinesEndpoint: 'https://gnews.io/api/v4/top-headlines',
    searchEndpoint: 'https://gnews.io/api/v4/search',
    maxResults: 10,
    dailyRequestLimit: 100,
    cacheTtlMs: 30 * 60 * 1000,
    cooldownMs: 2000
};

export const IT_DICTIONARY = {
    "ローカルLLM": {
        category: "AI / ML",
        summary: "端末やローカル環境で直接実行する軽量な大規模言語モデル。",
        detail: "プライバシー保護やAPI通信コストゼロ化に優れ、OllamaやTauri環境のネイティブアプリで急普及中。"
    },
    "Tauri": {
        category: "Desktop / Rust",
        summary: "Web技術(HTML/JS)とRustを用いて超軽量デスクトップアプリを構築するフレームワーク。",
        detail: "Electronに比べてメモリ消費が極めて少なく、高速なシステムAPIアクセスを提供。"
    },
    "Rust": {
        category: "Language",
        summary: "メモリ安全性とC/C++並みの超高速な実行速度を両立したシステムプログラミング言語。",
        detail: "ガベージコレクションなしでコンパイル時にメモリ安全性を保証。"
    },
    "Kubernetes": {
        category: "Cloud / DevOps",
        summary: "コンテナ化されたアプリケーションの自動デプロイ・スケール管理ツール。",
        detail: "通称k8s。クラウドネイティブインフラの業界標準。"
    },
    "SBOM": {
        category: "Security",
        summary: "Software Bill of Materials (ソフトウェア部品表)。",
        detail: "使用ライブラリや依存関係を明細化した構成リスト。サプライチェーンセキュリティに必須。"
    },
    "VLAN": {
        category: "Network",
        summary: "Virtual Local Area Network (仮想LAN)。",
        detail: "スイッチ内でネットワークを論理的に分割し、セキュリティと帯域効率を高める技術。"
    },
    "Subnet": {
        category: "Network",
        summary: "サブネット (ネットワーク分割単位)。",
        detail: "IPアドレス空間を細分化し、ブロードキャストドメインを最適化する手法。"
    },
    "React": {
        category: "Frontend",
        summary: "UIコンポーネント指向のJavaScriptライブラリ。",
        detail: "仮想DOM（Virtual DOM）と宣言的UI記述により効率的な開発を可能に。"
    }
};

export const CATEGORIES = ["すべて", "AI/LLM", "Frontend", "Backend", "Cloud/DevOps", "Security", "Mobile"];

export const SAMPLE_ARTICLES = [
    { id: "art-jp-001", region: "jp", category: "AI/LLM", title: "ローカルLLM開発フレームワークの新バージョン公開、軽量化と高速化を実現", description: "TauriおよびRustベースのネイティブクライアントで動作可能なローカルLLMの最適化ライブラリがリリースされました。VLAN等の外部通信なしで完全動作。", source: "TechNews Japan", url: "https://example.com/news/art-jp-001", image: null, date: "2026-11-20T08:30:00Z", isTrending: true, viewsCount: 1420 },
    { id: "art-jp-002", region: "jp", category: "Frontend", title: "React 19の新機能とパフォーマンス最適化手法の解説まとめ", description: "React 19で正式導入されたServer Actionsおよび自動メモ化コンパイラの仕組みについて解説します。", source: "WebDev Weekly JP", url: "https://example.com/news/art-jp-002", image: null, date: "2026-11-19T14:15:00Z", isTrending: true, viewsCount: 980 },
    { id: "art-jp-003", region: "jp", category: "Cloud/DevOps", title: "Kubernetes 1.32リリース：マルチクラウド運用の省力化と自動スケール強化", description: "最新リリースでは、エッジノードの自動リカバリ機能およびSubnet単位での通信最適化が大幅更新されました。", source: "Cloud Native Watch", url: "https://example.com/news/art-jp-003", image: null, date: "2026-11-18T18:00:00Z", isTrending: false, viewsCount: 650 },
    { id: "art-jp-004", region: "jp", category: "Security", title: "サプライチェーン攻撃を防ぐSBOM運用の自動化ベストプラクティス", description: "オープンソース依存関係の脆弱性を自動検出し、CISA規約に適合したSBOM出力を実現する手順。", source: "CyberSec Times", url: "https://example.com/news/art-jp-004", image: null, date: "2026-11-17T11:40:00Z", isTrending: false, viewsCount: 420 },
    { id: "art-global-001", region: "global", category: "AI/LLM", title: "Next-Gen AI Models Achieve Breakthrough in Local Context Reasoning", description: "New lightweight ローカルLLM solutions enable multi-modal processing directly on end-user machines with Tauri wrappers.", source: "Global Tech Insider", url: "https://example.com/news/art-global-001", image: null, date: "2026-11-20T07:00:00Z", isTrending: true, viewsCount: 2310 },
    { id: "art-global-002", region: "global", category: "Backend", title: "Rust Ecosystem Gains Momentum in High-Throughput Systems", description: "Financial systems report a 40% latency drop after migrating core microservices to Rust and managing Kubernetes clusters seamlessly.", source: "Systems Architecture Today", url: "https://example.com/news/art-global-002", image: null, date: "2026-11-19T16:20:00Z", isTrending: true, viewsCount: 1890 }
];