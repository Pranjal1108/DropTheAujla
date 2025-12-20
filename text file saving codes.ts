text file saving codes

stars 

 - HTML


JS 




CSS





cloud 

CSS




js 

const player = document.getElementById("player");
const cloud = document.getElementById("cloud");

let x = 200;
let y = 200;
let vx = 0;
let vy = 0;

const gravity = 0.6;

document.addEventListener("keydown", e => {
  if (e.key === "ArrowLeft") vx = -4;
  if (e.key === "ArrowRight") vx = 4;
  if (e.key === "ArrowUp") vy = -10;
});

document.addEventListener("keyup", e => {
  if (e.key === "ArrowLeft" || e.key === "ArrowRight") vx = 0;
});

function rectsOverlap(a, b) {
  return !(
    a.right <= b.left ||
    a.left >= b.right ||
    a.bottom <= b.top ||
    a.top >= b.bottom
  );
}

function update() {
  vy += gravity;

  x += vx;
  y += vy;

  const playerRect = {
    left: x,
    top: y,
    right: x + 50,
    bottom: y + 50
  };

  const cloudRect = cloud.getBoundingClientRect();

  if (rectsOverlap(playerRect, cloudRect)) {
    y = cloudRect.top - 50;
    vy = 0;
  }

  player.style.left = x + "px";
  player.style.top = y + "px";

  requestAnimationFrame(update);
}

update();






cloud prev 

.cloud-wrapper {
  position: absolute;
  overflow: visible;
}


/* main horizontal cloud body */
.cloud-main {
  position: absolute;
  width: 100%;
  height: 50%;
  top: 40%;
  left: 0;
  background: linear-gradient(white 70%, #E5E5E5);
  border-radius: 100em;
  border: 2px solid rgba(255, 255, 255, 0.5);
  box-shadow: 0 3px 5px rgba(0,0,0, 0.3);
}

/* big center puff */
.cloud-center {
  position: absolute;
  width: 50%;
  height: 100%;
  background: linear-gradient(white 70%, #E5E5E5);
  border-radius: 100em;
  border: 2px solid rgba(255, 255, 255, 0.5);
  top: -10%;
  right: 18%;
}

/* left puff */
.cloud-left {
  position: absolute;
  width: 50%;
  height: 75%;
  background: linear-gradient(white 70%, #E5E5E5);
  border-radius: 100em;
  border: 2px solid rgba(255, 255, 255, 0.5);
  top: 5%;
  left: 10%;
}

JS

const clouds = [];
const CLOUD_COUNT = 120;

for (let i = 0; i < CLOUD_COUNT; i++) {
  const wrapper = document.createElement("div");
  wrapper.className = "cloud-wrapper";

  const baseWidth = 200;
  const baseHeight = 80;
  const scale = 1 + Math.random() * 3;

  const w = baseWidth * scale;
  const h = baseHeight * scale;

  const visualY =
    PLAYER_Y + SAFE_ZONE_HEIGHT + i * (WORLD_HEIGHT / CLOUD_COUNT);

  const colliderTopOffset = h * 0.15;
  const colliderHeight = h * 0.65;

  const x = Math.random() * (SCREEN_WIDTH - w);
  const y = visualY - colliderTopOffset;

  wrapper.style.position = "absolute";
  wrapper.style.width = w + "px";
  wrapper.style.height = h + "px";
  wrapper.style.left = x + "px";
  wrapper.style.top = y + "px";

  wrapper.innerHTML = `
    <div class="rainy-weather">
      <div class="cloud-main"></div>
      <div class="cloud-center"></div>
      <div class="cloud-left"></div>
    </div>
  `;

  world.appendChild(wrapper);

  clouds.push({
    x,
    y: y + colliderTopOffset,
    w,
    h: colliderHeight
  });
}