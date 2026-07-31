'use client';

import NextLink from 'next/link';
import { Badge, Box, HStack, Link, Text, VStack, useColorModeValue } from '@chakra-ui/react';
import { AlertTriangle } from 'lucide-react';
import type { ManagerOpsAlertDTO } from '@ti-assistant/contracts';
import { ManagerOpsInboxSeverity } from '@ti-assistant/contracts';

interface ManagerOpsAlertsPanelProps {
  alerts: ManagerOpsAlertDTO[];
}

const SEVERITY_COLOR_SCHEME: Record<ManagerOpsInboxSeverity, string> = {
  [ManagerOpsInboxSeverity.CRITICAL]: 'red',
  [ManagerOpsInboxSeverity.WARNING]: 'orange',
  [ManagerOpsInboxSeverity.INFO]: 'blue',
};

const SEVERITY_LABEL: Record<ManagerOpsInboxSeverity, string> = {
  [ManagerOpsInboxSeverity.CRITICAL]: 'Crítico',
  [ManagerOpsInboxSeverity.WARNING]: 'Atenção',
  [ManagerOpsInboxSeverity.INFO]: 'Info',
};

function AlertItem({ alert }: { alert: ManagerOpsAlertDTO }) {
  const itemBorder = useColorModeValue('gray.200', 'gray.700');
  const titleColor = useColorModeValue('gray.800', 'white');
  const descColor = useColorModeValue('gray.500', 'gray.400');
  const linkColor = useColorModeValue('blue.700', 'blue.300');

  const content = (
    <Box borderWidth="1px" borderColor={itemBorder} borderRadius="md" p={2.5}>
      <HStack justify="space-between" mb={1} align="start">
        <Text fontSize="xs" fontWeight="semibold" color={titleColor} noOfLines={2}>
          {alert.title}
        </Text>
        <Badge colorScheme={SEVERITY_COLOR_SCHEME[alert.severity]} fontSize="9px" flexShrink={0}>
          {SEVERITY_LABEL[alert.severity]}
        </Badge>
      </HStack>
      <Text fontSize="xs" color={descColor} noOfLines={3}>
        {alert.description}
      </Text>
      {typeof alert.count === 'number' && alert.count > 0 && (
        <Text fontSize="xs" color={descColor} mt={1}>
          {alert.count} ocorrência(s)
        </Text>
      )}
      {alert.href && (
        <Text fontSize="xs" color={linkColor} mt={1} fontWeight="medium">
          Ver detalhes →
        </Text>
      )}
    </Box>
  );

  if (alert.href) {
    return (
      <Link as={NextLink} href={alert.href} _hover={{ textDecoration: 'none' }}>
        {content}
      </Link>
    );
  }

  return content;
}

export function ManagerOpsAlertsPanel({ alerts }: ManagerOpsAlertsPanelProps) {
  const borderColor = useColorModeValue('gray.200', 'gray.700');
  const cardBg = useColorModeValue('white', 'gray.800');
  const labelColor = useColorModeValue('gray.500', 'gray.400');
  const iconColor = useColorModeValue('orange.500', 'orange.300');

  if (alerts.length === 0) return null;

  return (
    <Box
      borderWidth="1px"
      borderColor={borderColor}
      borderRadius="md"
      bg={cardBg}
      p={3}
      position="sticky"
      top={2}
    >
      <HStack spacing={1.5} mb={2}>
        <Box as="span" display="inline-flex" color={iconColor}>
          <AlertTriangle size={14} />
        </Box>
        <Text
          fontSize="xs"
          fontWeight="semibold"
          letterSpacing="wide"
          textTransform="uppercase"
          color={labelColor}
        >
          Alertas ({alerts.length})
        </Text>
      </HStack>
      <VStack spacing={2} align="stretch" maxH="70vh" overflowY="auto">
        {alerts.map((alert) => (
          <AlertItem key={alert.code} alert={alert} />
        ))}
      </VStack>
    </Box>
  );
}
