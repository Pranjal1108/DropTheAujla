import { createRNG } from "./rng.js";
import { rand } from "carrot-sdk";

const WORLD_HEIGHT = 20000;

export function generateRun(bet, options = {}) {
  const seed = crypto.getRandomValues(new Uint32Array(1))[0];
  const rng = createRNG(seed);

  const outcome = rollOutcome(rng.core);
  const targetPayout = Math.floor(bet * outcome.multiplier * 100) / 100;

  const script = buildScript(outcome.type, rng.visual);

  return {
    seed,
    targetPayout,
    script
  };
}

function rollOutcome(rng) {
  const r = rng();

  if (r < 0.349230769) return { type: "dead", multiplier: 0 };
  if (r < 0.609230769) return { type: "tease", multiplier: rand(0.2, 0.6, rng) };
  if (r < 0.829230769) return { type: "normal", multiplier: rand(0.9, 1.4, rng) };
  if (r < 0.959230769) return { type: "big", multiplier: rand(2.0, 3.2, rng) };
  return { type: "insane", multiplier: rand(5, 8, rng) };
}


function rand(min, max, rng) {
  return min + rng() * (max - min);
}

function buildScript(type, rng) {
  const script = {
    checkpoints: {},
    spawns: [],
    collectibles: [],
    blackhole: null
  };

  if (type === "dead") {
    script.checkpoints.pickup = { progress: 0.15 };
    script.checkpoints.darkCloud = { progress: 0.3 };
    addCollectibles(script, 40, 0.05, 0.3, rng);
  }

  if (type === "tease") {
    script.checkpoints.pickup = { progress: 0.35 };
    script.checkpoints.tank = { progress: 0.5 };
    script.checkpoints.darkCloud = { progress: 0.65 };
    addCollectibles(script, 80, 0.1, 0.7, rng);
  }

  if (type === "normal") {
    script.checkpoints.pickup = { progress: 0.4 };
    script.checkpoints.tank = { progress: 0.6 };
    script.checkpoints.camp = { progress: 0.75 };
    addCollectibles(script, 120, 0.15, 0.85, rng);
  }

  if (type === "big") {
    script.checkpoints.pickup = { progress: 0.45 };
    script.checkpoints.tank = { progress: 0.65 };
    script.checkpoints.camp = { progress: 0.8 };
    addCollectibles(script, 200, 0.1, 0.9, rng);
    addBlackHole(script, 5, 0.8);
  }

  if (type === "insane") {
    script.checkpoints.pickup = { progress: 0.5 };
    script.checkpoints.tank = { progress: 0.7 };
    script.checkpoints.camp = { progress: 0.85 };
    addCollectibles(script, 300, 0.05, 0.95, rng);
    addBlackHole(script, 10, 0.9);
  }

  return script;
}

function addCollectibles(script, count, minP, maxP, rng) {
  for (let i = 0; i < count; i++) {
    script.collectibles.push({
      type: rng() < 0.5 ? "nuke" : "note",
      progress: minP + rng() * (maxP - minP)
    });
  }
}

function addBlackHole(script, multiplier, progress) {
  script.blackhole = { multiplier };
  script.spawns.push({
    type: "blackhole",
    y: WORLD_HEIGHT * progress,
    multiplier
  });
}
