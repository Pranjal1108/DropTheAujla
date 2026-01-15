// === PERFORMANCE CONSTANTS ===
const REUSE_DISTANCE = 1500;
const CLOUD_RESPAWN_AHEAD = 5000;

const gameScale = document.getElementById("game-scale");
function scaleGame() {
  const scale = Math.min(window.innerWidth / 1920, window.innerHeight / 1200);
  gameScale.style.setProperty('--game-scale', scale);
}
window.addEventListener("resize", scaleGame);
scaleGame();

const world = document.getElementById("world");
const player = document.getElementById("player");
const scoreEl = document.getElementById("score");
world.style.pointerEvents = "none";

const betInput = document.getElementById("betAmount");
const betBtn = document.getElementById("placeBet");
const plusBtn = document.getElementById("plus");
const minusBtn = document.getElementById("minus");
balanceEl = document.getElementById("balance");
const ground = document.getElementById("ground");

let balance = 1000;
let betAmount = 10;

const SCREEN_W = 1920;
const SCREEN_H = 1200;

const WORLDH = 20000;
world.style.height = WORLDH + "px";

const GROUND_HEIGHT = 500;
const GROUND_Y = WORLDH - GROUND_HEIGHT;
const DEADZONE = 1500;

ground.style.height = GROUND_HEIGHT + 900 + "px";
ground.style.top = GROUND_Y - 600 + "px";

const cloudquantity = 500;
const darkcloudquantity = 40;
const PRESET_SPAWN_COUNT = 600;

const BH_RADIUS = 150;
const BH_SIZE = 300;

const PLAYER_W = 160;
const PLAYER_H = 240;

const PLAYER_X = SCREEN_W / 2;
const PLAYER_Y = SCREEN_H / 2;

let camX = 0, camY = 0;
let velX = 0, velY = 0;
let angle = 0, angVel = 0;

let fallStarted = false;
let betPlaced = false;
let betResolved = false;

const GRAVITY = 0.55;
const MAX_FALL = 30;
const AIR_FRICTION = 0.95;
const GROUND_FRICTION = 0.2;


let inBlackHole = false;
let bhReturnX = 0;
let bhReturnY = 0;
let bhExitX = 0;
let bhExitY = 0;
let bhTargetMultiplier = 0;
let bhCurrentMultiplier = 1;
let bhStartTime = 0;
let originalSpriteBg = '';
let exitingAnimation = false;
let exitAnimStart = 0;

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

const bonusSprites = [];

const BONUS_BG_WIDTH = 2220;
const BONUS_BG_HEIGHT = 6920;

const BONUS_ZONE_X = 0;
const BONUS_ZONE_Y = -BONUS_BG_HEIGHT - 1000;
const BONUS_START_Y = BONUS_ZONE_Y + BONUS_BG_HEIGHT - 1200;

const BH_RISE_SPEED = 7;



let earnings = 0;
let fallEarnings = 0;
let fallScorePaused = false;
let lastCamY = 0;
let lastUpdateTime = performance.now();
let landedTime = 0;


const multiplierEl = document.getElementById("multiplier");

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
  betInput.value = betAmount;
  betBtn.disabled = betAmount > balance || betAmount <= 0 || fallStarted;
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
    betInput.value = betAmount;
    return;
  }
  betAmount = Math.max(10, Math.min(balance, Number(betInput.value) || 10));
  betInput.value = betAmount;
  updateBalanceUI();
};

document.querySelectorAll(".chip").forEach(c => {
  c.onclick = () => {
    if (fallStarted) return;
    const v = c.dataset.v;
    if (v === "max") betAmount = balance;
    else betAmount = Math.min(balance, Number(v));
    updateBalanceUI();
  };
});

betBtn.onclick = () => {
  if (fallStarted || betPlaced) return;
  if (betAmount > balance) return;
  balance -= betAmount;
  updateBalanceUI();
  camX = camY = velX = velY = angle = angVel = 0;
  earnings = 0;
  lastCamY = 0;
  fallStarted = true;
  betPlaced = true;
  betResolved = false;
  lockBetUI();
};


updateBalanceUI();

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
}

const collectibles = [];
const chains = [];
const notes = [];
const blackHoles = [];
const blackholequantity = 100;
let tank = null;
let camp = null;


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

  for (let i = 0; i < count; i++) {
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
    } while (y < TOP_SAFE || (y > BOTTOM_SAFE_START && y < GROUND_Y));

    el.style.left = x + "px";
    el.style.top = y + "px";

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

