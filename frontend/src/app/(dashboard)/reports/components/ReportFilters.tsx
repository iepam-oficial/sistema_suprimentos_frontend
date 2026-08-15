'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import {
  Box,
  Button,
  FormControl,
  FormHelperText,
  FormLabel,
  HStack,
  Input,
  ListItem,
  Select,
  SimpleGrid,
  Spinner,
  Tag,
  TagCloseButton,
  TagLabel,
  Text,
  useColorMode,
  useColorModeValue,
  VStack,
  Wrap,
  WrapItem,
} from '@chakra-ui/react';
import { AnchoredDropdownList } from '@/components/ui/AnchoredDropdownList';
import { useFiscalNcmSearch } from '@/features/financeiro/hooks/useFiscalNcmSearch';
import type { FiscalNcmDTO } from '@ti-assistant/contracts';
import { buildFilterQueryString } from '@/features/reports/api/reportApi';
import {
  EMPTY_FILTERS,
  getFilterFieldVisibility,
  toReportFiltersQuery,
  type ReportFiltersState,
} from '@/features/reports/reportFilterVisibility';
import { FilterOptions, ReportSlug } from '@/features/reports/types';
import {
  fetchCategories,
  fetchSubcategoriesByCategory,
  type CategoryDTO,
  type SubcategoryDTO,
} from '@/features/reference-data';

export {
  EMPTY_FILTERS,
  getFilterFieldVisibility,
  toReportFiltersQuery,
  type FilterFieldVisibility,
  type ReportFiltersState,
} from '@/features/reports/reportFilterVisibility';

const TIME_LABELS: Record<string, string> = {
  '7': '7 dias',
  '30': '30 dias',
  '90': '90 dias',
  '365': '1 ano',
  '0': 'Todo período',
};

export function parseCsvParam(raw: string | null): string[] {
  if (!raw) return [];
  return raw
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
}

interface ReportFiltersProps {
  filters: ReportFiltersState;
  filterOptions: FilterOptions | null;
  onChange: (filters: ReportFiltersState) => void;
  activeSlug: ReportSlug;
}

export interface StockFilterLookups {
  categories?: { id: string; label: string }[];
  subcategories?: { id: string; label: string }[];
  ncms?: { id: string; code: string }[];
}

export function getActiveFilterChips(
  filters: ReportFiltersState,
  filterOptions: FilterOptions | null,
  options?: { slug?: ReportSlug; lookups?: StockFilterLookups }
): { key: string; label: string }[] {
  const chips: { key: string; label: string }[] = [];
  const slug = options?.slug;
  const visibility = slug ? getFilterFieldVisibility(slug) : null;
  const lookups = options?.lookups;

  if (!visibility || visibility.period) {
    chips.push({
      key: 'timeRange',
      label: TIME_LABELS[filters.timeRange] ?? `${filters.timeRange} dias`,
    });
  }
  if (filters.locationId && (!visibility || visibility.location)) {
    const loc = filterOptions?.locations.find((l) => l.id === filters.locationId);
    chips.push({ key: 'locationId', label: loc?.name ?? 'Local' });
  }
  if (filters.sectorId && (!visibility || visibility.sector)) {
    const sec = filterOptions?.sectors.find((s) => s.id === filters.sectorId);
    chips.push({ key: 'sectorId', label: sec?.name ?? 'Setor' });
  }
  if (filters.supplierId && (!visibility || visibility.supplier)) {
    const sup = filterOptions?.suppliers.find((s) => s.id === filters.supplierId);
    chips.push({ key: 'supplierId', label: sup?.name ?? 'Fornecedor' });
  }
  if (filters.categoryId && (!visibility || visibility.category)) {
    const cat = lookups?.categories?.find((c) => c.id === filters.categoryId);
    chips.push({ key: 'categoryId', label: cat?.label ?? 'Categoria' });
  }
  if (filters.subcategoryId && (!visibility || visibility.subcategory)) {
    const sub = lookups?.subcategories?.find((s) => s.id === filters.subcategoryId);
    chips.push({ key: 'subcategoryId', label: sub?.label ?? 'Subcategoria' });
  }
  if (filters.ncmIds.length > 0 && (!visibility || visibility.ncm)) {
    const labels = filters.ncmIds.map((id) => {
      const ncm = lookups?.ncms?.find((n) => n.id === id);
      return ncm?.code ?? id.slice(0, 8);
    });
    chips.push({
      key: 'ncmIds',
      label: labels.length <= 2 ? `NCM: ${labels.join(', ')}` : `NCM (${labels.length})`,
    });
  }
  if (filters.cestCodes.length > 0 && (!visibility || visibility.cest)) {
    chips.push({
      key: 'cestCodes',
      label:
        filters.cestCodes.length <= 3
          ? `CEST: ${filters.cestCodes.join(', ')}`
          : `CEST (${filters.cestCodes.length})`,
    });
  }
  return chips;
}

