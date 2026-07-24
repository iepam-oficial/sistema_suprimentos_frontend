'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
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
  Input,
  Select,
  SimpleGrid,
  Switch,
  VStack,
  useToast,
} from '@chakra-ui/react';
import type { CreateDepreciationRateInput } from '@ti-assistant/contracts';
import { fetchChartOfAccounts } from '@/features/financeiro/api/chartOfAccountApi';
import type { ChartOfAccount } from '@/features/financeiro/types';
import { createDepreciationRate } from '@/features/inventory/api/depreciationRateApi';
import { RateLimitError } from '@/features/financeiro/api/extraExpenseApi';

interface FormState {
  description: string;
  ncm: string;
  cest: string;
  chart_of_account_id: string;
  service_life_years: string;
  annual_rate: string;
  priority: string;
  effective_from: string;
  effective_to: string;
  active: boolean;
}

const initialFormState: FormState = {
  description: '',
  ncm: '',
  cest: '',
  chart_of_account_id: '',
  service_life_years: '',
  annual_rate: '',
  priority: '100',
  effective_from: '',
  effective_to: '',
  active: true,
};

function validateForm(data: FormState): Record<string, string> {
  const errors: Record<string, string> = {};

  if (!data.description.trim()) {
    errors.description = 'Descrição é obrigatória';
  }

  if (!data.chart_of_account_id) {
    errors.chart_of_account_id = 'Plano de contas é obrigatório';
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

export default function AddDepreciationRatePage() {
  const [formData, setFormData] = useState<FormState>(initialFormState);
  const [chartOfAccounts, setChartOfAccounts] = useState<ChartOfAccount[]>([]);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingAccounts, setIsLoadingAccounts] = useState(true);
  const router = useRouter();
  const toast = useToast();

  useEffect(() => {
    const loadAccounts = async () => {
      try {
        const accounts = await fetchChartOfAccounts('ATIVO');
        setChartOfAccounts(accounts);
      } catch {
        toast({
          title: 'Erro',
          description: 'Não foi possível carregar os planos de contas.',
          status: 'error',
          duration: 3000,
          isClosable: true,
        });
      } finally {
        setIsLoadingAccounts(false);
      }
    };

    loadAccounts();
  }, [toast]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const validationErrors = validateForm(formData);
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    setErrors({});
    setIsLoading(true);

    try {
      const token = localStorage.getItem('@ti-assistant:token');
      if (!token) {
        throw new Error('Token não encontrado');
      }

      const payload: CreateDepreciationRateInput = {
        description: formData.description.trim(),
        ncm: formData.ncm.trim() || null,
        chart_of_account_id: formData.chart_of_account_id,
        service_life_years: Number(formData.service_life_years),
        annual_rate: Number(formData.annual_rate),
        effective_from: formData.effective_from,
        active: formData.active,
      };

      if (formData.cest.trim()) {
        payload.cest = formData.cest.trim();
      }

      if (formData.priority) {
        payload.priority = Number(formData.priority);
      }

      if (formData.effective_to) {
        payload.effective_to = formData.effective_to;
      }

      await createDepreciationRate(token, payload);

      toast({
        title: 'Sucesso',
        description: 'Regra de depreciação criada com sucesso.',
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
            : 'Não foi possível criar a regra de depreciação.',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const updateField = <K extends keyof FormState>(field: K, value: FormState[K]) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next[field];
        return next;
      });
    }
  };

  return (
    <Box p={4}>
      <VStack spacing={4} align="stretch">
        <Box display="flex" justifyContent="space-between" alignItems="center">
          <Heading size="lg">Nova Regra de Depreciação</Heading>
          <Button variant="outline" onClick={() => router.push('/depreciation-rates')}>
            Voltar
          </Button>
        </Box>

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

                  <FormControl isRequired isInvalid={!!errors.chart_of_account_id}>
                    <FormLabel>Plano de Contas</FormLabel>
                    <Select
                      placeholder="Selecione o plano de contas"
                      value={formData.chart_of_account_id}
                      onChange={(e) => updateField('chart_of_account_id', e.target.value)}
                      isDisabled={isLoadingAccounts}
                    >
                      {chartOfAccounts.map((account) => (
                        <option key={account.id} value={account.id}>
                          {account.codigo} — {account.nome}
                        </option>
                      ))}
                    </Select>
                    <FormErrorMessage>{errors.chart_of_account_id}</FormErrorMessage>
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

                <FormControl display="flex" alignItems="center" width="100%">
                  <FormLabel htmlFor="active" mb={0}>
                    Ativo
                  </FormLabel>
                  <Switch
                    id="active"
                    isChecked={formData.active}
                    onChange={(e) => updateField('active', e.target.checked)}
                  />
                </FormControl>

                <Box display="flex" justifyContent="flex-end" width="100%">
                  <Button colorScheme="blue" type="submit" isLoading={isLoading}>
                    Salvar Regra
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
