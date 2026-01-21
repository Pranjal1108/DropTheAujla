import { state, objects } from './state.js';
import * as C from './constants.js';
import { elements, showMultiplier, showScore, showFlipText, updateBalanceUI } from './ui.js';
import { resolveCollisions, checkStuck } from './physics.js';

function recycleClouds() {
    const threshold = state.camY - 2000;
    objects.clouds = objects.clouds.filter(c => {
        if (c.y < threshold) {
            c.el?.remove();
            return false;
        }
        return true;
    });
}

function recycleDarkClouds() {
    const threshold = state.camY - 2000;
    objects.darkClouds = objects.darkClouds.filter(c => {
        if (c.y < threshold) {
            c.el?.remove();
            return false;
        }
        return true;
    });
}

function recycleBlackHoles() {
    const threshold = state.camY - 2000;
    objects.blackHoles = objects.blackHoles.filter(bh => {
        if (bh.y < threshold) {
            bh.el?.remove();
            return false;
        }
        return true;
    });
}

function recyclePushables() {
    const threshold = state.camY - 2000;
    objects.pushables = objects.pushables.filter(p => {
        if (p.y < threshold) {
            p.el?.remove();
            return false;
        }
        return true;
    });
}

export function update() {
  console.log("MODULAR UPDATE RUNNING");

  if (state.bhAnimating) {
    const now = performance.now();
    const t = Math.min((now - state.bhAnimStartTime) / state.bhAnimDuration, 1);
    const size = state.bhAnimStartSize + (state.bhAnimEndSize - state.bhAnimStartSize) * t;

    state.bhAnimEl.style.width = size + "px";
    state.bhAnimEl.style.height = size + "px";
    state.bhAnimEl.style.left = (state.bhAnimEl.dataset.x - size / 2) + "px";
    state.bhAnimEl.style.top = (state.bhAnimEl.dataset.y - size / 2) + "px";

    if (t >= 1) {
      state.bhAnimating = false;
      if (state.bhAnimType === "enter") enterBlackHoleLogic();
      state.bhAnimEl.remove();
      state.bhAnimEl = null;
    }

    render();
    requestAnimationFrame(update);
    return;
  }

  if (state.exitingAnimation) {
    const now = performance.now();
    const t = Math.min((now - state.exitAnimStart) / 1000, 1);
    const scale = 1 + Math.sin(t * Math.PI) * 0.2;
    elements.sprite.style.transform = `translate(-50%, -50%) scale(${scale}) rotate(${state.angle}rad)`;

    if (t >= 1) {
      state.exitingAnimation = false;
      elements.sprite.style.transform = `translate(-50%, -50%) rotate(${state.angle}rad)`;
    }

    render();
    requestAnimationFrame(update);
    return;
  }

  if (state.inBlackHole) {
    if (state.bhShowcaseStart === 0) {
      state.bhShowcaseStart = performance.now();
      showMultiplier(state.bhTargetMultiplier);
    } else if (performance.now() - state.bhShowcaseStart >= 1000) {
      state.bhShowcaseStart = 0;
      exitBlackHole();
    }

    showScore();
    render();
    requestAnimationFrame(update);
    return;
  }

  if (state.grabbedByDarkCloud) {
    state.camX = state.freezeX;
    state.camY = state.freezeY;

    if (performance.now() >= state.releaseTime) {
      state.grabbedByDarkCloud = false;

      if (state.grabbedCloud) {
        state.grabbedCloud.el.remove();
        objects.darkClouds.splice(objects.darkClouds.indexOf(state.grabbedCloud), 1);
        state.grabbedCloud = null;
      }

      if (state.skeletonFlashInterval) clearInterval(state.skeletonFlashInterval);
      state.skeletonFlashInterval = null;
      elements.skeleton.style.display = "none";
      elements.sprite.style.display = "block";

      const angleSpread = (Math.random() * Math.PI / 2.2) - (Math.PI / 4.4);
      const power = 28;
      state.velX = Math.sin(angleSpread) * power;
      state.velY = -Math.cos(angleSpread) * power;
      state.angVel = (Math.random() - 0.5) * 0.08;
    }

    render();
    requestAnimationFrame(update);
    return;
  }

  recycleClouds();
  recycleDarkClouds();
  recycleBlackHoles();
  recyclePushables();

  for (let bh of objects.blackHoles) {
    const px = state.camX + C.PLAYER_X;
    const py = state.camY + C.PLAYER_Y;
    const bx = bh.x + C.BH_SIZE / 2;
    const by = bh.y + C.BH_SIZE / 2;

    if (Math.abs(bx - px) <= 1000 && Math.abs(by - py) <= 1000) {
      bh.rotation += 0.05;
      bh.el.style.transform = `rotate(${bh.rotation}rad)`;
    }
  }

  const onGround = resolveCollisions();

  if (state.fallStarted && !onGround) state.velY += C.GRAVITY;
  state.velY = Math.min(state.velY, C.MAX_FALL);

  state.camX += state.velX;
  state.camY += state.velY;

  for (const p of objects.pushables) {
    p.x += p.velX;
    p.y += p.velY;
    p.velX *= 0.95;
    p.velY *= 0.95;
  }

  state.velX *= onGround ? C.GROUND_FRICTION : C.AIR_FRICTION;
  state.angVel *= onGround ? 0.35 : 0.989;
  state.angle += state.angVel;

  state.angleAccumulator += state.angVel;
  if (Math.abs(state.angleAccumulator) >= Math.PI * 2) {
    showFlipText(state.angleAccumulator > 0 ? "backflip" : "frontflip");
    state.angleAccumulator = 0;
  }

  if (onGround && state.fallStarted && !state.betResolved) {
    if (state.landedTime === 0) {
      state.landedTime = performance.now();
    } else if (performance.now() - state.landedTime > 1000) {
      state.betResolved = true;

      state.balance += state.currentRun.targetPayout;
      updateBalanceUI();

      state.fallStarted = false;
      state.betPlaced = false;

      setTimeout(() => hardResetWorld(false, 0), 1500);
    }
  } else {
    state.landedTime = 0;
  }

  render();
  checkStuck();
  requestAnimationFrame(update);
}

