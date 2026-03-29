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
  Badge,
  Button,
  HStack,
  useToast,
} from '@chakra-ui/react';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { formatBRL } from '@/utils/money';

interface SmartQuote {
  id: string;
  supplier: string;
  total_value: number;
  items: {
    product_name: string;
    quantity: number;
    unit_price: number;
  }[];
  created_at: string;
}

export function SmartQuotesTable() {
  const [quotes, setQuotes] = useState<SmartQuote[]>([]);
  const [loading, setLoading] = useState(true);
  const toast = useToast();
  const router = useRouter();

  const bgColor = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.700');

  useEffect(() => {
    fetchSmartQuotes();
  }, []);

  const fetchSmartQuotes = async () => {
    try {
      const token = localStorage.getItem('@ti-assistant:token');
      if (!token) throw new Error('Token não encontrado');

      const response = await fetch('/api/quotes/smart', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) throw new Error('Erro ao carregar cotações inteligentes');
      const data = await response.json();
      setQuotes(data);
    } catch (error) {
      toast({
        title: 'Erro',
        description: 'Não foi possível carregar as cotações inteligentes',
        status: 'error',
        duration: 3000,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCreateQuote = async (quote: SmartQuote) => {
    try {
      const token = localStorage.getItem('@ti-assistant:token');
      if (!token) throw new Error('Token não encontrado');

      const response = await fetch('/api/quotes', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          supplier_id: quote.supplier,
          items: quote.items.map(item => ({
            product_name: item.product_name,
            quantity: item.quantity,
            unit_price: item.unit_price
          })),
          total_value: quote.total_value
        })
      });

      if (!response.ok) throw new Error('Erro ao criar cotação');

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
        description: 'Não foi possível criar a cotação',
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
            <Tr key={quote.id}>
              <Td>{quote.supplier}</Td>
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