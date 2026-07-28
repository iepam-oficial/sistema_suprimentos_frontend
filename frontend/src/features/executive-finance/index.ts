export { fetchExecutiveFinanceDashboard } from './api';

export {
  useExecutiveFinanceDashboard,
  EXECUTIVE_FINANCE_POLL_INTERVAL_MS,
} from './hooks/useExecutiveFinanceDashboard';
export type { UseExecutiveFinanceDashboardResult } from './hooks/useExecutiveFinanceDashboard';

export {
  ExecutiveFinanceFilters,
  getDefaultExecutiveFinanceFilters,
} from './components/ExecutiveFinanceFilters';
export { ExecutiveKpiCards } from './components/ExecutiveKpiCards';
export { FinancialEvolutionChart } from './components/FinancialEvolutionChart';
export { PoloComparisonChart } from './components/PoloComparisonChart';
