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

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  sector_id?: string;
  sector?: {
    id: string;
    name: string;
    location: {
      id: string;
      name: string;
    };
  };
}

interface Sector {
  id: string;
  name: string;
  location: {
    id: string;
    name: string;
  };
}

export default function UserManagement() {
  const [users, setUsers] = useState<User[]>([]);
  const [sectors, setSectors] = useState<Sector[]>([]);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('EMPLOYEE');
  const [sector_id, setSectorId] = useState('');
  const [loading, setLoading] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
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
    fetchUsers();
    fetchSectors();
  }, []);

  const fetchUsers = async () => {
    try {
      const token = localStorage.getItem('@ti-assistant:token');
      if (!token) throw new Error('Token não encontrado');

      const response = await fetch('/api/users', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.status === 429) {
        router.push('/rate-limit');
        return;
      }

      if (!response.ok) throw new Error('Erro ao carregar usuários');
      const data = await response.json();
      setUsers(data);
    } catch (error) {
      toast({
        title: 'Erro',
        description: 'Não foi possível carregar os usuários',
        status: 'error',
        duration: 3000,
      });
    }
  };

  const fetchSectors = async () => {
    try {
      const token = localStorage.getItem('@ti-assistant:token');
      if (!token) throw new Error('Token não encontrado');

      const response = await fetch('/api/sectors', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.status === 429) {
        router.push('/rate-limit');
        return;
      }

      if (!response.ok) throw new Error('Erro ao carregar setores');
      const data = await response.json();
      setSectors(data);
    } catch (error) {
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
      const token = localStorage.getItem('@ti-assistant:token');
      if (!token) throw new Error('Token não encontrado');

      const response = await fetch('/api/users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ name, email, password, role, sector_id })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Erro ao criar usuário');
      }

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
      fetchUsers();
    } catch (error) {
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
      const token = localStorage.getItem('@ti-assistant:token');
      if (!token) throw new Error('Token não encontrado');

      const response = await fetch(`/api/users/${userId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.message || 'Erro ao desativar usuário');
      }

      toast({
        title: 'Sucesso',
        description: 'Usuário desativado com sucesso',
        status: 'success',
        duration: 3000,
      });

      fetchUsers();
    } catch (error) {
      toast({
        title: 'Erro',
        description: 'Não foi possível excluir o usuário',
        status: 'error',
        duration: 3000,
      });
    }
  };

  const handleEdit = (user: User) => {
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
      const token = localStorage.getItem('@ti-assistant:token');
      if (!token) throw new Error('Token não encontrado');

      const updateData: any = {
        name: editName,
        email: editEmail,
        role: editRole,
      };

      // Só incluir sector_id se não estiver vazio
      if (editSectorId && editSectorId.trim() !== '') {
        updateData.sector_id = editSectorId;
      } else {
        updateData.sector_id = null;
      }

      if (changePassword && editPassword) {
        updateData.password = editPassword;
      }

      const response = await fetch(`/api/users/${editingUser!.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(updateData)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Erro ao atualizar usuário');
      }

      toast({
        title: 'Sucesso',
        description: 'Usuário atualizado com sucesso',
        status: 'success',
        duration: 3000,
      });

      onEditModalClose();
      fetchUsers();
    } catch (error) {
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
                <Td>{user.sector ? `${user.sector.name} - ${user.sector.location.name}` : '-'}</Td>
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
                      {sector.name} - {sector.location.name}
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
                        {sector.name} - {sector.location.name}
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