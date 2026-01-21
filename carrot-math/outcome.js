import carrot from "carrot-sdk";
const { rand } = carrot;

export function generateOutcome(rng) {
  const r = rng();

  if (r < 0.349230769) return 0;
  if (r < 0.609230769) return rand(0.2, 0.6, rng);
  if (r < 0.829230769) return rand(0.9, 1.4, rng);
  if (r < 0.959230769) return rand(2.0, 3.2, rng);
  return rand(5, 8, rng);
}
