const gameScale = document.getElementById("game-scale"); 
function scaleGame() {
  const scale = Math.min(window.innerWidth / 1900, window.innerHeight / 1151);
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
const balanceEl = document.getElementById("balance");
const ground = document.getElementById("ground");

let balance = 1000;
let betAmount = 10;

const SCREEN_W = 1919;
const SCREEN_H = 1151;

const WORLDH = 20000;
world.style.height = WORLDH + "px";

const GROUND_HEIGHT = SCREEN_H / 2;
const GROUND_Y = WORLDH - GROUND_HEIGHT;
const DEADZONE = 250;

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

const GRAVITY = 0.7;
const MAX_FALL = 30;
const AIR_FRICTION = 0.998;
const GROUND_FRICTION = 0.9;

let earnings = 0;
let lastCamY = 0;

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
}

const collectibles = [];
const chains = [];
const notes = [];

const silverjetWrap = document.createElement("div");
silverjetWrap.style.position = "absolute";
silverjetWrap.style.pointerEvents = "none";
silverjetWrap.style.zIndex = "9999999";

const silverjet = document.createElement("div");
silverjet.className = "silverjet";
silverjetWrap.appendChild(silverjet);
document.getElementById("game").appendChild(silverjetWrap);

function spawnCollectible() {
  if (!betPlaced) return;
  const type = Math.random();
  const el = document.createElement("div");
  let value = 0, arr;

  if (type < 0.55) {
    el.className = "collectible chain";
    value = 3;
    arr = chains;
  } else {
    el.className = "collectible music";
    value = 8;
    arr = notes;
  }

  const x = Math.random() * SCREEN_W;
  const y = Math.min(camY + SCREEN_H + 600, GROUND_Y - 500);

  el.style.left = x + "px";
  el.style.top = y + "px";

  world.appendChild(el);
  arr.push({ x, y, value, el });
}
setInterval(spawnCollectible, 800);


// ========= CLOUDS =========
const clouds = [];
const CLOUD1_W = 320 * 1.3, CLOUD1_H = 160 * 1.3;
const CLOUD2_W = 325 * 1.2, CLOUD2_H = 217 * 1.2;

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
  const TOP_DEAD = SCREEN_H * 0.7;
  const BOTTOM_LIMIT = GROUND_Y - 500;
  return TOP_DEAD + Math.random() * (BOTTOM_LIMIT - TOP_DEAD);
}

function spawnCloud(x, y) {
  const pick = Math.random() < 0.5 ? 1 : 2;
  let el = document.createElement("div");
  el.className = "cloud";

  let circles;

  if (pick === 1) {
    el.style.width = CLOUD1_W + "px";
    el.style.height = CLOUD1_H + "px";
    el.style.background = `url('clouds/cloud4.png') no-repeat center/contain`;

    circles = CLOUD1.map(c => ({
      x: x + c.x * CLOUD1_W,
      y: y + c.y * CLOUD1_H,
      r: c.r * CLOUD1_W
    }));

  } else {
    el.style.width = CLOUD2_W + "px";
    el.style.height = CLOUD2_H + "px";
    el.style.background = `url('clouds/cloud2.png') no-repeat center/contain`;

    circles = CLOUD2.map(c => ({
      x: x + c.x * CLOUD2_W,
      y: y + c.y * CLOUD2_H,
      r: c.r * CLOUD2_W
    }));
  }

  el.style.left = x + "px";
  el.style.top = y + "px";

  world.appendChild(el);
  clouds.push({ x, y, el, circles });
}


// ========= DARK CLOUDS =========
const darkClouds = [];
const DARK_W = 280;
const DARK_H = 187;

const DARK_RECTS = [
  { w:53, h:16, x:117, y:36 },
  { w:121, h:22, x:83, y:52 },
  { w:164, h:15, x:58, y:74 },
  { w:216, h:40, x:35, y:89 }
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
    x: x + r.x,
    y: y + r.y,
    w: r.w,
    h: r.h
  }));

  darkClouds.push({ x, y, el, rects });
}

function spawnWorld() {
  for (let i = 0; i < 800; i++) spawnCloud(randX(), spawnY()); 
  for (let i = 0; i < 100; i++) spawnDarkCloud(randX(), spawnY());
}
spawnWorld();


function updateGroundSection() {}


