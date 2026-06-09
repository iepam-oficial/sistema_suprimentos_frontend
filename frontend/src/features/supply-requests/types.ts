import type { SupplyRequestDTO } from '@ti-assistant/contracts';

export type {
  SupplySummaryDTO,
  SupplyUnitDTO,
  UserDTO,
} from '@ti-assistant/contracts';

export { SupplyRequestStatus } from '@ti-assistant/contracts';

/** Requisição com campos extras usados na UI admin */
export type SupplyRequest = SupplyRequestDTO & {
  requester_delivery_confirmation?: boolean;
  updated_at?: string;
  location?: { name: string };
  sector?: { name: string };
  locale?: { name: string };
};
