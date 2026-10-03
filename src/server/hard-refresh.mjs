// Chrome sends max-age=0 for an ordinary reload and no-cache for a hard reload.
// Inspect the document request, not resource timings or response cache headers.
export function isHardRefreshRequest(headers) {
  const directives = (headers.get('cache-control') || '').split(',');
  if (directives.some(value => value.trim().toLowerCase() === 'no-cache')) return true;
  return (headers.get('pragma') || '').split(',').some(value => value.trim().toLowerCase() === 'no-cache');
}
