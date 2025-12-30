const gameScale = document.getElementById("game-scale");
function scaleGame() {
  const scale = Math.min(window.innerWidth / 1900, window.innerHeight / 1151);
  gameScale.style.transform = `scale(${scale})`;
}
window.addEventListener("resize", scaleGame);
scaleGame();

const world = document.getElementById("world");
const player = document.getElementById("player");
const ground = document.getElementById("ground");
const scoreEl = document.getElementById("score");
world.style.pointerEvents = "none";

const betInput = document.getElementById("betAmount");
const betBtn = document.getElementById("placeBet");
const plusBtn = document.getElementById("plus");
const minusBtn = document.getElementById("minus");
const balanceEl = document.getElementById("balance");

let balance = 1000;
let betAmount = 10;

const SCREEN_W = 1919;
const SCREEN_H = 1151;

const WORLDH = 6000;
const GROUND_Y = 4500;
const DEADZONE = 250;
const GROUND_HEIGHT = SCREEN_H / 2;

const PLAYER_W = 123.8;
const PLAYER_H = 230.12;

const PLAYER_X = SCREEN_W / 2;
const PLAYER_Y = SCREEN_H / 2;

let camX = 0, camY = 0;
let velX = 0, velY = 0;
let angle = 0, angVel = 0;

let fallStarted = false;
let betPlaced = false;
let betResolved = false;

const GRAVITY = 0.35;
const MAX_FALL = 16;
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

const clouds = [];
const CLOUD1_W = 320, CLOUD1_H = 160;
const CLOUD2_W = 325, CLOUD2_H = 217;

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
  for (let i = 0; i < 400; i++) spawnCloud(randX(), spawnY());
  for (let i = 0; i < 200; i++) spawnDarkCloud(randX(), spawnY());
}
spawnWorld();


const RAW_COL = {
  head:{w:71.34,h:79.36,x:22.93,y:6.02},
  torso:{w:69.11,h:82.89,x:26.73,y:84.63},
  lh:{w:27.92,h:66.69,x:7.88,y:91.92},
  rh:{w:15.81,h:66.69,x:87.08,y:86.93},
  legs:{w:67.55,h:50.11,x:25.71,y:169.3}
};

const PLAYER_COLS = Object.values(RAW_COL).map(r=>({
  nx:r.x/PLAYER_W,
  ny:r.y/PLAYER_H,
  nw:r.w/PLAYER_W,
  nh:r.h/PLAYER_H
}));

function getPlayerColliders(){
  const list=[]
  for(const c of PLAYER_COLS){
    const w=c.nw*PLAYER_W
    const h=c.nh*PLAYER_H
    const x=(camX+PLAYER_X)+(c.nx*PLAYER_W)+w/2
    const y=(camY+PLAYER_Y)+(c.ny*PLAYER_H)+h/2
    const r=Math.min(w,h)/2
    list.push({x,y,r})
  }
  return list
}


let limbs = {
  head:{nx:0.1050, ny:0},
  torso:{nx:0.0722, ny:0.3273},
  lh:{nx:0, ny:0.3434},
  rh:{nx:0.6464, ny:0.3084},
  legs:{nx:0.1050, ny:0.5826}
};

for(const k in limbs){
  limbs[k].x = limbs[k].nx * PLAYER_W;
  limbs[k].y = limbs[k].ny * PLAYER_H;
  limbs[k].vx = 0;
  limbs[k].vy = 0;
  limbs[k].angle = 0;
  limbs[k].angV = 0;
}

const partElems = {
  head:document.querySelector(".head"),
  torso:document.querySelector(".torso"),
  lh:document.querySelector(".left-hand"),
  rh:document.querySelector(".right-hand"),
  legs:document.querySelector(".legs")
};

function limbShock(intensity = 1){
  for(const k in limbs){
    if(k === "lh" || k === "rh"){
      limbs[k].vy += (Math.random() - 0.5) * 4 * intensity;
    }
  }
}


function updateLimbs(){
  const g = 0.35;
  const stiffness = 0.18;
  const damping = 0.88;

  for(const key in limbs){
    const l = limbs[key];

    const anchorX = (limbs[key].nx * PLAYER_W);
    const anchorY = (limbs[key].ny * PLAYER_H);

    // HEAD: only very subtle tilt + micro bob
    if(key === "head"){
      const headTilt = angVel * 0.35; 
      const fallInfluence = velY * 0.12;

      l.x = anchorX;
      l.y = anchorY + fallInfluence;

      l.angle = headTilt;
      continue;
    }

    // TORSO + LEGS: locked in place
    if(key === "torso" || key === "legs"){
      l.x = anchorX;
      l.y = anchorY;
      l.angle = 0;
      continue;
    }

    // ARMS: little reactive jiggle + gravity bounce
    if(key === "lh" || key === "rh"){

      l.vy += g * 0.4;

      const dx = anchorX - l.x;
      const dy = anchorY - l.y;

      l.vx += dx * stiffness;
      l.vy += dy * stiffness;

      l.vx *= damping;
      l.vy *= damping;

      l.x += l.vx;
      l.y += l.vy;

      const swing = velY * 0.02 + angVel * 0.15;
      l.angle += swing * 0.3;
    }
  }
}