export function hasNonDefaultFilters(
  filters: ReportFiltersState,
  slug?: ReportSlug
): boolean {
  const visibility = slug ? getFilterFieldVisibility(slug) : null;
  const periodNonDefault =
    (!visibility || visibility.period) && filters.timeRange !== '30';
  return (
    periodNonDefault ||
    !!filters.locationId ||
    !!filters.sectorId ||
    !!filters.supplierId ||
    !!filters.categoryId ||
    !!filters.subcategoryId ||
    filters.ncmIds.length > 0 ||
    filters.cestCodes.length > 0
  );
}

function useFilterSelectProps() {
  const { colorMode } = useColorMode();
  return {
    size: 'sm' as const,
    bg: colorMode === 'dark' ? 'rgba(45, 55, 72, 0.5)' : 'rgba(255, 255, 255, 0.5)',
  };
}

function getSectorsForLocation(
  filters: ReportFiltersState,
  filterOptions: FilterOptions | null
) {
  return (
    filterOptions?.sectors.filter(
      (s) => !filters.locationId || s.location_id === filters.locationId
    ) ?? []
  );
}

function formatNcmDisplay(code: string): string {
  const digits = code.replace(/\D/g, '');
  if (digits.length !== 8) return code;
  return `${digits.slice(0, 4)}.${digits.slice(4, 6)}.${digits.slice(6, 8)}`;
}

function normalizeCestDraft(raw: string): string {
  return raw.replace(/\D/g, '');
}

function extractCestCodesFromNcms(items: FiscalNcmDTO[]): string[] {
  const codes = new Set<string>();
  for (const item of items) {
    for (const cest of item.cests ?? []) {
      const normalized = normalizeCestDraft(cest.code);
      if (normalized) codes.add(normalized);
    }
  }
  return Array.from(codes).sort();
}

function useStockCatalogOptions(enabled: boolean, categoryId: string) {
  const [categories, setCategories] = useState<CategoryDTO[]>([]);
  const [subcategories, setSubcategories] = useState<SubcategoryDTO[]>([]);

  useEffect(() => {
    if (!enabled) return;
    const token = localStorage.getItem('@ti-assistant:token');
    if (!token) return;
    let cancelled = false;
    fetchCategories(token)
      .then((data) => {
        if (!cancelled) setCategories(data);
      })
      .catch(() => {
        if (!cancelled) setCategories([]);
      });
    return () => {
      cancelled = true;
    };
  }, [enabled]);

  useEffect(() => {
    if (!enabled || !categoryId) {
      setSubcategories([]);
      return;
    }
    const token = localStorage.getItem('@ti-assistant:token');
    if (!token) return;
    let cancelled = false;
    fetchSubcategoriesByCategory(token, categoryId)
      .then((data) => {
        if (!cancelled) setSubcategories(data);
      })
      .catch(() => {
        if (!cancelled) setSubcategories([]);
      });
    return () => {
      cancelled = true;
    };
  }, [enabled, categoryId]);

  return { categories, subcategories };
}