function spawnTank() {
  if (tank) return;

  const el = document.createElement("div");
  el.className = "tank";
  el.style.width = "500px";
  el.style.height = "375px";
  el.style.background = `url('items/tank.png') no-repeat center/contain`;

  const x = randX();
  const y = GROUND_Y - 375;

  el.style.left = x + "px";
  el.style.top = y + "px";

  world.appendChild(el);
  tank = { x, y, el };
}

// ========= MILITARY CAMP =========

function spawnCamp() {
  if (camp) return;

  const el = document.createElement("div");
  el.className = "military-camp";
  el.style.width = "800px";
  el.style.height = "600px";
  el.style.background = `url('items/camp.png') no-repeat center/contain`;

  const x = randX();
  const y = GROUND_Y - 600;

  el.style.left = x + "px";
  el.style.top = y + "px";

  world.appendChild(el);
  camp = { x, y, el };
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

createAnimatedCloud(".back", 12, 200, 650, 0, 650, 0.8);
createAnimatedCloud(".mid", 8, 450, 800, 0, 750, 0.9);
createAnimatedCloud(".front", 6, 700, 1300, 0, 1000, 1.3);

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

let grabbedByDarkCloud = false;
let releaseTime = 0;
let grabbedCloud = null;
let freezeX = 0, freezeY = 0;

const skeleton = document.getElementById("skeleton");
const sprite = document.getElementById("sprite");
sprite.style.backgroundImage = "url('items/game sprite green.png')";
let skeletonFlashInterval = null;

function spawnDarkCloud(x, y) {
  if (y > GROUND_Y - 500) return;
  const el = document.createElement("div");
  el.className = "dark-cloud";
  el.style.width = DARK_W + "px";
  el.style.height = DARK_H + "px";
  el.style.left = x + "px";
  el.style.top = y + "px";

  world.appendChild(el);

  const rects = DARK_RECTS.map(r => ({
    x: x + r.x * DARK_W,
    y: y + r.y * DARK_H,
    w: r.w * DARK_W,
    h: r.h * DARK_H
  }));

  darkClouds.push({ x, y, el, rects });
}

function spawnWorld() {
  for (let i = 0; i < cloudquantity; i++) spawnCloud(randX(), spawnY());
  for (let i = 0; i < darkcloudquantity; i++) spawnDarkCloud(randX(), spawnY());
  spawnBlackHoles(blackholequantity);
  spawnTank(20);
  spawnCamp(20);
}
spawnWorld();
spawnCollectibles(PRESET_SPAWN_COUNT);

// ========= PLAYER COLLIDERS =========

const ELLIPSES = [
  { x: 0.2857, y: 0.0190, w: 0.4357, h: 0.4048 }
];

const RECTS = [
  { x: 0.1571, y: 0.3905, w: 0.6857, h: 0.3476 },
  { x: 0.2714, y: 0.7333, w: 0.4571, h: 0.2381 }
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
}

// ========= PHYSICS =========

const MASS = 2.0;

function restitutionFromSpeed(v) {
  const s = Math.min(Math.abs(v), 40);
  if (s < 2) return 0.1;
  if (s < 8) return 0.3;
  if (s < 14) return 0.5;
  if (s < 22) return 0.6;
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
    }

    else if (c.y > BOTTOM_LIMIT + REUSE_DISTANCE) {
      c.y = TOP_LIMIT + Math.random() * 1200;
      c.x = randX();
    }

    c.el.style.left = c.x + "px";
    c.el.style.top = c.y + "px";

    const pick1 = c.el.style.background.includes("cloud4");
    const base = pick1 ? CLOUD1 : CLOUD2;
    const W = pick1 ? CLOUD1_W : CLOUD2_W;
    const H = pick1 ? CLOUD1_H : CLOUD2_H;

    c.circles = base.map(p => ({
      x: c.x + p.x * W,
      y: c.y + p.y * H,
      r: p.r * W
    }));
  }
}



