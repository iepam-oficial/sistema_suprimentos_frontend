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
  fingerprintPurchaseOrder,
  fingerprintPurchaseRequest,
  fingerprintQuote,
  type MenuBadgeSnapshotItem,
} from '../utils/menuBadgeDiff';
import { displayCount, resolvePollCount } from '../utils/menuBadgeCount';
import {
  isAbsolutePendingRoute,
  isPathActiveForRoute,
  routeKeysForRole,
  shouldClearCountOnMarkSeen,
  stableBadgeListFilters,
  type MenuBadgeRouteKey,
} from '../utils/menuBadgeRoutes';

const LIST_LIMIT = 100;

type Counts = Partial<Record<MenuBadgeRouteKey, number>>;

type GetCountOptions = { aggregate?: boolean };

type SnapshotResult = {
  items: MenuBadgeSnapshotItem[];
  total: number;
};

type ProcurementMenuBadgesContextValue = {
  getCount: (routeKey: MenuBadgeRouteKey, options?: GetCountOptions) => number;
  markRouteSeen: (routeKey: MenuBadgeRouteKey, snapshot?: MenuBadgeSnapshotItem[]) => void;
  refreshRouteCount: (routeKey: MenuBadgeRouteKey) => Promise<void>;
};

const ProcurementMenuBadgesContext =
  createContext<ProcurementMenuBadgesContextValue | null>(null);

async function fetchSnapshot(
  token: string,
  routeKey: MenuBadgeRouteKey,
  options?: { polling?: boolean },
): Promise<SnapshotResult> {
  const fetchOpts = options?.polling === true ? { polling: true as const } : undefined;
  switch (routeKey) {
    case 'solicitacoes': {
      const result = await fetchPurchaseRequests(token, { limit: LIST_LIMIT }, fetchOpts);
      return {
        items: result.items.map((item) => fingerprintPurchaseRequest(item)),
        total: result.total,
      };
    }
    case 'aprovacoes-sc': {
      const result = await fetchPurchaseRequests(
        token,
        {
          ...stableBadgeListFilters('aprovacoes-sc'),
          limit: LIST_LIMIT,
        },
        fetchOpts,
      );
      return {
        items: result.items.map((item) => fingerprintPurchaseRequest(item)),
        total: result.total,
      };
    }
    case 'fila-compras': {
      const result = await fetchPurchaseRequests(
        token,
        {
          ...stableBadgeListFilters('fila-compras'),
          limit: LIST_LIMIT,
        },
        fetchOpts,
      );
      return {
        items: result.items.map((item) => fingerprintPurchaseRequest(item)),
        total: result.total,
      };
    }
    case 'cotacoes': {
      const result = await fetchProcurementQuotes(token, { limit: LIST_LIMIT }, fetchOpts);
      return {
        items: result.items.map((item) => fingerprintQuote(item)),
        total: result.total,
      };
    }
    case 'pedidos': {
      const result = await fetchPurchaseOrders(token, { limit: LIST_LIMIT }, fetchOpts);
      return {
        items: result.items.map((item) => fingerprintPurchaseOrder(item)),
        total: result.total,
      };
    }
    default:
      return { items: [], total: 0 };
  }
}

function applyPollResult(
  userId: string,
  routeKey: MenuBadgeRouteKey,
  snapshot: SnapshotResult,
): number {
  const baseline = readBaseline(userId, routeKey);

  if (!isAbsolutePendingRoute(routeKey) && baseline == null) {
    writeBaseline(userId, routeKey, snapshot.items);
  }

  return resolvePollCount({
    routeKey,
    total: snapshot.total,
    itemsLength: snapshot.items.length,
    baseline,
    currentItems: snapshot.items,
  });
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
    (routeKey: MenuBadgeRouteKey, options?: GetCountOptions) => {
      const raw = counts[routeKey] ?? 0;
      return displayCount({
        raw,
        routeActive: isPathActiveForRoute(pathname, routeKey),
        aggregate: options?.aggregate === true,
      });
    },
    [counts, pathname],
  );

  const refreshRouteCount = useCallback(
    async (routeKey: MenuBadgeRouteKey) => {
      if (!userId) return;
      const token = localStorage.getItem('@ti-assistant:token');
      if (!token) return;

      try {
        const snapshot = await fetchSnapshot(token, routeKey);
        latestSnapshotsRef.current[routeKey] = snapshot.items;
        const next = applyPollResult(userId, routeKey, snapshot);
        setCounts((prev) => ({ ...prev, [routeKey]: next }));
      } catch {
        // keep previous count; poll will retry
      }
    },
    [userId],
  );

  const markRouteSeen = useCallback(
    (routeKey: MenuBadgeRouteKey, snapshot?: MenuBadgeSnapshotItem[]) => {
      if (!userId) return;

      // Absolute pending: visiting must not consume the badge count permanently
      if (!shouldClearCountOnMarkSeen(routeKey)) {
        if (snapshot) {
          latestSnapshotsRef.current[routeKey] = snapshot;
        }
        return;
      }

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
          apply(current.items);
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
            const snapshot = await fetchSnapshot(token, routeKey, { polling: true });
            if (cancelled) return;
            latestSnapshotsRef.current[routeKey] = snapshot.items;
            nextCounts[routeKey] = applyPollResult(userId, routeKey, snapshot);
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
  }, [userId, routeKeys]);

  useEffect(() => {
    if (!userId) {
      setCounts({});
      latestSnapshotsRef.current = {};
    }
  }, [userId]);

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
      refreshRouteCount,
    }),
    [getCount, markRouteSeen, refreshRouteCount],
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
      refreshRouteCount: async () => undefined,
    };
  }
  return ctx;
}
