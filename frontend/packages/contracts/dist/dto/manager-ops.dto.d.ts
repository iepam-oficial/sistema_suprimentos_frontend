export declare const ManagerOpsConsumptionPeriod: {
    readonly TODAY: "today";
    readonly WEEK: "week";
    readonly MONTH: "month";
    readonly YEAR: "year";
};
export type ManagerOpsConsumptionPeriod = (typeof ManagerOpsConsumptionPeriod)[keyof typeof ManagerOpsConsumptionPeriod];
export declare const ManagerOpsStockHealthLevel: {
    readonly NORMAL: "NORMAL";
    readonly ATTENTION: "ATTENTION";
    readonly CRITICAL: "CRITICAL";
};
export type ManagerOpsStockHealthLevel = (typeof ManagerOpsStockHealthLevel)[keyof typeof ManagerOpsStockHealthLevel];
export declare const ManagerOpsInboxSeverity: {
    readonly INFO: "INFO";
    readonly WARNING: "WARNING";
    readonly CRITICAL: "CRITICAL";
};
export type ManagerOpsInboxSeverity = (typeof ManagerOpsInboxSeverity)[keyof typeof ManagerOpsInboxSeverity];
export declare const ManagerOpsInboxType: {
    readonly SUPPLY_REQUEST: "SUPPLY_REQUEST";
    readonly QUOTE_DEADLINE: "QUOTE_DEADLINE";
    readonly GOODS_RECEIPT: "GOODS_RECEIPT";
    readonly PURCHASE_ORDER: "PURCHASE_ORDER";
    readonly STOCK_ZERO: "STOCK_ZERO";
    readonly STOCK_LOW: "STOCK_LOW";
    readonly BATCH_EXPIRING: "BATCH_EXPIRING";
    readonly DISCREPANCY: "DISCREPANCY";
};
export type ManagerOpsInboxType = (typeof ManagerOpsInboxType)[keyof typeof ManagerOpsInboxType];
export declare const ManagerOpsKanbanColumn: {
    readonly SOLICITATION: "solicitation";
    readonly AWAITING_APPROVAL: "awaiting_approval";
    readonly QUOTATION: "quotation";
    readonly PURCHASE_ORDER: "purchase_order";
    readonly SUPPLIER: "supplier";
    readonly RECEIPT: "receipt";
    readonly COMPLETED: "completed";
};
export type ManagerOpsKanbanColumn = (typeof ManagerOpsKanbanColumn)[keyof typeof ManagerOpsKanbanColumn];
export declare const ManagerOpsCalendarEventType: {
    readonly BATCH_EXPIRY: "BATCH_EXPIRY";
    readonly SUPPLY_REQUEST_DEADLINE: "SUPPLY_REQUEST_DEADLINE";
    readonly QUOTE_DEADLINE: "QUOTE_DEADLINE";
    readonly PURCHASE_ORDER_EXPIRY: "PURCHASE_ORDER_EXPIRY";
    readonly EVENT: "EVENT";
};
export type ManagerOpsCalendarEventType = (typeof ManagerOpsCalendarEventType)[keyof typeof ManagerOpsCalendarEventType];
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
    items: {
        id: string;
        title: string;
        href: string;
    }[];
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
    discrepancyRate: number;
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
    period: {
        from: string;
        to: string;
    };
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
//# sourceMappingURL=manager-ops.dto.d.ts.map