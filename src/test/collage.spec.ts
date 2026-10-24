import { describe, expect, it } from 'vitest';
import { extractKeywords, mergeKeywords } from '../collage/keywords';
import { TONES, toneForMood } from '../collage/tone';
import { CATEGORIES, fetchPictures, normaliseCommons, normaliseOpenverse, openverseUrl, searchText } from '../collage/sources';
import { seededRandom, shuffle, splitCount, uniqueBySource } from '../collage/layout';

describe('keywords from the notes', () => {
  it('counts tags more than words, and skips stop words and short words', () => {
    const notes = [
      { note: 'A long walk in the park #walk', elements: [{ type: 'tracker', id: 'walk' }] },
      { note: 'Walk with the dog and the sun', elements: [] },
      { note: 'Grateful for the sunshine', elements: [] },
    ];
    const words = extractKeywords(notes, 8);
    expect(words[0]).toBe('walk');
    expect(words).toContain('sunshine');
    expect(words).not.toContain('the');
    expect(words).not.toContain('with');
  });

  it('keeps the words a user removed out, and adds the ones they typed', () => {
    expect(mergeKeywords(['walk', 'sun', 'dog'], ['sun'], ['Forest'])).toEqual(['forest', 'walk', 'dog']);
  });

  it('never shows the same word twice', () => {
    expect(mergeKeywords(['walk', 'walk'], [], ['walk'])).toEqual(['walk']);
  });
});

describe('tones', () => {
  it('chooses a tone from the mood average', () => {
    expect(toneForMood(4.6)).toBe('bright');
    expect(toneForMood(3.2)).toBe('calm');
    expect(toneForMood(1.8)).toBe('moody');
    expect(toneForMood(undefined)).toBeUndefined();
  });

  it('gives every tone search words and a colour', () => {
    for (const tone of Object.values(TONES)) {
      expect(tone.words.length).toBeGreaterThan(3);
      expect(tone.background).toMatch(/^#[0-9A-F]{6}$/i);
    }
  });
});

describe('the picture sources', () => {
  it('normalises an Openverse result and keeps the creator and the licence', () => {
    const picture = normaliseOpenverse({
      id: 'abc', url: 'https://x/y.jpg', thumbnail: 'https://x/t.jpg', title: 'Flower', creator: 'Ann',
      license: 'by-sa', license_url: 'https://creativecommons.org/licenses/by-sa/4.0/', foreign_landing_url: 'https://x/page', width: 4000, height: 3000,
    });
    expect(picture).toMatchObject({ creator: 'Ann', license: 'CC BY-SA', origin: 'openverse', thumb: 'https://x/t.jpg' });
  });

  it('shows CC0 and public domain as they are named', () => {
    expect(normaliseOpenverse({ id: '1', url: 'u', license: 'cc0' })?.license).toBe('CC0');
    expect(normaliseOpenverse({ id: '2', url: 'u', license: 'pdm' })?.license).toBe('Public domain');
  });

  it('normalises a Wikimedia Commons page, and strips the HTML from the artist', () => {
    const picture = normaliseCommons({
      pageid: 7, title: 'File:Flower Pod Drawing.jpg',
      imageinfo: [{ url: 'https://u.jpg', thumburl: 'https://t.jpg', mime: 'image/jpeg', extmetadata: { Artist: { value: '<a href="x">Emily Steele</a>' }, LicenseShortName: { value: 'Public domain' } } }],
    });
    expect(picture).toMatchObject({ title: 'Flower Pod Drawing', creator: 'Emily Steele', license: 'Public domain', origin: 'commons' });
  });

  it('drops files that are not images', () => {
    expect(normaliseCommons({ pageid: 8, title: 'File:Sound.ogg', imageinfo: [{ url: 'u', mime: 'audio/ogg' }] })).toBeUndefined();
  });

  it('builds the search text from the word, the tone and the category', () => {
    expect(searchText('walk', 'soft pastel', 'line')).toBe('walk soft pastel line drawing');
    expect(searchText('walk', 'soft pastel', 'photos')).toBe('walk soft pastel');
  });

  it('asks Openverse only for pictures that can be reused', () => {
    const url = openverseUrl('walk', 'photos', 12);
    expect(url).toContain('license_type=commercial%2Cmodification');
    expect(url).toContain(`category=${CATEGORIES.photos.openverse}`);
  });

  it('gets pictures from both sources, and keeps working when one of them fails', async () => {
    const fake = async (url: string) => {
      if (url.includes('openverse')) {
        return { ok: true, json: async () => ({ results: [{ id: '1', url: 'https://a.jpg', license: 'cc0' }] }) };
      }
      throw new Error('offline');
    };
    const pictures = await fetchPictures('walk', 'calm', 'photos', 'mixed', 4, fake);
    expect(pictures.map((p) => p.origin)).toEqual(['openverse']);
  });
});

describe('layout', () => {
  it('gives the same shuffle for the same seed', () => {
    const items = [1, 2, 3, 4, 5, 6];
    expect(shuffle(items, seededRandom(42))).toEqual(shuffle(items, seededRandom(42)));
    expect(shuffle(items, seededRandom(42))).not.toEqual(shuffle(items, seededRandom(43)));
  });

  it('splits a count across keywords without losing any', () => {
    expect(splitCount(12, 5)).toEqual([3, 3, 2, 2, 2]);
    expect(splitCount(12, 5).reduce((a, b) => a + b, 0)).toBe(12);
  });

  it('removes the same picture when two words find it', () => {
    expect(uniqueBySource([{ src: 'a' }, { src: 'b' }, { src: 'a' }])).toEqual([{ src: 'a' }, { src: 'b' }]);
  });
});
