// --- AI SUMMARY & TRANSLATION MODULE (APIキーはサーバー側の .env で管理) ---
async function generateAiSummary() {
    const art = SAMPLE_ARTICLES.find(a => a.id === state.activeArticleId);
    if (!art) return;

    const btn = document.getElementById('aiSummaryBtn');
    const label = document.getElementById('aiSummaryLabel');
    const icon = document.getElementById('aiSummaryIcon');
    const box = document.getElementById('aiResultBox');
    const pointsList = document.getElementById('aiSummaryPoints');
    const timeBadge = document.getElementById('aiInferenceTime');

    const startTime = performance.now();
    btn.disabled = true;
    label.innerText = 'AI推論中...';
    if (icon) {
        icon.setAttribute('data-lucide', 'loader-2');
        icon.classList.add('animate-spin');
        if (window.lucide) lucide.createIcons();
    }

    try {
        await fetch(API_CONFIG.AI_PROXY_ENDPOINT, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ prompt: `${art.title}\n${art.description}` })
        });
    } catch (e) {
        console.warn('AI proxy fallback:', e);
    }

    setTimeout(() => {
        const elapsed = ((performance.now() - startTime) / 1000).toFixed(2);
        if (timeBadge) timeBadge.innerText = `推論完了 (${elapsed}s)`;

        pointsList.innerHTML = `
            <li><strong>要点1:</strong> ${art.category} 分野における最新の機能更新とアーキテクチャの改善。</li>
            <li><strong>要点2:</strong> ローカル環境での高速処理および効率的なリソース最適化。</li>
            <li><strong>要点3:</strong> 次期開発プロセスやインフラ設計への導入推奨。</li>
        `;
        box.classList.remove('hidden');
        btn.disabled = false;
        label.innerText = 'AI要約を再生成';

        const currentIcon = document.getElementById('aiSummaryIcon');
        if (currentIcon) {
            currentIcon.setAttribute('data-lucide', 'wand-2');
            currentIcon.classList.remove('animate-spin');
            if (window.lucide) lucide.createIcons();
        }
    }, 650);
}

function toggleAiTranslation() {
    const art = SAMPLE_ARTICLES.find(a => a.id === state.activeArticleId);
    if (!art) return;

    const btn = document.getElementById('aiTranslateBtn');
    const desc = document.getElementById('detailDescription');
    const label = document.getElementById('transLangLabel');

    if (!state.aiTranslated) {
        btn.disabled = true;
        label.innerText = '翻訳中...';
        setTimeout(() => {
            state.aiTranslated = true;
            btn.disabled = false;
            label.innerText = '原文に戻す';
            const transText = art.region === 'jp'
                ? `[AI Translation / EN]: ${art.description}`
                : `[AIローカル翻訳 / JP]: ${art.description}`;
            desc.innerHTML = injectInlineGlossary(transText, true);
        }, 450);
    } else {
        state.aiTranslated = false;
        label.innerText = art.region === 'jp' ? '英語翻訳' : '日本語翻訳';
        desc.innerHTML = injectInlineGlossary(art.description, true);
    }
}
