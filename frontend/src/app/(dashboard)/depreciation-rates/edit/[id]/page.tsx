'use client';

import { useCallback, useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  Box,
  Button,
  Card,
  CardBody,
  CardHeader,
  FormControl,
  FormErrorMessage,
  FormLabel,
  Heading,
  HStack,
  Input,
  SimpleGrid,
  Spinner,
  Switch,
  Text,
  VStack,
  useToast,
} from '@chakra-ui/react';
import type { DepreciationRateDTO, UpdateDepreciationRateInput } from '@ti-assistant/contracts';
import { RateLimitError } from '@/features/financeiro/api/extraExpenseApi';
import {
  fetchDepreciationRateById,
  setActiveDepreciationRate,
  updateDepreciationRate,
} from '@/features/inventory/api/depreciationRateApi';

interface FormState {
  description: string;
  ncm: string;
  cest: string;
  service_life_years: string;
  annual_rate: string;
  priority: string;
  effective_from: string;
  effective_to: string;
}

function toDateInputValue(value?: string | null): string {
  if (!value) return '';
  return value.slice(0, 10);
}

function formFromRate(rate: DepreciationRateDTO): FormState {
  return {
    description: rate.description,
    ncm: rate.ncm ?? '',
    cest: rate.cest ?? '',
    service_life_years: String(rate.service_life_years),
    annual_rate: String(rate.annual_rate),
    priority: String(rate.priority),
    effective_from: toDateInputValue(rate.effective_from),
    effective_to: toDateInputValue(rate.effective_to),
  };
}

function validateForm(data: FormState): Record<string, string> {
  const errors: Record<string, string> = {};

  if (!data.description.trim()) {
    errors.description = 'Descrição é obrigatória';
  }

  const serviceLife = Number(data.service_life_years);
  if (
    !data.service_life_years ||
    !Number.isInteger(serviceLife) ||
    serviceLife <= 0
  ) {
    errors.service_life_years = 'Vida útil deve ser um inteiro positivo';
  }

  const annualRate = Number(data.annual_rate);
  if (!data.annual_rate || isNaN(annualRate) || annualRate <= 0 || annualRate > 100) {
    errors.annual_rate = 'Taxa anual deve ser maior que 0 e no máximo 100';
  } else if (Math.abs(Math.round(annualRate * 100) - annualRate * 100) >= 1e-9) {
    errors.annual_rate = 'Taxa anual deve ter no máximo 2 casas decimais';
  }

  if (data.priority) {
    const priority = Number(data.priority);
    if (!Number.isInteger(priority)) {
      errors.priority = 'Prioridade deve ser um inteiro';
    }
  }

  if (!data.effective_from) {
    errors.effective_from = 'Data de início de vigência é obrigatória';
  }

  if (data.effective_to && data.effective_from && data.effective_to < data.effective_from) {
    errors.effective_to = 'Data fim deve ser posterior à data início';
  }

  return errors;
}

function buildUpdatePayload(formData: FormState): UpdateDepreciationRateInput {
  const payload: UpdateDepreciationRateInput = {
    description: formData.description.trim(),
    ncm: formData.ncm.trim() || null,
    service_life_years: Number(formData.service_life_years),
    annual_rate: Number(formData.annual_rate),
    effective_from: formData.effective_from,
    cest: formData.cest.trim() ? formData.cest.trim() : null,
    effective_to: formData.effective_to.trim() ? formData.effective_to : null,
  };

  if (formData.priority) {
    payload.priority = Number(formData.priority);
  }

  return payload;
}

