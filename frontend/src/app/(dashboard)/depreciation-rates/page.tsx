'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Box,
  Button,
  Card,
  CardBody,
  CardHeader,
  Heading,
  HStack,
  IconButton,
  Input,
  InputGroup,
  InputRightElement,
  Select,
  Switch,
  Text,
  Tooltip,
  VStack,
  useToast,
} from '@chakra-ui/react';
import {
  SearchIcon,
  EditIcon,
  AddIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
} from '@chakra-ui/icons';
import { DataTable } from '@/components/data-table';
import { ColumnDef } from '@tanstack/react-table';
import type { DepreciationRateDTO } from '@ti-assistant/contracts';
import {
  fetchDepreciationRates,
  setActiveDepreciationRate,
} from '@/features/inventory/api/depreciationRateApi';
import { RateLimitError } from '@/features/financeiro/api/extraExpenseApi';
import { DepreciationRatesImportPanel } from './DepreciationRatesImportPanel';

function formatNcmDisplay(code?: string | null): string {
  if (!code) return '-';
  const digits = code.replace(/\D/g, '');
  if (digits.length !== 8) return code;
  return `${digits.slice(0, 4)}.${digits.slice(4, 6)}.${digits.slice(6, 8)}`;
}

function formatDate(value?: string | null): string {
  if (!value) return '-';
  return new Date(value).toLocaleDateString('pt-BR');
}

function formatVigencia(from: string, to?: string | null): string {
  const start = formatDate(from);
  if (!to) return `${start} — em aberto`;
  return `${start} — ${formatDate(to)}`;
}

