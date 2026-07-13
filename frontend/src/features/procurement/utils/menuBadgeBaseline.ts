import type { MenuBadgeSnapshotItem } from './menuBadgeDiff';
import type { MenuBadgeRouteKey } from './menuBadgeRoutes';

const STORAGE_PREFIX = 'procurement-menu-badge-baseline';

function storageKey(userId: string, routeKey: MenuBadgeRouteKey): string {
  return `${STORAGE_PREFIX}:${userId}:${routeKey}`;
}

export function readBaseline(
  userId: string,
  routeKey: MenuBadgeRouteKey,
): MenuBadgeSnapshotItem[] | null {
  if (typeof window === 'undefined' || !userId) {
    return null;
  }
  try {
    const raw = sessionStorage.getItem(storageKey(userId, routeKey));
    if (!raw) return null;
    const parsed = JSON.parse(raw) as MenuBadgeSnapshotItem[];
    if (!Array.isArray(parsed)) return null;
    return parsed.filter(
      (item) =>
        item &&
        typeof item.id === 'string' &&
        typeof item.fingerprint === 'string',
    );
  } catch {
    return null;
  }
}

export function writeBaseline(
  userId: string,
  routeKey: MenuBadgeRouteKey,
  items: MenuBadgeSnapshotItem[],
): void {
  if (typeof window === 'undefined' || !userId) {
    return;
  }
  try {
    sessionStorage.setItem(storageKey(userId, routeKey), JSON.stringify(items));
  } catch {
    // ignore quota / private mode
  }
}

export function clearAllBaselines(userId: string): void {
  if (typeof window === 'undefined' || !userId) {
    return;
  }
  try {
    const prefix = `${STORAGE_PREFIX}:${userId}:`;
    const keys: string[] = [];
    for (let i = 0; i < sessionStorage.length; i += 1) {
      const key = sessionStorage.key(i);
      if (key?.startsWith(prefix)) {
        keys.push(key);
      }
    }
    keys.forEach((key) => sessionStorage.removeItem(key));
  } catch {
    // ignore
  }
}
