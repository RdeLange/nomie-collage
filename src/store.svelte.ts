// The state of the collage: what you chose, the words, the pictures and the tone. Saved, so the widget can show it.
import type { CategoryId, Picture, SourceChoice } from './collage/sources';
import type { ToneId } from './collage/tone';

export type Choice = ToneId | 'auto';

export type Settings = {
  category: CategoryId;
  source: SourceChoice;
  tone: Choice;
  count: number;
  // words the user removed from the found ones, and words the user added
  removed: string[];
  added: string[];
};

export const DEFAULT_SETTINGS: Settings = {
  category: 'photos',
  source: 'mixed',
  tone: 'auto',
  count: 12,
  removed: [],
  added: [],
};

class CollageState {
  settings = $state<Settings>({ ...DEFAULT_SETTINGS });
  // the words found in the notes of the last week (before the user changed them)
  found = $state<string[]>([]);
  // the tone the current collage was made in (resolved, so 'auto' becomes a real tone)
  tone = $state<ToneId>('calm');
  pictures = $state<Picture[]>([]);
  seed = $state(1);
  builtAt = $state('');
  status = $state<'idle' | 'loading' | 'ready' | 'error'>('idle');
  message = $state('');
  mode = $state<'modal' | 'widget'>('modal');
  theme = $state<'light' | 'dark'>('light');
  ready = $state(false);
}

export const collage = new CollageState();
