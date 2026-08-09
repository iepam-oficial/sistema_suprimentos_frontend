export const MENU_BADGE_ROUTE_KEYS = [
  'solicitacoes',
  'aprovacoes-sc',
  'fila-compras',
  'cotacoes',
  'pedidos',
] as const;

export type MenuBadgeRouteKey = (typeof MENU_BADGE_ROUTE_KEYS)[number];

/** Routes whose menu badge is absolute pending count (not diff vs baseline). */
export const ABSOLUTE_PENDING_ROUTE_KEYS = [
  'aprovacoes-sc',
  'fila-compras',
] as const satisfies readonly MenuBadgeRouteKey[];

export type AbsolutePendingRouteKey = (typeof ABSOLUTE_PENDING_ROUTE_KEYS)[number];

export function isAbsolutePendingRoute(routeKey: MenuBadgeRouteKey): boolean {
  return (ABSOLUTE_PENDING_ROUTE_KEYS as readonly string[]).includes(routeKey);
}

/** Diff routes clear badge on visit; absolute pending routes must not. */
export function shouldClearCountOnMarkSeen(routeKey: MenuBadgeRouteKey): boolean {
  return !isAbsolutePendingRoute(routeKey);
}

export type MenuBadgeRefreshAction = 'approve_sc' | 'reject_sc' | 'create_quote';

/** Which absolute route to refresh after a successful domain action (MPEND-08). */
export function badgeRouteAfterAction(action: MenuBadgeRefreshAction): AbsolutePendingRouteKey {
  if (action === 'create_quote') return 'fila-compras';
  return 'aprovacoes-sc';
}

/** Stable list filters used by badge poll — independent of page UI filters (MPEND-09). */
export function stableBadgeListFilters(
  routeKey: AbsolutePendingRouteKey,
): { status: 'PENDING_APPROVAL' } | { awaiting_quote: true } {
  if (routeKey === 'aprovacoes-sc') {
    return { status: 'PENDING_APPROVAL' };
  }
  return { awaiting_quote: true };
}

export const MENU_BADGE_PATH_BY_ROUTE: Record<MenuBadgeRouteKey, string> = {
  solicitacoes: '/procurement/solicitacoes',
  'aprovacoes-sc': '/procurement/aprovacoes-sc',
  'fila-compras': '/procurement/fila-compras',
  cotacoes: '/procurement/cotacoes',
  pedidos: '/procurement/pedidos',
};

export function routeKeysForRole(role: string | undefined | null): MenuBadgeRouteKey[] {
  if (!role) return [];
  const keys: MenuBadgeRouteKey[] = [];
  if (role === 'COORDINATOR' || role === 'ADMIN') {
    keys.push('solicitacoes');
  }
  if (role === 'DIRECTOR' || role === 'ADMIN') {
    keys.push('aprovacoes-sc');
  }
  if (role === 'MANAGER' || role === 'ADMIN') {
    keys.push('fila-compras', 'pedidos');
  }
  if (role === 'MANAGER' || role === 'DIRECTOR' || role === 'ADMIN') {
    keys.push('cotacoes');
  }
  return keys;
}

export function routeKeyFromPathname(pathname: string): MenuBadgeRouteKey | null {
  if (pathname.startsWith('/procurement/solicitacoes')) return 'solicitacoes';
  if (pathname.startsWith('/procurement/aprovacoes-sc')) return 'aprovacoes-sc';
  if (pathname.startsWith('/procurement/fila-compras')) return 'fila-compras';
  if (pathname.startsWith('/procurement/cotacoes')) return 'cotacoes';
  if (pathname.startsWith('/procurement/pedidos')) return 'pedidos';
  if (pathname.startsWith('/procurement/recebimentos')) return 'pedidos';
  return null;
}

export function isPathActiveForRoute(pathname: string, routeKey: MenuBadgeRouteKey): boolean {
  return routeKeyFromPathname(pathname) === routeKey;
}
