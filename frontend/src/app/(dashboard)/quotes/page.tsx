'use client';

import {
  Box,
  VStack,
  useColorModeValue,
  Tabs,
  TabList,
  TabPanels,
  Tab,
  TabPanel,
  useToast,
  useBreakpointValue,
  useColorMode,
  Flex,
  HStack,
  Button,
  IconButton,
  Drawer,
  DrawerOverlay,
  DrawerContent,
  DrawerHeader,
  DrawerBody,
  DrawerCloseButton,
  useDisclosure,
  Divider,
  Select,
  useMediaQuery,
  Heading,
} from '@chakra-ui/react';
import { QuoteList } from './components/QuoteList';
import { CreateQuoteButton } from './components/CreateQuoteButton';
import { SmartQuotesTable } from './components/SmartQuotesTable';
import { useState, useEffect } from 'react';
import { FiPlus, FiFilter, FiSearch, FiChevronRight } from 'react-icons/fi';
import { useRouter } from 'next/navigation';

interface Quote {
  id: string;
  supplier: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  total_value: number;
  created_at: string;
  created_by: string;
  user: {
    id: string;
    name: string;
  };
  items: Array<{
    product_name: string;
    quantity: number;
    unit_price: number;
  }>;
}

export default function QuotesPage() {
  const router = useRouter();
  const { colorMode } = useColorMode();
  const [isMobile] = useMediaQuery('(max-width: 768px)');
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const toast = useToast();
  const { isOpen: isFilterOpen, onOpen: onFilterOpen, onClose: onFilterClose } = useDisclosure();

  // Cores
  const bgColor = useColorModeValue('white', 'gray.700');
  const borderColor = useColorModeValue('gray.200', 'gray.600');
  const headingColor = useColorModeValue('gray.800', 'white');

  const fetchQuotes = async () => {
    try {
      const response = await fetch('/api/quotes', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('@ti-assistant:token')}`
        }
      });

      if (response.status === 429) {
        router.push('/rate-limit');
        return;
      }

      if (!response.ok) {
        throw new Error('Erro ao buscar cotações');
      }

      const data = await response.json();
      setQuotes(data);
    } catch (error) {
      console.error('Erro ao buscar cotações:', error);
      toast({
        title: 'Erro',
        description: 'Erro ao buscar cotações',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchQuotes();
  }, []);

  const handleStatusChange = async (quoteId: string, status: 'APPROVED' | 'REJECTED') => {
    try {
      const response = await fetch(`/api/quotes/${quoteId}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('@ti-assistant:token')}`
        },
        body: JSON.stringify({ status })
      });

      if (response.status === 429) {
        router.push('/rate-limit');
        return;
      }

      if (!response.ok) {
        throw new Error('Erro ao alterar status da cotação');
      }

      await fetchQuotes();

      toast({
        title: 'Sucesso',
        description: 'Status da cotação alterado com sucesso',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
    } catch (error) {
      console.error('Erro ao alterar status:', error);
      toast({
        title: 'Erro',
        description: 'Erro ao alterar status da cotação',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    }
  };

  const filteredQuotes = quotes.filter(quote => {
    const matchesSearch = quote.supplier.toLowerCase().includes(searchTerm.toLowerCase()) ||
      quote.user.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = !statusFilter || quote.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'APPROVED':
        return 'green';
      case 'REJECTED':
        return 'red';
      default:
        return 'yellow';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'APPROVED':
        return 'Aprovada';
      case 'REJECTED':
        return 'Rejeitada';
      default:
        return 'Pendente';
    }
  };

  return (
    <Box w="full" h="full">
      <VStack
        spacing={4}
        align="stretch"
        bg={bgColor}
        backdropFilter="blur(12px)"
        p={{ base: 2, md: 6 }}
        borderRadius="lg"
        boxShadow="sm"
        borderWidth="1px"
        borderColor={borderColor}
        h="full"
      >
        {!isMobile && (
          <>
            <Flex direction={{ base: 'column', md: 'row' }} justify="space-between" align={{ base: 'stretch', md: 'center' }} gap={3}>
              <Heading size={{ base: 'md', md: 'lg' }} color={headingColor}>Cotações</Heading>
            </Flex>
            <Divider />
          </>
        )}

        <Box position="sticky" top="7vh" zIndex={21} bg={useColorModeValue('white', 'gray.700')} borderRadius="lg">
          <Tabs variant="enclosed" size={{ base: 'sm', md: 'md' }}>
            <TabList
              overflowX="auto"
              css={{
                '&::-webkit-scrollbar': { display: 'none' },
                scrollbarWidth: 'none',
                msOverflowStyle: 'none'
              }}
              bg={useColorModeValue('gray.50', 'gray.600')}
              borderRadius="lg"
              p={1}
              gap={1}
            >
              <Tab
                whiteSpace="nowrap"
                fontSize={{ base: 'xs', md: 'sm' }}
                fontWeight="medium"
                minH={{ base: '8', md: '10' }}
                px={{ base: 2, md: 4 }}
                py={{ base: 2, md: 3 }}
                borderRadius="md"
                _selected={{
                  bg: useColorModeValue('white', 'gray.700'),
                  color: useColorModeValue('blue.600', 'blue.200'),
                  boxShadow: 'sm',
                  borderColor: useColorModeValue('blue.200', 'blue.600')
                }}
                _hover={{
                  bg: useColorModeValue('gray.100', 'gray.500')
                }}
              >
                Todas as Cotações
              </Tab>
              <Tab
                whiteSpace="nowrap"
                fontSize={{ base: 'xs', md: 'sm' }}
                fontWeight="medium"
                minH={{ base: '8', md: '10' }}
                px={{ base: 2, md: 4 }}
                py={{ base: 2, md: 3 }}
                borderRadius="md"
                _selected={{
                  bg: useColorModeValue('white', 'gray.700'),
                  color: useColorModeValue('blue.600', 'blue.200'),
                  boxShadow: 'sm',
                  borderColor: useColorModeValue('blue.200', 'blue.600')
                }}
                _hover={{
                  bg: useColorModeValue('gray.100', 'gray.500')
                }}
              >
                Cotações Inteligentes
              </Tab>
            </TabList>

            <Box mt={4} flex="1" overflowY="auto">
              <TabPanels>
                <TabPanel p={{ base: 2, md: 4 }}>
                  <VStack spacing={4} align="stretch">
                    <Box display="flex" justifyContent="flex-end">
                      <CreateQuoteButton />
                    </Box>
                    <QuoteList quotes={quotes} onStatusChange={handleStatusChange} />
                  </VStack>
                </TabPanel>
                <TabPanel p={{ base: 2, md: 4 }}>
                  <SmartQuotesTable />
                </TabPanel>
              </TabPanels>
            </Box>
          </Tabs>
        </Box>
      </VStack>
    </Box>
  );
} 