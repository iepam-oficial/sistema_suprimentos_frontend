'use client';

import { Badge, Flex, HStack, Text } from '@chakra-ui/react';
import type { PortalPurchaseOrderContextDTO } from '@ti-assistant/contracts';
import { useGlassTokens } from '@/components/layout';
import { formatBRL, STATUS_COLORS, STATUS_LABELS } from './portalPedidoUtils';

interface PortalOrderHeaderProps {
  context: PortalPurchaseOrderContextDTO;
  title?: string;
}

export function PortalOrderHeader({
  context,
  title = 'Portal do Pedido',
}: PortalOrderHeaderProps) {
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
          {context.display_code}
        </Text>
        <Badge colorScheme={STATUS_COLORS[context.status]} fontSize="xs" px={2}>
          {STATUS_LABELS[context.status]}
        </Badge>
      </HStack>
      <HStack spacing={3} flexWrap="wrap" fontSize="xs" color={mutedColor}>
        <Text>
          <strong>{context.supplier_name}</strong>
        </Text>
        <Text fontWeight="bold" color={headingColor}>
          {formatBRL(context.total_value)}
        </Text>
      </HStack>
    </Flex>
  );
}
