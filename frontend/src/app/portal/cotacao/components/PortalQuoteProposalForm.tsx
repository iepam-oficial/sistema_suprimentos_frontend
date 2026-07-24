'use client';

import { useRef } from 'react';
import {
  Alert,
  AlertDescription,
  AlertIcon,
  Button,
  Checkbox,
  CheckboxGroup,
  FormControl,
  FormHelperText,
  FormLabel,
  HStack,
  Input,
  NumberInput,
  NumberInputField,
  Stack,
  Text,
  VStack,
} from '@chakra-ui/react';
import { Upload } from 'lucide-react';
import type { PaymentMethodDTO } from '@ti-assistant/contracts';
import { CurrencyInput } from '@/components/CurrencyInput';
import { useGlassTokens } from '@/components/layout';
import { formatBRL } from './portalQuoteUtils';

interface PortalQuoteProposalFormProps {
  aiAvailable: boolean;
  hasAiSuggestions: boolean;
  extractLoading: boolean;
  totalValue: number;
  deliveryDays: number;
  freight: number;
  taxes: number;
  availablePaymentMethods: PaymentMethodDTO[];
  selectedPaymentCodes: string[];
  boletoGraceDays: number;
  boletoInstallments: number;
  onDeliveryDaysChange: (value: number) => void;
  onFreightChange: (value: number) => void;
  onTaxesChange: (value: number) => void;
  onSelectedPaymentCodesChange: (codes: string[]) => void;
  onBoletoGraceDaysChange: (value: number) => void;
  onBoletoInstallmentsChange: (value: number) => void;
  onPdfSelect: (event: React.ChangeEvent<HTMLInputElement>) => void;
}

export function PortalQuoteProposalForm({
  aiAvailable,
  hasAiSuggestions,
  extractLoading,
  totalValue,
  deliveryDays,
  freight,
  taxes,
  availablePaymentMethods,
  selectedPaymentCodes,
  boletoGraceDays,
  boletoInstallments,
  onDeliveryDaysChange,
  onFreightChange,
  onTaxesChange,
  onSelectedPaymentCodesChange,
  onBoletoGraceDaysChange,
  onBoletoInstallmentsChange,
  onPdfSelect,
}: PortalQuoteProposalFormProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { mutedColor, headingColor } = useGlassTokens();

  const needsBoletoTerms = availablePaymentMethods.some(
    (m) => selectedPaymentCodes.includes(m.code) && m.requires_boleto_terms,
  );

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
          <Text fontSize="md" fontWeight="bold" color={headingColor} lineHeight="32px">
            {formatBRL(totalValue)}
          </Text>
          <FormHelperText fontSize="xs">Não é editável — altere os itens abaixo</FormHelperText>
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
      </HStack>

      <FormControl size="sm" isRequired>
        <FormLabel fontSize="xs">Formas de pagamento aceitas</FormLabel>
        <CheckboxGroup
          value={selectedPaymentCodes}
          onChange={(values) => onSelectedPaymentCodesChange(values.map(String))}
        >
          <Stack spacing={1}>
            {availablePaymentMethods.map((method) => (
              <Checkbox key={method.code} value={method.code} size="sm">
                {method.label}
              </Checkbox>
            ))}
          </Stack>
        </CheckboxGroup>
      </FormControl>

      {needsBoletoTerms && (
        <HStack spacing={3} align="flex-start" flexWrap="wrap">
          <FormControl flex="1" minW="140px" size="sm" isRequired>
            <FormLabel fontSize="xs">Carência (dias após NF/entrega)</FormLabel>
            <NumberInput
              size="sm"
              min={1}
              max={365}
              value={boletoGraceDays || ''}
              onChange={(_, value) =>
                onBoletoGraceDaysChange(Number.isFinite(value) ? Math.round(value) : 0)
              }
            >
              <NumberInputField />
            </NumberInput>
          </FormControl>
          <FormControl flex="1" minW="120px" size="sm" isRequired>
            <FormLabel fontSize="xs">Nº de parcelas iguais</FormLabel>
            <NumberInput
              size="sm"
              min={1}
              max={12}
              value={boletoInstallments || ''}
              onChange={(_, value) =>
                onBoletoInstallmentsChange(Number.isFinite(value) ? Math.round(value) : 0)
              }
            >
              <NumberInputField />
            </NumberInput>
            <FormHelperText fontSize="xs">Vencimentos a cada 30 dias</FormHelperText>
          </FormControl>
        </HStack>
      )}

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
