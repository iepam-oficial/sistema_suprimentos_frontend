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
function parseOptionalString(value) {
    if (value == null || value === '')
        return undefined;
    const s = String(value).trim();
    return s || undefined;
}
/** Aceita CSV (`a,b`) ou array (query repetida). */
function parseMultiValue(value) {
    if (value == null || value === '')
        return undefined;
    const parts = Array.isArray(value)
        ? value.flatMap((v) => String(v).split(','))
        : String(value).split(',');
    const result = parts.map((p) => p.trim()).filter(Boolean);
    return result.length > 0 ? result : undefined;
}
function parseReportFilters(query) {
    return {
        timeRange: String(query.timeRange ?? '30'),
        locationId: parseOptionalString(query.locationId),
        sectorId: parseOptionalString(query.sectorId),
        supplierId: parseOptionalString(query.supplierId),
        categoryId: parseOptionalString(query.categoryId),
        subcategoryId: parseOptionalString(query.subcategoryId),
        ncmIds: parseMultiValue(query.ncmIds),
        cestCodes: parseMultiValue(query.cestCodes),
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
