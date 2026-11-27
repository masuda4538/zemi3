// --- LIVE ARTICLES STORE (NO DUMMY DATA) ---
let SAMPLE_ARTICLES = [];

function isJapaneseText(text) {
    return /[぀-ゟ゠-ヿ]/.test(text || '');
}

function resolveArticleRegion(art) {
    const combined = `${art.title || ''} ${art.description || ''}`;
    return isJapaneseText(combined) ? 'jp' : 'global';
}

function inferCategoryFromArticle(title, description, fallbackIdx) {
    const catMap = ['AI/LLM', 'フロントエンド', 'バックエンド', 'Cloud/DevOps', 'セキュリティ', 'モバイル'];
    const text = `${title || ''} ${description || ''}`.toLowerCase();
    if (/ai|llm|gpt|gemini|openai|anthropic|生成ai|人工知能|機械学習/.test(text)) return 'AI/LLM';
    if (/react|vue|css|html|frontend|javascript|typescript|next\.js|フロントエンド|web/.test(text)) return 'フロントエンド';
    if (/rust|go|python|java|node|backend|api|database|sql|サーバー/.test(text)) return 'バックエンド';
    if (/docker|k8s|kubernetes|aws|gcp|azure|cloud|devops|terraform|クラウド/.test(text)) return 'Cloud/DevOps';
    if (/security|sec|auth|sbom|cve|vulnerability|セキュリティ|サイバー|脆弱性|攻撃/.test(text)) return 'セキュリティ';
    if (/ios|android|flutter|swift|kotlin|mobile|スマホ|iphone|アプリ/.test(text)) return 'モバイル';
    return catMap[fallbackIdx % catMap.length];
}

async function fetchLiveNewsAPI(isManualRefresh = false) {
    const syncIcon = document.getElementById('syncIcon');
    if (syncIcon) syncIcon.classList.add('animate-spin');
    let addedJp = 0;
    let addedGlobal = 0;

    const jpUrl = `${API_CONFIG.NEWS_PROXY_ENDPOINT}?region=jp`;
    const globalUrl = `${API_CONFIG.NEWS_PROXY_ENDPOINT}?region=global`;

    try {
        const [jpResult, globalResult] = await Promise.allSettled([
            fetch(jpUrl).then(r => r.ok ? r.json() : Promise.reject(r.status)),
            fetch(globalUrl).then(r => r.ok ? r.json() : Promise.reject(r.status))
        ]);

        // 1. Japanese articles -> JP only
        if (jpResult.status === 'fulfilled' && Array.isArray(jpResult.value?.articles)) {
            jpResult.value.articles.forEach((item, idx) => {
                const category = inferCategoryFromArticle(item.title, item.description, idx);
                const candidate = {
                    id: `gnews-jp-${encodeURIComponent(item.url || item.title)}`,
                    region: 'jp',
                    category,
                    title: item.title || '',
                    description: item.description || item.content || '',
                    source: item.source?.name || 'GNews JP',
                    url: item.url || '#',
                    image: item.image || getCategoryImage(category),
                    date: item.publishedAt || new Date().toISOString(),
                    isTrending: idx < 2,
                    viewsCount: (10 - idx) * 120 + 500
                };
                if (resolveArticleRegion(candidate) === 'jp' && !SAMPLE_ARTICLES.some(a => a.id === candidate.id)) {
                    SAMPLE_ARTICLES.push(candidate);
                    addedJp++;
                }
            });
        }

        // 2. Overseas articles -> Global only
        if (globalResult.status === 'fulfilled' && Array.isArray(globalResult.value?.articles)) {
            globalResult.value.articles.forEach((item, idx) => {
                const category = inferCategoryFromArticle(item.title, item.description, idx);
                const candidate = {
                    id: `gnews-global-${encodeURIComponent(item.url || item.title)}`,
                    region: 'global',
                    category,
                    title: item.title || '',
                    description: item.description || item.content || '',
                    source: item.source?.name || 'GNews Global',
                    url: item.url || '#',
                    image: item.image || getCategoryImage(category),
                    date: item.publishedAt || new Date().toISOString(),
                    isTrending: idx < 2,
                    viewsCount: (10 - idx) * 120 + 500
                };
                if (resolveArticleRegion(candidate) === 'global' && !SAMPLE_ARTICLES.some(a => a.id === candidate.id)) {
                    SAMPLE_ARTICLES.push(candidate);
                    addedGlobal++;
                }
            });
        }

        if ((jpResult.value && jpResult.value.error === 'GNEWS_API_KEY_NOT_SET') || (globalResult.value && globalResult.value.error === 'GNEWS_API_KEY_NOT_SET')) {
            showToast('.env に GNEWS_API_KEY を設定してサーバーを再起動してください');
        } else if (jpResult.status === 'rejected' && globalResult.status === 'rejected') {
            showToast('GNews APIからの記事取得に失敗しました（サーバー・通信状況をご確認ください）');
        } else if (isManualRefresh || addedJp > 0 || addedGlobal > 0) {
            showToast(`GNews APIから記事を取得しました（JP: +${addedJp}件 / Global: +${addedGlobal}件）`);
        }
    } catch (err) {
        console.warn('GNews API fetch error:', err);
        showToast('GNews APIの通信中にエラーが発生しました');
    } finally {
        if (syncIcon) syncIcon.classList.remove('animate-spin');
        updateUI();
    }
}

