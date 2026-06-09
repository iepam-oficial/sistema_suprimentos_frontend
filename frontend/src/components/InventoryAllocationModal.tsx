import React, { useState, useEffect } from 'react';
import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  ModalCloseButton,
  Button,
  VStack,
  FormControl,
  FormLabel,
  Input,
  Textarea,
  Select,
  useColorMode,
  useToast,
} from '@chakra-ui/react';

import type { InventoryItem } from '@/features/inventory/types';

interface Locale {
  id: string;
  name: string;
  description?: string;
  location: {
    id: string;
    name: string;
  };
}

interface InventoryAllocationModalProps {
  isOpen: boolean;
  onClose: () => void;
  item: InventoryItem | null;
  onSubmit: (data: { return_date: string; destination: string; notes: string }) => void;
  isLoading?: boolean;
}

export const InventoryAllocationModal: React.FC<InventoryAllocationModalProps> = ({
  isOpen,
  onClose,
  item,
  onSubmit,
  isLoading = false,
}) => {
  const [returnDate, setReturnDate] = useState('');
  const [destination, setDestination] = useState('');
  const [notes, setNotes] = useState('');
  const [locales, setLocales] = useState<Locale[]>([]);
  const [loadingLocales, setLoadingLocales] = useState(false);
  const [userSector, setUserSector] = useState<string>('');
  const { colorMode } = useColorMode();
  const toast = useToast();

  // Buscar locais da filial do usuário
  useEffect(() => {
    if (isOpen) {
      fetchUserLocales();
    }
  }, [isOpen]);

  const fetchUserLocales = async () => {
    setLoadingLocales(true);
    try {
      const token = localStorage.getItem('@ti-assistant:token');
      if (!token) {
        throw new Error('Token não encontrado');
      }

      const response = await fetch('/api/locales/user-location', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Erro ao buscar locais');
      }

      const localesData = await response.json();
      setLocales(localesData);

      // Buscar dados do usuário para obter seu setor
      const userResponse = await fetch('/api/users/me', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (userResponse.ok) {
        const userData = await userResponse.json();
        setUserSector(userData.sector?.id || '');
      }
    } catch (error) {
      toast({
        title: 'Erro',
        description: error instanceof Error ? error.message : 'Erro ao carregar locais',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setLoadingLocales(false);
    }
  };

  const handleSubmit = () => {
    onSubmit({
      return_date: returnDate,
      destination,
      notes,
    });
  };

  React.useEffect(() => {
    if (isOpen) {
      setReturnDate('');
      setDestination('');
      setNotes('');
    }
  }, [isOpen, item]);

  return (
    <Modal isOpen={isOpen} onClose={onClose} isCentered>
      <ModalOverlay />
      <ModalContent
        bg={colorMode === 'dark' ? 'rgba(45, 55, 72, 0.95)' : 'gray.50'}
        backdropFilter="blur(12px)"
        borderWidth="1px"
        borderColor={colorMode === 'dark' ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'}
      >
        <ModalHeader color={colorMode === 'dark' ? 'white' : 'gray.800'}>
          Alocar Item{item ? `: ${item.name}` : ''}
        </ModalHeader>
        <ModalCloseButton color={colorMode === 'dark' ? 'white' : 'gray.800'} />
        <ModalBody>
          <VStack spacing={4} align="stretch">
            <FormControl isRequired>
              <FormLabel color={colorMode === 'dark' ? 'white' : 'gray.800'}>Data de Devolução</FormLabel>
              <Input
                type="date"
                value={returnDate}
                onChange={e => setReturnDate(e.target.value)}
                min={new Date().toISOString().split('T')[0]}
                bg={colorMode === 'dark' ? 'rgba(45, 55, 72, 0.5)' : 'gray.50'}
                backdropFilter="blur(12px)"
                borderColor={colorMode === 'dark' ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'}
                _hover={{
                  borderColor: colorMode === 'dark' ? 'rgba(255, 255, 255, 0.2)' : 'rgba(0, 0, 0, 0.2)',
                }}
                _focus={{
                  borderColor: colorMode === 'dark' ? 'blue.400' : 'blue.500',
                  boxShadow: 'none',
                }}
              />
            </FormControl>
            <FormControl isRequired>
              <FormLabel color={colorMode === 'dark' ? 'white' : 'gray.800'}>Local de Destino</FormLabel>
              <Select
                placeholder="Selecione o local de destino"
                value={destination}
                onChange={e => setDestination(e.target.value)}
                bg={colorMode === 'dark' ? 'rgba(45, 55, 72, 0.5)' : 'gray.50'}
                backdropFilter="blur(12px)"
                borderColor={colorMode === 'dark' ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'}
                _hover={{
                  borderColor: colorMode === 'dark' ? 'rgba(255, 255, 255, 0.2)' : 'rgba(0, 0, 0, 0.2)',
                }}
                _focus={{
                  borderColor: colorMode === 'dark' ? 'blue.400' : 'blue.500',
                  boxShadow: 'none',
                }}
              >
                {locales.map((locale) => (
                  <option key={locale.id} value={locale.id}>
                    {locale.name} - {locale.location.name}
                  </option>
                ))}
              </Select>
            </FormControl>
            <FormControl>
              <FormLabel color={colorMode === 'dark' ? 'white' : 'gray.800'}>Observações</FormLabel>
              <Textarea
                placeholder="Adicione observações relevantes..."
                value={notes}
                onChange={e => setNotes(e.target.value)}
                bg={colorMode === 'dark' ? 'rgba(45, 55, 72, 0.5)' : 'gray.50'}
                backdropFilter="blur(12px)"
                borderColor={colorMode === 'dark' ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'}
                _hover={{
                  borderColor: colorMode === 'dark' ? 'rgba(255, 255, 255, 0.2)' : 'rgba(0, 0, 0, 0.2)',
                }}
                _focus={{
                  borderColor: colorMode === 'dark' ? 'blue.400' : 'blue.500',
                  boxShadow: 'none',
                }}
              />
            </FormControl>
          </VStack>
        </ModalBody>
        <ModalFooter>
          <Button
            variant="ghost"
            mr={3}
            onClick={onClose}
            color={colorMode === 'dark' ? 'white' : 'gray.800'}
          >
            Cancelar
          </Button>
          <Button
            colorScheme="purple"
            onClick={handleSubmit}
            isDisabled={!returnDate || !destination}
            isLoading={isLoading}
            bg={colorMode === 'dark' ? 'rgba(159, 122, 234, 0.8)' : undefined}
            _hover={{
              bg: colorMode === 'dark' ? 'rgba(159, 122, 234, 0.9)' : undefined,
              transform: 'translateY(-1px)',
            }}
            transition="all 0.3s ease"
          >
            Confirmar Alocação
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}; 