export default function DepreciationRatesPage() {
  const [rates, setRates] = useState<DepreciationRateDTO[]>([]);
  const [searchInput, setSearchInput] = useState('');
  const [appliedSearch, setAppliedSearch] = useState('');
  const [activeFilter, setActiveFilter] = useState<string>('');
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(100);
  const [total, setTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [togglingId, setTogglingId] = useState<string | null>(null);
  const router = useRouter();
  const toast = useToast();

  const loadRates = useCallback(async () => {
    setIsLoading(true);
    try {
      const token = localStorage.getItem('@ti-assistant:token');
      if (!token) {
        throw new Error('Token não encontrado');
      }

      const filters: {
        q?: string;
        active?: boolean;
        page: number;
        limit: number;
      } = {
        page,
        limit,
      };
      if (appliedSearch.trim()) {
        filters.q = appliedSearch.trim();
      }
      if (activeFilter === 'true') {
        filters.active = true;
      } else if (activeFilter === 'false') {
        filters.active = false;
      }

      const data = await fetchDepreciationRates(token, filters);
      setRates(data.items);
      setTotal(data.total);
      if (data.page !== page) {
        setPage(data.page);
      }
    } catch (error) {
      if (error instanceof RateLimitError) {
        router.push('/rate-limit');
        return;
      }
      toast({
        title: 'Erro',
        description: 'Não foi possível carregar as taxas de depreciação.',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setIsLoading(false);
    }
  }, [activeFilter, appliedSearch, limit, page, router, toast]);

  useEffect(() => {
    loadRates();
  }, [loadRates]);

  const applySearch = () => {
    setPage(1);
    setAppliedSearch(searchInput);
  };

  const handleActiveFilterChange = (value: string) => {
    setPage(1);
    setActiveFilter(value);
  };

  const handleLimitChange = (value: string) => {
    setPage(1);
    setLimit(Number(value) || 100);
  };

  const totalPages = Math.max(1, Math.ceil(total / limit));
  const rangeFrom = total === 0 ? 0 : (page - 1) * limit + 1;
  const rangeTo = Math.min(page * limit, total);

  const handleToggleActive = async (rate: DepreciationRateDTO) => {
    setTogglingId(rate.id);
    try {
      const token = localStorage.getItem('@ti-assistant:token');
      if (!token) {
        throw new Error('Token não encontrado');
      }

      await setActiveDepreciationRate(token, rate.id, !rate.active);
      await loadRates();

      toast({
        title: 'Sucesso',
        description: `Regra ${rate.active ? 'desativada' : 'ativada'} com sucesso.`,
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
    } catch (error) {
      if (error instanceof RateLimitError) {
        router.push('/rate-limit');
        return;
      }
      toast({
        title: 'Erro',
        description:
          error instanceof Error
            ? error.message
            : 'Não foi possível alterar o status da regra.',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setTogglingId(null);
    }
  };

  const columns: ColumnDef<DepreciationRateDTO>[] = [
    {
      accessorKey: 'description',
      header: 'Descrição',
      cell: ({ row }) => {
        const description = row.original.description;
        return (
          <Tooltip label={description} hasArrow openDelay={300}>
            <Text fontSize="sm" noOfLines={1} maxW="100%" cursor="default">
              {description}
            </Text>
          </Tooltip>
        );
      },
    },
    {
      accessorKey: 'ncm',
      header: 'NCM',
      size: 110,
      cell: ({ row }) => (
        <Text fontSize="sm" whiteSpace="nowrap">
          {formatNcmDisplay(row.original.ncm)}
        </Text>
      ),
    },
    {
      accessorKey: 'cest',
      header: 'CEST',
      size: 90,
      cell: ({ row }) => (
        <Text fontSize="sm" color={row.original.cest ? undefined : 'gray.400'}>
          {row.original.cest || '-'}
        </Text>
      ),
    },
    {
      accessorKey: 'service_life_years',
      header: 'Vida útil',
      size: 80,
      cell: ({ row }) => (
        <Text fontSize="sm" whiteSpace="nowrap">
          {row.original.service_life_years} anos
        </Text>
      ),
    },
    {
      accessorKey: 'annual_rate',
      header: 'Taxa',
      size: 70,
      cell: ({ row }) => (
        <Text fontSize="sm" whiteSpace="nowrap">
          {row.original.annual_rate.toFixed(2)}%
        </Text>
      ),
    },
    {
      accessorKey: 'priority',
      header: 'Prioridade',
      size: 80,
      cell: ({ row }) => <Text fontSize="sm">{row.original.priority}</Text>,
    },
    {
      id: 'vigencia',
      header: 'Vigência',
      size: 140,
      cell: ({ row }) => (
        <Text fontSize="sm" whiteSpace="nowrap">
          {formatVigencia(row.original.effective_from, row.original.effective_to)}
        </Text>
      ),
    },
    {
      accessorKey: 'active',
      header: 'Ativo',
      size: 70,
      cell: ({ row }) => (
        <Switch
          size="sm"
          aria-label={row.original.active ? 'Desativar regra' : 'Ativar regra'}
          isChecked={row.original.active}
          isDisabled={togglingId === row.original.id}
          onChange={() => handleToggleActive(row.original)}
        />
      ),
    },
    {
      id: 'actions',
      header: 'Ações',
      size: 60,
      cell: ({ row }) => (
        <IconButton
          aria-label="Editar regra"
          icon={<EditIcon />}
          size="sm"
          variant="ghost"
          onClick={() => router.push(`/depreciation-rates/edit/${row.original.id}`)}
        />
      ),
    },
  ];

  return (
    <Box p={4}>
      <VStack spacing={4} align="stretch">
        <Box display="flex" justifyContent="space-between" alignItems="center">
          <Heading size="lg">Taxas de Depreciação</Heading>
          <Button
            colorScheme="blue"
            leftIcon={<AddIcon />}
            onClick={() => router.push('/depreciation-rates/add')}
          >
            Nova Regra
          </Button>
        </Box>

        <DepreciationRatesImportPanel
          onImported={() => {
            if (page === 1) {
              void loadRates();
            } else {
              setPage(1);
            }
          }}
          onRateLimited={() => router.push('/rate-limit')}
        />

        <Card>
          <CardHeader>
            <Heading size="md">Buscar e Filtrar</Heading>
          </CardHeader>
          <CardBody>
            <VStack spacing={4} align="stretch">
              <InputGroup>
                <Input
                  placeholder="Filtrar por NCM ou descrição..."
                  value={searchInput}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setSearchInput(e.target.value)
                  }
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      applySearch();
                    }
                  }}
                />
                <InputRightElement width="auto" pr={1}>
                  <Button
                    colorScheme="blue"
                    size="sm"
                    leftIcon={<SearchIcon />}
                    onClick={applySearch}
                    isLoading={isLoading}
                  >
                    Buscar
                  </Button>
                </InputRightElement>
              </InputGroup>
              <Select
                placeholder="Filtrar por status"
                value={activeFilter}
                onChange={(e) => handleActiveFilterChange(e.target.value)}
                maxW="300px"
              >
                <option value="true">Ativas</option>
                <option value="false">Inativas</option>
              </Select>
            </VStack>
          </CardBody>
        </Card>

        <Card>
          <CardHeader>
            <Heading size="md">Regras de Depreciação</Heading>
          </CardHeader>
          <CardBody>
            {rates.length === 0 && !isLoading ? (
              <Text color="gray.500">Nenhuma regra encontrada.</Text>
            ) : (
              <VStack spacing={4} align="stretch" maxW="100%">
                <Box
                  maxW="100%"
                  overflowX="hidden"
                  sx={{
                    '& .chakra-table__container': {
                      overflowX: 'hidden',
                      maxW: '100%',
                    },
                    '& table': {
                      tableLayout: 'fixed',
                      width: '100%',
                    },
                    '& th, & td': {
                      px: 2,
                      py: 1.5,
                      fontSize: 'sm',
                      overflow: 'hidden',
                    },
                    '& th:nth-of-type(1), & td:nth-of-type(1)': { width: '24%' },
                    '& th:nth-of-type(2), & td:nth-of-type(2)': { width: '11%' },
                    '& th:nth-of-type(3), & td:nth-of-type(3)': { width: '9%' },
                    '& th:nth-of-type(4), & td:nth-of-type(4)': { width: '9%' },
                    '& th:nth-of-type(5), & td:nth-of-type(5)': { width: '8%' },
                    '& th:nth-of-type(6), & td:nth-of-type(6)': { width: '8%' },
                    '& th:nth-of-type(7), & td:nth-of-type(7)': { width: '15%' },
                    '& th:nth-of-type(8), & td:nth-of-type(8)': { width: '8%' },
                    '& th:nth-of-type(9), & td:nth-of-type(9)': { width: '8%' },
                  }}
                >
                  <DataTable columns={columns} data={rates} />
                </Box>
                <HStack justify="space-between" flexWrap="wrap" spacing={4}>
                  <Text fontSize="sm" color="gray.600">
                    Mostrando {rangeFrom}–{rangeTo} de {total}
                  </Text>
                  <HStack spacing={3}>
                    <Select
                      size="sm"
                      maxW="110px"
                      value={String(limit)}
                      onChange={(e) => handleLimitChange(e.target.value)}
                      aria-label="Itens por página"
                    >
                      <option value="25">25</option>
                      <option value="50">50</option>
                      <option value="100">100</option>
                    </Select>
                    <Button
                      size="sm"
                      leftIcon={<ChevronLeftIcon />}
                      onClick={() => setPage((p) => Math.max(1, p - 1))}
                      isDisabled={page <= 1 || isLoading}
                    >
                      Anterior
                    </Button>
                    <Text fontSize="sm" minW="80px" textAlign="center">
                      {page} / {totalPages}
                    </Text>
                    <Button
                      size="sm"
                      rightIcon={<ChevronRightIcon />}
                      onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                      isDisabled={page >= totalPages || isLoading}
                    >
                      Próxima
                    </Button>
                  </HStack>
                </HStack>
              </VStack>
            )}
          </CardBody>
        </Card>
      </VStack>
    </Box>
  );
}
