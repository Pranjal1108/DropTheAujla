/*  
—————————————————————————
YES, IT'S THE FULL UPDATED SCRIPT
—————————————————————————
*/

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

const betInput = document.getElementById("betAmount");
const betBtn = document.getElementById("placeBet");
const plusBtn = document.getElementById("plus");
const minusBtn = document.getElementById("minus");
const balanceEl = document.getElementById("balance");

let balance = 1000;
let betAmount = 10;

function updateBalanceUI() {
  balanceEl.textContent = `Balance ₹${balance.toFixed(2)}`;
  betInput.value = betAmount;
}
updateBalanceUI();

const SCREEN_W = 1919;
const SCREEN_H = 1151;
const WORLDH = 20000;

const GROUND_HEIGHT = 400;

const PLAYER_SIZE = 180;
const PLAYER_X = SCREEN_W / 2;
const PLAYER_Y = SCREEN_H / 2;

player.style.width = PLAYER_SIZE + "px";
player.style.height = PLAYER_SIZE + "px";

let camX = 0;
let camY = 0;
let velX = 0;
let velY = 0;
let angle = 0;
let angVel = 0;

let fallStarted = false;
let betPlaced = false;
let betResolved = false;

const GRAVITY = 0.35;
const MAX_FALL = 16;
const RESTITUTION = 0.35;
const AIR_FRICTION = 0.998;
const GROUND_FRICTION = 0.9;
const INERTIA = 30000;

let earnings = 0;
let lastCamY = 0;
let skillMultiplier = 1;
let riskMultiplier = 1;


// ————————— BET UI —————————

plusBtn.onclick = () => {
  if (betAmount + 10 <= balance) {
    betAmount += 10;
    updateBalanceUI();
  }
};

minusBtn.onclick = () => {
  betAmount = Math.max(10, betAmount - 10);
  updateBalanceUI();
};

betBtn.onclick = () => {
  if (betAmount > balance) return;
  balance -= betAmount;
  updateBalanceUI();

  camX = camY = velX = velY = angle = angVel = 0;
  earnings = 0;
  lastCamY = 0;
  skillMultiplier = 1;
  riskMultiplier = 1;

  fallStarted = true;
  betPlaced = true;
  betResolved = false;
};


// ————————— RESET —————————

const runOverEl = document.getElementById("runOver");

function hardResetWorld(showLoss = true) {
  fallStarted = false;
  betPlaced = false;
  betResolved = true;

  const payout = (earnings * skillMultiplier * riskMultiplier).toFixed(2);

  if (showLoss) {
    runOverEl.innerHTML = `RUN OVER<br>Total Payout: ₹${payout}`;
    runOverEl.style.display = "block";
  }

  setTimeout(() => {
    clearWorld();

    camX = camY = velX = velY = angle = angVel = 0;
    earnings = 0;
    lastCamY = 0;
    skillMultiplier = 1;
    riskMultiplier = 1;

    runOverEl.style.display = "none";

    spawnWorld();
  }, 2000);
}

function clearWorld() {
  [...collectibles, ...chains, ...notes].forEach(c => c.el.remove());
  collectibles.length = 0;
  chains.length = 0;
  notes.length = 0;

  for (const c of clouds) c.el.remove();
  clouds.length = 0;

  for (const c of darkClouds) c.el.remove();
  darkClouds.length = 0;
}


// ————————— COLLECTIBLES —————————

const collectibles = [];
const chains = [];
const notes = [];

function spawnCollectible() {
  if (!betPlaced) return;

  const type = Math.random();
  const el = document.createElement("div");

  let value = 0;
  let arr;

  if (type < 0.6) {
    el.className = "collectible chain";
    value = 2;
    arr = chains;
  } else {
    el.className = "collectible music";
    value = 5;
    arr = notes;
  }

  const x = Math.random() * SCREEN_W;
  const y = camY + SCREEN_H + 600;

  el.style.left = x + "px";
  el.style.top = y + "px";

  world.appendChild(el);

  arr.push({ x, y, value, el });
}



// ————————— CLOUDS —————————

const clouds = [];

const CLOUD1_W = 320;
const CLOUD1_H = 160;

const CLOUD2_W = 325;
const CLOUD2_H = 217;

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
  const BOTTOM_LIMIT = WORLDH - GROUND_HEIGHT - 800;
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


// ————————— DARK CLOUDS —————————

const darkClouds = [];

const DARK_W = 280;
const DARK_H = 187;

const DARK_RECTS = [
  { w:53,  h:16, x:117, y:36  },
  { w:121, h:22, x:83,  y:52  },
  { w:164, h:15, x:58,  y:74  },
  { w:216, h:40, x:35,  y:89  }
];

let grabbedByDarkCloud = false;
let releaseTime = 0;
let grabbedCloud = null;

