import {
  isDetailEnrichedSlug,
  isStockReportSlug,
  type ReportFiltersQuery,
} from './api/reportApi';
import type { ReportSlug } from './types';

export interface ReportFiltersState {
  timeRange: string;
  locationId: string;
  sectorId: string;
  supplierId: string;
  categoryId: string;
  subcategoryId: string;
  ncmIds: string[];
  cestCodes: string[];
}

export const EMPTY_FILTERS: ReportFiltersState = {
  timeRange: '30',
  locationId: '',
  sectorId: '',
  supplierId: '',
  categoryId: '',
  subcategoryId: '',
  ncmIds: [],
  cestCodes: [],
};

export interface FilterFieldVisibility {
  period: boolean;
  location: boolean;
  sector: boolean;
  supplier: boolean;
  category: boolean;
  subcategory: boolean;
  ncm: boolean;
  cest: boolean;
}

export function getFilterFieldVisibility(slug: ReportSlug): FilterFieldVisibility {
  if (isStockReportSlug(slug)) {
    const suppliesStock = slug === 'supplies-stock';
    return {
      period: false,
      location: !suppliesStock,
      sector: !suppliesStock,
      supplier: true,
      category: true,
      subcategory: true,
      ncm: true,
      cest: true,
    };
  }

  if (isDetailEnrichedSlug(slug)) {
    const catalog = {
      category: true,
      subcategory: true,
      ncm: true,
      cest: true,
    } as const;

    switch (slug) {
      case 'supply-requests':
      case 'consumption-by-sector':
        return {
          period: true,
          location: true,
          sector: true,
          supplier: false,
          ...catalog,
        };
      case 'purchases-by-batch':
      case 'service-orders':
        return {
          period: true,
          location: false,
          sector: false,
          supplier: true,
          ...catalog,
        };
      case 'alerts-by-level':
        return {
          period: false,
          location: true,
          sector: true,
          supplier: false,
          ...catalog,
        };
      case 'executive-summary':
        return {
          period: true,
          location: true,
          sector: true,
          supplier: true,
          ...catalog,
        };
      default:
        break;
    }
  }

  return {
    period: true,
    location: true,
    sector: true,
    supplier: true,
    category: false,
    subcategory: false,
    ncm: false,
    cest: false,
  };
}

export function toReportFiltersQuery(
  slug: ReportSlug,
  filters: ReportFiltersState
): ReportFiltersQuery {
  const visibility = getFilterFieldVisibility(slug);
  const q: ReportFiltersQuery = {};

  if (visibility.period) {
    q.timeRange = filters.timeRange;
  }
  if (visibility.location && filters.locationId) {
    q.locationId = filters.locationId;
  }
  if (visibility.sector && filters.sectorId) {
    q.sectorId = filters.sectorId;
  }
  if (visibility.supplier && filters.supplierId) {
    q.supplierId = filters.supplierId;
  }
  if (visibility.category && filters.categoryId) {
    q.categoryId = filters.categoryId;
  }
  if (visibility.subcategory && filters.subcategoryId) {
    q.subcategoryId = filters.subcategoryId;
  }
  if (visibility.ncm && filters.ncmIds.length) {
    q.ncmIds = filters.ncmIds;
  }
  if (visibility.cest && filters.cestCodes.length) {
    q.cestCodes = filters.cestCodes;
  }
  return q;
}
