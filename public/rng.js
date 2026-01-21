/**
 * Mulberry32 PRNG - Deterministic random number generator
 */
function mulberry32(seed) {
    let t = seed >>> 0;
    return function() {
        t += 0x6D2B79F5;
        let x = t;
        x = Math.imul(x ^ (x >>> 15), x | 1);
        x ^= x + Math.imul(x ^ (x >>> 7), x | 61);
        return ((x ^ (x >>> 14)) >>> 0) / 4294967296;
    };
}

/**
 * Create split RNG streams from a single seed
 */
export function createRNG(seed) {
    const base = seed >>> 0;
    return {
        core: mulberry32(base ^ 0xA5A5A5A5),
        visual: mulberry32(base ^ 0x5A5A5A5A),
    };
}