function recycleDarkClouds() {
  const MAX_CLOUD_H = DARK_H;

  const TOP_LIMIT = DEADZONE;
  const BOTTOM_LIMIT = GROUND_Y - DEADZONE - MAX_CLOUD_H;

  for (let c of darkClouds) {

    if (c.y < TOP_LIMIT - REUSE_DISTANCE) {
      c.y = BOTTOM_LIMIT - Math.random() * 1200;
      c.x = randX();
    }

    else if (c.y > BOTTOM_LIMIT + REUSE_DISTANCE) {
      c.y = TOP_LIMIT + Math.random() * 1200;
      c.x = randX();
    }

    c.el.style.left = c.x + "px";
    c.el.style.top = c.y + "px";

    c.rects = DARK_RECTS.map(r => ({
      x: c.x + r.x * DARK_W,
      y: c.y + r.y * DARK_H,
      w: r.w * DARK_W,
      h: r.h * DARK_H
    }));
  }
}

function recycleBlackHoles() {
  const MAX_H = BH_SIZE; // Black hole height

  const TOP_LIMIT = DEADZONE;
  const BOTTOM_LIMIT = GROUND_Y - DEADZONE - MAX_H;

  for (let bh of blackHoles) {

    if (bh.y < TOP_LIMIT - REUSE_DISTANCE) {
      bh.y = TOP_LIMIT + Math.random() * (BOTTOM_LIMIT - TOP_LIMIT);
      bh.x = randX();
      bh.rotation = 0;
      bh.el.style.transform = '';
    }

    else if (bh.y > BOTTOM_LIMIT + REUSE_DISTANCE) {
      bh.y = TOP_LIMIT + Math.random() * (BOTTOM_LIMIT - TOP_LIMIT);
      bh.x = randX();
      bh.rotation = 0;
      bh.el.style.transform = '';
    }

    bh.el.style.left = bh.x + "px";
    bh.el.style.top = bh.y + "px";
  }
}



