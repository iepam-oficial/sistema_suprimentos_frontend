import type { UserRefDTO } from './user.dto';
import type { LocationRefDTO } from './reference-data.dto';
import type { SupplierRefDTO } from './catalog.dto';
export type { LocationRefDTO, SupplierRefDTO };
export declare const ServiceType: {
    readonly MAINTENANCE: "MAINTENANCE";
    readonly INSTALLATION: "INSTALLATION";
    readonly CALIBRATION: "CALIBRATION";
    readonly CLEANING: "CLEANING";
    readonly CONFIGURATION: "CONFIGURATION";
    readonly INSPECTION: "INSPECTION";
    readonly OTHER: "OTHER";
};
export type ServiceType = (typeof ServiceType)[keyof typeof ServiceType];
export declare const TaskStatus: {
    readonly PENDING: "PENDING";
    readonly IN_PROGRESS: "IN_PROGRESS";
    readonly COMPLETED: "COMPLETED";
    readonly CANCELLED: "CANCELLED";
};
export type TaskStatus = (typeof TaskStatus)[keyof typeof TaskStatus];
export interface InventoryRefDTO {
    id: string;
    name: string;
    serial_number: string;
    model?: string;
}
export interface TaskSummaryDTO {
    id: string;
    status: TaskStatus | string;
    due_date: string;
    title?: string;
}
export interface MaintenanceScheduleRefDTO {
    id: string;
    type: ServiceType | string;
    interval_days: number;
    inventory?: InventoryRefDTO;
    technician?: UserRefDTO;
}
export interface MaintenanceScheduleDTO {
    id: string;
    inventory_id: string;
    technician_id: string;
    type: ServiceType | string;
    interval_days: number;
    notes?: string | null;
    active: boolean;
    created_at: string;
    updated_at: string;
    inventory?: InventoryRefDTO;
    technician?: UserRefDTO;
    tasks?: TaskSummaryDTO[];
    nextMaintenanceDate?: string;
    nextPendingTask?: TaskSummaryDTO;
}
export interface TaskDTO {
    id: string;
    schedule_id: string;
    title: string;
    description?: string | null;
    due_date: string;
    status: TaskStatus | string;
    completed_at?: string | null;
    created_at: string;
    updated_at: string;
    schedule?: MaintenanceScheduleRefDTO;
}
export interface CreateMaintenanceScheduleInput {
    inventory_id: string;
    type: ServiceType | string;
    interval_days: number;
    notes?: string;
    active?: boolean;
}
export interface UpdateMaintenanceScheduleInput {
    inventory_id?: string;
    technician_id?: string;
    type?: ServiceType | string;
    interval_days?: number;
    notes?: string;
    active?: boolean;
}
export interface CreateTaskInput {
    schedule_id: string;
    title: string;
    description?: string;
    due_date: string;
    status?: TaskStatus | string;
}
export interface UpdateTaskInput {
    title?: string;
    description?: string;
    due_date?: string;
    status?: TaskStatus | string;
    completed_at?: string;
}
export interface SectorRefDTO {
    id: string;
    name: string;
}
export interface InternalServiceOrderDTO {
    id: string;
    title: string;
    description?: string | null;
    technician_id: string;
    inventory_id?: string | null;
    location_id?: string | null;
    sector_id?: string | null;
    start_date: string;
    end_date?: string | null;
    time_spent_hours: number;
    type: ServiceType | string;
    notes?: string | null;
    created_at: string;
    updated_at: string;
    technician?: UserRefDTO;
    inventory?: InventoryRefDTO;
    location?: LocationRefDTO;
    sector?: SectorRefDTO;
}
export interface CreateInternalServiceOrderInput {
    title: string;
    description?: string;
    inventory_id?: string;
    location_id?: string;
    sector_id?: string;
    start_date: string;
    end_date?: string;
    time_spent_hours?: number;
    type?: ServiceType | string;
    notes?: string;
}
export interface UpdateInternalServiceOrderInput {
    title?: string;
    description?: string;
    technician_id?: string;
    inventory_id?: string;
    location_id?: string;
    sector_id?: string;
    start_date?: string;
    end_date?: string;
    time_spent_hours?: number;
    type?: ServiceType | string;
    notes?: string;
}
export interface ServiceOrderUserRefDTO {
    name: string;
    email?: string;
}
export interface ServiceOrderSupplierRefDTO {
    name: string;
    contact_person?: string;
}
export interface ServiceOrderDTO {
    id: string;
    order_number: string;
    client_name: string;
    equipment_description: string;
    model: string;
    serial_number: string;
    problem_reported: string;
    entry_date: string;
    exit_date: string | null;
    supplier_id: string | null;
    service_type: string;
    accessories: string;
    notes: string;
    total_price: number;
    pdf_url: string | null;
    user_id: string;
    created_at: string;
    updated_at: string;
    user?: ServiceOrderUserRefDTO;
    supplier?: ServiceOrderSupplierRefDTO;
    inventory?: InventoryRefDTO;
}
export interface CreateServiceOrderInput {
    order_number?: string;
    client_name?: string;
    equipment_description?: string;
    model?: string;
    serial_number: string;
    problem_reported: string;
    entry_date?: string;
    service_type: string;
    accessories?: string;
    notes?: string;
    total_price?: number;
    supplier_id?: string;
    pdf_url?: string;
}
export interface UpdateServiceOrderInput {
    client_name?: string;
    equipment_description?: string;
    model?: string;
    problem_reported?: string;
    exit_date?: string;
    service_type?: string;
    accessories?: string;
    notes?: string;
    total_price?: number;
    supplier_id?: string;
}
export interface CloseServiceOrderInput {
    exit_date: string;
}
//# sourceMappingURL=operations.dto.d.ts.map