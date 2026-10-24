// A seeded random generator, so the same seed gives the same collage (and a shuffle gives a new one).
export const seededRandom = (seed: number) => {
  let state = seed >>> 0;
  return () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
};

export const shuffle = <T,>(items: T[], random: () => number): T[] => {
  const out = [...items];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
};

// Removes pictures that appear more than once (same picture, found by two words)
export const uniqueBySource = <T extends { src: string }>(items: T[]): T[] => {
  const seen = new Set<string>();
  return items.filter((item) => (seen.has(item.src) ? false : (seen.add(item.src), true)));
};

// The pictures for a collage: each keyword gets a share, so one strong word does not fill the whole collage
export const splitCount = (total: number, parts: number): number[] => {
  if (parts <= 0) return [];
  const base = Math.floor(total / parts);
  const rest = total % parts;
  return Array.from({ length: parts }, (_, i) => base + (i < rest ? 1 : 0));
};

// The aspect ratio for each tile, so the collage looks like a collage and not a grid
export const tileRatio = (random: () => number): number => [0.7, 1, 1.35, 0.85, 1.2][Math.floor(random() * 5)];
