'use client';

import { useCallback, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import type { ExecutiveFinanceFilters } from '@ti-assistant/contracts';

/**
 * Hybrid drill-down for the executive finance dashboard (EFD-23):
 *  - Level 1 (polo): inline — sets `filters.locationId`, clears deeper levels.
 *  - Level 2 (setor OR categoria): inline — sets `sectorId`/`categoryId` on top of
 *    whatever polo is active, without leaving the page.
 *  - Level 3+: the user is trying to drill into a *second* dimension at level 2
 *    (e.g. already has `sectorId` and clicks a categoria, or vice-versa) — at that
 *    point we navigate to the matching operational list with the filters mirrored
 *    in the query string, since the dashboard has no deeper inline slice for it.
 *
 * Navigation targets (chosen to match the domain owning each dimension per
 * `.specs/features/executive-financial-dashboard/design.md`):
 *  - Setor  -> `/procurement/solicitacoes` (SC/PR carry the requesting sector)
 *  - Categoria -> `/procurement/pedidos` (PO items carry supply/inventory category)
 */

export type DrilldownDimension = 'locationId' | 'sectorId' | 'categoryId';

export interface DrilldownChip {
  dimension: DrilldownDimension;
  label: string;
}

export interface UseExecutiveDrilldownResult {
  /** 0 = no drill, 1 = polo only, 2 = polo + setor/categoria. */
  level: 0 | 1 | 2;
  chips: DrilldownChip[];
  handlePoloClick: (id: string | null | undefined, label: string) => void;
  handleSectorClick: (id: string | null | undefined, label: string) => void;
  handleCategoryClick: (id: string | null | undefined, label: string) => void;
  clearDimension: (dimension: DrilldownDimension) => void;
  clearAll: () => void;
}

type DrilldownLabels = Partial<Record<DrilldownDimension, string>>;

const SECTOR_DRILLTHROUGH_PATH = '/procurement/solicitacoes';
const CATEGORY_DRILLTHROUGH_PATH = '/procurement/pedidos';

function buildQueryString(
  filters: ExecutiveFinanceFilters,
  overrides: Partial<ExecutiveFinanceFilters>
): string {
  const merged: ExecutiveFinanceFilters = { ...filters, ...overrides };
  const params = new URLSearchParams();
  Object.entries(merged).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      params.set(key, String(value));
    }
  });
  return params.toString();
}

export function useExecutiveDrilldown(
  filters: ExecutiveFinanceFilters,
  setFilters: (updater: (prev: ExecutiveFinanceFilters) => ExecutiveFinanceFilters) => void
): UseExecutiveDrilldownResult {
  const router = useRouter();
  const [labels, setLabels] = useState<DrilldownLabels>({});

  const level = useMemo<0 | 1 | 2>(() => {
    if (filters.sectorId || filters.categoryId) return 2;
    if (filters.locationId) return 1;
    return 0;
  }, [filters.locationId, filters.sectorId, filters.categoryId]);

  const navigateToOperationalList = useCallback(
    (path: string, overrides: Partial<ExecutiveFinanceFilters>) => {
      const qs = buildQueryString(filters, overrides);
      router.push(qs ? `${path}?${qs}` : path);
    },
    [filters, router]
  );

  const handlePoloClick = useCallback(
    (id: string | null | undefined, label: string) => {
      if (!id) return;
      // Level 1: (re)selecting a polo always clears deeper inline levels.
      setFilters((prev) => ({ ...prev, locationId: id, sectorId: undefined, categoryId: undefined }));
      setLabels((prev) => ({ ...prev, locationId: label, sectorId: undefined, categoryId: undefined }));
    },
    [setFilters]
  );

  const handleSectorClick = useCallback(
    (id: string | null | undefined, label: string) => {
      if (!id) return;
      if (filters.categoryId) {
        // Already drilled into a categoria (level 2) — a sector click now is a
        // 3rd dimension, so hand off to the operational list instead of the chart.
        navigateToOperationalList(SECTOR_DRILLTHROUGH_PATH, { sectorId: id });
        return;
      }
      setFilters((prev) => ({ ...prev, sectorId: id }));
      setLabels((prev) => ({ ...prev, sectorId: label }));
    },
    [filters.categoryId, navigateToOperationalList, setFilters]
  );

  const handleCategoryClick = useCallback(
    (id: string | null | undefined, label: string) => {
      if (!id) return;
      if (filters.sectorId) {
        // Already drilled into a setor (level 2) — same idea as above, mirrored.
        navigateToOperationalList(CATEGORY_DRILLTHROUGH_PATH, { categoryId: id });
        return;
      }
      setFilters((prev) => ({ ...prev, categoryId: id }));
      setLabels((prev) => ({ ...prev, categoryId: label }));
    },
    [filters.sectorId, navigateToOperationalList, setFilters]
  );

  const clearDimension = useCallback(
    (dimension: DrilldownDimension) => {
      setFilters((prev) => ({ ...prev, [dimension]: undefined }));
      setLabels((prev) => ({ ...prev, [dimension]: undefined }));
    },
    [setFilters]
  );

  const clearAll = useCallback(() => {
    setFilters((prev) => ({ ...prev, locationId: undefined, sectorId: undefined, categoryId: undefined }));
    setLabels({});
  }, [setFilters]);

  const chips = useMemo<DrilldownChip[]>(() => {
    const result: DrilldownChip[] = [];
    if (filters.locationId) {
      result.push({ dimension: 'locationId', label: labels.locationId ?? `Polo: ${filters.locationId}` });
    }
    if (filters.sectorId) {
      result.push({ dimension: 'sectorId', label: labels.sectorId ?? `Setor: ${filters.sectorId}` });
    }
    if (filters.categoryId) {
      result.push({ dimension: 'categoryId', label: labels.categoryId ?? `Categoria: ${filters.categoryId}` });
    }
    return result;
  }, [filters.locationId, filters.sectorId, filters.categoryId, labels]);

  return { level, chips, handlePoloClick, handleSectorClick, handleCategoryClick, clearDimension, clearAll };
}
