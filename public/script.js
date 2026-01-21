// ===============================================================
// DROP THE BOSS - Frontend Puppet
// ===============================================================

import { createRNG } from './rng.js';

// ===============================================================
// CONSTANTS (MUST MATCH BACKEND EXACTLY)
// ===============================================================

const SCREEN_W = 1920;
const SCREEN_H = 1200;
const GROUND_Y = 19300;
const GROUND_HEIGHT = 700;

const SPAWN_START_Y = 800;
const SPAWN_END_Y = GROUND_Y - 1000;

const PLAYER_W = 160;
const PLAYER_H = 240;
const PLAYER_X = SCREEN_W / 2;
const PLAYER_Y = SCREEN_H / 2;

// Physics - MUST MATCH BACKEND
const GRAVITY = 0.55;
const MAX_FALL = 28;
const AIR_FRICTION = 0.995;
const GROUND_FRICTION = 0.85;
const PLAYER_RADIUS = 65;
const GROUND_COLLISION_Y = 19280;

// Cloud physics
const CLOUD_RADIUS = 120;
const CLOUD_BOUNCE = 0.65;
const CLOUD_FRICTION = 0.85;

const BH_SIZE = 300;
const BH_RADIUS = 100;

// ===============================================================
// DOM ELEMENTS
// ===============================================================

const gameScale = document.getElementById("game-scale");
const world = document.getElementById("world");
const sprite = document.getElementById("sprite");
const skeleton = document.getElementById("skeleton");
const ground = document.getElementById("ground");
const scoreEl = document.getElementById("score");
const multiplierEl = document.getElementById("multiplier");
const flipTextEl = document.getElementById("flipText");
const runOverEl = document.getElementById("runOver");
const debugEl = document.getElementById("debug");

const betInput = document.getElementById("betAmount");
const betBtn = document.getElementById("placeBet");
const plusBtn = document.getElementById("plus");
const minusBtn = document.getElementById("minus");
const balanceEl = document.getElementById("balance");
const bonusToggle = document.getElementById("bonusToggle");

// ===============================================================
// CLOUD VISUAL DATA
// ===============================================================

const CLOUD1_W = 320 * 1.7;
const CLOUD1_H = 160 * 1.7;
const CLOUD2_W = 325 * 1.5;
const CLOUD2_H = 217 * 1.5;

const DARK_W = 280 * 1.5;
const DARK_H = 187 * 1.5;
const DARK_RECTS = [
    { w: 0.19, h: 0.086, x: 0.418, y: 0.193 },
    { w: 0.43, h: 0.118, x: 0.296, y: 0.278 },
    { w: 0.77, h: 0.214, x: 0.125, y: 0.476 }
];

// ===============================================================
// GAME STATE
// ===============================================================

let balance = 1000;
let betAmount = 10;
let bonusMode = false;
let fallStarted = false;
let betPlaced = false;
let betResolved = false;
let gameLoopRunning = false;
let isPlacingBet = false;

let currentSession = null;
let currentScript = null;

<<<<<<< HEAD
const TANK_COUNT = 8;
const CAMP_COUNT = 5;

const VISIBILITY_BUFFER = 2200; // distance between 2

const tanks = [];
const camps = [];

let activeTankIndex = 0;
let activeCampIndex = 0;

=======
// Physics state
let camX = 0, camY = 0;
let velX = 0, velY = 0;
let angle = 0, angVel = 0;
let angleAccumulator = 0;
>>>>>>> 1b90251 (stuff)

// Score
let displayedScore = 0;
let targetScore = 0;
let scoreProgression = [];

let landedTime = 0;

// Object arrays
const clouds = [];
const darkClouds = [];
const blackHoles = [];
const collectibles = [];

let tank = null;
let camp = null;

let visualRng = Math.random;

// Death animation
let isDying = false;
let deathAnimStart = 0;
let deathAnimType = 'implode';
const DEATH_ANIM_DURATION = 1500;

// Black hole state
let inBlackHole = false;
let bhAnimating = false;
let bhAnimType = '';
let bhAnimStartTime = 0;
let bhAnimDuration = 1000;
let bhAnimStartSize = 0;
let bhAnimEndSize = 0;
let bhAnimEl = null;
let bhReturnX = 0, bhReturnY = 0;
let bhTargetMultiplier = 0;
let bhCurrentMultiplier = 1;
let bhShowcaseStart = 0;
const VOID_START_Y = -10000;
const BH_RISE_SPEED = 7;
let finalEarnings = 0;
let currentBH = null;
let exitingAnimation = false;
let exitAnimStart = 0;

<<<<<<< HEAD
let tankTouched = false;

let bhAnimating = false;
let bhAnimEl = null;
let bhAnimStartTime = 0;
let bhAnimDuration = 1000;
let bhAnimStartSize = 150;
let bhAnimEndSize = 400;
let bhAnimType = 'enter';
let bhBgEl = null;
let bhMovingBgEl = null;
let bhRiseHeight = 0;
let bhBgOffsetY = 0;
let bhShowcaseStart = 0;

const voidSprites = [];

const VOID_BG_WIDTH = 2220;
const VOID_BG_HEIGHT = 6920;

const VOID_ZONE_X = 0;
const VOID_ZONE_Y = -VOID_BG_HEIGHT - 1000;
const VOID_START_Y = VOID_ZONE_Y + VOID_BG_HEIGHT - 1200;

const BH_RISE_SPEED = 7;



let earnings = 0;
let fallEarnings = 0;
let fallScorePaused = false;
let lastCamY = 0;
let lastUpdateTime = performance.now();
let landedTime = 0;
let originalEarnings = 0;
let finalEarnings = 0;
let showcaseScore = 0;



const multiplierEl = document.getElementById("multiplier");
const flipTextEl = document.getElementById("flipText");

function showScore() {
  scoreEl.style.display = "block";
  scoreEl.textContent = `₹${earnings.toFixed(2)}`;
}

function showMultiplier(m) {
  multiplierEl.textContent = `×${m.toFixed(2)}`;
  multiplierEl.style.display = "block";
}

function hideMultiplier() {
  multiplierEl.style.display = "none";
}

function showFlipText(text) {
  flipTextEl.textContent = text;
  flipTextEl.style.display = "block";
  setTimeout(() => {
    flipTextEl.style.display = "none";
  }, 500);
}

function lockBetUI() {
  plusBtn.disabled = true;
  minusBtn.disabled = true;
  betInput.disabled = true;
  betBtn.disabled = true;
  document.querySelectorAll(".chip").forEach(c => c.disabled = true);
}

function unlockBetUI() {
  plusBtn.disabled = false;
  minusBtn.disabled = false;
  betInput.disabled = false;
  betBtn.disabled = false;
  document.querySelectorAll(".chip").forEach(c => c.disabled = false);
}

function updateBalanceUI() {
  balanceEl.textContent = `Balance ₹${balance.toFixed(2)}`;
  betInput.value = (bonusMode ? betAmount * 10 : betAmount).toFixed(2);
  betBtn.disabled = (bonusMode ? betAmount * 10 : betAmount) > balance || betAmount <= 0 || fallStarted;
}

plusBtn.onclick = () => {
  if (fallStarted) return;
  if (betAmount + 10 <= balance) betAmount += 10;
  updateBalanceUI();
};

minusBtn.onclick = () => {
  if (fallStarted) return;
  betAmount = Math.max(10, betAmount - 10);
  updateBalanceUI();
};

betInput.oninput = () => {
  if (fallStarted) {
    betInput.value = betAmount.toFixed(2);
    return;
  }
  betAmount = Math.max(10, Math.min(balance, Number(betInput.value) || 10));
  betInput.value = betAmount.toFixed(2);
  updateBalanceUI();
};

