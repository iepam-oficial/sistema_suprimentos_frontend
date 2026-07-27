export interface FiscalCestEmbedded {
    code: string;
    description: string;
    segmento: string;
}
export interface FiscalNcmDTO {
    id: string;
    code: string;
    description: string;
    effective_from?: string | null;
    cests: FiscalCestEmbedded[];
    active: boolean;
    catalog_version_id?: string | null;
    created_at: string;
    updated_at: string;
}
export interface FiscalNcmListResultDTO {
    items: FiscalNcmDTO[];
    total: number;
    page: number;
    limit: number;
}
export interface CreateFiscalNcmInput {
    code: string;
    description: string;
    effective_from?: string | null;
    cest_codes?: string[];
    active?: boolean;
}
export interface UpdateFiscalNcmInput {
    description?: string;
    effective_from?: string | null;
    cest_codes?: string[];
    active?: boolean;
}
export interface CatalogSettingsDTO {
    id: string;
    internal_code_prefix: string;
    internal_code_padding: number;
    updated_by_id?: string | null;
    updated_at: string;
}
export interface UpdateCatalogSettingsInput {
    internal_code_prefix: string;
    internal_code_padding: number;
}
export interface FiscalCatalogAuditLogDTO {
    id: string;
    entity_type: string;
    entity_id: string;
    action: string;
    actor_id?: string | null;
    diff?: Array<{
        field: string;
        from: unknown;
        to: unknown;
    }> | null;
    created_at: string;
}
//# sourceMappingURL=fiscal.dto.d.ts.map