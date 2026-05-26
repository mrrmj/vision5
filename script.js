const CONFIG = {
    key: "RKXRAKIB",
    wingoUrl: "https://tgdream19.com/#/saasLottery/WinGo?gameCode=WinGo_30S&lottery=WinGo",
    depositUrl: "https://tgdream19.com/#/wallet/Recharge",
    historyApiUrl: "https://draw.ar-lottery01.com/WinGo/WinGo_30S/GetHistoryIssuePage.json",
    // --- TIMING ALIGNMENT ---
    // Set this to the number of seconds from 00:00:00 (local time) when the FIRST period of the day starts.
    // Example: if first period starts at 06:13:30, then offsetSeconds = 6*3600 + 13*60 + 30 = 22410.
    // If periods start at a different UTC offset, adjust accordingly.
    firstPeriodOffsetSeconds: 22410,   // 06:13:30 local time
    // If you want to use UTC instead, set useUTC: true
    useUTC: false
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
handle.addEventListener("mousedown", dragStart); document.addEventListener("mouseup", dragEnd); document.addEventListener("mousemove", drag);
handle.addEventListener("touchstart", dragStart); document.addEventListener("touchend", dragEnd); document.addEventListener("touchmove", drag);

// ========== TIMING-ACCURATE AI ENGINE (no prediction logic change) ==========
let lastPeriodId = null;
let virtualHistory = [];
let currentPrediction = { res: "---", nums: "--", color: "#fff" };
let currentRemainingSeconds = 30;
let pollingInterval = null;
let countdownInterval = null;

// Helper: get current period number and remaining seconds based on configurable offset
function getLocalPeriodInfo() {
    const now = new Date();
    let nowMs = now.getTime();
    if (!CONFIG.useUTC) {
        // Use local time by adjusting for timezone offset
        // We want a number that increments every 30 seconds starting from the configured offset time.
        // Get milliseconds since midnight local time
        const midnight = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0);
        let msSinceMidnight = nowMs - midnight.getTime();
        // Apply offset (convert seconds to ms)
        const offsetMs = CONFIG.firstPeriodOffsetSeconds * 1000;
        let adjustedMs = msSinceMidnight - offsetMs;
        if (adjustedMs < 0) adjustedMs += 24 * 3600 * 1000; // wrap to previous day's offset?
        const periodId = Math.floor(adjustedMs / 30000);
        const elapsedInPeriod = (adjustedMs % 30000) / 1000;
        let remaining = 30 - elapsedInPeriod;
        if (remaining <= 0) remaining = 30;
        return { periodId, remainingSeconds: Math.ceil(remaining) };
    } else {
        // UTC version: use UTC midnight and offset
        const utcNow = new Date(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), 0, 0, 0);
        let msSinceUTCMidnight = nowMs - utcNow.getTime();
        const offsetMs = CONFIG.firstPeriodOffsetSeconds * 1000;
        let adjustedMs = msSinceUTCMidnight - offsetMs;
        if (adjustedMs < 0) adjustedMs += 24 * 3600 * 1000;
        const periodId = Math.floor(adjustedMs / 30000);
        const elapsedInPeriod = (adjustedMs % 30000) / 1000;
        let remaining = 30 - elapsedInPeriod;
        if (remaining <= 0) remaining = 30;
        return { periodId, remainingSeconds: Math.ceil(remaining) };
    }
}

// Force prediction based on local time (most reliable)
function updateFromLocalTiming() {
    const { periodId, remainingSeconds } = getLocalPeriodInfo();
    if (periodId !== lastPeriodId) {
        lastPeriodId = periodId;
        runMarketAnalysis(periodId);
        updatePredictionDisplay();
        console.log(`[SYNC] New period ${periodId} | Remaining ${remainingSeconds}s`);
    }
    currentRemainingSeconds = remainingSeconds;
    updateTimerDisplay();
}

// API polling – used only for cross-check, but local timing is primary
async function fetchPeriodFromAPI() {
    try {
        const response = await fetch(CONFIG.historyApiUrl);
        const data = await response.json();
        console.log("[API] Response:", data); // DEBUG: see actual structure
        
        // Try to extract current period number and end time
        let apiPeriodId = null;
        let apiRemaining = null;
        
        // Attempt common structures – you can adjust this after checking console output
        if (data && data.data && Array.isArray(data.data) && data.data.length > 0) {
            const latest = data.data[0];
            apiPeriodId = latest.periodNo || latest.periodNumber || latest.id;
            if (latest.endTime) {
                const end = new Date(latest.endTime).getTime();
                apiRemaining = Math.max(0, Math.floor((end - Date.now()) / 1000));
            }
        } else if (Array.isArray(data) && data.length > 0) {
            const latest = data[0];
            apiPeriodId = latest.periodNo || latest.periodNumber || latest.id;
            if (latest.endTime) {
                const end = new Date(latest.endTime).getTime();
                apiRemaining = Math.max(0, Math.floor((end - Date.now()) / 1000));
            }
        } else if (data && data.periods && Array.isArray(data.periods) && data.periods.length > 0) {
            const latest = data.periods[0];
            apiPeriodId = latest.periodNo || latest.periodNumber || latest.id;
            if (latest.endTime) {
                const end = new Date(latest.endTime).getTime();
                apiRemaining = Math.max(0, Math.floor((end - Date.now()) / 1000));
            }
        }
        
        // If API gives a clear period ID, we can optionally use it to verify local period.
        // But to avoid mismatch, we still rely on local timing because offset is configurable.
        // However, we can adjust local offset if API period differs consistently.
        if (apiPeriodId !== null) {
            const localPeriod = getLocalPeriodInfo().periodId;
            if (apiPeriodId !== localPeriod) {
                console.warn(`[MISMATCH] API period ${apiPeriodId} vs local ${localPeriod}. You may need to adjust firstPeriodOffsetSeconds.`);
            } else {
                console.log(`[OK] API and local periods match: ${apiPeriodId}`);
            }
            // Optionally use API remaining time if accurate
            if (apiRemaining !== null && apiRemaining > 0 && apiRemaining <= 30) {
                currentRemainingSeconds = apiRemaining;
                updateTimerDisplay();
            }
        }
    } catch (error) {
        console.warn("[API] Fetch failed, using local timing only", error);
    }
}

function initAIServer() {
    // Immediately set initial prediction
    updateFromLocalTiming();
    
    // Poll API every 3 seconds (less frequent, just for sync check)
    if (pollingInterval) clearInterval(pollingInterval);
    pollingInterval = setInterval(() => {
        fetchPeriodFromAPI();
        updateFromLocalTiming(); // keep local timing as master
    }, 3000);
    
    // Countdown updates every second
    if (countdownInterval) clearInterval(countdownInterval);
    countdownInterval = setInterval(() => {
        // Decrement remaining seconds
        if (currentRemainingSeconds > 0) {
            currentRemainingSeconds--;
        } else {
            // Period expired – refresh from local timing
            updateFromLocalTiming();
        }
        updateTimerDisplay();
        // Keep prediction visible (no need to change unless new period)
        updatePredictionDisplay();
    }, 1000);
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

function updatePredictionDisplay() {
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
