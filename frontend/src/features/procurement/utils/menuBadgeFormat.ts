/** Returns empty string when count is 0; '1'..'9' or '9+' otherwise. */
export function formatBadgeCount(count: number): string {
  if (!Number.isFinite(count) || count <= 0) {
    return '';
  }
  if (count > 9) {
    return '9+';
  }
  return String(Math.floor(count));
}
