import { useRef, useState, useEffect } from 'react';
import {
  Alert,
  AlertDescription,
  AlertDialog,
  AlertDialogBody,
  AlertDialogContent,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogOverlay,
  Box,
  Button,
  FormControl,
  FormLabel,
  FormErrorMessage,
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
  CheckboxGroup,
  SimpleGrid,
} from '@chakra-ui/react';
import { Mail, Lock, User, Trash2, Edit } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { UserRole, type UserRole as UserRoleType } from '@ti-assistant/contracts';
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
import { hasRiskyRoleCombo } from './roleComboRisk';

const ALL_ROLES = Object.values(UserRole) as UserRoleType[];

const ROLE_LABELS: Record<UserRoleType, string> = {
  ADMIN: 'Administrador',
  MANAGER: 'Gerente',
  COORDINATOR: 'Coordenador',
  DIRECTOR: 'Diretor',
  EMPLOYEE: 'Funcionário',
  SUPPORT: 'Suporte',
  TECHNICIAN: 'Técnico',
  ORGANIZER: 'Organizador',
};

const ROLES_UNION_DISCLAIMER =
  'Este usuário terá a união das permissões das funções selecionadas.';

function getRoleText(role: string): string {
  return ROLE_LABELS[role as UserRoleType] || role;
}

function formatRolesList(roles: readonly string[] | undefined): string {
  if (!roles?.length) return '-';
  return roles.map(getRoleText).join(', ');
}

function RolesUnionDisclaimer({ visible }: { visible: boolean }) {
  if (!visible) return null;
  return (
    <Alert status="info" variant="subtle" borderRadius="md" mt={2} py={2}>
      <AlertDescription fontSize="sm">{ROLES_UNION_DISCLAIMER}</AlertDescription>
    </Alert>
  );
}

type PendingSave = 'create' | 'edit' | null;

