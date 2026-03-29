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
  HStack,
  IconButton,
  Select,
  Badge,
} from '@chakra-ui/react';
import { SearchIcon, EditIcon, DeleteIcon } from '@chakra-ui/icons';
import { DataTable } from '@/components/data-table';
import { ColumnDef } from '@tanstack/react-table';
import { ChartOfAccount } from '@/utils/apiUtils';

export default function ChartOfAccountsPage() {
  const [allChartOfAccounts, setAllChartOfAccounts] = useState<ChartOfAccount[]>([]);
  const [filteredChartOfAccounts, setFilteredChartOfAccounts] = useState<ChartOfAccount[]>([]);
  const [search, setSearch] = useState('');
  const [tipoFilter, setTipoFilter] = useState<string>('');
  const router = useRouter();

  const handleEdit = (chartOfAccount: ChartOfAccount) => {
    router.push(`/chart-of-accounts/edit/${chartOfAccount.id}`);
  };

  const handleDelete = async (id: string) => {
    if (confirm('Tem certeza que deseja excluir este plano de conta?')) {
      try {
        const token = localStorage.getItem('@ti-assistant:token');
        const response = await fetch(`/api/chart-of-accounts/${id}`, {
          method: 'DELETE',
          headers: { Authorization: `Bearer ${token}` },
        });

        if (response.status === 429) {
          router.push('/rate-limit');
          return;
        }

        if (response.ok) {
          fetchChartOfAccounts();
        } else {
          const errorData = await response.json().catch(() => ({ error: 'Erro ao excluir plano de conta' }));
          alert(errorData.error || errorData.message || 'Erro ao excluir plano de conta');
        }
      } catch (error) {
        console.error('Erro ao excluir:', error);
        alert('Erro ao excluir plano de conta');
      }
    }
  };

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
    {
      id: 'actions',
      header: 'Ações',
      cell: ({ row }) => (
        <HStack spacing={2}>
          <IconButton
            aria-label="Editar plano de conta"
            icon={<EditIcon />}
            size="sm"
            onClick={() => handleEdit(row.original)}
          />
          <IconButton
            aria-label="Excluir plano de conta"
            icon={<DeleteIcon />}
            size="sm"
            colorScheme="red"
            onClick={() => handleDelete(row.original.id)}
          />
        </HStack>
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
      const token = localStorage.getItem('@ti-assistant:token');
      if (!token) {
        throw new Error('Token não encontrado');
      }

      const response = await fetch('/api/chart-of-accounts', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.status === 429) {
        router.push('/rate-limit');
        return;
      }

      if (!response.ok) throw new Error('Erro ao carregar planos de conta');
      const data = await response.json();
      setAllChartOfAccounts(data);
      setFilteredChartOfAccounts(data);
    } catch (error) {
      console.error('Erro:', error);
    }
  };

  return (
    <Box p={4}>
      <VStack spacing={4} align="stretch">
        <Box display="flex" justifyContent="space-between" alignItems="center">
          <Heading size="lg">Planos de Conta</Heading>
          <Button colorScheme="blue" onClick={() => router.push('/chart-of-accounts/add')}>
            Adicionar Plano de Conta
          </Button>
        </Box>

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

