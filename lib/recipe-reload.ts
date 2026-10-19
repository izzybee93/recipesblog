export function isRecipeDetailPath(pathname: string): boolean {
  return /^\/recipes\/[^/]+\/?$/.test(pathname)
}

// Remove an old section fragment only on refresh, before the browser can
// re-anchor to it. Native history owns the actual scroll position; a stale
// application-saved offset must not compete with it.
export const recipeReloadScript = `
(function () {
  const isRecipeDetailPath = ${isRecipeDetailPath.toString()};
  const navigation = window.performance.getEntriesByType('navigation')[0];
  if (!isRecipeDetailPath(window.location.pathname) || !navigation || navigation.type !== 'reload') return;
  try {
    if (window.location.hash) {
      window.history.replaceState(window.history.state, '', window.location.pathname + window.location.search);
    }
  } catch (_) {}
})();
`
