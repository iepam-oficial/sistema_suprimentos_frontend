'use client';

import { useCallback, useMemo, useState } from 'react';
import type { PurchaseRequestDTO } from '@ti-assistant/contracts';
import type { PurchaseRequestListFilters } from '../api/purchaseRequestApi';
import {
  filterDirectorVisiblePurchaseRequests,
} from '../utils/directorApprovalFilters';
import {
  matchesPurchaseRequestSearch,
  type PurchaseRequestDrawerFilters,
} from './usePurchaseRequestFilters';

export const DEFAULT_DIRECTOR_DRAWER_FILTERS: PurchaseRequestDrawerFilters = {
  status: 'PENDING_APPROVAL',
  priority: '',
  createdFrom: '',
  createdTo: '',
};

export function buildDirectorApiFilters(
  drawerFilters: PurchaseRequestDrawerFilters,
): PurchaseRequestListFilters {
  const filters: PurchaseRequestListFilters = {};

  if (drawerFilters.status) {
    filters.status = drawerFilters.status as PurchaseRequestListFilters['status'];
  }
  if (drawerFilters.priority) {
    filters.priority = drawerFilters.priority as PurchaseRequestListFilters['priority'];
  }
  if (drawerFilters.createdFrom) {
    filters.created_from = drawerFilters.createdFrom;
  }
  if (drawerFilters.createdTo) {
    filters.created_to = drawerFilters.createdTo;
  }

  return filters;
}

export function isDirectorDrawerFilterActive(
  drawerFilters: PurchaseRequestDrawerFilters,
): boolean {
  return Boolean(
    drawerFilters.priority ||
      drawerFilters.createdFrom ||
      drawerFilters.createdTo ||
      (drawerFilters.status && drawerFilters.status !== DEFAULT_DIRECTOR_DRAWER_FILTERS.status),
  );
}

export function useDirectorApprovalFilters(currentUserId: string) {
  const [search, setSearch] = useState('');
  const [drawerFilters, setDrawerFilters] = useState<PurchaseRequestDrawerFilters>(
    DEFAULT_DIRECTOR_DRAWER_FILTERS,
  );

  const filtersActive = isDirectorDrawerFilterActive(drawerFilters);

  const apiFilters = useMemo(
    () => buildDirectorApiFilters(drawerFilters),
    [drawerFilters],
  );

  const clearDrawerFilters = useCallback(() => {
    setDrawerFilters(DEFAULT_DIRECTOR_DRAWER_FILTERS);
  }, []);

  const filterItems = useCallback(
    (items: PurchaseRequestDTO[]) => {
      const visible = filterDirectorVisiblePurchaseRequests(items, currentUserId);
      return visible.filter((item) => matchesPurchaseRequestSearch(item, search));
    },
    [currentUserId, search],
  );

  return {
    search,
    setSearch,
    drawerFilters,
    setDrawerFilters,
    clearDrawerFilters,
    filtersActive,
    apiFilters,
    filterItems,
  };
}
