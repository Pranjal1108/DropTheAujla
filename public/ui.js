import { state } from './state.js';

// ==================== DOM ELEMENTS ====================
export const elements = {
    gameScale: document.getElementById("game-scale"),
    world: document.getElementById("world"),
    sprite: document.getElementById("sprite"),
    skeleton: document.getElementById("skeleton"),
    ground: document.getElementById("ground"),
    scoreEl: document.getElementById("score"),
    multiplierEl: document.getElementById("multiplier"),
    flipTextEl: document.getElementById("flipText"),
    runOverEl: document.getElementById("runOver"),
    debugEl: document.getElementById("debug"),
    betInput: document.getElementById("betAmount"),
    betBtn: document.getElementById("placeBet"),
    plusBtn: document.getElementById("plus"),
    minusBtn: document.getElementById("minus"),
    balanceEl: document.getElementById("balance"),
    bonusToggle: document.getElementById("bonusToggle"),
};

// ==================== UI UPDATES ====================
export function updateBalanceUI() {
    elements.balanceEl.textContent = `Balance ₹${state.balance.toFixed(2)}`;
    elements.betInput.value = state.betAmount;
    elements.betBtn.disabled = state.betAmount > state.balance || 
                               state.betAmount <= 0 || 
                               state.fallStarted || 
                               state.betPlaced || 
                               state.isDying;
}

export function lockBetUI() {
    elements.plusBtn.disabled = true;
    elements.minusBtn.disabled = true;
    elements.betInput.disabled = true;
    elements.betBtn.disabled = true;
    document.querySelectorAll(".chip").forEach(c => c.disabled = true);
}

export function unlockBetUI() {
    elements.plusBtn.disabled = false;
    elements.minusBtn.disabled = false;
    elements.betInput.disabled = false;
    elements.betBtn.disabled = false;
    document.querySelectorAll(".chip").forEach(c => c.disabled = false);
}

export function showMultiplier(m) {
    elements.multiplierEl.textContent = `×${m.toFixed(2)}`;
    elements.multiplierEl.style.display = "block";
}

export function hideMultiplier() {
    elements.multiplierEl.style.display = "none";
}

export function showFlipText(text) {
    elements.flipTextEl.textContent = text;
    elements.flipTextEl.style.display = "block";
    setTimeout(() => elements.flipTextEl.style.display = "none", 600);
}

export function showScore() {
    elements.scoreEl.textContent = `₹${state.displayedScore.toFixed(2)}`;
}

export function showRunOver(html) {
    if (elements.runOverEl) {
        elements.runOverEl.innerHTML = html;
        elements.runOverEl.style.display = "flex";
    }
}

export function hideRunOver() {
    if (elements.runOverEl) {
        elements.runOverEl.style.display = "none";
    }
}

export function updateDebug() {
    if (!elements.debugEl) return;
    
    const py = state.camY + 600; // PLAYER_Y
    const px = state.camX + 960; // PLAYER_X
    
    elements.debugEl.innerHTML = `
        Pos: (${px.toFixed(0)}, ${py.toFixed(0)})<br>
        Vel: (${state.velX.toFixed(2)}, ${state.velY.toFixed(2)})<br>
        Speed: ${Math.hypot(state.velX, state.velY).toFixed(2)}<br>
        Outcome: ${state.currentSession?.outcomeType || 'N/A'}<br>
        Target: ₹${state.targetScore}<br>
        Score: ₹${state.displayedScore.toFixed(2)}<br>
        Stop: Y=${state.stopAtY} (${state.stopMethod})
    `;
}