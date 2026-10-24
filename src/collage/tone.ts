// A tone is the mood of the whole collage: the words it searches with, the colour it is shown in, and a filter.
export type ToneId = 'calm' | 'bright' | 'warm' | 'cool' | 'moody' | 'vintage' | 'minimal';

export type Tone = { label: string; words: string; filter: string; background: string; ink: string };

export const TONES: Record<ToneId, Tone> = {
  calm: { label: 'Calm', words: 'soft pastel', filter: 'saturate(0.8) brightness(1.05)', background: '#EAF4F4', ink: '#1C1C1E' },
  bright: { label: 'Bright', words: 'bright colorful', filter: 'saturate(1.3) brightness(1.08)', background: '#FFF8E1', ink: '#1C1C1E' },
  warm: { label: 'Warm', words: 'warm golden', filter: 'sepia(0.25) saturate(1.2)', background: '#FFF3E0', ink: '#1C1C1E' },
  cool: { label: 'Cool', words: 'blue cool', filter: 'hue-rotate(10deg) saturate(0.9)', background: '#E8F1FB', ink: '#1C1C1E' },
  moody: { label: 'Moody', words: 'dark moody', filter: 'contrast(1.15) brightness(0.8)', background: '#1C1C1E', ink: '#FFFFFF' },
  vintage: { label: 'Vintage', words: 'vintage retro', filter: 'sepia(0.6) contrast(0.95)', background: '#F5EBDD', ink: '#1C1C1E' },
  minimal: { label: 'Minimal', words: 'minimal simple', filter: 'grayscale(1)', background: '#F2F2F7', ink: '#1C1C1E' },
};

export const TONE_IDS = Object.keys(TONES) as ToneId[];

// The tone that fits a mood score (1 to 5, the average of the last days). Undefined when there is no mood.
export const toneForMood = (average: number | undefined): ToneId | undefined => {
  if (average === undefined || Number.isNaN(average)) return undefined;
  if (average >= 4) return 'bright';
  if (average >= 3) return 'calm';
  return 'moody';
};
