'use client';

import { Badge, HStack, Link, Text, useColorModeValue } from '@chakra-ui/react';
import NextLink from 'next/link';
import type { ProcurementQuotePurchaseRequestRefDTO } from '@ti-assistant/contracts';
import {
  purchaseRequestPriorityColor,
  purchaseRequestPriorityLabel,
} from '../types';

interface QuoteOriginSectionProps {
  purchaseRequest: ProcurementQuotePurchaseRequestRefDTO;
}

export function QuoteOriginSection({ purchaseRequest }: QuoteOriginSectionProps) {
  const mutedColor = useColorModeValue('gray.500', 'gray.400');
  const linkColor = useColorModeValue('blue.600', 'blue.300');

  return (
    <HStack spacing={2} flexWrap="wrap">
      <Link
        as={NextLink}
        href={`/procurement/solicitacoes/${purchaseRequest.id}`}
        fontSize="sm"
        fontWeight="medium"
        color={linkColor}
      >
        {purchaseRequest.display_code}
      </Link>
      <Text fontSize="sm" color={mutedColor}>
        ·
      </Text>
      <Text fontSize="sm" color={mutedColor}>
        Solicitante: {purchaseRequest.created_by.name}
      </Text>
      <Text fontSize="sm" color={mutedColor}>
        ·
      </Text>
      <Badge colorScheme={purchaseRequestPriorityColor(purchaseRequest.priority)}>
        Prioridade: {purchaseRequestPriorityLabel(purchaseRequest.priority)}
      </Badge>
    </HStack>
  );
}