function NcmMultiSelect({
  value,
  onChange,
  selectedLabels,
  onLabelsChange,
  onNcmResults,
  size = 'sm',
}: {
  value: string[];
  onChange: (ids: string[]) => void;
  selectedLabels: Record<string, string>;
  onLabelsChange: (next: Record<string, string>) => void;
  onNcmResults?: (items: FiscalNcmDTO[]) => void;
  size?: 'sm' | 'xs';
}) {
  const [inputValue, setInputValue] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLUListElement>(null);
  const { results, isLoading } = useFiscalNcmSearch(inputValue, {
    enabled: showSuggestions,
  });
  const hoverBg = useColorModeValue('gray.50', 'gray.600');
  const selectProps = useFilterSelectProps();

  useEffect(() => {
    onNcmResults?.(results);
  }, [results, onNcmResults]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      if (inputRef.current?.contains(target) || listRef.current?.contains(target)) {
        return;
      }
      setShowSuggestions(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelect = (item: FiscalNcmDTO) => {
    if (!value.includes(item.id)) {
      onChange([...value, item.id]);
      onLabelsChange({
        ...selectedLabels,
        [item.id]: formatNcmDisplay(item.code),
      });
    }
    setInputValue('');
    setShowSuggestions(false);
  };

  const removeId = (id: string) => {
    onChange(value.filter((item) => item !== id));
    const next = { ...selectedLabels };
    delete next[id];
    onLabelsChange(next);
  };

  const shouldShowList =
    showSuggestions && inputValue.trim().length >= 2 && (isLoading || results.length > 0);

  return (
    <Box w="full" data-testid="reports-filter-ncm">
      <Input
        ref={inputRef}
        size={size}
        bg={selectProps.bg}
        value={inputValue}
        placeholder="Buscar NCM por código ou descrição"
        onChange={(e) => {
          setInputValue(e.target.value);
          setShowSuggestions(true);
        }}
        onFocus={() => setShowSuggestions(true)}
      />
      <AnchoredDropdownList
        anchorRef={inputRef}
        listRef={listRef}
        isOpen={shouldShowList}
      >
        {isLoading ? (
          <ListItem px={3} py={2}>
            <Spinner size="sm" mr={2} />
            <Text as="span" fontSize="sm">
              Buscando...
            </Text>
          </ListItem>
        ) : (
          results
            .filter((item) => !value.includes(item.id))
            .map((item) => (
              <ListItem
                key={item.id}
                px={3}
                py={2}
                cursor="pointer"
                _hover={{ bg: hoverBg }}
                onMouseDown={(e) => {
                  e.preventDefault();
                  handleSelect(item);
                }}
              >
                <Text fontSize="sm" fontWeight="medium">
                  {formatNcmDisplay(item.code)}
                </Text>
                <Text fontSize="xs" color="gray.500" noOfLines={2}>
                  {item.description}
                </Text>
              </ListItem>
            ))
        )}
      </AnchoredDropdownList>
      {value.length > 0 && (
        <Wrap mt={2} spacing={1}>
          {value.map((id) => (
            <WrapItem key={id}>
              <Tag size="sm" colorScheme="blue" variant="subtle">
                <TagLabel>{selectedLabels[id] ?? id.slice(0, 8)}</TagLabel>
                <TagCloseButton onClick={() => removeId(id)} />
              </Tag>
            </WrapItem>
          ))}
        </Wrap>
      )}
    </Box>
  );
}

function CestMultiSelect({
  value,
  onChange,
  suggestions,
  size = 'sm',
}: {
  value: string[];
  onChange: (codes: string[]) => void;
  suggestions: string[];
  size?: 'sm' | 'xs';
}) {
  const [draft, setDraft] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLUListElement>(null);
  const selectProps = useFilterSelectProps();
  const hoverBg = useColorModeValue('gray.50', 'gray.600');

  const filteredSuggestions = useMemo(() => {
    const q = normalizeCestDraft(draft);
    return suggestions
      .filter((code) => !value.includes(code))
      .filter((code) => !q || code.includes(q))
      .slice(0, 20);
  }, [draft, suggestions, value]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      if (inputRef.current?.contains(target) || listRef.current?.contains(target)) {
        return;
      }
      setShowSuggestions(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const addCode = (raw?: string) => {
    const code = normalizeCestDraft(raw ?? draft);
    if (!code) {
      setDraft('');
      return;
    }
    if (!value.includes(code)) {
      onChange([...value, code]);
    }
    setDraft('');
    setShowSuggestions(false);
  };

  const removeCode = (code: string) => {
    onChange(value.filter((item) => item !== code));
  };

  return (
    <Box w="full" data-testid="reports-filter-cest">
      <HStack>
        <Input
          ref={inputRef}
          size={size}
          bg={selectProps.bg}
          value={draft}
          placeholder="Ex: 1708400 (digite ou selecione)"
          onChange={(e) => {
            setDraft(e.target.value);
            setShowSuggestions(true);
          }}
          onFocus={() => setShowSuggestions(true)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ',') {
              e.preventDefault();
              addCode();
            }
          }}
        />
        <Button
          size={size}
          variant="outline"
          onClick={() => addCode()}
          isDisabled={!draft.trim()}
        >
          Add
        </Button>
      </HStack>
      <AnchoredDropdownList
        anchorRef={inputRef}
        listRef={listRef}
        isOpen={showSuggestions && filteredSuggestions.length > 0}
      >
        {filteredSuggestions.map((code) => (
          <ListItem
            key={code}
            px={3}
            py={2}
            cursor="pointer"
            _hover={{ bg: hoverBg }}
            onMouseDown={(e) => {
              e.preventDefault();
              addCode(code);
            }}
          >
            <Text fontSize="sm">{code}</Text>
          </ListItem>
        ))}
      </AnchoredDropdownList>
      <FormHelperText fontSize="xs">
        Enter para adicionar; sugestões vêm dos NCMs buscados.
      </FormHelperText>
      {value.length > 0 && (
        <Wrap mt={2} spacing={1}>
          {value.map((code) => (
            <WrapItem key={code}>
              <Tag size="sm" colorScheme="blue" variant="subtle">
                <TagLabel>{code}</TagLabel>
                <TagCloseButton onClick={() => removeCode(code)} />
              </Tag>
            </WrapItem>
          ))}
        </Wrap>
      )}
    </Box>
  );
}

function StockCatalogFields({
  filters,
  onChange,
  labelSize = 'sm',
  selectSize = 'sm',
}: {
  filters: ReportFiltersState;
  onChange: (filters: ReportFiltersState) => void;
  labelSize?: 'sm' | 'xs';
  selectSize?: 'sm' | 'xs';
}) {
  const selectProps = useFilterSelectProps();
  const { categories, subcategories } = useStockCatalogOptions(true, filters.categoryId);
  const [ncmLabels, setNcmLabels] = useState<Record<string, string>>({});
  const [cestSuggestions, setCestSuggestions] = useState<string[]>([]);

  const handleNcmResults = useMemo(
    () => (items: FiscalNcmDTO[]) => {
      setCestSuggestions((prev) => {
        const merged = new Set([...prev, ...extractCestCodesFromNcms(items)]);
        return Array.from(merged).sort();
      });
    },
    []
  );

  return (
    <VStack align="stretch" spacing={4} w="full">
      <FormControl>
        <FormLabel fontSize={labelSize} mb={1}>
          Categoria
        </FormLabel>
        <Select
          data-testid="reports-filter-category"
          {...selectProps}
          size={selectSize}
          value={filters.categoryId}
          onChange={(e) =>
            onChange({
              ...filters,
              categoryId: e.target.value,
              subcategoryId: '',
            })
          }
        >
          <option value="">Todas</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>
              {c.label}
            </option>
          ))}
        </Select>
      </FormControl>
      <FormControl>
        <FormLabel fontSize={labelSize} mb={1}>
          Subcategoria
        </FormLabel>
        <Select
          data-testid="reports-filter-subcategory"
          {...selectProps}
          size={selectSize}
          value={filters.subcategoryId}
          isDisabled={!filters.categoryId}
          onChange={(e) => onChange({ ...filters, subcategoryId: e.target.value })}
        >
          <option value="">Todas</option>
          {subcategories.map((s) => (
            <option key={s.id} value={s.id}>
              {s.label}
            </option>
          ))}
        </Select>
      </FormControl>
      <FormControl>
        <FormLabel fontSize={labelSize} mb={1}>
          NCM
        </FormLabel>
        <NcmMultiSelect
          value={filters.ncmIds}
          onChange={(ncmIds) => onChange({ ...filters, ncmIds })}
          selectedLabels={ncmLabels}
          onLabelsChange={setNcmLabels}
          onNcmResults={handleNcmResults}
          size={selectSize}
        />
      </FormControl>
      <FormControl>
        <FormLabel fontSize={labelSize} mb={1}>
          CEST
        </FormLabel>
        <CestMultiSelect
          value={filters.cestCodes}
          onChange={(cestCodes) => onChange({ ...filters, cestCodes })}
          suggestions={cestSuggestions}
          size={selectSize}
        />
      </FormControl>
    </VStack>
  );
}

