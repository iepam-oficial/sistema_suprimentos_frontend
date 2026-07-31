export { fetchManagerOpsDashboard } from './api';

export {
  useManagerOpsDashboard,
  MANAGER_OPS_POLL_INTERVAL_MS,
} from './hooks/useManagerOpsDashboard';
export type { UseManagerOpsDashboardResult } from './hooks/useManagerOpsDashboard';

export { ManagerOpsKpiCards } from './components/ManagerOpsKpiCards';
export { ManagerOpsInbox } from './components/ManagerOpsInbox';
export { ManagerOpsAlertsPanel } from './components/ManagerOpsAlertsPanel';
