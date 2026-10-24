// A tone is the mood of the whole collage: the words it searches with, the colour it is shown in, and a filter.
export type ToneId = 'calm' | 'bright' | 'warm' | 'cool' | 'moody' | 'vintage' | 'minimal';

// The face search is what the faces in the collage look like for this mood: a face that expresses it.
export type Tone = { label: string; words: string; face: string; filter: string };

// The page and the widget use the app colours. A tone only changes the search words, the face and a tint on the pictures.
export const TONES: Record<ToneId, Tone> = {
  calm: { label: 'Calm', words: 'soft pastel', filter: 'saturate(0.8) brightness(1.05)', face: 'calm peaceful face portrait' },
  bright: { label: 'Bright', words: 'bright colorful', filter: 'saturate(1.3) brightness(1.08)', face: 'happy smiling face portrait' },
  warm: { label: 'Warm', words: 'warm golden', filter: 'sepia(0.25) saturate(1.2)', face: 'warm smiling face portrait' },
  cool: { label: 'Cool', words: 'blue cool', filter: 'hue-rotate(10deg) saturate(0.9)', face: 'confident cool face portrait' },
  moody: { label: 'Moody', words: 'dark moody', filter: 'contrast(1.15) brightness(0.8)', face: 'sad thoughtful face portrait' },
  vintage: { label: 'Vintage', words: 'vintage retro', filter: 'sepia(0.6) contrast(0.95)', face: 'vintage portrait face' },
  minimal: { label: 'Minimal', words: 'minimal simple', filter: 'grayscale(1)', face: 'minimal face portrait' },
};

export const TONE_IDS = Object.keys(TONES) as ToneId[];

// The tone that fits a mood score (1 to 5, the average of the last days). Undefined when there is no mood.
export const toneForMood = (average: number | undefined): ToneId | undefined => {
  if (average === undefined || Number.isNaN(average)) return undefined;
  if (average >= 4) return 'bright';
  if (average >= 3) return 'calm';
  return 'moody';
};