function resolveCollisions() {
  let onGround = false;

  const e = 0.40;
  const muStatic = 0.55;
  const muKinetic = 0.32;

  const r = PLAYER_W * 0.45;
  const I = 0.5 * r * r;

  const PLAYER_COLLIDERS = getPlayerColliders();

  for (const cloud of clouds) {
    for (const c of cloud.circles) {
      for (const p of PLAYER_COLLIDERS) {
        const dx = p.x - c.x;
        const dy = p.y - c.y;
        const dist = Math.hypot(dx, dy);
        const minDist = p.r + c.r;

        if (dist < minDist) {
          const nx = dx / dist || 0;
          const ny = dy / dist || 0;

          const penetration = minDist - dist;
          camX += nx * penetration * 0.5;
          camY += ny * penetration * 0.5;

          const vn = velX * nx + velY * ny;
          const vt = velX * -ny + velY * nx;

          const vnAfter = -e * vn;

          velX = vnAfter * nx + vt * -ny;
          velY = vnAfter * ny + vt * nx;

          const torque = vt * r;
          const alpha = torque / I;
          angVel += alpha * 0.04;

          limbShock(0.4);
        }
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

          velX = velY = angVel = 0;
          earnings *= 0.5;

          skeleton.style.display = "block";
          sprite.style.display = "block";

          let showSkeleton = false;

          skeletonFlashInterval = setInterval(() => {
            showSkeleton = !showSkeleton;
            skeleton.style.display = showSkeleton ? "block" : "none";
            sprite.style.display = showSkeleton ? "none" : "block";
          }, 90);

          limbShock(1.3);

          return false;
        }
      }
    }
  }

  const PLAYER_COLLIDERS_LAST = PLAYER_COLLIDERS[PLAYER_COLLIDERS.length - 1];
  const playerBottom = camY + PLAYER_Y + PLAYER_COLLIDERS_LAST.r;

  if (playerBottom >= GROUND_Y - DEADZONE) {
    camY = (GROUND_Y - DEADZONE) - PLAYER_Y - PLAYER_COLLIDERS_LAST.r;

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
      limbShock(0.2);

    } else {
      velX *= 0.88;
      velY = 0;
      angVel *= 0.75;
      onGround = true;
      limbShock(0.05);
    }
  }

  return onGround;
}

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

function updateGroundSection(){
  ground.style.height = GROUND_HEIGHT + "px";
  ground.style.width  = SCREEN_W * 3 + "px";
  ground.style.left = (SCREEN_W * -1) + "px";
  ground.style.top  = GROUND_Y + "px";
}


function update() {

  if (grabbedByDarkCloud) {
    camX = freezeX;
    camY = freezeY;

    if (performance.now() >= releaseTime) {
      grabbedByDarkCloud = false;

      const spread = (Math.random() * Math.PI / 1.7) - (Math.PI / 3.4);
      const power = 20;

      velX = Math.sin(spread) * power;
      velY = -Math.cos(spread) * power;

      if (grabbedCloud) {
        grabbedCloud.el.remove();
        darkClouds.splice(darkClouds.indexOf(grabbedCloud), 1);
        grabbedCloud = null;
      }

      if (skeletonFlashInterval) clearInterval(skeletonFlashInterval);
      skeletonFlashInterval = null;

      skeleton.style.display = "none";
      sprite.style.display = "block";
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
  angVel *= onGround ? 0.7 : 0.99;

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

  updateLimbs();
  render();
  checkStuck();

  requestAnimationFrame(update);
}


function render() {
  scoreEl.textContent = `₹${earnings.toFixed(2)}`;

  world.style.transform = `translate(${-camX}px, ${-camY}px)`;

  silverjetWrap.style.left = (SCREEN_W / 2) + "px";
  silverjetWrap.style.top  = (SCREEN_H / 2) + "px";

  silverjetWrap.style.transform =
    `translate(${-camX}px, ${-camY}px) translate(-50%, -50%)`;

  updateGroundSection();

  for(const key in limbs){
    const l = limbs[key];
    const el = partElems[key];

    el.style.left = l.x + "px";
    el.style.top  = l.y + "px";
  }

  player.style.transform = `translate(-50%, -50%) rotate(${angle}rad)`;
}

update();
