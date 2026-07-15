'use client'

import React, { useState, useEffect } from 'react';
import { fetchEvents as loadEvents } from '@/features/events/api/eventApi';
import {
  createExtraExpense,
  updateExtraExpense,
} from '@/features/financeiro/api/extraExpenseApi';
import { fetchExtraExpenseCategories } from '@/features/financeiro/api/extraExpenseCategoryApi';
import { fetchLocations, type LocationDTO } from '@/features/reference-data';
import {
  Box,
  VStack,
  HStack,
  Heading,
  FormControl,
  FormLabel,
  Input,
  Select,
  Textarea,
  Button,
  useToast,
  useColorModeValue,
  Image,
  IconButton,
  Text,
  useDisclosure,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalCloseButton,
  ModalFooter,
  NumberInput,
  NumberInputField,
  NumberInputStepper,
  NumberIncrementStepper,
  NumberDecrementStepper,
  Spinner,
  Alert,
  AlertIcon,
} from '@chakra-ui/react';
import { CloseIcon, AddIcon } from '@chakra-ui/icons';
import { ExtraExpense, CreateExtraExpenseData, UpdateExtraExpenseData } from '../interfaces/IExtraExpense';
import { uploadImage } from '@/features/images/api/imageApi';

interface ExtraExpensesFormProps {
  isOpen: boolean;
  onClose: () => void;
  editingExpense: ExtraExpense | null;
}