function resolveCollisions() {
  let onGround = false;

  const muKinetic = 0.08;
  const r = PLAYER_W * 0.45;
  const I = 2.5 * r * r;

  const PLAYER_COLLIDERS = getPlayerColliders();
  const bodyCX = camX + PLAYER_X;
  const bodyCY = camY + PLAYER_Y;

  const contacts = [];

  for (const cloud of clouds) {

    if (Math.abs(cloud.y - (camY + PLAYER_Y)) > 900)
      continue;

    for (const c of cloud.circles) {
      const cx = c.x;
      const cy = c.y;
      const cr = c.r;

      for (const p of PLAYER_COLLIDERS) {
        const dx = p.x - cx;
        const dy = p.y - cy;
        const distSq = dx * dx + dy * dy;
        const minDist = p.r + cr;
        if (distSq >= minDist * minDist) continue;

        const dist = Math.sqrt(distSq) || 0.00001;
        const nx = dx / dist;
        const ny = dy / dist;

        contacts.push({
          nx,
          ny,
          penetration: (minDist - dist),
          px: p.x,
          py: p.y
        });
      }
    }
  }

  if (contacts.length > 0) {
    let nx = 0, ny = 0, depth = 0;

    for (const c of contacts) {
      nx += c.nx;
      ny += c.ny;
      depth += c.penetration;
    }

    nx /= contacts.length;
    ny /= contacts.length;
    depth /= contacts.length;

    const len = Math.hypot(nx, ny) || 0.00001;
    nx /= len;
    ny /= len;

    const ref = contacts[0];
    const px = ref.px;
    const py = ref.py;

    const rx = px - bodyCX;
    const ry = py - bodyCY;

    const relVX = velX - (-angVel * ry);
    const relVY = velY + (angVel * rx);

    const relNormal = relVX * nx + relVY * ny;

    if (relNormal < 0) {
      const speed = Math.hypot(relVX, relVY);
      const e = restitutionFromSpeed(speed);

      const rCrossN = rx * ny - ry * nx;
      const denom = (1 / MASS) + (rCrossN * rCrossN) / I;

      const j = -(1 + e) * relNormal / denom;

      velX += (j * nx) / MASS;
      velY += (j * ny) / MASS;
      angVel += (rCrossN * j) / I;

      const vtX = relVX - relNormal * nx;
      const vtY = relVY - relNormal * ny;
      const vt = Math.hypot(vtX, vtY);

      if (vt > 0.0001) {
        const tx = vtX / vt;
        const ty = vtY / vt;

        let jt = -vt / denom;
        const maxFriction = muKinetic * Math.abs(j);
        jt = Math.max(-maxFriction, Math.min(maxFriction, jt));

        velX += (jt * tx) / MASS;
        velY += (jt * ty) / MASS;
        angVel += (rCrossN * jt) / I;
      }
    }

    const MAX_SPIN = 0.05;
    angVel = Math.max(-MAX_SPIN, Math.min(MAX_SPIN, angVel));

    const k_slop = 1.5;
    const percent = 0.45;
    const corr = Math.max(depth - k_slop, 0) * percent;
    const MAX_CORR = 8;
    const finalCorr = Math.min(corr, MAX_CORR);

    camX += nx * finalCorr;
    camY += ny * finalCorr;
  }

  for (const cloud of darkClouds) {
    for (const rect of cloud.rects) {
      for (const p of PLAYER_COLLIDERS) {
        const nearestX = Math.max(rect.x, Math.min(p.x, rect.x + rect.w));
        const nearestY = Math.max(rect.y, Math.min(p.y, rect.y + rect.h));
        const dx = p.x - nearestX;
        const dy = p.y - nearestY;

        if (dx * dx + dy * dy < p.r * p.r && !grabbedByDarkCloud) {
          grabbedByDarkCloud = true;
          releaseTime = performance.now() + 1500;
          grabbedCloud = cloud;

          freezeX = camX;
          freezeY = camY;
          velX = velY = 0;
          angVel = 0;

          earnings *= 0.5;

          skeleton.style.display = "block";
          sprite.style.display = "block";

          let showSkeleton = false;
          skeletonFlashInterval = setInterval(() => {
            showSkeleton = !showSkeleton;
            skeleton.style.display = showSkeleton ? "block" : "none";
            sprite.style.display = showSkeleton ? "none" : "block";
          }, 90);

          return false;
        }
      }
    }
  }

  for (const bh of blackHoles) {
  const bx = bh.x + 75;
  const by = bh.y + 75;

  for (const p of PLAYER_COLLIDERS) {
    const dx = p.x - bx;
    const dy = p.y - by;

    if (dx * dx + dy * dy < (BH_RADIUS + p.r) ** 2) {
      enterBlackHole(bh);
      return false;
    }
  }
}

  if (tank) {
  const rect = { x: tank.x, y: tank.y, w: 400, h: 300 };

  for (const p of PLAYER_COLLIDERS) {
    const nearestX = Math.max(rect.x, Math.min(p.x, rect.x + rect.w));
    const nearestY = Math.max(rect.y, Math.min(p.y, rect.y + rect.h));
    const dx = p.x - nearestX;
    const dy = p.y - nearestY;

    if (dx * dx + dy * dy < p.r * p.r) {
      earnings *= 5;              //  MULTIPLIER
      showMultiplier(5);

      tank.el.remove();
      tank = null;

      setTimeout(hideMultiplier, 1200);
      break;
    }
  }
}

  if (camp) {
  const rect = { x: camp.x, y: camp.y, w: 800, h: 600 };

  for (const p of PLAYER_COLLIDERS) {
    const nearestX = Math.max(rect.x, Math.min(p.x, rect.x + rect.w));
    const nearestY = Math.max(rect.y, Math.min(p.y, rect.y + rect.h));
    const dx = p.x - nearestX;
    const dy = p.y - nearestY;

    if (dx * dx + dy * dy < p.r * p.r) {
      earnings *= 50;              // MULTIPLIER
      showMultiplier(50);

      camp.el.remove();
      camp = null;

      setTimeout(hideMultiplier, 1200);
      break;
    }
  }
}


  let lowest = -Infinity;
  for (const p of PLAYER_COLLIDERS) {
    const bottom = p.y + p.r;
    if (bottom > lowest) lowest = bottom;
  }

  const playerBottom = lowest;

  if (playerBottom >= GROUND_Y && !inBlackHole) {
    const penetration = playerBottom - GROUND_Y;
    camY -= penetration;

    const speed = Math.hypot(velX, velY);
    const e = restitutionFromSpeed(speed);

    if (speed > 0.4) {
      velY = -Math.abs(velY) * e;
      velY *= 0.65;

      const MAX_BOUNCE = 14;
      if (Math.abs(velY) > MAX_BOUNCE) velY = -MAX_BOUNCE;

      angVel *= 0.85;
    } else {
      velX *= 0.85;
      velY = 0;
      angVel *= 0.6;
      onGround = true;
    }
  }

  return onGround;
}

