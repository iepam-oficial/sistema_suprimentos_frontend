'use client';

import {
  Box,
  Button,
  Center,
  Heading,
  HStack,
  Progress,
  Spinner,
  Text,
  useColorModeValue,
  VStack,
} from '@chakra-ui/react';
import { ArrowLeft } from 'lucide-react';
import { useUnitOfMeasures } from '../../hooks/useUnitOfMeasures';
import { usePurchaseRequestWizard, type PurchaseRequestWizardMode } from '../../hooks/usePurchaseRequestWizard';
import { PurchaseRequestWizardStepGeneral } from './PurchaseRequestWizardStepGeneral';
import { PurchaseRequestWizardStepItems } from './PurchaseRequestWizardStepItems';
import { PurchaseRequestWizardStepReview } from './PurchaseRequestWizardStepReview';
import { SubmitConfirmModal } from './SubmitConfirmModal';

interface PurchaseRequestWizardProps {
  mode: PurchaseRequestWizardMode;
  id?: string;
}

export function PurchaseRequestWizard({ mode, id }: PurchaseRequestWizardProps) {
  const borderColor = useColorModeValue('gray.200', 'gray.600');
  const mutedColor = useColorModeValue('gray.600', 'gray.400');
  const bgColor = useColorModeValue('white', 'gray.700');

  const { units, loading: unitsLoading } = useUnitOfMeasures();
  const wizard = usePurchaseRequestWizard({ mode, id });

  const title =
    mode === 'edit'
      ? wizard.displayCode
        ? `Editar ${wizard.displayCode}`
        : 'Editar solicitação'
      : 'Nova solicitação de compra';

  if (wizard.loading || unitsLoading) {
    return (
      <Center py={16}>
        <Spinner size="xl" />
      </Center>
    );
  }

  return (
    <Box w="full" h="full">
      <VStack
        spacing={4}
        align="stretch"
        bg={bgColor}
        p={{ base: 2, md: 6 }}
        borderRadius="lg"
        boxShadow="sm"
        borderWidth="1px"
        borderColor={borderColor}
      >
        <HStack spacing={3}>
          <Button
            variant="ghost"
            leftIcon={<ArrowLeft size={18} />}
            onClick={wizard.cancel}
            size="sm"
          >
            Voltar
          </Button>
          <Heading size="md">{title}</Heading>
        </HStack>

        <Box borderWidth="1px" borderColor={borderColor} borderRadius="md" p={4}>
          <HStack spacing={2} mb={6}>
            {wizard.steps.map((label, index) => (
              <Box key={label} flex={1}>
                <Text
                  fontSize="xs"
                  fontWeight={wizard.step === index ? 'bold' : 'normal'}
                  color={mutedColor}
                >
                  {index + 1}. {label}
                </Text>
                <Progress
                  value={wizard.step >= index ? 100 : 0}
                  size="xs"
                  colorScheme="blue"
                  mt={1}
                  borderRadius="full"
                />
              </Box>
            ))}
          </HStack>

          {wizard.step === 0 && (
            <PurchaseRequestWizardStepGeneral
              form={wizard.form}
              accounts={wizard.accounts}
              onChange={wizard.setForm}
            />
          )}

          {wizard.step === 1 && (
            <PurchaseRequestWizardStepItems
              form={wizard.form}
              units={units}
              onChange={wizard.setForm}
            />
          )}

          {wizard.step === 2 && (
            <PurchaseRequestWizardStepReview form={wizard.form} accounts={wizard.accounts} />
          )}

          <HStack justify="space-between" mt={6} flexWrap="wrap" gap={2}>
            <Button
              variant="ghost"
              onClick={wizard.step === 0 ? wizard.cancel : wizard.goBack}
              isDisabled={wizard.saving}
            >
              {wizard.step === 0 ? 'Cancelar' : 'Voltar'}
            </Button>

            <HStack spacing={2}>
              <Button
                variant="outline"
                onClick={() => wizard.saveDraft()}
                isLoading={wizard.saving}
                loadingText="Salvando..."
              >
                Salvar rascunho
              </Button>

              {!wizard.isLastStep ? (
                <Button
                  colorScheme="blue"
                  onClick={wizard.goNext}
                  isDisabled={!wizard.canAdvanceStep()}
                >
                  Próximo
                </Button>
              ) : (
                <Button
                  colorScheme="blue"
                  onClick={() => wizard.setConfirmOpen(true)}
                  isDisabled={!wizard.canAdvanceStep()}
                  data-testid="pr-wizard-submit"
                >
                  Submeter
                </Button>
              )}
            </HStack>
          </HStack>
        </Box>
      </VStack>

      <SubmitConfirmModal
        isOpen={wizard.confirmOpen}
        onClose={() => wizard.setConfirmOpen(false)}
        onConfirm={wizard.submit}
        isLoading={wizard.saving}
      />
    </Box>
  );
}
