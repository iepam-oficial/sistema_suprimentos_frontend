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
  Textarea,
  FormControl,
  FormLabel,
  FormHelperText,
  IconButton,
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
  Icon,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalCloseButton,
  ModalFooter,
  useDisclosure,
  useToast,
} from '@chakra-ui/react';
import { SearchIcon } from '@chakra-ui/icons';
import { MoreVertical } from 'lucide-react';
import { DataTable } from '@/components/data-table';
import { ColumnDef } from '@tanstack/react-table';
import {
  fetchChartOfAccounts as loadChartOfAccounts,
  createChartOfAccount,
  updateChartOfAccount,
  deleteChartOfAccount,
} from '@/features/financeiro/api/chartOfAccountApi';
import type { ChartOfAccount, ChartOfAccountType } from '@/features/financeiro/types';
import { RateLimitError } from '@/features/financeiro/api/extraExpenseApi';

const TIPOS: ChartOfAccountType[] = ['ATIVO', 'PASSIVO', 'PATRIMONIO', 'RECEITA', 'DESPESA'];

const emptyFormData = {
  codigo: '',
  nome: '',
  tipo: 'ATIVO' as ChartOfAccountType,
  descricao: '',
};

export default function ChartOfAccountsPage() {
  const [allChartOfAccounts, setAllChartOfAccounts] = useState<ChartOfAccount[]>([]);
  const [filteredChartOfAccounts, setFilteredChartOfAccounts] = useState<ChartOfAccount[]>([]);
  const [search, setSearch] = useState('');
  const [tipoFilter, setTipoFilter] = useState<string>('');
  const [editingAccount, setEditingAccount] = useState<ChartOfAccount | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState(emptyFormData);
  const router = useRouter();
  const toast = useToast();
  const { isOpen: isModalOpen, onOpen: onModalOpen, onClose: onModalClose } = useDisclosure();

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
        <Menu>
          <MenuButton
            as={IconButton}
            aria-label="Mais opções"
            icon={<Icon as={MoreVertical} sx={{ '& svg': { stroke: 'currentColor' } }} />}
            variant="ghost"
            size="sm"
          />
          <MenuList>
            <MenuItem onClick={() => handleEdit(row.original)}>Editar</MenuItem>
            <MenuItem onClick={() => handleDelete(row.original.id)} color="red.500">
              Excluir
            </MenuItem>
          </MenuList>
        </Menu>
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

  const handleCreate = () => {
    setEditingAccount(null);
    setFormData(emptyFormData);
    onModalOpen();
  };

  const handleEdit = (account: ChartOfAccount) => {
    setEditingAccount(account);
    setFormData({
      codigo: account.codigo,
      nome: account.nome,
      tipo: account.tipo,
      descricao: account.descricao || '',
    });
    onModalOpen();
  };

  const handleModalClose = () => {
    setEditingAccount(null);
    setFormData(emptyFormData);
    onModalClose();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      if (editingAccount) {
        await updateChartOfAccount(editingAccount.id, {
          codigo: formData.codigo,
          nome: formData.nome,
          tipo: formData.tipo,
          descricao: formData.descricao || null,
        });

        toast({
          title: 'Sucesso',
          description: 'Plano de conta atualizado com sucesso.',
          status: 'success',
          duration: 3000,
          isClosable: true,
        });
      } else {
        await createChartOfAccount({
          codigo: formData.codigo,
          nome: formData.nome,
          tipo: formData.tipo,
          descricao: formData.descricao || null,
        });

        toast({
          title: 'Sucesso',
          description: 'Plano de conta criado com sucesso.',
          status: 'success',
          duration: 3000,
          isClosable: true,
        });
      }

      handleModalClose();
      fetchChartOfAccounts();
    } catch (error) {
      if (error instanceof RateLimitError) {
        router.push('/rate-limit');
        return;
      }
      toast({
        title: 'Erro',
        description: error instanceof Error ? error.message : 'Não foi possível salvar o plano de conta.',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Tem certeza que deseja excluir este plano de conta?')) {
      return;
    }

    try {
      await deleteChartOfAccount(id);

      toast({
        title: 'Sucesso',
        description: 'Plano de conta excluído com sucesso.',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });

      fetchChartOfAccounts();
    } catch (error) {
      if (error instanceof RateLimitError) {
        router.push('/rate-limit');
        return;
      }
      toast({
        title: 'Erro',
        description: error instanceof Error ? error.message : 'Não foi possível excluir o plano de conta.',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    }
  };

  const codigoLocked = Boolean(editingAccount?.has_links);

  return (
    <Box p={4}>
      <VStack spacing={4} align="stretch">
        <HeaderRow onCreate={handleCreate} />

        {allChartOfAccounts.length === 0 ? (
          <Card>
            <CardBody>
              <VStack spacing={4} py={10}>
                <Text fontSize="lg" fontWeight="medium">
                  Nenhum plano de conta cadastrado
                </Text>
                <Text color="gray.500">
                  Cadastre o primeiro plano de conta para começar a organizar suas finanças.
                </Text>
                <Button colorScheme="blue" onClick={handleCreate}>
                  Cadastrar plano de conta
                </Button>
              </VStack>
            </CardBody>
          </Card>
        ) : (
          <>
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
                    {TIPOS.map((tipo) => (
                      <option key={tipo} value={tipo}>{tipo}</option>
                    ))}
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
          </>
        )}
      </VStack>

      <Modal isOpen={isModalOpen} onClose={handleModalClose}>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>
            {editingAccount ? 'Editar Plano de Conta' : 'Nova Conta'}
          </ModalHeader>
          <ModalCloseButton />
          <form onSubmit={handleSubmit}>
            <ModalBody>
              <VStack spacing={4}>
                <FormControl isRequired isDisabled={codigoLocked}>
                  <FormLabel>Código</FormLabel>
                  <Input
                    value={formData.codigo}
                    onChange={(e) => setFormData({ ...formData, codigo: e.target.value })}
                    placeholder="Ex: 1.1.01"
                  />
                  {codigoLocked && (
                    <FormHelperText>
                      O código não pode ser alterado enquanto houver vínculos.
                    </FormHelperText>
                  )}
                </FormControl>
                <FormControl isRequired>
                  <FormLabel>Nome</FormLabel>
                  <Input
                    value={formData.nome}
                    onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                    placeholder="Ex: Caixa, Fornecedores"
                  />
                </FormControl>
                <FormControl isRequired>
                  <FormLabel>Tipo</FormLabel>
                  <Select
                    value={formData.tipo}
                    onChange={(e) => setFormData({ ...formData, tipo: e.target.value as ChartOfAccountType })}
                  >
                    {TIPOS.map((tipo) => (
                      <option key={tipo} value={tipo}>{tipo}</option>
                    ))}
                  </Select>
                </FormControl>
                <FormControl>
                  <FormLabel>Descrição</FormLabel>
                  <Textarea
                    value={formData.descricao}
                    onChange={(e) => setFormData({ ...formData, descricao: e.target.value })}
                    placeholder="Descrição opcional"
                    rows={3}
                  />
                </FormControl>
              </VStack>
            </ModalBody>
            <ModalFooter>
              <Button variant="ghost" mr={3} onClick={handleModalClose}>
                Cancelar
              </Button>
              <Button colorScheme="blue" type="submit" isLoading={isSubmitting}>
                {editingAccount ? 'Atualizar' : 'Criar'}
              </Button>
            </ModalFooter>
          </form>
        </ModalContent>
      </Modal>
    </Box>
  );
}

function HeaderRow({ onCreate }: { onCreate: () => void }) {
  return (
    <Box display="flex" alignItems="center" justifyContent="space-between">
      <Heading size="lg">Planos de Conta</Heading>
      <Button colorScheme="blue" onClick={onCreate}>
        Novo
      </Button>
    </Box>
  );
}