document.querySelectorAll(".chip").forEach(c => {
  c.onclick = () => {
    if (fallStarted) return;
    const v = c.dataset.v;
    if (v === "max") betAmount = balance;
    else betAmount = Math.min(balance, betAmount + Number(v));
    updateBalanceUI();
  };
});

betBtn.onclick = () => {
  if (fallStarted || betPlaced) return;
  const effectiveBet = bonusMode ? betAmount * 10 : betAmount;
  if (effectiveBet > balance) return;
  balance -= effectiveBet;
  updateBalanceUI();
  camX = camY = velX = velY = angle = angVel = 0;
  earnings = 0;
  lastCamY = 0;
  fallStarted = true;
  betPlaced = true;
  betResolved = false;
  lockBetUI();
};

function decideOutcome(bet) {
  let r = Math.random();
  if (bonusMode && r < 0.6) r = 0.6;

  if (r < 0.60) {
    outcomeType = "lose";
    targetPayout = bet * 0;
  } else if (r < 0.85) {
    outcomeType = "small";
    targetPayout = bet * (1.2 + Math.random() * 0.6);
  } else if (r < 0.97) {
    outcomeType = "medium";
    targetPayout = bet * (3 + Math.random() * 2);
  } else if (r < 0.995) {
    outcomeType = "big";
    targetPayout = bet * (10 + Math.random() * 10);
  } else {
    outcomeType = "insane";
    targetPayout = bet * (40 + Math.random() * 30);
  }
}


updateBalanceUI();

const bonusToggle = document.getElementById("bonusToggle");
bonusToggle.onclick = () => {
  if (fallStarted) return;
  bonusMode = !bonusMode;
  bonusToggle.classList.toggle("active");
  // Remove white clouds if bonus mode is on
  if (bonusMode) {
    clouds.forEach(c => c.el.remove());
    clouds.length = 0;
  } else {
    // Respawn clouds if turning off bonus mode
    for (let i = 0; i < cloudquantity; i++) spawnCloud(randX(), spawnY());
  }
  updateBalanceUI();
};

const runOverEl = document.getElementById("runOver");

function hardResetWorld(showLoss = true, delay = 2000) {
  fallStarted = false;
  betPlaced = false;
  betResolved = true;

  const payoutNum = earnings;
  balance += payoutNum;
  updateBalanceUI();

  if (showLoss) {
    runOverEl.innerHTML = `RUN OVER<br>Total Winnings: ₹${payoutNum.toFixed(2)}`;
    runOverEl.style.display = "block";
  }

  setTimeout(() => {
    clearWorld();
    camX = camY = velX = velY = angle = angVel = 0;
    earnings = 0;
    lastCamY = 0;
    runOverEl.style.display = "none";
    spawnWorld();
    spawnCollectibles(PRESET_SPAWN_COUNT);
    silverjetWrap.style.display = "block";
    unlockBetUI();
    updateBalanceUI();
  }, delay);
}

function clearWorld() {
  [...collectibles, ...chains, ...notes].forEach(c => c.el.remove());
  collectibles.length = chains.length = notes.length = 0;
  for (const c of clouds) c.el.remove();
  clouds.length = 0;
  for (const c of darkClouds) c.el.remove();
  darkClouds.length = 0;
  blackHoles.forEach(bh => bh.el.remove());
  blackHoles.length = 0;
  pushables.forEach(p => p.el.remove());
  pushables.length = 0;
}

const collectibles = [];
const chains = [];
const notes = [];
const blackHoles = [];
const blackholequantity = 100;
let tank = null;
let camp = null;
const pushables = [];
const pushablequantity = 400;


const silverjetWrap = document.createElement("div");
silverjetWrap.style.position = "absolute";
silverjetWrap.style.pointerEvents = "none";
silverjetWrap.style.zIndex = "100000";

const silverjet = document.createElement("div");
silverjet.className = "silverjet";
silverjetWrap.appendChild(silverjet);
world.appendChild(silverjetWrap);


function spawnCollectibles(count = PRESET_SPAWN_COUNT) {
  [...collectibles, ...chains, ...notes].forEach(c => c.el.remove());
  collectibles.length = chains.length = notes.length = 0;

  const TOP_SAFE = DEADZONE;
  const BOTTOM_SAFE_START = GROUND_Y - DEADZONE;

  const actualCount = bonusMode ? count * 2 : count; // Increase satellites in bonus mode

  for (let i = 0; i < actualCount; i++) {
    const type = Math.random();
    const el = document.createElement("div");
    let value = 0, arr;

    if (type < 0.4) {
      el.className = "collectible chain";
      value = 3;
      arr = chains;
    } else {
      el.className = "collectible music";
      value = 5;
      arr = notes;
    }

    const x = (Math.random() * SCREEN_W * 10) - (SCREEN_W * 5);

    let y;
    do {
      y = Math.random() * WORLDH;
    } while (y < TOP_SAFE || y > BOTTOM_SAFE_START);

    el.style.left = (x - 85) + "px";
    el.style.top = (y - 85) + "px";

    world.appendChild(el);
    const obj = { x, y, value, el };
    arr.push(obj);
    collectibles.push(obj);
  }
}



// ========= BLACK HOLES =========

function spawnBlackHoles(count = blackholequantity) {
  blackHoles.forEach(bh => bh.el.remove());
  blackHoles.length = 0;

  const TOP_SAFE = DEADZONE;
  const BOTTOM_SAFE = GROUND_Y - DEADZONE - BH_SIZE;

  for (let i = 0; i < count; i++) {
    const el = document.createElement("div");
    el.className = "black-hole";
    el.style.width = BH_SIZE + "px";
    el.style.height = BH_SIZE + "px";
    el.style.background = `url('items/black_hole_1.png') no-repeat center/contain`;

    const x = randX();
    const y = TOP_SAFE + Math.random() * (BOTTOM_SAFE - TOP_SAFE);

    el.style.left = x + "px";
    el.style.top = y + "px";

    world.appendChild(el);
    blackHoles.push({ x, y, el, rotation: 0 });
  }
}

// ========= TANKS =========

function spawnTanks(count = TANK_COUNT) {
  tanks.forEach(t => t.el.remove());
  tanks.length = 0;

  const groundY = parseInt(ground.style.top);

  for (let i = 0; i < count; i++) {
    const el = document.createElement("div");
    el.className = "tank";
    el.style.width = "500px";
    el.style.height = "375px";
    el.style.background = "url('items/tank.png') no-repeat center/contain";
    el.style.display = "none";

    const x = randX();
    const y = groundY;

    el.style.left = x + "px";
    el.style.top = y + "px";

    world.appendChild(el);
    tanks.push({ x, y, el, active: false });
  }
}


// ========= MILITARY CAMP =========

function spawnCamps(count = CAMP_COUNT) {
  camps.forEach(c => c.el.remove());
  camps.length = 0;

  const groundY = parseInt(ground.style.top);

  for (let i = 0; i < count; i++) {
    const el = document.createElement("div");
    el.className = "military-camp";
    el.style.width = "800px";
    el.style.height = "600px";
    el.style.background = "url('items/camp.png') no-repeat center/contain";
    el.style.display = "none";

    const x = randX();
    const y = groundY;

    el.style.left = x + "px";
    el.style.top = y + "px";

    world.appendChild(el);
    camps.push({ x, y, el, active: false });
  }
}


function updateGroundEntitiesVisibility() {
  const camBottom = camY + SCREEN_H;
  const camTop = camY;

  // ---- TANK ----
  tanks.forEach(t => t.el.style.display = "none");

  let t = tanks[activeTankIndex];
  if (t) {
    const dy = Math.abs(t.y - camBottom);
    if (dy < VISIBILITY_BUFFER) {
      t.el.style.display = "block";
    } else {
      activeTankIndex = (activeTankIndex + 1) % tanks.length;
    }
  }

  // ---- CAMP ----
  camps.forEach(c => c.el.style.display = "none");

  let c = camps[activeCampIndex];
  if (c) {
    const dy = Math.abs(c.y - camBottom);
    if (dy < VISIBILITY_BUFFER) {
      c.el.style.display = "block";
    } else {
      activeCampIndex = (activeCampIndex + 1) % camps.length;
    }
  }
}


