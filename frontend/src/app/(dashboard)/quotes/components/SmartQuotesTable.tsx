import {
  Box,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  Text,
  useColorModeValue,
  Button,
  useToast,
} from '@chakra-ui/react';
import { useRouter } from 'next/navigation';
import { formatBRL } from '@/utils/money';
import { createQuote, useSmartQuotes, type SmartQuoteDTO } from '@/features/quotes';

export function SmartQuotesTable() {
  const { quotes, loading } = useSmartQuotes();
  const toast = useToast();
  const router = useRouter();

  const bgColor = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.700');

  const handleCreateQuote = async (quote: SmartQuoteDTO) => {
    try {
      const token = localStorage.getItem('@ti-assistant:token');
      if (!token) throw new Error('Token não encontrado');

      await createQuote(token, {
        supplier_id: quote.supplier_id,
        items: quote.items.map((item) => ({
          product_name: item.product_name,
          manufacturer: 'Não especificado',
          quantity: item.quantity,
          unit_price: item.unit_price,
        })),
      });

      toast({
        title: 'Sucesso',
        description: 'Cotação criada com sucesso',
        status: 'success',
        duration: 3000,
      });

      router.push('/quotes');
    } catch (error) {
      toast({
        title: 'Erro',
        description: error instanceof Error ? error.message : 'Não foi possível criar a cotação',
        status: 'error',
        duration: 3000,
      });
    }
  };

  if (loading) {
    return <Text>Carregando cotações inteligentes...</Text>;
  }

  if (quotes.length === 0) {
    return (
      <Box
        p={4}
        borderWidth="1px"
        borderRadius="lg"
        borderColor={borderColor}
        bg={bgColor}
      >
        <Text>Nenhuma cotação inteligente disponível no momento.</Text>
      </Box>
    );
  }

  return (
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
            <Th>Fornecedor</Th>
            <Th>Produtos</Th>
            <Th isNumeric>Valor Total</Th>
            <Th>Data</Th>
            <Th width="150px">Ações</Th>
          </Tr>
        </Thead>
        <Tbody>
          {quotes.map((quote) => (
            <Tr key={quote.supplier_id}>
              <Td>{quote.supplier_name}</Td>
              <Td>
                <Box>
                  {quote.items.map((item, index) => (
                    <Text key={index} fontSize="sm">
                      {item.quantity}x {item.product_name} - {formatBRL(item.unit_price)}/un
                    </Text>
                  ))}
                </Box>
              </Td>
              <Td isNumeric>{formatBRL(quote.total_value)}</Td>
              <Td>{new Date(quote.created_at).toLocaleDateString()}</Td>
              <Td>
                <Button
                  size="sm"
                  colorScheme="blue"
                  onClick={() => handleCreateQuote(quote)}
                >
                  Usar Cotação
                </Button>
              </Td>
            </Tr>
          ))}
        </Tbody>
      </Table>
    </Box>
  );
}
