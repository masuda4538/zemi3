// --- INLINE GLOSSARY & DICTIONARY MODAL ---
function injectInlineGlossary(text, enableLinks = true) {
    if (!text || !enableLinks) return text || "";
    let processedText = text;

    Object.keys(IT_DICTIONARY).forEach(term => {
        const regex = new RegExp(`(?<!<[^>]*)(${term})(?![^<]*>)`);
        const encodedTerm = encodeURIComponent(term);
        processedText = processedText.replace(
            regex,
            `<span onclick="openGlossaryModal(decodeURIComponent('${encodedTerm}'), event)" role="button" tabindex="0" class="cursor-pointer underline decoration-indigo-500 decoration-dotted underline-offset-4 text-indigo-600 dark:text-indigo-400 font-semibold hover:bg-indigo-100/60 dark:hover:bg-indigo-900/40 px-1 rounded transition-colors" title="用語辞書を表示: ${term}">$1</span>`
        );
    });
    return processedText;
}

function openGlossaryModal(term, event) {
    if (event) event.stopPropagation();
    const dictKey = Object.keys(IT_DICTIONARY).find(k => k.toLowerCase() === term.toLowerCase());
    const info = IT_DICTIONARY[dictKey] || {
        category: "IT Term",
        summary: `${term} に関するナレッジ情報`,
        detail: "この用語の詳細はローカルデータベースに登録可能です。"
    };
    document.getElementById('glossaryTerm').innerText = term;
    document.getElementById('glossaryCategory').innerText = info.category;
    document.getElementById('glossarySummary').innerText = info.summary;
    document.getElementById('glossaryDetail').innerText = info.detail;
    document.getElementById('glossaryModal').classList.remove('opacity-0', 'pointer-events-none');
    if (window.lucide) lucide.createIcons();
}

function closeGlossaryModal() {
    document.getElementById('glossaryModal').classList.add('opacity-0', 'pointer-events-none');
}