let stuckLastY = 0;
let stuckStartTime = null;
const STUCK_TIME_LIMIT = 3000;

let hardStuckStart = null;
let lastEarnings = 0;
const HARD_STUCK_TIME = 6000; //6sec
const HARD_MOVEMENT_THRESHOLD = 25; 

function checkStuck() {

  if (inBlackHole) return;

  if (!betPlaced || !fallStarted) {
    stuckStartTime = null;
    hardStuckStart = null;
    return;
  }

  const movement = Math.abs(camY - stuckLastY);
  stuckLastY = camY;

  if (movement < 5) {
    if (stuckStartTime === null)
      stuckStartTime = performance.now();
    else if (performance.now() - stuckStartTime >= STUCK_TIME_LIMIT)
      hardResetWorld(true, 2000);
  } else {
    stuckStartTime = null;
  }

  const now = performance.now();

  if (hardStuckStart === null) {
    hardStuckStart = now;
    lastEarnings = earnings;
    return;
  }

  const elapsed = now - hardStuckStart;
  const totalMovement = Math.abs(camY - freezeY); 

  const barelyMoving =
    Math.abs(velY) < 0.6 &&
    Math.abs(velX) < 0.6 &&
    totalMovement < HARD_MOVEMENT_THRESHOLD;

  const noProgress = Math.abs(earnings - lastEarnings) < 0.5;

  if (barelyMoving && noProgress && elapsed >= HARD_STUCK_TIME) {
    hardResetWorld(true, 2000);
    hardStuckStart = null;
  }

  if (elapsed >= HARD_STUCK_TIME) {
    hardStuckStart = now;
    lastEarnings = earnings;
  }
}

//======black hole logic=====


function startBlackHoleAnimation(type, x, y, bh = null) {
  bhAnimating = true;
  bhAnimType = type;
  bhAnimStartTime = performance.now();
  bhAnimStartSize = type === 'enter' ? 150 : 800;
  bhAnimEndSize = type === 'enter' ? 800 : 150;

  bhAnimEl = document.createElement("div");
  bhAnimEl.className = "black-hole";
  bhAnimEl.style.width = bhAnimStartSize + "px";
  bhAnimEl.style.height = bhAnimStartSize + "px";
  bhAnimEl.style.left = (x - bhAnimStartSize / 2) + "px";
  bhAnimEl.style.top = (y - bhAnimStartSize / 2) + "px";
  bhAnimEl.style.background = `url('items/black_hole_1.png') no-repeat center/contain`;
  bhAnimEl.dataset.x = x;
  bhAnimEl.dataset.y = y;
  world.appendChild(bhAnimEl);

  if (type === 'enter' && bh) {
    bh.el.remove();
    blackHoles.splice(blackHoles.indexOf(bh), 1);
  }
}

function enterBlackHole(bh) {
  startBlackHoleAnimation('enter', bh.x + 75, bh.y + 75, bh);
}

function enterBlackHoleLogic() {
  inBlackHole = true;
  bhStartTime = performance.now();

  bhReturnX = camX;
  bhReturnY = camY;

  bhTargetMultiplier = 2 + Math.random() * 13;
  bhCurrentMultiplier = 1;
  bhRiseHeight = 0;

  fallScorePaused = true;

  camX = BONUS_ZONE_X;
  camY = BONUS_START_Y;

  velX = 0;
  velY = 0;
  angVel = 0;

  bhMovingBgEl = document.createElement("div");
  bhMovingBgEl.style.position = "absolute";
  bhMovingBgEl.style.width = BONUS_BG_WIDTH + "px";
  bhMovingBgEl.style.height = BONUS_BG_HEIGHT + "px";
  bhMovingBgEl.style.left =
  (SCREEN_W - BONUS_BG_WIDTH) / 2 + "px";

  bhMovingBgEl.style.top = BONUS_ZONE_Y + "px";
  bhMovingBgEl.style.backgroundImage = "url('items/Bonus_bg.png')";
  bhMovingBgEl.style.backgroundRepeat = "no-repeat";
  bhMovingBgEl.style.backgroundSize = BONUS_BG_WIDTH + "px " + BONUS_BG_HEIGHT + "px";
  bhMovingBgEl.style.backgroundPosition = "0 0";
  bhMovingBgEl.style.zIndex = "11";

  world.appendChild(bhMovingBgEl);

  // Swap sprite to jetpack in bonus zone
  originalSpriteBg = sprite.style.backgroundImage;
  sprite.style.backgroundImage = "url('items/jetpack.png')";

  showMultiplier(bhCurrentMultiplier);
}