// ===== COLLIDERS =====
const ELLIPSES = [
  { x: 0.2857, y: 0.0190, w: 0.4357, h: 0.4048 }
];

const RECTS = [
  { x: 0.1571, y: 0.3905, w: 0.6857, h: 0.3476 },
  { x: 0.2714, y: 0.7333, w: 0.4571, h: 0.2381 }
];

function getPlayerColliders(){
  const list = [];

  const centerX = camX + PLAYER_X;
  const centerY = camY + PLAYER_Y;

  function rotatePoint(x, y){
    const dx = x - centerX;
    const dy = y - centerY;
    const cos = Math.cos(angle);
    const sin = Math.sin(angle);

    return {
      x: centerX + dx * cos - dy * sin,
      y: centerY + dx * sin + dy * cos
    };
  }

  for(const e of ELLIPSES){
    const w = e.w * PLAYER_W;
    const h = e.h * PLAYER_H;
    const r = Math.min(w,h)/2;

    const ex = ((e.x + e.w/2) - 0.5) * PLAYER_W;
    const ey = ((e.y + e.h/2) - 0.5) * PLAYER_H;

    const rot = rotatePoint(centerX + ex, centerY + ey);
    list.push({ x: rot.x, y: rot.y, r });
  }

  for(const rct of RECTS){
    const w = rct.w * PLAYER_W;
    const h = rct.h * PLAYER_H;
    const r = Math.min(w,h)/2;

    const rx = ((rct.x + rct.w/2) - 0.5) * PLAYER_W;
    const ry = ((rct.y + rct.h/2) - 0.5) * PLAYER_H;

    const rot = rotatePoint(centerX + rx, centerY + ry);
    list.push({ x: rot.x, y: rot.y, r });
  }

  return list;
}


// ========= DEBUG COLLIDER VIS =========
const debugCanvas = document.getElementById("debugColliders");
const dctx = debugCanvas.getContext("2d");
debugCanvas.width = SCREEN_W;
debugCanvas.height = SCREEN_H;

function drawDebugColliders(){
  dctx.clearRect(0,0,debugCanvas.width,debugCanvas.height);
  const cols = getPlayerColliders();
  cols.forEach(c=>{
    dctx.beginPath();
    dctx.arc(c.x-camX,c.y-camY,c.r,0,Math.PI*2);
    dctx.strokeStyle="rgba(255,200,0,0.9)";
    dctx.lineWidth=3;
    dctx.stroke();

    dctx.beginPath();
    dctx.arc(c.x-camX,c.y-camY,2,0,Math.PI*2);
    dctx.fillStyle="red";
    dctx.fill();
  });
}


