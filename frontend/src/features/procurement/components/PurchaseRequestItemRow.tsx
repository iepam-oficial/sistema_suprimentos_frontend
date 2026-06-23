'use client';

import {
  IconButton,
  Input,
  NumberInput,
  NumberInputField,
  NumberInputStepper,
  NumberIncrementStepper,
  NumberDecrementStepper,
  Td,
  Tr,
} from '@chakra-ui/react';
import { Trash2 } from 'lucide-react';
import { CatalogItemAutocomplete, type CatalogSelection } from './CatalogItemAutocomplete';

export interface PurchaseRequestItemFormRow {
  key: string;
  description: string;
  quantity: number;
  unit: string;
  supply_id?: string;
  inventory_id?: string;
}

interface PurchaseRequestItemRowProps {
  row: PurchaseRequestItemFormRow;
  onChange: (row: PurchaseRequestItemFormRow) => void;
  onRemove: () => void;
  canRemove: boolean;
  isDisabled?: boolean;
}

export function PurchaseRequestItemRow({
  row,
  onChange,
  onRemove,
  canRemove,
  isDisabled = false,
}: PurchaseRequestItemRowProps) {
  const handleCatalogSelect = (selection: CatalogSelection) => {
    onChange({
      ...row,
      description: selection.description,
      unit: selection.unit ?? row.unit,
      supply_id: selection.supply_id,
      inventory_id: selection.inventory_id,
    });
  };

  return (
    <Tr>
      <Td px={2} py={2}>
        <CatalogItemAutocomplete
          value={row.description}
          onChange={(description) =>
            onChange({
              ...row,
              description,
              supply_id: undefined,
              inventory_id: undefined,
            })
          }
          onSelect={handleCatalogSelect}
          isDisabled={isDisabled}
        />
      </Td>
      <Td px={2} py={2} w="120px">
        <NumberInput
          size="sm"
          min={0.01}
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
      <Td px={2} py={2} w="120px">
        <Input
          size="sm"
          value={row.unit}
          placeholder="Unidade"
          isDisabled={isDisabled}
          onChange={(e) => onChange({ ...row, unit: e.target.value })}
        />
      </Td>
      <Td px={2} py={2} w="60px">
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

export function createEmptyItemRow(): PurchaseRequestItemFormRow {
  return {
    key: crypto.randomUUID(),
    description: '',
    quantity: 1,
    unit: '',
  };
}
