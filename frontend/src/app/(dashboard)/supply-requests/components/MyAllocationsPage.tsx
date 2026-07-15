'use client';

import { useEffect, useState } from 'react';
import {
  Box,
  Card,
  CardBody,
  Flex,
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
  Badge,
  Text,
  Image,
  useColorModeValue,
  Button,
  useToast,
  Spinner,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  ModalCloseButton,
  Textarea,
  useDisclosure,
  FormControl,
  FormLabel,
  VStack,
  HStack,
  useMediaQuery,
  Divider,
  useColorMode,
} from '@chakra-ui/react';
import { SearchIcon } from 'lucide-react';
import { CheckCircle } from 'lucide-react';
import { useRouter } from 'next/navigation';
import type { InventoryAllocation } from '@/features/inventory/types';

export function MyAllocationsPage() {
  const [allocations, setAllocations] = useState<InventoryAllocation[]>([]);
  const [filteredAllocations, setFilteredAllocations] = useState<InventoryAllocation[]>([]);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const toast = useToast();
  const bgColor = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.700');
  const [returnModalOpen, setReturnModalOpen] = useState(false);
  const [returnNotes, setReturnNotes] = useState('');
  const [returningId, setReturningId] = useState<string | null>(null);
  const [isReturning, setIsReturning] = useState(false);
  const [lostModalOpen, setLostModalOpen] = useState(false);
  const [lostNotes, setLostNotes] = useState('');
  const [markingLostId, setMarkingLostId] = useState<string | null>(null);
  const [isMarkingLost, setIsMarkingLost] = useState(false);
  const [isMobile] = useMediaQuery('(max-width: 768px)');
  const { colorMode } = useColorMode();

  useEffect(() => {
    fetchAllocations();
  }, []);

  useEffect(() => {
    if (search || statusFilter) {
      const filtered = allocations.filter(allocation => {
        const matchesSearch =
          allocation.inventory.name.toLowerCase().includes(search.toLowerCase()) ||
          allocation.inventory.model.toLowerCase().includes(search.toLowerCase()) ||
          allocation.inventory.serial_number.toLowerCase().includes(search.toLowerCase()) ||
          allocation.destination.toLowerCase().includes(search.toLowerCase());
        const matchesStatus = !statusFilter || allocation.status === statusFilter;
        return matchesSearch && matchesStatus;
      });
      setFilteredAllocations(filtered);
    } else {
      setFilteredAllocations(allocations);
    }
  }, [search, statusFilter, allocations]);

  const fetchAllocations = async () => {
    try {
      const token = localStorage.getItem('@ti-assistant:token');
      if (!token) {
        router.push('/login');
        return;
      }

      const response = await fetch('/api/inventory-allocations', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error('Erro ao carregar alocações');
      }

      const data = await response.json();
      setAllocations(data);
      setFilteredAllocations(data);
    } catch (error) {
      toast({
        title: 'Erro',
        description: error instanceof Error ? error.message : 'Erro ao carregar alocações',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmDelivery = async (allocationId: string) => {
    try {
      const token = localStorage.getItem('@ti-assistant:token');
      if (!token) {
        router.push('/');
        return;
      }

      const response = await fetch(`/api/inventory-allocations/${allocationId}/delivery-confirmation`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ confirmation: true })
      });

      if (!response.ok) {
        throw new Error('Erro ao confirmar entrega');
      }

      toast({
        title: 'Sucesso',
        description: 'Entrega confirmada com sucesso',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });

      fetchAllocations();
    } catch (error) {
      toast({
        title: 'Erro',
        description: error instanceof Error ? error.message : 'Erro ao confirmar entrega',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    }
  };

  const handleReturnItem = async () => {
    if (!returningId) return;
    setIsReturning(true);
    try {
      const token = localStorage.getItem('@ti-assistant:token');
      if (!token) throw new Error('Token não encontrado');
      const response = await fetch(`/api/inventory-allocations/${returningId}/return`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ return_notes: returnNotes })
      });
      if (!response.ok) throw new Error('Erro ao devolver item');
      toast({ title: 'Sucesso', description: 'Item devolvido com sucesso', status: 'success', duration: 3000, isClosable: true });
      setReturnModalOpen(false);
      setReturnNotes('');
      setReturningId(null);
      fetchAllocations();
    } catch (error) {
      toast({ title: 'Erro', description: error instanceof Error ? error.message : 'Erro ao devolver item', status: 'error', duration: 3000, isClosable: true });
    } finally {
      setIsReturning(false);
    }
  };

  const handleMarkAsLost = async () => {
    if (!markingLostId) return;
    setIsMarkingLost(true);
    try {
      const token = localStorage.getItem('@ti-assistant:token');
      if (!token) throw new Error('Token não encontrado');
      const response = await fetch(`/api/inventory-allocations/${markingLostId}/mark-lost`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ lost_notes: lostNotes })
      });
      if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        throw new Error(err.error || 'Erro ao marcar item como perdido');
      }
      toast({ title: 'Sucesso', description: 'Item marcado como perdido', status: 'success', duration: 3000, isClosable: true });
      setLostModalOpen(false);
      setLostNotes('');
      setMarkingLostId(null);
      fetchAllocations();
    } catch (error) {
      toast({ title: 'Erro', description: error instanceof Error ? error.message : 'Erro ao marcar item como perdido', status: 'error', duration: 3000, isClosable: true });
    } finally {
      setIsMarkingLost(false);
    }
  };

  if (loading) {
    return (
      <Flex justify="center" align="center" minH="200px">
        <Spinner size="xl" />
      </Flex>
    );
  }

  return (
    <Card bg={colorMode === 'dark' ? 'rgba(45, 55, 72, 0.5)' : 'gray.50'} backdropFilter="blur(12px)" borderWidth="1px" borderColor={colorMode === 'dark' ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'}>
      <CardBody>
        {!isMobile && (
        <Flex gap={4} mb={6} direction={{ base: 'column', md: 'row' }} justify={{ base: 'center', md: 'space-between' }}>
          <InputGroup>
            <InputLeftElement pointerEvents="none">
              <SearchIcon color={colorMode === 'dark' ? 'gray.400' : 'gray.300'} />
            </InputLeftElement>
            <Input
              placeholder="Buscar por item ou destino..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              bg={colorMode === 'dark' ? 'rgba(45, 55, 72, 0.5)' : 'gray.50'}
              backdropFilter="blur(12px)"
              borderColor={colorMode === 'dark' ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'}
              _hover={{ borderColor: colorMode === 'dark' ? 'rgba(255, 255, 255, 0.2)' : 'rgba(0, 0, 0, 0.2)' }}
              _focus={{ borderColor: colorMode === 'dark' ? 'blue.400' : 'blue.500', boxShadow: 'none' }}
            />
          </InputGroup>
          <Select
            placeholder="Filtrar por status"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            maxW="200px"
            bg={colorMode === 'dark' ? 'rgba(45, 55, 72, 0.5)' : 'gray.50'}
            backdropFilter="blur(12px)"
            borderColor={colorMode === 'dark' ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'}
            _hover={{ borderColor: colorMode === 'dark' ? 'rgba(255, 255, 255, 0.2)' : 'rgba(0, 0, 0, 0.2)' }}
            _focus={{ borderColor: colorMode === 'dark' ? 'blue.400' : 'blue.500', boxShadow: 'none' }}
          >
            <option value="">Todos</option>
            <option value="PENDING">Pendente</option>
            <option value="APPROVED">Aprovado</option>
            <option value="REJECTED">Rejeitado</option>
            <option value="DELIVERED">Entregue</option>
            <option value="RETURNED">Devolvido</option>
            <option value="LOST">Perdido</option>
          </Select>
        </Flex>
        )}

        {filteredAllocations.length === 0 ? (
          <Flex direction="column" align="center" justify="center" py={8}>
            <Image
              src="/Task-complete.svg"
              alt="Nenhuma alocação encontrada"
              maxW="300px"
              mb={4}
            />
            <Text color={colorMode === 'dark' ? 'gray.300' : 'gray.500'} fontSize="lg">
              Nenhuma alocação encontrada
            </Text>
          </Flex>
        ) : isMobile ? (
          // Layout Mobile com Cards
          <VStack spacing={4} align="stretch">
            {filteredAllocations.map((allocation) => (
              <Card 
                key={allocation.id} 
                bg={colorMode === 'dark' ? 'rgba(45, 55, 72, 0.5)' : 'gray.50'} 
                backdropFilter="blur(12px)" 
                borderWidth="1px" 
                borderColor={colorMode === 'dark' ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'}
                borderRadius={0}
              >
                <CardBody p={4}>
                  <VStack align="stretch" spacing={3}>
                    {/* Header com nome e status */}
                    <HStack justify="space-between" align="start">
                      <VStack align="start" spacing={1} flex="1">
                        <Text fontWeight="bold" fontSize="md" color={colorMode === 'dark' ? 'white' : 'gray.800'}>
                          {allocation.inventory.name}
                        </Text>
                        <Text fontSize="sm" color={colorMode === 'dark' ? 'gray.300' : 'gray.500'}>
                          {allocation.inventory.model}
                        </Text>
                      </VStack>
                      <Badge 
                        colorScheme={
                          allocation.status === 'APPROVED'
                            ? 'green'
                            : allocation.status === 'REJECTED'
                              ? 'red'
                              : allocation.status === 'DELIVERED'
                                ? 'purple'
                                : allocation.status === 'RETURNED'
                                  ? 'blue'
                                  : allocation.status === 'LOST'
                                    ? 'purple'
                                    : 'yellow'
                        } 
                        size="sm"
                      >
                        {allocation.status === 'PENDING'
                          ? 'Pendente'
                          : allocation.status === 'APPROVED'
                            ? 'Aprovado'
                            : allocation.status === 'REJECTED'
                              ? 'Rejeitado'
                              : allocation.status === 'DELIVERED'
                                ? 'Entregue'
                                : allocation.status === 'LOST'
                                  ? 'Perdido'
                                  : 'Devolvido'}
                      </Badge>
                    </HStack>

                    <Divider />

                    {/* Informações adicionais */}
                    <VStack align="stretch" spacing={2}>
                      <HStack justify="space-between">
                        <Text fontSize="sm" color={colorMode === 'dark' ? 'gray.300' : 'gray.500'}>Nº Série:</Text>
                        <Text fontSize="sm" color={colorMode === 'dark' ? 'white' : 'gray.800'} fontFamily="mono">
                          {allocation.inventory.serial_number}
                        </Text>
                      </HStack>
                      
                      <HStack justify="space-between">
                        <Text fontSize="sm" color={colorMode === 'dark' ? 'gray.300' : 'gray.500'}>Destino:</Text>
                        <Text fontSize="sm" color={colorMode === 'dark' ? 'white' : 'gray.800'}>
                          {allocation.destination_name || allocation.destination}
                        </Text>
                      </HStack>
                      
                      <HStack justify="space-between">
                        <Text fontSize="sm" color={colorMode === 'dark' ? 'gray.300' : 'gray.500'}>Retorno:</Text>
                        <Text fontSize="sm" color={colorMode === 'dark' ? 'white' : 'gray.800'}>
                          {allocation.return_date ? new Date(allocation.return_date).toLocaleDateString('pt-BR') : 'Não definida'}
                        </Text>
                      </HStack>
                      
                      <HStack justify="space-between">
                        <Text fontSize="sm" color={colorMode === 'dark' ? 'gray.300' : 'gray.500'}>Requerente:</Text>
                        <Badge colorScheme={allocation.requester_delivery_confirmation ? 'green' : 'gray'} size="xs">
                          {allocation.requester_delivery_confirmation ? 'Confirmado' : 'Pendente'}
                        </Badge>
                      </HStack>
                      
                      <HStack justify="space-between">
                        <Text fontSize="sm" color={colorMode === 'dark' ? 'gray.300' : 'gray.500'}>Gerente:</Text>
                        <Badge colorScheme={allocation.manager_delivery_confirmation ? 'green' : 'gray'} size="xs">
                          {allocation.manager_delivery_confirmation ? 'Confirmado' : 'Pendente'}
                        </Badge>
                      </HStack>
                    </VStack>

                    {/* Botões de ação */}
                    <VStack spacing={2}>
                      {allocation.status === 'APPROVED' && !allocation.requester_delivery_confirmation && (
                        <Button 
                          size="sm" 
                          colorScheme="blue" 
                          leftIcon={<CheckCircle size={16} />} 
                          onClick={() => handleConfirmDelivery(allocation.id)} 
                          bg={colorMode === 'dark' ? 'rgba(66, 153, 225, 0.8)' : undefined} 
                          _hover={{ bg: colorMode === 'dark' ? 'rgba(66, 153, 225, 0.9)' : undefined, transform: 'translateY(-1px)' }} 
                          transition="all 0.3s ease"
                          w="full"
                        >
                          Confirmar Recebimento
                        </Button>
                      )}
                      
                      {allocation.status === 'DELIVERED' && (
                        <VStack spacing={2} w="full">
                          <Button 
                            size="sm" 
                            colorScheme="blue" 
                            onClick={() => { setReturningId(allocation.id); setReturnModalOpen(true); }} 
                            bg={colorMode === 'dark' ? 'rgba(66, 153, 225, 0.8)' : undefined} 
                            _hover={{ bg: colorMode === 'dark' ? 'rgba(66, 153, 225, 0.9)' : undefined, transform: 'translateY(-1px)' }} 
                            transition="all 0.3s ease"
                            w="full"
                          >
                            Devolver Item
                          </Button>
                          <Button 
                            size="sm" 
                            colorScheme="purple" 
                            variant="outline"
                            onClick={() => { setMarkingLostId(allocation.id); setLostModalOpen(true); }} 
                            w="full"
                          >
                            Marcar como perdido
                          </Button>
                        </VStack>
                      )}
                    </VStack>
                  </VStack>
                </CardBody>
              </Card>
            ))}
          </VStack>
        ) : (
          // Layout Desktop com Tabela
          <Box overflowX="auto">
            <Table variant="simple" size={{ base: 'sm', md: 'md' }}>
              <Thead>
                <Tr>
                  <Th color={colorMode === 'dark' ? 'white' : 'gray.800'}>Item</Th>
                  <Th color={colorMode === 'dark' ? 'white' : 'gray.800'} display={{ base: 'none', md: 'table-cell' }}>Modelo</Th>
                  <Th color={colorMode === 'dark' ? 'white' : 'gray.800'} display={{ base: 'none', lg: 'table-cell' }}>Nº Série</Th>
                  <Th color={colorMode === 'dark' ? 'white' : 'gray.800'}>Destino</Th>
                  <Th color={colorMode === 'dark' ? 'white' : 'gray.800'}>Status</Th>
                  <Th color={colorMode === 'dark' ? 'white' : 'gray.800'} display={{ base: 'none', md: 'table-cell' }}>Data de Retorno</Th>
                  <Th color={colorMode === 'dark' ? 'white' : 'gray.800'} display={{ base: 'none', lg: 'table-cell' }}>Confirmações</Th>
                  <Th color={colorMode === 'dark' ? 'white' : 'gray.800'}>Ações</Th>
                </Tr>
              </Thead>
              <Tbody>
                {filteredAllocations.map((allocation) => (
                  <Tr key={allocation.id}>
                    <Td color={colorMode === 'dark' ? 'white' : 'gray.800'}>
                      <VStack align="start" spacing={1}>
                        <Text fontWeight="medium">{allocation.inventory.name}</Text>
                        {isMobile && (
                          <Text fontSize="xs" color="gray.500">
                            {allocation.inventory.model}
                          </Text>
                        )}
                      </VStack>
                    </Td>
                    <Td color={colorMode === 'dark' ? 'white' : 'gray.800'} display={{ base: 'none', md: 'table-cell' }}>
                      {allocation.inventory.model}
                    </Td>
                    <Td color={colorMode === 'dark' ? 'white' : 'gray.800'} display={{ base: 'none', lg: 'table-cell' }} fontFamily="mono">
                      {allocation.inventory.serial_number}
                    </Td>
                    <Td color={colorMode === 'dark' ? 'white' : 'gray.800'}>
                      <Text fontSize="sm" color={colorMode === 'dark' ? 'gray.300' : 'gray.500'}>
                        {allocation.destination_name || allocation.destination}
                      </Text>
                    </Td>
                    <Td>
                      <Badge
                        colorScheme={
                          allocation.status === 'APPROVED'
                            ? 'green'
                            : allocation.status === 'REJECTED'
                              ? 'red'
                              : allocation.status === 'DELIVERED'
                                ? 'purple'
                                : allocation.status === 'RETURNED'
                                  ? 'blue'
                                  : allocation.status === 'LOST'
                                    ? 'purple'
                                    : 'yellow'
                        }
                        size={{ base: 'sm', md: 'md' }}
                      >
                        {allocation.status === 'PENDING'
                          ? 'Pendente'
                          : allocation.status === 'APPROVED'
                            ? 'Aprovado'
                            : allocation.status === 'REJECTED'
                              ? 'Rejeitado'
                              : allocation.status === 'DELIVERED'
                                ? 'Entregue'
                                : allocation.status === 'LOST'
                                  ? 'Perdido'
                                  : 'Devolvido'}
                      </Badge>
                    </Td>
                    <Td color={colorMode === 'dark' ? 'white' : 'gray.800'} display={{ base: 'none', md: 'table-cell' }}>
                      {allocation.return_date ? new Date(allocation.return_date).toLocaleDateString('pt-BR') : 'Não definida'}
                    </Td>
                    <Td display={{ base: 'none', lg: 'table-cell' }}>
                      <VStack spacing={2} align="start">
                        <HStack>
                          <Text fontSize="sm" color={colorMode === 'dark' ? 'white' : 'gray.800'}>Requerente:</Text>
                        <Badge colorScheme={allocation.requester_delivery_confirmation ? 'green' : 'gray'}>
                            {allocation.requester_delivery_confirmation ? 'Confirmado' : 'Pendente'}
                        </Badge>
                        </HStack>
                        <HStack>
                          <Text fontSize="sm" color={colorMode === 'dark' ? 'white' : 'gray.800'}>Gerente:</Text>
                        <Badge colorScheme={allocation.manager_delivery_confirmation ? 'green' : 'gray'}>
                            {allocation.manager_delivery_confirmation ? 'Confirmado' : 'Pendente'}
                        </Badge>
                        </HStack>
                      </VStack>
                    </Td>
                    <Td>
                      <VStack spacing={2} align="start">
                      {allocation.status === 'APPROVED' && !allocation.requester_delivery_confirmation && (
                        <Button
                            size={{ base: 'xs', md: 'sm' }}
                          colorScheme="blue"
                            leftIcon={<CheckCircle size={isMobile ? 14 : 16} />}
                          onClick={() => handleConfirmDelivery(allocation.id)}
                            bg={colorMode === 'dark' ? 'rgba(66, 153, 225, 0.8)' : undefined} 
                            _hover={{ bg: colorMode === 'dark' ? 'rgba(66, 153, 225, 0.9)' : undefined, transform: 'translateY(-1px)' }} 
                            transition="all 0.3s ease"
                        >
                            {isMobile ? 'Confirmar' : 'Confirmar Recebimento'}
                        </Button>
                      )}
                      {allocation.status === 'DELIVERED' && (
                        <VStack spacing={2} align="start">
                          <Button
                            size={{ base: 'xs', md: 'sm' }}
                            colorScheme="blue"
                            onClick={() => { setReturningId(allocation.id); setReturnModalOpen(true); }}
                            bg={colorMode === 'dark' ? 'rgba(66, 153, 225, 0.8)' : undefined} 
                            _hover={{ bg: colorMode === 'dark' ? 'rgba(66, 153, 225, 0.9)' : undefined, transform: 'translateY(-1px)' }} 
                            transition="all 0.3s ease"
                          >
                            {isMobile ? 'Devolver' : 'Devolver Item'}
                          </Button>
                          <Button
                            size={{ base: 'xs', md: 'sm' }}
                            colorScheme="purple"
                            variant="outline"
                            onClick={() => { setMarkingLostId(allocation.id); setLostModalOpen(true); }}
                          >
                            Marcar como perdido
                          </Button>
                        </VStack>
                      )}
                      </VStack>
                    </Td>
                  </Tr>
                ))}
              </Tbody>
            </Table>
          </Box>
        )}
      </CardBody>
      <Modal isOpen={returnModalOpen} onClose={() => setReturnModalOpen(false)}>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Devolver Item</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <FormControl>
              <FormLabel>Observações (opcional)</FormLabel>
              <Textarea value={returnNotes} onChange={e => setReturnNotes(e.target.value)} placeholder="Descreva o motivo ou detalhes da devolução..." />
            </FormControl>
          </ModalBody>
          <ModalFooter>
            <Button colorScheme="blue" mr={3} onClick={handleReturnItem} isLoading={isReturning}>Confirmar Devolução</Button>
            <Button variant="ghost" onClick={() => setReturnModalOpen(false)}>Cancelar</Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
      <Modal isOpen={lostModalOpen} onClose={() => setLostModalOpen(false)}>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Marcar como perdido</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <FormControl>
              <FormLabel>Observações (opcional)</FormLabel>
              <Textarea value={lostNotes} onChange={e => setLostNotes(e.target.value)} placeholder="Descreva as circunstâncias da perda..." />
            </FormControl>
          </ModalBody>
          <ModalFooter>
            <Button colorScheme="purple" mr={3} onClick={handleMarkAsLost} isLoading={isMarkingLost}>Confirmar</Button>
            <Button variant="ghost" onClick={() => setLostModalOpen(false)}>Cancelar</Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </Card>
  );
} 