/** Stacked filter fields for the drawer (no chips). */
export function ReportFiltersFields({
  filters,
  filterOptions,
  onChange,
  activeSlug,
}: ReportFiltersProps) {
  const selectProps = useFilterSelectProps();
  const sectorsForLocation = getSectorsForLocation(filters, filterOptions);
  const visibility = getFilterFieldVisibility(activeSlug);

  return (
    <VStack align="stretch" spacing={4} w="full">
      {visibility.period && (
        <FormControl>
          <FormLabel fontSize="sm" mb={1}>
            Período
          </FormLabel>
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
      )}
      {visibility.location && (
        <FormControl>
          <FormLabel fontSize="sm" mb={1}>
            Local
          </FormLabel>
          <Select
            {...selectProps}
            value={filters.locationId}
            onChange={(e) =>
              onChange({ ...filters, locationId: e.target.value, sectorId: '' })
            }
          >
            <option value="">Todos</option>
            {filterOptions?.locations.map((l) => (
              <option key={l.id} value={l.id}>
                {l.name}
              </option>
            ))}
          </Select>
        </FormControl>
      )}
      {visibility.sector && (
        <FormControl>
          <FormLabel fontSize="sm" mb={1}>
            Setor
          </FormLabel>
          <Select
            {...selectProps}
            value={filters.sectorId}
            onChange={(e) => onChange({ ...filters, sectorId: e.target.value })}
          >
            <option value="">Todos</option>
            {sectorsForLocation.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </Select>
        </FormControl>
      )}
      {visibility.supplier && (
        <FormControl>
          <FormLabel fontSize="sm" mb={1}>
            Fornecedor
          </FormLabel>
          <Select
            {...selectProps}
            value={filters.supplierId}
            onChange={(e) => onChange({ ...filters, supplierId: e.target.value })}
          >
            <option value="">Todos</option>
            {filterOptions?.suppliers.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </Select>
        </FormControl>
      )}
      {(visibility.category || visibility.ncm) && (
        <StockCatalogFields filters={filters} onChange={onChange} />
      )}
    </VStack>
  );
}

/** Mobile / legacy bar: grid fields + neutral chips. */
export function ReportFiltersBar({
  filters,
  filterOptions,
  onChange,
  activeSlug,
}: ReportFiltersProps) {
  const selectProps = useFilterSelectProps();
  const sectorsForLocation = getSectorsForLocation(filters, filterOptions);
  const visibility = getFilterFieldVisibility(activeSlug);
  const chips = getActiveFilterChips(filters, filterOptions, { slug: activeSlug });
  const showClear = hasNonDefaultFilters(filters, activeSlug);
  const stock = isStockReportSlug(activeSlug);
  const columns = stock ? { base: 1, md: 2 } : { base: 1, md: 2, lg: 4 };

  return (
    <VStack align="stretch" spacing={3} w="full">
      <SimpleGrid columns={columns} spacing={3} w="full">
        {visibility.period && (
          <FormControl>
            <FormLabel fontSize="xs" mb={1}>
              Período
            </FormLabel>
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
        )}
        {visibility.location && (
          <FormControl>
            <FormLabel fontSize="xs" mb={1}>
              Local
            </FormLabel>
            <Select
              {...selectProps}
              value={filters.locationId}
              onChange={(e) =>
                onChange({ ...filters, locationId: e.target.value, sectorId: '' })
              }
            >
              <option value="">Todos</option>
              {filterOptions?.locations.map((l) => (
                <option key={l.id} value={l.id}>
                  {l.name}
                </option>
              ))}
            </Select>
          </FormControl>
        )}
        {visibility.sector && (
          <FormControl>
            <FormLabel fontSize="xs" mb={1}>
              Setor
            </FormLabel>
            <Select
              {...selectProps}
              value={filters.sectorId}
              onChange={(e) => onChange({ ...filters, sectorId: e.target.value })}
            >
              <option value="">Todos</option>
              {sectorsForLocation.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </Select>
          </FormControl>
        )}
        {visibility.supplier && (
          <FormControl>
            <FormLabel fontSize="xs" mb={1}>
              Fornecedor
            </FormLabel>
            <Select
              {...selectProps}
              value={filters.supplierId}
              onChange={(e) => onChange({ ...filters, supplierId: e.target.value })}
            >
              <option value="">Todos</option>
              {filterOptions?.suppliers.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </Select>
          </FormControl>
        )}
      </SimpleGrid>

      {(visibility.category || visibility.ncm) && (
        <StockCatalogFields
          filters={filters}
          onChange={onChange}
          labelSize="xs"
          selectSize="sm"
        />
      )}

      <HStack justify="space-between" flexWrap="wrap" gap={2}>
        <Wrap spacing={2}>
          {chips.map((chip) => (
            <WrapItem key={chip.key}>
              <Tag size="sm" colorScheme="gray" variant="subtle">
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
  const slug = report as ReportSlug;
  const q = toReportFiltersQuery(slug, filters);
  const params = new URLSearchParams({ report });
  const filterQs = buildFilterQueryString(q, slug);
  if (filterQs) {
    const inner = new URLSearchParams(filterQs.startsWith('?') ? filterQs.slice(1) : filterQs);
    inner.forEach((value, key) => {
      params.set(key, value);
    });
  }
  return params.toString();
}
