// === GAME SCALE ===
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

// === ELEMENTS & CONSTANTS ===
const world = document.getElementById("world");
const player = document.getElementById("player");
const ground = document.getElementById("ground");

const SCREEN_W = 1919;
const SCREEN_H = 1151;
const WORLD_H = world.offsetHeight;

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

let gravityEnabled = false;

const GRAVITY = 0.35;
const MAX_FALL = 16;
const GROUND_FRICTION = 0.98;
const AIR_FRICTION = 0.995;
const RESTITUTION = 0.4;
const PLAYER_INERTIA = 0.5 * PLAYER_SIZE * PLAYER_SIZE;

window.addEventListener("keydown", e => {
  if (e.code === "Space") gravityEnabled = true;
});

// === CLOUD TYPES ===
const CLOUD_TYPES = [
  {
    sprite: "clouds/cloud1.png",
    width: 333,
    height: 222,
    circles: [
      { x: 844/333, y: 159/222, r: 76/333 },
      { x: 776/333, y: 187/222, r: 49/333 },
      { x: 737/333, y: 206/222, r: 46/333 },
      { x: 714/333, y: 231/222, r: 49/333 },
      { x: 724/333, y: 244/222, r: 22/333 },
      { x: 790/333, y: 231/222, r: 67/333 },
      { x: 844/333, y: 243/222, r: 68/333 },
      { x: 910/333, y: 231/222, r: 54/333 },
      { x: 863/333, y: 253/222, r: 28/333 },
      { x: 947/333, y: 235/222, r: 48/333 },
      { x: 929/333, y: 219/222, r: 39/333 },
      { x: 892/333, y: 192/222, r: 55/333 }
    ]
  },
  {
    sprite: "clouds/cloud2.png",
    width: 248,
    height: 128,
    circles: [
      { x: 638/248, y: 388/128, r: 87/248 },
      { x: 539/248, y: 419/128, r: 68/248 },
      { x: 514/248, y: 457/128, r: 67/248 },
      { x: 616/248, y: 470/128, r: 58/248 },
      { x: 666/248, y: 454/128, r: 57/248 },
      { x: 695/248, y: 454/128, r: 59/248 },
      { x: 666/248, y: 432/128, r: 46/248 },
      { x: 569/248, y: 466/128, r: 47/248 },
      { x: 531/248, y: 476/128, r: 31/248 },
      { x: 556/248, y: 428/128, r: 30/248 }
    ]
  }
];

const clouds = [];
const CLOUD_COUNT = 1000;

// === SPAWN CLOUD ===
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
  el.style.backgroundSize = "contain";
  el.style.backgroundRepeat = "no-repeat";
  el.style.position = "absolute";

  world.appendChild(el);

  clouds.push({
    x,
    y,
    width,
    height,
    el,
    circles: type.circles
  });
}

for (let i = 0; i < CLOUD_COUNT; i++) {
  const x = Math.random() * SCREEN_W * 6;
  const y = SCREEN_H + Math.random() * (WORLD_H - SCREEN_H * 2);
  spawnCloud(x, y);
}

// === PLAYER COLLIDERS ===
const PLAYER_COLLIDERS = [
  { offsetX: 0, offsetY: -PLAYER_SIZE * 0.25, r: PLAYER_SIZE * 0.3 },
  { offsetX: 0, offsetY: 0, r: PLAYER_SIZE * 0.35 },
  { offsetX: 0, offsetY: PLAYER_SIZE * 0.25, r: PLAYER_SIZE * 0.3 }
];

// === COLLISION ===
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
        const dx = px + p.offsetX - cx;
        const dy = py + p.offsetY - cy;

        const distSq = dx * dx + dy * dy;
        const minDist = p.r + cr;

        if (distSq < minDist * minDist) {
          const dist = Math.sqrt(distSq) || 0.0001;
          const nx = dx / dist;
          const ny = dy / dist;
          const penetration = minDist - dist;

          camX += nx * penetration;
          camY += ny * penetration;

          const dot = velX * nx + velY * ny;
          velX -= (1 + RESTITUTION) * dot * nx;
          velY -= (1 + RESTITUTION) * dot * ny;

          const torque = (p.offsetX * ny - p.offsetY * nx) * dot;
          angVel += torque / PLAYER_INERTIA;

          if (ny < -0.8 && velY > 0) onGround = true;
        }
      }
    }
  }

  const groundTop = WORLD_H - ground.offsetHeight;
  const playerBottom = camY + PLAYER_Y + PLAYER_COLLIDERS[2].r;

  if (playerBottom > groundTop) {
    camY = groundTop - PLAYER_Y - PLAYER_COLLIDERS[2].r;
    velY = 0;
    angVel *= 0.8;
    onGround = true;
  }

  return onGround;
}

// === UPDATE LOOP ===
function update() {
  const onGround = resolveCollisions();

  if (gravityEnabled && !onGround) velY += GRAVITY;
  if (velY > MAX_FALL) velY = MAX_FALL;

  camX += velX;
  camY += velY;

  velX *= onGround ? GROUND_FRICTION : AIR_FRICTION;

  angle += angVel;
  angVel *= onGround ? 0.85 : 0.995;
  angVel = Math.max(Math.min(angVel, 0.3), -0.3);

  player.style.transform = `translate(-50%, -50%) rotate(${angle}rad)`;
  world.style.transform = `translate(${-camX}px, ${-camY}px)`;

  requestAnimationFrame(update);
}

update();
