'use client';

import { useRef } from 'react';
import {
  Alert,
  AlertDescription,
  AlertIcon,
  Button,
  FormControl,
  FormHelperText,
  FormLabel,
  HStack,
  Input,
  NumberInput,
  NumberInputField,
  Text,
  VStack,
} from '@chakra-ui/react';
import { Upload } from 'lucide-react';
import { CurrencyInput } from '@/components/CurrencyInput';
import { useGlassTokens } from '@/components/layout';

interface PortalQuoteProposalFormProps {
  aiAvailable: boolean;
  hasAiSuggestions: boolean;
  extractLoading: boolean;
  totalValue: number;
  deliveryDays: number;
  paymentDays: number;
  freight: number;
  taxes: number;
  onTotalValueChange: (value: number) => void;
  onDeliveryDaysChange: (value: number) => void;
  onPaymentDaysChange: (value: number) => void;
  onFreightChange: (value: number) => void;
  onTaxesChange: (value: number) => void;
  onPdfSelect: (event: React.ChangeEvent<HTMLInputElement>) => void;
}

export function PortalQuoteProposalForm({
  aiAvailable,
  hasAiSuggestions,
  extractLoading,
  totalValue,
  deliveryDays,
  paymentDays,
  freight,
  taxes,
  onTotalValueChange,
  onDeliveryDaysChange,
  onPaymentDaysChange,
  onFreightChange,
  onTaxesChange,
  onPdfSelect,
}: PortalQuoteProposalFormProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { mutedColor, headingColor } = useGlassTokens();

  return (
    <VStack align="stretch" spacing={3} px={1}>
      <Text fontSize="sm" fontWeight="semibold" color={headingColor}>
        Dados da proposta
      </Text>
      <Text fontSize="sm" color={mutedColor}>
        Preencha os valores ou importe um PDF para sugestões automáticas.
      </Text>

      {aiAvailable ? (
        <HStack spacing={2}>
          <Input
            ref={fileInputRef}
            type="file"
            accept="application/pdf"
            display="none"
            onChange={onPdfSelect}
          />
          <Button
            size="sm"
            leftIcon={<Upload size={14} />}
            variant="outline"
            onClick={() => fileInputRef.current?.click()}
            isLoading={extractLoading}
            loadingText="Extraindo..."
          >
            Importar PDF (IA)
          </Button>
        </HStack>
      ) : (
        <Alert status="info" size="sm" borderRadius="md">
          <AlertIcon />
          <AlertDescription fontSize="sm">
            Extração automática por IA indisponível. Preencha a proposta manualmente.
          </AlertDescription>
        </Alert>
      )}

      {hasAiSuggestions && (
        <Alert status="warning" size="sm" borderRadius="md">
          <AlertIcon />
          <AlertDescription fontSize="sm">
            Campos pré-preenchidos com sugestões da IA (confiança ≥ 75%). Revise todos os valores
            antes de enviar.
          </AlertDescription>
        </Alert>
      )}

      <HStack spacing={3} align="flex-start" flexWrap="wrap">
        <FormControl flex="1" minW="120px" size="sm">
          <FormLabel fontSize="xs">Valor total</FormLabel>
          <CurrencyInput value={totalValue} onChange={onTotalValueChange} />
          <FormHelperText fontSize="xs">Calculado automaticamente a partir dos itens.</FormHelperText>
        </FormControl>
        <FormControl flex="1" minW="100px" size="sm">
          <FormLabel fontSize="xs">Entrega (dias)</FormLabel>
          <NumberInput
            size="sm"
            min={0}
            value={deliveryDays}
            onChange={(_, value) =>
              onDeliveryDaysChange(Number.isFinite(value) ? Math.round(value) : 0)
            }
          >
            <NumberInputField />
          </NumberInput>
        </FormControl>
        <FormControl flex="1" minW="100px" size="sm">
          <FormLabel fontSize="xs">Pagamento (dias)</FormLabel>
          <NumberInput
            size="sm"
            min={0}
            value={paymentDays}
            onChange={(_, value) =>
              onPaymentDaysChange(Number.isFinite(value) ? Math.round(value) : 0)
            }
          >
            <NumberInputField />
          </NumberInput>
        </FormControl>
      </HStack>

      <HStack spacing={3}>
        <FormControl flex="1" size="sm">
          <FormLabel fontSize="xs">Frete</FormLabel>
          <CurrencyInput value={freight} onChange={onFreightChange} />
        </FormControl>
        <FormControl flex="1" size="sm">
          <FormLabel fontSize="xs">Impostos</FormLabel>
          <CurrencyInput value={taxes} onChange={onTaxesChange} />
        </FormControl>
      </HStack>
    </VStack>
  );
}
