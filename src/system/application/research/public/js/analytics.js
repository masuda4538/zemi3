// --- TREND ANALYTICS CHART ---
let trendChartInstance = null;

function initChart() {
    const canvas = document.getElementById('trendChartCanvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    trendChartInstance = new Chart(ctx, {
        type: 'line',
        data: {
            labels: ['11/07', '11/08', '11/09', '11/10', '11/11', '11/12', '11/13'],
            datasets: [
                { label: 'AI / LLM', data: [65, 72, 80, 85, 92, 110, 128], borderColor: '#3b82f6', backgroundColor: 'rgba(59, 130, 246, 0.08)', borderWidth: 2.5, tension: 0.3, fill: true },
                { label: 'React', data: [40, 42, 45, 50, 48, 55, 62], borderColor: '#06b6d4', borderWidth: 2, tension: 0.3 },
                { label: 'Rust', data: [20, 25, 28, 35, 42, 50, 58], borderColor: '#f59e0b', borderWidth: 2, tension: 0.3 },
                { label: 'Kubernetes', data: [30, 32, 31, 38, 40, 42, 45], borderColor: '#a855f7', borderWidth: 2, tension: 0.3 }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: { legend: { display: true, position: 'top', labels: { boxWidth: 12, font: { size: 11 } } } },
            scales: {
                x: { grid: { display: false }, ticks: { font: { size: 10 } } },
                y: { grid: { color: 'rgba(150, 150, 150, 0.1)' }, ticks: { font: { size: 10 } } }
            }
        }
    });
}
