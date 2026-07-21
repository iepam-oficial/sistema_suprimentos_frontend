'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Badge,
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
  Wrap,
  WrapItem,
  Tag,
  useToast,
} from '@chakra-ui/react';
import { SearchIcon, EditIcon, AddIcon } from '@chakra-ui/icons';
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
  const [isLoading, setIsLoading] = useState(false);
  const [togglingId, setTogglingId] = useState<string | null>(null);
  const router = useRouter();
  const toast = useToast();

  const loadNcms = useCallback(async () => {
    setIsLoading(true);
    try {
      const filters: { active?: boolean; q?: string } = {};
      if (appliedSearch.trim()) {
        filters.q = appliedSearch.trim();
      }
      if (activeFilter === 'true') {
        filters.active = true;
      } else if (activeFilter === 'false') {
        filters.active = false;
      }

      const data = await fetchFiscalNcms(filters);
      setNcms(data);
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
  }, [activeFilter, appliedSearch, router, toast]);

  useEffect(() => {
    loadNcms();
  }, [loadNcms]);

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
      cell: ({ row }) => formatNcmDisplay(row.original.code),
    },
    {
      accessorKey: 'description',
      header: 'Descrição',
    },
    {
      id: 'cest_codes',
      header: 'CEST',
      cell: ({ row }) => {
        const codes = row.original.cest_codes;
        if (!codes || codes.length === 0) return <Text color="gray.400">-</Text>;
        return (
          <Wrap>
            {codes.map((code) => (
              <WrapItem key={code}>
                <Tag size="sm" colorScheme="blue">
                  {code}
                </Tag>
              </WrapItem>
            ))}
          </Wrap>
        );
      },
    },
    {
      accessorKey: 'effective_from',
      header: 'Vigência',
      cell: ({ row }) => formatDate(row.original.effective_from),
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
            aria-label={row.original.active ? 'Desativar NCM' : 'Ativar NCM'}
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
          onImported={loadNcms}
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
                      setAppliedSearch(searchInput);
                    }
                  }}
                />
                <InputRightElement width="auto" pr={1}>
                  <Button
                    colorScheme="blue"
                    size="sm"
                    leftIcon={<SearchIcon />}
                    onClick={() => setAppliedSearch(searchInput)}
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
              <DataTable columns={columns} data={ncms} />
            )}
          </CardBody>
        </Card>
      </VStack>
    </Box>
  );
}
