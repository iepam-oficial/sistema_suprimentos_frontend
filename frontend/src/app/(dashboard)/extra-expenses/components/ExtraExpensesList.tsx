'use client'

import React, { useState, useEffect } from 'react';
import {
  Box,
  VStack,
  HStack,
  Heading,
  Text,
  Button,
  useToast,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  IconButton,
  Badge,
  useColorModeValue,
  Input,
  InputGroup,
  InputLeftElement,
  Select,
  Flex,
  useDisclosure,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalCloseButton,
  Image,
  Link,
  useMediaQuery,
  Card,
  CardBody,
  Stack,
  StackDivider,
  FormControl,
  FormLabel,
  NumberInput,
  NumberInputField,
  NumberInputStepper,
  NumberIncrementStepper,
  NumberDecrementStepper,
  useColorMode,
} from '@chakra-ui/react';
import { SearchIcon, EditIcon, DeleteIcon, ViewIcon, AddIcon } from '@chakra-ui/icons';
import { ExtraExpense } from '../interfaces/IExtraExpense';
import { exportToPDF } from '@/utils/exportToPDF';
import { formatBRL } from '@/utils/money';
import type { ExtraExpenseCategory } from '../../settings/interfaces/IExtraExpenseCategory';

interface ExtraExpensesListProps {
  onEditExpense: (expense: ExtraExpense) => void;
  isFormOpen: boolean;
  onOpenForm: () => void;
}

