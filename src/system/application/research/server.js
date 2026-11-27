const http = require('http');
const fs = require('fs');
const path = require('path');

// .env ファイルを読み込む（外部パッケージ不要）
function loadEnv(envPath) {
    if (!fs.existsSync(envPath)) return;
    const lines = fs.readFileSync(envPath, 'utf-8').split(/\r?\n/);
    for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed || trimmed.startsWith('#')) continue;
        const eqIdx = trimmed.indexOf('=');
        if (eqIdx === -1) continue;
        const key = trimmed.slice(0, eqIdx).trim();
        let val = trimmed.slice(eqIdx + 1).trim();
        if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
            val = val.slice(1, -1);
        }
        if (!(key in process.env)) process.env[key] = val;
    }
}

loadEnv(path.join(__dirname, '.env'));

const PORT = Number(process.env.PORT) || 3000;
const GNEWS_API_KEY = process.env.GNEWS_API_KEY || 'APIキーを入力';
const AI_API_KEY = process.env.AI_API_KEY || 'APIキーを入力';
const AI_ENDPOINT = process.env.AI_ENDPOINT || 'https://api.example.com/v1/chat/completions';
const PUBLIC_DIR = path.join(__dirname, 'public');

const MIME_TYPES = {
    '.html': 'text/html; charset=utf-8',
    '.css': 'text/css; charset=utf-8',
    '.js': 'application/javascript; charset=utf-8',
    '.json': 'application/json; charset=utf-8',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.svg': 'image/svg+xml'
};

function sendJson(res, statusCode, payload) {
    res.writeHead(statusCode, { 'Content-Type': 'application/json; charset=utf-8' });
    res.end(JSON.stringify(payload));
}

function readJsonBody(req) {
    return new Promise((resolve, reject) => {
        let body = '';
        req.on('data', chunk => {
            body += chunk;
            if (body.length > 1e6) req.destroy();
        });
        req.on('end', () => {
            try {
                resolve(body ? JSON.parse(body) : {});
            } catch (e) {
                reject(e);
            }
        });
    });
}

const server = http.createServer(async (req, res) => {
    const reqUrl = new URL(req.url, `http://localhost:${PORT}`);

    // 1. GNews API プロキシ（APIキーをブラウザに露出させない）
    if (req.method === 'GET' && reqUrl.pathname === '/api/news') {
        if (!GNEWS_API_KEY || GNEWS_API_KEY === 'APIキーを入力') {
            return sendJson(res, 400, { error: 'GNEWS_API_KEY_NOT_SET', message: '.env に GNEWS_API_KEY を設定してください' });
        }

        const region = reqUrl.searchParams.get('region') === 'global' ? 'global' : 'jp';
        const params = new URLSearchParams({
            category: 'technology',
            lang: region === 'jp' ? 'ja' : 'en',
            max: '10',
            apikey: GNEWS_API_KEY
        });
        if (region === 'jp') params.set('country', 'jp');

        try {
            const apiRes = await fetch(`https://gnews.io/api/v4/top-headlines?${params.toString()}`);
            const data = await apiRes.json();
            return sendJson(res, apiRes.status, data);
        } catch (err) {
            return sendJson(res, 502, { error: 'UPSTREAM_ERROR', message: 'GNews APIへの接続に失敗しました' });
        }
    }

    // 2. AI要約プロキシ（APIキーをサーバー側でのみ使用）
    if (req.method === 'POST' && reqUrl.pathname === '/api/ai/summary') {
        if (!AI_API_KEY || AI_API_KEY === 'APIキーを入力') {
            return sendJson(res, 200, { mode: 'local_fallback' });
        }
        try {
            const body = await readJsonBody(req);
            const apiRes = await fetch(AI_ENDPOINT, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${AI_API_KEY}`
                },
                body: JSON.stringify({ prompt: body.prompt || '' })
            });
            const data = await apiRes.json();
            return sendJson(res, apiRes.status, data);
        } catch (err) {
            return sendJson(res, 200, { mode: 'local_fallback' });
        }
    }

    // 3. 静的ファイル配信（ルートの index.html と public/ 配下のみ公開し、.env や server.js へのアクセスを遮断）
    if (reqUrl.pathname === '/' || reqUrl.pathname === '/index.html') {
        return fs.readFile(path.join(__dirname, 'index.html'), (err, content) => {
            if (err) {
                res.writeHead(404);
                return res.end('Not Found');
            }
            res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
            res.end(content);
        });
    }

    let safePath = reqUrl.pathname.startsWith('/public/')
        ? reqUrl.pathname.slice('/public'.length)
        : reqUrl.pathname;
    const resolvedPath = path.normalize(path.join(PUBLIC_DIR, safePath));
    if (!resolvedPath.startsWith(PUBLIC_DIR)) {
        res.writeHead(403);
        return res.end('Forbidden');
    }

    fs.readFile(resolvedPath, (err, content) => {
        if (err) {
            res.writeHead(404);
            return res.end('Not Found');
        }
        const ext = path.extname(resolvedPath).toLowerCase();
        res.writeHead(200, { 'Content-Type': MIME_TYPES[ext] || 'application/octet-stream' });
        res.end(content);
    });
});

server.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
});
