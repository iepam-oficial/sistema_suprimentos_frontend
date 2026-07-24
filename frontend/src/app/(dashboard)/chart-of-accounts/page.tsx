'use client';

import { useEffect, useState } from 'react';
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
  Alert,
  AlertIcon,
} from '@chakra-ui/react';
import { SearchIcon } from '@chakra-ui/icons';
import { DataTable } from '@/components/data-table';
import { ColumnDef } from '@tanstack/react-table';
import { fetchChartOfAccounts as loadChartOfAccounts } from '@/features/financeiro/api/chartOfAccountApi';
import type { ChartOfAccount } from '@/features/financeiro/types';
import { RateLimitError } from '@/features/financeiro/api/extraExpenseApi';

export default function ChartOfAccountsPage() {
  const [allChartOfAccounts, setAllChartOfAccounts] = useState<ChartOfAccount[]>([]);
  const [filteredChartOfAccounts, setFilteredChartOfAccounts] = useState<ChartOfAccount[]>([]);
  const [search, setSearch] = useState('');
  const [tipoFilter, setTipoFilter] = useState<string>('');
  const router = useRouter();

  const getTipoColor = (tipo: string) => {
    const colors: Record<string, string> = {
      ATIVO: 'green',
      PASSIVO: 'red',
      PATRIMONIO: 'blue',
      RECEITA: 'purple',
      DESPESA: 'orange',
    };
    return colors[tipo] || 'gray';
  };

  const columns: ColumnDef<ChartOfAccount>[] = [
    {
      accessorKey: 'codigo',
      header: 'Código',
    },
    {
      accessorKey: 'nome',
      header: 'Nome',
    },
    {
      accessorKey: 'tipo',
      header: 'Tipo',
      cell: ({ row }) => (
        <Badge colorScheme={getTipoColor(row.original.tipo)}>
          {row.original.tipo}
        </Badge>
      ),
    },
  ];

  useEffect(() => {
    fetchChartOfAccounts();
  }, []);

  useEffect(() => {
    let filtered = allChartOfAccounts;

    if (tipoFilter) {
      filtered = filtered.filter(account => account.tipo === tipoFilter);
    }

    if (search) {
      filtered = filtered.filter(account =>
        account.codigo.toLowerCase().includes(search.toLowerCase()) ||
        account.nome.toLowerCase().includes(search.toLowerCase())
      );
    }

    setFilteredChartOfAccounts(filtered);
  }, [search, tipoFilter, allChartOfAccounts]);

  const fetchChartOfAccounts = async () => {
    try {
      const data = await loadChartOfAccounts();
      setAllChartOfAccounts(data);
      setFilteredChartOfAccounts(data);
    } catch (error) {
      if (error instanceof RateLimitError) {
        router.push('/rate-limit');
        return;
      }
      console.error('Erro:', error);
    }
  };

  return (
    <Box p={4}>
      <VStack spacing={4} align="stretch">
        <Heading size="lg">Planos de Conta</Heading>

        <Alert status="info">
          <AlertIcon />
          <Text>
            Plano de contas gerenciado no sistema financeiro. Esta tela é somente leitura;
            cadastro e alterações devem ser feitos no sistema de gestão financeira.
          </Text>
        </Alert>

        <Card>
          <CardHeader>
            <Heading size="md">Buscar e Filtrar</Heading>
          </CardHeader>
          <CardBody>
            <VStack spacing={4}>
              <InputGroup>
                <Input
                  placeholder="Buscar por código ou nome..."
                  value={search}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearch(e.target.value)}
                />
                <InputRightElement>
                  <Button
                    colorScheme="blue"
                    size="sm"
                    leftIcon={<SearchIcon />}
                  >
                    Buscar
                  </Button>
                </InputRightElement>
              </InputGroup>
              <Select
                placeholder="Filtrar por tipo"
                value={tipoFilter}
                onChange={(e) => setTipoFilter(e.target.value)}
                maxW="300px"
              >
                <option value="ATIVO">ATIVO</option>
                <option value="PASSIVO">PASSIVO</option>
                <option value="PATRIMONIO">PATRIMONIO</option>
                <option value="RECEITA">RECEITA</option>
                <option value="DESPESA">DESPESA</option>
              </Select>
            </VStack>
          </CardBody>
        </Card>

        <Card>
          <CardHeader>
            <Heading size="md">Lista de Planos de Conta</Heading>
          </CardHeader>
          <CardBody>
            <DataTable columns={columns} data={filteredChartOfAccounts} />
          </CardBody>
        </Card>
      </VStack>
    </Box>
  );
}
