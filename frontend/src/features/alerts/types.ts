export type {
  AlertDTO,
  AlertInventoryRefDTO,
  CreateAlertInput,
  UpdateAlertInput,
} from '@ti-assistant/contracts';

export { DangerLevel } from '@ti-assistant/contracts';
export type { DangerLevel as DangerLevelType } from '@ti-assistant/contracts';

export type Alert = import('@ti-assistant/contracts').AlertDTO;
