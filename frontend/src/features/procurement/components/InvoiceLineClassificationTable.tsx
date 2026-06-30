'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  Box,
  Badge,
  Checkbox,
  FormControl,
  FormLabel,
  Input,
  Select,
  Table,
  Tbody,
  Td,
  Text,
  Th,
  Thead,
  Tr,
  useColorModeValue,
  VStack,
} from '@chakra-ui/react';
import type { GoodsReceiptInvoiceLineDTO } from '@ti-assistant/contracts';
import { ReceiptLineDestination } from '@ti-assistant/contracts';
import type { CategoryDTO, LocationDTO, SubcategoryDTO } from '@/features/reference-data';
import { fetchSubcategoriesByCategory } from '@/features/reference-data';
import { CatalogItemAutocomplete } from './CatalogItemAutocomplete';

export interface InventoryLineFormData {
  name: string;
  model: string;
  serial_numbers: string[];
  location_id: string;
  category_id: string;
  subcategory_id: string;
}

export interface LineClassificationState {
  invoice_line_id: string;
  destination_type: 'UNCLASSIFIED' | 'SUPPLY' | 'INVENTORY';
  supply_id?: string;
  supply_label?: string;
  ai_confidence?: number;
  inventory?: InventoryLineFormData;
}

interface InvoiceLineClassificationTableProps {
  lines: GoodsReceiptInvoiceLineDTO[];
  classifications: LineClassificationState[];
  onChange: (classifications: LineClassificationState[]) => void;
  locations: LocationDTO[];
  categories: CategoryDTO[];
  disabled?: boolean;
}

function emptyInventoryForm(quantity: number): InventoryLineFormData {
  return {
    name: '',
    model: '',
    serial_numbers: Array.from({ length: Math.max(1, quantity) }, () => ''),
    location_id: '',
    category_id: '',
    subcategory_id: '',
  };
}

function initClassifications(lines: GoodsReceiptInvoiceLineDTO[]): LineClassificationState[] {
  return lines.map((line) => {
    const hasAiSuggestion =
      line.ai_suggested_supply_id &&
      (line.ai_confidence ?? 0) >= 0.75 &&
      !line.supply_id;

    const base: LineClassificationState = {
      invoice_line_id: line.id,
      destination_type:
        line.destination_type === ReceiptLineDestination.UNCLASSIFIED
          ? 'UNCLASSIFIED'
          : line.destination_type,
      supply_id: line.supply_id ?? (hasAiSuggestion ? line.ai_suggested_supply_id! : undefined),
      supply_label: line.supply_id
        ? line.description
        : hasAiSuggestion
          ? line.description
          : line.description,
      ai_confidence: hasAiSuggestion ? (line.ai_confidence ?? undefined) : undefined,
    };

    if (line.destination_type === ReceiptLineDestination.INVENTORY) {
      base.inventory = {
        ...emptyInventoryForm(line.quantity),
        name: line.description,
      };
    }

    return base;
  });
}