// ========= PUSHABLES =========

function spawnPushables(count = pushablequantity) {
  pushables.forEach(p => p.el.remove());
  pushables.length = 0;

  const TOP_SAFE = DEADZONE;
  const BOTTOM_SAFE = GROUND_Y - DEADZONE - 80;

  for (let i = 0; i < count; i++) {
    const el = document.createElement("div");
    el.className = "pushable";
    el.style.width = "550px";
    el.style.height = "550px";
    el.style.background = "url('items/pushable.png') no-repeat center/contain";

    const x = randX();
    const y = TOP_SAFE + Math.random() * (BOTTOM_SAFE - TOP_SAFE);

    el.style.left = x + "px";
    el.style.top = y + "px";

    world.appendChild(el);
    pushables.push({ x, y, el, velX: 0, velY: 0 });
  }
}



// ========= STARFIELD =========

const starfield = document.getElementById("starfield");
const STAR_COUNT = 180;
for (let i = 0; i < STAR_COUNT; i++) {
  const star = document.createElement("div");
  star.className = "star";
  star.style.left = Math.random() * 100 + "vw";
  star.style.top = Math.random() * 100 + "vh";
  star.style.animationDuration = (Math.random() * 2 + 1) + "s";
  star.style.animationDelay = Math.random() * 2 + "s";
  starfield.appendChild(star);
}

// ========= ANIMATED DECOR CLOUDS =========
let CLOUD_ACTIVE_MIN = 0;
let CLOUD_ACTIVE_MAX = 200;
let playerY = 0;

const animated_clouds = [];
let animated_clouds_lastTime = performance.now();

function createAnimatedCloud(layer, count, speedMin, speedMax, yMin, yMax, sizeScale) {
  const container = document.querySelector(layer);
  if (!container) return;

  for (let i = 0; i < count; i++) {
    const cloud = document.createElement("div");

    const scale = (0.7 + Math.random() * 0.6) * sizeScale;
    const y = Math.random() * (yMax - yMin) + yMin;
    const x = Math.random() * window.innerWidth + 600;
    const speed = speedMin + Math.random() * (speedMax - speedMin);

    cloud.style.position = "absolute";
    cloud.style.top = y + "px";
    cloud.style.transform = `translate3d(${x}px, 0, 0) scale(${scale})`;

    container.appendChild(cloud);

    animated_clouds.push({
      el: cloud,
      x,
      y,
      speed,
      yMin,
      yMax,
      scale
    });
  }
}

createAnimatedCloud(".back", 12, 200, 450, 0, 850, 0.8);
createAnimatedCloud(".mid", 8, 450, 600, 0, 1050, 0.9);
createAnimatedCloud(".front", 6, 700, 1000, 0, 1200, 1.3);

function animateAnimatedClouds(now) {
  const dt = (now - animated_clouds_lastTime) / 1000;
  animated_clouds_lastTime = now;

  animated_clouds.forEach(c => {
    c.x += c.speed * dt;

    if (c.x > window.innerWidth + 300) {
      c.x = -300;
      c.y = Math.random() * (c.yMax - c.yMin) + c.yMin;
      c.el.style.top = c.y + "px";
    }

    c.el.style.transform = `translate3d(${c.x}px, 0, 0) scale(${c.scale})`;
  });

  requestAnimationFrame(animateAnimatedClouds);
}

requestAnimationFrame(animateAnimatedClouds);

// ========= CLOUDS =========

const clouds = [];
const CLOUD1_W = 320 * 1.7, CLOUD1_H = 160 * 1.7;
const CLOUD2_W = 325 * 1.5, CLOUD2_H = 217 * 1.5;

const CLOUD1 = [
  { x: 0.1329, y: 0.6750, r: 0.0922 },
  { x: 0.2251, y: 0.5125, r: 0.1094 },
  { x: 0.2689, y: 0.6750, r: 0.0594 },
  { x: 0.3986, y: 0.3781, r: 0.1266 },
  { x: 0.3830, y: 0.7219, r: 0.0797 },
  { x: 0.5189, y: 0.7219, r: 0.0750 },
  { x: 0.6237, y: 0.5312, r: 0.1141 },
  { x: 0.7331, y: 0.7031, r: 0.0891 },
  { x: 0.7862, y: 0.5844, r: 0.0610 },
  { x: 0.8581, y: 0.6531, r: 0.0703 }
];

const CLOUD2 = [
  { x: 0.1508, y: 0.7857, r: 0.0892 },
  { x: 0.2169, y: 0.6912, r: 0.0692 },
  { x: 0.3646, y: 0.5622, r: 0.1308 },
  { x: 0.2338, y: 0.7926, r: 0.0862 },
  { x: 0.3862, y: 0.8641, r: 0.0877 },
  { x: 0.5277, y: 0.6336, r: 0.0477 },
  { x: 0.5138, y: 0.8433, r: 0.0738 },
  { x: 0.6385, y: 0.6935, r: 0.1092 },
  { x: 0.6062, y: 0.8525, r: 0.0462 },
  { x: 0.7108, y: 0.8088, r: 0.1015 }
];

function randX() {
  return (Math.random() * SCREEN_W * 10) - (SCREEN_W * 5);
}

function spawnY() {
  const MAX_CLOUD_H = Math.max(CLOUD1_H, CLOUD2_H);
  const TOP_SAFE = DEADZONE;
  const BOTTOM_SAFE = GROUND_Y - DEADZONE - MAX_CLOUD_H;
  return TOP_SAFE + Math.random() * (BOTTOM_SAFE - TOP_SAFE);
}


function spawnCloud(x, y) {
  const pick = Math.random() < 0.5 ? 1 : 2;
  let el = document.createElement("div");
  el.className = "cloud";

  // Remove randomness, use original size
  const scale = 1.0;

  let circles;
  let W, H, base;

  if (pick === 1) {
    W = CLOUD1_W * scale;
    H = CLOUD1_H * scale;
    base = CLOUD1;

    el.style.width = W + "px";
    el.style.height = H + "px";
    el.style.background = `url('clouds/cloud4.png') no-repeat center/contain`;

    circles = base.map(c => ({
      x: x + c.x * W,
      y: y + c.y * H,
      r: c.r * W
    }));

  } else {
    W = CLOUD2_W * scale;
    H = CLOUD2_H * scale;
    base = CLOUD2;

    el.style.width = W + "px";
    el.style.height = H + "px";
    el.style.background = `url('clouds/cloud2.png') no-repeat center/contain`;

    circles = base.map(c => ({
      x: x + c.x * W,
      y: y + c.y * H,
      r: c.r * W
    }));
  }

  el.style.left = x + "px";
  el.style.top = y + "px";

  world.appendChild(el);
  clouds.push({ x, y, el, circles });
}


// ========= DARK CLOUDS =========

const darkClouds = [];
const DARK_W = 280 * 1.5;
const DARK_H = 187 * 1.5;

const DARK_RECTS = [
  { w: 0.1892857, h: 0.0855615, x: 0.4178571, y: 0.1925134 },
  { w: 0.4321429, h: 0.1176471, x: 0.2964286, y: 0.2780749 },
  { w: 0.5857143, h: 0.0802139, x: 0.2071429, y: 0.3957219 },
  { w: 0.7714286, h: 0.2139037, x: 0.1250000, y: 0.4759358 }
];

