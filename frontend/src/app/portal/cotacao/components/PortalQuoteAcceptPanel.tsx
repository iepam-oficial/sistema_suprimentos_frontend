'use client';

import { FormControl, FormLabel, Text, Textarea, VStack } from '@chakra-ui/react';
import { useGlassTokens } from '@/components/layout';

interface PortalQuoteAcceptPanelProps {
  showDeclineForm: boolean;
  declineReason: string;
  onDeclineReasonChange: (value: string) => void;
}

export function PortalQuoteAcceptPanel({
  showDeclineForm,
  declineReason,
  onDeclineReasonChange,
}: PortalQuoteAcceptPanelProps) {
  const { mutedColor, headingColor } = useGlassTokens();

  return (
    <VStack align="stretch" spacing={3} px={1}>
      <Text fontSize="sm" fontWeight="semibold" color={headingColor}>
        Participar da cotação?
      </Text>
      <Text fontSize="sm" color={mutedColor}>
        Aceite para enviar sua proposta ou recuse informando o motivo.
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
