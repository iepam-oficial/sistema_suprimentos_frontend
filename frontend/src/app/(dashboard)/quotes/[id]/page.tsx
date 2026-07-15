'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  Box,
  Container,
  VStack,
  Heading,
  Text,
  Badge,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  Button,
  HStack,
  useToast,
  useColorModeValue,
  Spinner,
  Alert,
  AlertIcon,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalCloseButton,
  ModalBody,
  ModalFooter,
  FormControl,
  FormLabel,
  Input,
  Textarea,
  useDisclosure,
  useMediaQuery,
  Select,
} from '@chakra-ui/react';
import { PageHeader } from '@/components/PageHeader';
import { LegacyQuoteDeprecationBanner } from '../components/LegacyQuoteDeprecationBanner';
import { generateQuotePDF } from '../components/QuotePDF';
import { formatBRL } from '@/utils/money';
import {
  deleteQuote,
  fetchQuoteById,
  getSupplierName,
  quoteStatusColor,
  quoteStatusLabel,
  updateQuote,
  type QuoteDTO,
  type QuoteItemDTO,
} from '@/features/quotes';
import { fetchSuppliers } from '@/features/catalog/api/catalogApi';
import type { SupplierDTO } from '@/features/catalog/types';

type EditableQuoteItem = Omit<QuoteItemDTO, 'id'> & { id?: string };

