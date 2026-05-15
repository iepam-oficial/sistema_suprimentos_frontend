'use client';

import {
  Button,
  FormControl,
  FormLabel,
  HStack,
  Select,
  SimpleGrid,
  Tag,
  TagLabel,
  useColorMode,
  VStack,
  Wrap,
  WrapItem,
} from '@chakra-ui/react';
import { FilterOptions } from '@/lib/reports/types';

export interface ReportFiltersState {
  timeRange: string;
  locationId: string;
  sectorId: string;
  supplierId: string;
}

const TIME_LABELS: Record<string, string> = {
  '7': '7 dias',
  '30': '30 dias',
  '90': '90 dias',
  '365': '1 ano',
  '0': 'Todo período',
};

const EMPTY_FILTERS: ReportFiltersState = {
  timeRange: '30',
  locationId: '',
  sectorId: '',
  supplierId: '',
};

interface ReportFiltersProps {
  filters: ReportFiltersState;
  filterOptions: FilterOptions | null;
  onChange: (filters: ReportFiltersState) => void;
}

export function getActiveFilterChips(
  filters: ReportFiltersState,
  filterOptions: FilterOptions | null
): { key: string; label: string }[] {
  const chips: { key: string; label: string }[] = [];
  chips.push({
    key: 'timeRange',
    label: TIME_LABELS[filters.timeRange] ?? `${filters.timeRange} dias`,
  });
  if (filters.locationId) {
    const loc = filterOptions?.locations.find((l) => l.id === filters.locationId);
    chips.push({ key: 'locationId', label: loc?.name ?? 'Local' });
  }
  if (filters.sectorId) {
    const sec = filterOptions?.sectors.find((s) => s.id === filters.sectorId);
    chips.push({ key: 'sectorId', label: sec?.name ?? 'Setor' });
  }
  if (filters.supplierId) {
    const sup = filterOptions?.suppliers.find((s) => s.id === filters.supplierId);
    chips.push({ key: 'supplierId', label: sup?.name ?? 'Fornecedor' });
  }
  return chips;
}

export function hasNonDefaultFilters(filters: ReportFiltersState): boolean {
  return (
    filters.timeRange !== '30' ||
    !!filters.locationId ||
    !!filters.sectorId ||
    !!filters.supplierId
  );
}

export function ReportFiltersBar({ filters, filterOptions, onChange }: ReportFiltersProps) {
  const { colorMode } = useColorMode();
  const selectProps = {
    size: 'sm' as const,
    bg: colorMode === 'dark' ? 'rgba(45, 55, 72, 0.5)' : 'rgba(255, 255, 255, 0.5)',
  };

  const sectorsForLocation =
    filterOptions?.sectors.filter(
      (s) => !filters.locationId || s.location_id === filters.locationId
    ) ?? [];

  const chips = getActiveFilterChips(filters, filterOptions);
  const showClear = hasNonDefaultFilters(filters);

  return (
    <VStack align="stretch" spacing={3} w="full">
      <SimpleGrid columns={{ base: 1, md: 2, lg: 4 }} spacing={3} w="full">
        <FormControl>
          <FormLabel fontSize="xs" mb={1}>Período</FormLabel>
          <Select
            {...selectProps}
            value={filters.timeRange}
            onChange={(e) => onChange({ ...filters, timeRange: e.target.value })}
          >
            <option value="7">Últimos 7 dias</option>
            <option value="30">Últimos 30 dias</option>
            <option value="90">Últimos 90 dias</option>
            <option value="365">Último ano</option>
            <option value="0">Todos</option>
          </Select>
        </FormControl>
        <FormControl>
          <FormLabel fontSize="xs" mb={1}>Local</FormLabel>
          <Select
            {...selectProps}
            value={filters.locationId}
            onChange={(e) =>
              onChange({ ...filters, locationId: e.target.value, sectorId: '' })
            }
          >
            <option value="">Todos</option>
            {filterOptions?.locations.map((l) => (
              <option key={l.id} value={l.id}>{l.name}</option>
            ))}
          </Select>
        </FormControl>
        <FormControl>
          <FormLabel fontSize="xs" mb={1}>Setor</FormLabel>
          <Select
            {...selectProps}
            value={filters.sectorId}
            onChange={(e) => onChange({ ...filters, sectorId: e.target.value })}
          >
            <option value="">Todos</option>
            {sectorsForLocation.map((s) => (
              <option key={s.id} value={s.id}>{s.name}</option>
            ))}
          </Select>
        </FormControl>
        <FormControl>
          <FormLabel fontSize="xs" mb={1}>Fornecedor</FormLabel>
          <Select
            {...selectProps}
            value={filters.supplierId}
            onChange={(e) => onChange({ ...filters, supplierId: e.target.value })}
          >
            <option value="">Todos</option>
            {filterOptions?.suppliers.map((s) => (
              <option key={s.id} value={s.id}>{s.name}</option>
            ))}
          </Select>
        </FormControl>
      </SimpleGrid>

      <HStack justify="space-between" flexWrap="wrap" gap={2}>
        <Wrap spacing={2}>
          {chips.map((chip) => (
            <WrapItem key={chip.key}>
              <Tag size="sm" colorScheme="blue" variant="subtle">
                <TagLabel>{chip.label}</TagLabel>
              </Tag>
            </WrapItem>
          ))}
        </Wrap>
        {showClear && (
          <Button
            size="xs"
            variant="ghost"
            colorScheme="gray"
            onClick={() => onChange(EMPTY_FILTERS)}
          >
            Limpar filtros
          </Button>
        )}
      </HStack>
    </VStack>
  );
}

export function buildReportsQuery(
  report: string,
  filters: ReportFiltersState
): string {
  const params = new URLSearchParams({ report, timeRange: filters.timeRange });
  if (filters.locationId) params.set('locationId', filters.locationId);
  if (filters.sectorId) params.set('sectorId', filters.sectorId);
  if (filters.supplierId) params.set('supplierId', filters.supplierId);
  return params.toString();
}
