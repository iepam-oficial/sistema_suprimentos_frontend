import type { AllocationStatus, DepreciationMethod, InventoryStatus } from '../enums';
import type { ChartOfAccountDTO } from './finance.dto';
import type { FiscalNcmDTO } from './fiscal.dto';
import type { InvoiceLineFiscalSnapshot } from './invoice-fiscal.dto';
import type { UserDTO } from './user.dto';
import type { CategoryDTO, LocationDTO } from './reference-data.dto';
/** @deprecated Use CategoryDTO from reference-data */
export type CategoryLabelDTO = CategoryDTO;
export type { LocationDTO };
export interface InventoryItemDTO extends InvoiceLineFiscalSnapshot {
    id: string;
    internal_code?: string | null;
    item?: string;
    name: string;
    model: string;
    serial_number: string;
    finality?: string;
    acquisition_price?: number;
    freight?: number;
    residual_value?: number;
    depreciated_value?: number;
    service_life?: number;
    image_url?: string | null;
    supplier_id?: string;
    acquisition_date?: string;
    location_id?: string;
    user_id?: string;
    created_at?: string;
    category_id?: string;
    description?: string | null;
    locale_id?: string | null;
    subcategory_id?: string;
    status: InventoryStatus;
    sector_id?: string | null;
    chart_of_account_id?: string | null;
    chart_of_account?: Pick<ChartOfAccountDTO, 'codigo' | 'nome'> | null;
    ncm?: string | null;
    cest?: string | null;
    ncm_id?: string | null;
    fiscal_ncm?: Pick<FiscalNcmDTO, 'id' | 'code' | 'description'> | null;
    annual_rate?: number | null;
    depreciation_rate_id?: string | null;
    depreciation_method?: DepreciationMethod | null;
    depreciation_rule_applied_at?: string | null;
    depreciation_rate_override?: boolean;
    override_reason?: string | null;
    rule_service_life?: number | null;
    rule_annual_rate?: number | null;
    location?: LocationDTO;
    user?: UserDTO;
    category: CategoryLabelDTO | {
        label: string;
    };
    subcategory?: CategoryLabelDTO;
}
export interface InventoryAllocationDTO {
    id: string;
    inventory_id: string;
    requester_id: string;
    approver_id?: string | null;
    status: AllocationStatus;
    approval_date?: string | null;
    destination: string;
    return_date?: string | null;
    delivery_date?: string | null;
    notes?: string | null;
    manager_delivery_confirmation?: boolean;
    requester_delivery_confirmation?: boolean;
    manager_return_confirmation?: boolean;
    inventory?: InventoryItemDTO;
    requester?: UserDTO;
}
//# sourceMappingURL=inventory.dto.d.ts.map