=======
// Dark cloud state
>>>>>>> 1b90251 (stuff)
let grabbedByDarkCloud = false;
let releaseTime = 0;
let grabbedCloud = null;
let freezeX = 0, freezeY = 0;
let skeletonFlashInterval = null;

// Stop detection
let stopMethod = 'ground';
let stopAtY = GROUND_Y;
let gameStopped = false;

const DEBUG = true;

// ===============================================================
// LOCAL PHYSICS (Self-contained - no imports needed)
// ===============================================================

<<<<<<< HEAD
  darkClouds.push({ x, y, el, rects });
}

function spawnWorld() {
  if (!bonusMode) {
    for (let i = 0; i < cloudquantity; i++) spawnCloud(randX(), spawnY());
  }
  for (let i = 0; i < darkcloudquantity; i++) spawnDarkCloud(randX(), spawnY());
  spawnBlackHoles(blackholequantity);
  spawnTanks(TANK_COUNT);
  spawnCamps(CAMP_COUNT);

  const pushableQty = bonusMode ? 2000 : 20;
  spawnPushables(pushableQty);
}
spawnWorld();
spawnCollectibles(PRESET_SPAWN_COUNT);

// ========= PLAYER COLLIDERS =========

const ELLIPSES = [
  { x: 0.2357, y: 0.0190, w: 0.4357, h: 0.4048 }
];

const RECTS = [
  { x: 0.1071, y: 0.3905, w: 0.6857, h: 0.3476 },
  { x: 0.2214, y: 0.7333, w: 0.4571, h: 0.2381 }
];

function getPlayerColliders() {
  const list = [];

  const centerX = camX + PLAYER_X;
  const centerY = camY + PLAYER_Y;

  function rotatePoint(x, y) {
    const dx = x - centerX;
    const dy = y - centerY;
    const cos = Math.cos(angle);
    const sin = Math.sin(angle);

    return {
      x: centerX + dx * cos - dy * sin,
      y: centerY + dx * sin + dy * cos
    };
  }

  for (const e of ELLIPSES) {
    const w = e.w * PLAYER_W;
    const h = e.h * PLAYER_H;
    const r = Math.min(w, h) / 2;
    const ex = ((e.x + e.w / 2) - 0.5) * PLAYER_W;
    const ey = ((e.y + e.h / 2) - 0.5) * PLAYER_H;
    const rot = rotatePoint(centerX + ex, centerY + ey);
    list.push({ x: rot.x, y: rot.y, r });
  }

  for (const rct of RECTS) {
    const w = rct.w * PLAYER_W;
    const h = rct.h * PLAYER_H;
    const r = Math.min(w, h) / 2;
    const rx = ((rct.x + rct.w / 2) - 0.5) * PLAYER_W;
    const ry = ((rct.y + rct.h / 2) - 0.5) * PLAYER_H;
    const rot = rotatePoint(centerX + rx, centerY + ry);
    list.push({ x: rot.x, y: rot.y, r });
  }

  return list;
}

// ========= DEBUG COLLIDERS =========

const debugCanvas = document.getElementById("debugColliders");
const dctx = debugCanvas.getContext("2d");
debugCanvas.width = SCREEN_W;
debugCanvas.height = SCREEN_H;

function drawDebugColliders() {
  dctx.clearRect(0, 0, debugCanvas.width, debugCanvas.height);
  const cols = getPlayerColliders();
  cols.forEach(c => {
    dctx.beginPath();
    dctx.arc(c.x - camX, c.y - camY, c.r, 0, Math.PI * 2);
    dctx.strokeStyle = "rgba(255,200,0,0.9)";
    dctx.lineWidth = 3;
    dctx.stroke();

    dctx.beginPath();
    dctx.arc(c.x - camX, c.y - camY, 2, 0, Math.PI * 2);
    dctx.fillStyle = "red";
    dctx.fill();
  });

  // Draw black hole colliders
  blackHoles.forEach(bh => {
    const bx = bh.x + BH_SIZE / 2;
    const by = bh.y + BH_SIZE / 2;
    dctx.beginPath();
    dctx.arc(bx - camX, by - camY, BH_RADIUS, 0, Math.PI * 2);
    dctx.strokeStyle = "rgba(0,255,0,0.9)"; // Green for black holes
    dctx.lineWidth = 2;
    dctx.stroke();

    dctx.beginPath();
    dctx.arc(bx - camX, by - camY, 2, 0, Math.PI * 2);
    dctx.fillStyle = "green";
    dctx.fill();
  });

  // Draw collectible colliders
  collectibles.forEach(c => {
    dctx.beginPath();
    dctx.arc(c.x - camX, c.y - camY, 85, 0, Math.PI * 2);
    dctx.strokeStyle = "rgba(255,0,255,0.9)"; // Magenta for collectibles
    dctx.lineWidth = 2;
    dctx.stroke();

    dctx.beginPath();
    dctx.arc(c.x - camX, c.y - camY, 2, 0, Math.PI * 2);
    dctx.fillStyle = "magenta";
    dctx.fill();
  });

  // Draw pushable colliders
  pushables.forEach(p => {
    dctx.beginPath();
    dctx.arc(p.x + 275 - camX, p.y + 275 - camY, 150, 0, Math.PI * 2);
    dctx.strokeStyle = "rgba(0,255,255,0.9)"; // Cyan for pushables
    dctx.lineWidth = 2;
    dctx.stroke();

    dctx.beginPath();
    dctx.arc(p.x + 275 - camX, p.y + 275 - camY, 2, 0, Math.PI * 2);
    dctx.fillStyle = "cyan";
    dctx.fill();
  });
}

// ========= PHYSICS =========

const MASS = 2.0;

function restitutionFromSpeed(v) {
  const s = Math.min(Math.abs(v), 40);
  if (s < 1) return 0;
  if (s < 8) return 0.1;
  if (s < 14) return 0.3;
  if (s < 22) return 0.5;
  if (s < 30) return 0.6;
  return 0.5;
}

