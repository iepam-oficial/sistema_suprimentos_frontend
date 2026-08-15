export type AbcClass = 'A' | 'B' | 'C';

export type AbcClassificationRunStatus = 'SUCCESS' | 'FAILED' | 'RUNNING';

export interface AbcClassificationConfigDTO {
  cutoff_a: number;
  cutoff_b: number;
  analysis_period_months: number;
  criterion: 'CONSUMPTION_VALUE';
  active: boolean;
  attention_factor_a: number;
  attention_factor_b: number;
  attention_enabled_c: boolean;
  last_run_at: string | null;
  last_classified_at: string | null;
  last_run_status: AbcClassificationRunStatus | null;
}

export interface AbcClassificationSummaryDTO {
  analysis_period_months: number;
  classified_at: string | null;
  by_class: {
    A: { count: number; period_value: number };
    B: { count: number; period_value: number };
    C: { count: number; period_value: number };
    UNCLASSIFIED: { count: number; period_value: number };
  };
}

export interface AbcClassificationConfigUpdateDTO {
  cutoff_a?: number;
  cutoff_b?: number;
  analysis_period_months?: number;
  active?: boolean;
  attention_factor_a?: number;
  attention_factor_b?: number;
  attention_enabled_c?: boolean;
}
