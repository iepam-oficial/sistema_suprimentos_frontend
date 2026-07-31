export { fetchManagerOpsDashboard } from './api';

export {
  useManagerOpsDashboard,
  MANAGER_OPS_POLL_INTERVAL_MS,
} from './hooks/useManagerOpsDashboard';
export type { UseManagerOpsDashboardResult } from './hooks/useManagerOpsDashboard';

export { ManagerOpsKpiCards } from './components/ManagerOpsKpiCards';
export { ManagerOpsInbox } from './components/ManagerOpsInbox';
export { ManagerOpsAlertsPanel } from './components/ManagerOpsAlertsPanel';
export { ManagerOpsConsumptionChart } from './components/ManagerOpsConsumptionChart';
export { ManagerOpsTopConsumed } from './components/ManagerOpsTopConsumed';
export { ManagerOpsSpendChart } from './components/ManagerOpsSpendChart';
export { ManagerOpsSuppliersTable } from './components/ManagerOpsSuppliersTable';
export { ManagerOpsKanban } from './components/ManagerOpsKanban';
export { ManagerOpsStockHealth } from './components/ManagerOpsStockHealth';
export { ManagerOpsCalendar } from './components/ManagerOpsCalendar';