function recycleClouds() {
  const MAX_CLOUD_H = Math.max(CLOUD1_H, CLOUD2_H);

  const TOP_LIMIT = DEADZONE;
  const BOTTOM_LIMIT = GROUND_Y - DEADZONE - MAX_CLOUD_H;

  for (let c of clouds) {

    if (c.y < TOP_LIMIT - REUSE_DISTANCE) {
      c.y = BOTTOM_LIMIT - Math.random() * 1200;
      c.x = randX();
=======
function applyPhysics(onGround) {
    // Gravity
    if (!onGround) {
        velY = Math.min(velY + GRAVITY, MAX_FALL);
>>>>>>> 1b90251 (stuff)
    }
    
    // Update position
    camX += velX;
    camY += velY;
    
    // Friction
    velX *= onGround ? GROUND_FRICTION : AIR_FRICTION;
    
    // Angular
    angVel *= onGround ? 0.4 : 0.992;
    angle += angVel;
}

function resolveCollisions() {
    let onGround = false;
    const px = camX + PLAYER_X;
    const py = camY + PLAYER_Y;
    const pr = PLAYER_RADIUS;
    
    // Cloud collisions
    for (const cloud of clouds) {
        const dx = px - cloud.x;
        const dy = py - cloud.centerY;
        const distSq = dx * dx + dy * dy;
        const minDist = pr + cloud.radius;
        
        if (distSq < minDist * minDist && distSq > 0.001) {
            const dist = Math.sqrt(distSq);
            const nx = dx / dist;
            const ny = dy / dist;
            const overlap = minDist - dist;
            
            // Push out
            camX += nx * overlap * 0.6;
            camY += ny * overlap * 0.6;
            
            const relVel = velX * nx + velY * ny;
            
            if (relVel < 0) {
                const influence = cloud.influence || {};
                const role = cloud.role || 'normal';
                
                if (role === 'stopper') {
                    velX *= 0.4;
                    velY *= -0.05;
                    if (Math.abs(velY) < 2) velY = 0;
                } else if (role === 'ambient') {
                    // Weak interaction for ambient clouds
                    const bounce = 0.15;
                    velX -= (1 + bounce) * relVel * nx * 0.3;
                    velY -= (1 + bounce) * relVel * ny * 0.3;
                    velX *= 0.98;
                    velY *= 0.98;
                } else {
                    // Normal cloud bounce
                    const bounce = influence.bounce ?? CLOUD_BOUNCE;
                    velX -= (1 + bounce) * relVel * nx;
                    velY -= (1 + bounce) * relVel * ny;
                    
                    const friction = influence.friction ?? CLOUD_FRICTION;
                    const tangX = velX - (velX * nx + velY * ny) * nx;
                    const tangY = velY - (velX * nx + velY * ny) * ny;
                    velX -= tangX * (1 - friction);
                    velY -= tangY * (1 - friction);
                    
                    // Apply influence deltas
                    velX += influence.vx_delta || 0;
                    velY += influence.vy_delta || 0;
                    
                    velX *= 0.92;
                    velY *= 0.92;
                }
                
                // Add some spin on collision
                angVel += (nx * velY - ny * velX) * 0.01;
            }
        }
    }
    
    // Ground collision
    if (py + pr >= GROUND_COLLISION_Y) {
        camY = GROUND_COLLISION_Y - pr - PLAYER_Y;
        if (velY > 2) {
            velY = -velY * 0.2;
            velX *= 0.7;
        } else {
            velY = 0;
            velX *= GROUND_FRICTION;
            onGround = true;
        }
    }
    
    return onGround;
}

function checkFlip() {
    angleAccumulator += angVel;
    if (Math.abs(angleAccumulator) >= Math.PI * 2) {
        showFlipText(angleAccumulator > 0 ? "BACKFLIP!" : "FRONTFLIP!");
        angleAccumulator = 0;
    }
}

// ===============================================================
// INITIALIZATION
// ===============================================================

function init() {
    scaleGame();
    window.addEventListener("resize", scaleGame);
    
    createStarfield();
    createPlane();
    setupGround();
    updateBalanceUI();
    setupEventListeners();
    
    if (!gameLoopRunning) {
        gameLoopRunning = true;
        requestAnimationFrame(update);
    }
    
    console.log("🎮 Drop the Boss - Ready!");
}

function scaleGame() {
    const scale = Math.min(
        window.innerWidth / SCREEN_W,
        window.innerHeight / SCREEN_H
    ) * 0.9;
    gameScale.style.setProperty('--game-scale', scale);
}

function setupGround() {
    ground.style.height = (GROUND_HEIGHT * 1.3) + "px";
    ground.style.top = GROUND_Y + "px";
    ground.style.width = "16400px";
    ground.style.backgroundSize = "8200px 130%";
}

// ===============================================================
// UI CONTROLS
// ===============================================================

function updateBalanceUI() {
    balanceEl.textContent = `Balance ₹${balance.toFixed(2)}`;
    betInput.value = betAmount;
    betBtn.disabled = betAmount > balance || betAmount <= 0 || fallStarted || betPlaced || isDying;
}

function lockBetUI() {
    plusBtn.disabled = minusBtn.disabled = betInput.disabled = betBtn.disabled = true;
    document.querySelectorAll(".chip").forEach(c => c.disabled = true);
}

function unlockBetUI() {
    plusBtn.disabled = minusBtn.disabled = betInput.disabled = betBtn.disabled = false;
    document.querySelectorAll(".chip").forEach(c => c.disabled = false);
}

function showMultiplier(m) {
    multiplierEl.textContent = `×${m.toFixed(2)}`;
    multiplierEl.style.display = "block";
}

function hideMultiplier() {
    multiplierEl.style.display = "none";
}

function showFlipText(text) {
    flipTextEl.textContent = text;
    flipTextEl.style.display = "block";
    setTimeout(() => flipTextEl.style.display = "none", 600);
}

function showScore() {
    scoreEl.textContent = `₹${displayedScore.toFixed(2)}`;
}

function updateDebug() {
    if (!DEBUG || !debugEl) return;
    
    const playerY = camY + PLAYER_Y;
    const speed = Math.hypot(velX, velY);
    
    debugEl.innerHTML = `
        Pos: (${(camX + PLAYER_X).toFixed(0)}, ${playerY.toFixed(0)})<br>
        Vel: (${velX.toFixed(2)}, ${velY.toFixed(2)}) | Speed: ${speed.toFixed(2)}<br>
        Outcome: ${currentSession?.outcomeType || 'N/A'}<br>
        Target: ₹${currentSession?.targetPayout || 0}<br>
        Score: ₹${displayedScore.toFixed(2)}<br>
        Clouds: ${clouds.length}<br>
        FallStarted: ${fallStarted}
    `;
}

function setupEventListeners() {
    plusBtn.onclick = () => {
        if (fallStarted || betPlaced || isDying) return;
        if (betAmount + 10 <= balance) betAmount += 10;
        updateBalanceUI();
    };
    
    minusBtn.onclick = () => {
        if (fallStarted || betPlaced || isDying) return;
        betAmount = Math.max(1, betAmount - 10);
        updateBalanceUI();
    };
    
    betInput.oninput = () => {
        if (fallStarted || betPlaced || isDying) return;
        betAmount = Math.max(1, Math.min(balance, Number(betInput.value) || 1));
        updateBalanceUI();
    };
    
    document.querySelectorAll(".chip").forEach(c => {
        c.onclick = () => {
            if (fallStarted || betPlaced || isDying) return;
            const v = c.dataset.v;
            if (v === "max") betAmount = balance;
            else betAmount = Math.min(balance, betAmount + Number(v));
            updateBalanceUI();
        };
    });
    
    bonusToggle.onclick = () => {
        if (fallStarted || betPlaced || isDying) return;
        bonusMode = !bonusMode;
        bonusToggle.classList.toggle("active");
    };
    
    betBtn.onclick = placeBet;
}

// ===============================================================
// BACKGROUND
// ===============================================================

function createStarfield() {
    const sf = document.getElementById('starfield');
    sf.innerHTML = '';
    for (let i = 0; i < 200; i++) {
        const star = document.createElement('div');
        star.className = 'star';
        star.style.left = Math.random() * 100 + '%';
        star.style.top = Math.random() * 100 + '%';
        star.style.animationDelay = Math.random() * 2 + 's';
        sf.appendChild(star);
    }
}

function createPlane() {
    const existing = world.querySelector('.plane');
    if (existing) existing.remove();
    
    const plane = document.createElement("div");
    plane.className = "plane";
    plane.style.cssText = `
        width: ${SCREEN_W}px;
        height: ${SCREEN_H}px;
        background: url('items/plane.png') no-repeat center/contain;
        position: absolute;
        left: 0;
        top: 0;
        z-index: -1;
    `;
    world.appendChild(plane);
}

// ===============================================================
// SCORE FROM BACKEND
// ===============================================================

function getScoreAtY(y) {
    if (!scoreProgression || scoreProgression.length === 0) {
        return 0;
    }

    for (let i = 0; i < scoreProgression.length - 1; i++) {
        const a = scoreProgression[i];
        const b = scoreProgression[i + 1];

        if (y >= a.y && y <= b.y) {
            const t = (y - a.y) / (b.y - a.y);
            return a.score + (b.score - a.score) * t;
        }
    }

    const last = scoreProgression[scoreProgression.length - 1];
    return y >= last.y ? last.score : 0;
}

function updateScoreFromPosition() {
    const playerY = camY + PLAYER_Y;
    displayedScore = getScoreAtY(playerY);
    showScore();
}

// ===============================================================
// API COMMUNICATION
// ===============================================================

async function placeBet(event) {
    if (event) {
        event.preventDefault();
        event.stopImmediatePropagation();
    }

    if (fallStarted || betPlaced || isDying || isPlacingBet) return;

    isPlacingBet = true;
    betBtn.disabled = true;

    const effectiveBet = bonusMode ? betAmount * 10 : betAmount;
    if (effectiveBet > balance || effectiveBet < 1) {
        isPlacingBet = false;
        betBtn.disabled = false;
        return;
    }
    
    try {
        console.log("📡 Placing bet...");
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
            console.error('Bet failed:', res.status);
            isPlacingBet = false;
            betBtn.disabled = false;
            return;
        }
        
        const data = await res.json();
        console.log('🎯 Game Generated:', data.outcomeType, '→ ₹' + data.targetPayout);
        
        currentSession = {
            id: data.sessionId,
            targetPayout: data.targetPayout,
            multiplier: data.multiplier,
            outcomeType: data.outcomeType
        };
        currentScript = data.script;
        balance = data.balance;
        updateBalanceUI();
        
        scoreProgression = data.script.scoreProgression || [];
        stopAtY = data.script.stopAtY || GROUND_Y;
        stopMethod = data.script.stopMethod || 'ground';
        targetScore = data.targetPayout;
        
        visualRng = createRNG(data.seed).visual;
        
        if (currentScript.immediateDeath) {
            betPlaced = true;
            lockBetUI();
            startDeathAnimation(currentScript.deathAnimation || 'implode');
        } else {
            startGame();
        }
    } catch (e) {
        console.error('Bet error:', e);
        isPlacingBet = false;
        betBtn.disabled = false;
    }
}

async function resolveGame() {
    if (!currentSession) return;
    
    try {
        const res = await fetch('/api/resolve', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                sessionId: currentSession.id,
                userId: 'default'
            })
        });
        
        const data = await res.json();
        balance = data.balance;
        displayedScore = data.payout;
        updateBalanceUI();
        showScore();
    } catch (e) {
        console.error('Resolve error:', e);
    }
}

