import { GNEWS_CONFIG } from './config.js';

const API_KEY_STORAGE_KEY = 'techfeed_gnews_api_key';
const CACHE_STORAGE_KEY = 'techfeed_gnews_free_cache_v1';
const QUOTA_STORAGE_KEY = 'techfeed_gnews_daily_quota_v1';

let lastRequestTimestamp = 0;

export function getGNewsApiKey() {
    try {
        return localStorage.getItem(API_KEY_STORAGE_KEY)?.trim() || '';
    } catch {
        return '';
    }
}

export function setGNewsApiKey(apiKey) {
    const trimmed = (apiKey || '').trim();
    try {
        if (trimmed) {
            localStorage.setItem(API_KEY_STORAGE_KEY, trimmed);
        } else {
            localStorage.removeItem(API_KEY_STORAGE_KEY);
        }
    } catch (err) {
        console.warn('APIキー保存エラー:', err);
    }
    return trimmed;
}

function getTodayUtcKey() {
    return new Date().toISOString().slice(0, 10);
}

export function getDailyUsageInfo() {
    try {
        const raw = localStorage.getItem(QUOTA_STORAGE_KEY);
        const today = getTodayUtcKey();
        if (!raw) return { date: today, count: 0, limit: GNEWS_CONFIG.dailyRequestLimit };
        const parsed = JSON.parse(raw);
        if (parsed.date !== today) {
            return { date: today, count: 0, limit: GNEWS_CONFIG.dailyRequestLimit };
        }
        return { date: today, count: parsed.count || 0, limit: GNEWS_CONFIG.dailyRequestLimit };
    } catch {
        return { date: getTodayUtcKey(), count: 0, limit: GNEWS_CONFIG.dailyRequestLimit };
    }
}

function incrementDailyUsage() {
    const info = getDailyUsageInfo();
    const next = { date: info.date, count: info.count + 1 };
    try {
        localStorage.setItem(QUOTA_STORAGE_KEY, JSON.stringify(next));
    } catch {
        // 無視
    }
    return { ...next, limit: GNEWS_CONFIG.dailyRequestLimit };
}

function readCache(cacheKey) {
    try {
        const raw = localStorage.getItem(CACHE_STORAGE_KEY);
        if (!raw) return null;
        const store = JSON.parse(raw);
        const entry = store[cacheKey];
        if (!entry) return null;
        if (Date.now() - entry.savedAt > GNEWS_CONFIG.cacheTtlMs) return null;
        return entry.articles;
    } catch {
        return null;
    }
}

function writeCache(cacheKey, articles) {
    try {
        const raw = localStorage.getItem(CACHE_STORAGE_KEY);
        const store = raw ? JSON.parse(raw) : {};
        store[cacheKey] = { savedAt: Date.now(), articles };
        localStorage.setItem(CACHE_STORAGE_KEY, JSON.stringify(store));
    } catch {
        // 無視
    }
}

function inferCategory(text = '') {
    const lower = text.toLowerCase();
    if (lower.includes('ai') || lower.includes('llm') || lower.includes('生成ai') || lower.includes('gpt')) return 'AI/LLM';
    if (lower.includes('react') || lower.includes('css') || lower.includes('frontend') || lower.includes('フロントエンド')) return 'Frontend';
    if (lower.includes('rust') || lower.includes('node') || lower.includes('api') || lower.includes('backend')) return 'Backend';
    if (lower.includes('kubernetes') || lower.includes('k8s') || lower.includes('aws') || lower.includes('cloud') || lower.includes('docker')) return 'Cloud/DevOps';
    if (lower.includes('security') || lower.includes('sbom') || lower.includes('脆弱性') || lower.includes('セキュリティ')) return 'Security';
    if (lower.includes('android') || lower.includes('ios') || lower.includes('mobile') || lower.includes('tauri')) return 'Mobile';
    return 'AI/LLM';
}

export async function fetchGNewsArticles({ region = 'jp', query = '', forceRefresh = false } = {}) {
    const key = getGNewsApiKey();
    if (!key) {
        throw new Error('GNews APIキーが未設定です。右上のアカウントアイコンから「APIキーを入力」してください。');
    }

    const trimmedQuery = (query || '').trim().slice(0, 180);
    const cacheKey = `${region}:${trimmedQuery || '__tech_headlines__'}`;

    if (!forceRefresh) {
        const cached = readCache(cacheKey);
        if (cached) {
            return { articles: cached, fromCache: true, usage: getDailyUsageInfo() };
        }
    }

    const usage = getDailyUsageInfo();
    if (usage.count >= usage.limit) {
        throw new Error(`本日の無料枠上限（${usage.limit}回/日）に達しました。`);
    }

    const now = Date.now();
    if (now - lastRequestTimestamp < GNEWS_CONFIG.cooldownMs) {
        throw new Error('無料枠のレート制限保護のため、少し待ってから再実行してください。');
    }
    lastRequestTimestamp = now;

    const isJP = region === 'jp';
    const params = new URLSearchParams({
        lang: isJP ? 'ja' : 'en',
        country: isJP ? 'jp' : 'us',
        max: String(GNEWS_CONFIG.maxResults),
        apikey: key
    });

    let endpoint = GNEWS_CONFIG.topHeadlinesEndpoint;
    if (trimmedQuery) {
        endpoint = GNEWS_CONFIG.searchEndpoint;
        params.set('q', trimmedQuery);
    } else {
        params.set('category', 'technology');
    }

    const response = await fetch(`${endpoint}?${params.toString()}`);

    if (!response.ok) {
        if (response.status === 401) throw new Error('APIキーが無効です。「APIキーを入力」欄のキーを確認してください。');
        if (response.status === 403 || response.status === 429) throw new Error('GNews無料枠のリクエスト上限に達しました。');
        throw new Error(`GNews API エラー (HTTP ${response.status})`);
    }

    const updatedUsage = incrementDailyUsage();
    const data = await response.json();
    const rawArticles = Array.isArray(data.articles) ? data.articles : [];

    const normalized = rawArticles.map((item, idx) => {
        const combinedText = `${item.title || ''} ${item.description || ''}`;
        const uniqueSourceId = btoa(unescape(encodeURIComponent(item.url || `${region}-${idx}-${Date.now()}`))).slice(0, 16);

        return {
            id: `gnews-${region}-${uniqueSourceId}`,
            region,
            category: inferCategory(combinedText),
            title: item.title || 'タイトルなし',
            description: item.description || item.content || '概要はありません。',
            source: item.source?.name || 'GNews',
            url: item.url || '#',
            image: item.image || null,
            date: item.publishedAt || new Date().toISOString(),
            isTrending: idx < 2,
            viewsCount: Math.max(300, (rawArticles.length - idx) * 280 + 400)
        };
    });

    writeCache(cacheKey, normalized);
    return { articles: normalized, fromCache: false, usage: updatedUsage };
}