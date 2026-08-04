export const PoloMetric = {
  DESPESAS: 'DESPESAS',
  COMPRAS: 'COMPRAS',
  ECONOMIA: 'ECONOMIA',
  PATRIMONIO: 'PATRIMONIO',
} as const;

export type PoloMetric = (typeof PoloMetric)[keyof typeof PoloMetric];

export const MoneyTrendDirection = {
  UP: 'UP',
  DOWN: 'DOWN',
  FLAT: 'FLAT',
} as const;

export type MoneyTrendDirection =
  (typeof MoneyTrendDirection)[keyof typeof MoneyTrendDirection];

export const ExecutiveFinanceAlertSeverity = {
  LOW: 'LOW',
  MEDIUM: 'MEDIUM',
  HIGH: 'HIGH',
} as const;

export type ExecutiveFinanceAlertSeverity =
  (typeof ExecutiveFinanceAlertSeverity)[keyof typeof ExecutiveFinanceAlertSeverity];

export interface ExecutiveFinanceFilters {
  from?: string;
  to?: string;
  locationId?: string;
  companyLocationId?: string;
  chartOfAccountId?: string;
  categoryId?: string;
  sectorId?: string;
  supplierId?: string;
  poloMetric?: PoloMetric;
}

export interface MoneyTrendDTO {
  value: number;
  previousValue: number;
  deltaAbs: number;
  deltaPct: number;
  trend: MoneyTrendDirection;
}

export interface ExecutiveFinanceKpisDTO {
  totalExpenses: MoneyTrendDTO;
  purchases: { count: number; value: number; growthPct: number };
  savings: { value: number; reductionPct: number };
  patrimonyAcquired: number;
  extraExpenses: number;
  averageTicket: number;
  pendingPurchases: { count: number; value: number };
}

export interface SeriesPointDTO {
  period: string;
  value: number;
}

export interface NamedValueDTO {
  id: string | null;
  label: string;
  value: number;
  secondaryValue?: number;
}

export interface ExecutiveFinanceAlertDTO {
  code: string;
  severity: ExecutiveFinanceAlertSeverity;
  title: string;
  description: string;
  href?: string;
  count?: number;
}

export interface PoloRankingRowDTO {
  locationId: string | null;
  polo: string;
  expenses: number;
  purchasesValue: number;
  purchasesCount: number;
  savings: number;
  patrimony: number;
  averageTicket: number;
  score: number;
}

export interface SavingsBreakdownRowDTO {
  period: string;
  requested: number;
  contracted: number;
  savings: number;
}

export interface ExecutiveFinanceTopSupplierDTO {
  supplierId: string;
  name: string;
  purchasesCount: number;
  totalValue: number;
  savings: number;
}

export interface ExecutiveFinanceDashboardMetaDTO {
  economyProxy: 'MAX_REVIEW_OK_PROPOSAL_MINUS_WINNER';
  completedPurchaseDefinition: 'GOODS_RECEIPT_APPROVED';
  generatedAt: string;
}

export interface ExecutiveFinanceDashboardDTO {
  period: { from: string; to: string; previousFrom: string; previousTo: string };
  filtersApplied: ExecutiveFinanceFilters;
  kpis: ExecutiveFinanceKpisDTO;
  financialEvolution: SeriesPointDTO[];
  poloComparison: NamedValueDTO[];
  purchasesBySector: NamedValueDTO[];
  expensesByCategory: NamedValueDTO[];
  savingsBreakdown: SavingsBreakdownRowDTO[];
  savingsEvolution: SeriesPointDTO[];
  patrimonyByPolo: NamedValueDTO[];
  patrimonyByCategory: NamedValueDTO[];
  stockFinancial: NamedValueDTO[];
  topSuppliers: ExecutiveFinanceTopSupplierDTO[];
  poloRanking: PoloRankingRowDTO[];
  alerts: ExecutiveFinanceAlertDTO[];
  meta: ExecutiveFinanceDashboardMetaDTO;
}
