'use client';

import { Badge, Flex, HStack, Text } from '@chakra-ui/react';
import type { PortalQuoteInviteContextDTO } from '@ti-assistant/contracts';
import { useGlassTokens } from '@/components/layout';
import { formatDate, STATUS_COLORS, STATUS_LABELS } from './portalQuoteUtils';

interface PortalQuoteHeaderProps {
  context: PortalQuoteInviteContextDTO;
  title?: string;
}

export function PortalQuoteHeader({
  context,
  title = 'Portal de Cotação',
}: PortalQuoteHeaderProps) {
  const { mutedColor, headingColor } = useGlassTokens();

  return (
    <Flex
      flexShrink={0}
      align="center"
      justify="space-between"
      gap={2}
      flexWrap="wrap"
      px={1}
      py={1}
    >
      <HStack spacing={3} flexWrap="wrap" minW={0}>
        <Text fontSize="sm" fontWeight="semibold" color={headingColor} whiteSpace="nowrap">
          {title}
        </Text>
        <Text fontSize="sm" fontWeight="bold" color={headingColor}>
          {context.quote_display_code}
        </Text>
        <Badge colorScheme={STATUS_COLORS[context.status]} fontSize="xs" px={2}>
          {STATUS_LABELS[context.status]}
        </Badge>
      </HStack>
      <HStack spacing={3} flexWrap="wrap" fontSize="xs" color={mutedColor}>
        <Text>
          <strong>{context.supplier_name}</strong>
        </Text>
        <Text whiteSpace="nowrap">Prazo: {formatDate(context.response_deadline)}</Text>
      </HStack>
    </Flex>
  );
}
