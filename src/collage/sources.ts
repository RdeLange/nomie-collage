// The free picture sources. Openverse and Wikimedia Commons both allow browser requests without a key, and both
// return the licence and the creator, which the collage shows with every picture.
export type CategoryId = 'photos' | 'line' | 'illustrations' | 'prints';
export type SourceChoice = 'mixed' | 'openverse' | 'commons';

export type Picture = {
  id: string;
  src: string;
  thumb: string;
  title: string;
  creator: string;
  license: string;
  licenseUrl: string;
  page: string;
  origin: 'openverse' | 'commons';
  width: number;
  height: number;
};

export const CATEGORIES: Record<CategoryId, { label: string; openverse: string; commons: string; extra: string }> = {
  photos: { label: 'Real photos', openverse: 'photograph', commons: 'photograph', extra: '' },
  line: { label: 'Line drawings', openverse: 'illustration', commons: 'line drawing', extra: 'line drawing' },
  illustrations: { label: 'Illustrations', openverse: 'illustration', commons: 'illustration', extra: '' },
  prints: { label: 'Vintage prints', openverse: 'digitized_artwork', commons: 'vintage print', extra: '' },
};

const OPENVERSE = 'https://api.openverse.org/v1/images/';
const COMMONS = 'https://commons.wikimedia.org/w/api.php';

type Fetch = (url: string) => Promise<{ ok: boolean; json: () => Promise<any> }>;

// A source that is slow gives up after this long, so the other source still makes the collage
export const SOURCE_TIMEOUT_MS = 10000;
const withTimeout = <T,>(promise: Promise<T>, ms = SOURCE_TIMEOUT_MS): Promise<T> =>
  new Promise<T>((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error('timeout')), ms);
    promise.then(
      (value) => (clearTimeout(timer), resolve(value)),
      (error) => (clearTimeout(timer), reject(error))
    );
  });

const stripHtml = (text: string) => text.replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim();

// Openverse codes: by, by-sa, by-nc, by-nd, by-nc-sa, by-nc-nd, cc0 and pdm
const licenseText = (code: string | undefined) => {
  if (!code) return 'See the source';
  if (code === 'pdm') return 'Public domain';
  if (code === 'cc0') return 'CC0';
  return `CC ${code.toUpperCase()}`;
};

export const normaliseOpenverse = (result: any): Picture | undefined => {
  if (!result?.url) return undefined;
  return {
    id: `ov-${result.id}`,
    src: result.url,
    thumb: result.thumbnail || result.url,
    title: result.title || 'Untitled',
    creator: result.creator || 'Unknown creator',
    license: licenseText(result.license),
    licenseUrl: result.license_url || '',
    page: result.foreign_landing_url || result.url,
    origin: 'openverse',
    width: result.width || 1,
    height: result.height || 1,
  };
};

export const normaliseCommons = (page: any): Picture | undefined => {
  const info = page?.imageinfo?.[0];
  if (!info?.url || !/^image\//.test(info.mime ?? 'image/')) return undefined;
  const meta = info.extmetadata ?? {};
  return {
    id: `cm-${page.pageid}`,
    src: info.url,
    thumb: info.thumburl || info.url,
    title: String(page.title).replace(/^File:/, '').replace(/\.[a-z]+$/i, ''),
    creator: stripHtml(meta.Artist?.value ?? '') || 'Unknown creator',
    license: meta.LicenseShortName?.value ?? 'See the source',
    licenseUrl: meta.LicenseUrl?.value ?? '',
    page: `https://commons.wikimedia.org/wiki/${encodeURIComponent(String(page.title).replace(/ /g, '_'))}`,
    origin: 'commons',
    width: info.thumbwidth || info.width || 1,
    height: info.thumbheight || info.height || 1,
  };
};

// The search text: a word from the notes, the tone and the category
export const searchText = (keyword: string, toneWords: string, category: CategoryId) => {
  const extra = CATEGORIES[category].extra;
  return [keyword, toneWords, extra].filter(Boolean).join(' ');
};

export const openverseUrl = (text: string, category: CategoryId, count: number) => {
  const params = new URLSearchParams({
    q: text,
    category: CATEGORIES[category].openverse,
    license_type: 'commercial,modification',
    page_size: String(count),
    mature: 'false',
  });
  return `${OPENVERSE}?${params}`;
};

export const commonsUrl = (text: string, count: number) => {
  const params = new URLSearchParams({
    action: 'query',
    generator: 'search',
    gsrsearch: text,
    gsrnamespace: '6',
    gsrlimit: String(count),
    prop: 'imageinfo',
    iiprop: 'url|extmetadata|size|mime',
    iiurlwidth: '600',
    format: 'json',
    origin: '*',
  });
  return `${COMMONS}?${params}`;
};

// Pictures for one keyword, from the chosen sources. A failing source gives nothing, the other still works.
export const fetchPictures = async (
  keyword: string,
  toneWords: string,
  category: CategoryId,
  choice: SourceChoice,
  count: number,
  fetchFn: Fetch = fetch as unknown as Fetch
): Promise<Picture[]> => {
  const text = searchText(keyword, toneWords, category);
  const wanted: Array<Promise<Picture[]>> = [];
  if (choice !== 'commons') {
    wanted.push(
      withTimeout(fetchFn(openverseUrl(text, category, count)))
        .then((r) => (r.ok ? r.json() : { results: [] }))
        .then((data) => (data.results ?? []).map(normaliseOpenverse).filter(Boolean) as Picture[])
        .catch(() => [])
    );
  }
  if (choice !== 'openverse') {
    wanted.push(
      withTimeout(fetchFn(commonsUrl(text, count)))
        .then((r) => (r.ok ? r.json() : { query: { pages: {} } }))
        .then((data) => Object.values<any>(data.query?.pages ?? {}).map(normaliseCommons).filter(Boolean) as Picture[])
        .catch(() => [])
    );
  }
  const lists = await Promise.all(wanted);
  return lists.flat();
};
