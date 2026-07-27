'use client';

import {
  Box,
  Button,
  Card,
  CardBody,
  FormControl,
  FormLabel,
  HStack,
  IconButton,
  NumberInput,
  NumberInputField,
  NumberInputStepper,
  NumberIncrementStepper,
  NumberDecrementStepper,
  Text,
  VStack,
} from '@chakra-ui/react';
import { Plus, Trash2 } from 'lucide-react';
import type { UnitOfMeasureDTO } from '@ti-assistant/contracts';
import { SupplyItemAutocomplete } from './SupplyItemAutocomplete';
import { UnitOfMeasureSelect } from './UnitOfMeasureSelect';
import {
  createEmptyItemRow,
  type PurchaseRequestItemFormRow,
} from './purchaseRequestWizardTypes';

interface PurchaseRequestItemsCardsProps {
  items: PurchaseRequestItemFormRow[];
  units: UnitOfMeasureDTO[];
  onChange: (items: PurchaseRequestItemFormRow[]) => void;
  isDisabled?: boolean;
}

export function PurchaseRequestItemsCards({
  items,
  units,
  onChange,
  isDisabled = false,
}: PurchaseRequestItemsCardsProps) {
  const updateItem = (index: number, row: PurchaseRequestItemFormRow) => {
    onChange(items.map((item, i) => (i === index ? row : item)));
  };

  const removeItem = (index: number) => {
    onChange(items.filter((_, i) => i !== index));
  };

  return (
    <VStack align="stretch" spacing={3}>
      {items.map((row, index) => (
        <Card key={row.key} size="sm" variant="outline">
          <CardBody>
            <HStack justify="space-between" mb={3}>
              <Text fontSize="sm" fontWeight="medium">
                Item {index + 1}
              </Text>
              <IconButton
                aria-label="Remover item"
                icon={<Trash2 size={16} />}
                size="sm"
                variant="ghost"
                colorScheme="red"
                isDisabled={items.length <= 1 || isDisabled}
                onClick={() => removeItem(index)}
              />
            </HStack>
            <VStack align="stretch" spacing={3}>
              <FormControl isRequired>
                <FormLabel fontSize="sm">Descrição</FormLabel>
                <SupplyItemAutocomplete
                  value={row.description}
                  onChange={(description) =>
                    updateItem(index, {
                      ...row,
                      description,
                      supply_id: undefined,
                      unit: row.supply_id ? row.unit : '',
                    })
                  }
                  onSelect={(selection) =>
                    updateItem(index, {
                      ...row,
                      description: selection.description,
                      unit: selection.unit ?? '',
                      supply_id: selection.supply_id,
                    })
                  }
                  isDisabled={isDisabled}
                />
              </FormControl>
              <FormControl isRequired>
                <FormLabel fontSize="sm">Quantidade</FormLabel>
                <NumberInput
                  size="sm"
                  min={1}
                  value={row.quantity}
                  isDisabled={isDisabled}
                  onChange={(_, value) => updateItem(index, { ...row, quantity: value || 1 })}
                >
                  <NumberInputField />
                  <NumberInputStepper>
                    <NumberIncrementStepper />
                    <NumberDecrementStepper />
                  </NumberInputStepper>
                </NumberInput>
              </FormControl>
              <FormControl isRequired>
                <FormLabel fontSize="sm">Unidade</FormLabel>
                <UnitOfMeasureSelect
                  units={units}
                  value={row.unit}
                  onChange={(unit) => updateItem(index, { ...row, unit })}
                  isDisabled={isDisabled || Boolean(row.supply_id)}
                />
              </FormControl>
            </VStack>
          </CardBody>
        </Card>
      ))}
      {!isDisabled && (
        <Button
          size="sm"
          leftIcon={<Plus size={16} />}
          variant="outline"
          onClick={() => onChange([...items, createEmptyItemRow()])}
        >
          Adicionar item
        </Button>
      )}
    </VStack>
  );
}