function spawnDarkCloud(x, y) {
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


// ————————— WORLD SPAWN —————————

function spawnWorld() {
  for (let i = 0; i < 800; i++)
    spawnCloud(randX(), spawnY());

  for (let i = 0; i < 25; i++)
    spawnDarkCloud(randX(), spawnY());
}

spawnWorld();


// ————————— PLAYER PHYSICS —————————

const PLAYER_COLLIDERS = [
  { offsetX: 0, offsetY: -PLAYER_SIZE * 0.25, r: PLAYER_SIZE * 0.3 },
  { offsetX: 0, offsetY: 0, r: PLAYER_SIZE * 0.35 },
  { offsetX: 0, offsetY: PLAYER_SIZE * 0.25, r: PLAYER_SIZE * 0.3 }
];

function resolveCollisions() {
  let onGround = false;

  // Cloud Physics
  for (const cloud of clouds) {
    for (const c of cloud.circles) {
      for (const p of PLAYER_COLLIDERS) {
        const px = camX + PLAYER_X + p.offsetX;
        const py = camY + PLAYER_Y + p.offsetY;

        const dx = px - c.x;
        const dy = py - c.y;
        const distSq = dx * dx + dy * dy;
        const minDist = p.r + c.r;

        if (distSq < minDist * minDist) {
          const dist = Math.sqrt(distSq) || 0.001;
          const nx = dx / dist;
          const ny = dy / dist;

          const penetration = (minDist - dist) * 0.5;
          camX += nx * penetration;
          camY += ny * penetration;

          const dot = velX * nx + velY * ny;

          if (dot < 0) {
            const impulse = -(1 + RESTITUTION) * dot;
            velX += impulse * nx;
            velY += impulse * ny;

            const torque = (p.offsetX * ny - p.offsetY * nx) * impulse;
            angVel += torque / INERTIA;
          }
        }
      }
    }
  }

  // DARK CLOUD
  for (const cloud of darkClouds) {
    for (const rect of cloud.rects) {
      for (const p of PLAYER_COLLIDERS) {

        const px = camX + PLAYER_X + p.offsetX;
        const py = camY + PLAYER_Y + p.offsetY;

        const nx = Math.max(rect.x, Math.min(px, rect.x + rect.w));
        const ny = Math.max(rect.y, Math.min(py, rect.y + rect.h));

        const dx = px - nx;
        const dy = py - ny;

        if ((dx * dx + dy * dy) < p.r * p.r && !grabbedByDarkCloud) {

          grabbedByDarkCloud = true;
          releaseTime = performance.now() + 2000;
          grabbedCloud = cloud;

          velX = 0;
          velY = 0;
          angVel = 0;

          earnings *= 0.5;

          return false;
        }
      }
    }
  }

  // GROUND
  const groundTop = WORLDH - GROUND_HEIGHT;

  if (camY + PLAYER_Y + PLAYER_COLLIDERS[2].r > groundTop) {
    camY = groundTop - PLAYER_Y - PLAYER_COLLIDERS[2].r;
    velY = 0;
    onGround = true;
  }

  return onGround;
}


// ————————— STUCK —————————

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
      hardResetWorld(true);
  } else stuckStartTime = null;
}


// ————————— UPDATE LOOP —————————

function update() {

  if (grabbedByDarkCloud) {

    if (grabbedCloud) {
      camX = grabbedCloud.x;
      camY = grabbedCloud.y;
    }

    if (performance.now() >= releaseTime) {

      grabbedByDarkCloud = false;

      const spread = (Math.random() * Math.PI / 2) - (Math.PI / 4);
      const power = 30;

      velX = Math.sin(spread) * power;
      velY = -Math.cos(spread) * power;

      grabbedCloud.el.remove();
      darkClouds.splice(darkClouds.indexOf(grabbedCloud), 1);
      grabbedCloud = null;
    }

    render();
    requestAnimationFrame(update);
    return;
  }

  const onGround = resolveCollisions();

  if (fallStarted && !onGround)
    velY += GRAVITY;

  velY = Math.min(velY, MAX_FALL);

  camX += velX;
  camY += velY;

  velX *= onGround ? GROUND_FRICTION : AIR_FRICTION;
  angVel *= onGround ? 0.7 : 0.99;

  angle += angVel;


  // ——— NERFED EARNING ———
  if (betPlaced && fallStarted && velY > 0) {
    const fallDistance = camY - lastCamY;
    if (fallDistance > 2)
      earnings += fallDistance * Math.sqrt(betAmount) * 0.001;
  }


  // ——— CHAIN / NOTE COLLECTION ———
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
    const payout = earnings * skillMultiplier * riskMultiplier;
    balance += payout;
    updateBalanceUI();
    betPlaced = false;
    fallStarted = false;
  }

  lastCamY = camY;

  render();
  checkStuck();

  requestAnimationFrame(update);
}


function render() {
  scoreEl.textContent =
    `₹${(earnings * skillMultiplier * riskMultiplier).toFixed(2)}`;

  player.style.transform =
    `translate(-50%, -50%) rotate(${angle}rad)`;

  world.style.transform =
    `translate(${-camX}px, ${-camY}px)`;
}

update();
