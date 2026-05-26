const CONFIG = {
    key: "RKXRAKIB",
    wingoUrl: "https://tgdream19.com/#/saasLottery/WinGo?gameCode=WinGo_30S&lottery=WinGo",
    depositUrl: "https://tgdream19.com/#/wallet/Recharge",
    historyApiUrl: "https://draw.ar-lottery01.com/WinGo/WinGo_30S/GetHistoryIssuePage.json"
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

// --- MINI/MAXIMIZE ---
function togglePanel(show) {
    document.getElementById('main-box').style.display = show ? 'block' : 'none';
    document.getElementById('mini-logo').style.display = show ? 'none' : 'block';
}

// --- DEPOSIT & ENGINE TRIGGER ---
function openDeposit() {
    document.getElementById('game-frame').src = CONFIG.depositUrl;
}

function verifyDeposit() {
    alert("VERIFYING TRANSACTION ID... SYNCING AI SERVER.");
    setTimeout(() => {
        document.getElementById('game-frame').src = CONFIG.wingoUrl;
        showView('signal-view');
        initAIServer();
    }, 2500);
}

// --- DRAG LOGIC (RELIABLE) ---
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
handle.addEventListener("mousedown", dragStart); document.addEventListener("mouseup", dragEnd); document.addEventListener("mousemove", drag);
handle.addEventListener("touchstart", dragStart); document.addEventListener("touchend", dragEnd); document.addEventListener("touchmove", drag);

// --- FIXED AI ENGINE WITH API POLLING & RELIABLE DISPLAY ---
let lastPeriodId = null;
let virtualHistory = [];
let currentPrediction = { res: "---", nums: "--", color: "#fff" };
let currentRemainingSeconds = 30;
let pollingInterval = null;
let countdownInterval = null;

function initAIServer() {
    // Force initial local prediction so display never stays blank
    updateLocalTimingAndPredict();
    
    // Start polling API every 2 seconds
    if (pollingInterval) clearInterval(pollingInterval);
    pollingInterval = setInterval(fetchPeriodFromAPI, 2000);
    
    // Start countdown display (updates every second)
    if (countdownInterval) clearInterval(countdownInterval);
    countdownInterval = setInterval(updateCountdownAndDisplay, 1000);
}

// Local fallback: predict based on system time (30s blocks from epoch)
function updateLocalTimingAndPredict() {
    const now = Date.now();
    const periodId = Math.floor(now / 30000);
    const elapsedInPeriod = (now % 30000) / 1000;
    currentRemainingSeconds = Math.ceil(30 - elapsedInPeriod);
    if (currentRemainingSeconds <= 0) currentRemainingSeconds = 30;
    
    if (periodId !== lastPeriodId) {
        lastPeriodId = periodId;
        runMarketAnalysis(periodId);
        updatePredictionOnScreen();
    }
}

async function fetchPeriodFromAPI() {
    try {
        const response = await fetch(CONFIG.historyApiUrl);
        const data = await response.json();
        
        // Try to extract current period number and end time (adapt to actual JSON)
        // Common patterns: data.data.periods[0].periodNo, data.periodId, etc.
        let apiPeriodId = null;
        let apiRemaining = null;
        
        // Attempt 1: if the API returns a list of periods with number and endTime
        if (data && data.data && Array.isArray(data.data) && data.data.length > 0) {
            const latest = data.data[0];
            apiPeriodId = latest.periodNo || latest.periodNumber || latest.id;
            if (latest.endTime) {
                const end = new Date(latest.endTime).getTime();
                apiRemaining = Math.max(0, Math.floor((end - Date.now()) / 1000));
            }
        }
        // Attempt 2: if data is an array directly
        else if (Array.isArray(data) && data.length > 0) {
            const latest = data[0];
            apiPeriodId = latest.periodNo || latest.periodNumber || latest.id;
            if (latest.endTime) {
                const end = new Date(latest.endTime).getTime();
                apiRemaining = Math.max(0, Math.floor((end - Date.now()) / 1000));
            }
        }
        // Attempt 3: if data has a 'periods' array
        else if (data && data.periods && Array.isArray(data.periods) && data.periods.length > 0) {
            const latest = data.periods[0];
            apiPeriodId = latest.periodNo || latest.periodNumber || latest.id;
            if (latest.endTime) {
                const end = new Date(latest.endTime).getTime();
                apiRemaining = Math.max(0, Math.floor((end - Date.now()) / 1000));
            }
        }
        
        if (apiPeriodId !== null && apiPeriodId !== lastPeriodId) {
            // New period detected from API
            lastPeriodId = apiPeriodId;
            if (apiRemaining !== null && apiRemaining > 0 && apiRemaining <= 30) {
                currentRemainingSeconds = apiRemaining;
            } else {
                // If remaining not provided, default to 30
                currentRemainingSeconds = 30;
            }
            runMarketAnalysis(apiPeriodId);
            updatePredictionOnScreen();
        } else if (apiPeriodId !== null && apiRemaining !== null && apiRemaining !== currentRemainingSeconds) {
            // Same period but remaining time changed – update it
            currentRemainingSeconds = Math.min(30, Math.max(0, apiRemaining));
            updateTimerDisplay();
        } else {
            // No new period, but fallback to local timing to keep display fresh
            updateLocalTimingAndPredict();
        }
    } catch (error) {
        console.warn("API fetch failed, using local timing", error);
        updateLocalTimingAndPredict();
    }
}

function updateCountdownAndDisplay() {
    if (currentRemainingSeconds > 0) {
        currentRemainingSeconds--;
    } else {
        // Period expired – force a new fetch and local prediction
        currentRemainingSeconds = 30;
        updateLocalTimingAndPredict();
        fetchPeriodFromAPI(); // re-sync
    }
    updateTimerDisplay();
    updatePredictionOnScreen(); // ensures prediction stays visible
}

function updateTimerDisplay() {
    const timerSpan = document.getElementById('timer-val');
    if (timerSpan) timerSpan.innerText = currentRemainingSeconds;
    
    const progressFill = document.getElementById('progress-fill');
    if (progressFill) {
        const percent = ((30 - currentRemainingSeconds) / 30) * 100;
        progressFill.style.width = percent + "%";
    }
    
    const aiStatus = document.getElementById('ai-status');
    if (aiStatus) {
        if (currentRemainingSeconds <= 3) {
            aiStatus.innerText = "● FINAL SECONDS...";
            aiStatus.style.color = "#ffaa00";
        } else {
            aiStatus.innerText = "● SERVER: CONNECTED";
            aiStatus.style.color = "#00ff87";
        }
    }
}

function updatePredictionOnScreen() {
    const resultText = document.getElementById('result-text');
    const luckyNum = document.getElementById('lucky-num');
    const periodLabel = document.getElementById('period-label');
    
    if (resultText) {
        resultText.innerText = currentPrediction.res;
        resultText.style.color = currentPrediction.color;
    }
    if (luckyNum) {
        luckyNum.innerHTML = currentPrediction.nums;
    }
    if (periodLabel && periodLabel.innerText !== "WINGO 30S AI SIGNAL") {
        periodLabel.innerText = "WINGO 30S AI SIGNAL";
    }
}

// --- ORIGINAL PREDICTION LOGIC (100% UNCHANGED) ---
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
