import type { UserRefDTO } from './user.dto';
export declare const ChartOfAccountType: {
    readonly ATIVO: "ATIVO";
    readonly PASSIVO: "PASSIVO";
    readonly PATRIMONIO: "PATRIMONIO";
    readonly RECEITA: "RECEITA";
    readonly DESPESA: "DESPESA";
};
export type ChartOfAccountType = (typeof ChartOfAccountType)[keyof typeof ChartOfAccountType];
export interface ChartOfAccountDTO {
    id: string;
    codigo: string;
    nome: string;
    tipo: ChartOfAccountType;
    descricao?: string | null;
    has_links: boolean;
    created_at: string;
    updated_at: string;
}
export interface CreateChartOfAccountInput {
    codigo: string;
    nome: string;
    tipo: ChartOfAccountType;
    descricao?: string | null;
}
export interface UpdateChartOfAccountInput {
    codigo?: string;
    nome?: string;
    tipo?: ChartOfAccountType;
    descricao?: string | null;
}
export interface ExtraExpenseCategoryDTO {
    id: string;
    value: string;
    label: string;
    description?: string | null;
    created_at: string;
    updated_at: string;
}
export interface FinanceLocationRefDTO {
    id: string;
    name: string;
    address?: string;
    branch?: string;
}
export interface FinanceEventRefDTO {
    id: string;
    title: string;
    description?: string;
}
/** @deprecated Use UserRefDTO from user.dto */
export type FinanceUserRefDTO = UserRefDTO;
export interface ExtraExpenseDTO {
    id: string;
    category_id: string;
    description?: string | null;
    amount: number;
    date: string;
    location_id?: string | null;
    event_id?: string | null;
    user_id?: string | null;
    receipt_url?: string | null;
    notes?: string | null;
    created_at: string;
    updated_at: string;
    category: ExtraExpenseCategoryDTO;
    location?: FinanceLocationRefDTO | null;
    event?: FinanceEventRefDTO | null;
    user?: FinanceUserRefDTO | null;
}
export interface CreateExtraExpenseInput {
    category_id: string;
    description?: string;
    amount: number;
    date: string;
    location_id?: string;
    event_id?: string;
    user_id?: string;
    receipt_url?: string;
    notes?: string;
}
export interface UpdateExtraExpenseInput {
    category_id?: string;
    description?: string;
    amount?: number;
    date?: string;
    location_id?: string | null;
    event_id?: string | null;
    user_id?: string | null;
    receipt_url?: string;
    notes?: string;
}
export interface CreateExtraExpenseCategoryInput {
    value: string;
    label: string;
    description?: string;
}
export interface UpdateExtraExpenseCategoryInput {
    value?: string;
    label?: string;
    description?: string;
}
export interface ExtraExpenseFilters {
    category_id?: string;
    location_id?: string;
    event_id?: string;
    user_id?: string;
    start_date?: string;
    end_date?: string;
    min_amount?: number;
    max_amount?: number;
}
export interface ExtraExpensePeriodTotalDTO {
    total: number;
    startDate: string;
    endDate: string;
}
export interface ExtraExpenseCategoryTotalDTO {
    categoryId: string;
    total: number;
}
//# sourceMappingURL=finance.dto.d.ts.map