function refreshArticlesFromAPI() {
    fetchLiveNewsAPI(true);
}

function getFilteredArticles() {
    let list = SAMPLE_ARTICLES.filter(art => resolveArticleRegion(art) === state.currentRegion);

    if (state.currentView === 'recommended') {
        const topCategories = Object.keys(state.categoryVisits).sort((a, b) => state.categoryVisits[b] - state.categoryVisits[a]);
        list = list.filter(art => {
            const isTopCategory = topCategories.slice(0, 2).includes(art.category);
            return isTopCategory || art.isTrending || state.bookmarks.has(art.id);
        });
    } else if (state.currentView === 'trending') {
        list = list.filter(art => art.isTrending || art.viewsCount > 1000);
    } else if (state.currentView === 'bookmarks') {
        list = list.filter(art => state.bookmarks.has(art.id));
    } else if (state.currentView === 'unread') {
        list = list.filter(art => !state.readArticles.has(art.id));
    }

    if (state.selectedCategory !== 'すべて') {
        list = list.filter(art => art.category === state.selectedCategory);
    }

    if (state.dateFilter !== 'all') {
        const now = Date.now();
        list = list.filter(art => {
            const artDate = new Date(art.date).getTime();
            const hoursDiff = (now - artDate) / (1000 * 60 * 60);
            if (state.dateFilter === '24h') return hoursDiff <= 24;
            if (state.dateFilter === '7d') return hoursDiff <= 24 * 7;
            return true;
        });
    }

    if (state.searchQuery) {
        const q = state.searchQuery.toLowerCase();
        list = list.filter(art => art.title.toLowerCase().includes(q) || art.description.toLowerCase().includes(q) || art.source.toLowerCase().includes(q) || art.category.toLowerCase().includes(q));
    }

    return list.sort((a, b) => {
        const diff = new Date(b.date).getTime() - new Date(a.date).getTime();
        return diff !== 0 ? diff : a.id.localeCompare(b.id);
    });
}