export default function UserManagement() {
  const { token } = useAuthSession();
  const [users, setUsers] = useState<UserDetailDTO[]>([]);
  const [sectors, setSectors] = useState<SectorDTO[]>([]);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [roles, setRoles] = useState<UserRoleType[]>([UserRole.EMPLOYEE]);
  const [sector_id, setSectorId] = useState('');
  const [loading, setLoading] = useState(false);
  const [editingUser, setEditingUser] = useState<UserDetailDTO | null>(null);
  const [editName, setEditName] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [editRoles, setEditRoles] = useState<UserRoleType[]>([UserRole.EMPLOYEE]);
  const [editSectorId, setEditSectorId] = useState('');
  const [editPassword, setEditPassword] = useState('');
  const [changePassword, setChangePassword] = useState(false);
  const [editLoading, setEditLoading] = useState(false);
  const [pendingSave, setPendingSave] = useState<PendingSave>(null);
  const toast = useToast();
  const { isOpen: isEditModalOpen, onOpen: onEditModalOpen, onClose: onEditModalClose } = useDisclosure();
  const { isOpen: isCreateModalOpen, onOpen: onCreateModalOpen, onClose: onCreateModalClose } = useDisclosure();
  const {
    isOpen: isRiskConfirmOpen,
    onOpen: onRiskConfirmOpen,
    onClose: onRiskConfirmClose,
  } = useDisclosure();
  const riskCancelRef = useRef<HTMLButtonElement>(null);
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

  const performCreate = async () => {
    setLoading(true);

    try {
      if (!token) throw new Error('Token não encontrado');

      await createUser(token, { name, email, password, roles, sector_id });

      toast({
        title: 'Sucesso',
        description: 'Usuário criado com sucesso',
        status: 'success',
        duration: 3000,
      });

      setName('');
      setEmail('');
      setPassword('');
      setRoles([UserRole.EMPLOYEE]);
      setSectorId('');

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

  const performUpdate = async () => {
    setEditLoading(true);

    try {
      if (!token) throw new Error('Token não encontrado');

      await updateUser(token, editingUser!.id, {
        name: editName,
        email: editEmail,
        roles: editRoles,
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (roles.length === 0) {
      toast({
        title: 'Erro',
        description: 'Selecione pelo menos uma função',
        status: 'error',
        duration: 3000,
      });
      return;
    }

    if (hasRiskyRoleCombo(roles)) {
      setPendingSave('create');
      onRiskConfirmOpen();
      return;
    }

    await performCreate();
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
    setEditRoles(user.roles?.length ? [...user.roles] : [UserRole.EMPLOYEE]);
    setEditSectorId(user.sector_id || '');
    setEditPassword('');
    setChangePassword(false);
    onEditModalOpen();
  };

  const handleUpdateUser = async () => {
    if (editRoles.length === 0) {
      toast({
        title: 'Erro',
        description: 'Selecione pelo menos uma função',
        status: 'error',
        duration: 3000,
      });
      return;
    }

    if (hasRiskyRoleCombo(editRoles)) {
      setPendingSave('edit');
      onRiskConfirmOpen();
      return;
    }

    await performUpdate();
  };

  const handleRiskConfirmClose = () => {
    setPendingSave(null);
    onRiskConfirmClose();
  };

  const handleRiskConfirmSave = async () => {
    const action = pendingSave;
    handleRiskConfirmClose();
    if (action === 'create') {
      await performCreate();
    } else if (action === 'edit') {
      await performUpdate();
    }
  };

  const rolesInvalid = roles.length === 0;
  const editRolesInvalid = editRoles.length === 0;
  const createRolesRisky = hasRiskyRoleCombo(roles);
  const editRolesRisky = hasRiskyRoleCombo(editRoles);

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
              <Th>Funções</Th>
              <Th>Setor</Th>
              <Th width="120px">Ações</Th>
            </Tr>
          </Thead>
          <Tbody>
            {users.map((user) => (
              <Tr key={user.id}>
                <Td>{user.name}</Td>
                <Td>{user.email}</Td>
                <Td>{formatRolesList(user.roles)}</Td>
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

              <FormControl isRequired isInvalid={editRolesInvalid}>
                <FormLabel>Funções</FormLabel>
                <CheckboxGroup
                  value={editRoles}
                  onChange={(values) => setEditRoles(values as UserRoleType[])}
                >
                  <SimpleGrid columns={{ base: 1, sm: 2 }} spacing={2}>
                    {ALL_ROLES.map((role) => (
                      <Checkbox key={role} value={role}>
                        {ROLE_LABELS[role]}
                      </Checkbox>
                    ))}
                  </SimpleGrid>
                </CheckboxGroup>
                <FormErrorMessage>Selecione pelo menos uma função</FormErrorMessage>
                <RolesUnionDisclaimer visible={editRolesRisky} />
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
              isDisabled={editRolesInvalid}
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

                <FormControl isRequired isInvalid={rolesInvalid}>
                  <FormLabel>Funções</FormLabel>
                  <CheckboxGroup
                    value={roles}
                    onChange={(values) => setRoles(values as UserRoleType[])}
                  >
                    <SimpleGrid columns={{ base: 1, sm: 2 }} spacing={2}>
                      {ALL_ROLES.map((role) => (
                        <Checkbox key={role} value={role}>
                          {ROLE_LABELS[role]}
                        </Checkbox>
                      ))}
                    </SimpleGrid>
                  </CheckboxGroup>
                  <FormErrorMessage>Selecione pelo menos uma função</FormErrorMessage>
                  <RolesUnionDisclaimer visible={createRolesRisky} />
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
              isDisabled={rolesInvalid}
            >
              Adicionar Usuário
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      <AlertDialog
        isOpen={isRiskConfirmOpen}
        leastDestructiveRef={riskCancelRef}
        onClose={handleRiskConfirmClose}
      >
        <AlertDialogOverlay>
          <AlertDialogContent>
            <AlertDialogHeader fontSize="lg" fontWeight="bold">
              Confirmar funções
            </AlertDialogHeader>
            <AlertDialogBody>
              {ROLES_UNION_DISCLAIMER} Deseja salvar mesmo assim?
            </AlertDialogBody>
            <AlertDialogFooter>
              <Button ref={riskCancelRef} onClick={handleRiskConfirmClose}>
                Cancelar
              </Button>
              <Button
                colorScheme="blue"
                ml={3}
                onClick={handleRiskConfirmSave}
                isLoading={loading || editLoading}
              >
                Salvar mesmo assim
              </Button>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialogOverlay>
      </AlertDialog>
    </VStack>
  );
}
