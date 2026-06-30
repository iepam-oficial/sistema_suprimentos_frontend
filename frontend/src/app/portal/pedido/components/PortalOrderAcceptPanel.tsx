'use client';

import { FormControl, FormLabel, Text, Textarea, VStack } from '@chakra-ui/react';
import { useGlassTokens } from '@/components/layout';

interface PortalOrderAcceptPanelProps {
  showDeclineForm: boolean;
  declineReason: string;
  onDeclineReasonChange: (value: string) => void;
}

export function PortalOrderAcceptPanel({
  showDeclineForm,
  declineReason,
  onDeclineReasonChange,
}: PortalOrderAcceptPanelProps) {
  const { mutedColor, headingColor } = useGlassTokens();

  return (
    <VStack align="stretch" spacing={3} px={1} mb={3}>
      <Text fontSize="sm" fontWeight="semibold" color={headingColor}>
        Confirmar pedido?
      </Text>
      <Text fontSize="sm" color={mutedColor}>
        Aceite o pedido de compra para confirmar o fornecimento ou recuse informando o motivo.
      </Text>
      {showDeclineForm && (
        <FormControl isRequired>
          <FormLabel fontSize="sm">Motivo da recusa</FormLabel>
          <Textarea
            size="sm"
            value={declineReason}
            onChange={(e) => onDeclineReasonChange(e.target.value)}
            placeholder="Informe o motivo da recusa..."
            rows={3}
          />
        </FormControl>
      )}
    </VStack>
  );
}