function exitBlackHole() {
  inBlackHole = false;
  fallScorePaused = false;
  earnings += fallEarnings;
  fallEarnings = 0;

  camX = bhReturnX;
  camY = bhReturnY;

  velX = 0;
  velY = 0;
  angVel = 0;

  // Clear bonus sprites
  bonusSprites.forEach(sprite => sprite.el.remove());
  bonusSprites.length = 0;

  // Restore original sprite
  sprite.style.backgroundImage = originalSpriteBg;

  // Set exit position for animation
  bhExitX = camX + PLAYER_X;
  bhExitY = camY + PLAYER_Y;

  // Start black hole exit animation
  startBlackHoleAnimation('exit', bhExitX, bhExitY);

  // Start sprite exit animation
  exitingAnimation = true;
  exitAnimStart = performance.now();

  hideMultiplier();
  showScore();
}




function update() {

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

  camY -= BH_RISE_SPEED;



  // Update bonus sprites
  bonusSprites.forEach(sprite => {
    sprite.y += sprite.speed;
    sprite.el.style.left = sprite.x + "px";
    sprite.el.style.top = sprite.y + "px";
  });

  const riseHeight = BONUS_START_Y - camY;

  bhCurrentMultiplier = Math.min(15, 1 + (riseHeight / 120)) ; // Increase based on rise height, reaching ~15x at 120 height
  showMultiplier(bhCurrentMultiplier);

  if (bhCurrentMultiplier >= bhTargetMultiplier) {
    earnings *= bhCurrentMultiplier;
    exitBlackHole();
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

  // Update black hole rotations if player is within 2000x2000 pixel range
  for (let bh of blackHoles) {
    const playerX = camX + PLAYER_X;
    const playerY = camY + PLAYER_Y;
    const bhCenterX = bh.x + 75;
    const bhCenterY = bh.y + 75;
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

  velX *= onGround ? GROUND_FRICTION : AIR_FRICTION;
  angVel *= onGround ? 0.35 : 0.989;

  angle += angVel;

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
        }
      }

      if (pickedUp) {
        earnings += c.value;
        c.el.remove();
        arr.splice(i, 1);
      }
    }
  }

  checkPickup(chains);
  checkPickup(notes);

  if (onGround && fallStarted && !betResolved) {
    if (landedTime === 0) {
      landedTime = performance.now();
    } else if (performance.now() - landedTime > 1000) { // Wait 1 second on ground
      betResolved = true;
      const payout = earnings;
      balance += payout;
      runOverEl.innerHTML = `RUN OVER<br>Total Winnings: ₹${payout.toFixed(2)}`;
      runOverEl.style.display = "block";
      fallStarted = false;
      betPlaced = false;
      updateBalanceUI();

      setTimeout(() => {
        runOverEl.style.display = "none";
        hardResetWorld(false, 0);
      }, 5000);
    }
  } else {
    landedTime = 0;
  }

  lastCamY = camY;
  render();
  checkStuck();
  requestAnimationFrame(update);

}

function render() {
  if (inBlackHole) {
    scoreEl.style.display = "none";
  } else {
    scoreEl.style.display = "block";
    scoreEl.textContent = `₹${earnings.toFixed(2)}`;
  }
  world.style.transform = `translate(${-camX}px, ${-camY}px)`;
  silverjetWrap.style.left = PLAYER_X + "px";
  silverjetWrap.style.top = PLAYER_Y + "px";
  player.style.left = (camX + PLAYER_X) + 'px';
  player.style.top = (camY + PLAYER_Y) + 'px';
  player.style.transform = `translate(-50%, -50%) rotate(${angle}rad)`;
  sprite.style.left = (camX + PLAYER_X) + 'px';
  sprite.style.top = (camY + PLAYER_Y) + 'px';
  sprite.style.transform = `translate(-50%, -50%) rotate(${inBlackHole ? 0 : angle}rad)`;
  skeleton.style.left = (camX + PLAYER_X) + 'px';
  skeleton.style.top = (camY + PLAYER_Y) + 'px';
  skeleton.style.transform = `translate(-50%, -50%) rotate(${angle}rad)`;
}
update(); 
