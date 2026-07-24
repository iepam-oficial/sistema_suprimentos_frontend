export declare const DepreciationMethod: {
    readonly LINEAR: "LINEAR";
};
export type DepreciationMethod = (typeof DepreciationMethod)[keyof typeof DepreciationMethod];
export interface DepreciationRateDTO {
    id: string;
    description: string;
    ncm?: string | null;
    cest?: string | null;
    service_life_years: number;
    annual_rate: number;
    priority: number;
    effective_from: string;
    effective_to?: string | null;
    active: boolean;
    created_at: string;
    updated_at: string;
}
export interface CreateDepreciationRateInput {
    description: string;
    ncm?: string | null;
    cest?: string;
    service_life_years: number;
    annual_rate: number;
    priority?: number;
    effective_from: string;
    effective_to?: string;
    active?: boolean;
}
export interface UpdateDepreciationRateInput {
    description?: string;
    ncm?: string | null;
    cest?: string | null;
    service_life_years?: number;
    annual_rate?: number;
    priority?: number;
    effective_from?: string;
    effective_to?: string | null;
    active?: boolean;
}
export interface DepreciationSuggestResponse {
    rules: DepreciationRateDTO[];
}
export interface DepreciationImportResultDTO {
    created: number;
    updated: number;
    skipped: number;
    invalid: number;
    details: Array<{
        index: number;
        reason: string;
        ncm?: string;
        description?: string;
    }>;
}
//# sourceMappingURL=depreciation-rate.dto.d.ts.map