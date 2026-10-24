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

// The words a note is made of. The full text of every note counts, and a #tag is a word like the others,
// so the words you write and the trackers you use both show up. Trackers that are not in the text count once too.
export const extractKeywords = (notes: NoteLike[], limit = 6): string[] => {
  const counts = new Map<string, number>();
  const add = (word: string) => counts.set(word, (counts.get(word) ?? 0) + 1);

  for (const note of notes) {
    // the # and @ signs go, the words stay: "#walk" counts as "walk"
    const text = note.note.replace(/[#@]/g, ' ').toLowerCase();
    const words = text.split(/[^\p{L}]+/u).filter((word) => word.length >= 4 && !STOP.has(word));
    words.forEach(add);
    for (const element of note.elements) {
      const tag = (element.id || '').toLowerCase();
      if (element.type === 'tracker' && tag.length >= 4 && !words.includes(tag) && !STOP.has(tag)) add(tag);
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
