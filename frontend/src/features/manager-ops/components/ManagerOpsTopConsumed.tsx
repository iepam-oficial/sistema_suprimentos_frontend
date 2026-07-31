'use client';

import {
  Box,
  HStack,
  Skeleton,
  Text,
  VStack,
  useColorModeValue,
} from '@chakra-ui/react';
import type { ManagerOpsNamedQuantityDTO } from '@ti-assistant/contracts';

interface ManagerOpsTopConsumedProps {
  data: ManagerOpsNamedQuantityDTO[] | undefined;
  loading: boolean;
}

function TopConsumedSkeleton() {
  return (
    <VStack align="stretch" spacing={2}>
      {Array.from({ length: 5 }).map((_, index) => (
        <Skeleton key={index} height="18px" borderRadius="md" />
      ))}
    </VStack>
  );
}

export function ManagerOpsTopConsumed({ data, loading }: ManagerOpsTopConsumedProps) {
  const borderColor = useColorModeValue('gray.200', 'gray.700');
  const cardBg = useColorModeValue('white', 'gray.800');
  const labelColor = useColorModeValue('gray.500', 'gray.400');
  const titleColor = useColorModeValue('gray.800', 'white');
  const rankBg = useColorModeValue('blue.50', 'blue.900');
  const rankColor = useColorModeValue('blue.700', 'blue.200');
  const barTrackBg = useColorModeValue('gray.100', 'gray.700');
  const barFillBg = useColorModeValue('blue.500', 'blue.300');

  const rows = data ?? [];
  const maxQuantity = rows.reduce((max, row) => Math.max(max, row.quantity), 0) || 1;

  return (
    <Box borderWidth="1px" borderColor={borderColor} borderRadius="md" bg={cardBg} p={3}>
      <HStack justify="space-between" mb={2}>
        <Text
          fontSize="xs"
          fontWeight="semibold"
          letterSpacing="wide"
          textTransform="uppercase"
          color={labelColor}
        >
          Top Consumidos
        </Text>
      </HStack>

      {loading && !data ? (
        <TopConsumedSkeleton />
      ) : rows.length === 0 ? (
        <Box
          h="120px"
          display="flex"
          alignItems="center"
          justifyContent="center"
          color={labelColor}
          fontSize="sm"
        >
          Sem dados no período selecionado
        </Box>
      ) : (
        <VStack align="stretch" spacing={2} opacity={loading ? 0.6 : 1} transition="opacity 0.2s">
          {rows.map((row, index) => (
            <HStack key={row.id ?? row.label} spacing={2.5} align="center">
              <Box
                flexShrink={0}
                w="20px"
                h="20px"
                borderRadius="full"
                bg={rankBg}
                color={rankColor}
                fontSize="10px"
                fontWeight="bold"
                display="flex"
                alignItems="center"
                justifyContent="center"
              >
                {index + 1}
              </Box>
              <Box flex="1" minW="0">
                <Text fontSize="xs" fontWeight="medium" color={titleColor} noOfLines={1} mb={0.5}>
                  {row.label}
                </Text>
                <Box h="6px" borderRadius="full" bg={barTrackBg} overflow="hidden">
                  <Box
                    h="full"
                    borderRadius="full"
                    bg={barFillBg}
                    width={`${Math.max(4, (row.quantity / maxQuantity) * 100)}%`}
                  />
                </Box>
              </Box>
              <Text fontSize="xs" fontWeight="semibold" color={titleColor} flexShrink={0}>
                {row.quantity}
              </Text>
            </HStack>
          ))}
        </VStack>
      )}
    </Box>
  );
}
