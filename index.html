<!DOCTYPE html>
<html lang="ja" class="dark">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>問題作成・学習アプリ モックアップ v0.5 - 10段階すするパチスロ超刺激版</title>
    <!-- Tailwind CSS -->
    <script src="https://cdn.tailwindcss.com"></script>
    <!-- Lucide Icons -->
    <script src="https://unpkg.com/lucide@latest"></script>
    <!-- Canvas Confetti -->
    <script src="https://cdn.jsdelivr.net/npm/canvas-confetti@1.6.0/dist/confetti.browser.min.js"></script>
    <!-- Google Fonts -->
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Fira+Code:wght@400;600&family=Inter:wght@300;400;500;600;700;800&display=swap" rel="stylesheet">

    <script>
        tailwind.config = {
            darkMode: 'class',
            theme: {
                extend: {
                    colors: {
                        cyber: {
                            bg: '#0a0d14',
                            surface: '#121824',
                            card: '#182030',
                            border: '#2a364f',
                            primary: '#3b82f6',
                            cyan: '#06b6d4',
                            neon: '#00f0ff',
                            purple: '#a855f7',
                            pink: '#ec4899',
                            warning: '#f59e0b',
                            danger: '#ef4444',
                            success: '#10b981'
                        }
                    },
                    fontFamily: {
                        sans: ['Inter', 'sans-serif'],
                        mono: ['Fira Code', 'monospace'],
                    }
                }
            }
        }
    </script>
    <style>
        /* GitHub Pages: keep the application shell at the full viewport width. */
        html, body {
            width: 100%;
            min-width: 0;
            margin: 0;
        }
        body#app-body {
            width: 100%;
            min-height: 100vh;
            align-items: stretch;
        }
        body#app-body > header {
            width: 100%;
            flex: 0 0 auto;
            box-sizing: border-box;
        }
        body#app-body > .flex.flex-1 {
            width: 100%;
            min-width: 0;
            flex: 1 1 auto;
        }
        body#app-body main {
            min-width: 0;
        }

        /* Responsive heatmap columns (Tailwind has no default grid-cols-15 utility). */
        #heatmap-grid {
            display: grid;
            grid-template-columns: repeat(10, minmax(0, 1fr));
        }
        @media (min-width: 640px) {
            #heatmap-grid {
                grid-template-columns: repeat(15, minmax(0, 1fr));
            }
        }

        /* Scrollbars */
        ::-webkit-scrollbar { width: 6px; height: 6px; }
        ::-webkit-scrollbar-track { background: #0a0d14; }
        ::-webkit-scrollbar-thumb { background: #1e293b; border-radius: 4px; }
        ::-webkit-scrollbar-thumb:hover { background: #334155; }
        
        /* Glassmorphism */
        .glass-panel {
            background: rgba(24, 32, 48, 0.75);
            backdrop-filter: blur(12px);
            -webkit-backdrop-filter: blur(12px);
            border: 1px solid rgba(255, 255, 255, 0.08);
        }

        .glass-panel-glow {
            background: rgba(24, 32, 48, 0.85);
            backdrop-filter: blur(12px);
            border: 1px solid rgba(6, 182, 212, 0.35);
            box-shadow: 0 0 25px rgba(6, 182, 212, 0.15);
        }

        /* Neon gradient text */
        .neon-text {
            background: linear-gradient(135deg, #00f0ff 0%, #3b82f6 50%, #a855f7 100%);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
        }

        /* ==========================================================
           10-STAGE "SUSURU" PACHISLOT OVERLOAD ANIMATIONS (赤外線サーモグラフィー・金文字爆発演出)
           ========================================================== */
        @keyframes susuru-thermal-pulse {
            0%, 100% { filter: invert(100%) sepia(100%) saturate(7500%) hue-rotate(0deg) brightness(120%) contrast(200%); transform: scale(1); }
            50% { filter: invert(100%) sepia(100%) saturate(7500%) hue-rotate(340deg) brightness(160%) contrast(300%); transform: scale(1.08) rotate(1deg); }
        }

        @keyframes susuru-gold-explosion {
            0% { transform: scale(0.1) rotate(-20deg); opacity: 0; filter: blur(30px); }
            60% { transform: scale(1.4) rotate(3deg); opacity: 1; filter: blur(0px); }
            80% { transform: scale(0.95) rotate(-1deg); }
            100% { transform: scale(1) rotate(0deg); opacity: 1; filter: blur(0px); }
        }

        @keyframes dopagaki-shake {
            0% { transform: translate(0, 0) rotate(0deg) scale(1); }
            10% { transform: translate(-16px, 12px) rotate(-5deg) scale(1.08); }
            20% { transform: translate(16px, -14px) rotate(5deg) scale(0.96); }
            30% { transform: translate(-14px, -10px) rotate(-3deg) scale(1.05); }
            40% { transform: translate(14px, 12px) rotate(3deg) scale(1.06); }
            50% { transform: translate(-10px, -6px) rotate(-2deg) scale(0.98); }
            100% { transform: translate(0, 0) rotate(0deg) scale(1); }
        }

        @keyframes dopagaki-earthquake {
            0% { transform: translate(0, 0) scale(1); }
            15% { transform: translate(-25px, 20px) scale(1.15); filter: hue-rotate(90deg); }
            30% { transform: translate(25px, -20px) scale(0.92); filter: hue-rotate(180deg); }
            45% { transform: translate(-20px, -15px) scale(1.18); filter: hue-rotate(270deg); }
            60% { transform: translate(20px, 20px) scale(0.96); filter: hue-rotate(360deg); }
            100% { transform: translate(0, 0) scale(1); filter: hue-rotate(0deg); }
        }

        @keyframes dopagaki-rainbow-bg {
            0% { background-color: rgba(255, 0, 85, 0.96); }
            16% { background-color: rgba(255, 234, 0, 0.96); }
            33% { background-color: rgba(0, 255, 102, 0.96); }
            50% { background-color: rgba(0, 240, 255, 0.96); }
            66% { background-color: rgba(176, 0, 255, 0.96); }
            83% { background-color: rgba(255, 100, 0, 0.96); }
            100% { background-color: rgba(255, 0, 85, 0.96); }
        }

        @keyframes flash-red {
            0%, 100% { background-color: transparent; }
            50% { background-color: rgba(239, 68, 68, 0.92); }
        }

        @keyframes flash-gold {
            0%, 100% { background-color: transparent; }
            50% { background-color: rgba(250, 204, 21, 0.95); }
        }

        @keyframes marquee-slide {
            0% { transform: translateX(100%); }
            100% { transform: translateX(-100%); }
        }

        @keyframes patlamp-spin {
            0% { transform: rotate(0deg) scale(1); filter: drop-shadow(0 0 20px #ef4444); }
            50% { transform: rotate(180deg) scale(1.3); filter: drop-shadow(0 0 50px #facc15); }
            100% { transform: rotate(360deg) scale(1); filter: drop-shadow(0 0 20px #ef4444); }
        }

        .animate-susuru-thermal {
            animation: susuru-thermal-pulse 0.3s ease-in-out infinite;
        }

        .animate-susuru-gold {
            animation: susuru-gold-explosion 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards;
            text-shadow: 0 0 35px #ffffff, 0 0 70px #facc15, 0 0 110px #ff0055;
        }

        .animate-dopagaki-shake {
            animation: dopagaki-shake 0.35s cubic-bezier(.36,.07,.19,.97) both;
        }

        .animate-dopagaki-earthquake {
            animation: dopagaki-earthquake 0.22s cubic-bezier(.36,.07,.19,.97) infinite;
        }

        .animate-rainbow-bg {
            animation: dopagaki-rainbow-bg 0.1s linear infinite;
        }

        .animate-flash-red {
            animation: flash-red 0.15s ease-in-out infinite;
        }

        .animate-flash-gold {
            animation: flash-gold 0.12s ease-in-out infinite;
        }

        .animate-patlamp {
            animation: patlamp-spin 0.35s linear infinite;
        }

        /* Perspective Flashcard */
        .perspective-1000 { perspective: 1000px; }
        .transform-style-3d { transform-style: preserve-3d; }
        .backface-hidden { backface-visibility: hidden; }
        .rotate-y-180 { transform: rotateY(180deg); }

        /* Navigation active state */
        .nav-tab.active {
            background: linear-gradient(90deg, rgba(6, 182, 212, 0.2) 0%, rgba(59, 130, 246, 0.05) 100%);
            border-left: 3px solid #00f0ff;
            color: #00f0ff;
        }
    </style>
</head>
<body id="app-body" class="bg-cyber-bg text-slate-300 font-sans antialiased min-h-screen flex flex-col selection:bg-cyber-cyan selection:text-black">

    <!-- ==========================================================
       10-STAGE "SUSURU" PACHISLOT FULLSCREEN OVERLAY (YouTube実機演出参考)
       ========================================================== -->
    <div id="dopagaki-overlay" class="fixed inset-0 z-50 pointer-events-none hidden flex items-center justify-center overflow-hidden transition-all">
        <!-- Background Tint & Flash Layer -->
        <div id="dopagaki-bg-layer" class="absolute inset-0 transition-all duration-100"></div>

        <!-- Marquee / Group Notification Banner ("HEAT HEAT" & 連続群予告) -->
        <div id="dopagaki-marquee-container" class="absolute top-12 left-0 w-full bg-red-600/95 border-y-4 border-yellow-300 py-3 overflow-hidden hidden z-20 shadow-2xl">
            <div id="dopagaki-marquee-text" class="whitespace-nowrap font-black italic text-2xl sm:text-3xl text-yellow-200 tracking-widest animate-[marquee-slide_3.5s_linear_infinite]">
                🔥 【HEAT HEAT !! 激アツ赤外線サーモグラフィー群通過中！】 すするパチンコ演出発動！！ 🔥
            </div>
        </div>

        <!-- Central Giant Typography / Logo Box -->
        <div class="relative z-30 text-center px-4 space-y-4">
            <div id="dopagaki-stage-badge" class="inline-block px-5 py-2 rounded-full bg-black/90 border-2 border-yellow-400 text-yellow-300 font-mono text-xs sm:text-sm font-black uppercase tracking-widest shadow-2xl animate-bounce">
                🚀 STAGE 1 : 青保留変化
            </div>
            <div id="dopagaki-main-title" class="text-4xl sm:text-8xl font-black italic tracking-tighter text-white drop-shadow-[0_10px_20px_rgba(0,0,0,0.9)]">
                <!-- Dynamic Title -->
            </div>
            <div id="dopagaki-sub-title" class="text-xl sm:text-3xl font-bold font-mono text-cyan-300">
                <!-- Sub description -->
            </div>
        </div>

        <!-- Pato Lamp / Special Gimmick Icon Container -->
        <div id="dopagaki-gimmick-box" class="absolute bottom-16 z-30 flex items-center justify-center gap-4 hidden">
            <div id="patlamp-icon" class="w-20 h-20 sm:w-28 sm:h-28 rounded-full bg-red-600 border-4 border-yellow-300 flex items-center justify-center shadow-[0_0_60px_#ef4444] animate-patlamp">
                <span class="text-white font-black text-xs sm:text-sm tracking-tighter">キュイン✨</span>
            </div>
        </div>

        <!-- Sparkle & Lightning Particle Elements -->
        <div id="dopagaki-sparks" class="absolute inset-0 pointer-events-none"></div>
    </div>

    <!-- Top Navigation Header -->
    <header class="sticky top-0 z-40 glass-panel border-b border-cyber-border px-4 lg:px-8 py-3 flex items-center justify-between">
        <div class="flex items-center space-x-3">
            <button id="mobile-menu-btn" class="lg:hidden text-slate-400 hover:text-white p-1">
                <i data-lucide="menu" class="w-6 h-6"></i>
            </button>
            <div class="flex items-center space-x-2 cursor-pointer" onclick="switchTab('dashboard')">
                <div class="p-2 bg-gradient-to-tr from-cyan-500 to-blue-600 rounded-lg text-white shadow-lg shadow-cyan-500/30">
                    <i data-lucide="brain-circuit" class="w-6 h-6"></i>
                </div>
                <div>
                    <span class="text-[10px] font-mono text-cyber-cyan tracking-wider uppercase block leading-none">Mockup Engine v0.5</span>
                    <h1 class="text-base font-bold text-white tracking-tight flex items-center gap-2">
                        問題作成・学習アプリ
                        <span class="text-[10px] bg-cyber-cyan/10 border border-cyber-cyan/30 text-cyber-cyan font-mono px-2 py-0.5 rounded-full">10段階すするパチスロ版</span>
                    </h1>
                </div>
            </div>
        </div>

        <!-- Quick Top Stats & Actions -->
        <div class="flex items-center space-x-3 sm:space-x-5">
            <!-- Audio Sound Toggle Button -->
            <button onclick="toggleAudioSound()" id="sound-toggle-btn" class="flex items-center space-x-1 px-3 py-1.5 rounded-lg border border-cyber-cyan/40 bg-cyber-cyan/10 text-cyber-cyan text-xs font-mono font-bold hover:bg-cyber-cyan/20 transition-all">
                <i data-lucide="volume-2" class="w-4 h-4"></i>
                <span class="hidden sm:inline" id="sound-btn-text">SOUND: ON</span>
            </button>

            <!-- Test Dopagaki Button (Menu to test 10 stages) -->
            <button onclick="runDopagakiSequence(1)" class="flex items-center space-x-1 px-3 py-1.5 rounded-lg border border-amber-400 bg-amber-500/20 text-amber-300 text-xs font-mono font-bold hover:bg-amber-500/30 shadow-lg shadow-amber-500/20 transition-all animate-pulse">
                <i data-lucide="zap" class="w-4 h-4"></i>
                <span>🔥 10段階演出テスト</span>
            </button>

            <div class="hidden sm:flex items-center space-x-4 text-xs font-mono bg-cyber-surface/90 px-3 py-1.5 rounded-lg border border-cyber-border">
                <div class="flex items-center gap-1.5">
                    <i data-lucide="flame" class="w-4 h-4 text-amber-400"></i>
                    <span id="header-streak" class="text-white font-bold">0</span>日連続
                </div>
                <div class="w-px h-3 bg-cyber-border"></div>
                <div class="flex items-center gap-1.5">
                    <i data-lucide="check-circle-2" class="w-4 h-4 text-emerald-400"></i>
                    <span id="header-today-count" class="text-white font-bold">0</span>問完了
                </div>
            </div>

            <button onclick="openQuestionModal()" class="flex items-center space-x-1.5 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white px-3.5 py-1.5 rounded-lg text-xs font-semibold shadow-lg shadow-cyan-500/20 transition-all active:scale-95">
                <i data-lucide="plus-circle" class="w-4 h-4"></i>
                <span class="hidden sm:inline">問題を作成</span>
            </button>
        </div>
    </header>

    <div class="flex flex-1 overflow-hidden relative">

        <!-- Sidebar Navigation -->
        <aside id="sidebar" class="fixed inset-y-0 left-0 z-30 w-64 bg-cyber-surface/95 border-r border-cyber-border transition-transform transform -translate-x-full lg:translate-x-0 lg:static lg:inset-auto lg:flex flex-col pt-14 lg:pt-0">
            <div class="p-4 border-b border-cyber-border/50">
                <div class="text-[11px] font-mono text-slate-500 uppercase tracking-widest mb-1">Navigation</div>
                <div class="text-xs font-semibold text-slate-300">メインメニュー</div>
            </div>

            <nav class="flex-1 overflow-y-auto p-3 space-y-1 text-xs">
                <button onclick="switchTab('dashboard')" id="nav-dashboard" class="nav-tab active w-full flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-slate-400 hover:text-white hover:bg-cyber-card transition-all font-medium">
                    <i data-lucide="layout-dashboard" class="w-4 h-4 text-cyber-cyan"></i> ダッシュボード
                </button>
                <button onclick="switchTab('decks')" id="nav-decks" class="nav-tab w-full flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-slate-400 hover:text-white hover:bg-cyber-card transition-all font-medium">
                    <i data-lucide="layers" class="w-4 h-4 text-purple-400"></i> デッキ＆問題管理
                </button>
                <button onclick="switchTab('analytics')" id="nav-analytics" class="nav-tab w-full flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-slate-400 hover:text-white hover:bg-cyber-card transition-all font-medium">
                    <i data-lucide="line-chart" class="w-4 h-4 text-emerald-400"></i> 学習分析・実績
                </button>
                <button onclick="switchTab('settings')" id="nav-settings" class="nav-tab w-full flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-slate-400 hover:text-white hover:bg-cyber-card transition-all font-medium">
                    <i data-lucide="settings" class="w-4 h-4 text-amber-400"></i> 設定・データ管理
                </button>
            </nav>

            <!-- Bottom Active Session Quick Panel -->
            <div class="p-4 border-t border-cyber-border bg-cyber-bg/50">
                <div class="flex items-center justify-between text-xs mb-2">
                    <span class="text-slate-400 font-mono">Quick Review</span>
                    <span id="sidebar-due-badge" class="text-[10px] bg-cyber-warning/20 text-cyber-warning border border-cyber-warning/30 px-2 py-0.5 rounded-full font-mono">0 復習期日</span>
                </div>
                <button onclick="startQuickReview()" class="w-full py-2 bg-cyber-surface hover:bg-cyber-card text-cyber-cyan border border-cyber-cyan/40 rounded-lg text-xs font-semibold flex items-center justify-center gap-2 transition-all">
                    <i data-lucide="zap" class="w-4 h-4"></i> 今すぐ復習を開始
                </button>
            </div>
        </aside>

        <!-- Sidebar Overlay -->
        <div id="sidebar-overlay" class="fixed inset-0 bg-black/60 backdrop-blur-sm z-20 hidden lg:hidden"></div>

        <!-- Main Content View Area -->
        <main class="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 space-y-8">

            <!-- ================= TAB 1: DASHBOARD ================= -->
            <section id="tab-dashboard" class="tab-content space-y-6">
                <!-- Banner Status Card -->
                <div class="glass-panel-glow rounded-2xl p-6 relative overflow-hidden">
                    <div class="absolute -right-10 -bottom-10 w-48 h-48 bg-gradient-to-br from-cyber-cyan/20 to-purple-600/20 rounded-full blur-3xl pointer-events-none"></div>
                    <div class="flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div>
                            <span class="text-xs font-mono text-cyber-cyan tracking-widest uppercase block mb-1">Welcome Back</span>
                            <h2 class="text-2xl font-extrabold text-white tracking-tight">
                                本日の復習・学習セッション <span class="neon-text">準備完了</span>
                            </h2>
                            <p class="text-xs text-slate-400 mt-1">
                                YouTubeのすするパチンコ演出（赤外線サーモグラフィー・HEAT HEAT・金文字爆発）を参考にした10段階連続正解演出を搭載。
                            </p>
                        </div>
                        <div class="flex items-center gap-3">
                            <button onclick="openDeckModal()" class="px-4 py-2 bg-cyber-surface hover:bg-cyber-border border border-cyber-border text-white text-xs font-semibold rounded-xl flex items-center gap-2 transition-all">
                                <i data-lucide="folder-plus" class="w-4 h-4 text-cyber-cyan"></i> 新規デッキ
                            </button>
                            <button onclick="startQuickReview()" class="px-5 py-2.5 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white text-xs font-bold rounded-xl shadow-lg shadow-cyan-500/25 flex items-center gap-2 transition-all active:scale-95">
                                <i data-lucide="play" class="w-4 h-4 fill-white"></i> 全デッキ学習スタート
                            </button>
                        </div>
                    </div>
                </div>

                <!-- KPI Metric Cards Grid -->
                <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div class="glass-panel p-4 rounded-xl space-y-1">
                        <div class="flex items-center justify-between text-xs text-slate-400 font-mono">
                            <span>本日の解答数</span>
                            <i data-lucide="check-square" class="w-4 h-4 text-cyber-cyan"></i>
                        </div>
                        <div class="text-2xl font-bold text-white font-mono" id="stat-today-cards">0</div>
                        <div class="text-[10px] text-emerald-400 flex items-center gap-1">
                            <i data-lucide="trending-up" class="w-3 h-3"></i> 順調に消化中
                        </div>
                    </div>

                    <div class="glass-panel p-4 rounded-xl space-y-1">
                        <div class="flex items-center justify-between text-xs text-slate-400 font-mono">
                            <span>復習到来（カード）</span>
                            <i data-lucide="clock" class="w-4 h-4 text-cyber-warning"></i>
                        </div>
                        <div class="text-2xl font-bold text-cyber-warning font-mono" id="stat-due-cards">0</div>
                        <div class="text-[10px] text-slate-400">期限に達したカード</div>
                    </div>

                    <div class="glass-panel p-4 rounded-xl space-y-1">
                        <div class="flex items-center justify-between text-xs text-slate-400 font-mono">
                            <span>正答率（100%方式）</span>
                            <i data-lucide="percent" class="w-4 h-4 text-purple-400"></i>
                        </div>
                        <div class="text-2xl font-bold text-purple-300 font-mono" id="stat-accuracy">0%</div>
                        <div class="text-[10px] text-slate-400">累計平均</div>
                    </div>

                    <div class="glass-panel p-4 rounded-xl space-y-1">
                        <div class="flex items-center justify-between text-xs text-slate-400 font-mono">
                            <span>連続学習ストリーク</span>
                            <i data-lucide="flame" class="w-4 h-4 text-amber-400"></i>
                        </div>
                        <div class="text-2xl font-bold text-amber-400 font-mono" id="stat-streak">0日</div>
                        <div class="text-[10px] text-amber-300/80">目標: 7日達成でバッジ</div>
                    </div>
                </div>

                <!-- Deck List Section Header -->
                <div class="flex items-center justify-between border-l-4 border-cyber-cyan pl-3">
                    <div>
                        <h3 class="text-lg font-bold text-white">登録中のデッキ一覧</h3>
                        <p class="text-xs text-slate-400">カード形式・問題形式を含むデッキを選択して学習を開始できます</p>
                    </div>
                    <div class="relative w-48 sm:w-64">
                        <i data-lucide="search" class="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-500"></i>
                        <input type="text" id="deck-search-input" oninput="renderDecks()" placeholder="デッキ検索..." class="w-full bg-cyber-surface border border-cyber-border rounded-lg pl-8 pr-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyber-cyan">
                    </div>
                </div>

                <!-- Deck Cards Grid Container -->
                <div id="deck-list-grid" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                    <!-- Populated dynamically via JS -->
                </div>
            </section>

            <!-- ================= TAB 2: DECKS & QUESTION CRUD ================= -->
            <section id="tab-decks" class="tab-content space-y-6 hidden">
                <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-cyber-border pb-4">
                    <div>
                        <h2 class="text-xl font-bold text-white tracking-wide">デッキ＆問題の編集・CRUD</h2>
                        <p class="text-xs text-slate-400">問題作成時に「カード形式」と「問題形式（選択・文字入力）」を個別に設定できます</p>
                    </div>
                    <div class="flex items-center gap-2">
                        <button onclick="openDeckModal()" class="px-3.5 py-2 bg-cyber-surface hover:bg-cyber-border border border-cyber-border text-white text-xs font-semibold rounded-lg flex items-center gap-2">
                            <i data-lucide="folder-plus" class="w-4 h-4 text-cyber-cyan"></i> 新規デッキ作成
                        </button>
                        <button onclick="openQuestionModal()" class="px-4 py-2 bg-cyber-cyan hover:bg-cyan-400 text-black text-xs font-bold rounded-lg flex items-center gap-2 shadow-lg shadow-cyan-500/20">
                            <i data-lucide="plus-circle" class="w-4 h-4"></i> 新規問題追加
                        </button>
                    </div>
                </div>

                <!-- Filter Controls -->
                <div class="flex flex-wrap items-center gap-3 bg-cyber-surface p-3 rounded-xl border border-cyber-border text-xs">
                    <div class="flex items-center gap-2">
                        <span class="text-slate-400 font-mono">絞り込み:</span>
                        <select id="crud-deck-filter" onchange="renderCrudQuestionList()" class="bg-cyber-bg border border-cyber-border rounded-lg px-3 py-1.5 text-white focus:outline-none focus:border-cyber-cyan">
                            <option value="ALL">全てのデッキ</option>
                        </select>
                    </div>
                    <div class="flex items-center gap-2">
                        <span class="text-slate-400 font-mono">形式:</span>
                        <select id="crud-type-filter" onchange="renderCrudQuestionList()" class="bg-cyber-bg border border-cyber-border rounded-lg px-3 py-1.5 text-white focus:outline-none focus:border-cyber-cyan">
                            <option value="ALL">全ての形式</option>
                            <option value="CARD">🎴 カード形式</option>
                            <option value="QUIZ_SINGLE">📝 問題形式 (択一選択)</option>
                            <option value="QUIZ_TEXT">📝 問題形式 (文字入力)</option>
                        </select>
                    </div>
                </div>

                <!-- Questions List Table -->
                <div class="glass-panel rounded-xl overflow-hidden">
                    <div class="overflow-x-auto">
                        <table class="w-full text-left text-xs">
                            <thead class="bg-cyber-surface text-slate-400 font-mono border-b border-cyber-border">
                                <tr>
                                    <th class="p-3">形式</th>
                                    <th class="p-3">所属デッキ</th>
                                    <th class="p-3">表面 / 問題文</th>
                                    <th class="p-3">裏面 / 正解</th>
                                    <th class="p-3">段階/期日</th>
                                    <th class="p-3 text-right">操作</th>
                                </tr>
                            </thead>
                            <tbody id="crud-questions-table-body" class="divide-y divide-cyber-border/40 text-slate-300">
                                <!-- Populated dynamically -->
                            </tbody>
                        </table>
                    </div>
                </div>
            </section>

            <!-- ================= TAB 3: STUDY & REVIEW SESSION ================= -->
            <section id="tab-study" class="tab-content space-y-6 hidden">
                <!-- Session Top Toolbar -->
                <div class="flex items-center justify-between glass-panel px-4 py-3 rounded-xl border border-cyber-cyan/30">
                    <div class="flex items-center space-x-3">
                        <button onclick="switchTab('dashboard')" class="text-slate-400 hover:text-white p-1">
                            <i data-lucide="arrow-left" class="w-5 h-5"></i>
                        </button>
                        <div>
                            <span id="session-deck-title" class="text-xs font-bold text-cyber-cyan font-mono block">全デッキ混合セッション</span>
                            <span id="session-progress-text" class="text-[11px] text-slate-400">カード 1 / 5</span>
                        </div>
                    </div>
                    
                    <!-- COMBO & STAGE COUNTER DISPLAY -->
                    <div id="combo-badge-container" class="hidden flex items-center gap-2 px-3.5 py-1 bg-gradient-to-r from-amber-500/20 to-purple-600/20 border border-amber-400/50 rounded-full font-mono">
                        <i data-lucide="zap" class="w-4 h-4 text-amber-400 animate-bounce"></i>
                        <span id="combo-count-text" class="text-xs font-extrabold text-amber-300 tracking-wider">STAGE 1 SUSURU</span>
                    </div>

                    <div class="flex items-center space-x-4">
                        <div class="flex items-center gap-1.5 text-xs font-mono bg-cyber-bg px-3 py-1 rounded-lg border border-cyber-border">
                            <i data-lucide="timer" class="w-3.5 h-3.5 text-cyber-cyan animate-pulse"></i>
                            <span id="session-timer" class="text-white">00:00</span>
                        </div>
                        <button onclick="switchTab('dashboard')" class="text-xs text-slate-400 hover:text-white underline">
                            セッション中断
                        </button>
                    </div>
                </div>

                <!-- MAIN CARD STUDY AREA CONTAINER -->
                <div id="study-main-wrapper" class="max-w-3xl mx-auto space-y-6 transition-transform">

                    <!-- FLASHCARD DISPLAY PANEL (For CARD format) -->
                    <div id="card-study-container" class="space-y-6">
                        <!-- Flashcard Flip Box -->
                        <div id="flashcard" onclick="flipCard()" class="perspective-1000 cursor-pointer min-h-[260px] sm:min-h-[320px] rounded-2xl relative transition-all duration-300 transform">
                            <div id="flashcard-inner" class="transform-style-3d transition-transform duration-500 w-full h-full relative">
                                <!-- FRONT SIDE -->
                                <div class="glass-panel-glow w-full h-full min-h-[260px] sm:min-h-[320px] rounded-2xl p-6 sm:p-8 flex flex-col justify-between absolute inset-0 backface-hidden border-2 border-cyber-cyan/40">
                                    <div class="flex items-center justify-between text-xs text-slate-400 font-mono">
                                        <span class="px-2 py-0.5 rounded bg-blue-500/10 border border-blue-500/30 text-blue-400">🎴 カード形式 [表面]</span>
                                        <span>クリックして開く <i data-lucide="rotate-cw" class="w-3.5 h-3.5 inline"></i></span>
                                    </div>
                                    <div class="my-auto text-center">
                                        <div id="card-front-text" class="text-xl sm:text-2xl font-bold text-white tracking-wide leading-relaxed">
                                            Card Front Content
                                        </div>
                                    </div>
                                    <div class="text-[11px] text-center text-slate-500 font-mono">
                                        提示画面：解答は隠されています
                                    </div>
                                </div>

                                <!-- BACK SIDE -->
                                <div class="glass-panel w-full h-full min-h-[260px] sm:min-h-[320px] rounded-2xl p-6 sm:p-8 flex flex-col justify-between absolute inset-0 backface-hidden rotate-y-180 border-2 border-purple-500/40 bg-cyber-surface/95">
                                    <div class="flex items-center justify-between text-xs text-slate-400 font-mono">
                                        <span class="px-2 py-0.5 rounded bg-purple-500/10 border border-purple-500/30 text-purple-400">🎴 カード形式 [裏面/正解]</span>
                                        <span class="text-cyber-cyan font-semibold">解答開示済み</span>
                                    </div>
                                    <div class="my-auto text-center space-y-3">
                                        <div id="card-back-text" class="text-xl sm:text-2xl font-bold text-cyber-neon tracking-wide leading-relaxed">
                                            Card Back Content
                                        </div>
                                        <div id="card-explanation-text" class="text-xs text-slate-400 max-w-lg mx-auto">
                                            解説テキスト
                                        </div>
                                    </div>
                                    <div class="text-[11px] text-center text-slate-500 font-mono">
                                        下記ボタンで自己評価（2段階）を選択してください
                                    </div>
                                </div>
                            </div>
                        </div>

                        <!-- 2-STAGE SELF EVALUATION BUTTONS (Card Format) -->
                        <div id="card-action-buttons" class="hidden grid grid-cols-2 gap-4">
                            <button onclick="handleCardAnswer(false)" class="p-4 rounded-xl bg-cyber-card border border-cyber-warning/50 hover:border-cyber-warning text-white flex flex-col items-center justify-center space-y-1 transition-all active:scale-95 group">
                                <div class="flex items-center gap-1.5 text-cyber-warning font-bold text-sm">
                                    <i data-lucide="rotate-ccw" class="w-4 h-4 group-hover:-rotate-45 transition-transform"></i> もう一度
                                </div>
                                <span class="text-[11px] text-slate-400 font-mono">リセット (1分後再出題)</span>
                            </button>

                            <button onclick="handleCardAnswer(true)" class="p-4 rounded-xl bg-gradient-to-r from-cyan-600/30 to-blue-600/30 border border-cyber-cyan hover:border-cyber-neon text-white flex flex-col items-center justify-center space-y-1 transition-all active:scale-95 group">
                                <div class="flex items-center gap-1.5 text-cyber-neon font-bold text-sm">
                                    <i data-lucide="check-circle" class="w-4 h-4"></i> 正解 (🔥 すする演出発動)
                                </div>
                                <span class="text-[11px] text-cyber-cyan font-mono" id="card-next-interval-label">段階昇格 (10分 ➔ 1日 ➔ 3日...)</span>
                            </button>
                        </div>
                    </div>

                    <!-- QUESTION PRACTICE DISPLAY PANEL (For QUIZ format) -->
                    <div id="quiz-study-container" class="glass-panel rounded-2xl p-6 sm:p-8 space-y-6 hidden border-2 border-purple-500/30">
                        <div class="flex items-center justify-between text-xs font-mono">
                            <span class="px-2.5 py-1 rounded bg-purple-500/10 border border-purple-500/30 text-purple-400">📝 問題形式 演習</span>
                            <span id="quiz-type-badge" class="text-slate-400">一問一答</span>
                        </div>

                        <div id="quiz-question-text" class="text-lg font-bold text-white leading-relaxed">
                            Question Prompt
                        </div>

                        <!-- Quiz Options Container (Single/Multiple choice) -->
                        <div id="quiz-options-container" class="space-y-2.5">
                            <!-- Populated dynamically -->
                        </div>

                        <!-- Quiz Text Input Area -->
                        <div id="quiz-text-input-container" class="space-y-3 hidden">
                            <input type="text" id="quiz-user-input" placeholder="解答を入力してください..." class="w-full bg-cyber-bg border border-cyber-border rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-cyber-cyan">
                            <button onclick="submitQuizTextInput()" class="w-full py-2.5 bg-cyber-primary hover:bg-blue-600 text-white text-xs font-bold rounded-xl transition-all">
                                解答を送信して答え合わせ
                            </button>
                        </div>

                        <!-- Quiz Answer Feedback Result (Revealed after answering) -->
                        <div id="quiz-feedback-box" class="p-4 rounded-xl bg-cyber-bg border border-cyber-border space-y-3 hidden">
                            <div id="quiz-result-badge" class="font-bold text-sm flex items-center gap-2">
                                <!-- Correct / Incorrect badge -->
                            </div>
                            <div id="quiz-explanation-box" class="text-xs text-slate-300">
                                正解: <span id="quiz-correct-answer-text" class="text-cyber-cyan font-bold font-mono">--</span>
                            </div>

                            <!-- "Close Enough" Self-Rating Override -->
                            <div class="pt-2 border-t border-cyber-border/50 flex items-center justify-between">
                                <span class="text-xs text-slate-400">大体あっていた（ニュアンス合致）として正解にする:</span>
                                <button onclick="overrideQuizCorrect()" class="px-3 py-1 bg-cyber-surface hover:bg-cyber-card border border-cyber-cyan/40 text-cyber-cyan rounded text-xs font-mono">
                                    自己採点で正解扱い (🔥 発動)
                                </button>
                            </div>

                            <button onclick="nextStudyCard()" class="w-full py-2.5 bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-bold text-xs rounded-xl transition-all">
                                次の問題へ進む
                            </button>
                        </div>
                    </div>

                    <!-- SCRATCHPAD & NOTE-TAKING COLLAPSIBLE PANEL -->
                    <div class="glass-panel rounded-xl overflow-hidden border border-cyber-border">
                        <div class="px-4 py-3 bg-cyber-surface border-b border-cyber-border flex items-center justify-between">
                            <div class="flex items-center space-x-2 text-xs font-mono text-slate-300">
                                <i data-lucide="pen-tool" class="w-4 h-4 text-cyber-cyan"></i>
                                <span>思考・計算プロセスノート & 手書きキャンバス</span>
                            </div>
                            <div class="flex items-center space-x-2 text-xs">
                                <button onclick="toggleNoteMode('text')" id="btn-note-text" class="px-2.5 py-1 rounded bg-cyber-card border border-cyber-cyan text-cyber-cyan font-mono text-[10px]">テキスト</button>
                                <button onclick="toggleNoteMode('draw')" id="btn-note-draw" class="px-2.5 py-1 rounded bg-cyber-bg border border-cyber-border text-slate-400 font-mono text-[10px]">手書き</button>
                                <button onclick="clearCanvas()" id="btn-clear-canvas" class="px-2 py-1 text-slate-400 hover:text-white text-[10px] hidden">消去</button>
                            </div>
                        </div>

                        <!-- Canvas / Text Area Container -->
                        <div class="p-4 space-y-3">
                            <!-- Text Note Input -->
                            <div id="note-text-wrapper">
                                <textarea id="study-text-note" rows="2" placeholder="思考過程や覚え方のメモを入力（自動保存）..." class="w-full bg-cyber-bg border border-cyber-border rounded-lg p-2.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-cyber-cyan"></textarea>
                            </div>

                            <!-- Canvas Drawing Input (Fixed Coordinates offset) -->
                            <div id="note-draw-wrapper" class="hidden">
                                <canvas id="scratch-canvas" width="600" height="180" class="w-full bg-cyber-bg rounded-lg border border-cyber-border cursor-crosshair touch-none"></canvas>
                            </div>

                            <!-- Saved Note History (Past 3 sessions) -->
                            <div class="pt-2 border-t border-cyber-border/40">
                                <span class="text-[10px] text-slate-500 font-mono block mb-1">過去3回分のメモ履歴:</span>
                                <div id="note-history-list" class="space-y-1 text-xs text-slate-400 font-mono">
                                    <div class="text-[11px] text-slate-600 italic">履歴はありません</div>
                                </div>
                            </div>
                        </div>
                    </div>

                </div>
            </section>

            <!-- ================= TAB 4: ANALYTICS & ACHIEVEMENTS ================= -->
            <section id="tab-analytics" class="tab-content space-y-6 hidden">
                <div class="border-b border-cyber-border pb-4">
                    <h2 class="text-xl font-bold text-white tracking-wide">学習分析・実績ダッシュボード</h2>
                    <p class="text-xs text-slate-400">学習時間の多角的グラフ化・ストリーク・実績バッジ解除状態</p>
                </div>

                <!-- Time Frame Selector & Charts Panel -->
                <div class="glass-panel p-6 rounded-xl space-y-6">
                    <div class="flex items-center justify-between flex-wrap gap-3">
                        <h3 class="text-sm font-bold text-white font-mono flex items-center gap-2">
                            <i data-lucide="bar-chart-3" class="w-4 h-4 text-cyber-cyan"></i> 学習時間・解答数グラフ
                        </h3>
                        <div class="flex items-center space-x-1 bg-cyber-surface p-1 rounded-lg border border-cyber-border text-xs font-mono">
                            <button onclick="switchChartFrame('DAY')" id="btn-frame-day" class="px-3 py-1 rounded bg-cyber-cyan text-black font-bold">日</button>
                            <button onclick="switchChartFrame('WEEK')" id="btn-frame-week" class="px-3 py-1 rounded text-slate-400 hover:text-white">週</button>
                            <button onclick="switchChartFrame('MONTH')" id="btn-frame-month" class="px-3 py-1 rounded text-slate-400 hover:text-white">月</button>
                        </div>
                    </div>

                    <!-- Simulated Visual Bar Chart -->
                    <div class="h-48 flex items-end justify-between gap-2 pt-6 pb-2 px-4 bg-cyber-surface/50 rounded-xl border border-cyber-border/50">
                        <div class="flex-1 flex flex-col items-center gap-2 h-full justify-end">
                            <div class="w-full bg-cyber-cyan/30 border border-cyber-cyan rounded-t transition-all hover:bg-cyber-cyan/50" style="height: 35%;"></div>
                            <span class="text-[10px] text-slate-500 font-mono">月</span>
                        </div>
                        <div class="flex-1 flex flex-col items-center gap-2 h-full justify-end">
                            <div class="w-full bg-cyber-cyan/30 border border-cyber-cyan rounded-t transition-all hover:bg-cyber-cyan/50" style="height: 55%;"></div>
                            <span class="text-[10px] text-slate-500 font-mono">火</span>
                        </div>
                        <div class="flex-1 flex flex-col items-center gap-2 h-full justify-end">
                            <div class="w-full bg-cyber-cyan/30 border border-cyber-cyan rounded-t transition-all hover:bg-cyber-cyan/50" style="height: 40%;"></div>
                            <span class="text-[10px] text-slate-500 font-mono">水</span>
                        </div>
                        <div class="flex-1 flex flex-col items-center gap-2 h-full justify-end">
                            <div class="w-full bg-cyber-cyan/30 border border-cyber-cyan rounded-t transition-all hover:bg-cyber-cyan/50" style="height: 70%;"></div>
                            <span class="text-[10px] text-slate-500 font-mono">木</span>
                        </div>
                        <div class="flex-1 flex flex-col items-center gap-2 h-full justify-end">
                            <div class="w-full bg-cyber-cyan/30 border border-cyber-cyan rounded-t transition-all hover:bg-cyber-cyan/50" style="height: 20%;"></div>
                            <span class="text-[10px] text-slate-500 font-mono">金</span>
                        </div>
                        <div class="flex-1 flex flex-col items-center gap-2 h-full justify-end">
                            <div class="w-full bg-gradient-to-t from-cyan-500 to-blue-500 rounded-t transition-all" style="height: 90%;"></div>
                            <span class="text-[10px] text-cyber-cyan font-mono font-bold">土</span>
                        </div>
                        <div class="flex-1 flex flex-col items-center gap-2 h-full justify-end">
                            <div class="w-full bg-cyber-cyan/30 border border-cyber-cyan rounded-t transition-all hover:bg-cyber-cyan/50" style="height: 60%;"></div>
                            <span class="text-[10px] text-slate-500 font-mono">日</span>
                        </div>
                    </div>
                </div>

                <!-- Simulated Heatmap Grid (Grass activity) -->
                <div class="glass-panel p-5 rounded-xl space-y-3">
                    <h3 class="text-xs font-bold text-white font-mono flex items-center gap-2">
                        <i data-lucide="grid" class="w-4 h-4 text-emerald-400"></i> 学習コミット・ヒートマップ (過去30日間)
                    </h3>
                    <div id="heatmap-grid" class="heatmap-grid grid gap-1.5 pt-2">
                        <!-- Populated via JS -->
                    </div>
                </div>

                <!-- Achievements & Badges Grid -->
                <div class="space-y-3">
                    <h3 class="text-sm font-bold text-white font-mono flex items-center gap-2">
                        <i data-lucide="award" class="w-4 h-4 text-amber-400"></i> 実績・解除バッジ一覧
                    </h3>
                    <div class="grid grid-cols-1 md:grid-cols-3 gap-4" id="badges-container">
                        <!-- Populated via JS -->
                    </div>
                </div>
            </section>

            <!-- ================= TAB 5: SETTINGS & DATA MANAGEMENT ================= -->
            <section id="tab-settings" class="tab-content space-y-6 hidden">
                <div class="border-b border-cyber-border pb-4">
                    <h2 class="text-xl font-bold text-white tracking-wide">設定＆データ管理</h2>
                    <p class="text-xs text-slate-400">ローカル保存状態・バックアップと復元・全初期化</p>
                </div>

                <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <!-- Backup & Restore -->
                    <div class="glass-panel p-6 rounded-xl space-y-4">
                        <h3 class="text-sm font-bold text-white font-mono flex items-center gap-2">
                            <i data-lucide="database" class="w-4 h-4 text-cyber-cyan"></i> バックアップと復元
                        </h3>
                        <p class="text-xs text-slate-400 leading-relaxed">
                            すべてのデッキ、問題、学習履歴、メモデータをJSON形式でエクスポート・保存します。
                        </p>
                        <div class="flex flex-col gap-2 pt-2">
                            <button onclick="exportDataJSON()" class="w-full py-2.5 bg-cyber-surface hover:bg-cyber-card border border-cyber-cyan/50 text-cyber-cyan rounded-lg text-xs font-mono font-bold flex items-center justify-center gap-2 transition-all">
                                <i data-lucide="download" class="w-4 h-4"></i> バックアップJSONをダウンロード
                            </button>
                            <label class="w-full py-2.5 bg-cyber-surface hover:bg-cyber-card border border-cyber-border text-slate-300 rounded-lg text-xs font-mono font-bold flex items-center justify-center gap-2 cursor-pointer transition-all">
                                <i data-lucide="upload" class="w-4 h-4"></i> バックアップファイルを復元
                                <input type="file" onchange="importDataJSON(event)" class="hidden" accept=".json">
                            </label>
                        </div>
                    </div>

                    <!-- Reset & Danger Zone -->
                    <div class="glass-panel p-6 rounded-xl space-y-4 border-red-500/30">
                        <h3 class="text-sm font-bold text-red-400 font-mono flex items-center gap-2">
                            <i data-lucide="alert-triangle" class="w-4 h-4 text-red-400"></i> データリセット
                        </h3>
                        <p class="text-xs text-slate-400 leading-relaxed">
                            ローカルストレージ内の全データを削除し、初期状態にリセットします。この操作は取り消せません。
                        </p>
                        <button onclick="resetAllData()" class="w-full py-2.5 bg-red-500/10 hover:bg-red-500/20 border border-red-500/40 text-red-400 rounded-lg text-xs font-mono font-bold flex items-center justify-center gap-2 transition-all">
                            <i data-lucide="trash-2" class="w-4 h-4"></i> 全学習データを初期化する
                        </button>
                    </div>
                </div>

                <!-- Storage State Inspector -->
                <div class="glass-panel p-6 rounded-xl space-y-3">
                    <div class="flex items-center justify-between">
                        <h3 class="text-xs font-bold text-slate-400 font-mono uppercase">LocalStorage Raw Inspector</h3>
                        <span class="text-[10px] text-cyber-cyan font-mono" id="storage-size-label">0 KB</span>
                    </div>
                    <pre id="storage-json-preview" class="p-3 bg-cyber-bg border border-cyber-border rounded-lg text-[11px] font-mono text-emerald-400 max-h-48 overflow-y-auto">
// Data JSON preview
                    </pre>
                </div>
            </section>

        </main>
    </div>

    <!-- ================= MODALS ================= -->

    <!-- Modal: CREATE / EDIT DECK -->
    <div id="modal-deck" class="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4 hidden">
        <div class="glass-panel-glow w-full max-w-md rounded-2xl p-6 space-y-4 relative">
            <div class="flex items-center justify-between border-b border-cyber-border pb-3">
                <h3 class="text-base font-bold text-white flex items-center gap-2">
                    <i data-lucide="folder-plus" class="w-5 h-5 text-cyber-cyan"></i> 新規デッキ作成
                </h3>
                <button onclick="closeModal('modal-deck')" class="text-slate-400 hover:text-white"><i data-lucide="x" class="w-5 h-5"></i></button>
            </div>
            <div class="space-y-3 text-xs">
                <div>
                    <label class="block text-slate-400 font-mono mb-1">デッキ名 *</label>
                    <input type="text" id="deck-name-input" placeholder="例: 英単語 上級" class="w-full bg-cyber-bg border border-cyber-border rounded-lg p-2.5 text-white focus:outline-none focus:border-cyber-cyan">
                </div>
                <div>
                    <label class="block text-slate-400 font-mono mb-1">説明 / 概要</label>
                    <textarea id="deck-desc-input" rows="2" placeholder="例: TOIEC 800点レベルの重要語句" class="w-full bg-cyber-bg border border-cyber-border rounded-lg p-2.5 text-white focus:outline-none focus:border-cyber-cyan"></textarea>
                </div>
            </div>
            <div class="flex items-center justify-end gap-2 pt-2">
                <button onclick="closeModal('modal-deck')" class="px-4 py-2 bg-cyber-surface hover:bg-cyber-border text-slate-300 rounded-lg text-xs font-medium">キャンセル</button>
                <button onclick="saveDeck()" class="px-4 py-2 bg-cyber-cyan hover:bg-cyan-400 text-black rounded-lg text-xs font-bold">保存する</button>
            </div>
        </div>
    </div>

    <!-- Modal: CREATE / EDIT QUESTION -->
    <div id="modal-question" class="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4 hidden">
        <div class="glass-panel-glow w-full max-w-lg rounded-2xl p-6 space-y-4 relative max-h-[90vh] overflow-y-auto">
            <div class="flex items-center justify-between border-b border-cyber-border pb-3">
                <h3 class="text-base font-bold text-white flex items-center gap-2">
                    <i data-lucide="plus-circle" class="w-5 h-5 text-purple-400"></i> 問題の新規登録
                </h3>
                <button onclick="closeModal('modal-question')" class="text-slate-400 hover:text-white"><i data-lucide="x" class="w-5 h-5"></i></button>
            </div>
            
            <div class="space-y-4 text-xs">
                <!-- Deck Selector -->
                <div>
                    <label class="block text-slate-400 font-mono mb-1">所属デッキ *</label>
                    <select id="q-deck-select" class="w-full bg-cyber-bg border border-cyber-border rounded-lg p-2.5 text-white focus:outline-none focus:border-cyber-cyan">
                        <!-- Dynamic decks -->
                    </select>
                </div>

                <!-- Format Switcher -->
                <div>
                    <label class="block text-slate-400 font-mono mb-1">コンテンツ形式 *</label>
                    <div class="grid grid-cols-2 gap-2">
                        <button type="button" onclick="switchQuestionFormMode('CARD')" id="btn-mode-card" class="py-2 rounded-lg border border-cyber-cyan bg-cyber-cyan/20 text-cyber-cyan font-bold font-mono">
                            🎴 カード形式
                        </button>
                        <button type="button" onclick="switchQuestionFormMode('QUIZ')" id="btn-mode-quiz" class="py-2 rounded-lg border border-cyber-border bg-cyber-bg text-slate-400 font-mono">
                            📝 問題形式
                        </button>
                    </div>
                </div>

                <!-- CARD FORM FIELDS -->
                <div id="form-fields-card" class="space-y-3">
                    <div>
                        <label class="block text-slate-400 font-mono mb-1">表面 (提示内容) *</label>
                        <textarea id="q-front-input" rows="2" placeholder="表面に表示する質問や単語..." class="w-full bg-cyber-bg border border-cyber-border rounded-lg p-2.5 text-white focus:outline-none focus:border-cyber-cyan"></textarea>
                    </div>
                    <div>
                        <label class="block text-slate-400 font-mono mb-1">裏面 (正解・解答) *</label>
                        <textarea id="q-back-input" rows="2" placeholder="裏面に表示する意味や解答..." class="w-full bg-cyber-bg border border-cyber-border rounded-lg p-2.5 text-white focus:outline-none focus:border-cyber-cyan"></textarea>
                    </div>
                </div>

                <!-- QUIZ FORM FIELDS -->
                <div id="form-fields-quiz" class="space-y-3 hidden">
                    <div>
                        <label class="block text-slate-400 font-mono mb-1">問題形式タイプ</label>
                        <select id="q-quiz-type-select" onchange="toggleQuizOptionInputs()" class="w-full bg-cyber-bg border border-cyber-border rounded-lg p-2.5 text-white focus:outline-none focus:border-cyber-cyan">
                            <option value="QUIZ_SINGLE">択一選択問題 (4択)</option>
                            <option value="QUIZ_TEXT">文字入力問題</option>
                        </select>
                    </div>

                    <div>
                        <label class="block text-slate-400 font-mono mb-1">問題文 *</label>
                        <textarea id="q-prompt-input" rows="2" placeholder="演習問題文..." class="w-full bg-cyber-bg border border-cyber-border rounded-lg p-2.5 text-white focus:outline-none focus:border-cyber-cyan"></textarea>
                    </div>

                    <!-- Options inputs for choice quiz -->
                    <div id="quiz-options-inputs" class="space-y-2">
                        <label class="block text-slate-400 font-mono">選択肢（1つ目を正解に設定）</label>
                        <input type="text" id="opt-1" placeholder="選択肢 A (正解)" class="w-full bg-cyber-bg border border-emerald-500/50 rounded-lg p-2 text-white text-xs">
                        <input type="text" id="opt-2" placeholder="選択肢 B" class="w-full bg-cyber-bg border border-cyber-border rounded-lg p-2 text-white text-xs">
                        <input type="text" id="opt-3" placeholder="選択肢 C" class="w-full bg-cyber-bg border border-cyber-border rounded-lg p-2 text-white text-xs">
                        <input type="text" id="opt-4" placeholder="選択肢 D" class="w-full bg-cyber-bg border border-cyber-border rounded-lg p-2 text-white text-xs">
                    </div>

                    <!-- Text input correct answer -->
                    <div id="quiz-text-answer-input" class="hidden">
                        <label class="block text-slate-400 font-mono mb-1">正解キーワード *</label>
                        <input type="text" id="opt-text-correct" placeholder="完全一致させる解答テキスト" class="w-full bg-cyber-bg border border-cyber-border rounded-lg p-2.5 text-white text-xs">
                    </div>
                </div>

                <!-- Common Explanation -->
                <div>
                    <label class="block text-slate-400 font-mono mb-1">解説 / 補足メモ</label>
                    <input type="text" id="q-explanation-input" placeholder="問題解答後の補足説明..." class="w-full bg-cyber-bg border border-cyber-border rounded-lg p-2.5 text-white focus:outline-none focus:border-cyber-cyan">
                </div>
            </div>

            <div class="flex items-center justify-end gap-2 pt-2">
                <button onclick="closeModal('modal-question')" class="px-4 py-2 bg-cyber-surface hover:bg-cyber-border text-slate-300 rounded-lg text-xs font-medium">キャンセル</button>
                <button onclick="saveQuestion()" class="px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-lg text-xs font-bold shadow-lg shadow-purple-500/20">保存する</button>
            </div>
        </div>
    </div>

    <!-- APP APPLICATION LOGIC (10-Stage "Susuru" Pachislot Engine) -->
    <script>
        // Default seed data
        const INITIAL_STATE = {
            streak: 3,
            todayCount: 12,
            decks: [
                { id: "deck-1", name: "英単語 Basic", desc: "日常英会話と基本単語", createdAt: "2026-10-20" },
                { id: "deck-2", name: "基本情報技術者試験", desc: "テクノロジ系・ストラテジ系用語", createdAt: "2026-10-22" },
                { id: "deck-3", name: "計算ドリル", desc: "暗算と公式適用トレーニング", createdAt: "2026-10-23" }
            ],
            questions: [
                {
                    id: "q-101",
                    deckId: "deck-1",
                    format: "CARD",
                    front: "Meticulous",
                    back: "細部まで行き届いた、極めて細心な",
                    explanation: "Synonym: careful, precise",
                    stage: 2,
                    due: "2026-10-24",
                    notes: ["過去ミス: 細いと聞き間違えがち"]
                },
                {
                    id: "q-102",
                    deckId: "deck-1",
                    format: "CARD",
                    front: "Reluctant",
                    back: "乗り気でない、気が進まない (to do)",
                    explanation: "be reluctant to do ~",
                    stage: 0,
                    due: "2026-10-23",
                    notes: []
                },
                {
                    id: "q-201",
                    deckId: "deck-2",
                    format: "QUIZ_SINGLE",
                    prompt: "リレーショナルデータベースにおける「主キー(Primary Key)」の特性として適切なものはどれか？",
                    options: ["非空かつ一意である", "重複を許容する", "ヌル(NULL)値を保持できる", "暗号化が必須である"],
                    correctIndex: 0,
                    explanation: "主キーはNOT NULLおよびUNIQUE制約を持ちます。",
                    stage: 1,
                    due: "2026-10-23",
                    notes: []
                },
                {
                    id: "q-301",
                    deckId: "deck-3",
                    format: "QUIZ_TEXT",
                    prompt: "12 × 15 の計算結果を入力してください。",
                    textCorrect: "180",
                    explanation: "12×10 + 12×5 = 120 + 60 = 180",
                    stage: 0,
                    due: "2026-10-23",
                    notes: []
                }
            ],
            historyLogs: [
                { date: "2026-10-23", count: 12, correct: 10 }
            ],
            badges: [
                { id: "b1", title: "初陣の証", desc: "初めて問題セッションを完了する", icon: "shield-check", unlocked: true },
                { id: "b2", title: "継続は力なり", desc: "3日連続学習を達成", icon: "flame", unlocked: true },
                { id: "b3", title: "暗記マスター", desc: "累計50問に正解する", icon: "award", unlocked: false }
            ]
        };

        // App State Reference
        let state = {};

        // Active Session Variables
        let currentSessionCards = [];
        let sessionIndex = 0;
        let cardFlipped = false;
        let sessionTimerInterval = null;
        let sessionSeconds = 0;
        let currentNoteMode = 'text'; // 'text' | 'draw'
        let modalQuestionMode = 'CARD';

        // SUSURU 10-STAGE COMBO & SOUND SYSTEMS
        let currentCombo = 0;
        let audioSoundEnabled = true;
        let audioCtx = null;

        // Load & Initialize
        document.addEventListener('DOMContentLoaded', () => {
            lucide.createIcons();
            loadState();
            renderDashboard();
            initCanvas();
            initSidebarMobile();
        });

        // ==========================================================
        // WEB AUDIO API SYNTHESIZER (パチンコ・スロット重厚サウンド)
        // ==========================================================
        function initAudioContext() {
            if (!audioCtx) {
                const AudioContextClass = window.AudioContext || window.webkitAudioContext;
                if (AudioContextClass) {
                    audioCtx = new AudioContextClass();
                }
            }
            if (audioCtx && audioCtx.state === 'suspended') {
                audioCtx.resume();
            }
        }

        function toggleAudioSound() {
            audioSoundEnabled = !audioSoundEnabled;
            const textEl = document.getElementById('sound-btn-text');
            const iconBtn = document.getElementById('sound-toggle-btn');
            
            if (audioSoundEnabled) {
                textEl.innerText = 'SOUND: ON';
                iconBtn.className = 'flex items-center space-x-1 px-3 py-1.5 rounded-lg border border-cyber-cyan/40 bg-cyber-cyan/10 text-cyber-cyan text-xs font-mono font-bold hover:bg-cyber-cyan/20 transition-all';
                playKyuinSound();
            } else {
                textEl.innerText = 'SOUND: OFF';
                iconBtn.className = 'flex items-center space-x-1 px-3 py-1.5 rounded-lg border border-slate-700 bg-cyber-surface text-slate-500 text-xs font-mono font-bold transition-all';
            }
        }

        // 1. キュイン音
        function playKyuinSound() {
            if (!audioSoundEnabled) return;
            try {
                initAudioContext();
                if (!audioCtx) return;
                const now = audioCtx.currentTime;
                const osc = audioCtx.createOscillator();
                const gain = audioCtx.createGain();
                osc.type = 'sawtooth';
                osc.frequency.setValueAtTime(800, now);
                osc.frequency.exponentialRampToValueAtTime(3800, now + 0.4);
                gain.gain.setValueAtTime(0.3, now);
                gain.gain.exponentialRampToValueAtTime(0.001, now + 0.45);
                osc.connect(gain);
                gain.connect(audioCtx.destination);
                osc.start(now);
                osc.stop(now + 0.45);
            } catch(e) {}
        }

        // 2. 昇圧アルペジオ
        function playRisingSynth(duration = 0.8) {
            if (!audioSoundEnabled) return;
            try {
                initAudioContext();
                if (!audioCtx) return;
                const now = audioCtx.currentTime;
                const notes = [261.63, 329.63, 392.00, 523.25, 659.25, 783.99, 1046.50, 1318.51, 1567.98];
                notes.forEach((freq, idx) => {
                    const time = now + idx * (duration / notes.length);
                    const osc = audioCtx.createOscillator();
                    const gain = audioCtx.createGain();
                    osc.type = 'square';
                    osc.frequency.setValueAtTime(freq, time);
                    gain.gain.setValueAtTime(0.18, time);
                    gain.gain.exponentialRampToValueAtTime(0.001, time + 0.12);
                    osc.connect(gain);
                    gain.connect(audioCtx.destination);
                    osc.start(time);
                    osc.stop(time + 0.12);
                });
            } catch(e) {}
        }

        // 3. 重低音心音
        function playHeartbeat(delayOffset = 0) {
            if (!audioSoundEnabled) return;
            try {
                initAudioContext();
                if (!audioCtx) return;
                const now = audioCtx.currentTime + delayOffset;
                [0, 0.18].forEach((t, i) => {
                    const time = now + t;
                    const osc = audioCtx.createOscillator();
                    const gain = audioCtx.createGain();
                    osc.type = 'sine';
                    osc.frequency.setValueAtTime(i === 0 ? 110 : 75, time);
                    osc.frequency.exponentialRampToValueAtTime(20, time + 0.14);
                    gain.gain.setValueAtTime(0.45, time);
                    gain.gain.exponentialRampToValueAtTime(0.001, time + 0.14);
                    osc.connect(gain);
                    gain.connect(audioCtx.destination);
                    osc.start(time);
                    osc.stop(time + 0.14);
                });
            } catch(e) {}
        }

        // 4. 重低音インパクト＆爆発ノイズ
        function playExplosionImpact() {
            if (!audioSoundEnabled) return;
            try {
                initAudioContext();
                if (!audioCtx) return;
                const now = audioCtx.currentTime;
                const osc = audioCtx.createOscillator();
                const gain = audioCtx.createGain();
                osc.type = 'sawtooth';
                osc.frequency.setValueAtTime(150, now);
                osc.frequency.exponentialRampToValueAtTime(10, now + 0.8);
                gain.gain.setValueAtTime(0.5, now);
                gain.gain.exponentialRampToValueAtTime(0.001, now + 0.8);
                osc.connect(gain);
                gain.connect(audioCtx.destination);
                osc.start(now);
                osc.stop(now + 0.8);
            } catch(e) {}
        }

        // 5. 神域オルガン和音
        function playGodFreezeChord() {
            if (!audioSoundEnabled) return;
            try {
                initAudioContext();
                if (!audioCtx) return;
                const now = audioCtx.currentTime;
                [440, 554.37, 659.25, 880, 1108.73].forEach((freq, idx) => {
                    const osc = audioCtx.createOscillator();
                    const gain = audioCtx.createGain();
                    osc.type = 'triangle';
                    osc.frequency.setValueAtTime(freq, now + idx * 0.05);
                    gain.gain.setValueAtTime(0.22, now);
                    gain.gain.exponentialRampToValueAtTime(0.001, now + 1.8);
                    osc.connect(gain);
                    gain.connect(audioCtx.destination);
                    osc.start(now);
                    osc.stop(now + 1.8);
                });
            } catch(e) {}
        }


        // ==========================================================
        // 10-STAGE "SUSURU" PACHISLOT OVERLOAD ENGINE (YouTube実機ベース演出)
        // ==========================================================
        function runDopagakiSequence(forcedStage = null, callback = null) {
            if (forcedStage === null || typeof forcedStage !== 'number') {
                currentCombo++;
            } else {
                currentCombo = forcedStage;
            }

            // Stage clamps between 1 and 10
            const stage = Math.min(Math.max(currentCombo, 1), 10);

            const overlay = document.getElementById('dopagaki-overlay');
            const bgLayer = document.getElementById('dopagaki-bg-layer');
            const titleEl = document.getElementById('dopagaki-main-title');
            const subTitleEl = document.getElementById('dopagaki-sub-title');
            const stageBadge = document.getElementById('dopagaki-stage-badge');
            const marqueeContainer = document.getElementById('dopagaki-marquee-container');
            const marqueeText = document.getElementById('dopagaki-marquee-text');
            const gimmickBox = document.getElementById('dopagaki-gimmick-box');
            const mainWrapper = document.getElementById('study-main-wrapper');

            overlay.classList.remove('hidden');
            marqueeContainer.classList.add('hidden');
            gimmickBox.classList.add('hidden');
            if (mainWrapper) {
                mainWrapper.classList.remove('animate-dopagaki-shake');
                mainWrapper.classList.remove('animate-dopagaki-earthquake');
            }

            // Switch presentation based on 10 Susuru Pachislot Stages
            switch (stage) {
                case 1:
                    // STAGE 1: 赤外線サーモグラフィー風・青保留
                    bgLayer.className = "absolute inset-0 bg-blue-950/90 animate-susuru-thermal";
                    stageBadge.innerText = "🔥 STAGE 1 : サーモグラフィー青保留";
                    titleEl.className = "text-4xl sm:text-6xl font-black italic tracking-tighter text-blue-300 animate-susuru-gold";
                    titleEl.innerText = "🎯 正解！ HEAT (青)";
                    subTitleEl.innerText = "連続正解ですする演出が加速する…！";
                    playKyuinSound();
                    break;

                case 2:
                    // STAGE 2: サーモグラフィー緑保留 ＋ 予告音
                    bgLayer.className = "absolute inset-0 bg-emerald-950/90 animate-susuru-thermal";
                    stageBadge.innerText = "⚡ STAGE 2 : サーモグラフィー緑保留";
                    titleEl.className = "text-4xl sm:text-6xl font-black italic tracking-tighter text-emerald-300 animate-susuru-gold";
                    titleEl.innerText = "✨ 連続正解！ HEAT (緑)";
                    subTitleEl.innerText = "気流が赤く熱を帯び始める…！";
                    playRisingSynth(0.5);
                    break;

                case 3:
                    // STAGE 3: 赤外線サーモグラフィー赤保留 ＋ 画面シェイク
                    bgLayer.className = "absolute inset-0 bg-red-950/95 animate-susuru-thermal";
                    stageBadge.innerText = "🔥 STAGE 3 : サーモグラフィー赤保留";
                    titleEl.className = "text-4xl sm:text-7xl font-black italic tracking-tighter text-red-500 animate-susuru-gold";
                    titleEl.innerText = "🚨 HEAT HEAT !! 赤保留";
                    subTitleEl.innerText = "全身が赤熱化する激アツ前兆！！";
                    playKyuinSound();
                    if (mainWrapper) mainWrapper.classList.add('animate-dopagaki-shake');
                    break;

                case 4:
                    // STAGE 4: YouTube参考「すするパチンコ演出」群予告（HEAT HEATテロップ通過）
                    bgLayer.className = "absolute inset-0 bg-purple-950/95 animate-susuru-thermal";
                    stageBadge.innerText = "🌟 STAGE 4 : すするパチンコ演出・群予告";
                    titleEl.className = "text-4xl sm:text-7xl font-black italic tracking-tighter text-yellow-300 animate-susuru-gold";
                    titleEl.innerText = "🌪️ 「すする」群予告発生！！";
                    subTitleEl.innerText = "サーモグラフィー群が画面を横切る！";
                    marqueeContainer.classList.remove('hidden');
                    marqueeText.innerText = "🔥 【HEAT HEAT !! すするパチンコ演出群予告通過中！】 激アツ！ すする！ 激アツ！ 🔥";
                    playRisingSynth(0.7);
                    if (mainWrapper) mainWrapper.classList.add('animate-dopagaki-shake');
                    break;

                case 5:
                    // STAGE 5: ゴールド「すする」文字爆発
                    bgLayer.className = "absolute inset-0 bg-amber-600/90 animate-flash-gold";
                    stageBadge.innerText = "👑 STAGE 5 : ゴールド「すする」文字爆発";
                    titleEl.className = "text-5xl sm:text-8xl font-black italic tracking-tighter text-amber-200 animate-susuru-gold";
                    titleEl.innerText = "✨ 金文字 「すする」降臨！";
                    subTitleEl.innerText = "黄金の輝きが画面を埋め尽くす！！";
                    playExplosionImpact();
                    if (mainWrapper) mainWrapper.classList.add('animate-dopagaki-shake');
                    break;

                case 6:
                    // STAGE 6: パトランプ回転 ＋ キュイン連打
                    bgLayer.className = "absolute inset-0 bg-red-900/95 animate-flash-red";
                    stageBadge.innerText = "🚨 STAGE 6 : パトランプ一撃告知";
                    titleEl.className = "text-5xl sm:text-8xl font-black italic tracking-tighter text-yellow-300 animate-susuru-gold";
                    titleEl.innerText = "🚨 キュインキュイン鳴り響く！";
                    subTitleEl.innerText = "パトランプ完全回転発動！！";
                    gimmickBox.classList.remove('hidden');
                    playKyuinSound();
                    setTimeout(playKyuinSound, 300);
                    setTimeout(playKyuinSound, 600);
                    break;

                case 7:
                    // STAGE 7: ミラクルGODフリーズ（完全ブラックアウト ＋ オルガン和音）
                    bgLayer.className = "absolute inset-0 bg-black";
                    stageBadge.innerText = "🌌 STAGE 7 : 神域ミラクルGODフリーズ";
                    titleEl.className = "text-4xl sm:text-7xl font-black italic tracking-tighter text-slate-100 animate-pulse";
                    titleEl.innerText = "…完全フリーズ発動…";
                    subTitleEl.innerText = "神の領域へ突入する…";
                    playGodFreezeChord();
                    break;

                case 8:
                    // STAGE 8: 全回転すするラッシュ（レインボー背景 ＋ ファンファーレ）
                    bgLayer.className = "absolute inset-0 animate-rainbow-bg";
                    stageBadge.innerText = "🌈 STAGE 8 : 全回転すするラッシュ";
                    titleEl.className = "text-5xl sm:text-8xl font-black italic tracking-tighter text-white animate-susuru-gold";
                    titleEl.innerText = "🎰 全回転すするラッシュ突入！";
                    subTitleEl.innerText = "止まらない連チャン演出！";
                    playRisingSynth(1.0);
                    confetti({ particleCount: 150, spread: 110, origin: { y: 0.5 } });
                    break;

                case 9:
                    // STAGE 9: 超確変すするバースト（大地震シェイク ＋ 虹色フラッシュ）
                    bgLayer.className = "absolute inset-0 animate-rainbow-bg";
                    stageBadge.innerText = "💎 STAGE 9 : 超確変すするバースト";
                    titleEl.className = "text-5xl sm:text-9xl font-black italic tracking-tighter text-yellow-200 animate-susuru-gold";
                    titleEl.innerText = "💥 爆裂確変 10000 OVER!!";
                    subTitleEl.innerText = "脳汁全開の最高潮ループ！";
                    playExplosionImpact();
                    if (mainWrapper) mainWrapper.classList.add('animate-dopagaki-earthquake');
                    confetti({ particleCount: 250, spread: 150, origin: { y: 0.5 } });
                    break;

                case 10:
                default:
                    // STAGE 10: 【究極神域 すする GOD RUSH / 10億爆裂JACKPOT】
                    bgLayer.className = "absolute inset-0 bg-gradient-to-tr from-yellow-500 via-red-600 to-purple-900 animate-rainbow-bg";
                    stageBadge.innerText = "👑🔥 STAGE 10 : 【究極神域 すする GOD RUSH】";
                    titleEl.className = "text-6xl sm:text-9xl font-black italic tracking-tighter text-yellow-300 animate-susuru-gold";
                    titleEl.innerText = "👑 すする GOD RUSH !! 👑";
                    subTitleEl.innerText = "YouTubeパチンコ実機演出全冠制覇・脳汁神域到達！！";
                    
                    gimmickBox.classList.remove('hidden');
                    marqueeContainer.classList.remove('hidden');
                    marqueeText.innerText = "🔥🌟 【究極神域達成！】 すするパチンコ演出完走！ HEAT HEAT 永久発動中 🌟🔥";

                    playExplosionImpact();
                    setTimeout(playKyuinSound, 250);
                    setTimeout(playGodFreezeChord, 600);

                    if (mainWrapper) mainWrapper.classList.add('animate-dopagaki-earthquake');
                    confetti({
                        particleCount: 450,
                        spread: 190,
                        origin: { y: 0.4 },
                        colors: ['#ff0055', '#ffea00', '#00ff66', '#00f0ff', '#ffffff', '#b000ff']
                    });
                    break;
            }

            // Update combo / stage badge text in UI
            const comboBadge = document.getElementById('combo-badge-container');
            const comboText = document.getElementById('combo-count-text');
            if (comboBadge && comboText) {
                comboBadge.classList.remove('hidden');
                comboText.innerText = `STAGE ${stage} SUSURU x${currentCombo}`;
            }

            // Cleanup overlay timer
            const displayTime = stage >= 7 ? 3500 : 2500;
            setTimeout(() => {
                overlay.classList.add('hidden');
                marqueeContainer.classList.add('hidden');
                gimmickBox.classList.add('hidden');
                if (mainWrapper) {
                    mainWrapper.classList.remove('animate-dopagaki-shake');
                    mainWrapper.classList.remove('animate-dopagaki-earthquake');
                }
                if (typeof callback === 'function') callback();
            }, displayTime);
        }

        function resetCombo() {
            currentCombo = 0;
            const comboBadge = document.getElementById('combo-badge-container');
            if (comboBadge) comboBadge.classList.add('hidden');
        }

        function loadState() {
            const stored = localStorage.getItem('app_quiz_state_v05');
            if (stored) {
                try {
                    state = JSON.parse(stored);
                } catch(e) {
                    state = INITIAL_STATE;
                }
            } else {
                state = INITIAL_STATE;
                saveState();
            }
            updateInspector();
        }

        function saveState() {
            localStorage.setItem('app_quiz_state_v05', JSON.stringify(state));
            updateInspector();
        }

        function updateInspector() {
            const raw = JSON.stringify(state, null, 2);
            document.getElementById('storage-json-preview').innerText = raw;
            const size = (new Blob([raw]).size / 1024).toFixed(1);
            document.getElementById('storage-size-label').innerText = `${size} KB`;
        }

        // ================= TAB NAVIGATION =================
        function switchTab(tabId) {
            document.querySelectorAll('.tab-content').forEach(el => el.classList.add('hidden'));
            document.querySelectorAll('.nav-tab').forEach(el => el.classList.remove('active'));

            const targetTab = document.getElementById(`tab-${tabId}`);
            if (targetTab) targetTab.classList.remove('hidden');

            const navBtn = document.getElementById(`nav-${tabId}`);
            if (navBtn) navBtn.classList.add('active');

            if (tabId === 'dashboard') renderDashboard();
            if (tabId === 'decks') renderCrudTab();
            if (tabId === 'analytics') renderAnalyticsTab();
            if (tabId === 'settings') updateInspector();

            document.getElementById('sidebar').classList.add('-translate-x-full');
            document.getElementById('sidebar-overlay').classList.add('hidden');
        }

        function initSidebarMobile() {
            const btn = document.getElementById('mobile-menu-btn');
            const sidebar = document.getElementById('sidebar');
            const overlay = document.getElementById('sidebar-overlay');

            btn.addEventListener('click', () => {
                sidebar.classList.toggle('-translate-x-full');
                overlay.classList.toggle('hidden');
            });

            overlay.addEventListener('click', () => {
                sidebar.classList.add('-translate-x-full');
                overlay.classList.add('hidden');
            });
        }

        // ================= DASHBOARD RENDER =================
        function renderDashboard() {
            document.getElementById('header-streak').innerText = state.streak || 0;
            document.getElementById('header-today-count').innerText = state.todayCount || 0;

            document.getElementById('stat-today-cards').innerText = state.todayCount || 0;
            document.getElementById('stat-streak').innerText = `${state.streak || 0}日`;

            const dueCount = state.questions.length;
            document.getElementById('stat-due-cards').innerText = dueCount;
            document.getElementById('sidebar-due-badge').innerText = `${dueCount} 復習期日`;

            renderDecks();
        }

        function renderDecks() {
            const grid = document.getElementById('deck-list-grid');
            const query = (document.getElementById('deck-search-input').value || '').toLowerCase();
            grid.innerHTML = '';

            const filtered = state.decks.filter(d => d.name.toLowerCase().includes(query) || d.desc.toLowerCase().includes(query));

            filtered.forEach(deck => {
                const deckQuestions = state.questions.filter(q => q.deckId === deck.id);
                const dueCount = deckQuestions.length;

                const card = document.createElement('div');
                card.className = 'glass-panel p-5 rounded-xl border border-cyber-border hover:border-cyber-cyan/50 transition-all flex flex-col justify-between space-y-4';
                card.innerHTML = `
                    <div class="space-y-2">
                        <div class="flex items-center justify-between">
                            <span class="text-[10px] font-mono px-2 py-0.5 rounded bg-blue-500/10 text-blue-400 border border-blue-500/30">DECK</span>
                            <span class="text-xs text-slate-400 font-mono">${deckQuestions.length} 問登録</span>
                        </div>
                        <h4 class="text-base font-bold text-white">${deck.name}</h4>
                        <p class="text-xs text-slate-400 leading-snug line-clamp-2">${deck.desc}</p>
                    </div>

                    <div class="pt-3 border-t border-cyber-border/50 flex items-center justify-between">
                        <div class="text-[11px] font-mono text-cyber-warning flex items-center gap-1">
                            <i data-lucide="clock" class="w-3.5 h-3.5"></i> 復習待ち: ${dueCount}
                        </div>
                        <button onclick="startSession('${deck.id}')" class="px-3 py-1.5 bg-cyber-surface hover:bg-cyber-cyan hover:text-black border border-cyber-cyan/40 text-cyber-cyan rounded-lg text-xs font-bold font-mono flex items-center gap-1 transition-all">
                            学習開始 <i data-lucide="arrow-right" class="w-3.5 h-3.5"></i>
                        </button>
                    </div>
                `;
                grid.appendChild(card);
            });
            lucide.createIcons();
        }

        // ================= CRUD TAB RENDER =================
        function renderCrudTab() {
            const deckSelect = document.getElementById('crud-deck-filter');
            deckSelect.innerHTML = '<option value="ALL">全てのデッキ</option>';
            state.decks.forEach(d => {
                deckSelect.innerHTML += `<option value="${d.id}">${d.name}</option>`;
            });

            renderCrudQuestionList();
        }

        function renderCrudQuestionList() {
            const tbody = document.getElementById('crud-questions-table-body');
            tbody.innerHTML = '';

            const selectedDeck = document.getElementById('crud-deck-filter').value;
            const selectedType = document.getElementById('crud-type-filter').value;

            const filtered = state.questions.filter(q => {
                const matchDeck = selectedDeck === 'ALL' || q.deckId === selectedDeck;
                const matchType = selectedType === 'ALL' || q.format === selectedType;
                return matchDeck && matchType;
            });

            filtered.forEach(q => {
                const deck = state.decks.find(d => d.id === q.deckId) || { name: "未分類" };
                const tr = document.createElement('tr');
                tr.className = "hover:bg-cyber-surface/50";

                let formatBadge = `<span class="px-2 py-0.5 rounded bg-blue-500/10 text-blue-400 border border-blue-500/30 text-[10px]">🎴 カード</span>`;
                if (q.format === 'QUIZ_SINGLE') formatBadge = `<span class="px-2 py-0.5 rounded bg-purple-500/10 text-purple-400 border border-purple-500/30 text-[10px]">📝 4択演習</span>`;
                if (q.format === 'QUIZ_TEXT') formatBadge = `<span class="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 text-[10px]">📝 文字入力</span>`;

                const frontText = q.front || q.prompt || '';
                const backText = q.back || (q.options ? q.options[q.correctIndex] : q.textCorrect) || '';

                tr.innerHTML = `
                    <td class="p-3">${formatBadge}</td>
                    <td class="p-3 text-slate-300 font-medium">${deck.name}</td>
                    <td class="p-3 text-white max-w-xs truncate">${frontText}</td>
                    <td class="p-3 text-cyber-cyan max-w-xs truncate">${backText}</td>
                    <td class="p-3 font-mono text-[11px]">Stage ${q.stage || 0}</td>
                    <td class="p-3 text-right">
                        <button onclick="deleteQuestion('${q.id}')" class="text-slate-500 hover:text-red-400 p-1"><i data-lucide="trash-2" class="w-4 h-4"></i></button>
                    </td>
                `;
                tbody.appendChild(tr);
            });
            lucide.createIcons();
        }

        // ================= STUDY & REVIEW SESSION ENGINE =================
        function startSession(deckId) {
            if (deckId === 'ALL') {
                currentSessionCards = [...state.questions];
                document.getElementById('session-deck-title').innerText = "全デッキ混合セッション";
            } else {
                currentSessionCards = state.questions.filter(q => q.deckId === deckId);
                const deck = state.decks.find(d => d.id === deckId);
                document.getElementById('session-deck-title').innerText = deck ? deck.name : "学習セッション";
            }

            if (currentSessionCards.length === 0) {
                alert("このデッキにはまだ問題が登録されていません。問題を追加してください。");
                return;
            }

            sessionIndex = 0;
            sessionSeconds = 0;
            resetCombo();
            switchTab('study');
            startSessionTimer();
            loadCurrentStudyCard();
        }

        function startQuickReview() {
            startSession('ALL');
        }

        function startSessionTimer() {
            clearInterval(sessionTimerInterval);
            sessionTimerInterval = setInterval(() => {
                sessionSeconds++;
                const mins = String(Math.floor(sessionSeconds / 60)).padStart(2, '0');
                const secs = String(sessionSeconds % 60).padStart(2, '0');
                document.getElementById('session-timer').innerText = `${mins}:${secs}`;
            }, 1000);
        }

        function loadCurrentStudyCard() {
            if (sessionIndex >= currentSessionCards.length) {
                clearInterval(sessionTimerInterval);
                runDopagakiSequence(10, () => {
                    state.todayCount += currentSessionCards.length;
                    saveState();
                    alert(`🎉 セッション完了！ ${currentSessionCards.length} 問の復習を消化しました。`);
                    switchTab('dashboard');
                });
                return;
            }

            const card = currentSessionCards[sessionIndex];
            document.getElementById('session-progress-text').innerText = `カード ${sessionIndex + 1} / ${currentSessionCards.length}`;

            cardFlipped = false;
            document.getElementById('flashcard-inner').classList.remove('rotate-y-180');
            document.getElementById('card-action-buttons').classList.add('hidden');

            if (card.format === 'CARD') {
                document.getElementById('card-study-container').classList.remove('hidden');
                document.getElementById('quiz-study-container').classList.add('hidden');

                document.getElementById('card-front-text').innerText = card.front;
                document.getElementById('card-back-text').innerText = card.back;
                document.getElementById('card-explanation-text').innerText = card.explanation || '';

                const intervals = ['10分後', '1日後', '3日後', '7日後', '14日後', '以降 2倍'];
                const nextLabel = intervals[Math.min(card.stage || 0, intervals.length - 1)];
                document.getElementById('card-next-interval-label').innerText = `段階昇格 (${nextLabel})`;
            } else {
                document.getElementById('card-study-container').classList.add('hidden');
                document.getElementById('quiz-study-container').classList.remove('hidden');

                document.getElementById('quiz-question-text').innerText = card.prompt || '';
                document.getElementById('quiz-feedback-box').classList.add('hidden');

                if (card.format === 'QUIZ_SINGLE') {
                    document.getElementById('quiz-type-badge').innerText = '4択演習';
                    document.getElementById('quiz-options-container').classList.remove('hidden');
                    document.getElementById('quiz-text-input-container').classList.add('hidden');

                    const optsContainer = document.getElementById('quiz-options-container');
                    optsContainer.innerHTML = '';
                    (card.options || []).forEach((opt, idx) => {
                        optsContainer.innerHTML += `
                            <button onclick="submitQuizOption(${idx})" class="w-full text-left p-3 rounded-xl bg-cyber-bg border border-cyber-border hover:border-cyber-cyan text-xs text-slate-200 transition-all font-mono">
                                ${String.fromCharCode(65 + idx)}. ${opt}
                            </button>
                        `;
                    });
                } else if (card.format === 'QUIZ_TEXT') {
                    document.getElementById('quiz-type-badge').innerText = '文字入力';
                    document.getElementById('quiz-options-container').classList.add('hidden');
                    document.getElementById('quiz-text-input-container').classList.remove('hidden');
                    document.getElementById('quiz-user-input').value = '';
                }
            }

            renderNoteHistory(card);
            clearCanvas();
        }

        function flipCard() {
            if (cardFlipped) return;
            cardFlipped = true;
            document.getElementById('flashcard-inner').classList.add('rotate-y-180');
            document.getElementById('card-action-buttons').classList.remove('hidden');
        }

        function handleCardAnswer(isCorrect) {
            const card = currentSessionCards[sessionIndex];
            if (isCorrect) {
                card.stage = (card.stage || 0) + 1;
                runDopagakiSequence(null, () => {
                    saveTextNoteToCard();
                    sessionIndex++;
                    loadCurrentStudyCard();
                });
            } else {
                card.stage = 0;
                resetCombo();
                playExplosionImpact();
                saveTextNoteToCard();
                sessionIndex++;
                loadCurrentStudyCard();
            }
        }

        function submitQuizOption(selectedIdx) {
            const card = currentSessionCards[sessionIndex];
            const isCorrect = selectedIdx === card.correctIndex;
            showQuizFeedback(isCorrect, card.options[card.correctIndex]);
        }

        function submitQuizTextInput() {
            const card = currentSessionCards[sessionIndex];
            const val = (document.getElementById('quiz-user-input').value || '').trim();
            const isCorrect = val.toLowerCase() === (card.textCorrect || '').toLowerCase();
            showQuizFeedback(isCorrect, card.textCorrect);
        }

        function showQuizFeedback(isCorrect, correctAnswerText) {
            const feedbackBox = document.getElementById('quiz-feedback-box');
            const resultBadge = document.getElementById('quiz-result-badge');
            document.getElementById('quiz-correct-answer-text').innerText = correctAnswerText;

            feedbackBox.classList.remove('hidden');

            if (isCorrect) {
                resultBadge.className = 'font-bold text-sm text-emerald-400 flex items-center gap-2';
                resultBadge.innerHTML = `<i data-lucide="check-circle-2" class="w-5 h-5"></i> 正解です！`;
                runDopagakiSequence(null);
            } else {
                resultBadge.className = 'font-bold text-sm text-red-400 flex items-center gap-2';
                resultBadge.innerHTML = `<i data-lucide="x-circle" class="w-5 h-5"></i> 不正解`;
                resetCombo();
                playExplosionImpact();
            }
            lucide.createIcons();
        }

        function overrideQuizCorrect() {
            runDopagakiSequence(null, () => {
                nextStudyCard();
            });
        }

        function nextStudyCard() {
            saveTextNoteToCard();
            sessionIndex++;
            loadCurrentStudyCard();
        }

        // ================= SCRATCHPAD & NOTE SYSTEM =================
        function toggleNoteMode(mode) {
            currentNoteMode = mode;
            if (mode === 'text') {
                document.getElementById('note-text-wrapper').classList.remove('hidden');
                document.getElementById('note-draw-wrapper').classList.add('hidden');
                document.getElementById('btn-clear-canvas').classList.add('hidden');

                document.getElementById('btn-note-text').className = 'px-2.5 py-1 rounded bg-cyber-card border border-cyber-cyan text-cyber-cyan font-mono text-[10px]';
                document.getElementById('btn-note-draw').className = 'px-2.5 py-1 rounded bg-cyber-bg border border-cyber-border text-slate-400 font-mono text-[10px]';
            } else {
                document.getElementById('note-text-wrapper').classList.add('hidden');
                document.getElementById('note-draw-wrapper').classList.remove('hidden');
                document.getElementById('btn-clear-canvas').classList.remove('hidden');

                document.getElementById('btn-note-draw').className = 'px-2.5 py-1 rounded bg-cyber-card border border-cyber-cyan text-cyber-cyan font-mono text-[10px]';
                document.getElementById('btn-note-text').className = 'px-2.5 py-1 rounded bg-cyber-bg border border-cyber-border text-slate-400 font-mono text-[10px]';
            }
        }

        function renderNoteHistory(card) {
            const list = document.getElementById('note-history-list');
            list.innerHTML = '';
            const notes = card.notes || [];

            if (notes.length === 0) {
                list.innerHTML = `<div class="text-[11px] text-slate-600 italic">履歴はありません</div>`;
                return;
            }

            notes.slice(-3).forEach(note => {
                list.innerHTML += `<div class="p-1.5 bg-cyber-bg/80 border border-cyber-border/40 rounded text-slate-300">${note}</div>`;
            });
        }

        function saveTextNoteToCard() {
            const text = (document.getElementById('study-text-note').value || '').trim();
            if (!text || sessionIndex >= currentSessionCards.length) return;

            const card = currentSessionCards[sessionIndex];
            if (!card.notes) card.notes = [];
            card.notes.push(text);
            if (card.notes.length > 3) card.notes.shift();

            document.getElementById('study-text-note').value = '';
            saveState();
        }

        // Canvas Drawing Setup with Exact Offset Rect Correction
        let canvas, ctx, drawing = false;

        function initCanvas() {
            canvas = document.getElementById('scratch-canvas');
            if (!canvas) return;
            ctx = canvas.getContext('2d');

            function getExactCanvasPos(e) {
                const rect = canvas.getBoundingClientRect();
                const scaleX = canvas.width / rect.width;
                const scaleY = canvas.height / rect.height;

                let clientX = e.clientX;
                let clientY = e.clientY;

                if (e.touches && e.touches.length > 0) {
                    clientX = e.touches[0].clientX;
                    clientY = e.touches[0].clientY;
                }

                return {
                    x: (clientX - rect.left) * scaleX,
                    y: (clientY - rect.top) * scaleY
                };
            }

            function startDraw(e) {
                drawing = true;
                const pos = getExactCanvasPos(e);
                ctx.beginPath();
                ctx.moveTo(pos.x, pos.y);
            }

            function draw(e) {
                if (!drawing) return;
                const pos = getExactCanvasPos(e);
                ctx.strokeStyle = '#00f0ff';
                ctx.lineWidth = 3;
                ctx.lineCap = 'round';
                ctx.lineTo(pos.x, pos.y);
                ctx.stroke();
            }

            function stopDraw() { drawing = false; }

            canvas.addEventListener('mousedown', startDraw);
            canvas.addEventListener('mousemove', draw);
            canvas.addEventListener('mouseup', stopDraw);
            canvas.addEventListener('mouseleave', stopDraw);

            canvas.addEventListener('touchstart', (e) => { startDraw(e); e.preventDefault(); }, { passive: false });
            canvas.addEventListener('touchmove', (e) => { draw(e); e.preventDefault(); }, { passive: false });
            canvas.addEventListener('touchend', stopDraw);
        }

        function clearCanvas() {
            if (ctx && canvas) {
                ctx.clearRect(0, 0, canvas.width, canvas.height);
            }
        }

        // ================= ANALYTICS & BADGES RENDER =================
        function renderAnalyticsTab() {
            const grid = document.getElementById('heatmap-grid');
            grid.innerHTML = '';
            for (let i = 0; i < 30; i++) {
                const level = Math.floor(Math.random() * 4);
                let colorClass = 'bg-cyber-surface border border-cyber-border';
                if (level === 1) colorClass = 'bg-cyan-950 border border-cyan-800';
                if (level === 2) colorClass = 'bg-cyan-700 border border-cyan-500';
                if (level === 3) colorClass = 'bg-cyber-cyan border border-cyber-neon';

                grid.innerHTML += `<div class="w-full h-6 rounded ${colorClass}" title="Day ${i+1}"></div>`;
            }

            const badgeContainer = document.getElementById('badges-container');
            badgeContainer.innerHTML = '';
            (state.badges || []).forEach(b => {
                const isUnlocked = b.unlocked;
                badgeContainer.innerHTML += `
                    <div class="glass-panel p-4 rounded-xl border ${isUnlocked ? 'border-amber-400/40 bg-amber-500/5' : 'border-cyber-border opacity-50'} flex items-center gap-3">
                        <div class="p-3 rounded-xl ${isUnlocked ? 'bg-amber-400/20 text-amber-400' : 'bg-cyber-surface text-slate-600'}">
                            <i data-lucide="${b.icon || 'award'}" class="w-6 h-6"></i>
                        </div>
                        <div>
                            <span class="text-[10px] font-mono ${isUnlocked ? 'text-amber-400' : 'text-slate-500'} block">${isUnlocked ? 'UNLOCKED' : 'LOCKED'}</span>
                            <h4 class="text-xs font-bold text-white">${b.title}</h4>
                            <p class="text-[11px] text-slate-400">${b.desc}</p>
                        </div>
                    </div>
                `;
            });
            lucide.createIcons();
        }

        function switchChartFrame(frame) {
            ['day', 'week', 'month'].forEach(f => {
                const btn = document.getElementById(`btn-frame-${f}`);
                if (f === frame.toLowerCase()) {
                    btn.className = 'px-3 py-1 rounded bg-cyber-cyan text-black font-bold';
                } else {
                    btn.className = 'px-3 py-1 rounded text-slate-400 hover:text-white';
                }
            });
        }

        // ================= CRUD MODAL ACTIONS =================
        function openDeckModal() {
            document.getElementById('deck-name-input').value = '';
            document.getElementById('deck-desc-input').value = '';
            document.getElementById('modal-deck').classList.remove('hidden');
        }

        function saveDeck() {
            const name = document.getElementById('deck-name-input').value.trim();
            const desc = document.getElementById('deck-desc-input').value.trim();

            if (!name) { alert("デッキ名を入力してください。"); return; }

            const newDeck = {
                id: 'deck-' + Date.now(),
                name: name,
                desc: desc,
                createdAt: new Date().toISOString().split('T')[0]
            };

            state.decks.push(newDeck);
            saveState();
            closeModal('modal-deck');
            renderDashboard();
            renderCrudTab();
        }

        function openQuestionModal() {
            const select = document.getElementById('q-deck-select');
            select.innerHTML = '';
            state.decks.forEach(d => {
                select.innerHTML += `<option value="${d.id}">${d.name}</option>`;
            });

            document.getElementById('q-front-input').value = '';
            document.getElementById('q-back-input').value = '';
            document.getElementById('q-prompt-input').value = '';
            document.getElementById('opt-1').value = '';
            document.getElementById('opt-2').value = '';
            document.getElementById('opt-3').value = '';
            document.getElementById('opt-4').value = '';
            document.getElementById('opt-text-correct').value = '';

            switchQuestionFormMode('CARD');
            document.getElementById('modal-question').classList.remove('hidden');
        }

        function switchQuestionFormMode(mode) {
            modalQuestionMode = mode;
            if (mode === 'CARD') {
                document.getElementById('form-fields-card').classList.remove('hidden');
                document.getElementById('form-fields-quiz').classList.add('hidden');
                document.getElementById('btn-mode-card').className = 'py-2 rounded-lg border border-cyber-cyan bg-cyber-cyan/20 text-cyber-cyan font-bold font-mono';
                document.getElementById('btn-mode-quiz').className = 'py-2 rounded-lg border border-cyber-border bg-cyber-bg text-slate-400 font-mono';
            } else {
                document.getElementById('form-fields-card').classList.add('hidden');
                document.getElementById('form-fields-quiz').classList.remove('hidden');
                document.getElementById('btn-mode-quiz').className = 'py-2 rounded-lg border border-purple-500 bg-purple-500/20 text-purple-300 font-bold font-mono';
                document.getElementById('btn-mode-card').className = 'py-2 rounded-lg border border-cyber-border bg-cyber-bg text-slate-400 font-mono';
            }
        }

        function toggleQuizOptionInputs() {
            const type = document.getElementById('q-quiz-type-select').value;
            if (type === 'QUIZ_SINGLE') {
                document.getElementById('quiz-options-inputs').classList.remove('hidden');
                document.getElementById('quiz-text-answer-input').classList.add('hidden');
            } else {
                document.getElementById('quiz-options-inputs').classList.add('hidden');
                document.getElementById('quiz-text-answer-input').classList.remove('hidden');
            }
        }

        function saveQuestion() {
            const deckId = document.getElementById('q-deck-select').value;
            const explanation = document.getElementById('q-explanation-input').value.trim();

            if (!deckId) { alert("所属デッキを選択してください。"); return; }

            let newQ = {
                id: 'q-' + Date.now(),
                deckId: deckId,
                explanation: explanation,
                stage: 0,
                due: new Date().toISOString().split('T')[0],
                notes: []
            };

            if (modalQuestionMode === 'CARD') {
                const front = document.getElementById('q-front-input').value.trim();
                const back = document.getElementById('q-back-input').value.trim();
                if (!front || !back) { alert("表面と裏面を入力してください。"); return; }

                newQ.format = 'CARD';
                newQ.front = front;
                newQ.back = back;
            } else {
                const type = document.getElementById('q-quiz-type-select').value;
                const prompt = document.getElementById('q-prompt-input').value.trim();
                if (!prompt) { alert("問題文を入力してください。"); return; }

                newQ.format = type;
                newQ.prompt = prompt;

                if (type === 'QUIZ_SINGLE') {
                    const opt1 = document.getElementById('opt-1').value.trim();
                    const opt2 = document.getElementById('opt-2').value.trim();
                    const opt3 = document.getElementById('opt-3').value.trim();
                    const opt4 = document.getElementById('opt-4').value.trim();
                    if (!opt1 || !opt2) { alert("少なくとも2つの選択肢を入力してください。"); return; }

                    newQ.options = [opt1, opt2, opt3 || 'なし', opt4 || 'なし'];
                    newQ.correctIndex = 0;
                } else {
                    const textCorrect = document.getElementById('opt-text-correct').value.trim();
                    if (!textCorrect) { alert("正解キーワードを入力してください。"); return; }
                    newQ.textCorrect = textCorrect;
                }
            }

            state.questions.push(newQ);
            saveState();
            closeModal('modal-question');
            renderCrudTab();
            renderDashboard();
        }

        function deleteQuestion(qId) {
            if (!confirm("この問題を削除してもよろしいですか？")) return;
            state.questions = state.questions.filter(q => q.id !== qId);
            saveState();
            renderCrudTab();
            renderDashboard();
        }

        function closeModal(modalId) {
            document.getElementById(modalId).classList.add('hidden');
        }

        // ================= SETTINGS & BACKUP ACTIONS =================
        function exportDataJSON() {
            const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(state, null, 2));
            const dlAnchorElem = document.createElement('a');
            dlAnchorElem.setAttribute("href", dataStr);
            dlAnchorElem.setAttribute("download", `quiz_app_backup_${new Date().toISOString().split('T')[0]}.json`);
            document.body.appendChild(dlAnchorElem);
            dlAnchorElem.click();
            dlAnchorElem.remove();
        }

        function importDataJSON(event) {
            const fileReader = new FileReader();
            fileReader.onload = function(e) {
                try {
                    const parsed = JSON.parse(e.target.result);
                    if (parsed.decks && parsed.questions) {
                        state = parsed;
                        saveState();
                        alert("データが正常に復元されました！");
                        renderDashboard();
                    } else {
                        alert("無効なバックアップファイルフォーマットです。");
                    }
                } catch(err) {
                    alert("JSONファイルの読み込みエラーが発生しました。");
                }
            };
            fileReader.readAsText(event.target.files[0]);
        }

        function resetAllData() {
            if (!confirm("全データを削除して初期化しますか？この操作は戻せません。")) return;
            state = INITIAL_STATE;
            saveState();
            alert("データが初期化されました。");
            renderDashboard();
        }
    </script>
</body>
</html>
