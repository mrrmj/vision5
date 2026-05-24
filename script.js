:root {
    --accent: #00d2ff;
    --bg: rgba(10, 10, 15, 0.98);
}

body, html {
    margin: 0;
    padding: 0;
    width: 100%;
    height: 100%;
    overflow: hidden;
    background: #000;
    font-family: 'Segoe UI', sans-serif;
}

#game-frame {
    width: 100%;
    height: 100%;
    border: none;
    position: fixed;
    top: 0;
    left: 0;
    z-index: 1;
}

/* Mini Profile Logo */
#mini-logo {
    position: fixed;
    top: 100px;
    left: 20px;
    width: 50px;
    height: 50px;
    border-radius: 50%;
    border: 2px solid var(--accent);
    background: #000;
    z-index: 10001;
    cursor: pointer;
    display: none;
    box-shadow: 0 0 15px var(--accent);
    overflow: hidden;
}
#mini-logo img {
    width: 100%;
    height: 100%;
    object-fit: cover;
}

/* Main Compact Box */
#main-box {
    position: fixed;
    top: 150px;
    left: 50px;
    width: 190px;
    background: var(--bg);
    backdrop-filter: blur(12px);
    border: 1px solid rgba(255,255,255,0.2);
    border-radius: 20px;
    z-index: 10000;
    box-shadow: 0 15px 35px rgba(0,0,0,0.8);
}

#drag-handle {
    background: rgba(255,255,255,0.08);
    padding: 12px 12px;
    border-radius: 20px 20px 0 0;
    display: flex;
    justify-content: space-between;
    align-items: center;
    cursor: grab;
    user-select: none;
}
#drag-handle:active { cursor: grabbing; }

.live-dot {
    width: 8px;
    height: 8px;
    background: #ff3366;
    border-radius: 50%;
    animation: blink 1s infinite;
    box-shadow: 0 0 4px #ff3366;
}
.title {
    font-size: 11px;
    font-weight: 800;
    color: white;
    margin-left: 6px;
    letter-spacing: 1px;
    background: linear-gradient(135deg, #fff, var(--accent));
    -webkit-background-clip: text;
    background-clip: text;
    color: transparent;
}
.close-btn {
    background: none;
    border: none;
    color: #aaa;
    font-size: 22px;
    cursor: pointer;
    line-height: 1;
    padding: 0 6px;
    transition: 0.2s;
}
.close-btn:hover { color: white; }

.inner-content {
    padding: 14px 12px 16px;
    text-align: center;
}

.view-panel {
    animation: fadeIn 0.25s ease;
}

.label-sm {
    font-size: 9px;
    color: #aaa;
    margin-bottom: 8px;
    letter-spacing: 1px;
}

#passKey {
    width: 100%;
    padding: 10px;
    background: #0a0a0f;
    border: 1px solid #2a2a35;
    border-radius: 14px;
    color: var(--accent);
    text-align: center;
    font-size: 12px;
    margin-bottom: 12px;
    outline: none;
    box-sizing: border-box;
}

.check-row {
    font-size: 9px;
    color: #bbb;
    margin-bottom: 14px;
    text-align: left;
    display: flex;
    align-items: center;
    gap: 6px;
}

.btn-primary, .btn-gold, .btn-verify {
    width: 100%;
    padding: 10px;
    border: none;
    border-radius: 40px;
    font-size: 11px;
    font-weight: bold;
    cursor: pointer;
    margin-bottom: 8px;
    transition: transform 0.1s ease;
}
.btn-primary:active, .btn-gold:active, .btn-verify:active { transform: scale(0.97); }
.btn-primary { background: var(--accent); color: #000; box-shadow: 0 0 8px var(--accent); }
.btn-gold { background: #f5b042; color: #000; box-shadow: 0 0 6px #f5b042; }
.btn-verify { background: #2c2c3a; color: #fff; border: 1px solid #4a4a5a; }

.warn-msg {
    font-size: 11px;
    background: #ffcc0022;
    padding: 6px;
    border-radius: 12px;
    color: #ffcc55;
    margin-bottom: 12px;
}

/* Signal Styling */
#period-label {
    font-size: 8px;
    color: #aaa;
    text-transform: uppercase;
    letter-spacing: 1.5px;
    margin-bottom: 5px;
}
#result-text {
    font-size: 34px;
    font-weight: 900;
    margin: 8px 0 5px;
    background: linear-gradient(135deg, #ffffff, #aaccff);
    -webkit-background-clip: text;
    background-clip: text;
    color: transparent;
}
#lucky-num {
    font-size: 15px;
    color: var(--accent);
    background: rgba(0, 210, 255, 0.12);
    padding: 5px 12px;
    border-radius: 30px;
    border: 0.5px solid rgba(0,210,255,0.4);
    display: inline-block;
    margin-bottom: 12px;
    font-weight: bold;
}
.timer-info {
    font-size: 10px;
    color: #ddd;
    font-weight: bold;
    margin-top: 4px;
}
.progress-bg {
    width: 100%;
    height: 4px;
    background: #1e1e2a;
    border-radius: 10px;
    overflow: hidden;
    margin: 6px 0;
}
#progress-fill {
    height: 100%;
    width: 0%;
    background: var(--accent);
    transition: width 0.2s linear;
}
#ai-status {
    font-size: 7px;
    color: #00ff87;
    margin-top: 10px;
    opacity: 0.85;
    font-weight: 600;
}

@keyframes blink {
    50% { opacity: 0.3; }
}
@keyframes fadeIn {
    from { opacity: 0; transform: translateY(5px); }
    to { opacity: 1; transform: translateY(0); }
}
