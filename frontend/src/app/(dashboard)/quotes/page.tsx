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
  Flex,
  Divider,
  useMediaQuery,
  Heading,
} from '@chakra-ui/react';
import { QuoteList } from './components/QuoteList';
import { CreateQuoteButton } from './components/CreateQuoteButton';
import { SmartQuotesTable } from './components/SmartQuotesTable';
import { LegacyQuoteDeprecationBanner } from './components/LegacyQuoteDeprecationBanner';
import { useQuotes } from '@/features/quotes';

export default function QuotesPage() {
  const [isMobile] = useMediaQuery('(max-width: 768px)');
  const toast = useToast();
  const { quotes, loading, handleStatusChange, reload } = useQuotes();

  const bgColor = useColorModeValue('white', 'gray.700');
  const borderColor = useColorModeValue('gray.200', 'gray.600');
  const headingColor = useColorModeValue('gray.800', 'white');

  const onStatusChange = async (quoteId: string, status: 'APPROVED' | 'REJECTED') => {
    try {
      await handleStatusChange(quoteId, status);
      toast({
        title: 'Sucesso',
        description: 'Status da cotação alterado com sucesso',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
    } catch (err) {
      toast({
        title: 'Erro',
        description: err instanceof Error ? err.message : 'Erro ao alterar status da cotação',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
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

        <LegacyQuoteDeprecationBanner />

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
                    <QuoteList quotes={quotes} loading={loading} onStatusChange={onStatusChange} onReload={reload} />
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