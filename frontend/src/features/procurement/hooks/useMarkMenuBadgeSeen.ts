'use client';

import { useEffect } from 'react';
import { useProcurementMenuBadges } from '../context/ProcurementMenuBadgesContext';
import type { MenuBadgeRouteKey } from '../utils/menuBadgeRoutes';

/** Clears the menu badge and refreshes baseline when the route page is visited. */
export function useMarkMenuBadgeSeen(routeKey: MenuBadgeRouteKey, enabled = true): void {
  const { markRouteSeen } = useProcurementMenuBadges();

  useEffect(() => {
    if (!enabled) return;
    markRouteSeen(routeKey);
  }, [enabled, markRouteSeen, routeKey]);
}
