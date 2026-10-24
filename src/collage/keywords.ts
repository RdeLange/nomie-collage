// The words a collage is built from: the trackers and the words that come up most in your notes.
export type NoteLike = { note: string; elements: Array<{ type: string; id: string }> };

// words that say nothing about a picture (English, Dutch and German, the languages the app has)
const STOP = new Set([
  'the', 'and', 'with', 'that', 'this', 'from', 'have', 'been', 'were', 'very', 'just', 'today', 'about', 'there',
  'their', 'would', 'could', 'should', 'what', 'when', 'your', 'into', 'over', 'more', 'some', 'than', 'then', 'also',
  'really', 'feel', 'felt', 'good', 'great', 'note', 'notes', 'that', 'them', 'they', 'will', 'because', 'after',
  'before', 'again', 'make', 'made', 'going', 'went', 'still', 'much', 'only', 'even', 'here', 'where', 'while',
  'want', 'need', 'like', 'long', 'short', 'little', 'lots', 'know', 'think', 'time', 'day', 'days', 'morning', 'evening', 'night',
  'het', 'een', 'and', 'dat', 'die', 'der', 'und', 'mit', 'ich', 'ist', 'nicht', 'auch', 'heute', 'voor', 'maar',
]);

// Tags count more than words, because you chose them on purpose.
const TAG_WEIGHT = 3;

export const extractKeywords = (notes: NoteLike[], limit = 6): string[] => {
  const counts = new Map<string, number>();
  const add = (word: string, weight: number) => counts.set(word, (counts.get(word) ?? 0) + weight);

  for (const note of notes) {
    for (const element of note.elements) {
      if (element.type === 'tracker' && element.id) add(element.id.toLowerCase(), TAG_WEIGHT);
    }
    // the words of the note, without the #tags and the numbers
    const text = note.note.replace(/[#@]\S+/g, ' ').toLowerCase();
    for (const word of text.split(/[^\p{L}]+/u)) {
      if (word.length < 4 || STOP.has(word)) continue;
      add(word, 1);
    }
  }

  return [...counts.entries()]
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    .slice(0, limit)
    .map(([word]) => word);
};

// What the user chose: the words from the notes, minus the ones removed, plus the ones added
export const mergeKeywords = (found: string[], removed: string[], added: string[], limit = 8): string[] => {
  const out: string[] = [];
  for (const word of [...added.map((w) => w.trim().toLowerCase()), ...found]) {
    if (!word || removed.includes(word) || out.includes(word)) continue;
    out.push(word);
  }
  return out.slice(0, limit);
};
