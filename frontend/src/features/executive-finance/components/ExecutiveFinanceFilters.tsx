'use client';

import { useEffect, useState } from 'react';
import {
  Box,
  Button,
  FormControl,
  FormLabel,
  HStack,
  Select,
  SimpleGrid,
  Input,
  useColorModeValue,
} from '@chakra-ui/react';
import { RotateCcw } from 'lucide-react';
import type { ExecutiveFinanceFilters as ExecutiveFinanceFiltersState } from '@ti-assistant/contracts';
import { useAuthSession } from '@/features/identity';
import { fetchLocations } from '@/features/reference-data/api/locationApi';
import { fetchCategories } from '@/features/reference-data/api/categoryApi';
import { fetchSectors } from '@/features/reference-data/api/sectorApi';
import { fetchSuppliers } from '@/features/catalog/api/catalogApi';
import { fetchChartOfAccounts } from '@/features/financeiro/api/chartOfAccountApi';
import type { LocationDTO, CategoryDTO, SectorDTO } from '@/features/reference-data/types';
import type { SupplierDTO } from '@/features/catalog/types';
import type { ChartOfAccountDTO } from '@/features/financeiro/types';

export function getDefaultExecutiveFinanceFilters(): ExecutiveFinanceFiltersState {
  const to = new Date();
  const from = new Date(to);
  from.setDate(from.getDate() - 29);
  return { from: toIsoDate(from), to: toIsoDate(to) };
}

function toIsoDate(date: Date): string {
  return date.toISOString().slice(0, 10);
}

function locationLabel(location: LocationDTO): string {
  const branch = location.branch?.trim();
  const name = location.name?.trim();
  if (name && branch && name !== branch) return `${name} (${branch})`;
  return name || branch || location.id;
}

interface FilterOptionsState {
  locations: LocationDTO[];
  categories: CategoryDTO[];
  sectors: SectorDTO[];
  suppliers: SupplierDTO[];
  chartOfAccounts: ChartOfAccountDTO[];
}

const EMPTY_OPTIONS: FilterOptionsState = {
  locations: [],
  categories: [],
  sectors: [],
  suppliers: [],
  chartOfAccounts: [],
};

interface ExecutiveFinanceFiltersProps {
  filters: ExecutiveFinanceFiltersState;
  onChange: (filters: ExecutiveFinanceFiltersState) => void;
}

