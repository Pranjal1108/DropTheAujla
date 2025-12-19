//game
const gameScale = document.getElementById("game-scale");

function scaleGame() {
  const scale = Math.min(window.innerWidth / 1919, window.innerHeight / 1151);
  gameScale.style.transform = `scale(${scale})`;
}
window.addEventListener("resize", scaleGame);
scaleGame();


const world = document.getElementById("world");
const player = document.getElementById("player");
const starsContainer = document.getElementById("stars");

/*window */
const SCREEN_WIDTH = 1919;
const SCREEN_HEIGHT = 1151;
const WORLD_HEIGHT = 8000;
const SAFE_ZONE_HEIGHT = 400;

/*player */
const PLAYER_WIDTH = 60;
const PLAYER_HEIGHT = 80;
const PLAYER_X = SCREEN_WIDTH / 2;
const PLAYER_Y = SCREEN_HEIGHT / 2;

player.style.width = PLAYER_WIDTH + "px";
player.style.height = PLAYER_HEIGHT + "px";
player.style.left = PLAYER_X + "px";
player.style.top = PLAYER_Y + "px";

/* movement */
let worldOffsetX = 0;
let worldOffsetY = 0;
let worldVelocityY = 0;
let velX = 0;
let onGround = false;

const gravity = 0.45;
const MAX_FALL_SPEED = 15;
const friction = 0.85;
const bounceLoss = 0.3;
const MAX_CORRECTION = 60;
const PLAYER_COLLIDE_RADIUS = Math.min(PLAYER_WIDTH, PLAYER_HEIGHT) * 0.35;
const EPS = 1e-6;

/*star*/
for (let i = 0; i < 200; i++) {
  const s = document.createElement("div");
  s.className = "star";
  s.style.left = Math.random() * 100 + "%";
  s.style.top = Math.random() * 100 + "%";
  starsContainer.appendChild(s);
}

/*cloud */
const clouds = [];
const CLOUD_COUNT = 60;

for (let i = 0; i < CLOUD_COUNT; i++) {
  const cloudEl = document.createElement("div");
  cloudEl.className = "cloud";

  const w = 180 + Math.random() * 260;
  const h = 60 + Math.random() * 40;
  const x = Math.random() * (SCREEN_WIDTH - w);
  const y = PLAYER_Y + SAFE_ZONE_HEIGHT + (i * (WORLD_HEIGHT / CLOUD_COUNT));

  cloudEl.style.width = w + "px";
  cloudEl.style.height = h + "px";
  cloudEl.style.left = x + "px";
  cloudEl.style.top = y + "px";

  world.appendChild(cloudEl);

  // hitbox
  const ellipse = {
    cx: x + w / 2,
    cy: y + h / 2,
    rx: w * 0.45,
    ry: h * 0.45
  };

  clouds.push({ x, y, w, h, ellipse });
}

/*Collisons*/
function checkCollisions() {
  const pCenterXWorld = worldOffsetX + PLAYER_X + PLAYER_WIDTH / 2;
  const pCenterYWorld = worldOffsetY + PLAYER_Y + PLAYER_HEIGHT / 2;
  const playerR = PLAYER_COLLIDE_RADIUS;

  let nearest = null;
  let minDist = Infinity;

  for (const cloud of clouds) {
    const e = cloud.ellipse;
    const dx = pCenterXWorld - e.cx;
    const dy = pCenterYWorld - e.cy;
    const d = Math.hypot(dx, dy);

    //distances for ellipse
    const nx = dx / e.rx;
    const ny = dy / e.ry;
    const dist = Math.hypot(nx, ny);

    if (dist < 1) { // innerellipse
      const b = d / dist; // boundary
      const overlap = b - d + playerR;
      const normX = dx / d;
      const normY = dy / d;

      if (dist < minDist) {
        minDist = dist;
        nearest = { dx, dy, d, dist, overlap, normX, normY, ellipse: e };
      }
    }
  }

  if (!nearest) {
    onGround = false;
    return;
  }

  const { overlap, normX, normY } = nearest;

  let corrX = normX * overlap;
  let corrY = normY * overlap;

  corrX = Math.max(-MAX_CORRECTION, Math.min(MAX_CORRECTION, corrX));
  corrY = Math.max(-MAX_CORRECTION, Math.min(MAX_CORRECTION, corrY));

  worldOffsetX -= corrX;
  worldOffsetY -= corrY;

  let vx = velX;
  let vy = worldVelocityY;

  const normalVel = vx * normX + vy * normY;

  if (normalVel < 0) {
    const restitution = bounceLoss;
    const impulseFactor = 1 + restitution;
    const dvx = -normX * normalVel * impulseFactor;
    const dvy = -normY * normalVel * impulseFactor;

    vx += dvx;
    vy += dvy;
  }

  if (normY < -0.5) {
    onGround = true;
    if (vy > 0) vy = 0;
    vx *= 0.9;
  } else {
    onGround = false;
  }

  velX = vx;
  worldVelocityY = vy;

  worldOffsetY = Math.max(0, Math.min(WORLD_HEIGHT - SCREEN_HEIGHT, worldOffsetY));
}

/*UPDATE*/
function update() {
  worldVelocityY += gravity;
  worldVelocityY = Math.min(worldVelocityY, MAX_FALL_SPEED);
  worldOffsetY += worldVelocityY;

  checkCollisions();

  velX *= friction;
  worldOffsetX += velX;

  const rotation = Math.max(-30, Math.min(velX * 2, 30));
  player.style.transform = `translate(-50%, -50%) rotate(${rotation}deg)`;
  world.style.transform = `translate(${-worldOffsetX}px, ${-worldOffsetY}px)`;

  requestAnimationFrame(update);
}

update();