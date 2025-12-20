/* ================= SCALE ================= */
const gameScale = document.getElementById("game-scale");

function scaleGame() {
  const scale = Math.min(
    window.innerWidth / 1919,
    window.innerHeight / 1151
  );
  gameScale.style.transform = `scale(${scale})`;
}

window.addEventListener("resize", scaleGame);
scaleGame();

/* ================= ELEMENTS ================= */
const world = document.getElementById("world");
const player = document.getElementById("player");
const ground = document.getElementById("ground");

/* ================= CONSTANTS ================= */
const SCREEN_W = 1919;
const SCREEN_H = 1151;
const WORLD_H = 8000;

const PLAYER_SIZE = 60;
const PLAYER_RADIUS = PLAYER_SIZE / 2;
const PLAYER_X = SCREEN_W / 2;
const PLAYER_Y = SCREEN_H / 2;

/* ===== DEADZONES (FULL SCREEN) ===== */
const TOP_DEADZONE = SCREEN_H;
const BOTTOM_DEADZONE = SCREEN_H;

player.style.width = PLAYER_SIZE + "px";
player.style.height = PLAYER_SIZE + "px";

/* ================= PHYSICS ================= */
let camX = 0;
let camY = 0;
let velX = 2.2;
let velY = 0;

let gravityEnabled = false;

const GRAVITY = 0.6;
const MAX_FALL = 20;
const FRICTION = 0.88;
const AIR_FRICTION = 0.99;

/* ================= INPUT ================= */
window.addEventListener("keydown", e => {
  if (e.code === "Space") {
    gravityEnabled = true;
  }
});

/* ================= CLOUDS ================= */
const clouds = [];
const CLOUD_COUNT = 200;

function spawnCloud(x, y) {
  const cloudEl = document.createElement("div");
  cloudEl.className = "cloud";

  const width = 160 + Math.random() * 120;
  const height = 60 + Math.random() * 60;

  cloudEl.style.width = width + "px";
  cloudEl.style.height = height + "px";
  cloudEl.style.left = x + "px";
  cloudEl.style.top = y + "px";

  world.appendChild(cloudEl);

  const circles = [
    { x: x + width * 0.3, y: y + height * 0.5, r: width * 0.18 },
    { x: x + width * 0.55, y: y + height * 0.3, r: width * 0.23 },
    { x: x + width * 0.8, y: y + height * 0.5, r: width * 0.18 },
  ];

  clouds.push({ circles });
}

/* ===== SPAWN CLOUDS (RESPECT DEADZONES) ===== */
for (let i = 0; i < CLOUD_COUNT; i++) {
  const x = Math.random() * SCREEN_W * 5;
  const y =
    TOP_DEADZONE +
    Math.random() *
      (WORLD_H - TOP_DEADZONE - BOTTOM_DEADZONE);

  spawnCloud(x, y);
}

/* ================= COLLISION ================= */
function resolveCollisions() {
  let onGround = false;

  const px = camX + PLAYER_X;
  const py = camY + PLAYER_Y;

  for (const cloud of clouds) {
    for (const c of cloud.circles) {
      const dx = px - c.x;
      const dy = py - c.y;
      const dist = Math.hypot(dx, dy);
      const minDist = PLAYER_RADIUS + c.r;

      if (dist < minDist) {
        const nx = dx / dist;
        const ny = dy / dist;
        const penetration = minDist - dist;

        camX += nx * penetration;
        camY += ny * penetration;

        const dot = velX * nx + velY * ny;
        velX -= nx * dot;
        velY -= ny * dot;

        velX *= 0.98;
        velY *= 0.98;

        if (ny < -0.7) onGround = true;
      }
    }
  }

  /* ===== SOLID GROUND ===== */
  const groundTop = WORLD_H - ground.offsetHeight;
  const playerBottom = camY + PLAYER_Y + PLAYER_RADIUS;

  if (playerBottom > groundTop) {
    camY = groundTop - PLAYER_Y - PLAYER_RADIUS;
    velY = 0;
    onGround = true;
  }

  return onGround;
}

/* ================= LOOP ================= */
let angle = 0;

function update() {
  const onGround = resolveCollisions();

  if (gravityEnabled && !onGround) velY += GRAVITY;
  if (velY > MAX_FALL) velY = MAX_FALL;

  camX += velX;
  camY += velY;

  velX *= onGround ? FRICTION : AIR_FRICTION;

  angle += velX * 2;
  angle *= 0.92;

  player.style.transform =
    `translate(-50%, -50%) rotate(${angle}deg)`;

  world.style.transform =
    `translate(${-camX}px, ${-camY}px)`;

  requestAnimationFrame(update);
}

update();
