'use client';

import { useEffect, useState } from 'react';
import {
  FormControl,
  FormLabel,
  Input,
  Select,
  SimpleGrid,
  Textarea,
  VStack,
  useToast,
} from '@chakra-ui/react';
import type { PurchaseRequestPriority } from '@ti-assistant/contracts';
import { useAuthSession } from '@/features/identity';
import { fetchLocalesByUserLocation, type LocaleDTO } from '@/features/reference-data';
import { canSetPriorityInWizard } from '@/features/procurement/lib/purchaseRequestAccess';
import { purchaseRequestPriorityLabel } from '@/features/procurement/types';
import {
  todayLocalIsoDate,
  type PurchaseRequestWizardForm,
} from './purchaseRequestWizardTypes';

const WIZARD_PRIORITIES: PurchaseRequestPriority[] = ['LOW', 'MEDIUM', 'HIGH', 'URGENT'];

interface PurchaseRequestWizardStepGeneralProps {
  form: PurchaseRequestWizardForm;
  onChange: (form: PurchaseRequestWizardForm) => void;
  isDisabled?: boolean;
}

export function PurchaseRequestWizardStepGeneral({
  form,
  onChange,
  isDisabled = false,
}: PurchaseRequestWizardStepGeneralProps) {
  const { token, user } = useAuthSession();
  const showPriority = canSetPriorityInWizard(user?.roles ?? []);
  const toast = useToast();
  const [locales, setLocales] = useState<LocaleDTO[]>([]);
  const [loadingLocales, setLoadingLocales] = useState(false);
  const [selectedLocaleId, setSelectedLocaleId] = useState('');
  const today = todayLocalIsoDate();

  useEffect(() => {
    let cancelled = false;

    const loadLocales = async () => {
      if (!token) return;

      setLoadingLocales(true);
      try {
        const data = await fetchLocalesByUserLocation(token);
        if (!cancelled) {
          setLocales(data);
        }
      } catch (error) {
        if (!cancelled) {
          toast({
            title: 'Erro',
            description: error instanceof Error ? error.message : 'Erro ao carregar locais',
            status: 'error',
            duration: 3000,
            isClosable: true,
          });
        }
      } finally {
        if (!cancelled) {
          setLoadingLocales(false);
        }
      }
    };

    void loadLocales();

    return () => {
      cancelled = true;
    };
  }, [token, toast]);

  useEffect(() => {
    if (!form.destination) {
      setSelectedLocaleId('');
      return;
    }
    if (!locales.length) return;

    const match = locales.find((locale) => locale.name === form.destination);
    setSelectedLocaleId(match?.id ?? '');
  }, [form.destination, locales]);

  const handleLocaleChange = (localeId: string) => {
    setSelectedLocaleId(localeId);
    const selected = locales.find((locale) => locale.id === localeId);
    onChange({ ...form, destination: selected ? selected.name : '' });
  };

  const handleDeadlineChange = (value: string) => {
    if (value && value < today) {
      toast({
        title: 'Prazo de entrega não pode ser anterior a hoje',
        status: 'warning',
        duration: 3000,
        isClosable: true,
      });
      return;
    }
    onChange({ ...form, delivery_deadline: value });
  };

  return (
    <VStack align="stretch" spacing={4}>
      <FormControl isRequired>
        <FormLabel>Justificativa</FormLabel>
        <Textarea
          value={form.justification}
          onChange={(e) => onChange({ ...form, justification: e.target.value })}
          placeholder="Descreva a necessidade da compra"
          isDisabled={isDisabled}
          rows={4}
        />
      </FormControl>

      <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
        <FormControl isRequired>
          <FormLabel>Local de Destino</FormLabel>
          <Select
            placeholder="Selecione o local de destino"
            value={selectedLocaleId}
            onChange={(e) => handleLocaleChange(e.target.value)}
            isDisabled={isDisabled || loadingLocales}
          >
            {locales.map((locale) => (
              <option key={locale.id} value={locale.id}>
                {locale.name} - {locale.location?.name ?? '—'}
              </option>
            ))}
          </Select>
        </FormControl>

        <FormControl isRequired>
          <FormLabel>Prazo de entrega</FormLabel>
          <Input
            type="date"
            value={form.delivery_deadline}
            onChange={(e) => handleDeadlineChange(e.target.value)}
            min={today}
            isDisabled={isDisabled}
          />
        </FormControl>
      </SimpleGrid>

      {showPriority && (
        <FormControl>
          <FormLabel>Prioridade</FormLabel>
          <Select
            value={form.priority}
            onChange={(e) =>
              onChange({ ...form, priority: e.target.value as PurchaseRequestPriority })
            }
            isDisabled={isDisabled}
          >
            {WIZARD_PRIORITIES.map((priority) => (
              <option key={priority} value={priority}>
                {purchaseRequestPriorityLabel(priority)}
              </option>
            ))}
          </Select>
        </FormControl>
      )}

      <FormControl>
        <FormLabel>Observações</FormLabel>
        <Textarea
          value={form.notes}
          onChange={(e) => onChange({ ...form, notes: e.target.value })}
          placeholder="Informações adicionais (opcional)"
          isDisabled={isDisabled}
          rows={2}
        />
      </FormControl>
    </VStack>
  );
}
