import { makeRng } from "./rng.js";
import { generateOutcome } from "./outcome.js";

let sum = 0;
const RUNS = 5_000_000;

for (let i = 0; i < RUNS; i++) {
  const rng = makeRng("s", "c", i);
  sum += generateOutcome(rng);
}

console.log("RTP:", sum / RUNS);
