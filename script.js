const gameScale = document.getElementById("game-scale");

function scaleGame() {
  const scale = Math.min(
    window.innerWidth / 1900,
    window.innerHeight / 1151
  );
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
const INERTIA = 30000; // higher = slower rotation response

let earnings = 0;
let lastCamY = 0;
let skillMultiplier = 1;
let riskMultiplier = 1;

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

/* COLLECTIBLES */

const collectibles = [];

function spawnCollectible() {
  if (!betPlaced) return;

  const el = document.createElement("div");
  el.className = "collectible";
  el.textContent = "₹";

  const x = Math.random() * SCREEN_W;
  const y = camY + SCREEN_H + Math.random() * 1200;

  el.style.left = x + "px";
  el.style.top = y + "px";

  world.appendChild(el);
  collectibles.push({ x, y, el });
}

setInterval(spawnCollectible, 2500);

/* CLOUDS */

const CLOUD_TYPES = [
  {
    sprite: "clouds/cloud1.png",
    width: 333,
    height: 222,
    circles: [
      { x: 0.4, y: 0.7, r: 0.25 },
      { x: 0.6, y: 0.7, r: 0.22 },
      { x: 0.5, y: 0.55, r: 0.3 }
    ]
  },
  {
    sprite: "clouds/cloud2.png",
    width: 248,
    height: 128,
    circles: [
      { x: 0.4, y: 0.6, r: 0.28 },
      { x: 0.6, y: 0.6, r: 0.25 }
    ]
  }
];

const clouds = [];

function spawnCloud(x, y) {
  const type = CLOUD_TYPES[Math.floor(Math.random() * CLOUD_TYPES.length)];
  const scale = 1.5;

  const width = type.width * scale;
  const height = type.height * scale;

  const el = document.createElement("div");
  el.className = "cloud";
  el.style.width = width + "px";
  el.style.height = height + "px";
  el.style.left = x + "px";
  el.style.top = y + "px";
  el.style.backgroundImage = `url(${type.sprite})`;

  world.appendChild(el);
  clouds.push({ x, y, width, height, el, circles: type.circles });
}

for (let i = 0; i < 800; i++) {
  spawnCloud(
  -SCREEN_W * 3.1 + Math.random() * SCREEN_W * 6.2, // allows left and right overhang
  SCREEN_H + Math.random() * (WORLDH - SCREEN_H)
);

}

/* COLLISIONS */

const PLAYER_COLLIDERS = [
  { offsetX: 0, offsetY: -PLAYER_SIZE * 0.25, r: PLAYER_SIZE * 0.3 },
  { offsetX: 0, offsetY: 0, r: PLAYER_SIZE * 0.35 },
  { offsetX: 0, offsetY: PLAYER_SIZE * 0.25, r: PLAYER_SIZE * 0.3 }
];

function resolveCollisions() {
  let onGround = false;
  const px = camX + PLAYER_X;
  const py = camY + PLAYER_Y;

  for (const cloud of clouds) {
    for (const c of cloud.circles) {
      const cx = cloud.x + c.x * cloud.width;
      const cy = cloud.y + c.y * cloud.height;
      const cr = c.r * cloud.width;

      for (const p of PLAYER_COLLIDERS) {
        const colliderX = px + p.offsetX;
        const colliderY = py + p.offsetY;
        const dx = colliderX - cx;
        const dy = colliderY - cy;
        const distSq = dx * dx + dy * dy;
        const minDist = p.r + cr;

        if (distSq < minDist * minDist) {
          const dist = Math.sqrt(distSq) || 0.001;
          const nx = dx / dist;
          const ny = dy / dist;

          const penetration = (minDist - dist) * 0.5;
          camX += nx * penetration;
          camY += ny * penetration;

          const relVelX = velX;
          const relVelY = velY;
          const dot = relVelX * nx + relVelY * ny;

          if (dot < 0) {
            const impulse = -(1 + RESTITUTION) * dot;
            velX += impulse * nx;
            velY += impulse * ny;

            const rpx = p.offsetX;
            const rpy = p.offsetY;
            const torque = (rpx * ny - rpy * nx) * impulse;
            angVel += torque / INERTIA;
          }
        }
      }
    }
  }

  const groundTop = WORLDH - ground.offsetHeight;
  if (camY + PLAYER_Y + PLAYER_COLLIDERS[2].r > groundTop) {
    camY = groundTop - PLAYER_Y - PLAYER_COLLIDERS[2].r;
    velY = 0;
    onGround = true;
  }

  return onGround;
}

function update() {
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
    if (fallDistance > 2) earnings += fallDistance * Math.sqrt(betAmount) * 0.002;
  }

  for (let i = collectibles.length - 1; i >= 0; i--) {
    const c = collectibles[i];
    if (
      Math.abs(camX + PLAYER_X - c.x) < 90 &&
      Math.abs(camY + PLAYER_Y - c.y) < 90
    ) {
      earnings += betAmount * 0.08;
      riskMultiplier += 0.05;
      c.el.remove();
      collectibles.splice(i, 1);
    }
  }

  if (onGround && fallStarted && !betResolved) {
    betResolved = true;
    const payout = earnings * skillMultiplier * riskMultiplier;
    balance += payout;
    updateBalanceUI();
    betPlaced = false;
    fallStarted = false;
  }

  lastCamY = camY;

  scoreEl.textContent = `₹${(earnings * skillMultiplier * riskMultiplier).toFixed(2)}`;
  player.style.transform = `translate(-50%, -50%) rotate(${angle}rad)`;
  world.style.transform = `translate(${-camX}px, ${-camY}px)`;

  requestAnimationFrame(update);
}

update();
