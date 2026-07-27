"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.VALID_REPORT_SLUGS = void 0;
exports.parseReportFilters = parseReportFilters;
exports.parseTimeRangeDays = parseTimeRangeDays;
exports.dateRangeFromDays = dateRangeFromDays;
exports.VALID_REPORT_SLUGS = [
    'executive-summary',
    'inventory-overview',
    'supplies-stock',
    'consumption-by-sector',
    'purchases-by-batch',
    'service-orders',
    'alerts-by-level',
    'supply-requests',
];
function parseReportFilters(query) {
    return {
        timeRange: String(query.timeRange ?? '30'),
        locationId: query.locationId ? String(query.locationId) : undefined,
        sectorId: query.sectorId ? String(query.sectorId) : undefined,
        supplierId: query.supplierId ? String(query.supplierId) : undefined,
        categoryId: query.categoryId ? String(query.categoryId) : undefined,
    };
}
function parseTimeRangeDays(timeRange) {
    const n = parseInt(timeRange, 10);
    return Number.isFinite(n) && n > 0 ? n : 0;
}
function dateRangeFromDays(days) {
    if (days <= 0)
        return undefined;
    const now = new Date();
    const start = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);
    return { gte: start };
}
