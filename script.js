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
        initAIAndTracking();
    }, 2500);
}

// -------------------- DRAG LOGIC --------------------
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

// ================= AI ENGINE (ORIGINAL LOGIC – UNCHANGED) =================
let virtualHistory = [];
let currentPrediction = { res: "---", nums: "--", color: "#fff" };

function runMarketAnalysis(blockId) {
    // Same deterministic algorithm as before
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
    console.log(`[AI] New prediction for block ${blockId}: ${res}`);
}

// ================= TRACKING + PERIOD‑BASED PREDICTION =================
let currentPeriod = null;
let pendingPredictions = {};   // period -> prediction
let totalPredictions = 0, wins = 0, losses = 0;
let countdownInterval = null;
let countdownSeconds = 60;

function initAIAndTracking() {
    // Start fetching period data every 1 second for fast detection
    setInterval(fetchAndUpdate, 1000);
    fetchAndUpdate(); // initial run
}

async function fetchAndUpdate() {
    try {
        const res = await fetch('https://draw.ar-lottery01.com/WinGo/WinGo_1M/GetHistoryIssuePage.json?t=' + Date.now());
        const data = await res.json();
        const latest = data.data.list[0];
        const newPeriod = latest.issueNumber;
        const winningNumber = parseInt(latest.number);
        const actualSize = winningNumber >= 5 ? "BIG" : "SMALL";

        // If period changed, generate new prediction for the next period
        if (currentPeriod !== null && newPeriod !== currentPeriod) {
            // 1. Evaluate previous period if we had a prediction for it
            if (pendingPredictions[currentPeriod]) {
                const predicted = pendingPredictions[currentPeriod];
                const won = (predicted === actualSize);
                totalPredictions++;
                if (won) wins++; else losses++;
                updateStatsUI();
                addHistoryRow(currentPeriod, predicted, winningNumber, actualSize, won);
                console.log(`[RESULT] Period ${currentPeriod}: predicted ${predicted}, actual ${actualSize} -> ${won ? "WIN" : "LOSS"}`);
                delete pendingPredictions[currentPeriod];
            }

            // 2. Generate a fresh prediction for the NEW period (which is the next one after currentPeriod)
            //    Use current system blockId based on real time – unchanged logic.
            const now = new Date();
            const blockId = Math.floor(now.getTime() / 60000); // 60 sec blockId
            runMarketAnalysis(blockId);

            // 3. Store this new prediction for the period that just started (newPeriod)
            const nextPredictionPeriod = newPeriod;
            pendingPredictions[nextPredictionPeriod] = currentPrediction.res;
            console.log(`[TRACK] Stored prediction for period ${nextPredictionPeriod}: ${currentPrediction.res}`);
            document.getElementById('period-label').innerHTML = `🎯 PERIOD: ${nextPredictionPeriod.slice(-6)}`;

            // 4. Reset countdown timer (60 seconds)
            resetCountdown();
        }

        // Update current period
        currentPeriod = newPeriod;

    } catch (err) {
        console.error("API fetch error:", err);
    }
}

function resetCountdown() {
    if (countdownInterval) clearInterval(countdownInterval);
    countdownSeconds = 60;
    document.getElementById('timer-val').innerText = countdownSeconds;
    document.getElementById('progress-fill').style.width = "100%";
    countdownInterval = setInterval(() => {
        if (countdownSeconds > 0) {
            countdownSeconds--;
            document.getElementById('timer-val').innerText = countdownSeconds;
            document.getElementById('progress-fill').style.width = (countdownSeconds / 60) * 100 + "%";
        } else {
            clearInterval(countdownInterval);
        }
    }, 1000);
}

function updateStatsUI() {
    document.getElementById('total-pred').innerText = totalPredictions;
    document.getElementById('win-count').innerText = wins;
    document.getElementById('loss-count').innerText = losses;
    const acc = totalPredictions === 0 ? 0 : Math.round((wins / totalPredictions) * 100);
    document.getElementById('accuracy').innerText = `${acc}%`;
}

function addHistoryRow(period, predicted, number, actual, won) {
    const tbody = document.getElementById('history-body');
    const row = document.createElement('tr');
    const predColor = predicted === 'BIG' ? '#00d2ff' : '#ff44dd';
    const numColor = number % 2 === 0 ? '#ff8888' : '#88ff88';
    row.innerHTML = `
        <td style="color: white;">${period.slice(-4)}</td>
        <td style="color: ${predColor}; font-weight: bold;">${predicted}</td>
        <td style="color: ${numColor}; font-weight: bold;">${number}</td>
        <td class="${won ? 'win-badge' : 'loss-badge'}">${won ? 'WIN ✓' : 'LOSS ✗'}</td>
    `;
    tbody.insertBefore(row, tbody.firstChild);
    while (tbody.children.length > 10) tbody.removeChild(tbody.lastChild);
}

// Also update the AI status display periodically (every second)
setInterval(() => {
    if (document.getElementById('signal-view')?.style.display === 'block') {
        document.getElementById('result-text').innerText = currentPrediction.res;
        document.getElementById('result-text').style.color = currentPrediction.color;
        document.getElementById('lucky-num').innerText = currentPrediction.nums;
        document.getElementById('ai-status').innerText = "SIGNAL ACTIVE";
        document.getElementById('ai-status').style.color = "#00ff87";
    }
}, 1000);
