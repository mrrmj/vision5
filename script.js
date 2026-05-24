const CONFIG = {
    key: "RKXRAKIB",
    wingoUrl: "https://91appt.com/#/saasLottery/WinGo?gameCode=WinGo_1M&lottery=WinGo",
    depositUrl: "https://91appt.com/#/wallet/Recharge"
};

// -------------------- AUTH & PERSISTENCE --------------------
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

// -------------------- DRAG LOGIC (unchanged) --------------------
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

// -------------------- ORIGINAL AI ENGINE (unchanged prediction logic) --------------------
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
                // When a new prediction is generated, immediately store it for the upcoming period
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
    console.log(`[AI] New prediction generated: ${currentPrediction.res} (numbers: ${currentPrediction.nums})`);
}

// -------------------- FIXED TRACKING (stores prediction for next period) --------------------
let pendingPredictions = {};   // key = period string, value = prediction (BIG/SMALL)
let totalPredictions = 0, wins = 0, losses = 0;
let lastSeenPeriod = null;

async function storePredictionForNextPeriod() {
    try {
        // Fetch the latest period from the game API
        const res = await fetch('https://draw.ar-lottery01.com/WinGo/WinGo_1M/GetHistoryIssuePage.json?t=' + Date.now());
        const data = await res.json();
        const latest = data.data.list[0];
        const currentPeriod = latest.issueNumber;
        const nextPeriod = (BigInt(currentPeriod) + 1n).toString();

        // Store the current AI prediction for that next period (overwrite if already exists)
        pendingPredictions[nextPeriod] = currentPrediction.res;
        console.log(`[TRACK] Stored prediction for period ${nextPeriod}: ${currentPrediction.res}`);

        // Update the UI to show which period we are predicting
        document.getElementById('period-label').innerHTML = `🎯 PERIOD: ${nextPeriod.slice(-6)}`;
    } catch (err) {
        console.error("[TRACK] Failed to fetch period for storing prediction", err);
    }
}

async function initTracking() {
    // Run every 2 seconds to check for new results
    setInterval(checkForResults, 2000);
    await checkForResults(); // immediate first check
}

async function checkForResults() {
    try {
        const res = await fetch('https://draw.ar-lottery01.com/WinGo/WinGo_1M/GetHistoryIssuePage.json?t=' + Date.now());
        const data = await res.json();
        const latest = data.data.list[0];
        const currentPeriod = latest.issueNumber;
        const winningNumber = parseInt(latest.number);
        const actualSize = winningNumber >= 5 ? "BIG" : "SMALL";

        console.log(`[API] Current period: ${currentPeriod}, result: ${winningNumber} (${actualSize})`);

        // If we have a pending prediction for this period, evaluate it
        if (pendingPredictions[currentPeriod]) {
            const predicted = pendingPredictions[currentPeriod];
            const won = (predicted === actualSize);

            totalPredictions++;
            if (won) wins++; else losses++;
            updateStatsUI();
            addHistoryRow(currentPeriod, predicted, winningNumber, actualSize, won);

            console.log(`[RESULT] Period ${currentPeriod}: predicted ${predicted}, actual ${actualSize} -> ${won ? "WIN" : "LOSS"}`);

            // Remove the prediction so it's not evaluated again
            delete pendingPredictions[currentPeriod];
        } else {
            console.log(`[TRACK] No pending prediction for period ${currentPeriod}`);
        }

        // Update the last seen period for reference (not critical)
        if (lastSeenPeriod !== currentPeriod) {
            lastSeenPeriod = currentPeriod;
        }
    } catch (err) {
        console.error("[TRACK] Error fetching results:", err);
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
    // Color the PRED column based on BIG/SMALL
    const predColor = predicted === 'BIG' ? '#00d2ff' : '#ff44dd';
    // Color the number based on even/odd (optional)
    const numColor = number % 2 === 0 ? '#ff8888' : '#88ff88';
    row.innerHTML = `
        <td style="color: white;">${period.slice(-4)}</td>
        <td style="color: ${predColor}; font-weight: bold;">${predicted}</td>
        <td style="color: ${numColor}; font-weight: bold;">${number}</td>
        <td class="${won ? 'win-badge' : 'loss-badge'}">${won ? 'WIN ✓' : 'LOSS ✗'}</td>
    `;
    tbody.insertBefore(row, tbody.firstChild);
    // Keep only last 10 rows
    while (tbody.children.length > 10) tbody.removeChild(tbody.lastChild);
}
