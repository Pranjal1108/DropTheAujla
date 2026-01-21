import { createRng } from "carrot-sdk";

export function makeRng(serverSeed, clientSeed, nonce) {
  return createRng({
    serverSeed,
    clientSeed,
    nonce
  });
}