export default function ExtraExpensesForm({ isOpen, onClose, editingExpense }: ExtraExpensesFormProps) {
  const [formData, setFormData] = useState<CreateExtraExpenseData>({
    category_id: '',
    description: '',
    amount: 0,
    date: new Date().toISOString().split('T')[0],
    location_id: '',
    event_id: '',
    notes: '',
  });
  const [categories, setCategories] = useState<any[]>([]);
  const [locations, setLocations] = useState<any[]>([]);
  const [events, setEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string>('');
  const [receiptUrl, setReceiptUrl] = useState<string>('');
  const toast = useToast();
  const bgColor = useColorModeValue('white', 'gray.700');
  const borderColor = useColorModeValue('gray.200', 'gray.600');

  useEffect(() => {
    if (isOpen) {
      fetchCategories();
      loadLocations();
      fetchEvents();
      
      if (editingExpense) {
        setFormData({
          category_id: editingExpense.category_id,
          description: editingExpense.description || '',
          amount: editingExpense.amount,
          date: new Date(editingExpense.date).toISOString().split('T')[0],
          location_id: editingExpense.location_id || '',
          event_id: editingExpense.event_id || '',
          notes: editingExpense.notes || '',
        });
        setReceiptUrl(editingExpense.receipt_url || '');
        setPreviewUrl(editingExpense.receipt_url || '');
      } else {
        resetForm();
      }
    }
  }, [isOpen, editingExpense]);

  const fetchCategories = async () => {
    try {
      const token = localStorage.getItem('@ti-assistant:token');
      if (!token) return;
      const data = await fetchExtraExpenseCategories(token);
      setCategories(data);
    } catch (error) {
      console.error('Erro ao buscar categorias:', error);
    }
  };

  const loadLocations = async () => {
    try {
      const token = localStorage.getItem('@ti-assistant:token');
      if (!token) return;
      const data = await fetchLocations(token);
      setLocations(data);
    } catch (error) {
      console.error('Erro ao buscar localizações:', error);
    }
  };

  const fetchEvents = async () => {
    try {
      const token = localStorage.getItem('@ti-assistant:token');
      if (!token) return;
      const data = await loadEvents(token);
      setEvents(data);
    } catch (error) {
      console.error('Erro ao buscar eventos:', error);
    }
  };

  const resetForm = () => {
    setFormData({
      category_id: '',
      description: '',
      amount: 0,
      date: new Date().toISOString().split('T')[0],
      location_id: '',
      event_id: '',
      notes: '',
    });
    setSelectedImage(null);
    setPreviewUrl('');
    setReceiptUrl('');
  };

  const handleInputChange = (field: keyof CreateExtraExpenseData, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedImage(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewUrl(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async () => {
    if (!formData.category_id || !formData.amount || !formData.date) {
      toast({
        title: 'Erro',
        description: 'Preencha todos os campos obrigatórios',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    setLoading(true);
    try {
      // Fazer upload da imagem se houver uma selecionada
      let finalReceiptUrl = receiptUrl;
      if (selectedImage) {
        console.log('Fazendo upload da imagem...');
        console.log('Imagem selecionada:', selectedImage);
        console.log('Tamanho da imagem:', selectedImage.size);
        console.log('Tipo da imagem:', selectedImage.type);
        
        try {
          const uploaded = await uploadImage(selectedImage);
          finalReceiptUrl = uploaded.key;
          console.log('Upload bem-sucedido:', uploaded.key);
        } catch (uploadError: any) {
          console.error('Erro no upload da imagem:', uploadError);
          toast({
            title: 'Erro no Upload',
            description: uploadError.message || 'Erro ao enviar imagem.',
            status: 'error',
            duration: 5000,
            isClosable: true,
          });
          setLoading(false);
          return;
        }
      }

      const token = localStorage.getItem('@ti-assistant:token');
      if (!token) throw new Error('Token não encontrado');

      const submitData = {
        ...formData,
        receipt_url: finalReceiptUrl,
      };

      if (editingExpense) {
        await updateExtraExpense(token, editingExpense.id, submitData);
      } else {
        await createExtraExpense(token, submitData);
      }

      toast({
        title: 'Sucesso',
        description: editingExpense ? 'Gasto atualizado com sucesso' : 'Gasto criado com sucesso',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });

      onClose();
      resetForm();
    } catch (error: any) {
      console.error('Erro ao salvar gasto:', error);
      toast({
        title: 'Erro',
        description: error.message || 'Erro ao salvar gasto',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} size="xl" scrollBehavior="inside">
      <ModalOverlay />
      <ModalContent>
        <ModalHeader>
          {editingExpense ? 'Editar Gasto Extra' : 'Novo Gasto Extra'}
        </ModalHeader>
        <ModalCloseButton />
        <ModalBody>
          <VStack spacing={4} align="stretch">
            <FormControl isRequired>
              <FormLabel>Categoria</FormLabel>
              <Select
                value={formData.category_id}
                onChange={(e) => handleInputChange('category_id', e.target.value)}
                placeholder="Selecione uma categoria"
              >
                {categories.map(category => (
                  <option key={category.id} value={category.id}>
                    {category.label}
                  </option>
                ))}
              </Select>
            </FormControl>

            <FormControl>
              <FormLabel>Descrição</FormLabel>
              <Textarea
                value={formData.description}
                onChange={(e) => handleInputChange('description', e.target.value)}
                placeholder="Descreva o gasto..."
                rows={3}
              />
            </FormControl>

            <HStack spacing={4}>
              <FormControl isRequired>
                <FormLabel>Valor (R$)</FormLabel>
                <NumberInput
                  value={formData.amount}
                  onChange={(value) => handleInputChange('amount', parseFloat(value) || 0)}
                  min={0}
                  precision={2}
                >
                  <NumberInputField />
                  <NumberInputStepper>
                    <NumberIncrementStepper />
                    <NumberDecrementStepper />
                  </NumberInputStepper>
                </NumberInput>
              </FormControl>

              <FormControl isRequired>
                <FormLabel>Data</FormLabel>
                <Input
                  type="date"
                  value={formData.date}
                  onChange={(e) => handleInputChange('date', e.target.value)}
                />
              </FormControl>
            </HStack>

            <HStack spacing={4}>
              <FormControl>
                <FormLabel>Local (opcional)</FormLabel>
                <Select
                  value={formData.location_id}
                  onChange={(e) => handleInputChange('location_id', e.target.value)}
                  placeholder="Selecione um local"
                >
                  {locations.map(location => (
                    <option key={location.id} value={location.id}>
                      {location.name}
                    </option>
                  ))}
                </Select>
              </FormControl>

              <FormControl>
                <FormLabel>Evento (opcional)</FormLabel>
                <Select
                  value={formData.event_id}
                  onChange={(e) => handleInputChange('event_id', e.target.value)}
                  placeholder="Selecione um evento"
                >
                  {events.map(event => (
                    <option key={event.id} value={event.id}>
                      {event.title}
                    </option>
                  ))}
                </Select>
              </FormControl>
            </HStack>

            <FormControl>
              <FormLabel>Observações</FormLabel>
              <Textarea
                value={formData.notes}
                onChange={(e) => handleInputChange('notes', e.target.value)}
                placeholder="Observações adicionais..."
                rows={3}
              />
            </FormControl>

            <FormControl>
              <FormLabel>Recibo/Nota Fiscal (opcional)</FormLabel>
              <VStack spacing={3} align="stretch">
                <Text fontSize="sm" color="gray.600">
                  Selecione uma imagem do recibo ou nota fiscal. A imagem será enviada automaticamente ao salvar o gasto.
                </Text>
                <Input
                  type="file"
                  accept="image/*"
                  onChange={handleImageChange}
                  size="sm"
                />
                
                {selectedImage && (
                  <HStack spacing={2}>
                    <IconButton
                      size="sm"
                      icon={<CloseIcon />}
                      onClick={() => {
                        setSelectedImage(null);
                        setPreviewUrl('');
                        setReceiptUrl('');
                      }}
                      aria-label="Remover imagem"
                    />
                    <Text fontSize="sm" color="blue.600">
                      Imagem selecionada: {selectedImage.name}
                    </Text>
                  </HStack>
                )}

                {(previewUrl || receiptUrl) && (
                  <Box>
                    <Text fontSize="sm" mb={2}>Preview:</Text>
                    <Image
                      src={previewUrl || receiptUrl}
                      alt="Preview do recibo"
                      maxH="200px"
                      objectFit="contain"
                      borderRadius="md"
                      border="1px solid"
                      borderColor={borderColor}
                    />
                  </Box>
                )}

                {receiptUrl && (
                  <Alert status="success">
                    <AlertIcon />
                    Imagem enviada com sucesso!
                  </Alert>
                )}

                {selectedImage && !receiptUrl && (
                  <Alert status="info">
                    <AlertIcon />
                    Imagem selecionada. Será enviada automaticamente ao salvar o gasto.
                  </Alert>
                )}
              </VStack>
            </FormControl>
          </VStack>
        </ModalBody>

        <ModalFooter>
          <HStack spacing={3}>
            <Button variant="ghost" onClick={handleClose}>
              Cancelar
            </Button>
            <Button
              colorScheme="blue"
              onClick={handleSubmit}
              isLoading={loading}
              loadingText="Salvando..."
            >
              {editingExpense ? 'Atualizar' : 'Criar'}
            </Button>
          </HStack>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
} 