import { useState, useEffect } from 'react';
import {
  Box,
  Button,
  FormControl,
  FormLabel,
  Input,
  InputGroup,
  InputLeftElement,
  Select,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  useToast,
  IconButton,
  useColorModeValue,
  VStack,
  HStack,
  Text,
  useDisclosure,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalCloseButton,
  ModalFooter,
  Checkbox,
} from '@chakra-ui/react';
import { Mail, Lock, User, Trash2, Edit } from 'lucide-react';
import { useRouter } from 'next/navigation';
import {
  fetchSectors,
  RateLimitError,
  type SectorDTO,
} from '@/features/reference-data';
import {
  createUser,
  deleteUser,
  fetchUsers,
  RateLimitError as UserRateLimitError,
  updateUser,
  useAuthSession,
  type UserDetailDTO,
} from '@/features/identity';

export default function UserManagement() {
  const { token } = useAuthSession();
  const [users, setUsers] = useState<UserDetailDTO[]>([]);
  const [sectors, setSectors] = useState<SectorDTO[]>([]);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('EMPLOYEE');
  const [sector_id, setSectorId] = useState('');
  const [loading, setLoading] = useState(false);
  const [editingUser, setEditingUser] = useState<UserDetailDTO | null>(null);
  const [editName, setEditName] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [editRole, setEditRole] = useState('EMPLOYEE');
  const [editSectorId, setEditSectorId] = useState('');
  const [editPassword, setEditPassword] = useState('');
  const [changePassword, setChangePassword] = useState(false);
  const [editLoading, setEditLoading] = useState(false);
  const toast = useToast();
  const { isOpen: isEditModalOpen, onOpen: onEditModalOpen, onClose: onEditModalClose } = useDisclosure();
  const { isOpen: isCreateModalOpen, onOpen: onCreateModalOpen, onClose: onCreateModalClose } = useDisclosure();
  const router = useRouter();
  const bgColor = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.700');

  useEffect(() => {
    loadUsers();
    loadSectors();
  }, [token]);

  const loadUsers = async () => {
    try {
      if (!token) throw new Error('Token não encontrado');
      const data = await fetchUsers(token);
      setUsers(data);
    } catch (error) {
      if (error instanceof UserRateLimitError) {
        router.push('/rate-limit');
        return;
      }
      toast({
        title: 'Erro',
        description: 'Não foi possível carregar os usuários',
        status: 'error',
        duration: 3000,
      });
    }
  };

  const loadSectors = async () => {
    try {
      if (!token) throw new Error('Token não encontrado');

      const data = await fetchSectors(token);
      setSectors(data);
    } catch (error) {
      if (error instanceof RateLimitError) {
        router.push('/rate-limit');
        return;
      }
      toast({
        title: 'Erro',
        description: 'Não foi possível carregar os setores',
        status: 'error',
        duration: 3000,
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (!token) throw new Error('Token não encontrado');

      await createUser(token, { name, email, password, role, sector_id });

      toast({
        title: 'Sucesso',
        description: 'Usuário criado com sucesso',
        status: 'success',
        duration: 3000,
      });

      // Limpar formulário
      setName('');
      setEmail('');
      setPassword('');
      setRole('EMPLOYEE');
      setSectorId('');

      // Fechar modal e recarregar lista
      onCreateModalClose();
      loadUsers();
    } catch (error) {
      if (error instanceof UserRateLimitError) {
        router.push('/rate-limit');
        return;
      }
      toast({
        title: 'Erro',
        description: error instanceof Error ? error.message : 'Erro ao criar usuário',
        status: 'error',
        duration: 3000,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (userId: string) => {
    if (!confirm('Tem certeza que deseja desativar este usuário?')) return;

    try {
      if (!token) throw new Error('Token não encontrado');
      await deleteUser(token, userId);

      toast({
        title: 'Sucesso',
        description: 'Usuário desativado com sucesso',
        status: 'success',
        duration: 3000,
      });

      loadUsers();
    } catch (error) {
      if (error instanceof UserRateLimitError) {
        router.push('/rate-limit');
        return;
      }
      toast({
        title: 'Erro',
        description: 'Não foi possível excluir o usuário',
        status: 'error',
        duration: 3000,
      });
    }
  };

  const handleEdit = (user: UserDetailDTO) => {
    setEditingUser(user);
    setEditName(user.name);
    setEditEmail(user.email);
    setEditRole(user.role);
    setEditSectorId(user.sector_id || '');
    setEditPassword('');
    setChangePassword(false);
    onEditModalOpen();
  };

  const handleUpdateUser = async () => {
    setEditLoading(true);

    try {
      if (!token) throw new Error('Token não encontrado');

      await updateUser(token, editingUser!.id, {
        name: editName,
        email: editEmail,
        role: editRole,
        sector_id: editSectorId && editSectorId.trim() !== '' ? editSectorId : null,
        ...(changePassword && editPassword ? { password: editPassword } : {}),
      });

      toast({
        title: 'Sucesso',
        description: 'Usuário atualizado com sucesso',
        status: 'success',
        duration: 3000,
      });

      onEditModalClose();
      loadUsers();
    } catch (error) {
      if (error instanceof UserRateLimitError) {
        router.push('/rate-limit');
        return;
      }
      toast({
        title: 'Erro',
        description: error instanceof Error ? error.message : 'Erro ao atualizar usuário',
        status: 'error',
        duration: 3000,
      });
    } finally {
      setEditLoading(false);
    }
  };

  const getRoleText = (role: string) => {
    const roles = {
      ADMIN: 'Administrador',
      MANAGER: 'Gerente',
      EMPLOYEE: 'Funcionário',
      SUPPORT: 'Suporte',
      TECHNICIAN: 'Técnico',
      ORGANIZER: 'Organizador'
    };
    return roles[role as keyof typeof roles] || role;
  };

  return (
    <VStack spacing={6} align="stretch">
      <Box
        p={6}
        borderWidth="1px"
        borderRadius="lg"
        borderColor={borderColor}
        bg={bgColor}
      >
        <HStack justify="space-between" align="center">
          <Text fontSize="lg" fontWeight="medium">Gerenciamento de Usuários</Text>
          <Button
            colorScheme="blue"
            leftIcon={<User size={16} />}
            onClick={onCreateModalOpen}
          >
            Adicionar Usuário
          </Button>
        </HStack>
      </Box>

      <Box
        borderWidth="1px"
        borderRadius="lg"
        borderColor={borderColor}
        bg={bgColor}
        overflowX="auto"
      >
        <Table variant="simple">
          <Thead>
            <Tr>
              <Th>Nome</Th>
              <Th>E-mail</Th>
              <Th>Função</Th>
              <Th>Setor</Th>
              <Th width="120px">Ações</Th>
            </Tr>
          </Thead>
          <Tbody>
            {users.map((user) => (
              <Tr key={user.id}>
                <Td>{user.name}</Td>
                <Td>{user.email}</Td>
                <Td>{getRoleText(user.role)}</Td>
                <Td>{user.sector ? `${user.sector.name} - ${user.sector.location?.name ?? '-'}` : '-'}</Td>
                <Td>
                  <HStack spacing={2}>
                    <IconButton
                      aria-label="Editar usuário"
                      icon={<Edit size={16} />}
                      colorScheme="blue"
                      variant="ghost"
                      size="sm"
                      onClick={() => handleEdit(user)}
                    />
                    <IconButton
                      aria-label="Excluir usuário"
                      icon={<Trash2 size={16} />}
                      colorScheme="red"
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDelete(user.id)}
                    />
                  </HStack>
                </Td>
              </Tr>
            ))}
          </Tbody>
        </Table>
      </Box>

      {/* Modal de Edição */}
      <Modal isOpen={isEditModalOpen} onClose={onEditModalClose} size="lg">
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Editar Usuário</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
        <VStack spacing={4}>
              <FormControl isRequired>
                <FormLabel>Nome</FormLabel>
                <InputGroup>
                  <InputLeftElement pointerEvents="none">
                    <User size={16} />
                  </InputLeftElement>
                  <Input
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    placeholder="Nome completo"
                  />
                </InputGroup>
              </FormControl>

              <FormControl isRequired>
                <FormLabel>E-mail</FormLabel>
                <InputGroup>
                  <InputLeftElement pointerEvents="none">
                    <Mail size={16} />
                  </InputLeftElement>
                  <Input
                    type="email"
                    value={editEmail}
                    onChange={(e) => setEditEmail(e.target.value)}
                    placeholder="E-mail"
                  />
                </InputGroup>
              </FormControl>

              <FormControl isRequired>
                <FormLabel>Função</FormLabel>
                <Select value={editRole} onChange={(e) => setEditRole(e.target.value)}>
                  <option value="ADMIN">Administrador</option>
                  <option value="MANAGER">Gerente</option>
                  <option value="EMPLOYEE">Funcionário</option>
                  <option value="SUPPORT">Suporte</option>
                  <option value="TECHNICIAN">Técnico</option>
                  <option value="ORGANIZER">Organizador</option>
                </Select>
              </FormControl>

              <FormControl>
                <FormLabel>Setor (Opcional)</FormLabel>
                <Select 
                  value={editSectorId} 
                  onChange={(e) => setEditSectorId(e.target.value)}
                  placeholder="Selecione um setor"
                >
                  {sectors.map((sector) => (
                    <option key={sector.id} value={sector.id}>
                      {sector.name} - {sector.location?.name ?? '-'}
                    </option>
                  ))}
                </Select>
              </FormControl>

              <FormControl>
                <Checkbox 
                  isChecked={changePassword} 
                  onChange={(e) => setChangePassword(e.target.checked)}
                >
                  Alterar senha
                </Checkbox>
              </FormControl>

              {changePassword && (
                <FormControl isRequired>
                  <FormLabel>Nova Senha</FormLabel>
                  <InputGroup>
                    <InputLeftElement pointerEvents="none">
                      <Lock size={16} />
                    </InputLeftElement>
                    <Input
                      type="password"
                      value={editPassword}
                      onChange={(e) => setEditPassword(e.target.value)}
                      placeholder="Nova senha"
                    />
                  </InputGroup>
                </FormControl>
              )}
            </VStack>
          </ModalBody>

          <ModalFooter>
            <Button variant="ghost" mr={3} onClick={onEditModalClose}>
              Cancelar
            </Button>
            <Button 
              colorScheme="blue" 
              onClick={handleUpdateUser}
              isLoading={editLoading}
            >
              Salvar Alterações
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* Modal de Criação */}
      <Modal isOpen={isCreateModalOpen} onClose={onCreateModalClose} size="lg">
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Adicionar Novo Usuário</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <Box as="form" onSubmit={handleSubmit}>
              <VStack spacing={4}>
          <FormControl isRequired>
            <FormLabel>Nome</FormLabel>
            <InputGroup>
              <InputLeftElement pointerEvents="none">
                <User size={16} />
              </InputLeftElement>
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Nome completo"
              />
            </InputGroup>
          </FormControl>

          <FormControl isRequired>
            <FormLabel>E-mail</FormLabel>
            <InputGroup>
              <InputLeftElement pointerEvents="none">
                <Mail size={16} />
              </InputLeftElement>
              <Input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="E-mail"
              />
            </InputGroup>
          </FormControl>

          <FormControl isRequired>
            <FormLabel>Senha</FormLabel>
            <InputGroup>
              <InputLeftElement pointerEvents="none">
                <Lock size={16} />
              </InputLeftElement>
              <Input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Senha"
              />
            </InputGroup>
          </FormControl>

          <FormControl isRequired>
            <FormLabel>Função</FormLabel>
            <Select value={role} onChange={(e) => setRole(e.target.value)}>
              <option value="ADMIN">Administrador</option>
              <option value="MANAGER">Gerente</option>
              <option value="EMPLOYEE">Funcionário</option>
              <option value="SUPPORT">Suporte</option>
              <option value="TECHNICIAN">Técnico</option>
              <option value="ORGANIZER">Organizador</option>
            </Select>
          </FormControl>

                <FormControl>
                  <FormLabel>Setor (Opcional)</FormLabel>
                  <Select 
                    value={sector_id} 
                    onChange={(e) => setSectorId(e.target.value)}
                    placeholder="Selecione um setor"
                  >
                    {sectors.map((sector) => (
                      <option key={sector.id} value={sector.id}>
                        {sector.name} - {sector.location?.name ?? '-'}
                      </option>
                    ))}
                  </Select>
                </FormControl>
              </VStack>
            </Box>
          </ModalBody>

          <ModalFooter>
            <Button variant="ghost" mr={3} onClick={onCreateModalClose}>
              Cancelar
            </Button>
          <Button
            colorScheme="blue"
              onClick={handleSubmit}
            isLoading={loading}
          >
            Adicionar Usuário
          </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </VStack>
  );
} 