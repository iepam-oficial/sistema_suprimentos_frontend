'use client';

import { useState } from 'react';
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
  SimpleGrid,
  Switch,
  VStack,
  useToast,
} from '@chakra-ui/react';
import type { CreateFiscalNcmInput } from '@ti-assistant/contracts';
import { createFiscalNcm } from '@/features/financeiro/api/fiscalCatalogApi';
import { RateLimitError } from '@/features/financeiro/api/extraExpenseApi';
import { CestCodesField } from '@/features/financeiro/components/CestCodesField';

interface FormState {
  code: string;
  description: string;
  effective_from: string;
  active: boolean;
  cest_codes: string[];
}

const initialFormState: FormState = {
  code: '',
  description: '',
  effective_from: '',
  active: true,
  cest_codes: [],
};

function validateForm(data: FormState): Record<string, string> {
  const errors: Record<string, string> = {};

  const digits = data.code.replace(/\D/g, '');
  if (!digits) {
    errors.code = 'NCM é obrigatório';
  } else if (digits.length !== 8) {
    errors.code = 'NCM deve ter 8 dígitos';
  }

  if (!data.description.trim()) {
    errors.description = 'Descrição oficial é obrigatória';
  }

  return errors;
}

export default function AddFiscalNcmPage() {
  const [formData, setFormData] = useState<FormState>(initialFormState);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const toast = useToast();

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
      const payload: CreateFiscalNcmInput = {
        code: formData.code.trim(),
        description: formData.description.trim(),
        active: formData.active,
        cest_codes: formData.cest_codes,
      };

      if (formData.effective_from) {
        payload.effective_from = formData.effective_from;
      }

      await createFiscalNcm(payload);

      toast({
        title: 'Sucesso',
        description: 'NCM criado com sucesso.',
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
        description: error instanceof Error ? error.message : 'Não foi possível criar o NCM.',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Box p={4}>
      <VStack spacing={4} align="stretch">
        <Box display="flex" justifyContent="space-between" alignItems="center">
          <Heading size="lg">Novo NCM</Heading>
          <Button variant="outline" onClick={() => router.push('/fiscal-codes')}>
            Voltar
          </Button>
        </Box>

        <Card>
          <CardHeader>
            <Heading size="md">Dados do NCM</Heading>
          </CardHeader>
          <CardBody>
            <form onSubmit={handleSubmit}>
              <VStack spacing={4} align="stretch">
                <SimpleGrid columns={2} spacing={4} width="100%">
                  <FormControl isRequired isInvalid={!!errors.code}>
                    <FormLabel>NCM</FormLabel>
                    <Input
                      value={formData.code}
                      onChange={(e) => updateField('code', e.target.value)}
                      placeholder="Ex: 8471.30.12"
                    />
                    <FormErrorMessage>{errors.code}</FormErrorMessage>
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
                    Salvar NCM
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
