// The colours the app gives the plugin. When the app is older, the plugin uses its own light and dark values.
export type Palette = { page: string; card: string; text: string; textSecondary: string; separator: string; tint: string; onTint: string; tintSoft: string; good: string; goodSoft: string };

const LIGHT: Palette = { page: '#F2F2F7', card: '#FFFFFF', text: '#000000', textSecondary: '#636368', separator: '#D8D8DC', tint: '#0A6CC9', onTint: '#FFFFFF', tintSoft: '#EBF4FD', good: '#1E7A34', goodSoft: '#DDF3E2' };
const DARK: Palette = { page: '#000000', card: '#1C1C1E', text: '#FFFFFF', textSecondary: '#AEAEB2', separator: '#48484A', tint: '#4DB3FF', onTint: '#000000', tintSoft: '#0B2236', good: '#30D158', goodSoft: '#123620' };

export const paletteFrom = (prefs: any): Palette => {
  const colours = prefs?.colours;
  if (colours?.current) return colours.current as Palette;
  return prefs?.theme === 'dark' ? DARK : LIGHT;
};
