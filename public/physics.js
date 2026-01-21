import * as C from './constants.js';
import { state, objects } from './state.js';

let nearMissConsumed = false;

/**
 * Get player center position
 */
export function getPlayerCenter() {
    return {
        x: state.camX + C.PLAYER_X,
        y: state.camY + C.PLAYER_Y,
        r: C.PLAYER_RADIUS
    };
}

/**
 * Resolve all collisions
 */
export function resolveCollisions() {
    let onGround = false;
    const player = getPlayerCenter();
    const px = player.x;
    const py = player.y;
    const pr = player.r;

    // ===== CLOUDS =====
    for (const cloud of objects.clouds) {
        if (Math.abs(cloud.centerY - py) > C.ACTIVE_WINDOW_BELOW + 100) continue;

        const dx = px - cloud.x;
        const dy = py - cloud.centerY;
        const distSq = dx * dx + dy * dy;
        const minDist = pr + cloud.radius;

        if (distSq < minDist * minDist && distSq > 0.001) {
            const dist = Math.sqrt(distSq);
            const nx = dx / dist;
            const ny = dy / dist;
            const overlap = minDist - dist;

            state.camX += nx * overlap * 0.6;
            state.camY += ny * overlap * 0.6;

            const relVel = state.velX * nx + state.velY * ny;
            if (relVel < 0) {
                const influence = cloud.influence || {};
                const isStopper = cloud.role === 'stopper' || influence.settle;

                if (isStopper) {
                    state.velY *= -0.05;
                    if (Math.abs(state.velY) < 2) state.velY = 0;
                } else {
                    // ===== CLOUD INTENT BIAS =====
                    // Context, not randomness
                    const speed = Math.hypot(state.velX, state.velY);
                    const pxNorm = Math.abs((px - C.SCREEN_CENTER) / C.CORE_WIDTH);

                    // Phase inference (same logic as applyPhysics)
                    const pyNorm = Math.min(1, Math.max(0,
                        (py - C.SPAWN_START_Y) /
                        (C.GROUND_COLLISION_Y - C.SPAWN_START_Y)
                    ));

                    // Intent weights
                    let bounceMul = 1;
                    let slideBias = 0;

                    // === EARLY: forgiving helper ===
                    if (pyNorm < 0.35) {
                        bounceMul = 0.85;
                        slideBias = -nx * 0.3;
                    }
                    // === MID: chaotic / betraying ===
                    else if (pyNorm < 0.75) {
                        bounceMul = 1.1;
                        slideBias = nx * 0.6 * pxNorm;
                    }
                    // === LATE: teasing / cold ===
                    else {
                        bounceMul = 0.95;
                        slideBias = nx * 0.9;
                    }

                    const bounce = (influence.bounce ?? C.DEFAULT_BOUNCE) * bounceMul;

                    // Core collision response (unchanged)
                    state.velX -= (1 + bounce) * relVel * nx;
                    state.velY -= (1 + bounce) * relVel * ny;

                    const friction = influence.friction ?? C.DEFAULT_FRICTION;
                    const tangX = state.velX - (state.velX * nx + state.velY * ny) * nx;
                    const tangY = state.velY - (state.velX * nx + state.velY * ny) * ny;
                    state.velX -= tangX * (1 - friction);
                    state.velY -= tangY * (1 - friction);

                    // ===== INTENTIONAL SLIDE / BETRAYAL =====
                    state.velX += slideBias;

                    // ===== PREVENT RESTING (from earlier fix) =====
                    const landing = ny < -0.65 && Math.abs(state.velY) < 2.4;
                    if (landing) {
                        state.velX += (nx > 0 ? 1 : -1);
                        state.velY += 0.8;
                    }
                }

                state.velX *= 0.92;
                state.velY *= 0.92;
            }
        }
    }

    // ===== NEAR-MISS SYSTEM (TANK / CAMP) =====
    if (!nearMissConsumed) {
        const targets = [];
        if (objects.tank) targets.push(objects.tank);
        if (objects.camp) targets.push(objects.camp);

        for (const t of targets) {
            const cx = t.x + t.w / 2;
            const cy = t.y + t.h / 2;

            const dx = px - cx;
            const dy = py - cy;
            const dist = Math.hypot(dx, dy);

            // Near but NOT touching
            if (dist < 260 && dist > pr + 30) {
                const nx = dx / dist;
                const ny = dy / dist;

                // Gentle attraction first
                state.velX -= nx * 0.15;
                state.velY -= ny * 0.1;

                // Then forced slide-away
                if (dist < 160) {
                    state.velX += (nx > 0 ? 1 : -1) * 1.4;
                    state.velY += 0.9;
                    nearMissConsumed = true;
                }
            }
        }
    }

    // ===== GROUND =====
    if (py + pr >= C.GROUND_COLLISION_Y) {
        state.camY = C.GROUND_COLLISION_Y - pr - C.PLAYER_Y;
        if (state.velY > 2) {
            state.velY = -state.velY * 0.2;
            state.velX *= 0.7;
        } else {
            state.velY = 0;
            state.velX *= C.GROUND_FRICTION;
            onGround = true;
        }
    }

    return onGround;
}

/**
 * Apply gravity & steering
 */
export function applyPhysics(onGround) {
    if (!onGround) {
        state.velY = Math.min(state.velY + C.GRAVITY, C.MAX_FALL);
    }

    const px = state.camX + C.PLAYER_X;
    const speed = Math.hypot(state.velX, state.velY);

    if (!onGround && speed > 3.5) {
        const offset = (px - C.SCREEN_CENTER) / C.CORE_WIDTH;
        state.velX += -offset * 0.035 * Math.min(1, speed / 18);
    }

    state.camX += state.velX;
    state.camY += state.velY;

    state.velX *= C.AIR_FRICTION;
    if (onGround) state.velX *= C.GROUND_FRICTION;

    state.angVel *= onGround ? 0.4 : 0.992;
    state.angle += state.angVel;
}

/**
 * Check for flip detection
 */
export function checkFlip(angleAccumulator, angVel, showFlipText) {
    // Flip detection logic from original script.js
    angleAccumulator += angVel;
    if (Math.abs(angleAccumulator) >= Math.PI * 2) {
        showFlipText(angleAccumulator > 0 ? "BACKFLIP!" : "FRONTFLIP!");
        angleAccumulator = 0;
    }
    return angleAccumulator;
}

/**
 * Check if player is stuck and nudge them
 */
export function checkStuck() {
    const speed = Math.hypot(state.velX, state.velY);

    if (state.fallStarted && speed < 0.15 && state.camY > 1500 && !state.gameStopped) {
        console.warn("⚠️ Player stuck — nudging");

        state.velY += 1.2;
        state.velX += (Math.random() - 0.5) * 2;
        state.angVel += (Math.random() - 0.5) * 0.05;
    }
}

/**
 * Reset hook (call on new run)
 */
export function resetNearMiss() {
    nearMissConsumed = false;
}
