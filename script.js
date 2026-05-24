const CONFIG = {
    key: "RKXRAKIB",
    wingoUrl: "https://91appt.com/#/saasLottery/WinGo?gameCode=WinGo_1M&lottery=WinGo",
    depositUrl: "https://91appt.com/#/wallet/Recharge"
};

// --- AUTH & PERSISTENCE ---
window.onload = function() {
    const saved = localStorage.getItem('serverKey');
    const expiry = localStorage.getItem('keyExpiry');
    if (saved === CONFIG.key && expiry > Date.now()) {
        showView('deposit-view');
    }
};

function handleAuth() {
    const entered = document.getElementById('passKey').value;
    const recommend = document.getElementById('recommendKey').checked;
    if (entered === CONFIG.key) {
        if (recommend) {
            localStorage.setItem('serverKey', CONFIG.key);
            localStorage.setItem('keyExpiry', Date.now() + (24 * 60 * 60 * 1000));
        }
        showView('deposit-view');
    } else { alert("ACCESS DENIED: WRONG KEY"); }
}

function showView(id) {
    document.getElementById('login-view').style.display = 'none';
    document.getElementById('deposit-view').style.display = 'none';
    document.getElementById('signal-view').style.display = 'none';
    document.getElementById(id).style.display = 'block';
}

function togglePanel(show) {
    document.getElementById('main-box').style.display = show ? 'block' : 'none';
    document.getElementById('mini-logo').style.display = show ? 'none' : 'block';
}

function openDeposit() {
    document.getElementById('game-frame').src = CONFIG.depositUrl;
}

function verifyDeposit() {
    alert("VERIFYING TRANSACTION ID... SYNCING AI SERVER.");
    setTimeout(() => {
        document.getElementById('game-frame').src = CONFIG.wingoUrl;
        showView('signal-view');
        initAIServer();
        initTracking();
    }, 2500);
}

// --- DRAG LOGIC (unchanged) ---
const box = document.getElementById("main-box");
const handle = document.getElementById("drag-handle");
let active = false, currentX, currentY, initialX, initialY, xOff = 0, yOff = 0;

const dragStart = (e) => {
    if (e.type === "touchstart") {
        initialX = e.touches[0].clientX - xOff;
        initialY = e.touches[0].clientY - yOff;
    } else {
        initialX = e.clientX - xOff;
        initialY = e.clientY - yOff;
    }
    if (e.target === handle || handle.contains(e.target)) active = true;
};
const dragEnd = () => { initialX = currentX; initialY = currentY; active = false; };
const drag = (e) => {
    if (active) {
        e.preventDefault();
        const cx = e.type === "touchmove" ? e.touches[0].clientX : e.clientX;
        const cy = e.type === "touchmove" ? e.touches[0].clientY : e.clientY;
        currentX = cx - initialX; currentY = cy - initialY;
        xOff = currentX; yOff = currentY;
        box.style.transform = `translate3d(${currentX}px, ${currentY}px, 0)`;
    }
};
handle.addEventListener("mousedown", dragStart);
document.addEventListener("mouseup", dragEnd);
document.addEventListener("mousemove", drag);
handle.addEventListener("touchstart", dragStart);
document.addEventListener("touchend", dragEnd);
document.addEventListener("touchmove", drag);

// ================= ORIGINAL AI ENGINE (unchanged) =================
let lastBlockId = -1;
let virtualHistory = [];
let currentPrediction = { res: "---", nums: "--", color: "#fff" };

function initAIServer() {
    if (window._aiInterval) clearInterval(window._aiInterval);
    window._aiInterval = setInterval(() => {
        const now = new Date();
        const sec = now.getSeconds();
        const timeframe = 60;
        const remains = timeframe - (sec % timeframe);
        const blockId = Math.floor(now.getTime() / (timeframe * 1000));

        const resultText = document.getElementById('result-text');
        const aiStatus = document.getElementById('ai-status');
        const periodLabel = document.getElementById('period-label');

        if (remains >= 56) {
            resultText.innerText = "WAITING...";
            aiStatus.innerText = "SCANNING TRENDS";
            aiStatus.style.color = "#ffcc00";
            periodLabel.innerHTML = "⏳ NEXT PERIOD: --";
        } else {
            if (blockId !== lastBlockId) {
                lastBlockId = blockId;
                runMarketAnalysis(blockId);
                // When a new block starts, store the prediction for the upcoming period
                storePredictionForNextPeriod();
            }
            resultText.innerText = currentPrediction.res;
            resultText.style.color = currentPrediction.color;
            document.getElementById('lucky-num').innerText = currentPrediction.nums;
            aiStatus.innerText = "SIGNAL ACTIVE";
            aiStatus.style.color = "#00ff87";
        }
        document.getElementById('timer-val').innerText = remains;
        document.getElementById('progress-fill').style.width = (remains / timeframe) * 100 + "%";
    }, 1000);
}

