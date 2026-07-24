'use client';

import {
  IconButton,
  NumberInput,
  NumberInputField,
  NumberInputStepper,
  NumberIncrementStepper,
  NumberDecrementStepper,
  Td,
  Tr,
} from '@chakra-ui/react';
import { Trash2 } from 'lucide-react';
import type { UnitOfMeasureDTO } from '@ti-assistant/contracts';
import { SupplyItemAutocomplete } from './purchase-request/SupplyItemAutocomplete';
import { UnitOfMeasureSelect } from './purchase-request/UnitOfMeasureSelect';
import type { PurchaseRequestItemFormRow } from './purchase-request/purchaseRequestWizardTypes';

interface PurchaseRequestItemRowProps {
  row: PurchaseRequestItemFormRow;
  units: UnitOfMeasureDTO[];
  onChange: (row: PurchaseRequestItemFormRow) => void;
  onRemove: () => void;
  canRemove: boolean;
  isDisabled?: boolean;
}

export function PurchaseRequestItemRow({
  row,
  units,
  onChange,
  onRemove,
  canRemove,
  isDisabled = false,
}: PurchaseRequestItemRowProps) {
  const unitLocked = Boolean(row.supply_id);

  return (
    <Tr>
      <Td px={3} py={3}>
        <SupplyItemAutocomplete
          value={row.description}
          onChange={(description) =>
            onChange({
              ...row,
              description,
              supply_id: undefined,
              unit: row.supply_id ? '' : row.unit,
            })
          }
          onSelect={(selection) =>
            onChange({
              ...row,
              description: selection.description,
              unit: selection.unit ?? '',
              supply_id: selection.supply_id,
            })
          }
          isDisabled={isDisabled}
        />
      </Td>
      <Td px={3} py={3} w="120px">
        <NumberInput
          size="sm"
          min={1}
          step={1}
          value={row.quantity}
          isDisabled={isDisabled}
          onChange={(_, value) => onChange({ ...row, quantity: value || 1 })}
        >
          <NumberInputField />
          <NumberInputStepper>
            <NumberIncrementStepper />
            <NumberDecrementStepper />
          </NumberInputStepper>
        </NumberInput>
      </Td>
      <Td px={3} py={3} w="180px">
        <UnitOfMeasureSelect
          units={units}
          value={row.unit}
          onChange={(unit) => onChange({ ...row, unit })}
          isDisabled={isDisabled || unitLocked}
        />
      </Td>
      <Td px={3} py={3} w="60px">
        <IconButton
          aria-label="Remover item"
          icon={<Trash2 size={16} />}
          size="sm"
          variant="ghost"
          colorScheme="red"
          isDisabled={!canRemove || isDisabled}
          onClick={onRemove}
        />
      </Td>
    </Tr>
  );
}

export type { PurchaseRequestItemFormRow } from './purchase-request/purchaseRequestWizardTypes';
export { createEmptyItemRow } from './purchase-request/purchaseRequestWizardTypes';
