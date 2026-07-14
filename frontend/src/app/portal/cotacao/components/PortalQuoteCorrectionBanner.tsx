'use client';

import {
  Alert,
  AlertIcon,
  AlertTitle,
  Badge,
  Box,
  HStack,
  List,
  ListItem,
  Text,
  VStack,
} from '@chakra-ui/react';
import type { ProposalCorrectionRequestDTO } from '@ti-assistant/contracts';
import { useGlassTokens } from '@/components/layout';
import { formatBRL } from './portalQuoteUtils';

interface PortalQuoteCorrectionBannerProps {
  correctionRequest: ProposalCorrectionRequestDTO;
}

export function PortalQuoteCorrectionBanner({
  correctionRequest,
}: PortalQuoteCorrectionBannerProps) {
  const { mutedColor, headingColor } = useGlassTokens();
  const { message, flagged_items: flaggedItems } = correctionRequest;

  return (
    <Alert
      status="warning"
      variant="left-accent"
      borderRadius="md"
      alignItems="flex-start"
      flexDirection="column"
      gap={2}
    >
      <HStack spacing={2}>
        <AlertIcon boxSize={5} />
        <AlertTitle fontSize="sm">Correção solicitada pelo comprador</AlertTitle>
      </HStack>

      <VStack align="stretch" spacing={3} w="full" pl={7}>
        <Box>
          <Text fontSize="xs" fontWeight="semibold" color={headingColor} mb={1}>
            Mensagem
          </Text>
          <Text fontSize="sm" color={mutedColor} whiteSpace="pre-wrap">
            {message}
          </Text>
        </Box>

        {flaggedItems.length > 0 && (
          <Box>
            <Text fontSize="xs" fontWeight="semibold" color={headingColor} mb={1}>
              Itens marcados para revisão
            </Text>
            <List spacing={1}>
              {flaggedItems.map((item) => (
                <ListItem key={item.id}>
                  <HStack spacing={2} align="baseline" flexWrap="wrap">
                    <Badge colorScheme="orange" fontSize="0.65rem">
                      {item.quantity}x
                    </Badge>
                    <Text fontSize="sm" color={headingColor}>
                      {item.description}
                    </Text>
                    <Text fontSize="xs" color={mutedColor}>
                      {formatBRL(item.unit_price)} un. · {formatBRL(item.total_price)} total
                    </Text>
                  </HStack>
                </ListItem>
              ))}
            </List>
          </Box>
        )}
      </VStack>
    </Alert>
  );
}
