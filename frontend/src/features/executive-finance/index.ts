export { fetchExecutiveFinanceDashboard } from './api';

export {
  useExecutiveFinanceDashboard,
  EXECUTIVE_FINANCE_POLL_INTERVAL_MS,
} from './hooks/useExecutiveFinanceDashboard';
export type { UseExecutiveFinanceDashboardResult } from './hooks/useExecutiveFinanceDashboard';

export { useExecutiveDrilldown } from './hooks/useExecutiveDrilldown';
export type {
  DrilldownChip,
  DrilldownDimension,
  UseExecutiveDrilldownResult,
} from './hooks/useExecutiveDrilldown';

export {
  ExecutiveFinanceFilters,
  getDefaultExecutiveFinanceFilters,
} from './components/ExecutiveFinanceFilters';
export { ExecutiveKpiCards } from './components/ExecutiveKpiCards';
export { FinancialEvolutionChart } from './components/FinancialEvolutionChart';
export { PoloComparisonChart } from './components/PoloComparisonChart';
export { NamedValueBarChart } from './components/NamedValueBarChart';
export { ExpensesByCategoryChart } from './components/ExpensesByCategoryChart';
export { SavingsBreakdownChart } from './components/SavingsBreakdownChart';
export { SavingsEvolutionChart } from './components/SavingsEvolutionChart';
export { PatrimonyByCategoryChart } from './components/PatrimonyByCategoryChart';
export { TopSuppliersTable } from './components/TopSuppliersTable';
export { PoloRankingTable } from './components/PoloRankingTable';
export { ExecutiveFinanceAlertsPanel } from './components/ExecutiveFinanceAlertsPanel';
export { DrilldownBreadcrumb } from './components/DrilldownBreadcrumb';