export default function QuoteDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const toast = useToast();
  const [quote, setQuote] = useState<QuoteDTO | null>(null);
  const [suppliers, setSuppliers] = useState<SupplierDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [editSupplier, setEditSupplier] = useState('');
  const [editSupplierContact, setEditSupplierContact] = useState('');
  const [editNotes, setEditNotes] = useState('');
  const [saving, setSaving] = useState(false);
  const [editItems, setEditItems] = useState<EditableQuoteItem[]>([]);
  const [isSmallScreen] = useMediaQuery('(max-width: 640px)')

  const bgColor = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.700');

  useEffect(() => {
    fetchQuote();
    loadSuppliers();
  }, [params.id]);

  const loadSuppliers = async () => {
    try {
      const token = localStorage.getItem('@ti-assistant:token');
      if (!token) return;
      const data = await fetchSuppliers(token);
      setSuppliers(data);
    } catch {
      // optional for display-only views
    }
  };

  const fetchQuote = async () => {
    try {
      const token = localStorage.getItem('@ti-assistant:token');
      if (!token) throw new Error('Token não encontrado');

      const data = await fetchQuoteById(token, String(params.id));
      setQuote(data);
      setEditSupplier(data.supplier_id || '');
      setEditSupplierContact(data.supplier_contact || '');
      setEditNotes(data.notes || '');
      setEditItems((data.items || []).map((it: QuoteItemDTO) => ({
        id: it.id,
        product_name: it.product_name,
        manufacturer: it.manufacturer,
        quantity: it.quantity,
        unit_price: it.unit_price,
        total_price: it.total_price,
        final_price: it.final_price,
        link: it.link || '',
        notes: it.notes ?? null,
      })));
    } catch (error) {
      setError('Não foi possível carregar os detalhes da cotação');
      toast({
        title: 'Erro',
        description: 'Não foi possível carregar os detalhes da cotação',
        status: 'error',
        duration: 3000,
      });
    } finally {
      setLoading(false);
    }
  };

  const isCreator = () => {
    try {
      const userData = localStorage.getItem('@ti-assistant:user');
      if (!userData || !quote) return false;
      const parsed = JSON.parse(userData);
      return quote.user?.id ? quote.user.id === parsed.id : false;
    } catch {
      return false;
    }
  };

  const handleOpenEdit = () => {
    if (!quote) return;
    setEditSupplier(quote.supplier_id || '');
    setEditSupplierContact(quote.supplier_contact || '');
    setEditNotes(quote.notes || '');
    setEditItems((quote.items || []).map((it: QuoteItemDTO) => ({
      id: it.id,
      product_name: it.product_name,
      manufacturer: it.manufacturer,
      quantity: it.quantity,
      unit_price: it.unit_price,
      total_price: it.total_price,
      final_price: it.final_price,
      link: it.link || '',
      notes: it.notes ?? null,
    })));
    onOpen();
  };

  const handleSaveEdit = async () => {
    if (!quote) return;
    setSaving(true);
    try {
      const token = localStorage.getItem('@ti-assistant:token');
      if (!token) throw new Error('Token não encontrado');

      const updated = await updateQuote(token, quote.id, {
        supplier_id: editSupplier,
        supplier_contact: editSupplierContact || null,
        notes: editNotes || null,
        items: editItems.map((it) => ({
          id: it.id,
          product_name: it.product_name,
          manufacturer: it.manufacturer,
          quantity: Number(it.quantity),
          unit_price: Number(it.unit_price),
          final_price: Number(it.quantity) * Number(it.unit_price),
          notes: it.notes ?? null,
          link: it.link || undefined,
        })),
      });
      setQuote(updated);
      // refresh editable items from backend response
      setEditItems((updated.items || []).map((it: QuoteItemDTO) => ({
        id: it.id,
        product_name: it.product_name,
        manufacturer: it.manufacturer,
        quantity: it.quantity,
        unit_price: it.unit_price,
        total_price: it.total_price,
        final_price: it.final_price,
        link: it.link || '',
        notes: it.notes ?? null,
      })));
      toast({
        title: 'Sucesso',
        description: 'Cotação atualizada com sucesso',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
      onClose();
    } catch (e: any) {
      toast({
        title: 'Erro',
        description: e.message || 'Erro ao salvar alterações',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setSaving(false);
    }
  };

  const handleAddItem = () => {
    setEditItems(prev => ([
      ...prev,
      {
        product_name: '',
        manufacturer: '',
        quantity: 1,
        unit_price: 0,
        total_price: 0,
        final_price: 0,
        link: '',
        notes: '',
      },
    ]));
  };

  const handleUpdateItem = (index: number, field: keyof EditableQuoteItem, value: unknown) => {
    setEditItems(prev => {
      const list = [...prev];
      const updated: EditableQuoteItem = { ...list[index], [field]: value } as EditableQuoteItem;
      const quantity = Number(updated.quantity || 0);
      const unit_price = Number(updated.unit_price || 0);
      updated.total_price = quantity * unit_price;
      updated.final_price = quantity * unit_price;
      list[index] = updated;
      return list;
    });
  };

  const handleRemoveItem = (index: number) => {
    setEditItems(prev => prev.filter((_, i) => i !== index));
  };

  const handleDeleteQuote = async () => {
    if (!quote) return;
    if (!confirm('Tem certeza que deseja excluir esta cotação? Esta ação não pode ser desfeita.')) return;
    try {
      const token = localStorage.getItem('@ti-assistant:token');
      if (!token) throw new Error('Token não encontrado');
      await deleteQuote(token, quote.id);
      toast({
        title: 'Excluída',
        description: 'Cotação excluída com sucesso',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
      router.push('/quotes');
    } catch (e: any) {
      toast({
        title: 'Erro',
        description: e.message || 'Erro ao excluir cotação',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    }
  };

  const handleExportPDF = () => {
    if (!quote) return;

    const doc = generateQuotePDF({ quote });
    doc.save(`cotacao-${quote.id}.pdf`);
  };

  if (loading) {
    return (
      <Container maxW="container.xl" py={8}>
        <Box display="flex" justifyContent="center" alignItems="center" minH="400px">
          <Spinner size="xl" />
        </Box>
      </Container>
    );
  }

  if (error || !quote) {
    return (
      <Container maxW="container.xl" py={8}>
        <Alert status="error">
          <AlertIcon />
          {error || 'Cotação não encontrada'}
        </Alert>
      </Container>
    );
  }

  return (
    <Container maxW="container.xl" py={8}>
      <VStack spacing={8} align="stretch">
        <LegacyQuoteDeprecationBanner />
        <PageHeader
          title={`Cotação #${quote.id}`}
          description="Detalhes da cotação de suprimentos"
          rightElement={
            <HStack spacing={4}>
              {isCreator() && quote.status === 'PENDING' && (
                <>
                  <Button colorScheme="teal" onClick={handleOpenEdit}>
                    Editar
                  </Button>
                  <Button colorScheme="red" variant="outline" onClick={handleDeleteQuote}>
                    Excluir
                  </Button>
                </>
              )}
              <Button
                colorScheme="blue"
                onClick={handleExportPDF}
                leftIcon={<span>📄</span>}
              >
                Exportar PDF
              </Button>
              <Button
                colorScheme="gray"
                onClick={() => router.push('/quotes')}
              >
                Voltar
              </Button>
            </HStack>
          }
        />

        <Box
          bg={bgColor}
          borderRadius="lg"
          borderWidth="1px"
          borderColor={borderColor}
          p={6}
          shadow="sm"
        >
          <VStack spacing={6} align="stretch">
            <Box>
              <Heading size="md" mb={4}>Informações Gerais</Heading>
              <VStack align="stretch" spacing={2}>
                <Text><strong>Fornecedor:</strong> {getSupplierName(quote)}</Text>
                {quote.supplier_contact && (
                  <Text><strong>Contato:</strong> {quote.supplier_contact}</Text>
                )}
                <Text>
                  <strong>Status:</strong>{' '}
                  <Badge colorScheme={quoteStatusColor(quote.status)}>
                    {quoteStatusLabel(quote.status)}
                  </Badge>
                </Text>
                <Text><strong>Data de Criação:</strong> {new Date(quote.created_at).toLocaleDateString()}</Text>
                {quote.notes && (
                  <Text><strong>Observações:</strong> {quote.notes}</Text>
                )}
              </VStack>
            </Box>

            <Box>
              <Heading size="md" mb={4}>Itens da Cotação</Heading>
              <Box overflowX="auto">
                <Table variant="simple">
                  <Thead>
                    <Tr>
                      <Th>Produto</Th>
                      <Th>Fabricante</Th>
                      <Th isNumeric>Quantidade</Th>
                      <Th isNumeric>Preço Unitário</Th>
                      <Th isNumeric>Total</Th>
                      <Th>Link</Th>
                    </Tr>
                  </Thead>
                  <Tbody>
                    {quote.items.map((item, index) => (
                      <Tr key={index}>
                        <Td>{item.product_name}</Td>
                        <Td>{item.manufacturer}</Td>
                        <Td isNumeric>{item.quantity}</Td>
                        <Td isNumeric>{formatBRL(item.unit_price)}</Td>
                        <Td isNumeric>{formatBRL(item.total_price)}</Td>
                        <Td>
                          {item.link ? (
                            <Button
                              as="a"
                              href={item.link}
                              target="_blank"
                              rel="noopener noreferrer"
                              size="sm"
                              colorScheme="blue"
                              variant="link"
                            >
                              Ver Produto
                            </Button>
                          ) : (
                            <Text color="gray.500">-</Text>
                          )}
                        </Td>
                      </Tr>
                    ))}
                    <Tr>
                      <Td colSpan={5} textAlign="right"><strong>Total:</strong></Td>
                      <Td isNumeric><strong>{formatBRL(quote.total_value)}</strong></Td>
                    </Tr>
                  </Tbody>
                </Table>
              </Box>
            </Box>
          </VStack>
        </Box>
      </VStack>
      <Modal isOpen={isOpen} onClose={onClose} isCentered size={isSmallScreen ? 'full' : '6xl'}>
        <ModalOverlay />
        <ModalContent maxW={isSmallScreen ? '100vw' : '90vw'}>
          <ModalHeader>Editar Cotação</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <VStack spacing={4} align="stretch">
              <FormControl>
                <FormLabel>Fornecedor</FormLabel>
                <Select value={editSupplier} onChange={(e) => setEditSupplier(e.target.value)}>
                  <option value="">Selecione um fornecedor</option>
                  {suppliers.map((s) => (
                    <option key={s.id} value={s.id}>{s.name}</option>
                  ))}
                </Select>
              </FormControl>
              <FormControl>
                <FormLabel>Contato do Fornecedor</FormLabel>
                <Input value={editSupplierContact} onChange={(e) => setEditSupplierContact(e.target.value)} />
              </FormControl>
              <FormControl>
                <FormLabel>Observações</FormLabel>
                <Textarea value={editNotes} onChange={(e) => setEditNotes(e.target.value)} />
              </FormControl>
              <Box>
                <HStack justify="space-between" mb={2}>
                  <Heading size="sm">Itens</Heading>
                  <Button size="sm" onClick={handleAddItem} colorScheme="blue">Adicionar Item</Button>
                </HStack>
                {isSmallScreen ? (
                  <VStack spacing={4} align="stretch">
                    {editItems.map((it, idx) => (
                      <Box key={it.id || idx} borderWidth="1px" borderRadius="md" p={3}>
                        <VStack spacing={3} align="stretch">
                          <FormControl>
                            <FormLabel>Produto</FormLabel>
                            <Input size="sm" value={it.product_name} onChange={(e) => handleUpdateItem(idx, 'product_name', e.target.value)} />
                          </FormControl>
                          <FormControl>
                            <FormLabel>Fabricante</FormLabel>
                            <Input size="sm" value={it.manufacturer} onChange={(e) => handleUpdateItem(idx, 'manufacturer', e.target.value)} />
                          </FormControl>
                          <HStack>
                            <FormControl>
                              <FormLabel>Qtd</FormLabel>
                              <Input type="number" size="sm" value={it.quantity} onChange={(e) => handleUpdateItem(idx, 'quantity', Number(e.target.value))} />
                            </FormControl>
                            <FormControl>
                              <FormLabel>Preço Unit.</FormLabel>
                              <Input type="number" size="sm" value={it.unit_price} onChange={(e) => handleUpdateItem(idx, 'unit_price', Number(e.target.value))} />
                            </FormControl>
                          </HStack>
                          <FormControl>
                            <FormLabel>Link</FormLabel>
                            <Input size="sm" value={it.link || ''} onChange={(e) => handleUpdateItem(idx, 'link', e.target.value)} />
                          </FormControl>
                          <FormControl>
                            <FormLabel>Notas</FormLabel>
                            <Textarea size="sm" value={it.notes || ''} onChange={(e) => handleUpdateItem(idx, 'notes', e.target.value)} />
                          </FormControl>
                          <HStack justify="space-between">
                            <Text fontSize="sm" color="gray.500">Total: {formatBRL(Number(it.total_price || 0))}</Text>
                            <Button size="sm" colorScheme="red" variant="ghost" onClick={() => handleRemoveItem(idx)}>Remover</Button>
                          </HStack>
                        </VStack>
                      </Box>
                    ))}
                  </VStack>
                ) : (
                  <Box overflowX="auto">
                    <Table size="sm">
                      <Thead>
                        <Tr>
                          <Th>Produto</Th>
                          <Th>Fabricante</Th>
                          <Th isNumeric>Qtd</Th>
                          <Th isNumeric>Preço Unit.</Th>
                          <Th isNumeric>Total</Th>
                          <Th>Link</Th>
                          <Th>Notas</Th>
                          <Th>Ações</Th>
                        </Tr>
                      </Thead>
                      <Tbody>
                        {editItems.map((it, idx) => (
                          <Tr key={it.id || idx}>
                            <Td>
                              <Input size="sm" value={it.product_name} onChange={(e) => handleUpdateItem(idx, 'product_name', e.target.value)} />
                            </Td>
                            <Td>
                              <Input size="sm" value={it.manufacturer} onChange={(e) => handleUpdateItem(idx, 'manufacturer', e.target.value)} />
                            </Td>
                            <Td isNumeric>
                              <Input type="number" size="sm" value={it.quantity} onChange={(e) => handleUpdateItem(idx, 'quantity', Number(e.target.value))} />
                            </Td>
                            <Td isNumeric>
                              <Input type="number" size="sm" value={it.unit_price} onChange={(e) => handleUpdateItem(idx, 'unit_price', Number(e.target.value))} />
                            </Td>
                            <Td isNumeric>
                              {formatBRL(Number(it.total_price || 0))}
                            </Td>
                            <Td>
                              <Input size="sm" value={it.link || ''} onChange={(e) => handleUpdateItem(idx, 'link', e.target.value)} />
                            </Td>
                            <Td>
                              <Input size="sm" value={it.notes || ''} onChange={(e) => handleUpdateItem(idx, 'notes', e.target.value)} />
                            </Td>
                            <Td>
                              <Button size="sm" colorScheme="red" variant="ghost" onClick={() => handleRemoveItem(idx)}>Remover</Button>
                            </Td>
                          </Tr>
                        ))}
                      </Tbody>
                    </Table>
                  </Box>
                )}
              </Box>
            </VStack>
          </ModalBody>
          <ModalFooter>
            <HStack spacing={3}>
              <Button variant="ghost" onClick={onClose}>Cancelar</Button>
              <Button colorScheme="teal" isLoading={saving} onClick={handleSaveEdit}>Salvar</Button>
            </HStack>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </Container>
  );
} 