import type { StockMovementDTO, SupplyTransactionDTO } from '@ti-assistant/contracts';

export type {
  CategoryRefDTO,
  CreateDeliveryTransactionInput,
  CreateSupplyBatchInput,
  CreateSupplyInput,
  MovementType,
  StockMovementDTO,
  SubcategoryRefDTO,
  SupplierDTO,
  SupplierRefDTO,
  SupplyBatchDTO,
  SupplyDTO,
  SupplyMovementType,
  SupplyTransactionDTO,
  SupplyTransactionType,
  UnitRefDTO,
} from '@ti-assistant/contracts';

export type { SupplyDTO as Supply } from '@ti-assistant/contracts';

/** Movimentação de estoque (modelo movement-based) */
export type StockMovement = StockMovementDTO;

/** Transação legada com relações expandidas usadas na UI admin (será migrada para StockMovement) */
export type SupplyTransaction = Omit<
  SupplyTransactionDTO,
  'supply' | 'from_user' | 'to_user' | 'sector'
> & {
  supply: {
    id: string;
    name: string;
    description?: string | null;
    available_quantity: number;
    unit_price?: number | null;
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
      branch: string;
    };
  } | null;
};
