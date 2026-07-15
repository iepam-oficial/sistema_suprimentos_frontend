export const DangerLevel = {
  LOW: 'LOW',
  MEDIUM: 'MEDIUM',
  HIGH: 'HIGH',
} as const;

export type DangerLevel = (typeof DangerLevel)[keyof typeof DangerLevel];

export interface AlertInventoryRefDTO {
  id: string;
  name: string;
}

export interface AlertDTO {
  id: string;
  about: string;
  danger_level: DangerLevel;
  description: string;
  created_at: string;
  inventory_id?: string | null;
  inventory?: AlertInventoryRefDTO | null;
}

export interface CreateAlertInput {
  about: string;
  danger_level: DangerLevel;
  inventory_id?: string;
  description: string;
}

export interface UpdateAlertInput {
  about?: string;
  danger_level?: DangerLevel;
  description?: string;
}
