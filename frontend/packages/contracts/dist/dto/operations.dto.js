"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TaskStatus = exports.ServiceType = void 0;
exports.ServiceType = {
    MAINTENANCE: 'MAINTENANCE',
    INSTALLATION: 'INSTALLATION',
    CALIBRATION: 'CALIBRATION',
    CLEANING: 'CLEANING',
    CONFIGURATION: 'CONFIGURATION',
    INSPECTION: 'INSPECTION',
    OTHER: 'OTHER',
};
exports.TaskStatus = {
    PENDING: 'PENDING',
    IN_PROGRESS: 'IN_PROGRESS',
    COMPLETED: 'COMPLETED',
    CANCELLED: 'CANCELLED',
};
