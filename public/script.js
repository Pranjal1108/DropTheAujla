// === PERFORMANCE CONSTANTS ===
const REUSE_DISTANCE = 1500;
const CLOUD_RESPAWN_AHEAD = 5000;

const gameScale = document.getElementById("game-scale");
function scaleGame() {
  const scale = Math.min(window.innerWidth / 1920, window.innerHeight / 1200);
  gameScale.style.transform = `scale(${scale})`;
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

const BH_RADIUS = 75;

const PLAYER_W = 140;
const PLAYER_H = 210;

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
const AIR_FRICTION = 0.998;
const GROUND_FRICTION = 0.9;


let inBlackHole = false;
let bhReturnX = 0;
let bhReturnY = 0;
let bhTargetMultiplier = 0;
let bhCurrentMultiplier = 1;

const BONUS_ZONE_X = 0;
const BONUS_ZONE_Y = -50000;
const BH_RISE_SPEED = 3;


let earnings = 0;
let lastCamY = 0;


const multiplierEl = document.getElementById("multiplier");

function showScore() {
  scoreEl.textContent = `₹${earnings.toFixed(2)}`;
}

function showMultiplier(m) {
  multiplierEl.textContent = `×${m}`;
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
const blackholequantity = 30;

const silverjetWrap = document.createElement("div");
silverjetWrap.style.position = "absolute";
silverjetWrap.style.pointerEvents = "none";
silverjetWrap.style.zIndex = "9999999";

const silverjet = document.createElement("div");
silverjet.className = "silverjet";
silverjetWrap.appendChild(silverjet);
document.getElementById("game").appendChild(silverjetWrap);

// ========= COLLECTIBLES =========
// Spawns 2000 collectibles spread across world height, avoiding deadzones and ground zone.

function spawnCollectibles(count = PRESET_SPAWN_COUNT) {
  [...collectibles, ...chains, ...notes].forEach(c => c.el.remove());
  collectibles.length = chains.length = notes.length = 0;

  const TOP_SAFE = DEADZONE;
  const BOTTOM_SAFE_START = GROUND_Y - DEADZONE;

  for (let i = 0; i < count; i++) {
    const type = Math.random();
    const el = document.createElement("div");
    let value = 0, arr;

    if (type < 0.55) {
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
  const BOTTOM_SAFE = GROUND_Y - DEADZONE - 150;

  for (let i = 0; i < count; i++) {
    const el = document.createElement("div");
    el.className = "black-hole";
    el.style.width = "150px";
    el.style.height = "150px";
    el.style.background = `url('items/black_hole.png') no-repeat center/contain`;

    const x = randX();
    const y = TOP_SAFE + Math.random() * (BOTTOM_SAFE - TOP_SAFE);

    el.style.left = x + "px";
    el.style.top = y + "px";

    world.appendChild(el);
    blackHoles.push({ x, y, el });
  }
}


// ========= STARFIELD =========

const starfield = document.getElementById("starfield");
const STAR_COUNT = 250;
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
let CLOUD_ACTIVE_MAX = 400;
let playerY = 0;

const animated_clouds = [];
let animated_clouds_lastTime = performance.now();

function createAnimatedCloud(layer, count, speedMin, speedMax, yMin, yMax, sizeScale){
  const container = document.querySelector(layer);

  for(let i = 0; i < count; i++){
    const cloud = document.createElement("div");
    const scale = (0.7 + Math.random() * 0.6) * sizeScale;
    const y = Math.random() * (yMax - yMin) + yMin;
    const x = Math.random() * window.innerWidth;
    const speed = speedMin + Math.random() * (speedMax - speedMin);

    cloud.style.top = y + "px";
    cloud.style.transform = `translate3d(${x}px, 0, 0) scale(${scale})`;

    container.appendChild(cloud);

    animated_clouds.push({ el: cloud, x, y, speed, yMin, yMax });
  }
}

createAnimatedCloud(".back", 12, 200, 450, 0, 650, 0.8);
createAnimatedCloud(".mid", 8, 450, 700, 0, 750, 0.9);
createAnimatedCloud(".front", 6, 700, 1100, 0, 1000, 1.3);

function animateAnimatedClouds(now){
  const dt = (now - animated_clouds_lastTime) / 1000;
  animated_clouds_lastTime = now;

  const inRange = playerY >= CLOUD_ACTIVE_MIN && playerY <= CLOUD_ACTIVE_MAX;

  if(inRange){
    animated_clouds.forEach(c => {
      c.x += c.speed * dt;

      if(c.x > window.innerWidth + 300){
        c.x = -300;
        c.y = Math.random() * (c.yMax - c.yMin) + c.yMin;
        c.el.style.top = c.y + "px";
      }

      c.el.style.transform = `translate3d(${c.x}px, 0, 0)`;
    });
  }

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

const MASS = 2.2;

function restitutionFromSpeed(v) {
  const s = Math.min(Math.abs(v), 40);
  if (s < 2) return 0.02;
  if (s < 8) return 0.12;
  if (s < 14) return 0.22;
  if (s < 22) return 0.28;
  if (s < 30) return 0.24;
  return 0.18;
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
  const MAX_H = 150; // Black hole height

  const TOP_LIMIT = DEADZONE;
  const BOTTOM_LIMIT = GROUND_Y - DEADZONE - MAX_H;

  for (let bh of blackHoles) {

    if (bh.y < TOP_LIMIT - REUSE_DISTANCE) {
      bh.y = TOP_LIMIT + Math.random() * (BOTTOM_LIMIT - TOP_LIMIT);
      bh.x = randX();
    }

    else if (bh.y > BOTTOM_LIMIT + REUSE_DISTANCE) {
      bh.y = TOP_LIMIT + Math.random() * (BOTTOM_LIMIT - TOP_LIMIT);
      bh.x = randX();
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
      if (speed >= 1.0) {
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
      velY *= 0.55;

      const MAX_BOUNCE = 14;
      if (Math.abs(velY) > MAX_BOUNCE) velY = -MAX_BOUNCE;

      velX *= 0.92;
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


function enterBlackHole(bh) {
  inBlackHole = true;

  bhReturnX = camX;
  bhReturnY = camY;

  bhTargetMultiplier = Math.floor(3 + Math.random() * 8);
  bhCurrentMultiplier = 1;

  camX = BONUS_ZONE_X;
  camY = BONUS_ZONE_Y;

  velX = 0;
  velY = 0;
  angVel = 0;

  bh.el.remove();
  blackHoles.splice(blackHoles.indexOf(bh), 1);

  showMultiplier(bhCurrentMultiplier);
}


function exitBlackHole() {
  inBlackHole = false;

  camX = bhReturnX;
  camY = bhReturnY;

  velX = 0;
  velY = 0;
  angVel = 0;

  hideMultiplier();
  showScore();
}




function update() {

if (inBlackHole) {
  camY -= BH_RISE_SPEED;

  if (Math.random() < 0.04) {
    bhCurrentMultiplier++;
    showMultiplier(bhCurrentMultiplier);

    if (bhCurrentMultiplier >= bhTargetMultiplier) {
      earnings *= bhCurrentMultiplier;
      exitBlackHole();
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

  const onGround = resolveCollisions();

  if (fallStarted && !onGround) velY += GRAVITY;
  velY = Math.min(velY, MAX_FALL);

  camX += velX;
  camY += velY;

  velX *= onGround ? GROUND_FRICTION : AIR_FRICTION;
  angVel *= onGround ? 0.35 : 0.989;

  angle += angVel;

  if (betPlaced && fallStarted && velY > 0) {
    const fallDistance = camY - lastCamY;
    if (fallDistance > 2)
      earnings += fallDistance * Math.sqrt(betAmount) * 0.00015;
  }

  function checkPickup(arr) {
    for (let i = arr.length - 1; i >= 0; i--) {
      const c = arr[i];
      if (
        Math.abs(camX + PLAYER_X - c.x) < 120 &&
        Math.abs(camY + PLAYER_Y - c.y) < 120
      ) {
        earnings += c.value;
        c.el.remove();
        arr.splice(i, 1);
      }
    }
  }

  checkPickup(chains);
  checkPickup(notes);

  if (onGround && fallStarted && !betResolved) {
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

  lastCamY = camY;
  render();
  checkStuck();
  requestAnimationFrame(update);

}

function render() {
  scoreEl.textContent = `₹${earnings.toFixed(2)}`;
  world.style.transform = `translate(${-camX}px, ${-camY}px)`;
  silverjetWrap.style.left = (SCREEN_W / 2) + "px";
  silverjetWrap.style.top = (SCREEN_H / 2) + "px";
  silverjetWrap.style.transform = `translate(${-camX}px, ${-camY}px) translate(-50%, -50%)`;
  player.style.transform = `translate(-50%, -50%) rotate(${angle}rad)`;
  drawDebugColliders();
}

showScore();

update();
