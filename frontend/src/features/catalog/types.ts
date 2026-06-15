import type { SupplyTransactionDTO } from '@ti-assistant/contracts';

export type {
  CategoryRefDTO,
  CreateDeliveryTransactionInput,
  MovementType,
  SubcategoryRefDTO,
  SupplierDTO,
  SupplierRefDTO,
  SupplyBatchDTO,
  SupplyDTO,
  SupplyTransactionDTO,
  SupplyTransactionType,
  UnitRefDTO,
} from '@ti-assistant/contracts';

export type { SupplyDTO as Supply } from '@ti-assistant/contracts';

/** Transação de suprimento com relações expandidas usadas na UI admin */
export type SupplyTransaction = Omit<SupplyTransactionDTO, 'supply'> & {
  supply: {
    id: string;
    name: string;
    description?: string;
    quantity: number;
    unit: {
      id: string;
      name: string;
      symbol: string;
    };
  };
  from_user: {
    id: string;
    name: string;
    email: string;
    role: string;
  };
  to_user: {
    id: string;
    name: string;
    email: string;
    role: string;
  };
  sector?: {
    id: string;
    name: string;
    location: {
      id: string;
      name: string;
    };
  };
};
