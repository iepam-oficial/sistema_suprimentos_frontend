import type { ChartOfAccountDTO } from './finance.dto';

export const DepreciationMethod = {
  LINEAR: 'LINEAR',
} as const;

export type DepreciationMethod =
  (typeof DepreciationMethod)[keyof typeof DepreciationMethod];

export interface DepreciationRateDTO {
  id: string;
  ncm: string;
  cest?: string | null;
  chart_of_account_id: string;
  chart_of_account?: Pick<ChartOfAccountDTO, 'codigo' | 'nome'> | null;
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
  ncm: string;
  cest?: string;
  chart_of_account_id: string;
  service_life_years: number;
  annual_rate: number;
  priority?: number;
  effective_from: string;
  effective_to?: string;
  active?: boolean;
}

export interface UpdateDepreciationRateInput {
  ncm?: string;
  cest?: string | null;
  chart_of_account_id?: string;
  service_life_years?: number;
  annual_rate?: number;
  priority?: number;
  effective_from?: string;
  effective_to?: string | null;
  active?: boolean;
}
