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
  Input,
  InputGroup,
  InputRightElement,
  VStack,
  Select,
  Badge,
  Text,
  HStack,
  IconButton,
  Switch,
  useToast,
} from '@chakra-ui/react';
import { SearchIcon, EditIcon, AddIcon } from '@chakra-ui/icons';
import { DataTable } from '@/components/data-table';
import { ColumnDef } from '@tanstack/react-table';
import type { DepreciationRateDTO } from '@ti-assistant/contracts';
import {
  fetchDepreciationRates,
  setActiveDepreciationRate,
} from '@/features/inventory/api/depreciationRateApi';
import { RateLimitError } from '@/features/financeiro/api/extraExpenseApi';

function formatDate(value?: string | null): string {
  if (!value) return '-';
  return new Date(value).toLocaleDateString('pt-BR');
}

function formatVigencia(from: string, to?: string | null): string {
  const start = formatDate(from);
  if (!to) return `${start} — em aberto`;
  return `${start} — ${formatDate(to)}`;
}

function formatPlano(rate: DepreciationRateDTO): string {
  const account = rate.chart_of_account;
  if (!account) return rate.chart_of_account_id;
  return `${account.codigo} — ${account.nome}`;
}

export default function DepreciationRatesPage() {
  const [rates, setRates] = useState<DepreciationRateDTO[]>([]);
  const [ncmInput, setNcmInput] = useState('');
  const [appliedNcm, setAppliedNcm] = useState('');
  const [activeFilter, setActiveFilter] = useState<string>('');
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

      const filters: { ncm?: string; active?: boolean } = {};
      if (appliedNcm.trim()) {
        filters.ncm = appliedNcm.trim();
      }
      if (activeFilter === 'true') {
        filters.active = true;
      } else if (activeFilter === 'false') {
        filters.active = false;
      }

      const data = await fetchDepreciationRates(token, filters);
      setRates(data);
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
  }, [activeFilter, appliedNcm, router, toast]);

  useEffect(() => {
    loadRates();
  }, [loadRates]);

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
        description: 'Não foi possível alterar o status da regra.',
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
      accessorKey: 'ncm',
      header: 'NCM',
    },
    {
      accessorKey: 'cest',
      header: 'CEST',
      cell: ({ row }) => row.original.cest || '-',
    },
    {
      id: 'plano',
      header: 'Plano',
      cell: ({ row }) => formatPlano(row.original),
    },
    {
      accessorKey: 'service_life_years',
      header: 'Vida útil',
      cell: ({ row }) => `${row.original.service_life_years} anos`,
    },
    {
      accessorKey: 'annual_rate',
      header: 'Taxa',
      cell: ({ row }) => `${row.original.annual_rate.toFixed(2)}%`,
    },
    {
      accessorKey: 'priority',
      header: 'Prioridade',
    },
    {
      id: 'vigencia',
      header: 'Vigência',
      cell: ({ row }) =>
        formatVigencia(row.original.effective_from, row.original.effective_to),
    },
    {
      accessorKey: 'active',
      header: 'Ativo',
      cell: ({ row }) => (
        <HStack spacing={3}>
          <Badge colorScheme={row.original.active ? 'green' : 'gray'}>
            {row.original.active ? 'Sim' : 'Não'}
          </Badge>
          <Switch
            aria-label={
              row.original.active ? 'Desativar regra' : 'Ativar regra'
            }
            isChecked={row.original.active}
            isDisabled={togglingId === row.original.id}
            onChange={() => handleToggleActive(row.original)}
          />
        </HStack>
      ),
    },
    {
      id: 'actions',
      header: 'Ações',
      cell: ({ row }) => (
        <IconButton
          aria-label="Editar regra"
          icon={<EditIcon />}
          size="sm"
          variant="ghost"
          onClick={() =>
            router.push(`/depreciation-rates/edit/${row.original.id}`)
          }
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

        <Card>
          <CardHeader>
            <Heading size="md">Buscar e Filtrar</Heading>
          </CardHeader>
          <CardBody>
            <VStack spacing={4} align="stretch">
              <InputGroup>
                <Input
                  placeholder="Filtrar por NCM..."
                  value={ncmInput}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setNcmInput(e.target.value)
                  }
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      setAppliedNcm(ncmInput);
                    }
                  }}
                />
                <InputRightElement width="auto" pr={1}>
                  <Button
                    colorScheme="blue"
                    size="sm"
                    leftIcon={<SearchIcon />}
                    onClick={() => setAppliedNcm(ncmInput)}
                    isLoading={isLoading}
                  >
                    Buscar
                  </Button>
                </InputRightElement>
              </InputGroup>
              <Select
                placeholder="Filtrar por status"
                value={activeFilter}
                onChange={(e) => setActiveFilter(e.target.value)}
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
              <DataTable columns={columns} data={rates} />
            )}
          </CardBody>
        </Card>
      </VStack>
    </Box>
  );
}
