'use client';

import { useCallback, useEffect, useState } from 'react';
import {
  Badge,
  Box,
  Button,
  FormControl,
  FormLabel,
  Heading,
  HStack,
  Input,
  Switch,
  Table,
  Tbody,
  Td,
  Text,
  Th,
  Thead,
  Tr,
  useToast,
  VStack,
} from '@chakra-ui/react';
import type { PaymentMethodDTO } from '@ti-assistant/contracts';
import {
  createPaymentMethod,
  listPaymentMethods,
  setPaymentMethodActive,
  updatePaymentMethod,
} from '@/features/procurement/api/paymentMethodApi';

export default function PaymentMethodsSettingsPage() {
  const toast = useToast();
  const [items, setItems] = useState<PaymentMethodDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [code, setCode] = useState('');
  const [label, setLabel] = useState('');
  const [requiresBoleto, setRequiresBoleto] = useState(false);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    const token = localStorage.getItem('@ti-assistant:token');
    if (!token) return;
    setLoading(true);
    try {
      const data = await listPaymentMethods(token, false);
      setItems(data);
    } catch (err) {
      toast({
        title: 'Erro ao carregar formas',
        description: err instanceof Error ? err.message : 'Tente novamente.',
        status: 'error',
        duration: 4000,
        isClosable: true,
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    void load();
  }, [load]);

  const handleCreate = async () => {
    const token = localStorage.getItem('@ti-assistant:token');
    if (!token) return;
    if (!code.trim() || !label.trim()) {
      toast({
        title: 'Código e rótulo são obrigatórios',
        status: 'warning',
        duration: 3000,
        isClosable: true,
      });
      return;
    }
    setSaving(true);
    try {
      await createPaymentMethod(token, {
        code: code.trim(),
        label: label.trim(),
        requires_boleto_terms: requiresBoleto,
      });
      setCode('');
      setLabel('');
      setRequiresBoleto(false);
      await load();
      toast({ title: 'Forma criada', status: 'success', duration: 3000, isClosable: true });
    } catch (err) {
      toast({
        title: 'Erro ao criar',
        description: err instanceof Error ? err.message : 'Tente novamente.',
        status: 'error',
        duration: 4000,
        isClosable: true,
      });
    } finally {
      setSaving(false);
    }
  };

  const handleToggle = async (item: PaymentMethodDTO) => {
    if (!item.id) return;
    const token = localStorage.getItem('@ti-assistant:token');
    if (!token) return;
    try {
      await setPaymentMethodActive(token, item.id, !item.active);
      await load();
    } catch (err) {
      toast({
        title: 'Erro ao alterar status',
        description: err instanceof Error ? err.message : 'Tente novamente.',
        status: 'error',
        duration: 4000,
        isClosable: true,
      });
    }
  };

  const handleRename = async (item: PaymentMethodDTO, nextLabel: string) => {
    if (!item.id || !nextLabel.trim() || nextLabel.trim() === item.label) return;
    const token = localStorage.getItem('@ti-assistant:token');
    if (!token) return;
    try {
      await updatePaymentMethod(token, item.id, { label: nextLabel.trim() });
      await load();
    } catch (err) {
      toast({
        title: 'Erro ao atualizar',
        description: err instanceof Error ? err.message : 'Tente novamente.',
        status: 'error',
        duration: 4000,
        isClosable: true,
      });
    }
  };

  return (
    <Box>
      <Heading size="lg" mb={6}>
        Formas de pagamento
      </Heading>
      <Text mb={4} fontSize="sm" color="gray.500">
        Cadastro usado nas propostas de cotação. Se nenhuma forma estiver ativa, o portal usa o
        fallback embutido (PIX, boletos, cartão e transferência).
      </Text>

      <VStack align="stretch" spacing={3} mb={8} maxW="560px">
        <HStack align="flex-end" flexWrap="wrap">
          <FormControl flex="1" minW="120px">
            <FormLabel fontSize="sm">Código</FormLabel>
            <Input
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder="PIX"
              size="sm"
            />
          </FormControl>
          <FormControl flex="2" minW="160px">
            <FormLabel fontSize="sm">Rótulo</FormLabel>
            <Input
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              placeholder="PIX"
              size="sm"
            />
          </FormControl>
          <FormControl display="flex" alignItems="center" w="auto" pb={1}>
            <FormLabel mb={0} fontSize="sm" mr={2}>
              Boleto a prazo
            </FormLabel>
            <Switch
              isChecked={requiresBoleto}
              onChange={(e) => setRequiresBoleto(e.target.checked)}
            />
          </FormControl>
          <Button size="sm" colorScheme="blue" onClick={handleCreate} isLoading={saving}>
            Adicionar
          </Button>
        </HStack>
      </VStack>

      {loading ? (
        <Text>Carregando...</Text>
      ) : (
        <Table size="sm">
          <Thead>
            <Tr>
              <Th>Código</Th>
              <Th>Rótulo</Th>
              <Th>Boleto a prazo</Th>
              <Th>Status</Th>
              <Th>Ativo</Th>
            </Tr>
          </Thead>
          <Tbody>
            {items.map((item) => (
              <Tr key={item.id ?? item.code}>
                <Td>{item.code}</Td>
                <Td>
                  <Input
                    size="sm"
                    defaultValue={item.label}
                    onBlur={(e) => void handleRename(item, e.target.value)}
                  />
                </Td>
                <Td>{item.requires_boleto_terms ? 'Sim' : 'Não'}</Td>
                <Td>
                  <Badge colorScheme={item.active ? 'green' : 'gray'}>
                    {item.active ? 'Ativa' : 'Inativa'}
                  </Badge>
                </Td>
                <Td>
                  <Switch
                    isChecked={Boolean(item.active)}
                    onChange={() => void handleToggle(item)}
                    isDisabled={!item.id}
                  />
                </Td>
              </Tr>
            ))}
            {items.length === 0 && (
              <Tr>
                <Td colSpan={5}>
                  <Text color="gray.500">Nenhuma forma cadastrada — portal usará o fallback.</Text>
                </Td>
              </Tr>
            )}
          </Tbody>
        </Table>
      )}
    </Box>
  );
}