async function cancelGame() {
    if (!currentSession) return;
    
    try {
        await fetch('/api/cancel', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                sessionId: currentSession.id,
                userId: 'default'
            })
        });
        
        const res = await fetch('/api/balance?userId=default');
        balance = (await res.json()).balance;
        updateBalanceUI();
    } catch (e) {
        console.error('Cancel error:', e);
    }
}

// ===============================================================
// DEATH ANIMATION
// ===============================================================

function startDeathAnimation(type = 'implode') {
    console.log("💀 IMMEDIATE DEATH");
    
    isDying = true;
    deathAnimStart = performance.now();
    deathAnimType = type;
    
    camX = camY = 0;
    angle = 0;
    
    sprite.style.display = "block";
    sprite.style.opacity = "1";
    skeleton.style.display = "none";
    
    render();
}

function updateDeathAnimation() {
    const elapsed = performance.now() - deathAnimStart;
    const progress = Math.min(elapsed / DEATH_ANIM_DURATION, 1);
    
    if (deathAnimType === 'implode') {
        let scale, rotation, opacity = 1;
        const shake = Math.sin(elapsed / 20) * (1 - progress) * 15;
        
        if (progress < 0.2) {
            scale = 1 + (progress / 0.2) * 0.4;
            rotation = 0;
        } else if (progress < 0.7) {
            scale = 1.4 - (progress - 0.2) * 0.2;
            rotation = (progress - 0.2) * Math.PI * 3;
            
            const flashPeriod = 100 - progress * 60;
            const showSkel = Math.floor(elapsed / flashPeriod) % 2 === 0;
            sprite.style.display = showSkel ? "none" : "block";
            skeleton.style.display = showSkel ? "block" : "none";
        } else {
            const shrinkT = (progress - 0.7) / 0.3;
            scale = 1.2 * (1 - shrinkT * shrinkT);
            rotation = Math.PI * 3 + shrinkT * Math.PI * 2;
            opacity = 1 - shrinkT;
            
            sprite.style.display = "block";
            skeleton.style.display = "block";
        }
        
        const transform = `translate(calc(-50% + ${shake}px), -50%) scale(${Math.max(0, scale)}) rotate(${rotation}rad)`;
        sprite.style.transform = transform;
        skeleton.style.transform = transform;
        sprite.style.opacity = opacity;
        skeleton.style.opacity = opacity;
    }
    
    if (progress >= 1) {
        finishDeath();
        return false;
    }
    
    return true;
}

function finishDeath() {
    isDying = false;
    displayedScore = 0;
    
    sprite.style.display = "none";
    skeleton.style.display = "none";
    sprite.style.opacity = "1";
    skeleton.style.opacity = "1";
    sprite.style.transform = "translate(-50%, -50%)";
    skeleton.style.transform = "translate(-50%, -50%)";
    
    if (runOverEl) {
        runOverEl.innerHTML = `
            <div style="font-size: 72px; margin-bottom: 20px;">💀</div>
            <div>DEAD</div>
            <div style="font-size: 24px; margin-top: 10px;">Lost ₹${betAmount.toFixed(2)}</div>
        `;
        runOverEl.style.display = "flex";
    }
    
    cancelGame();
    setTimeout(resetWorld, 2500);
}

// ===============================================================
// GAME FLOW
// ===============================================================

function startGame() {
    console.log("🚀 Starting game...");
    
    clearWorld();
    spawnFromScript(currentScript);
    
    // CRITICAL: Initialize physics state
    camX = 0;
    camY = SPAWN_START_Y - PLAYER_Y;  // Start at correct spawn position
    velX = 0;
    velY = 5;  // Initial downward velocity
    angle = 0;
    angVel = 0;
    angleAccumulator = 0;
    displayedScore = 0;
    landedTime = 0;
    gameStopped = false;
    
    // Set game flags
    inBlackHole = false;
    bhAnimating = false;
    grabbedByDarkCloud = false;
    fallStarted = true;  // THIS ENABLES PHYSICS
    betPlaced = true;
    betResolved = false;
    isPlacingBet = false;
    
    // Show sprite
    sprite.style.display = "block";
    sprite.style.opacity = "1";
    sprite.style.transform = "translate(-50%, -50%)";
    skeleton.style.display = "none";
    
    lockBetUI();
    
    console.log(`   Outcome: ${currentSession.outcomeType} → ₹${currentSession.targetPayout}`);
    console.log(`   Stop at Y=${stopAtY} (${stopMethod})`);
    console.log(`   Clouds: ${clouds.length}`);
    console.log(`   fallStarted: ${fallStarted}`);
}

function clearWorld() {
    [...clouds, ...darkClouds, ...blackHoles, ...collectibles].forEach(o => o.el?.remove());
    clouds.length = 0;
    darkClouds.length = 0;
    blackHoles.length = 0;
    collectibles.length = 0;
    if (tank?.el) tank.el.remove();
    if (camp?.el) camp.el.remove();
    tank = camp = null;
}

function spawnFromScript(script) {
    if (!script) return;
    
    for (const s of script.spawns || []) {
        switch (s.type) {
            case 'cloud':
                spawnCloud(s);
                break;
            case 'darkcloud':
                spawnDarkCloud(s.x, s.y);
                break;
            case 'blackhole':
                spawnBlackHole(s.x, s.y, s.multiplier, s.payout);
                break;
        }
    }
    
    for (const g of script.groundObjects || []) {
        if (g.type === 'tank') spawnTank(g.x, g.y, g.payout);
        else if (g.type === 'camp') spawnCamp(g.x, g.y, g.payout);
    }
    
    for (const c of script.collectibles || []) {
        spawnCollectible(c.x, c.y, c.type);
    }
    
    console.log(`☁️ Spawned: ${clouds.length} clouds, ${darkClouds.length} dark, ${blackHoles.length} BH`);
}

