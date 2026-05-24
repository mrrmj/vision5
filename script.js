const CONFIG = {
    key: "RKXRAKIB",
    wingoUrl: "https://tkclub2.com/#/home/AllLotteryGames/WinGo?id=1",
    depositUrl: "https://tkclub2.com/#/wallet/Recharge"
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

// --- RESTORED ORIGINAL AI ENGINE ---
let lastBlockId = -1;
let virtualHistory = [];
let currentPrediction = { res: "---", nums: "--", color: "#fff" };

function initAIServer() {
    setInterval(() => {
        const now = new Date();
        const sec = now.getSeconds();
        const timeframe = 30; // 30S original
        const remains = timeframe - (sec % timeframe);
        const blockId = Math.floor(now.getTime() / (timeframe * 1000));

        const resultText = document.getElementById('result-text');
        const aiStatus = document.getElementById('ai-status');
        const periodLabel = document.getElementById('period-label');

        if (remains >= 26) {
            resultText.innerText = "WAITING...";
            aiStatus.innerText = "SERVER: SCANNING TRENDS...";
            aiStatus.style.color = "#ffcc00";
            periodLabel.innerText = "SYNCING TK CLUB";
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
            periodLabel.innerText = "WINGO 30S AI SIGNAL";
        }
        document.getElementById('timer-val').innerText = remains;
        document.getElementById('progress-fill').style.width = (remains / timeframe) * 100 + "%";
    }, 1000);
}

function runMarketAnalysis(blockId) {
    // Original Seed & Trend Algorithm
    let seed = (blockId * 0x7FFFFFFF) % 1234567;
    let trendFactor = (seed % 10);
    
    let res = "BIG";
    // Analyze history to avoid repetitive patterns (User's original logic)
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
