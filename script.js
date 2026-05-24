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
        initTracking();   // start tracking after AI is ready
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
        const timeframe = 60;                // 1 minute
        const remains = timeframe - (sec % timeframe);
        const blockId = Math.floor(now.getTime() / (timeframe * 1000));

        const resultText = document.getElementById('result-text');
        const aiStatus = document.getElementById('ai-status');
        const periodLabel = document.getElementById('period-label');

        if (remains >= 56) {                 // waiting phase (last 4 sec)
            resultText.innerText = "WAITING...";
            aiStatus.innerText = "SERVER: SCANNING TRENDS...";
            aiStatus.style.color = "#ffcc00";
            periodLabel.innerText = "SYNCING 91APP";
        } else {
            if (blockId !== lastBlockId) {
                lastBlockId = blockId;
                runMarketAnalysis(blockId);
            }
            resultText.innerText = currentPrediction.res;
            resultText.style.color = currentPrediction.color;
            document.getElementById('lucky-num').innerText = currentPrediction.nums;
            aiStatus.innerText = "SERVER: SIGNAL SYNCED";
            aiStatus.style.color = "#00ff87";
            periodLabel.innerText = "WINGO 1M AI SIGNAL";
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

// ================= WIN/LOSS TRACKING (new, non‑invasive) =================
let lastPeriodId = null;
let currentPredictionForPeriod = null;   // stores prediction for the current period
let winCount = 0, lossCount = 0, streak = 0;

function initTracking() {
    // Fetch every 2 seconds to detect new results
    setInterval(fetchGameResult, 2000);
    fetchGameResult();
}

async function fetchGameResult() {
    try {
        const response = await fetch('https://draw.ar-lottery01.com/WinGo/WinGo_1M/GetHistoryIssuePage.json?t=' + Date.now());
        const data = await response.json();
        const latest = data.data.list[0];
        const period = latest.issueNumber;
        const winningNumber = parseInt(latest.number);
        const actual = winningNumber >= 5 ? "BIG" : "SMALL";

        // If we have a prediction stored and period changed -> evaluate
        if (lastPeriodId !== null && lastPeriodId !== period && currentPredictionForPeriod !== null) {
            const won = (currentPredictionForPeriod === actual);
            if (won) {
                winCount++;
                streak = streak > 0 ? streak + 1 : 1;
            } else {
                lossCount++;
                streak = streak < 0 ? streak - 1 : -1;
            }
            updateStatsUI();
            addHistoryRow(lastPeriodId, currentPredictionForPeriod, winningNumber, actual, won);
        }

        // Update for next period: store prediction for the current period (the one that will end next)
        if (lastPeriodId !== period) {
            lastPeriodId = period;
            // Get the current AI prediction (live from the engine)
            currentPredictionForPeriod = currentPrediction.res;
            // Also update the period label in UI (optional)
            const nextPeriod = (BigInt(period) + 1n).toString();
            document.getElementById('period-label').innerHTML = `PERIOD: ${nextPeriod.slice(-6)}`;
        }
    } catch (err) {
        console.warn("Tracking fetch error:", err);
    }
}

function updateStatsUI() {
    document.getElementById('win-count').innerText = winCount;
    document.getElementById('loss-count').innerText = lossCount;
    document.getElementById('streak-count').innerText = streak;
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
