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
import {
  canSubmitAllocationDates,
  defaultDeliveryDeadlineIso,
  isAllocationConfirmEnabled,
  shouldBlockReturnDateChange,
  shouldClearReturnDateOnDeadlineChange,
  todayIsoDate,
} from '@/features/inventory/utils/allocationDeadlineUi';
import { fetchMe, useAuthSession } from '@/features/identity';
import { fetchLocalesByUserLocation, type LocaleDTO } from '@/features/reference-data';

interface InventoryAllocationModalProps {
  isOpen: boolean;
  onClose: () => void;
  item: InventoryItem | null;
  onSubmit: (data: {
    delivery_deadline: string;
    return_date: string;
    destination: string;
    notes: string;
  }) => void;
  isLoading?: boolean;
}

export const InventoryAllocationModal: React.FC<InventoryAllocationModalProps> = ({
  isOpen,
  onClose,
  item,
  onSubmit,
  isLoading = false,
}) => {
  const [deliveryDeadline, setDeliveryDeadline] = useState('');
  const [returnDate, setReturnDate] = useState('');
  const [destination, setDestination] = useState('');
  const [notes, setNotes] = useState('');
  const [locales, setLocales] = useState<LocaleDTO[]>([]);
  const [loadingLocales, setLoadingLocales] = useState(false);
  const [userSector, setUserSector] = useState<string>('');
  const { colorMode } = useColorMode();
  const toast = useToast();
  const { token } = useAuthSession();

  const today = todayIsoDate();
  const inputBg = colorMode === 'dark' ? 'rgba(45, 55, 72, 0.5)' : 'gray.50';
  const inputBorder = colorMode === 'dark' ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)';
  const labelColor = colorMode === 'dark' ? 'white' : 'gray.800';
  const inputFocus = {
    borderColor: colorMode === 'dark' ? 'blue.400' : 'blue.500',
    boxShadow: 'none',
  };
  const inputHover = {
    borderColor: colorMode === 'dark' ? 'rgba(255, 255, 255, 0.2)' : 'rgba(0, 0, 0, 0.2)',
  };

  // Buscar locais da filial do usuário
  useEffect(() => {
    if (isOpen) {
      fetchUserLocales();
    }
  }, [isOpen]);

  const fetchUserLocales = async () => {
    setLoadingLocales(true);
    try {
      if (!token) {
        throw new Error('Token não encontrado');
      }

      const localesData = await fetchLocalesByUserLocation(token);
      setLocales(localesData);

      const userData = await fetchMe(token);
      setUserSector(userData.sector?.id || '');
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

  const handleDeliveryDeadlineChange = (value: string) => {
    setDeliveryDeadline(value);
    if (shouldClearReturnDateOnDeadlineChange(value, returnDate)) {
      setReturnDate('');
      toast({
        title: 'Data de devolução ajustada',
        description: 'A devolução não pode ser anterior ao prazo de entrega.',
        status: 'warning',
        duration: 3000,
        isClosable: true,
      });
    }
  };

  const handleReturnDateChange = (value: string) => {
    if (shouldBlockReturnDateChange(value, deliveryDeadline)) {
      toast({
        title: 'Data inválida',
        description: 'A data de devolução não pode ser anterior ao prazo de entrega.',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
      return;
    }
    setReturnDate(value);
  };

  const handleSubmit = () => {
    if (!isAllocationConfirmEnabled({ deliveryDeadline, returnDate, destination })) return;
    if (!canSubmitAllocationDates({ deliveryDeadline, returnDate, today })) {
      toast({
        title: 'Data inválida',
        description: 'A data de devolução não pode ser anterior ao prazo de entrega.',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
      return;
    }
    onSubmit({
      delivery_deadline: deliveryDeadline,
      return_date: returnDate,
      destination,
      notes,
    });
  };

  React.useEffect(() => {
    if (isOpen) {
      setDeliveryDeadline(defaultDeliveryDeadlineIso());
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
        <ModalHeader color={labelColor}>
          Alocar Item{item ? `: ${item.name}` : ''}
        </ModalHeader>
        <ModalCloseButton color={labelColor} />
        <ModalBody>
          <VStack spacing={4} align="stretch">
            <FormControl isRequired>
              <FormLabel color={labelColor}>Prazo de entrega</FormLabel>
              <Input
                type="date"
                value={deliveryDeadline}
                onChange={e => handleDeliveryDeadlineChange(e.target.value)}
                min={today}
                max={returnDate || undefined}
                bg={inputBg}
                backdropFilter="blur(12px)"
                borderColor={inputBorder}
                _hover={inputHover}
                _focus={inputFocus}
              />
            </FormControl>
            <FormControl isRequired>
              <FormLabel color={labelColor}>Data de Devolução</FormLabel>
              <Input
                type="date"
                value={returnDate}
                onChange={e => handleReturnDateChange(e.target.value)}
                min={deliveryDeadline || today}
                bg={inputBg}
                backdropFilter="blur(12px)"
                borderColor={inputBorder}
                _hover={inputHover}
                _focus={inputFocus}
              />
            </FormControl>
            <FormControl isRequired>
              <FormLabel color={labelColor}>Local de Destino</FormLabel>
              <Select
                placeholder="Selecione o local de destino"
                value={destination}
                onChange={e => setDestination(e.target.value)}
                bg={inputBg}
                backdropFilter="blur(12px)"
                borderColor={inputBorder}
                _hover={inputHover}
                _focus={inputFocus}
              >
                {locales.map((locale) => (
                  <option key={locale.id} value={locale.id}>
                    {locale.name} - {locale.location?.name ?? '—'}
                  </option>
                ))}
              </Select>
            </FormControl>
            <FormControl>
              <FormLabel color={labelColor}>Observações</FormLabel>
              <Textarea
                placeholder="Adicione observações relevantes..."
                value={notes}
                onChange={e => setNotes(e.target.value)}
                bg={inputBg}
                backdropFilter="blur(12px)"
                borderColor={inputBorder}
                _hover={inputHover}
                _focus={inputFocus}
              />
            </FormControl>
          </VStack>
        </ModalBody>
        <ModalFooter>
          <Button
            variant="ghost"
            mr={3}
            onClick={onClose}
            color={labelColor}
          >
            Cancelar
          </Button>
          <Button
            colorScheme="purple"
            onClick={handleSubmit}
            isDisabled={!isAllocationConfirmEnabled({ deliveryDeadline, returnDate, destination })}
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