export default function ExtraExpensesList({ onEditExpense, isFormOpen, onOpenForm }: ExtraExpensesListProps) {
  const { colorMode } = useColorMode();
  const [isMobile] = useMediaQuery('(max-width: 768px)');
  const headingColor = useColorModeValue('gray.800', 'white');
  
  const [expenses, setExpenses] = useState<ExtraExpense[]>([]);
  const [categories, setCategories] = useState<ExtraExpenseCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [minAmount, setMinAmount] = useState<number | undefined>();
  const [maxAmount, setMaxAmount] = useState<number | undefined>();
  const [filteredExpenses, setFilteredExpenses] = useState<ExtraExpense[]>([]);
  const [selectedExpense, setSelectedExpense] = useState<ExtraExpense | null>(null);
  const { isOpen: isViewOpen, onOpen: onViewOpen, onClose: onViewClose } = useDisclosure();
  const toast = useToast();
  const bgColor = useColorModeValue('white', 'gray.700');
  const borderColor = useColorModeValue('gray.200', 'gray.600');

  useEffect(() => {
    fetchExpenses();
    fetchCategories();
  }, []);

  useEffect(() => {
    filterExpenses();
  }, [expenses, searchTerm, selectedCategory, startDate, endDate, minAmount, maxAmount]);

  const fetchExpenses = async () => {
    try {
      const token = localStorage.getItem('@ti-assistant:token');
      const response = await fetch('/api/extra-expenses', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error('Erro ao buscar gastos extras');
      }

      const data = await response.json();
      setExpenses(data);
    } catch (error) {
      toast({
        title: 'Erro',
        description: 'Erro ao carregar gastos extras',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const token = localStorage.getItem('@ti-assistant:token');
      const response = await fetch('/api/extra-expense-categories', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        setCategories(data);
      }
    } catch (error) {
      console.error('Erro ao buscar categorias:', error);
    }
  };

  const filterExpenses = () => {
    let filtered = expenses;

    if (searchTerm) {
      filtered = filtered.filter(expense =>
        expense.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        expense.category.label.toLowerCase().includes(searchTerm.toLowerCase()) ||
        expense.amount.toString().includes(searchTerm)
      );
    }

    if (selectedCategory) {
      filtered = filtered.filter(expense => expense.category_id === selectedCategory);
    }

    if (startDate) {
      filtered = filtered.filter(expense => 
        new Date(expense.date) >= new Date(startDate)
      );
    }

    if (endDate) {
      filtered = filtered.filter(expense => 
        new Date(expense.date) <= new Date(endDate)
      );
    }

    if (minAmount !== undefined) {
      filtered = filtered.filter(expense => expense.amount >= minAmount);
    }

    if (maxAmount !== undefined) {
      filtered = filtered.filter(expense => expense.amount <= maxAmount);
    }

    setFilteredExpenses(filtered);
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Tem certeza que deseja excluir este gasto?')) {
      return;
    }

    try {
      const token = localStorage.getItem('@ti-assistant:token');
      const response = await fetch(`/api/extra-expenses/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error('Erro ao excluir gasto');
      }

      toast({
        title: 'Sucesso',
        description: 'Gasto excluído com sucesso',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });

      fetchExpenses();
    } catch (error) {
      toast({
        title: 'Erro',
        description: 'Erro ao excluir gasto',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    }
  };

  const handleView = (expense: ExtraExpense) => {
    setSelectedExpense(expense);
    onViewOpen();
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR');
  };

  const getStatusColor = (amount: number) => {
    if (amount > 1000) return 'red';
    if (amount > 500) return 'orange';
    return 'green';
  };

  const handleExportPDF = async () => {
    if (filteredExpenses.length === 0) {
      toast({
        title: 'Aviso',
        description: 'Não há gastos para exportar',
        status: 'warning',
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    try {
      // Calcular o total dos gastos filtrados
      const totalAmount = filteredExpenses.reduce((sum, expense) => sum + expense.amount, 0);

      await exportToPDF({
        title: 'Relatório de Gastos Extras',
        head: [
          'Categoria', 'Descrição', 'Valor', 'Data', 'Local', 'Evento', 'Recibo'
        ],
        body: filteredExpenses.map(expense => [
          expense.category.label,
          expense.description || 'Sem descrição',
          formatBRL(expense.amount),
          formatDate(expense.date),
          expense.location?.name || '-',
          expense.event?.title || '-',
          expense.receipt_url ? 'Sim' : 'Não'
        ]),
        fileName: 'gastos_extras.pdf',
        orientation: 'landscape',
        total: {
          label: 'Valor Total',
          value: formatBRL(totalAmount)
        }
      });

      toast({
        title: 'Sucesso',
        description: 'PDF exportado com sucesso!',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
    } catch (error) {
      toast({
        title: 'Erro',
        description: 'Erro ao exportar PDF',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    }
  };

  const clearFilters = () => {
    setSearchTerm('');
    setSelectedCategory('');
    setStartDate('');
    setEndDate('');
    setMinAmount(undefined);
    setMaxAmount(undefined);
  };

  if (loading) {
    return (
      <Box textAlign="center" py={10}>
        <Text>Carregando gastos extras...</Text>
      </Box>
    );
  }

  return (
    <VStack spacing={4} align="stretch" w="full" h="full">
      <Flex direction={{ base: 'column', md: 'row' }} justify="space-between" align="center" gap={4}>
        <Heading size="md" color={headingColor}>
          Lista de Gastos Extras ({filteredExpenses.length})
        </Heading>
        <Button
          leftIcon={<AddIcon />}
          colorScheme="blue"
          onClick={onOpenForm}
          size="sm"
        >
          Novo Gasto
        </Button>
      </Flex>

      {isMobile ? (
        <>
          <VStack spacing={3} align="stretch">
            <InputGroup>
              <InputLeftElement pointerEvents="none">
                <SearchIcon color="gray.300" />
              </InputLeftElement>
              <Input
                placeholder="Buscar gastos..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </InputGroup>

            <Select
              placeholder="Filtrar por categoria"
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
            >
              {categories.map(category => (
                <option key={category.id} value={category.id}>
                  {category.label}
                </option>
              ))}
            </Select>

            <HStack spacing={2}>
              <Input
                type="date"
                placeholder="Data inicial"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                size="sm"
              />
              <Input
                type="date"
                placeholder="Data final"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                size="sm"
              />
            </HStack>

            <HStack spacing={2}>
              <NumberInput
                value={minAmount}
                onChange={(value) => setMinAmount(value ? parseFloat(value) : undefined)}
                min={0}
              >
                <NumberInputField placeholder="Valor mínimo" />
                <NumberInputStepper>
                  <NumberIncrementStepper />
                  <NumberDecrementStepper />
                </NumberInputStepper>
              </NumberInput>

              <NumberInput
                value={maxAmount}
                onChange={(value) => setMaxAmount(value ? parseFloat(value) : undefined)}
                min={0}
              >
                <NumberInputField placeholder="Valor máximo" />
                <NumberInputStepper>
                  <NumberIncrementStepper />
                  <NumberDecrementStepper />
                </NumberInputStepper>
              </NumberInput>
            </HStack>

            <HStack spacing={2}>
              <Button
                colorScheme="blue"
                onClick={handleExportPDF}
                size="sm"
                isDisabled={filteredExpenses.length === 0}
                flex={1}
              >
                Exportar PDF
              </Button>

              <Button
                colorScheme="gray"
                variant="outline"
                onClick={clearFilters}
                size="sm"
                flex={1}
              >
                Limpar Filtros
              </Button>
            </HStack>
          </VStack>

          <VStack spacing={3} align="stretch">
            {filteredExpenses.map((expense) => (
              <Card key={expense.id} variant="outline">
                <CardBody>
                  <Stack divider={<StackDivider />} spacing="4">
                    <Box>
                      <Heading size="xs" textTransform="uppercase">
                        {expense.category.label}
                      </Heading>
                      <Text pt="2" fontSize="sm">
                        {expense.description || 'Sem descrição'}
                      </Text>
                    </Box>
                    <Box>
                      <Text fontSize="lg" fontWeight="bold" color={getStatusColor(expense.amount)}>
                        {formatBRL(expense.amount)}
                      </Text>
                      <Text fontSize="sm" color="gray.500">
                        {formatDate(expense.date)}
                      </Text>
                    </Box>
                    <HStack justify="space-between">
                      <HStack spacing={2}>
                        <IconButton
                          aria-label="Ver detalhes"
                          icon={<ViewIcon />}
                          size="sm"
                          onClick={() => handleView(expense)}
                        />
                        <IconButton
                          aria-label="Editar"
                          icon={<EditIcon />}
                          size="sm"
                          onClick={() => onEditExpense(expense)}
                        />
                        <IconButton
                          aria-label="Excluir"
                          icon={<DeleteIcon />}
                          size="sm"
                          colorScheme="red"
                          onClick={() => handleDelete(expense.id)}
                        />
                      </HStack>
                      {expense.receipt_url && (
                        <Badge colorScheme="green" size="sm">
                          Com recibo
                        </Badge>
                      )}
                    </HStack>
                  </Stack>
                </CardBody>
              </Card>
            ))}
          </VStack>
        </>
      ) : (
        <>
          {/* Filtros Desktop */}
          <VStack spacing={4} align="stretch" mb={4}>
            <HStack spacing={4} align="center">
              <InputGroup maxW="300px">
                <InputLeftElement pointerEvents="none">
                  <SearchIcon color="gray.300" />
                </InputLeftElement>
                <Input
                  placeholder="Buscar gastos..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </InputGroup>

              <Select
                placeholder="Filtrar por categoria"
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                maxW="200px"
              >
                {categories.map(category => (
                  <option key={category.id} value={category.id}>
                    {category.label}
                  </option>
                ))}
              </Select>

              <Input
                type="date"
                placeholder="Data inicial"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                maxW="150px"
              />
              <Input
                type="date"
                placeholder="Data final"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                maxW="150px"
              />

              <NumberInput
                value={minAmount}
                onChange={(value) => setMinAmount(value ? parseFloat(value) : undefined)}
                min={0}
                maxW="150px"
              >
                <NumberInputField placeholder="Valor mínimo" />
                <NumberInputStepper>
                  <NumberIncrementStepper />
                  <NumberDecrementStepper />
                </NumberInputStepper>
              </NumberInput>

              <NumberInput
                value={maxAmount}
                onChange={(value) => setMaxAmount(value ? parseFloat(value) : undefined)}
                min={0}
                maxW="150px"
              >
                <NumberInputField placeholder="Valor máximo" />
                <NumberInputStepper>
                  <NumberIncrementStepper />
                  <NumberDecrementStepper />
                </NumberInputStepper>
              </NumberInput>

              <Button
                colorScheme="blue"
                onClick={handleExportPDF}
                isDisabled={filteredExpenses.length === 0}
                size="sm"
              >
                Exportar PDF
              </Button>

              <Button
                colorScheme="gray"
                variant="outline"
                onClick={clearFilters}
                size="sm"
              >
                Limpar Filtros
              </Button>
            </HStack>
          </VStack>

          <Box overflowX="auto">
            <Table variant="simple">
            <Thead>
              <Tr>
                <Th>Categoria</Th>
                <Th>Descrição</Th>
                <Th>Valor</Th>
                <Th>Data</Th>
                <Th>Polo</Th>
                <Th>Recibo</Th>
                <Th>Ações</Th>
              </Tr>
            </Thead>
            <Tbody>
              {filteredExpenses.map((expense) => (
                <Tr key={expense.id}>
                  <Td>
                    <Badge colorScheme="blue" variant="subtle">
                      {expense.category.label}
                    </Badge>
                  </Td>
                  <Td>
                    <Text noOfLines={2}>
                      {expense.description || 'Sem descrição'}
                    </Text>
                  </Td>
                  <Td>
                    <Text fontWeight="bold" color={getStatusColor(expense.amount)}>
                      {formatBRL(expense.amount)}
                    </Text>
                  </Td>
                  <Td>{formatDate(expense.date)}</Td>
                  <Td>
                    {expense.location ? (
                      <Text fontSize="sm">{expense.location.name}</Text>
                    ) : (
                      <Text fontSize="sm" color="gray.500">-</Text>
                    )}
                  </Td>
                  <Td>
                    {expense.receipt_url ? (
                      <Badge colorScheme="green" size="sm">
                        Com recibo
                      </Badge>
                    ) : (
                      <Badge colorScheme="gray" size="sm">
                        Sem recibo
                      </Badge>
                    )}
                  </Td>
                  <Td>
                    <HStack spacing={2}>
                      <IconButton
                        aria-label="Ver detalhes"
                        icon={<ViewIcon />}
                        size="sm"
                        onClick={() => handleView(expense)}
                      />
                      <IconButton
                        aria-label="Editar"
                        icon={<EditIcon />}
                        size="sm"
                        onClick={() => onEditExpense(expense)}
                      />
                      <IconButton
                        aria-label="Excluir"
                        icon={<DeleteIcon />}
                        size="sm"
                        colorScheme="red"
                        onClick={() => handleDelete(expense.id)}
                      />
                    </HStack>
                  </Td>
                </Tr>
              ))}
            </Tbody>
          </Table>
        </Box>
        </>
      )}

      {filteredExpenses.length === 0 && (
        <Box textAlign="center" py={10}>
          <Text color="gray.500">Nenhum gasto encontrado</Text>
        </Box>
      )}

      {/* Modal de visualização */}
      <Modal isOpen={isViewOpen} onClose={onViewClose} size="lg">
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Detalhes do Gasto</ModalHeader>
          <ModalCloseButton />
          <ModalBody pb={6}>
            {selectedExpense && (
              <VStack spacing={4} align="stretch">
                <Box>
                  <Text fontWeight="bold">Categoria:</Text>
                  <Text>{selectedExpense.category.label}</Text>
                </Box>
                <Box>
                  <Text fontWeight="bold">Descrição:</Text>
                  <Text>{selectedExpense.description || 'Sem descrição'}</Text>
                </Box>
                <Box>
                  <Text fontWeight="bold">Valor:</Text>
                  <Text fontSize="lg" color={getStatusColor(selectedExpense.amount)}>
                    {formatBRL(selectedExpense.amount)}
                  </Text>
                </Box>
                <Box>
                  <Text fontWeight="bold">Data:</Text>
                  <Text>{formatDate(selectedExpense.date)}</Text>
                </Box>
                {selectedExpense.location && (
                  <Box>
                    <Text fontWeight="bold">Local:</Text>
                    <Text>{selectedExpense.location.name}</Text>
                  </Box>
                )}
                {selectedExpense.event && (
                  <Box>
                    <Text fontWeight="bold">Evento:</Text>
                    <Text>{selectedExpense.event.title}</Text>
                  </Box>
                )}
                {selectedExpense.notes && (
                  <Box>
                    <Text fontWeight="bold">Observações:</Text>
                    <Text>{selectedExpense.notes}</Text>
                  </Box>
                )}
                {selectedExpense.receipt_url && (
                  <Box>
                    <Text fontWeight="bold">Recibo:</Text>
                    <Image
                      src={selectedExpense.receipt_url}
                      alt="Recibo"
                      maxH="300px"
                      objectFit="contain"
                      borderRadius="md"
                    />
                    <Link href={selectedExpense.receipt_url} isExternal color="blue.500" fontSize="sm">
                      Abrir em nova aba
                    </Link>
                  </Box>
                )}
              </VStack>
            )}
          </ModalBody>
        </ModalContent>
      </Modal>
    </VStack>
  );
} 