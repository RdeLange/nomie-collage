// The connection to Nomie: the notes and the mood for the words and the tone, the timeline for saving, and storage.
import { collage, DEFAULT_SETTINGS, type Settings } from './store.svelte';
import { extractKeywords, mergeKeywords, type NoteLike } from './collage/keywords';
import { CATEGORIES, fetchPictures, type Picture } from './collage/sources';
import { TONES, TONE_IDS, toneForMood, type ToneId } from './collage/tone';
import { seededRandom, shuffle, splitCount, uniqueBySource } from './collage/layout';

declare const NomiePlugin: any;

const STORAGE_KEY = 'collage';
const MAX_WORDS = 6;
const WEEK = 7;

export type Saved = { settings: Settings; found: string[]; tone: ToneId; pictures: Picture[]; seed: number; builtAt: string };

let plugin: any;

// the words a picture search needs: the chosen words, in the order the user sees them
const wordsNow = () => mergeKeywords(collage.found, collage.settings.removed, collage.settings.added, MAX_WORDS);

// The mood of the last week, as a tone. Without a mood, the tone is calm.
const resolveTone = async (choice: Settings['tone']): Promise<ToneId> => {
  if (choice !== 'auto') return choice;
  const reply = await plugin.getTrackableUsage({ tag: '#mood', daysBack: WEEK });
  const values: number[] = (reply && reply.usage && reply.usage.values) || [];
  const average = values.length ? values.reduce((a, b) => a + b, 0) / values.length : undefined;
  return toneForMood(average) ?? 'calm';
};

const findWords = async () => {
  const notes: NoteLike[] = await plugin.searchNotes('', new Date(), WEEK);
  collage.found = extractKeywords(notes, 12);
};

// a plain copy, so that what is saved does not change with the screen
const copy = <T,>(value: T): T => JSON.parse(JSON.stringify(value));

const save = () => {
  const saved: Saved = {
    settings: copy(collage.settings),
    found: copy(collage.found),
    tone: collage.tone,
    pictures: copy(collage.pictures),
    seed: collage.seed,
    builtAt: collage.builtAt,
  };
  void plugin?.storage.setItem(STORAGE_KEY, saved);
};

export const loadSaved = (raw: unknown) => {
  const saved = (raw ?? undefined) as Partial<Saved> | undefined;
  if (!saved) return;
  collage.settings = { ...DEFAULT_SETTINGS, ...(saved.settings ?? {}) };
  collage.found = saved.found ?? [];
  collage.tone = saved.tone ?? 'calm';
  collage.pictures = saved.pictures ?? [];
  collage.seed = saved.seed ?? 1;
  collage.builtAt = saved.builtAt ?? '';
  collage.status = collage.pictures.length ? 'ready' : 'idle';
};

// Makes a new collage. The seed decides the order, so Shuffle keeps the same words and gives other pictures.
export const build = async (reshuffle = false) => {
  if (collage.status === 'loading') return;
  collage.status = 'loading';
  collage.message = '';
  try {
    if (!reshuffle || !collage.found.length) await findWords();
    const words = wordsNow();
    if (!words.length) {
      collage.status = 'idle';
      collage.message = 'Write a few notes, or add a word of your own, to start a collage.';
      return;
    }
    collage.tone = await resolveTone(collage.settings.tone);
    if (!reshuffle) collage.seed = Math.floor(Math.random() * 1_000_000) + 1;
    const counts = splitCount(collage.settings.count, words.length);
    const toneWords = TONES[collage.tone].words;
    const lists = await Promise.all(
      words.map((word, i) => fetchPictures(word, toneWords, collage.settings.category, collage.settings.source, Math.max(counts[i] * 2, 4)))
    );
    const random = seededRandom(collage.seed);
    const pool = uniqueBySource(shuffle(lists.flat(), random));
    collage.pictures = pool.slice(0, collage.settings.count);
    collage.builtAt = new Date().toISOString();
    collage.status = collage.pictures.length ? 'ready' : 'error';
    collage.message = collage.pictures.length ? '' : 'No pictures were found for these words. Try other words, or another picture type.';
    save();
  } catch {
    collage.status = 'error';
    collage.message = 'The pictures could not be loaded. Check your connection, and try again in a minute.';
  }
};

// Writes the collage into the timeline: the words, the tone, and who made each picture (the licence needs it)
export const saveToTimeline = () => {
  if (!collage.pictures.length) return;
  const words = wordsNow().join(', ');
  const lines = collage.pictures.slice(0, 12).map((p) => `- ${p.title} by ${p.creator} (${p.license}) ${p.page}`);
  const note = `Collage: ${words} · ${TONES[collage.tone].label} tone\nPictures from Openverse and Wikimedia Commons:\n${lines.join('\n')}`;
  plugin.createNote({ note, end: new Date() });
  collage.message = 'Saved to your timeline.';
};

export const setSettings = (patch: Partial<Settings>) => {
  collage.settings = { ...collage.settings, ...patch };
  save();
};

export const toneOptions = TONE_IDS;
export const categoryOptions = Object.keys(CATEGORIES) as Array<keyof typeof CATEGORIES>;

export const openCredit = (picture: Picture) => {
  if (plugin) plugin.openURL(picture.page, picture.title);
};

const applyTheme = () => {
  const theme = plugin?.prefs?.theme;
  collage.theme = theme === 'dark' ? 'dark' : 'light';
};

export const startCollage = () => {
  plugin = new NomiePlugin({
    name: 'Nomie Collage',
    emoji: '🖼️',
    description: 'Makes a picture collage from the words in your notes, with free-to-use photos and drawings.',
    uses: ['searchNotes', 'getTrackableUsage', 'createNote', 'openURL', 'getStorageItem', 'setStorageItem'],
    version: '1.0',
    addToCaptureMenu: true,
    addToMoreMenu: true,
    addToWidgets: true,
  });
  plugin.onRegistered(async () => {
    applyTheme();
    await plugin.storage.init();
    loadSaved(plugin.storage.getItem(STORAGE_KEY));
    collage.ready = true;
  });
  plugin.onUIOpened(() => {
    applyTheme();
    collage.mode = 'modal';
  });
  plugin.onWidget(() => {
    applyTheme();
    collage.mode = 'widget';
  });
  return plugin;
};
