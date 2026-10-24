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

// Share of the collage that shows faces with the chosen mood
export const FACE_SHARE = 0.2;

export const faceCountFor = (total: number): number => Math.round(total * FACE_SHARE);

// The collage: the face pictures first (up to the face count), the rest from the words, then shuffled together.
// When there are too few face pictures, the words fill the gap, so the collage always has the chosen number.
export const mixPictures = <T extends { src: string }>(faces: T[], others: T[], total: number, random: () => number): T[] => {
  const wantedFaces = faceCountFor(total);
  const takenFaces = faces.slice(0, wantedFaces);
  const takenOthers = others.slice(0, total - takenFaces.length);
  return shuffle([...takenFaces, ...takenOthers], random);
};
