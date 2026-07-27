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
import type { FiscalNcmDTO, UpdateFiscalNcmInput } from '@ti-assistant/contracts';
import {
  fetchFiscalNcmById,
  setFiscalNcmActive,
  updateFiscalNcm,
} from '@/features/financeiro/api/fiscalCatalogApi';
import { RateLimitError } from '@/features/financeiro/api/extraExpenseApi';
import { CestCodesField } from '@/features/financeiro/components/CestCodesField';

interface FormState {
  code: string;
  description: string;
  effective_from: string;
  cest_codes: string[];
}

function toDateInputValue(value?: string | null): string {
  if (!value) return '';
  return value.slice(0, 10);
}

function formFromNcm(ncm: FiscalNcmDTO): FormState {
  return {
    code: ncm.code,
    description: ncm.description,
    effective_from: toDateInputValue(ncm.effective_from),
    cest_codes: ncm.cests?.map((c) => c.code) ?? [],
  };
}

function validateForm(data: FormState): Record<string, string> {
  const errors: Record<string, string> = {};

  if (!data.description.trim()) {
    errors.description = 'Descrição oficial é obrigatória';
  }

  return errors;
}

function formatNcmDisplay(code: string): string {
  const digits = code.replace(/\D/g, '');
  if (digits.length !== 8) return code;
  return `${digits.slice(0, 4)}.${digits.slice(4, 6)}.${digits.slice(6, 8)}`;
}

export default function EditFiscalNcmPage() {
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

  const loadNcm = useCallback(async () => {
    setIsLoading(true);
    try {
      const ncm = await fetchFiscalNcmById(id);
      setFormData(formFromNcm(ncm));
      setActive(ncm.active);
    } catch (error) {
      if (error instanceof RateLimitError) {
        router.push('/rate-limit');
        return;
      }
      toast({
        title: 'Erro',
        description: 'Não foi possível carregar o NCM.',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
      router.push('/fiscal-codes');
    } finally {
      setIsLoading(false);
    }
  }, [id, router, toast]);

  useEffect(() => {
    if (id) {
      loadNcm();
    }
  }, [id, loadNcm]);

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
      const payload: UpdateFiscalNcmInput = {
        description: formData.description.trim(),
        effective_from: formData.effective_from ? formData.effective_from : null,
        cest_codes: formData.cest_codes,
      };

      await updateFiscalNcm(id, payload);

      toast({
        title: 'Sucesso',
        description: 'NCM atualizado com sucesso.',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
      router.push('/fiscal-codes');
    } catch (error) {
      if (error instanceof RateLimitError) {
        router.push('/rate-limit');
        return;
      }
      toast({
        title: 'Erro',
        description: error instanceof Error ? error.message : 'Não foi possível atualizar o NCM.',
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
      const nextActive = !active;
      await setFiscalNcmActive(id, nextActive);
      setActive(nextActive);

      toast({
        title: 'Sucesso',
        description: `NCM ${nextActive ? 'ativado' : 'desativado'} com sucesso.`,
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
        description: 'Não foi possível alterar o status do NCM.',
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
          <Heading size="lg">Editar NCM</Heading>
          <Button variant="outline" onClick={() => router.push('/fiscal-codes')}>
            Voltar
          </Button>
        </Box>

        <Card>
          <CardHeader>
            <HStack justify="space-between" align="center">
              <Heading size="md">Status</Heading>
              <HStack spacing={3}>
                <Text fontSize="sm" color="gray.600">
                  {active ? 'Ativo' : 'Inativo'}
                </Text>
                <Switch
                  aria-label={active ? 'Desativar NCM' : 'Ativar NCM'}
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
            <Heading size="md">Dados do NCM</Heading>
          </CardHeader>
          <CardBody>
            <form onSubmit={handleSubmit}>
              <VStack spacing={4} align="stretch">
                <SimpleGrid columns={2} spacing={4} width="100%">
                  <FormControl isDisabled>
                    <FormLabel>NCM</FormLabel>
                    <Input value={formatNcmDisplay(formData.code)} isReadOnly />
                  </FormControl>

                  <FormControl isRequired isInvalid={!!errors.description}>
                    <FormLabel>Descrição Oficial</FormLabel>
                    <Input
                      value={formData.description}
                      onChange={(e) => updateField('description', e.target.value)}
                      placeholder="Descrição da mercadoria"
                    />
                    <FormErrorMessage>{errors.description}</FormErrorMessage>
                  </FormControl>

                  <FormControl isInvalid={!!errors.effective_from}>
                    <FormLabel>Vigência — Início</FormLabel>
                    <Input
                      type="date"
                      value={formData.effective_from}
                      onChange={(e) => updateField('effective_from', e.target.value)}
                    />
                    <FormErrorMessage>{errors.effective_from}</FormErrorMessage>
                  </FormControl>
                </SimpleGrid>

                <CestCodesField
                  value={formData.cest_codes}
                  onChange={(next) => updateField('cest_codes', next)}
                />

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