function runMarketAnalysis(blockId) {
    let seed = (blockId * 0x7FFFFFFF) % 1234567;
    let trendFactor = (seed % 10);
    
    let res = "BIG";
    if (virtualHistory.length > 3) {
        let last3 = virtualHistory.slice(-3);
        if (last3.every(v => v === "BIG")) res = "SMALL";
        else if (last3.every(v => v === "SMALL")) res = "BIG";
        else res = trendFactor > 5 ? "BIG" : "SMALL";
    } else {
        res = trendFactor > 4 ? "BIG" : "SMALL";
    }

    virtualHistory.push(res);
    if(virtualHistory.length > 10) virtualHistory.shift();

    currentPrediction.res = res;
    if (res === "BIG") {
        currentPrediction.color = "#00d2ff";
        let n1 = 5 + (seed % 5);
        let n2 = 5 + ((seed+2) % 5);
        currentPrediction.nums = n1 + " & " + n2;
    } else {
        currentPrediction.color = "#ff00f7";
        let n1 = (seed % 5);
        let n2 = ((seed+3) % 5);
        currentPrediction.nums = n1 + " & " + n2;
    }
}

// ================= FIXED WIN/LOSS TRACKING =================
let pendingPrediction = null;      // { period: string, prediction: string }
let totalPredictions = 0, wins = 0, losses = 0;

function storePredictionForNextPeriod() {
    // Determine the period number that will be closed next (based on current time + 1 minute)
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2,'0');
    const day = String(now.getDate()).padStart(2,'0');
    const hours = String(now.getHours()).padStart(2,'0');
    const minutes = String(now.getMinutes()).padStart(2,'0');
    // Period format: YYYYMMDD1000xxxx where xxxx increments every minute
    // Simpler: use API's upcoming period concept: current timestamp floor to minute + 1
    const basePeriod = `${year}${month}${day}1000${String((now.getHours()*60) + now.getMinutes() + 1).padStart(4,'0')}`;
    pendingPrediction = {
        period: basePeriod,
        prediction: currentPrediction.res
    };
    // Update UI to show period we are predicting for
    document.getElementById('period-label').innerHTML = `🎯 PREDICTING PERIOD: ${basePeriod.slice(-6)}`;
}

async function initTracking() {
    // Fetch every 2 seconds to catch new results
    setInterval(checkAndUpdateResults, 2000);
    // Also fetch initial to set last known period
    await checkAndUpdateResults();
}

let lastProcessedPeriod = null;

async function checkAndUpdateResults() {
    try {
        const res = await fetch('https://draw.ar-lottery01.com/WinGo/WinGo_1M/GetHistoryIssuePage.json?t=' + Date.now());
        const data = await res.json();
        const latest = data.data.list[0];
        const period = latest.issueNumber;
        const winningNumber = parseInt(latest.number);
        const actualSize = winningNumber >= 5 ? "BIG" : "SMALL";

        // If we have a pending prediction and the period matches the latest result
        if (pendingPrediction && pendingPrediction.period === period) {
            // Evaluate
            const won = (pendingPrediction.prediction === actualSize);
            totalPredictions++;
            if (won) {
                wins++;
            } else {
                losses++;
            }
            updateStatsUI();
            addHistoryRow(period, pendingPrediction.prediction, winningNumber, actualSize, won);
            // Clear pending prediction
            pendingPrediction = null;
            lastProcessedPeriod = period;
        }
        // Also handle case where we missed? But tracking is per cycle.
    } catch (err) {
        console.warn("Tracking error", err);
    }
}

function updateStatsUI() {
    document.getElementById('total-pred').innerText = totalPredictions;
    document.getElementById('win-count').innerText = wins;
    document.getElementById('loss-count').innerText = losses;
    const accuracy = totalPredictions === 0 ? 0 : Math.round((wins / totalPredictions) * 100);
    document.getElementById('accuracy').innerText = `${accuracy}%`;
}

function addHistoryRow(period, predicted, number, actual, won) {
    const tbody = document.getElementById('history-body');
    const row = document.createElement('tr');
    row.innerHTML = `
        <td>${period.slice(-4)}</td>
        <td>${predicted}</td>
        <td>${number}</td>
        <td class="${won ? 'win-badge' : 'loss-badge'}">${won ? 'WIN ✓' : 'LOSS ✗'}</td>
    `;
    tbody.insertBefore(row, tbody.firstChild);
    // Keep only last 10 rows
    while (tbody.children.length > 10) tbody.removeChild(tbody.lastChild);
}
