// Follows the app while the plugin is open. The app sends prefsChanged when the text size or the colour scheme changes.
// Only the parent (the Nomie app) is trusted.
export const onPrefsChange = (plugin: any, handler: () => void) => {
  window.addEventListener('message', (event) => {
    if (event.source !== window.parent) return;
    if (event.data?.action !== 'prefsChanged') return;
    plugin.prefs = { ...plugin.prefs, ...event.data.data.user };
    handler();
  });
};
