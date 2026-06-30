'use client';

import { useCallback, useMemo, useState } from 'react';
import type { PurchaseRequestDTO } from '@ti-assistant/contracts';
import type { PurchaseRequestListFilters } from '../api/purchaseRequestApi';

export interface PurchaseRequestDrawerFilters {
  status: string;
  priority: string;
  createdFrom: string;
  createdTo: string;
}

const EMPTY_DRAWER: PurchaseRequestDrawerFilters = {
  status: '',
  priority: '',
  createdFrom: '',
  createdTo: '',
};

export function matchesPurchaseRequestSearch(
  item: PurchaseRequestDTO,
  searchTerm: string,
): boolean {
  const search = searchTerm.trim().toLowerCase();
  if (!search) return true;

  return (
    item.display_code.toLowerCase().includes(search) ||
    item.justification.toLowerCase().includes(search) ||
    item.items.some((row) => row.description.toLowerCase().includes(search))
  );
}

export function usePurchaseRequestFilters() {
  const [search, setSearch] = useState('');
  const [drawerFilters, setDrawerFilters] =
    useState<PurchaseRequestDrawerFilters>(EMPTY_DRAWER);

  const filtersActive = Boolean(
    drawerFilters.status ||
      drawerFilters.priority ||
      drawerFilters.createdFrom ||
      drawerFilters.createdTo,
  );

  const apiFilters = useMemo((): PurchaseRequestListFilters => {
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
  }, [drawerFilters]);

  const clearDrawerFilters = useCallback(() => {
    setDrawerFilters(EMPTY_DRAWER);
  }, []);

  const filterItems = useCallback(
    (items: PurchaseRequestDTO[]) =>
      items.filter((item) => matchesPurchaseRequestSearch(item, search)),
    [search],
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