// ========= REAL COLLISION PHYSICS =========
function resolveCollisions() {
  let onGround = false;

  const e = 0.75;
  const muStatic = 0.55;
  const muKinetic = 0.32;

  const r = PLAYER_W * 0.45;
  const I = 0.5 * r * r;

  const PLAYER_COLLIDERS = getPlayerColliders();
  const bodyCX = camX + PLAYER_X;
  const bodyCY = camY + PLAYER_Y;

  for (const cloud of clouds) {
    for (const c of cloud.circles) {
      const cx = c.x;
      const cy = c.y;
      const cr = c.r;

      for (const p of PLAYER_COLLIDERS) {
        const dx = p.x - cx;
        const dy = p.y - cy;

        const distSq = dx * dx + dy * dy;
        const minDist = p.r + cr;
        const minDistSq = minDist * minDist;
        if (distSq >= minDistSq) continue;

        const dist = Math.sqrt(distSq) || 0.0001;
        const nx = dx / dist;
        const ny = dy / dist;
        const penetration = minDist - dist;
        const deep = penetration > cr * 0.55;

        const rx = p.x - bodyCX;
        const ry = p.y - bodyCY;

        const relVX = velX - (-angVel * ry);
        const relVY = velY + ( angVel * rx);
        const relNormal = relVX * nx + relVY * ny;

        if (relNormal < 0 && !deep) {
          const rCrossN = rx * ny - ry * nx;
          const Ireal = I || 0.5 * (rx * rx + ry * ry);

          let j = -(1 + e) * relNormal;
          j /= (1 + (rCrossN * rCrossN) / Ireal);
          j = Math.max(-25, Math.min(25, j));

          velX += j * nx;
          velY += j * ny;
          angVel += (rCrossN * j) / Ireal;

          const vtX = relVX - relNormal * nx;
          const vtY = relVY - relNormal * ny;
          const vt = Math.hypot(vtX, vtY);

          if (vt > 1e-4) {
            const tx = vtX / vt;
            const ty = vtY / vt;

            let jt = -vt / (1 + (rCrossN * rCrossN) / Ireal);
            const maxFriction = muKinetic * Math.abs(j);
            jt = Math.max(-maxFriction, Math.min(maxFriction, jt));

            velX += jt * tx;
            velY += jt * ty;
            angVel += (rCrossN * jt) / Ireal;
          }
        }

        if (deep) {
          velX *= 0.4;
          velY *= 0.4;
          if (Math.abs(angVel) < 0.05) angVel = 0;
          else angVel *= 0.35;
        }

        const MAX_SPIN = 0.12;
        if (Math.abs(angVel) > MAX_SPIN)
          angVel = MAX_SPIN * Math.sign(angVel);

        const k_slop = 0.001;
        const percent = 0.25;
        const corr = Math.max(penetration - k_slop, 0) * percent;

        camX += nx * corr;
        camY += ny * corr;
      }
    }
  }

  for (const cloud of darkClouds) {
    for (const rect of cloud.rects) {
      for (const p of PLAYER_COLLIDERS) {

        const nx = Math.max(rect.x, Math.min(p.x, rect.x + rect.w));
        const ny = Math.max(rect.y, Math.min(p.y, rect.y + rect.h));

        const dx = p.x - nx;
        const dy = p.y - ny;

        if ((dx * dx + dy * dy) < p.r * p.r && !grabbedByDarkCloud) {
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

  const last = PLAYER_COLLIDERS[PLAYER_COLLIDERS.length - 1];
  const playerBottom = camY + PLAYER_Y + last.r;

  if (playerBottom >= GROUND_Y - DEADZONE) {
    camY = (GROUND_Y - DEADZONE) - PLAYER_Y - last.r;

    const speed = Math.hypot(velX, velY);

    if (speed > 0.4) {
      const tangentForce = Math.abs(velX);
      const maxStatic = muStatic * 9.8;

      if (tangentForce < maxStatic) {
        const targetOmega = velX / r;
        angVel += (targetOmega - angVel) * 0.28;
        velX *= 0.97;
      } else {
        velX *= (1 - muKinetic * 0.12);
        angVel += 0.01 * Math.sign(velX);
      }

      velY = -Math.abs(velY) * e * 0.35;

    } else {
      velX *= 0.88;
      velY = 0;
      angVel *= 0.75;
      onGround = true;
    }
  }

  return onGround;
}


// ========= STUCK CHECK =========
let stuckLastY = 0;
let stuckStartTime = null;
const STUCK_TIME_LIMIT = 3000;

function checkStuck() {
  if (!betPlaced || !fallStarted) {
    stuckStartTime = null;
    return;
  }

  const movement = Math.abs(camY - stuckLastY);
  stuckLastY = camY;

  if (movement < 5) {
    if (stuckStartTime === null) stuckStartTime = performance.now();
    else if (performance.now() - stuckStartTime >= STUCK_TIME_LIMIT)
      hardResetWorld(true, 2000);
  } else stuckStartTime = null;
}


// ========= GAME LOOP =========
function update() {

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

  const onGround = resolveCollisions();

  if (fallStarted && !onGround) velY += GRAVITY;
  velY = Math.min(velY, MAX_FALL);

  camX += velX;
  camY += velY;

  velX *= onGround ? GROUND_FRICTION : AIR_FRICTION;
  angVel *= onGround ? 0.7 : 0.995; 

  angle += angVel;

  if (betPlaced && fallStarted && velY > 0) {
    const fallDistance = camY - lastCamY;
    if (fallDistance > 2)
      earnings += fallDistance * Math.sqrt(betAmount) * 0.0015;
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
  silverjetWrap.style.top  = (SCREEN_H / 2) + "px";
  silverjetWrap.style.transform = `translate(${-camX}px, ${-camY}px) translate(-50%, -50%)`;
  player.style.transform = `translate(-50%, -50%) rotate(${angle}rad)`;
  updateGroundSection();
  drawDebugColliders();
}

update();
