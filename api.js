import { state, resetState } from './state.js';
import { updateBalanceUI, showScore } from './ui.js';

export async function placeBetAPI(effectiveBet, bonusMode) {
    const res = await fetch('/api/bet', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
            userId: 'default', 
            betAmount: effectiveBet, 
            bonusMode 
        })
    });
    
    if (!res.ok) {
        throw new Error('Bet failed');
    }
    
    return await res.json();
}

export async function resolveGameAPI() {
    if (!state.currentSession) return;
    
    try {
        const res = await fetch('/api/resolve', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
                sessionId: state.currentSession.id, 
                userId: 'default' 
            })
        });
        
        const data = await res.json();
        state.balance = data.balance;
        state.displayedScore = data.payout;
        updateBalanceUI();
        showScore();
    } catch (e) {
        console.error('Resolve error:', e);
    }
}

export async function cancelGameAPI() {
    if (!state.currentSession) return;
    
    try {
        await fetch('/api/cancel', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
                sessionId: state.currentSession.id, 
                userId: 'default' 
            })
        });
        
        const res = await fetch('/api/balance?userId=default');
        const data = await res.json();
        state.balance = data.balance;
        updateBalanceUI();
    } catch (e) {
        console.error('Cancel error:', e);
    }
}

export async function fetchBalance() {
    try {
        const res = await fetch('/api/balance?userId=default');
        const data = await res.json();
        state.balance = data.balance;
        updateBalanceUI();
    } catch (e) {
        console.error('Balance fetch error:', e);
    }
}