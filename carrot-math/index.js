import { createRng } from "carrot-sdk";
import { generateOutcome } from "./outcome.js";

export function runGame(serverSeed, clientSeed, nonce) {
  const rng = createRng({ serverSeed, clientSeed, nonce });
  return generateOutcome(rng);
}
