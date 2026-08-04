'use client';

import { useRouter } from 'next/navigation';
import {
  Badge,
  Box,
  HStack,
  Heading,
  Skeleton,
  Text,
  VStack,
  useColorModeValue,
} from '@chakra-ui/react';
import { Inbox } from 'lucide-react';
import type { ManagerOpsInboxItemDTO } from '@ti-assistant/contracts';
import { ManagerOpsInboxSeverity } from '@ti-assistant/contracts';

interface ManagerOpsInboxProps {
  items: ManagerOpsInboxItemDTO[];
  loading: boolean;
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

function formatDueAt(dueAt?: string): string | null {
  if (!dueAt) return null;
  const date = new Date(dueAt);
  if (Number.isNaN(date.getTime())) return null;
  return date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

function InboxItem({ item, onClick }: { item: ManagerOpsInboxItemDTO; onClick: () => void }) {
  const itemBorder = useColorModeValue('gray.200', 'gray.700');
  const itemBg = useColorModeValue('white', 'gray.800');
  const itemHoverBg = useColorModeValue('gray.50', 'gray.700');
  const titleColor = useColorModeValue('gray.800', 'white');
  const descColor = useColorModeValue('gray.500', 'gray.400');

  const dueAtLabel = formatDueAt(item.dueAt);

  return (
    <Box
      borderWidth="1px"
      borderColor={itemBorder}
      borderRadius="md"
      bg={itemBg}
      p={3}
      cursor="pointer"
      transition="background 0.15s"
      _hover={{ bg: itemHoverBg }}
      onClick={onClick}
    >
      <HStack justify="space-between" align="start" mb={1}>
        <Text fontSize="sm" fontWeight="semibold" color={titleColor} noOfLines={1}>
          {item.title}
        </Text>
        <Badge colorScheme={SEVERITY_COLOR_SCHEME[item.severity]} fontSize="9px" flexShrink={0}>
          {SEVERITY_LABEL[item.severity]}
        </Badge>
      </HStack>
      {item.description && (
        <Text fontSize="xs" color={descColor} noOfLines={2} mb={dueAtLabel ? 1 : 0}>
          {item.description}
        </Text>
      )}
      {dueAtLabel && (
        <Text fontSize="xs" color={descColor}>
          Vencimento: {dueAtLabel}
        </Text>
      )}
    </Box>
  );
}

function InboxSkeleton() {
  const borderColor = useColorModeValue('gray.200', 'gray.700');
  const cardBg = useColorModeValue('white', 'gray.800');
  return (
    <VStack align="stretch" spacing={2}>
      {Array.from({ length: 4 }).map((_, index) => (
        <Box key={index} borderWidth="1px" borderColor={borderColor} borderRadius="md" bg={cardBg} p={3}>
          <Skeleton height="14px" width="70%" mb={2} />
          <Skeleton height="10px" width="90%" />
        </Box>
      ))}
    </VStack>
  );
}

export function ManagerOpsInbox({ items, loading }: ManagerOpsInboxProps) {
  const router = useRouter();
  const borderColor = useColorModeValue('gray.200', 'gray.700');
  const cardBg = useColorModeValue('white', 'gray.800');
  const labelColor = useColorModeValue('gray.500', 'gray.400');
  const iconColor = useColorModeValue('blue.500', 'blue.300');

  return (
    <Box borderWidth="1px" borderColor={borderColor} borderRadius="md" bg={cardBg} p={3}>
      <HStack spacing={1.5} mb={3}>
        <Box as="span" display="inline-flex" color={iconColor}>
          <Inbox size={16} />
        </Box>
        <Heading
          size="xs"
          fontWeight="semibold"
          letterSpacing="wide"
          textTransform="uppercase"
          color={labelColor}
        >
          Caixa de Entrada {items.length > 0 ? `(${items.length})` : ''}
        </Heading>
      </HStack>

      {loading && items.length === 0 ? (
        <InboxSkeleton />
      ) : items.length === 0 ? (
        <Text fontSize="sm" color={labelColor} py={4} textAlign="center">
          Nenhuma pendência no momento.
        </Text>
      ) : (
        <VStack
          align="stretch"
          spacing={2}
          maxH={{ base: '360px', md: '480px' }}
          overflowY="auto"
          pr={1}
          sx={{ scrollbarGutter: 'stable' }}
        >
          {items.map((item) => (
            <InboxItem key={item.id} item={item} onClick={() => router.push(item.href)} />
          ))}
        </VStack>
      )}
    </Box>
  );
}