// ===============================================================
// SPAWNERS
// ===============================================================

function spawnCloud(data) {
    const pick = visualRng() < 0.5 ? 1 : 2;
    const el = document.createElement("div");
    el.className = "cloud";
    
    let W, H;
    if (pick === 1) {
        W = CLOUD1_W;
        H = CLOUD1_H;
        el.style.background = "url('clouds/cloud4.png') no-repeat center/contain";
    } else {
        W = CLOUD2_W;
        H = CLOUD2_H;
        el.style.background = "url('clouds/cloud2.png') no-repeat center/contain";
    }
    
    const scale = (data.radius || CLOUD_RADIUS) / 100;
    W *= scale;
    H *= scale;
    
    const role = data.role || 'normal';
    
    if (role === 'stopper') {
        el.style.filter = "brightness(0.8) saturate(1.2)";
        el.style.opacity = "0.9";
    } else if (role === 'redirect') {
        el.style.opacity = "0.95";
    } else if (role === 'ambient') {
        el.style.opacity = "0.6";
    }
    
    el.style.width = W + "px";
    el.style.height = H + "px";
    el.style.left = (data.x - W / 2) + "px";
    el.style.top = data.y + "px";
    el.style.position = "absolute";
    world.appendChild(el);
    
    const centerY = data.centerY || (data.y + H * 0.5);
    
    clouds.push({
        x: data.x,
        y: data.y,
        centerY: centerY,
        radius: data.radius || CLOUD_RADIUS,
        el,
        role,
        influence: data.influence || {},
        W, H
    });
}

function spawnDarkCloud(x, y) {
    const el = document.createElement("div");
    el.className = "dark-cloud";
    el.style.width = DARK_W + "px";
    el.style.height = DARK_H + "px";
    el.style.left = (x - DARK_W / 2) + "px";
    el.style.top = y + "px";
    el.style.position = "absolute";
    world.appendChild(el);
    
    const rects = DARK_RECTS.map(r => ({
        x: (x - DARK_W / 2) + r.x * DARK_W,
        y: y + r.y * DARK_H,
        w: r.w * DARK_W,
        h: r.h * DARK_H
    }));
    
    darkClouds.push({ x: x - DARK_W / 2, y, el, rects });
}

function spawnBlackHole(x, y, mult, payout) {
    const el = document.createElement("div");
    el.className = "black-hole";
    el.style.width = BH_SIZE + "px";
    el.style.height = BH_SIZE + "px";
    el.style.left = (x - BH_SIZE / 2) + "px";
    el.style.top = y + "px";
    el.style.position = "absolute";
    el.style.background = "url('items/black_hole_1.png') no-repeat center/contain";
    world.appendChild(el);
    
    blackHoles.push({
        x: x - BH_SIZE / 2,
        y,
        el,
        rotation: 0,
        multiplier: mult || 5,
        payout: payout || 0
    });
}

function spawnTank(x, y, payout) {
    const W = 400, H = 300;
    const el = document.createElement("div");
    el.className = "tank";
    el.style.cssText = `
        width: ${W}px;
        height: ${H}px;
        left: ${x - W/2}px;
        top: ${y - H}px;
        position: absolute;
        background: url('items/tank.png') no-repeat center/contain;
    `;
    world.appendChild(el);
    tank = { x: x - W/2, y: y - H, el, w: W, h: H, multiplier: 5, payout: payout || 0 };
}

function spawnCamp(x, y, payout) {
    const W = 800, H = 600;
    const el = document.createElement("div");
    el.className = "military-camp";
    el.style.cssText = `
        width: ${W}px;
        height: ${H}px;
        left: ${x - W/2}px;
        top: ${y - H}px;
        position: absolute;
        background: url('items/camp.png') no-repeat center/contain;
    `;
    world.appendChild(el);
    camp = { x: x - W/2, y: y - H, el, w: W, h: H, multiplier: 50, payout: payout || 0 };
}

function spawnCollectible(x, y, type) {
    const SIZE = 80;
    const el = document.createElement("div");
    el.className = type === 'nuke' ? 'collectible nuke' : 'collectible note';
    el.style.cssText = `
        width: ${SIZE}px;
        height: ${SIZE}px;
        left: ${x - SIZE/2}px;
        top: ${y - SIZE/2}px;
        position: absolute;
        background: url('items/${type === 'nuke' ? 'nuke' : 'notes'}.png') no-repeat center/contain;
    `;
    world.appendChild(el);
    collectibles.push({ x, y, el, type, collected: false });
}

// ===============================================================
// STOP DETECTION
// ===============================================================

function checkShouldStop() {
    if (gameStopped) return true;
    
    const playerY = camY + PLAYER_Y;
    const speed = Math.hypot(velX, velY);
    
    if (playerY >= stopAtY - 250 && speed < 3.5) {
        if (landedTime === 0) {
            landedTime = performance.now();
        } else if (performance.now() - landedTime > 800) {
            console.log(`🛑 Reached stop at Y=${playerY.toFixed(0)}`);
            displayedScore = targetScore;
            gameStopped = true;
            completeGame();
            return true;
        }
    } else {
        landedTime = 0;
    }
    
    return false;
}

// ===============================================================
// GAME END
// ===============================================================

function completeGame() {
    if (betResolved) return;
    
    console.log(`🎉 Complete: ₹${displayedScore.toFixed(2)}`);
    betResolved = true;
    fallStarted = false;
    gameStopped = true;
    
    resolveGame();
    
    if (runOverEl) {
        runOverEl.innerHTML = displayedScore > 0
            ? `<div style="color: #0f0;">WIN!</div><div>₹${displayedScore.toFixed(2)}</div>`
            : `<div>GAME OVER</div>`;
        runOverEl.style.display = "flex";
    }
    
    setTimeout(resetWorld, 2500);
}

function resetWorld() {
    clearWorld();

    camX = camY = velX = velY = angle = angVel = 0;
    displayedScore = 0;
    targetScore = 0;
    scoreProgression = [];
    landedTime = 0;
    isDying = false;
    gameStopped = false;
    stopAtY = GROUND_Y;
    stopMethod = 'ground';

    currentSession = currentScript = null;
    visualRng = Math.random;

    betPlaced = betResolved = fallStarted = false;
    inBlackHole = bhAnimating = grabbedByDarkCloud = exitingAnimation = false;
    isPlacingBet = false;

    if (skeletonFlashInterval) {
        clearInterval(skeletonFlashInterval);
        skeletonFlashInterval = null;
    }

    skeleton.style.display = "none";
    sprite.style.display = "block";
    sprite.style.opacity = "1";
    sprite.style.transform = "translate(-50%, -50%)";

    unlockBetUI();
    updateBalanceUI();

    if (runOverEl) setTimeout(() => runOverEl.style.display = "none", 500);

    hideMultiplier();
    createPlane();
    render();
}

// ===============================================================
// MAIN GAME LOOP
// ===============================================================

