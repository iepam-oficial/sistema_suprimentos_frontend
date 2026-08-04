"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ManagerOpsCalendarEventType = exports.ManagerOpsKanbanColumn = exports.ManagerOpsInboxType = exports.ManagerOpsInboxSeverity = exports.ManagerOpsStockHealthLevel = exports.ManagerOpsConsumptionPeriod = void 0;
exports.ManagerOpsConsumptionPeriod = {
    TODAY: 'today',
    WEEK: 'week',
    MONTH: 'month',
    YEAR: 'year',
};
exports.ManagerOpsStockHealthLevel = {
    NORMAL: 'NORMAL',
    ATTENTION: 'ATTENTION',
    CRITICAL: 'CRITICAL',
};
exports.ManagerOpsInboxSeverity = {
    INFO: 'INFO',
    WARNING: 'WARNING',
    CRITICAL: 'CRITICAL',
};
exports.ManagerOpsInboxType = {
    SUPPLY_REQUEST: 'SUPPLY_REQUEST',
    QUOTE_DEADLINE: 'QUOTE_DEADLINE',
    GOODS_RECEIPT: 'GOODS_RECEIPT',
    PURCHASE_ORDER: 'PURCHASE_ORDER',
    STOCK_ZERO: 'STOCK_ZERO',
    STOCK_LOW: 'STOCK_LOW',
    BATCH_EXPIRING: 'BATCH_EXPIRING',
    DISCREPANCY: 'DISCREPANCY',
};
exports.ManagerOpsKanbanColumn = {
    SOLICITATION: 'solicitation',
    AWAITING_APPROVAL: 'awaiting_approval',
    QUOTATION: 'quotation',
    PURCHASE_ORDER: 'purchase_order',
    SUPPLIER: 'supplier',
    RECEIPT: 'receipt',
    COMPLETED: 'completed',
};
exports.ManagerOpsCalendarEventType = {
    BATCH_EXPIRY: 'BATCH_EXPIRY',
    SUPPLY_REQUEST_DEADLINE: 'SUPPLY_REQUEST_DEADLINE',
    QUOTE_DEADLINE: 'QUOTE_DEADLINE',
    PURCHASE_ORDER_EXPIRY: 'PURCHASE_ORDER_EXPIRY',
    EVENT: 'EVENT',
};