function startGame() {
  // Clear world and reset state
  clearWorld();

  // Initialize physics
  state.camX = 0;
  state.camY = 0;
  state.velX = 0;
  state.velY = 5; // Initial downward velocity
  state.angle = 0;
  state.angVel = 0;
  state.angleAccumulator = 0;

  // Set game flags
  state.fallStarted = true;
  state.betPlaced = true;
  state.betResolved = false;
  state.gameStopped = false;

  // Reset other states
  state.landedTime = 0;
  state.inBlackHole = false;
  state.bhAnimating = false;
  state.grabbedByDarkCloud = false;
  state.exitingAnimation = false;

  // Show sprite
  elements.sprite.style.display = "block";
  elements.sprite.style.opacity = "1";
  elements.sprite.style.transform = "translate(-50%, -50%)";

  // Hide skeleton
  elements.skeleton.style.display = "none";

  console.log("Modular game started");
}

function enterBlackHoleLogic() {
  state.inBlackHole = true;
  state.bhReturnX = state.camX;
  state.bhReturnY = state.camY;
  state.bhTargetMultiplier = state.currentBH?.multiplier || 5;
  state.bhCurrentMultiplier = 1;
  state.finalEarnings = state.currentBH?.payout || state.targetScore;

  state.camX = 0;
  state.camY = C.VOID_START_Y;
  state.velX = state.velY = state.angVel = 0;
  state.bhShowcaseStart = 0;

  console.log(`   Multiplier: ×${state.bhTargetMultiplier}, Payout: ₹${state.finalEarnings}`);
}

function exitBlackHole() {
  state.inBlackHole = false;
  state.camX = state.bhReturnX;
  state.camY = state.bhReturnY;
  state.displayedScore = state.finalEarnings;
  state.stopAtY = C.GROUND_COLLISION_Y;
  state.stopMethod = 'blackhole';
  state.gameStopped = true;

  console.log("Exited black hole");
}

function clearWorld() {
  // Clear all objects
  objects.clouds.forEach(c => c.el?.remove());
  objects.darkClouds.forEach(c => c.el?.remove());
  objects.blackHoles.forEach(bh => bh.el?.remove());
  objects.collectibles.forEach(c => c.el?.remove());
  objects.pushables.forEach(p => p.el?.remove());

  objects.clouds.length = 0;
  objects.darkClouds.length = 0;
  objects.blackHoles.length = 0;
  objects.collectibles.length = 0;
  objects.pushables.length = 0;

  if (objects.tank?.el) objects.tank.el.remove();
  if (objects.camp?.el) objects.camp.el.remove();
  objects.tank = null;
  objects.camp = null;
}

function hardResetWorld(fullReset, delay) {
  // Reset state
  state.camX = 0;
  state.camY = 0;
  state.velX = 0;
  state.velY = 0;
  state.angle = 0;
  state.angVel = 0;
  state.angleAccumulator = 0;

  state.displayedScore = 0;
  state.targetScore = 0;
  state.scoreProgression = [];
  state.landedTime = 0;

  state.stopAtY = C.GROUND_COLLISION_Y;
  state.stopMethod = 'ground';
  state.gameStopped = false;

  state.isDying = false;
  state.fallStarted = false;
  state.betPlaced = false;
  state.betResolved = false;

  state.inBlackHole = false;
  state.bhAnimating = false;
  state.grabbedByDarkCloud = false;
  state.exitingAnimation = false;

  state.currentSession = null;
  state.currentScript = null;
  state.visualRng = Math.random;

  if (state.skeletonFlashInterval) {
    clearInterval(state.skeletonFlashInterval);
    state.skeletonFlashInterval = null;
  }

  // Clear objects
  clearWorld();

  // Reset near miss
  // Assuming resetNearMiss is in physics.js
  // resetNearMiss();

  console.log("World reset");
}

function render() {
  elements.scoreEl.textContent = `₹${state.displayedScore.toFixed(2)}`;
  elements.world.style.transform = `translate(${-state.camX}px, ${-state.camY}px)`;

  elements.sprite.style.left = state.camX + C.PLAYER_X + "px";
  elements.sprite.style.top = state.camY + C.PLAYER_Y + "px";
  elements.sprite.style.transform = `translate(-50%, -50%) rotate(${state.inBlackHole ? 0 : state.angle}rad)`;

  elements.skeleton.style.left = state.camX + C.PLAYER_X + "px";
  elements.skeleton.style.top = state.camY + C.PLAYER_Y + "px";
  elements.skeleton.style.transform = `translate(-50%, -50%) rotate(${state.angle}rad)`;

  objects.pushables.forEach(p => {
    p.el.style.left = p.x + "px";
    p.el.style.top = p.y + "px";
  });
}