function update() {
<<<<<<< HEAD
  if (!introFinished) return;

if (bhAnimating) {
  const now = performance.now();
  const elapsed = now - bhAnimStartTime;
  const progress = Math.min(elapsed / bhAnimDuration, 1);
  const currentSize = bhAnimStartSize + (bhAnimEndSize - bhAnimStartSize) * progress;

  bhAnimEl.style.width = currentSize + "px";
  bhAnimEl.style.height = currentSize + "px";
  bhAnimEl.style.left = (parseFloat(bhAnimEl.dataset.x) - currentSize / 2) + "px";
  bhAnimEl.style.top = (parseFloat(bhAnimEl.dataset.y) - currentSize / 2) + "px";

  if (progress >= 1) {
    bhAnimating = false;
    if (bhAnimType === 'enter') {
      enterBlackHoleLogic();
    }
    bhAnimEl.remove();
    bhAnimEl = null;
  }

  render();
  requestAnimationFrame(update);
  return;
}

if (exitingAnimation) {
  const now = performance.now();
  const elapsed = now - exitAnimStart;
  const duration = 1000; // 1 second animation
  const progress = Math.min(elapsed / duration, 1);

  // Simple scale animation
  const scale = 1 + Math.sin(progress * Math.PI) * 0.2;
  sprite.style.transform = `translate(-50%, -50%) scale(${scale}) rotate(${angle}rad)`;

  if (progress >= 1) {
    exitingAnimation = false;
    sprite.style.transform = `translate(-50%, -50%) rotate(${angle}rad)`;
  }

  render();
  requestAnimationFrame(update);
  return;
}

if (inBlackHole) {
  const now = performance.now();
  const elapsed = now - bhStartTime;

  if (bhShowcaseStart === 0) {
    camY -= BH_RISE_SPEED;

    // Update void sprites
    voidSprites.forEach(sprite => {
      sprite.y += sprite.speed;
      sprite.el.style.left = sprite.x + "px";
      sprite.el.style.top = sprite.y + "px";
    });

    const riseHeight = VOID_START_Y - camY;

    bhCurrentMultiplier = Math.min(16, 1 + (riseHeight / 120)); // Increase based on rise height, reaching ~16x at 120 height
    showMultiplier(bhCurrentMultiplier);

    if (bhCurrentMultiplier >= bhTargetMultiplier) {
      finalEarnings = earnings * bhCurrentMultiplier;
      bhShowcaseStart = now;
    }
  } else {
    // Showcase phase: display multiplier and animate score from original to multiplied for 1 second
    const showcaseElapsed = now - bhShowcaseStart;
    const progress = Math.min(showcaseElapsed / 1000, 1);
    showcaseScore = originalEarnings + (finalEarnings - originalEarnings) * progress;
    showMultiplier(bhCurrentMultiplier);
    if (showcaseElapsed >= 1000) {
      earnings = finalEarnings;
      exitBlackHole();
      bhShowcaseStart = 0;
    }
  }

  showScore();
  render();
  requestAnimationFrame(update);
  return;
}




  if (grabbedByDarkCloud) {
    camX = freezeX;
    camY = freezeY;

    if (performance.now() >= releaseTime) {
      grabbedByDarkCloud = false;
      if (grabbedCloud) {
        grabbedCloud.el.remove();
        darkClouds.splice(darkClouds.indexOf(grabbedCloud), 1);
        grabbedCloud = null;
      }
      if (skeletonFlashInterval) clearInterval(skeletonFlashInterval);
      skeletonFlashInterval = null;
      skeleton.style.display = "none";
      sprite.style.display = "block";
      const angleSpread = (Math.random() * Math.PI / 2.2) - (Math.PI / 4.4);
      const power = 28;
      velX = Math.sin(angleSpread) * power;
      velY = -Math.cos(angleSpread) * power;
      angVel = (Math.random() - 0.5) * 0.08;
    }

    render();
    requestAnimationFrame(update);

    

    return;
  }

  recycleClouds();
  recycleDarkClouds();
  recycleBlackHoles();
  recyclePushables();

  // Update black hole rotations if player is within 2000x2000 pixel range
  for (let bh of blackHoles) {
    const playerX = camX + PLAYER_X;
    const playerY = camY + PLAYER_Y;
    const bhCenterX = bh.x + BH_SIZE / 2;
    const bhCenterY = bh.y + BH_SIZE / 2;
    const dx = Math.abs(bhCenterX - playerX);
    const dy = Math.abs(bhCenterY - playerY);
    if (dx <= 1000 && dy <= 1000) {
      bh.rotation += 0.05;
      bh.el.style.transform = `rotate(${bh.rotation}rad)`;
    }
  }

  const onGround = resolveCollisions();

  if (fallStarted && !onGround) velY += GRAVITY;
  velY = Math.min(velY, MAX_FALL);

  camX += velX;
  camY += velY;

  // Update pushable positions
  for (const p of pushables) {
    p.x += p.velX;
    p.y += p.velY;
    p.velX *= 0.95; // Apply friction
    p.velY *= 0.95;
  }

  velX *= onGround ? GROUND_FRICTION : AIR_FRICTION;
  angVel *= onGround ? 0.35 : 0.989;

  angle += angVel;

  // Detect flips
  const angleChange = angVel;
  angleAccumulator += angleChange;
  if (Math.abs(angleAccumulator) >= 2 * Math.PI) {
    const flipType = angleAccumulator > 0 ? "backflip" : "frontflip";
    showFlipText(flipType);
    angleAccumulator = 0;
  }

  if (betPlaced && fallStarted && velY > 0 && !fallScorePaused) {
    const fallDistance = camY - lastCamY;
    if (fallDistance > 2)
      earnings += fallDistance * Math.sqrt(betAmount) * 0.00015;
  }

  function checkPickup(arr) {
    const playerColliders = getPlayerColliders();
    const itemRadius = 85; // Assuming 170px width/height, so radius 85

    for (let i = arr.length - 1; i >= 0; i--) {
      const c = arr[i];
      let pickedUp = false;

      for (const pc of playerColliders) {
        const dx = pc.x - c.x;
        const dy = pc.y - c.y;
        const distSq = dx * dx + dy * dy;
        const minDist = pc.r + itemRadius;

        if (distSq < minDist * minDist) {
          pickedUp = true;
          break;
=======
    if (!gameLoopRunning) return;
    
    // Death animation
    if (isDying) {
        if (updateDeathAnimation()) {
            render();
>>>>>>> 1b90251 (stuff)
        }
        requestAnimationFrame(update);
        return;
    }
    
    // Normal gameplay - THIS IS THE KEY SECTION
    if (fallStarted && !gameStopped) {
        // Apply collisions first
        const onGround = resolveCollisions();

        // Check if we should stop
        if (checkShouldStop()) {
            render();
            requestAnimationFrame(update);
            return;
        }

        // Apply physics (gravity, movement)
        applyPhysics(onGround);
        
        // Check for flips
        checkFlip();
        
        // Update score display
        updateScoreFromPosition();
    }
<<<<<<< HEAD
  } else {
    landedTime = 0;
  }

  lastCamY = camY;
  render();
  checkStuck();
  requestAnimationFrame(update);
  updateGroundEntitiesVisibility();

=======
    
    render();
    updateDebug();
    requestAnimationFrame(update);
>>>>>>> 1b90251 (stuff)
}

// ===============================================================
// RENDER
// ===============================================================

function render() {
    scoreEl.textContent = `₹${displayedScore.toFixed(2)}`;
    world.style.transform = `translate(${-camX}px, ${-camY}px)`;
    
    if (!isDying) {
        sprite.style.left = `${PLAYER_X}px`;
        sprite.style.top = `${PLAYER_Y}px`;
        sprite.style.transform = `translate(-50%, -50%) rotate(${angle}rad)`;
        
        skeleton.style.left = `${PLAYER_X}px`;
        skeleton.style.top = `${PLAYER_Y}px`;
        skeleton.style.transform = `translate(-50%, -50%) rotate(${angle}rad)`;
    }
}

// ===============================================================
// VISIBILITY
// ===============================================================

document.addEventListener("visibilitychange", () => {
    if (document.hidden && fallStarted && !betResolved) {
        displayedScore = 0;
        cancelGame();
        if (runOverEl) {
            runOverEl.innerHTML = "CRASHED<br>Tab Hidden";
            runOverEl.style.display = "flex";
        }
        setTimeout(resetWorld, 2000);
    }
});

// ===============================================================
// START!
// ===============================================================

init();