export default function EditDepreciationRatePage() {
  const params = useParams();
  const id = String(params.id ?? '');
  const router = useRouter();
  const toast = useToast();

  const [formData, setFormData] = useState<FormState | null>(null);
  const [active, setActive] = useState(true);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isTogglingActive, setIsTogglingActive] = useState(false);

  const loadRate = useCallback(async () => {
    setIsLoading(true);
    try {
      const token = localStorage.getItem('@ti-assistant:token');
      if (!token) {
        throw new Error('Token não encontrado');
      }

      const rate = await fetchDepreciationRateById(token, id);

      setFormData(formFromRate(rate));
      setActive(rate.active);
    } catch (error) {
      if (error instanceof RateLimitError) {
        router.push('/rate-limit');
        return;
      }
      toast({
        title: 'Erro',
        description: 'Não foi possível carregar a regra de depreciação.',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
      router.push('/depreciation-rates');
    } finally {
      setIsLoading(false);
    }
  }, [id, router, toast]);

  useEffect(() => {
    if (id) {
      loadRate();
    }
  }, [id, loadRate]);

  const updateField = <K extends keyof FormState>(field: K, value: FormState[K]) => {
    setFormData((prev) => (prev ? { ...prev, [field]: value } : prev));
    if (errors[field]) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next[field];
        return next;
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData) return;

    const validationErrors = validateForm(formData);
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    setErrors({});
    setIsSaving(true);

    try {
      const token = localStorage.getItem('@ti-assistant:token');
      if (!token) {
        throw new Error('Token não encontrado');
      }

      await updateDepreciationRate(token, id, buildUpdatePayload(formData));

      toast({
        title: 'Sucesso',
        description: 'Regra de depreciação atualizada com sucesso.',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
      router.push('/depreciation-rates');
    } catch (error) {
      if (error instanceof RateLimitError) {
        router.push('/rate-limit');
        return;
      }
      toast({
        title: 'Erro',
        description:
          error instanceof Error
            ? error.message
            : 'Não foi possível atualizar a regra de depreciação.',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleToggleActive = async () => {
    setIsTogglingActive(true);
    try {
      const token = localStorage.getItem('@ti-assistant:token');
      if (!token) {
        throw new Error('Token não encontrado');
      }

      const nextActive = !active;
      await setActiveDepreciationRate(token, id, nextActive);
      setActive(nextActive);

      toast({
        title: 'Sucesso',
        description: `Regra ${nextActive ? 'ativada' : 'desativada'} com sucesso.`,
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
    } catch (error) {
      if (error instanceof RateLimitError) {
        router.push('/rate-limit');
        return;
      }
      toast({
        title: 'Erro',
        description: 'Não foi possível alterar o status da regra.',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setIsTogglingActive(false);
    }
  };

  if (isLoading || !formData) {
    return (
      <Box p={4} display="flex" justifyContent="center" alignItems="center" minH="200px">
        <Spinner size="lg" />
      </Box>
    );
  }

  return (
    <Box p={4}>
      <VStack spacing={4} align="stretch">
        <Box display="flex" justifyContent="space-between" alignItems="center">
          <Heading size="lg">Editar Regra de Depreciação</Heading>
          <Button variant="outline" onClick={() => router.push('/depreciation-rates')}>
            Voltar
          </Button>
        </Box>

        <Card>
          <CardHeader>
            <HStack justify="space-between" align="center">
              <Heading size="md">Status</Heading>
              <HStack spacing={3}>
                <Text fontSize="sm" color="gray.600">
                  {active ? 'Ativa' : 'Inativa'}
                </Text>
                <Switch
                  aria-label={active ? 'Desativar regra' : 'Ativar regra'}
                  isChecked={active}
                  isDisabled={isTogglingActive}
                  onChange={handleToggleActive}
                />
              </HStack>
            </HStack>
          </CardHeader>
        </Card>

        <Card>
          <CardHeader>
            <Heading size="md">Dados da Regra</Heading>
          </CardHeader>
          <CardBody>
            <form onSubmit={handleSubmit}>
              <VStack spacing={4}>
                <SimpleGrid columns={2} spacing={4} width="100%">
                  <FormControl isRequired isInvalid={!!errors.description}>
                    <FormLabel>Descrição</FormLabel>
                    <Input
                      value={formData.description}
                      onChange={(e) => updateField('description', e.target.value)}
                      placeholder="Ex: Máquinas automáticas"
                    />
                    <FormErrorMessage>{errors.description}</FormErrorMessage>
                  </FormControl>

                  <FormControl isInvalid={!!errors.ncm}>
                    <FormLabel>NCM</FormLabel>
                    <Input
                      value={formData.ncm}
                      onChange={(e) => updateField('ncm', e.target.value)}
                      placeholder="Opcional — Ex: 8471.30.12"
                    />
                    <FormErrorMessage>{errors.ncm}</FormErrorMessage>
                  </FormControl>

                  <FormControl isInvalid={!!errors.cest}>
                    <FormLabel>CEST</FormLabel>
                    <Input
                      value={formData.cest}
                      onChange={(e) => updateField('cest', e.target.value)}
                      placeholder="Opcional"
                    />
                    <FormErrorMessage>{errors.cest}</FormErrorMessage>
                  </FormControl>

                  <FormControl isRequired isInvalid={!!errors.service_life_years}>
                    <FormLabel>Vida Útil (anos)</FormLabel>
                    <Input
                      type="number"
                      min={1}
                      step={1}
                      value={formData.service_life_years}
                      onChange={(e) => updateField('service_life_years', e.target.value)}
                      placeholder="Ex: 5"
                    />
                    <FormErrorMessage>{errors.service_life_years}</FormErrorMessage>
                  </FormControl>

                  <FormControl isRequired isInvalid={!!errors.annual_rate}>
                    <FormLabel>Taxa Anual (%)</FormLabel>
                    <Input
                      type="number"
                      min={0.01}
                      max={100}
                      step={0.01}
                      value={formData.annual_rate}
                      onChange={(e) => updateField('annual_rate', e.target.value)}
                      placeholder="Ex: 20.00"
                    />
                    <FormErrorMessage>{errors.annual_rate}</FormErrorMessage>
                  </FormControl>

                  <FormControl isInvalid={!!errors.priority}>
                    <FormLabel>Prioridade</FormLabel>
                    <Input
                      type="number"
                      step={1}
                      value={formData.priority}
                      onChange={(e) => updateField('priority', e.target.value)}
                      placeholder="100"
                    />
                    <FormErrorMessage>{errors.priority}</FormErrorMessage>
                  </FormControl>

                  <FormControl isRequired isInvalid={!!errors.effective_from}>
                    <FormLabel>Vigência — Início</FormLabel>
                    <Input
                      type="date"
                      value={formData.effective_from}
                      onChange={(e) => updateField('effective_from', e.target.value)}
                    />
                    <FormErrorMessage>{errors.effective_from}</FormErrorMessage>
                  </FormControl>

                  <FormControl isInvalid={!!errors.effective_to}>
                    <FormLabel>Vigência — Fim</FormLabel>
                    <Input
                      type="date"
                      value={formData.effective_to}
                      onChange={(e) => updateField('effective_to', e.target.value)}
                    />
                    <FormErrorMessage>{errors.effective_to}</FormErrorMessage>
                  </FormControl>
                </SimpleGrid>

                <Box display="flex" justifyContent="flex-end" width="100%">
                  <Button colorScheme="blue" type="submit" isLoading={isSaving}>
                    Salvar Alterações
                  </Button>
                </Box>
              </VStack>
            </form>
          </CardBody>
        </Card>
      </VStack>
    </Box>
  );
}
