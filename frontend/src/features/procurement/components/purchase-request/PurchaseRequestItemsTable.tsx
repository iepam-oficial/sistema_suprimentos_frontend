'use client';

import {
  Box,
  Button,
  Table,
  Tbody,
  Th,
  Thead,
  Tr,
  useColorModeValue,
} from '@chakra-ui/react';
import { Plus } from 'lucide-react';
import type { UnitOfMeasureDTO } from '@ti-assistant/contracts';
import { PurchaseRequestItemRow } from '../PurchaseRequestItemRow';
import {
  createEmptyItemRow,
  type PurchaseRequestItemFormRow,
} from './purchaseRequestWizardTypes';

interface PurchaseRequestItemsTableProps {
  items: PurchaseRequestItemFormRow[];
  units: UnitOfMeasureDTO[];
  onChange: (items: PurchaseRequestItemFormRow[]) => void;
  isDisabled?: boolean;
}

export function PurchaseRequestItemsTable({
  items,
  units,
  onChange,
  isDisabled = false,
}: PurchaseRequestItemsTableProps) {
  const borderColor = useColorModeValue('gray.200', 'gray.600');
  const headerBg = useColorModeValue('gray.50', 'gray.700');

  const updateItem = (index: number, row: PurchaseRequestItemFormRow) => {
    onChange(items.map((item, i) => (i === index ? row : item)));
  };

  const removeItem = (index: number) => {
    onChange(items.filter((_, i) => i !== index));
  };

  return (
    <Box>
      <Box overflowX="auto" borderWidth="1px" borderColor={borderColor} borderRadius="md">
        <Table size="sm" variant="striped">
          <Thead bg={headerBg}>
            <Tr>
              <Th>Descrição</Th>
              <Th w="120px">Quantidade</Th>
              <Th w="180px">Unidade</Th>
              <Th w="60px" />
            </Tr>
          </Thead>
          <Tbody>
            {items.map((row, index) => (
              <PurchaseRequestItemRow
                key={row.key}
                row={row}
                units={units}
                onChange={(updated) => updateItem(index, updated)}
                onRemove={() => removeItem(index)}
                canRemove={items.length > 1}
                isDisabled={isDisabled}
              />
            ))}
          </Tbody>
        </Table>
      </Box>
      {!isDisabled && (
        <Button
          size="sm"
          mt={3}
          leftIcon={<Plus size={16} />}
          variant="outline"
          onClick={() => onChange([...items, createEmptyItemRow()])}
        >
          Adicionar item
        </Button>
      )}
    </Box>
  );
}
