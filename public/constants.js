// ==================== WORLD ====================
export const SCREEN_W = 1920;
export const SCREEN_H = 1200;
export const SCREEN_CENTER = SCREEN_W / 2;

export const GROUND_Y = 19300;
export const GROUND_COLLISION_Y = 19280;
export const GROUND_HEIGHT = 700;
export const VOID_START_Y = -1000;

// Dead zones
export const PLANE_DEAD_ZONE = 200;
export const GROUND_DEAD_ZONE = 200;
export const SPAWN_START_Y = SCREEN_H / 2 + PLANE_DEAD_ZONE;
export const SPAWN_END_Y = GROUND_Y - GROUND_DEAD_ZONE;

// Soft horizontal envelope
export const CORE_WIDTH = 600;
export const SOFT_ZONE_WIDTH = 300;
export const ENVELOPE_INNER = SCREEN_CENTER - CORE_WIDTH;
export const ENVELOPE_OUTER = SCREEN_CENTER + CORE_WIDTH;
export const CORRECTION_INNER = ENVELOPE_INNER - SOFT_ZONE_WIDTH;
export const CORRECTION_OUTER = ENVELOPE_OUTER + SOFT_ZONE_WIDTH;

// Player position on screen
export const PLAYER_X = SCREEN_W / 2;
export const PLAYER_Y = SCREEN_H / 2;

// ==================== PHYSICS ====================
export const GRAVITY = 0.55;
export const MAX_FALL = 28;
export const AIR_FRICTION = 0.995;
export const GROUND_FRICTION = 0.85;
export const PLAYER_RADIUS = 65;

// Cloud defaults
export const DEFAULT_CLOUD_RADIUS = 110;
export const DEFAULT_BOUNCE = 0.65;
export const DEFAULT_FRICTION = 0.85;

// ==================== OBJECTS ====================
export const BH_SIZE = 300;
export const BH_RADIUS = 100;
export const DARK_W = 420;
export const DARK_H = 280;
export const TANK_W = 400;
export const TANK_H = 300;
export const CAMP_W = 800;
export const CAMP_H = 600;

// Performance
export let ACTIVE_WINDOW_ABOVE = 800;
export let ACTIVE_WINDOW_BELOW = 1200;

export function setActiveWindow(above, below) {
    ACTIVE_WINDOW_ABOVE = above;
    ACTIVE_WINDOW_BELOW = below;
}

// ==================== VISUALS ====================
export const CLOUD1_W = 320 * 1.5;
export const CLOUD1_H = 160 * 1.5;
export const CLOUD2_W = 325 * 1.3;
export const CLOUD2_H = 217 * 1.3;

export const DARK_RECTS = [
    { w: 0.19, h: 0.086, x: 0.418, y: 0.193 },
    { w: 0.43, h: 0.118, x: 0.296, y: 0.278 },
    { w: 0.77, h: 0.214, x: 0.125, y: 0.476 }
];

export const DEBUG = true;