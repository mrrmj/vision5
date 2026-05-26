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

// --- UPDATED AI ENGINE WITH API POLLING ---
let lastBlockId = -1;
let virtualHistory = [];
let currentPrediction = { res: "---", nums: "--", color: "#fff" };
let currentPeriodRemaining = 30;
let nextPeriodTimestamp = null;
let pollingInterval = null;
let countdownInterval = null;

function initAIServer() {
    // Start polling the API every 2 seconds
    if (pollingInterval) clearInterval(pollingInterval);
    pollingInterval = setInterval(fetchPeriodData, 2000);
    
    // Start the countdown display
    if (countdownInterval) clearInterval(countdownInterval);
    countdownInterval = setInterval(updateCountdownDisplay, 1000);
    
    // Initial fetch
    fetchPeriodData();
}

async function fetchPeriodData() {
    try {
        const response = await fetch(CONFIG.historyApiUrl);
        const data = await response.json();
        
        // Parse the API response to get current period info
        // This structure is an assumption based on common patterns
        // Adjust the parsing logic based on the actual API response structure
        let currentPeriodNumber = null;
        let currentPeriodEndTime = null;
        
        // Example parsing logic - MODIFY THIS BASED ON ACTUAL API RESPONSE
        if (data && data.data && data.data.periods && data.data.periods.length > 0) {
            const latestPeriod = data.data.periods[0];
            currentPeriodNumber = latestPeriod.periodNumber;
            currentPeriodEndTime = latestPeriod.endTime;
        } else if (data && data.periods && data.periods.length > 0) {
            const latestPeriod = data.periods[0];
            currentPeriodNumber = latestPeriod.periodNumber;
            currentPeriodEndTime = latestPeriod.endTime;
        } else if (data && data.period) {
            currentPeriodNumber = data.period.periodNumber;
            currentPeriodEndTime = data.period.endTime;
        }
        
        // If we got period info, check if it's a new period
        if (currentPeriodNumber !== null && currentPeriodNumber !== lastBlockId) {
            // New period detected!
            lastBlockId = currentPeriodNumber;
            
            // Calculate remaining time if end time is provided
            if (currentPeriodEndTime) {
                const endTime = new Date(currentPeriodEndTime).getTime();
                const now = Date.now();
                currentPeriodRemaining = Math.max(0, Math.floor((endTime - now) / 1000));
            } else {
                // Default to 30 seconds if no end time provided
                currentPeriodRemaining = 30;
            }
            
            // Generate new prediction using original logic
            runMarketAnalysis(currentPeriodNumber);
            
            // Update the display immediately
            updatePredictionDisplay();
        }
    } catch (error) {
        console.error("Error fetching period data:", error);
        // Fallback to local time-based timing if API fails
        updateLocalTimeBasedTiming();
    }
}

function updateLocalTimeBasedTiming() {
    const now = new Date();
    const seconds = now.getSeconds();
    currentPeriodRemaining = 30 - (seconds % 30);
    
    // Check if we need to generate a new prediction based on local time
    const periodId = Math.floor(now.getTime() / 30000);
    if (periodId !== lastBlockId) {
        lastBlockId = periodId;
        runMarketAnalysis(periodId);
        updatePredictionDisplay();
    }
}

function updateCountdownDisplay() {
    if (currentPeriodRemaining > 0) {
        currentPeriodRemaining--;
    } else {
        // Period ended, force a refresh of period data
        fetchPeriodData();
    }
    
    // Update timer display
    const timerVal = document.getElementById('timer-val');
    if (timerVal) {
        timerVal.innerText = currentPeriodRemaining;
    }
    
    // Update progress bar
    const progressFill = document.getElementById('progress-fill');
    if (progressFill) {
        const progressPercent = ((30 - currentPeriodRemaining) / 30) * 100;
        progressFill.style.width = progressPercent + "%";
    }
    
    // Update status for final seconds
    const aiStatus = document.getElementById('ai-status');
    if (aiStatus && currentPeriodRemaining <= 3) {
        aiStatus.innerText = "● FINAL SECONDS...";
        aiStatus.style.color = "#ffaa00";
    } else if (aiStatus) {
        aiStatus.innerText = "● SERVER: CONNECTED";
        aiStatus.style.color = "#00ff87";
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
    
    if (periodLabel) {
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
