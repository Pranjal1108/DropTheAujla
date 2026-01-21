import * as C from './constants.js';
import { state, objects } from './state.js';
import { elements } from './ui.js';

/**
 * Spawn a cloud from script data
 */
export function spawnCloud(data) {
    const role = data.role || 'normal';

    // ===== VISUAL THINNING (CONTROL CLOUD CULLING) =====
    if (role === 'guide' || role === 'redirect') {
        const px = state.camX + C.PLAYER_X;

        const distFromCenter = Math.abs(data.x - C.SCREEN_CENTER);
        const centerBias = distFromCenter < C.CORE_WIDTH * 0.8;

        const keepChance =
            role === 'redirect'
                ? (centerBias ? 0.55 : 0.75)
                : (centerBias ? 0.35 : 0.55);

        if (state.visualRng() > keepChance) {
            // Invisible control cloud (physics still applies)
            objects.clouds.push({
                x: data.x,
                y: data.y,
                centerY: data.centerY,
                radius: data.radius || C.DEFAULT_CLOUD_RADIUS,
                role,
                influence: data.influence || {},
                el: null,
                invisible: true
            });
            return;
        }
    }

    // ===== NORMAL VISUAL SPAWN =====
    const el = document.createElement("div");
    el.className = "cloud";

    const radius = data.radius || C.DEFAULT_CLOUD_RADIUS;
    const scale = radius / 100;

    const pick = state.visualRng() < 0.5 ? 1 : 2;
    let W, H;

    if (pick === 1) {
        W = C.CLOUD1_W * scale;
        H = C.CLOUD1_H * scale;
        el.style.background = "url('clouds/cloud4.png') no-repeat center/contain";
    } else {
        W = C.CLOUD2_W * scale;
        H = C.CLOUD2_H * scale;
        el.style.background = "url('clouds/cloud2.png') no-repeat center/contain";
    }

    if (role === 'stopper') {
        el.style.filter = "brightness(0.82) saturate(1.15)";
        el.style.opacity = "0.95";
    } else if (role === 'redirect') {
        el.style.opacity = "0.92";
    } else if (role === 'guide') {
        el.style.opacity = "0.88";
    } else if (role === 'ambient') {
        el.style.opacity = "0.4";
    }

    el.style.width = W + "px";
    el.style.height = H + "px";
    el.style.left = (data.x - W / 2) + "px";
    el.style.top = data.y + "px";
    el.style.position = "absolute";

    elements.world.appendChild(el);

    objects.clouds.push({
        x: data.x,
        y: data.y,
        centerY: data.centerY || (data.y + H * 0.5),
        radius,
        el,
        role,
        influence: data.influence || {},
        W,
        H
    });
}


/**
 * Spawn dark cloud
 */
export function spawnDarkCloud(x, y) {
    const el = document.createElement("div");
    el.className = "dark-cloud";
    el.style.width = C.DARK_W + "px";
    el.style.height = C.DARK_H + "px";
    el.style.left = (x - C.DARK_W / 2) + "px";
    el.style.top = y + "px";
    el.style.position = "absolute";
    
    elements.world.appendChild(el);
    
    const rects = C.DARK_RECTS.map(r => ({
        x: (x - C.DARK_W / 2) + r.x * C.DARK_W,
        y: y + r.y * C.DARK_H,
        w: r.w * C.DARK_W,
        h: r.h * C.DARK_H
    }));
    
    objects.darkClouds.push({ x: x - C.DARK_W / 2, y, el, rects });
}

/**
 * Spawn black hole
 */
export function spawnBlackHole(x, y, mult, payout) {
    const el = document.createElement("div");
    el.className = "black-hole";
    el.style.width = C.BH_SIZE + "px";
    el.style.height = C.BH_SIZE + "px";
    el.style.left = (x - C.BH_SIZE / 2) + "px";
    el.style.top = y + "px";
    el.style.position = "absolute";
    el.style.background = "url('items/black_hole_1.png') no-repeat center/contain";
    
    elements.world.appendChild(el);
    
    objects.blackHoles.push({
        x: x - C.BH_SIZE / 2,
        y,
        el,
        rotation: 0,
        multiplier: mult || 5,
        payout: payout || 0
    });
}

/**
 * Spawn tank
 */
export function spawnTank(x, y, payout, multiplier) {
    const el = document.createElement("div");
    el.className = "tank";
    el.style.cssText = `
        width: ${C.TANK_W}px;
        height: ${C.TANK_H}px;
        left: ${x - C.TANK_W / 2}px;
        top: ${y - C.TANK_H}px;
        position: absolute;
        background: url('items/tank.png') no-repeat center/contain;
    `;
    
    elements.world.appendChild(el);
    
    objects.tank = {
        x: x - C.TANK_W / 2,
        y: y - C.TANK_H,
        el,
        w: C.TANK_W,
        h: C.TANK_H,
        multiplier: multiplier || 5,
        payout: payout || 0
    };
}

/**
 * Spawn camp
 */
export function spawnCamp(x, y, payout, multiplier) {
    const el = document.createElement("div");
    el.className = "military-camp";
    el.style.cssText = `
        width: ${C.CAMP_W}px;
        height: ${C.CAMP_H}px;
        left: ${x - C.CAMP_W / 2}px;
        top: ${y - C.CAMP_H}px;
        position: absolute;
        background: url('items/camp.png') no-repeat center/contain;
    `;
    
    elements.world.appendChild(el);
    
    objects.camp = {
        x: x - C.CAMP_W / 2,
        y: y - C.CAMP_H,
        el,
        w: C.CAMP_W,
        h: C.CAMP_H,
        multiplier: multiplier || 50,
        payout: payout || 0
    };
}

/**
 * Spawn collectible
 */
export function spawnCollectible(x, y, type) {
    const SIZE = 170;
    const el = document.createElement("div");
    el.className = type === 'nuke' ? 'collectible nuke' : 'collectible note';
    el.style.cssText = `
        width: ${SIZE}px;
        height: ${SIZE}px;
        left: ${x - SIZE/2}px;
        top: ${y - SIZE/2}px;
        position: absolute;
    `;
    elements.world.appendChild(el);
    objects.collectibles.push({ x, y, el, type, collected: false });
}
