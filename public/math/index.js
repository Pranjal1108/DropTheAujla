import { makeRng } from "./rng.js";
import { generateOutcome } from "./outcome.js";

export function runGame({ serverSeed, clientSeed, nonce }) {
  const rng = makeRng(serverSeed, clientSeed, nonce);

  const multiplier = generateOutcome(rng);

  return {
    multiplier
  };
}
