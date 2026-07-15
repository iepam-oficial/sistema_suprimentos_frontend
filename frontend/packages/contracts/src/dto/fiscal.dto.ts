export interface FiscalNcmDTO {
  id: string;
  code: string;
  description: string;
  effective_from?: string | null;
  active: boolean;
  catalog_version_id?: string | null;
  created_at: string;
  updated_at: string;
}

export interface FiscalCestDTO {
  id: string;
  code: string;
  description: string;
  default_ncm_id?: string | null;
  active: boolean;
  catalog_version_id?: string | null;
  default_ncm?: Pick<FiscalNcmDTO, 'id' | 'code' | 'description'> | null;
  created_at: string;
  updated_at: string;
}

export interface CreateFiscalNcmInput {
  code: string;
  description: string;
  effective_from?: string | null;
  active?: boolean;
}

export interface UpdateFiscalNcmInput {
  description?: string;
  effective_from?: string | null;
  active?: boolean;
}

export interface CreateFiscalCestInput {
  code: string;
  description: string;
  default_ncm_id?: string | null;
  active?: boolean;
}

export interface UpdateFiscalCestInput {
  description?: string;
  default_ncm_id?: string | null;
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
  diff?: Array<{ field: string; from: unknown; to: unknown }> | null;
  created_at: string;
}
