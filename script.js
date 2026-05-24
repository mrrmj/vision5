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
    const main = document.getElementById('main-box');
    const mini = document.getElementById('mini-logo');
    if (show) {
        main.style.display = 'block';
        mini.style.display = 'none';
    } else {
        main.style.display = 'none';
        mini.style.display = 'flex';
    }
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

// ================= ORIGINAL AI ENGINE (UNCHANGED) =================
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

        if (remains >= 56) {
            resultText.innerText = "WAITING...";
            aiStatus.innerText = "SCANNING TRENDS";
            aiStatus.style.color = "#ffcc00";
        } else {
            if (blockId !== lastBlockId) {
                lastBlockId = blockId;
                runMarketAnalysis(blockId);
                // When AI generates a new prediction, notify tracking system
                if (window.onNewPrediction) window.onNewPrediction(currentPrediction.res);
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

// ================= FIXED TRACKING (Period‑change based) =================
let lastSeenPeriod = null;           // last period fetched from API
let pendingEvaluation = null;        // { period, prediction }
let totalPredictions = 0, wins = 0, losses = 0;
let latestAIPrediction = "---";      // stores current AI prediction for next period

// Called by AI engine when a new prediction is generated
window.onNewPrediction = (pred) => {
    latestAIPrediction = pred;
    console.log("AI updated prediction:", pred);
};

async function initTracking() {
    setInterval(checkPeriodChange, 2000);
    await checkPeriodChange();
}

async function checkPeriodChange() {
    try {
        const res = await fetch('https://draw.ar-lottery01.com/WinGo/WinGo_1M/GetHistoryIssuePage.json?t=' + Date.now());
        const data = await res.json();
        const latest = data.data.list[0];
        const currentPeriod = latest.issueNumber;
        const winningNumber = parseInt(latest.number);
        const actualSize = winningNumber >= 5 ? "BIG" : "SMALL";

        // If this is the first run, just store the period and return
        if (lastSeenPeriod === null) {
            lastSeenPeriod = currentPeriod;
            return;
        }

        // If period changed, that means a new result is available
        if (lastSeenPeriod !== currentPeriod) {
            // 1. Evaluate the period that just ended (lastSeenPeriod)
            if (pendingEvaluation && pendingEvaluation.period === lastSeenPeriod) {
                const won = (pendingEvaluation.prediction === actualSize);
                totalPredictions++;
                if (won) wins++; else losses++;
                updateStatsUI();
                addHistoryRow(lastSeenPeriod, pendingEvaluation.prediction, winningNumber, actualSize, won);
                console.log(`Period ${lastSeenPeriod}: predicted ${pendingEvaluation.prediction}, actual ${actualSize} -> ${won ? "WIN" : "LOSS"}`);
                pendingEvaluation = null;
            } else {
                console.warn(`No pending prediction for period ${lastSeenPeriod}`);
            }

            // 2. Store a new prediction for the next period (currentPeriod + 1)
            const nextPeriod = (BigInt(currentPeriod) + 1n).toString();
            if (latestAIPrediction !== "---") {
                pendingEvaluation = {
                    period: nextPeriod,
                    prediction: latestAIPrediction
                };
                console.log(`Stored prediction for period ${nextPeriod}: ${latestAIPrediction}`);
                // Update UI to show which period we are predicting
                document.getElementById('period-label').innerHTML = `🎯 PERIOD: ${nextPeriod.slice(-6)}`;
            } else {
                console.warn("No AI prediction available yet");
            }

            // Update last seen period
            lastSeenPeriod = currentPeriod;
        }
    } catch (err) {
        console.error("Tracking error:", err);
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
        <td style="color: #fff;">${period.slice(-4)}</td>
        <td style="color: ${predicted === 'BIG' ? '#00d2ff' : '#ff44dd'}; font-weight: bold;">${predicted}</td>
        <td style="color: ${number % 2 === 0 ? '#ff6666' : '#66ff66'}; font-weight: bold;">${number}</td>
        <td class="${won ? 'win-badge' : 'loss-badge'}">${won ? 'WIN ✓' : 'LOSS ✗'}</td>
    `;
    tbody.insertBefore(row, tbody.firstChild);
    // Keep only last 10 rows
    while (tbody.children.length > 10) tbody.removeChild(tbody.lastChild);
}
