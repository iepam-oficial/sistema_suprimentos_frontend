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
  VStack,
  Tag,
  Tooltip,
  useToast,
} from '@chakra-ui/react';
import { SearchIcon, EditIcon, AddIcon, ChevronLeftIcon, ChevronRightIcon } from '@chakra-ui/icons';
import { DataTable } from '@/components/data-table';
import { ColumnDef } from '@tanstack/react-table';
import type { FiscalNcmDTO } from '@ti-assistant/contracts';
import {
  fetchFiscalNcms,
  setFiscalNcmActive,
} from '@/features/financeiro/api/fiscalCatalogApi';
import { RateLimitError } from '@/features/financeiro/api/extraExpenseApi';
import { FiscalNcmImportPanel } from '@/features/financeiro/components/FiscalNcmImportPanel';

function formatNcmDisplay(code: string): string {
  const digits = code.replace(/\D/g, '');
  if (digits.length !== 8) return code;
  return `${digits.slice(0, 4)}.${digits.slice(4, 6)}.${digits.slice(6, 8)}`;
}

function formatDate(value?: string | null): string {
  if (!value) return '-';
  return new Date(value).toLocaleDateString('pt-BR');
}

export default function FiscalCodesPage() {
  const [ncms, setNcms] = useState<FiscalNcmDTO[]>([]);
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

  const loadNcms = useCallback(async () => {
    setIsLoading(true);
    try {
      const filters: { active?: boolean; q?: string; page: number; limit: number } = {
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

      const data = await fetchFiscalNcms(filters);
      setNcms(data.items);
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
        description: 'Não foi possível carregar os códigos fiscais.',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setIsLoading(false);
    }
  }, [activeFilter, appliedSearch, limit, page, router, toast]);

  useEffect(() => {
    loadNcms();
  }, [loadNcms]);

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

  const handleToggleActive = async (ncm: FiscalNcmDTO) => {
    setTogglingId(ncm.id);
    try {
      await setFiscalNcmActive(ncm.id, !ncm.active);
      await loadNcms();

      toast({
        title: 'Sucesso',
        description: `NCM ${ncm.active ? 'desativado' : 'ativado'} com sucesso.`,
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
          error instanceof Error ? error.message : 'Não foi possível alterar o status do NCM.',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setTogglingId(null);
    }
  };

  const columns: ColumnDef<FiscalNcmDTO>[] = [
    {
      accessorKey: 'code',
      header: 'NCM',
      size: 120,
      cell: ({ row }) => (
        <Text fontSize="sm" whiteSpace="nowrap">
          {formatNcmDisplay(row.original.code)}
        </Text>
      ),
    },
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
      id: 'cests',
      header: 'CEST',
      size: 180,
      cell: ({ row }) => {
        const cests = row.original.cests;
        if (!cests || cests.length === 0) {
          return (
            <Text fontSize="sm" color="gray.400">
              -
            </Text>
          );
        }
        const visible = cests.slice(0, 2);
        const extra = cests.length - visible.length;
        const tooltipLabel = cests
          .map(
            (cest) =>
              `${cest.code} — ${cest.description} · Segmento: ${cest.segmento}`,
          )
          .join('\n');
        return (
          <Tooltip
            label={
              <Box whiteSpace="pre-line" maxW="320px">
                {tooltipLabel}
              </Box>
            }
            hasArrow
            openDelay={300}
          >
            <HStack spacing={1} maxW="180px" overflow="hidden">
              {visible.map((cest) => (
                <Tag key={cest.code} size="sm" colorScheme="blue" flexShrink={0}>
                  {cest.code}
                </Tag>
              ))}
              {extra > 0 && (
                <Tag size="sm" colorScheme="gray" flexShrink={0}>
                  +{extra}
                </Tag>
              )}
            </HStack>
          </Tooltip>
        );
      },
    },
    {
      accessorKey: 'effective_from',
      header: 'Vigência',
      size: 100,
      cell: ({ row }) => (
        <Text fontSize="sm" whiteSpace="nowrap">
          {formatDate(row.original.effective_from)}
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
          aria-label={row.original.active ? 'Desativar NCM' : 'Ativar NCM'}
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
          aria-label="Editar NCM"
          icon={<EditIcon />}
          size="sm"
          variant="ghost"
          onClick={() => router.push(`/fiscal-codes/edit/${row.original.id}`)}
        />
      ),
    },
  ];

  return (
    <Box p={4}>
      <VStack spacing={4} align="stretch">
        <Box display="flex" justifyContent="space-between" alignItems="center">
          <Heading size="lg">Códigos Fiscais (NCM)</Heading>
          <Button
            colorScheme="blue"
            leftIcon={<AddIcon />}
            onClick={() => router.push('/fiscal-codes/add')}
          >
            Novo NCM
          </Button>
        </Box>

        <FiscalNcmImportPanel
          onImported={() => {
            if (page === 1) {
              void loadNcms();
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
                  placeholder="Filtrar por código ou descrição..."
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
                <option value="true">Ativos</option>
                <option value="false">Inativos</option>
              </Select>
            </VStack>
          </CardBody>
        </Card>

        <Card>
          <CardHeader>
            <Heading size="md">NCMs Cadastrados</Heading>
          </CardHeader>
          <CardBody>
            {ncms.length === 0 && !isLoading ? (
              <Text color="gray.500">Nenhum NCM encontrado.</Text>
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
                    '& th:nth-of-type(1), & td:nth-of-type(1)': { width: '12%' },
                    '& th:nth-of-type(2), & td:nth-of-type(2)': { width: '40%' },
                    '& th:nth-of-type(3), & td:nth-of-type(3)': { width: '20%' },
                    '& th:nth-of-type(4), & td:nth-of-type(4)': { width: '12%' },
                    '& th:nth-of-type(5), & td:nth-of-type(5)': { width: '8%' },
                    '& th:nth-of-type(6), & td:nth-of-type(6)': { width: '8%' },
                  }}
                >
                  <DataTable columns={columns} data={ncms} />
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
