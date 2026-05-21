'use client';

import {
  Box,
  VStack,
  FormControl,
  FormLabel,
  Input,
  Button,
  Text,
  IconButton,
  HStack,
  NumberInput,
  NumberInputField,
  NumberInputStepper,
  NumberIncrementStepper,
  NumberDecrementStepper,
  useColorModeValue,
  Select,
  FormHelperText,
  useToast,
} from '@chakra-ui/react';
import { Plus, Trash2 } from 'lucide-react';
import { useState, useEffect } from 'react';
import { formatBRL, mulMoney, sumMoney } from '@/utils/money';

interface Supplier {
  id: string;
  name: string;
  cnpj: string;
}

interface QuoteItem {
  product_name: string;
  manufacturer: string;
  quantity: number;
  unit_price: number;
  link?: string;
  notes?: string;
}

interface MobileNewQuoteProps {
  onSubmit: (data: {
    supplier: string;
    items: QuoteItem[];
    notes?: string;
  }) => void;
  onCancel: () => void;
}

export function MobileNewQuote({ onSubmit, onCancel }: MobileNewQuoteProps) {
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [selectedSupplier, setSelectedSupplier] = useState('');
  const [formData, setFormData] = useState({
    supplier_id: '',
    notes: '',
    items: [{
      product_name: '',
      manufacturer: '',
      quantity: 1,
      unit_price: 0,
      link: '',
      notes: ''
    }]
  });
  const [loading, setLoading] = useState(false);
  const toast = useToast();

  const bgColor = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.700');

  useEffect(() => {
    fetchSuppliers();
  }, []);

  const fetchSuppliers = async () => {
    try {
      const token = localStorage.getItem('@ti-assistant:token');
      if (!token) throw new Error('Token não encontrado');

      const response = await fetch('/api/suppliers', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) throw new Error('Erro ao carregar fornecedores');
      const data = await response.json();
      setSuppliers(data);
    } catch (error) {
      toast({
        title: 'Erro',
        description: 'Não foi possível carregar os fornecedores',
        status: 'error',
        duration: 3000,
      });
    }
  };

  const addItem = () => {
    setFormData(prev => ({
      ...prev,
      items: [...prev.items, {
        product_name: '',
        manufacturer: '',
        quantity: 1,
        unit_price: 0,
        link: '',
        notes: ''
      }]
    }));
  };

  const removeItem = (index: number) => {
    if (formData.items.length > 1) {
      setFormData(prev => ({
        ...prev,
        items: formData.items.filter((_, i) => i !== index)
      }));
    }
  };

  const handleItemChange = (index: number, field: string, value: string | number) => {
    const newItems = [...formData.items];
    newItems[index] = {
      ...newItems[index],
      [field]: value
    };
    setFormData(prev => ({
      ...prev,
      items: newItems
    }));
  };

  const calculateTotal = () => {
    return sumMoney(formData.items.map((item) => mulMoney(item.unit_price, item.quantity)));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const token = localStorage.getItem('@ti-assistant:token');
      if (!token) throw new Error('Token não encontrado');

      const selectedSupplierData = suppliers.find(s => s.id === selectedSupplier);
      if (!selectedSupplierData) throw new Error('Fornecedor não selecionado');

      const items = formData.items.map(item => ({
        product_name: item.product_name,
        manufacturer: item.manufacturer,
        quantity: Number(item.quantity),
        unit_price: Number(item.unit_price),
        link: item.link || undefined,
        notes: item.notes || undefined
      }));

      const total_value = items.reduce((acc, item) => acc + (item.quantity * item.unit_price), 0);

      const response = await fetch('/api/quotes', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          supplier_id: selectedSupplierData.id,
          items,
          total_value,
          notes: formData.notes || undefined
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Erro ao criar cotação');
      }

      toast({
        title: 'Sucesso',
        description: 'Cotação criada com sucesso',
        status: 'success',
        duration: 3000,
      });

      onSubmit({
        supplier: selectedSupplierData.id,
        items,
      });
    } catch (error: any) {
      toast({
        title: 'Erro',
        description: error.message || 'Não foi possível criar a cotação',
        status: 'error',
        duration: 3000,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box
      as="form"
      onSubmit={handleSubmit}
      bg={bgColor}
      minH="100vh"
      p={4}
    >
      <VStack spacing={6} align="stretch">
        <FormControl isRequired>
          <FormLabel>Fornecedor</FormLabel>
          <Select
            value={selectedSupplier}
            onChange={(e) => setSelectedSupplier(e.target.value)}
            placeholder="Selecione um fornecedor"
          >
            {suppliers.map((supplier) => (
              <option key={supplier.id} value={supplier.id}>
                {supplier.name} - {supplier.cnpj}
              </option>
            ))}
          </Select>
        </FormControl>

        <Text fontWeight="medium">Itens</Text>

        {formData.items.map((item, index) => (
          <Box
            key={index}
            p={4}
            borderWidth="1px"
            borderRadius="md"
            borderColor={borderColor}
          >
            <VStack spacing={4} align="stretch">
              <FormControl isRequired>
                <FormLabel>Produto</FormLabel>
                <Input
                  value={item.product_name}
                  onChange={(e) => handleItemChange(index, 'product_name', e.target.value)}
                  placeholder="Nome do produto"
                />
              </FormControl>

              <FormControl isRequired>
                <FormLabel>Quantidade</FormLabel>
                <NumberInput
                  min={1}
                  value={item.quantity}
                  onChange={(_, value) => handleItemChange(index, 'quantity', value.toString())}
                >
                  <NumberInputField />
                  <NumberInputStepper>
                    <NumberIncrementStepper />
                    <NumberDecrementStepper />
                  </NumberInputStepper>
                </NumberInput>
              </FormControl>

              <FormControl isRequired>
                <FormLabel>Preço Unitário</FormLabel>
                <HStack>
                  <Text>R$</Text>
                  <NumberInput
                    min={0}
                    precision={2}
                    step={0.01}
                    value={item.unit_price}
                    onChange={(_, value) => handleItemChange(index, 'unit_price', value)}
                    w="full"
                  >
                    <NumberInputField inputMode="decimal" onBlur={() => handleItemChange(index, 'unit_price', Number(item.unit_price || 0).toFixed(2))} />
                    <NumberInputStepper>
                      <NumberIncrementStepper />
                      <NumberDecrementStepper />
                    </NumberInputStepper>
                  </NumberInput>
                </HStack>
              </FormControl>

              <FormControl>
                <FormLabel>Link do Produto (opcional)</FormLabel>
                <Input
                  type="url"
                  placeholder="https://..."
                  value={item.link || ''}
                  onChange={(e) => handleItemChange(index, 'link', e.target.value)}
                />
              </FormControl>

              <IconButton
                aria-label="Remover item"
                icon={<Trash2 size={16} />}
                colorScheme="red"
                variant="ghost"
                onClick={() => removeItem(index)}
                alignSelf="flex-end"
              />
            </VStack>
          </Box>
        ))}

        <Button
          leftIcon={<Plus size={16} />}
          onClick={addItem}
          variant="outline"
          alignSelf="flex-start"
        >
          Adicionar Item
        </Button>

        <FormControl>
          <FormLabel>Observações Gerais</FormLabel>
          <Input
            placeholder="Observações sobre a cotação (opcional)"
            value={formData.notes || ''}
            onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
          />
          <FormHelperText>
            Observações gerais sobre a cotação ou itens
          </FormHelperText>
        </FormControl>

        <Box
          p={4}
          borderWidth="1px"
          borderRadius="md"
          borderColor={borderColor}
          bg={useColorModeValue('gray.50', 'gray.700')}
        >
          <Text fontWeight="medium">
            Valor Total: {formatBRL(calculateTotal())}
          </Text>
        </Box>

        <HStack justify="flex-end" spacing={4}>
          <Button
            variant="ghost"
            onClick={onCancel}
          >
            Cancelar
          </Button>
          <Button
            type="submit"
            colorScheme="blue"
            isLoading={loading}
          >
            Criar Cotação
          </Button>
        </HStack>
      </VStack>
    </Box>
  );
} 