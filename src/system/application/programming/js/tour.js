// ===================================================================
// 使い方ガイドツアー制御
// ===================================================================

let currentTourIndex = 0;

function startTour() {
    currentTourIndex = 0;
    document.getElementById('tourBackdrop').classList.remove('hidden');
    document.getElementById('tourCard').classList.remove('hidden');
    renderTourStep();
}

function renderTourStep() {
    const step = tourSteps[currentTourIndex];
    const currentView = getCurrentVisibleView();

    if (step.view) {
        if (step.view === 'editor-task' && currentView !== 'editor-task') {
            selectTask(lastWorkedTaskId, false);
        } else if (step.view !== currentView) {
            switchView(step.view, false);
        }
    }

    setTimeout(() => {
        const targetEl = document.querySelector(step.target);
        const card = document.getElementById('tourCard');

        document.getElementById('tourStepBadge').innerText = `Step ${currentTourIndex + 1}/${tourSteps.length}`;
        document.getElementById('tourTitle').innerHTML = step.title;
        document.getElementById('tourText').innerText = step.text;

        document.getElementById('tourPrevBtn').style.visibility = (currentTourIndex === 0) ? 'hidden' : 'visible';
        document.getElementById('tourNextBtn').innerText = (currentTourIndex === tourSteps.length - 1) ? 'ツアーを完了する' : '次へ ▶';

        document.querySelectorAll('.tour-highlight').forEach(el => {
            el.classList.remove('tour-highlight');
        });

        if (targetEl) {
            targetEl.classList.add('tour-highlight');
            targetEl.scrollIntoView({ behavior: 'smooth', block: 'nearest' });

            const rect = targetEl.getBoundingClientRect();
            const cardWidth = 320;
            const cardHeight = card.offsetHeight || 180;

            let top = 0;
            let left = 0;

            if (step.target === '#codeEditor') {
                top = rect.top + 24;
                left = rect.right - cardWidth - 24;
            } else if (step.target === '#tour-run-btn') {
                top = rect.bottom + 14;
                left = rect.left - 40;
            } else if (step.target === '#consoleBody') {
                top = rect.top - cardHeight - 16;
                left = rect.left + 24;
            } else if (step.target.startsWith('#nav-')) {
                top = rect.top - 10;
                left = rect.right + 18;
            } else {
                top = rect.bottom + 12;
                left = rect.left;
                if (top + cardHeight > window.innerHeight) {
                    top = rect.top - cardHeight - 12;
                }
            }

            if (left + cardWidth > window.innerWidth - 16) left = window.innerWidth - cardWidth - 16;
            if (left < 16) left = 16;
            if (top < 16) top = 16;
            if (top + cardHeight > window.innerHeight - 16) top = window.innerHeight - cardHeight - 16;

            card.style.top = `${top}px`;
            card.style.left = `${left}px`;
        }

        if (window.lucide) lucide.createIcons();
    }, 150);
}

function nextTourStep() {
    if (currentTourIndex < tourSteps.length - 1) {
        currentTourIndex++;
        renderTourStep();
    } else {
        endTour();
    }
}

function prevTourStep() {
    if (currentTourIndex > 0) {
        currentTourIndex--;
        renderTourStep();
    }
}

function endTour() {
    document.getElementById('tourBackdrop').classList.add('hidden');
    document.getElementById('tourCard').classList.add('hidden');
    document.querySelectorAll('.tour-highlight').forEach(el => {
        el.classList.remove('tour-highlight');
    });
    try {
        localStorage.setItem('codelab_tour_done', 'true');
    } catch (e) {}
}