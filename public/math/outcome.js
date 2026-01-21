export function generateOutcome(rng) {
  const r = rng();

  if (r < 0.349230769) return 0;
  if (r < 0.609230769) return 0.2 + rng() * (0.6 - 0.2);
  if (r < 0.829230769) return 0.9 + rng() * (1.4 - 0.9);
  if (r < 0.959230769) return 2.0 + rng() * (3.2 - 2.0);
  return 5 + rng() * (8 - 5);
}
