"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SupportTicketKind = exports.PriorityLevel = exports.TicketStatus = void 0;
exports.TicketStatus = {
    OPEN: 'OPEN',
    IN_PROGRESS: 'IN_PROGRESS',
    RESOLVED: 'RESOLVED',
    CLOSED: 'CLOSED',
};
exports.PriorityLevel = {
    LOW: 'LOW',
    MEDIUM: 'MEDIUM',
    HIGH: 'HIGH',
    URGENT: 'URGENT',
};
exports.SupportTicketKind = {
    INCIDENT: 'INCIDENT',
    SERVICE_REQUEST: 'SERVICE_REQUEST',
    QUESTION: 'QUESTION',
    OTHER: 'OTHER',
};