function getSVGPlaceholder(category) {
    const cat = category || 'Tech';
    let graphic = '';

    if (cat === 'AI/LLM') {
        graphic = `
            <defs>
                <radialGradient id="aiBg" cx="50%" cy="50%" r="70%">
                    <stop offset="0%" stop-color="#1e3a5f"/>
                    <stop offset="100%" stop-color="#0f172a"/>
                </radialGradient>
                <filter id="glow" x="-30%" y="-30%" width="160%" height="160%">
                    <feGaussianBlur stdDeviation="4" result="blur"/>
                    <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
                </filter>
            </defs>
            <rect width="600" height="300" fill="url(#aiBg)"/>
            <g stroke="#38bdf8" stroke-opacity="0.35" stroke-width="1.5">
                <line x1="180" y1="100" x2="270" y2="75"/><line x1="180" y1="100" x2="255" y2="150"/>
                <line x1="180" y1="100" x2="210" y2="210"/><line x1="270" y1="75" x2="360" y2="95"/>
                <line x1="270" y1="75" x2="255" y2="150"/><line x1="255" y1="150" x2="360" y2="95"/>
                <line x1="255" y1="150" x2="335" y2="195"/><line x1="255" y1="150" x2="210" y2="210"/>
                <line x1="360" y1="95" x2="425" y2="145"/><line x1="360" y1="95" x2="335" y2="195"/>
                <line x1="335" y1="195" x2="425" y2="145"/><line x1="210" y1="210" x2="335" y2="195"/>
            </g>
            <g filter="url(#glow)">
                <circle cx="180" cy="100" r="6" fill="#7dd3fc"/><circle cx="270" cy="75" r="7" fill="#38bdf8"/>
                <circle cx="255" cy="150" r="10" fill="#bae6fd"/><circle cx="360" cy="95" r="7" fill="#818cf8"/>
                <circle cx="335" cy="195" r="8" fill="#60a5fa"/><circle cx="210" cy="210" r="6" fill="#818cf8"/>
                <circle cx="425" cy="145" r="7" fill="#38bdf8"/>
            </g>`;
    } else if (cat === 'フロントエンド') {
        graphic = `
            <rect width="600" height="300" fill="#0f172a"/>
            <g stroke="#38bdf8" stroke-opacity="0.25" stroke-width="1">
                <line x1="0" y1="60" x2="600" y2="60"/><line x1="0" y1="240" x2="600" y2="240"/>
                <line x1="120" y1="0" x2="120" y2="300"/><line x1="480" y1="0" x2="480" y2="300"/>
            </g>
            <rect x="150" y="55" width="300" height="190" rx="12" fill="#1e293b" stroke="#38bdf8" stroke-width="2" stroke-opacity="0.7"/>
            <rect x="150" y="55" width="300" height="26" rx="12" fill="#0284c7" fill-opacity="0.45"/>
            <circle cx="170" cy="68" r="4" fill="#38bdf8"/><circle cx="184" cy="68" r="4" fill="#7dd3fc"/><circle cx="198" cy="68" r="4" fill="#bae6fd"/>
            <rect x="170" y="98" width="90" height="125" rx="6" fill="#0f172a" stroke="#06b6d4" stroke-width="1.5"/>
            <rect x="275" y="98" width="155" height="65" rx="6" fill="#0284c7" fill-opacity="0.3" stroke="#38bdf8" stroke-width="1.5"/>
            <rect x="275" y="175" width="72" height="48" rx="6" fill="#1e3a8a" stroke="#60a5fa" stroke-width="1.5"/>
            <rect x="358" y="175" width="72" height="48" rx="6" fill="#0e7490" fill-opacity="0.5" stroke="#22d3ee" stroke-width="1.5"/>`;
    } else if (cat === 'バックエンド') {
        graphic = `
            <rect width="600" height="300" fill="#111827"/>
            <g stroke="#6366f1" stroke-width="2" stroke-opacity="0.55" fill="none">
                <path d="M130 90 H240 L270 150 H330 L360 90 H470"/>
                <path d="M130 210 H240 L270 150 H330 L360 210 H470"/>
                <line x1="130" y1="150" x2="470" y2="150" stroke="#f59e0b" stroke-opacity="0.7"/>
            </g>
            <g>
                <circle cx="130" cy="90" r="10" fill="#4f46e5" stroke="#a5b4fc" stroke-width="2"/>
                <circle cx="130" cy="150" r="11" fill="#d97706" stroke="#fcd34d" stroke-width="2"/>
                <circle cx="130" cy="210" r="10" fill="#4f46e5" stroke="#a5b4fc" stroke-width="2"/>
                <circle cx="300" cy="150" r="18" fill="#f59e0b" fill-opacity="0.85" stroke="#fef3c7" stroke-width="2.5"/>
                <circle cx="470" cy="90" r="10" fill="#4f46e5" stroke="#a5b4fc" stroke-width="2"/>
                <circle cx="470" cy="150" r="11" fill="#d97706" stroke="#fcd34d" stroke-width="2"/>
                <circle cx="470" cy="210" r="10" fill="#4f46e5" stroke="#a5b4fc" stroke-width="2"/>
            </g>`;
    } else if (cat === 'Cloud/DevOps') {
        graphic = `
            <rect width="600" height="300" fill="#0f172a"/>
            <ellipse cx="300" cy="155" rx="175" ry="52" fill="none" stroke="#60a5fa" stroke-opacity="0.4" stroke-width="1.5" transform="rotate(-10 300 155)"/>
            <ellipse cx="300" cy="155" rx="150" ry="42" fill="none" stroke="#818cf8" stroke-opacity="0.45" stroke-width="1.5" transform="rotate(12 300 155)"/>
            <path d="M225 182 H380 A36 36 0 0 0 385 110 A52 52 0 0 0 285 95 A42 42 0 0 0 225 182 Z" fill="#1e3a8a" fill-opacity="0.75" stroke="#7dd3fc" stroke-width="2"/>
            <circle cx="145" cy="130" r="4" fill="#38bdf8"/><circle cx="455" cy="175" r="4" fill="#818cf8"/>`;
    } else if (cat === 'セキュリティ') {
        graphic = `
            <rect width="600" height="300" fill="#0b1324"/>
            <g stroke="#10b981" stroke-opacity="0.18" stroke-width="1">
                <circle cx="300" cy="150" r="75" fill="none"/><circle cx="300" cy="150" r="115" fill="none"/>
                <line x1="140" y1="150" x2="460" y2="150"/><line x1="300" y1="25" x2="300" y2="275"/>
            </g>
            <path d="M300 68 L368 96 V148 C368 194 338 226 300 242 C262 226 232 194 232 148 V96 Z" fill="#064e3b" fill-opacity="0.75" stroke="#34d399" stroke-width="2.5"/>
            <rect x="284" y="142" width="32" height="26" rx="4" fill="#10b981" fill-opacity="0.3" stroke="#6ee7b7" stroke-width="2"/>
            <path d="M291 142 V132 A9 9 0 0 1 309 132 V142" fill="none" stroke="#6ee7b7" stroke-width="2"/>`;
    } else {
        graphic = `
            <rect width="600" height="300" fill="#111827"/>
            <g stroke="#a855f7" stroke-opacity="0.35" stroke-width="2" fill="none">
                <path d="M210 115 A60 60 0 0 0 210 185"/><path d="M190 98 A85 85 0 0 0 190 202"/>
                <path d="M390 115 A60 60 0 0 1 390 185"/><path d="M410 98 A85 85 0 0 1 410 202"/>
            </g>
            <rect x="252" y="54" width="96" height="192" rx="16" fill="#1e1b4b" stroke="#c084fc" stroke-width="2.5"/>
            <rect x="262" y="72" width="76" height="148" rx="8" fill="#0f172a" stroke="#818cf8" stroke-width="1"/>
            <rect x="286" y="61" width="28" height="4" rx="2" fill="#a855f7"/>
            <rect x="274" y="90" width="52" height="28" rx="4" fill="#6366f1" fill-opacity="0.45"/>
            <rect x="274" y="128" width="52" height="14" rx="3" fill="#38bdf8" fill-opacity="0.4"/>
            <rect x="274" y="150" width="36" height="14" rx="3" fill="#c084fc" fill-opacity="0.4"/>`;
    }

    return `data:image/svg+xml;utf8,${encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" width="600" height="300" viewBox="0 0 600 300">${graphic}</svg>`)}`;
}

function getCategoryImage(category) {
    return CATEGORY_IMAGES[category] || getSVGPlaceholder(category);
}
