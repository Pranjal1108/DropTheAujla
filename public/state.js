import * as C from './constants.js';

// ==================== GAME STATE ====================
export const state = {
    // Betting
    balance: 1000,
    betAmount: 10,
    bonusMode: false,
    
    // Session
    currentSession: null,
    currentScript: null,
    
    // Game flow
    fallStarted: false,
    betPlaced: false,
    betResolved: false,
    gameStopped: false,
    
    // Physics
    camX: 0,
    camY: 0,
    velX: 0,
    velY: 0,
    angle: 0,
    angVel: 0,
    angleAccumulator: 0,
    
    // Score (backend-controlled)
    displayedScore: 0,
    targetScore: 0,
    scoreProgression: [],
    
    // Stop control
    stopAtY: C.GROUND_COLLISION_Y,
    stopMethod: 'ground',
    landedTime: 0,
    
    // Death
    isDying: false,
    deathAnimStart: 0,
    deathAnimType: 'implode',
    
    // Black hole
    inBlackHole: false,
    bhAnimating: false,
    bhAnimType: '',
    bhAnimStartTime: 0,
    bhAnimStartSize: 0,
    bhAnimEndSize: 0,
    bhAnimEl: null,
    bhReturnX: 0,
    bhReturnY: 0,
    bhTargetMultiplier: 0,
    bhCurrentMultiplier: 1,
    bhShowcaseStart: 0,
    finalEarnings: 0,
    currentBH: null,
    exitingAnimation: false,
    exitAnimStart: 0,
    
    // Dark cloud
    grabbedByDarkCloud: false,
    releaseTime: 0,
    grabbedCloud: null,
    freezeX: 0,
    freezeY: 0,
    skeletonFlashInterval: null,
    
    // Visual RNG
    visualRng: Math.random,
};

// ==================== OBJECTS ====================
export const objects = {
    clouds: [],
    darkClouds: [],
    blackHoles: [],
    collectibles: [],
    pushables: [],
    tank: null,
    camp: null,
};

// ==================== RESET ====================
export function resetState() {
    state.camX = 0;
    state.camY = 0;
    state.velX = 0;
    state.velY = 0;
    state.angle = 0;
    state.angVel = 0;
    state.angleAccumulator = 0;
    
    state.displayedScore = 0;
    state.targetScore = 0;
    state.scoreProgression = [];
    state.landedTime = 0;
    
    state.stopAtY = C.GROUND_COLLISION_Y;
    state.stopMethod = 'ground';
    state.gameStopped = false;
    
    state.isDying = false;
    state.fallStarted = false;
    state.betPlaced = false;
    state.betResolved = false;
    
    state.inBlackHole = false;
    state.bhAnimating = false;
    state.grabbedByDarkCloud = false;
    state.exitingAnimation = false;
    
    state.currentSession = null;
    state.currentScript = null;
    state.visualRng = Math.random;
    
    if (state.skeletonFlashInterval) {
        clearInterval(state.skeletonFlashInterval);
        state.skeletonFlashInterval = null;
    }
}

export function clearObjects() {
    objects.clouds.forEach(c => c.el?.remove());
    objects.darkClouds.forEach(c => c.el?.remove());
    objects.blackHoles.forEach(c => c.el?.remove());
    objects.collectibles.forEach(c => c.el?.remove());
    
    objects.clouds.length = 0;
    objects.darkClouds.length = 0;
    objects.blackHoles.length = 0;
    objects.collectibles.length = 0;
    
    if (objects.tank?.el) objects.tank.el.remove();
    if (objects.camp?.el) objects.camp.el.remove();
    objects.tank = null;
    objects.camp = null;
}