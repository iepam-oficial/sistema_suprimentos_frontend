export interface CategoryDTO {
    id: string;
    value: string;
    label: string;
    created_at?: string;
    updated_at?: string;
}
export interface CreateCategoryInput {
    value: string;
    label: string;
}
export interface UpdateCategoryInput {
    value?: string;
    label?: string;
}
export interface SubcategoryDTO {
    id: string;
    value: string;
    label: string;
    category_id: string;
    created_at?: string;
    updated_at?: string;
    category?: CategoryDTO;
}
export interface CreateSubcategoryInput {
    value: string;
    label: string;
    category_id: string;
}
export interface UpdateSubcategoryInput {
    value?: string;
    label?: string;
    category_id?: string;
}
export interface UnitOfMeasureDTO {
    id: string;
    name: string;
    symbol: string;
    description?: string | null;
    created_at?: string;
    updated_at?: string;
}
export interface CreateUnitOfMeasureInput {
    name: string;
    symbol: string;
    description?: string;
}
export interface UpdateUnitOfMeasureInput {
    name?: string;
    symbol?: string;
    description?: string;
}
export interface LocationRefDTO {
    id: string;
    name: string;
}
export interface LocationDTO {
    id: string;
    name: string;
    address?: string;
    branch?: string;
    cnpj?: string | null;
    legal_name?: string | null;
    user_id?: string;
    created_at?: string;
    updated_at?: string;
}
export interface CreateLocationInput {
    name: string;
    address: string;
    branch: string;
    cnpj?: string | null;
    legal_name?: string | null;
}
export interface UpdateLocationInput {
    name?: string;
    address?: string;
    branch?: string;
    cnpj?: string | null;
    legal_name?: string | null;
}
export interface SectorDTO {
    id: string;
    name: string;
    description?: string | null;
    location_id: string;
    created_at?: string;
    updated_at?: string;
    location?: LocationRefDTO;
}
export interface SectorWithCountDTO extends SectorDTO {
    inventory_count?: number;
    _count?: {
        inventory: number;
    };
}
export interface CreateSectorInput {
    name: string;
    description?: string;
    location_id: string;
}
export interface UpdateSectorInput {
    name?: string;
    description?: string;
    location_id?: string;
}
export interface LocaleDTO {
    id: string;
    name: string;
    description?: string | null;
    location_id?: string;
    created_at?: string;
    updated_at?: string;
    location?: LocationRefDTO;
}
export interface CreateLocaleInput {
    name: string;
    description?: string;
    location_id: string;
}
export interface UpdateLocaleInput {
    name?: string;
    description?: string;
}
//# sourceMappingURL=reference-data.dto.d.ts.map