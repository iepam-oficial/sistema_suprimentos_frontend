'use client';

import { useState, useEffect } from 'react';
import {
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  Badge,
  useToast,
  Box,
  Text,
  HStack,
  Select,
  Input,
  InputGroup,
  InputLeftElement,
  useColorMode,
  useColorModeValue,
  Spinner,
  Center,
  VStack,
  Button,
  useDisclosure,
  Drawer,
  DrawerOverlay,
  DrawerContent,
  DrawerHeader,
  DrawerBody,
  DrawerFooter,
  FormControl,
  FormLabel,
  useMediaQuery,
} from '@chakra-ui/react';
import { SearchIcon, Filter } from 'lucide-react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { formatBRL } from '@/utils/money';
import type { QuoteDTO } from '@/features/quotes';
import { quoteStatusColor, quoteStatusLabel } from '@/features/quotes';

interface QuoteListProps {
  quotes: QuoteDTO[];
  loading?: boolean;
  onStatusChange: (quoteId: string, status: 'APPROVED' | 'REJECTED') => Promise<void>;
  onReload?: () => void;
}

export function QuoteList({ quotes, loading: loadingProp, onStatusChange }: QuoteListProps) {
  const { colorMode } = useColorMode();
  const [isMobile] = useMediaQuery('(max-width: 768px)');
  const drawerBg = useColorModeValue('white', 'gray.800');
  const drawerHeaderColor = useColorModeValue('gray.800', 'white');
  const formLabelColor = useColorModeValue('gray.800', 'white');
  
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [creatorFilter, setCreatorFilter] = useState('');
  const { isOpen: isFilterOpen, onOpen: onFilterOpen, onClose: onFilterClose } = useDisclosure();
  const [loadingLocal, setLoadingLocal] = useState(true);
  const loading = loadingProp ?? loadingLocal;
  const [userRole, setUserRole] = useState<string | null>(null);
  const toast = useToast();
  const router = useRouter();

  const borderColor = useColorModeValue('gray.200', 'gray.700');
  const hoverBg = useColorModeValue('gray.50', 'gray.700');

  useEffect(() => {
    const userData = localStorage.getItem('@ti-assistant:user');
    if (userData) {
      const { role } = JSON.parse(userData);
      setUserRole(role);
    }
    setLoadingLocal(false);
  }, []);

  const extractNameFromNotes = (notes?: string | null) => {
    if (!notes) return '';
    const match = notes.match(/\[(.*?)\]/);
    return match?.[1]?.trim() || '';
  };

  const filteredQuotes = quotes.filter(quote => {
    const matchesStatus = !statusFilter || quote.status === statusFilter;
    const matchesCreator = !creatorFilter || quote.user?.id === creatorFilter;
    const nome = extractNameFromNotes(quote.notes).toLowerCase();
    const matchesSearch = !searchTerm || 
      nome.includes(searchTerm.toLowerCase()) ||
      quote.items.some(item => 
        item.product_name.toLowerCase().includes(searchTerm.toLowerCase())
      );
    return matchesStatus && matchesCreator && matchesSearch;
  });

  if (loading) {
    return (
      <Center py={8}>
        <Spinner size="xl" />
      </Center>
    );
  }

  return (
    <Box>
      {!isMobile ? (
      <VStack spacing={4} mb={6}>
        <HStack spacing={4} width="100%">
          <Select
            placeholder="Filtrar por status"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            maxW="200px"
            size="sm"
          >
            <option value="">Todos</option>
            <option value="PENDING">Pendentes</option>
            <option value="APPROVED">Aprovadas</option>
            <option value="REJECTED">Rejeitadas</option>
          </Select>

          <Select
            placeholder="Filtrar por criador"
            value={creatorFilter}
            onChange={(e) => setCreatorFilter(e.target.value)}
            maxW="200px"
            size="sm"
          >
            <option value="">Todos</option>
            {quotes
              .filter((quote, index, self) => 
                index === self.findIndex(q => q.user?.id === quote.user?.id)
              )
              .map(quote => (
                <option key={quote.user?.id} value={quote.user?.id}>
                  {quote.user?.name}
                </option>
              ))
            }
          </Select>

          <InputGroup maxW="300px" size="sm">
            <InputLeftElement pointerEvents="none">
              <SearchIcon size={16} />
            </InputLeftElement>
            <Input
              placeholder="Buscar por nome ou produto"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </InputGroup>
        </HStack>
      </VStack>
      ) : (
        <VStack spacing={3} mb={6}>
          <InputGroup size="md">
            <InputLeftElement pointerEvents="none">
              <SearchIcon size={16} />
            </InputLeftElement>
            <Input
              placeholder="Buscar por nome ou produto"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </InputGroup>
          <Button
            leftIcon={<Filter size={16} />}
            onClick={onFilterOpen}
            variant="outline"
            size="sm"
            w="full"
          >
            Filtros
          </Button>
        </VStack>
      )}

      <Box overflowX="auto">
        <Table variant="simple" size="sm">
          <Thead>
            <Tr>
              <Th>Nome</Th>
              <Th>Solicitante</Th>
              <Th>Status</Th>
              <Th isNumeric>Valor Total</Th>
              <Th>Data</Th>
              <Th>Ações</Th>
            </Tr>
          </Thead>
          <Tbody>
            {filteredQuotes.map((quote) => (
              <Tr key={quote.id}>
                <Td>{extractNameFromNotes(quote.notes) || 'Sem nome'}</Td>
                <Td>{quote.user?.name ?? '—'}</Td>
                <Td>
                  <Badge colorScheme={quoteStatusColor(quote.status)}>
                    {quoteStatusLabel(quote.status)}
                  </Badge>
                </Td>
                <Td isNumeric>{formatBRL(quote.total_value)}</Td>
                <Td>{new Date(quote.created_at).toLocaleDateString()}</Td>
                <Td>
                  <HStack spacing={2}>
                    <Button
                      as={Link}
                      href={`/quotes/${quote.id}`}
                      size="sm"
                      colorScheme="blue"
                      variant="outline"
                      onClick={(e) => e.stopPropagation()}
                    >
                      Detalhes
                    </Button>
                    {userRole === 'MANAGER' && quote.status === 'PENDING' && (
                      <>
                        <Button
                          size="sm"
                          colorScheme="green"
                          onClick={(e) => {
                            e.stopPropagation();
                            onStatusChange(quote.id, 'APPROVED');
                          }}
                        >
                          Aprovar
                        </Button>
                        <Button
                          size="sm"
                          colorScheme="red"
                          onClick={(e) => {
                            e.stopPropagation();
                            onStatusChange(quote.id, 'REJECTED');
                          }}
                        >
                          Rejeitar
                        </Button>

                      </>
                    )}
                  </HStack>
                </Td>
              </Tr>
            ))}
          </Tbody>
        </Table>
      </Box>

      {/* Drawer de Filtros para Mobile */}
      <Drawer isOpen={isFilterOpen} placement="right" onClose={onFilterClose} size="full">
        <DrawerOverlay />
        <DrawerContent bg={drawerBg} backdropFilter="blur(12px)">
          <DrawerHeader borderBottomWidth="1px" color={drawerHeaderColor}>
            <HStack justify="space-between" align="center">
              <Text>Filtros Avançados</Text>
              <Button
                size="sm"
                colorScheme="blue"
                onClick={onFilterClose}
              >
                Filtrar
              </Button>
            </HStack>
          </DrawerHeader>
          <DrawerBody>
            <VStack spacing={4} align="stretch">
              <FormControl>
                <FormLabel color={formLabelColor}>Status</FormLabel>
                <Select
                  placeholder="Filtrar por status"
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  size="sm"
                >
                  <option value="">Todos</option>
                  <option value="PENDING">Pendentes</option>
                  <option value="APPROVED">Aprovadas</option>
                  <option value="REJECTED">Rejeitadas</option>
                </Select>
              </FormControl>

              <FormControl>
                <FormLabel color={formLabelColor}>Criador</FormLabel>
                <Select
                  placeholder="Filtrar por criador"
                  value={creatorFilter}
                  onChange={(e) => setCreatorFilter(e.target.value)}
                  size="sm"
                >
                  <option value="">Todos</option>
                  {quotes
                    .filter((quote, index, self) =>
                      quote.user?.id &&
                      index === self.findIndex((q) => q.user?.id === quote.user?.id)
                    )
                    .map((quote) => (
                      <option key={quote.user?.id} value={quote.user?.id}>
                        {quote.user?.name}
                      </option>
                    ))
                  }
                </Select>
              </FormControl>
            </VStack>
          </DrawerBody>
          <DrawerFooter borderTopWidth="1px">
            <Button variant="outline" mr={3} onClick={() => {
              setStatusFilter('');
              setCreatorFilter('');
              onFilterClose();
            }}>
              Limpar Filtros
            </Button>
            <Button onClick={onFilterClose}>
              Aplicar
            </Button>
          </DrawerFooter>
        </DrawerContent>
      </Drawer>
    </Box>
  );
} 