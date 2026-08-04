export const ManagerOpsConsumptionPeriod = {
  TODAY: 'today',
  WEEK: 'week',
  MONTH: 'month',
  YEAR: 'year',
} as const;

export type ManagerOpsConsumptionPeriod =
  (typeof ManagerOpsConsumptionPeriod)[keyof typeof ManagerOpsConsumptionPeriod];

export const ManagerOpsStockHealthLevel = {
  NORMAL: 'NORMAL',
  ATTENTION: 'ATTENTION',
  CRITICAL: 'CRITICAL',
} as const;

export type ManagerOpsStockHealthLevel =
  (typeof ManagerOpsStockHealthLevel)[keyof typeof ManagerOpsStockHealthLevel];

export const ManagerOpsInboxSeverity = {
  INFO: 'INFO',
  WARNING: 'WARNING',
  CRITICAL: 'CRITICAL',
} as const;

export type ManagerOpsInboxSeverity =
  (typeof ManagerOpsInboxSeverity)[keyof typeof ManagerOpsInboxSeverity];

export const ManagerOpsInboxType = {
  SUPPLY_REQUEST: 'SUPPLY_REQUEST',
  QUOTE_DEADLINE: 'QUOTE_DEADLINE',
  GOODS_RECEIPT: 'GOODS_RECEIPT',
  PURCHASE_ORDER: 'PURCHASE_ORDER',
  STOCK_ZERO: 'STOCK_ZERO',
  STOCK_LOW: 'STOCK_LOW',
  BATCH_EXPIRING: 'BATCH_EXPIRING',
  DISCREPANCY: 'DISCREPANCY',
} as const;

export type ManagerOpsInboxType =
  (typeof ManagerOpsInboxType)[keyof typeof ManagerOpsInboxType];

export const ManagerOpsKanbanColumn = {
  SOLICITATION: 'solicitation',
  AWAITING_APPROVAL: 'awaiting_approval',
  QUOTATION: 'quotation',
  PURCHASE_ORDER: 'purchase_order',
  SUPPLIER: 'supplier',
  RECEIPT: 'receipt',
  COMPLETED: 'completed',
} as const;

export type ManagerOpsKanbanColumn =
  (typeof ManagerOpsKanbanColumn)[keyof typeof ManagerOpsKanbanColumn];

export const ManagerOpsCalendarEventType = {
  BATCH_EXPIRY: 'BATCH_EXPIRY',
  SUPPLY_REQUEST_DEADLINE: 'SUPPLY_REQUEST_DEADLINE',
  QUOTE_DEADLINE: 'QUOTE_DEADLINE',
  PURCHASE_ORDER_EXPIRY: 'PURCHASE_ORDER_EXPIRY',
  EVENT: 'EVENT',
} as const;

export type ManagerOpsCalendarEventType =
  (typeof ManagerOpsCalendarEventType)[keyof typeof ManagerOpsCalendarEventType];

export interface ManagerOpsFilters {
  from?: string;
  to?: string;
  consumptionPeriod?: ManagerOpsConsumptionPeriod;
  categoryId?: string;
  sectorId?: string;
  locationId?: string;
  supplierId?: string;
}

export interface ManagerOpsKpisDTO {
  products: number;
  inStock: number;
  lowStock: number;
  pendingRequests: number;
  purchasesInProgress: number;
  stockValue: number;
}

export interface ManagerOpsInboxItemDTO {
  id: string;
  type: ManagerOpsInboxType;
  severity: ManagerOpsInboxSeverity;
  title: string;
  description?: string;
  href: string;
  dueAt?: string;
}

export interface ManagerOpsKanbanColumnDTO {
  key: ManagerOpsKanbanColumn;
  label: string;
  count: number;
  items: { id: string; title: string; href: string }[];
}

export interface ManagerOpsStockHealthDTO {
  normal: number;
  attention: number;
  critical: number;
  inactiveOver180Days: number;
  expiringBatches: number;
  expiredBatches: number;
}

export interface ManagerOpsNamedQuantityDTO {
  id: string | null;
  label: string;
  quantity: number;
}

export interface ManagerOpsSpendMonthDTO {
  period: string;
  purchases: number;
  freight: number;
  extraExpenses: number;
}

export interface ManagerOpsSupplierPerformanceDTO {
  supplierId: string;
  name: string;
  purchasesCount: number;
  totalValue: number;
  discrepancyRate: number; // 0–1
}

export interface ManagerOpsAlertDTO {
  code: string;
  severity: ManagerOpsInboxSeverity;
  title: string;
  description: string;
  href?: string;
  count: number;
}

export interface ManagerOpsCalendarEventDTO {
  id: string;
  type: ManagerOpsCalendarEventType;
  title: string;
  at: string;
  href?: string;
}

export interface ManagerOpsDashboardMetaDTO {
  stockHealthAttentionFactor: number;
  calendarHorizonDays: number;
  generatedAt: string;
}

export interface ManagerOpsDashboardDTO {
  period: { from: string; to: string };
  consumptionPeriod: ManagerOpsConsumptionPeriod;
  filtersApplied: ManagerOpsFilters;
  kpis: ManagerOpsKpisDTO;
  inbox: ManagerOpsInboxItemDTO[];
  kanban: ManagerOpsKanbanColumnDTO[];
  stockHealth: ManagerOpsStockHealthDTO;
  consumptionBySector: ManagerOpsNamedQuantityDTO[];
  topConsumed: ManagerOpsNamedQuantityDTO[];
  spendByMonth: ManagerOpsSpendMonthDTO[];
  supplierPerformance: ManagerOpsSupplierPerformanceDTO[];
  alerts: ManagerOpsAlertDTO[];
  calendar: ManagerOpsCalendarEventDTO[];
  meta: ManagerOpsDashboardMetaDTO;
}