export function InvoiceLineClassificationTable({
  lines,
  classifications,
  onChange,
  locations,
  categories,
  disabled = false,
}: InvoiceLineClassificationTableProps) {
  const borderColor = useColorModeValue('gray.200', 'gray.600');
  const mutedColor = useColorModeValue('gray.600', 'gray.400');
  const detailBg = useColorModeValue('gray.50', 'gray.700');
  const [subcategoriesByCategory, setSubcategoriesByCategory] = useState<
    Record<string, SubcategoryDTO[]>
  >({});

  useEffect(() => {
    if (classifications.length === 0 && lines.length > 0) {
      onChange(initClassifications(lines));
    }
  }, [lines, classifications.length, onChange]);

  const classificationById = useMemo(
    () => new Map(classifications.map((c) => [c.invoice_line_id, c])),
    [classifications]
  );

  const updateLine = (lineId: string, patch: Partial<LineClassificationState>) => {
    onChange(
      classifications.map((c) => (c.invoice_line_id === lineId ? { ...c, ...patch } : c))
    );
  };

  const setDestination = (line: GoodsReceiptInvoiceLineDTO, destination: 'SUPPLY' | 'INVENTORY') => {
    const current = classificationById.get(line.id);
    const isSupply = destination === 'SUPPLY';

    updateLine(line.id, {
      destination_type: destination,
      supply_id: isSupply ? current?.supply_id : undefined,
      supply_label: isSupply ? current?.supply_label ?? line.description : undefined,
      inventory: isSupply
        ? undefined
        : current?.inventory ?? {
            ...emptyInventoryForm(line.quantity),
            name: line.description,
          },
    });
  };

  const clearDestination = (lineId: string) => {
    updateLine(lineId, {
      destination_type: 'UNCLASSIFIED',
      supply_id: undefined,
      supply_label: undefined,
      inventory: undefined,
    });
  };

  const updateInventoryField = (
    lineId: string,
    field: keyof InventoryLineFormData,
    value: string | string[]
  ) => {
    const current = classificationById.get(lineId);
    if (!current?.inventory) return;

    updateLine(lineId, {
      inventory: { ...current.inventory, [field]: value },
    });
  };

  const loadSubcategories = async (categoryId: string) => {
    if (!categoryId || subcategoriesByCategory[categoryId]) return;

    const token = localStorage.getItem('@ti-assistant:token');
    if (!token) return;

    try {
      const data = await fetchSubcategoriesByCategory(token, categoryId);
      setSubcategoriesByCategory((prev) => ({ ...prev, [categoryId]: data }));
    } catch {
      setSubcategoriesByCategory((prev) => ({ ...prev, [categoryId]: [] }));
    }
  };

  useEffect(() => {
    const categoryIds = classifications
      .filter((c) => c.destination_type === 'INVENTORY' && c.inventory?.category_id)
      .map((c) => c.inventory!.category_id);

    categoryIds.forEach((categoryId) => {
      void loadSubcategories(categoryId);
    });
  }, [classifications]);

  if (lines.length === 0) {
    return (
      <Text color={mutedColor} fontSize="sm">
        Nenhuma linha da nota fiscal disponível para classificação.
      </Text>
    );
  }

  return (
    <Box overflowX="auto" borderWidth="1px" borderColor={borderColor} borderRadius="md">
      <Table size="sm" variant="simple">
        <Thead>
          <Tr>
            <Th>#</Th>
            <Th>Descrição</Th>
            <Th isNumeric>Qtd</Th>
            <Th textAlign="center">Suprimento</Th>
            <Th textAlign="center">Inventário</Th>
          </Tr>
        </Thead>
        <Tbody>
          {lines.map((line) => {
            const state = classificationById.get(line.id);
            const isSupply = state?.destination_type === 'SUPPLY';
            const isInventory = state?.destination_type === 'INVENTORY';

            return (
              <Tr key={line.id}>
                <Td>{line.line_number}</Td>
                <Td maxW="240px">
                  <Text fontSize="sm" noOfLines={2}>
                    {line.description}
                  </Text>
                </Td>
                <Td isNumeric>{line.quantity}</Td>
                <Td textAlign="center">
                  <Checkbox
                    isChecked={isSupply}
                    isDisabled={disabled}
                    colorScheme="blue"
                    onChange={(e) => {
                      if (e.target.checked) {
                        setDestination(line, 'SUPPLY');
                      } else if (isSupply) {
                        clearDestination(line.id);
                      }
                    }}
                  />
                </Td>
                <Td textAlign="center">
                  <Checkbox
                    isChecked={isInventory}
                    isDisabled={disabled}
                    colorScheme="purple"
                    onChange={(e) => {
                      if (e.target.checked) {
                        setDestination(line, 'INVENTORY');
                      } else if (isInventory) {
                        clearDestination(line.id);
                      }
                    }}
                  />
                </Td>
              </Tr>
            );
          })}
        </Tbody>
      </Table>

      {lines.map((line) => {
        const state = classificationById.get(line.id);
        if (!state || state.destination_type === 'UNCLASSIFIED') return null;

        return (
          <Box
            key={`detail-${line.id}`}
            p={4}
            borderTopWidth="1px"
            borderColor={borderColor}
            bg={detailBg}
          >
            <Text fontSize="sm" fontWeight="semibold" mb={3}>
              Linha {line.line_number}: {line.description}
            </Text>

            {state.destination_type === 'SUPPLY' && (
              <FormControl>
                <FormLabel fontSize="sm">Suprimento</FormLabel>
                {state.ai_confidence != null && state.supply_id && (
                  <Badge colorScheme="purple" mb={2} fontSize="xs">
                    Sugestão IA ({Math.round(state.ai_confidence * 100)}%) — confirme ou altere
                  </Badge>
                )}
                <CatalogItemAutocomplete
                  value={state.supply_label ?? ''}
                  isDisabled={disabled}
                  placeholder="Buscar suprimento no catálogo"
                  onChange={(value) =>
                    updateLine(line.id, { supply_label: value, supply_id: undefined })
                  }
                  onSelect={(selection) => {
                    if (!selection.supply_id) return;
                    updateLine(line.id, {
                      supply_id: selection.supply_id,
                      supply_label: selection.description,
                    });
                  }}
                />
              </FormControl>
            )}

            {state.destination_type === 'INVENTORY' && state.inventory && (
              <VStack align="stretch" spacing={3}>
                <FormControl isRequired>
                  <FormLabel fontSize="sm">Nome</FormLabel>
                  <Input
                    size="sm"
                    value={state.inventory.name}
                    isDisabled={disabled}
                    onChange={(e) => updateInventoryField(line.id, 'name', e.target.value)}
                  />
                </FormControl>

                <FormControl isRequired>
                  <FormLabel fontSize="sm">Modelo</FormLabel>
                  <Input
                    size="sm"
                    value={state.inventory.model}
                    isDisabled={disabled}
                    onChange={(e) => updateInventoryField(line.id, 'model', e.target.value)}
                  />
                </FormControl>

                <FormControl isRequired>
                  <FormLabel fontSize="sm">
                    Número(s) de série ({line.quantity} unidade{line.quantity > 1 ? 's' : ''})
                  </FormLabel>
                  <VStack align="stretch" spacing={2}>
                    {state.inventory.serial_numbers.map((serial, index) => (
                      <Input
                        key={`${line.id}-serial-${index}`}
                        size="sm"
                        placeholder={`Série ${index + 1}`}
                        value={serial}
                        isDisabled={disabled}
                        onChange={(e) => {
                          const next = [...state.inventory!.serial_numbers];
                          next[index] = e.target.value;
                          updateInventoryField(line.id, 'serial_numbers', next);
                        }}
                      />
                    ))}
                  </VStack>
                </FormControl>

                <FormControl isRequired>
                  <FormLabel fontSize="sm">Localização</FormLabel>
                  <Select
                    size="sm"
                    placeholder="Selecione"
                    value={state.inventory.location_id}
                    isDisabled={disabled}
                    onChange={(e) => updateInventoryField(line.id, 'location_id', e.target.value)}
                  >
                    {locations.map((loc) => (
                      <option key={loc.id} value={loc.id}>
                        {loc.name}
                      </option>
                    ))}
                  </Select>
                </FormControl>

                <FormControl isRequired>
                  <FormLabel fontSize="sm">Categoria</FormLabel>
                  <Select
                    size="sm"
                    placeholder="Selecione"
                    value={state.inventory.category_id}
                    isDisabled={disabled}
                    onChange={(e) => {
                      const categoryId = e.target.value;
                      updateLine(line.id, {
                        inventory: {
                          ...state.inventory!,
                          category_id: categoryId,
                          subcategory_id: '',
                        },
                      });
                      if (categoryId) void loadSubcategories(categoryId);
                    }}
                  >
                    {categories.map((cat) => (
                      <option key={cat.id} value={cat.id}>
                        {cat.label}
                      </option>
                    ))}
                  </Select>
                </FormControl>

                <FormControl isRequired>
                  <FormLabel fontSize="sm">Subcategoria</FormLabel>
                  <Select
                    size="sm"
                    placeholder="Selecione"
                    value={state.inventory.subcategory_id}
                    isDisabled={disabled || !state.inventory.category_id}
                    onChange={(e) =>
                      updateInventoryField(line.id, 'subcategory_id', e.target.value)
                    }
                  >
                    {(subcategoriesByCategory[state.inventory.category_id] ?? []).map((sub) => (
                      <option key={sub.id} value={sub.id}>
                        {sub.label}
                      </option>
                    ))}
                  </Select>
                </FormControl>
              </VStack>
            )}
          </Box>
        );
      })}
    </Box>
  );
}

export function buildClassificationsFromReceipt(
  lines: GoodsReceiptInvoiceLineDTO[]
): LineClassificationState[] {
  return initClassifications(lines);
}

export function isClassificationComplete(classifications: LineClassificationState[]): boolean {
  return classifications.every((c) => {
    if (c.destination_type === 'UNCLASSIFIED') return false;
    if (c.destination_type === 'SUPPLY') return !!c.supply_id?.trim();
    if (c.destination_type === 'INVENTORY' && c.inventory) {
      const inv = c.inventory;
      return (
        inv.name.trim() !== '' &&
        inv.model.trim() !== '' &&
        inv.location_id !== '' &&
        inv.category_id !== '' &&
        inv.subcategory_id !== '' &&
        inv.serial_numbers.every((s) => s.trim() !== '')
      );
    }
    return false;
  });
}
