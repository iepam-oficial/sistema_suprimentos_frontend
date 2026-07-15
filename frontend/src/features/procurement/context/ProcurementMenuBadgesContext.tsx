'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { usePathname } from 'next/navigation';
import { useUser } from '@/contexts/GlobalContext';
import { fetchPurchaseRequests } from '../api/purchaseRequestApi';
import { fetchProcurementQuotes } from '../api/procurementQuoteApi';
import { fetchPurchaseOrders } from '../api/purchaseOrderApi';
import {
  PROCUREMENT_POLL_INTERVAL_MS,
  startPollingRefresh,
} from '../utils/pollingRefresh';
import {
  clearAllBaselines,
  readBaseline,
  writeBaseline,
} from '../utils/menuBadgeBaseline';
import {
  countChangedItems,
  fingerprintPurchaseOrder,
  fingerprintPurchaseRequest,
  fingerprintQuote,
  type MenuBadgeSnapshotItem,
} from '../utils/menuBadgeDiff';
import {
  isPathActiveForRoute,
  routeKeysForRole,
  type MenuBadgeRouteKey,
} from '../utils/menuBadgeRoutes';

const LIST_LIMIT = 100;

type Counts = Partial<Record<MenuBadgeRouteKey, number>>;

type ProcurementMenuBadgesContextValue = {
  getCount: (routeKey: MenuBadgeRouteKey) => number;
  markRouteSeen: (routeKey: MenuBadgeRouteKey, snapshot?: MenuBadgeSnapshotItem[]) => void;
};

const ProcurementMenuBadgesContext =
  createContext<ProcurementMenuBadgesContextValue | null>(null);

async function fetchSnapshot(
  token: string,
  routeKey: MenuBadgeRouteKey,
  options?: { polling?: boolean },
): Promise<MenuBadgeSnapshotItem[]> {
  const fetchOpts = options?.polling === true ? { polling: true as const } : undefined;
  switch (routeKey) {
    case 'solicitacoes': {
      const result = await fetchPurchaseRequests(token, { limit: LIST_LIMIT }, fetchOpts);
      return result.items.map((item) => fingerprintPurchaseRequest(item));
    }
    case 'aprovacoes-sc': {
      const result = await fetchPurchaseRequests(
        token,
        {
          status: 'PENDING_APPROVAL',
          limit: LIST_LIMIT,
        },
        fetchOpts,
      );
      return result.items.map((item) => fingerprintPurchaseRequest(item));
    }
    case 'fila-compras': {
      const result = await fetchPurchaseRequests(
        token,
        {
          awaiting_quote: true,
          limit: LIST_LIMIT,
        },
        fetchOpts,
      );
      return result.items.map((item) => fingerprintPurchaseRequest(item));
    }
    case 'cotacoes': {
      const result = await fetchProcurementQuotes(token, { limit: LIST_LIMIT }, fetchOpts);
      return result.items.map((item) => fingerprintQuote(item));
    }
    case 'pedidos': {
      const result = await fetchPurchaseOrders(token, { limit: LIST_LIMIT }, fetchOpts);
      return result.items.map((item) => fingerprintPurchaseOrder(item));
    }
    default:
      return [];
  }
}

export function ProcurementMenuBadgesProvider({ children }: { children: ReactNode }) {
  const { user } = useUser();
  const pathname = usePathname() || '';
  const [counts, setCounts] = useState<Counts>({});
  const latestSnapshotsRef = useRef<Partial<Record<MenuBadgeRouteKey, MenuBadgeSnapshotItem[]>>>(
    {},
  );
  const userId = user?.id ?? '';
  const role = user?.role ?? null;
  const routeKeys = useMemo(() => routeKeysForRole(role), [role]);

  const getCount = useCallback(
    (routeKey: MenuBadgeRouteKey) => {
      if (isPathActiveForRoute(pathname, routeKey)) {
        return 0;
      }
      return counts[routeKey] ?? 0;
    },
    [counts, pathname],
  );

  const markRouteSeen = useCallback(
    (routeKey: MenuBadgeRouteKey, snapshot?: MenuBadgeSnapshotItem[]) => {
      if (!userId) return;

      const apply = (next: MenuBadgeSnapshotItem[]) => {
        writeBaseline(userId, routeKey, next);
        latestSnapshotsRef.current[routeKey] = next;
        setCounts((prev) => ({ ...prev, [routeKey]: 0 }));
      };

      if (snapshot) {
        apply(snapshot);
        return;
      }

      const cached = latestSnapshotsRef.current[routeKey];
      if (cached) {
        apply(cached);
        return;
      }

      const existing = readBaseline(userId, routeKey);
      if (existing) {
        apply(existing);
      }

      const token = localStorage.getItem('@ti-assistant:token');
      if (!token) return;

      void fetchSnapshot(token, routeKey)
        .then((current) => {
          apply(current);
        })
        .catch(() => {
          // keep previous baseline if fetch fails
        });
    },
    [userId],
  );

  useEffect(() => {
    if (!userId || routeKeys.length === 0) {
      setCounts({});
      return;
    }

    let cancelled = false;

    const tick = async () => {
      const token = localStorage.getItem('@ti-assistant:token');
      if (!token || cancelled) return;

      const nextCounts: Counts = {};

      await Promise.all(
        routeKeys.map(async (routeKey) => {
          try {
            const current = await fetchSnapshot(token, routeKey, { polling: true });
            if (cancelled) return;
            latestSnapshotsRef.current[routeKey] = current;

            if (isPathActiveForRoute(pathname, routeKey)) {
              nextCounts[routeKey] = 0;
              return;
            }

            let baseline = readBaseline(userId, routeKey);
            if (baseline == null) {
              writeBaseline(userId, routeKey, current);
              nextCounts[routeKey] = 0;
              return;
            }

            nextCounts[routeKey] = countChangedItems(baseline, current);
          } catch {
            // silent — keep previous count
          }
        }),
      );

      if (!cancelled) {
        setCounts((prev) => ({ ...prev, ...nextCounts }));
      }
    };

    void tick();
    const dispose = startPollingRefresh({
      enabled: true,
      intervalMs: PROCUREMENT_POLL_INTERVAL_MS,
      onTick: () => {
        void tick();
      },
    });

    return () => {
      cancelled = true;
      dispose();
    };
  }, [userId, routeKeys, pathname]);

  useEffect(() => {
    if (!userId) {
      setCounts({});
      latestSnapshotsRef.current = {};
    }
  }, [userId]);

  useEffect(() => {
    return () => {
      // no-op cleanup; baselines stay in sessionStorage for SPA navigation
    };
  }, []);

  // Clear baselines when user logs out (user id becomes empty after having been set)
  const prevUserIdRef = useRef<string>('');
  useEffect(() => {
    if (prevUserIdRef.current && !userId) {
      clearAllBaselines(prevUserIdRef.current);
      setCounts({});
      latestSnapshotsRef.current = {};
    }
    prevUserIdRef.current = userId;
  }, [userId]);

  const value = useMemo(
    () => ({
      getCount,
      markRouteSeen,
    }),
    [getCount, markRouteSeen],
  );

  return (
    <ProcurementMenuBadgesContext.Provider value={value}>
      {children}
    </ProcurementMenuBadgesContext.Provider>
  );
}

export function useProcurementMenuBadges(): ProcurementMenuBadgesContextValue {
  const ctx = useContext(ProcurementMenuBadgesContext);
  if (!ctx) {
    return {
      getCount: () => 0,
      markRouteSeen: () => undefined,
    };
  }
  return ctx;
}