export function ExecutiveFinanceFilters({ filters, onChange }: ExecutiveFinanceFiltersProps) {
  const { token } = useAuthSession();
  const [options, setOptions] = useState<FilterOptionsState>(EMPTY_OPTIONS);

  const borderColor = useColorModeValue('gray.200', 'gray.700');
  const labelColor = useColorModeValue('gray.500', 'gray.400');
  const selectProps = {
    size: 'sm' as const,
    bg: useColorModeValue('white', 'gray.800'),
  };

  useEffect(() => {
    if (!token) return;
    let cancelled = false;

    async function loadOptions() {
      const settled = await Promise.allSettled([
        fetchLocations(token as string),
        fetchCategories(token as string),
        fetchSectors(token as string),
        fetchSuppliers(token as string),
        fetchChartOfAccounts(),
      ]);

      const [locations, categories, sectors, suppliers, chartOfAccounts] = settled.map(
        (result, index) => {
          if (result.status === 'fulfilled') return result.value;
          console.error(
            `[ExecutiveFinanceFilters] falha ao carregar opção #${index}`,
            result.reason
          );
          return [];
        }
      );

      if (!cancelled) {
        setOptions({
          locations: locations as LocationDTO[],
          categories: categories as CategoryDTO[],
          sectors: sectors as SectorDTO[],
          suppliers: suppliers as SupplierDTO[],
          chartOfAccounts: chartOfAccounts as ChartOfAccountDTO[],
        });
      }
    }

    void loadOptions();
    return () => {
      cancelled = true;
    };
  }, [token]);

  const defaults = getDefaultExecutiveFinanceFilters();
  const isDefault =
    filters.from === defaults.from &&
    filters.to === defaults.to &&
    !filters.locationId &&
    !filters.chartOfAccountId &&
    !filters.categoryId &&
    !filters.sectorId &&
    !filters.supplierId;

  const set = (patch: Partial<ExecutiveFinanceFiltersState>) => onChange({ ...filters, ...patch });

  return (
    <Box
      p={3}
      borderWidth="1px"
      borderColor={borderColor}
      borderRadius="md"
      bg={useColorModeValue('gray.50', 'gray.900')}
    >
      <SimpleGrid columns={{ base: 2, sm: 3, md: 4, lg: 8 }} spacing={2} alignItems="end">
        <FormControl>
          <FormLabel fontSize="xs" color={labelColor} mb={1}>
            De
          </FormLabel>
          <Input
            {...selectProps}
            type="date"
            value={filters.from ?? ''}
            max={filters.to}
            onChange={(e) => set({ from: e.target.value || undefined })}
          />
        </FormControl>

        <FormControl>
          <FormLabel fontSize="xs" color={labelColor} mb={1}>
            Até
          </FormLabel>
          <Input
            {...selectProps}
            type="date"
            value={filters.to ?? ''}
            min={filters.from}
            onChange={(e) => set({ to: e.target.value || undefined })}
          />
        </FormControl>

        <FormControl>
          <FormLabel fontSize="xs" color={labelColor} mb={1}>
            Polo
          </FormLabel>
          <Select
            {...selectProps}
            value={filters.locationId ?? ''}
            onChange={(e) => set({ locationId: e.target.value || undefined })}
          >
            <option value="">Todos</option>
            {options.locations.map((location) => (
              <option key={location.id} value={location.id}>
                {locationLabel(location)}
              </option>
            ))}
          </Select>
        </FormControl>

        <FormControl>
          <FormLabel fontSize="xs" color={labelColor} mb={1}>
            Conta Financeira
          </FormLabel>
          <Select
            {...selectProps}
            value={filters.chartOfAccountId ?? ''}
            onChange={(e) => set({ chartOfAccountId: e.target.value || undefined })}
          >
            <option value="">Todas</option>
            {options.chartOfAccounts.map((account) => (
              <option key={account.id} value={account.id}>
                {account.codigo} · {account.nome}
              </option>
            ))}
          </Select>
        </FormControl>

        <FormControl>
          <FormLabel fontSize="xs" color={labelColor} mb={1}>
            Categoria
          </FormLabel>
          <Select
            {...selectProps}
            value={filters.categoryId ?? ''}
            onChange={(e) => set({ categoryId: e.target.value || undefined })}
          >
            <option value="">Todas</option>
            {options.categories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.label}
              </option>
            ))}
          </Select>
        </FormControl>

        <FormControl>
          <FormLabel fontSize="xs" color={labelColor} mb={1}>
            Setor
          </FormLabel>
          <Select
            {...selectProps}
            value={filters.sectorId ?? ''}
            onChange={(e) => set({ sectorId: e.target.value || undefined })}
          >
            <option value="">Todos</option>
            {options.sectors.map((sector) => (
              <option key={sector.id} value={sector.id}>
                {sector.name}
              </option>
            ))}
          </Select>
        </FormControl>

        <FormControl>
          <FormLabel fontSize="xs" color={labelColor} mb={1}>
            Fornecedor
          </FormLabel>
          <Select
            {...selectProps}
            value={filters.supplierId ?? ''}
            onChange={(e) => set({ supplierId: e.target.value || undefined })}
          >
            <option value="">Todos</option>
            {options.suppliers.map((supplier: SupplierDTO) => (
              <option key={supplier.id} value={supplier.id}>
                {supplier.name}
              </option>
            ))}
          </Select>
        </FormControl>

        <HStack justify="flex-end" h="full" pb="1px">
          <Button
            size="sm"
            variant="ghost"
            colorScheme="gray"
            leftIcon={<RotateCcw size={14} />}
            onClick={() => onChange(getDefaultExecutiveFinanceFilters())}
            isDisabled={isDefault}
          >
            Limpar
          </Button>
        </HStack>
      </SimpleGrid>
    </Box>
  );
}
