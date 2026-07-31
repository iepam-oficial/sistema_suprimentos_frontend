'use client';

import {
  Box,
  HStack,
  Heading,
  SimpleGrid,
  Skeleton,
  Text,
  VStack,
  useColorModeValue,
} from '@chakra-ui/react';
import { Activity } from 'lucide-react';
import type { ManagerOpsStockHealthDTO } from '@ti-assistant/contracts';

interface ManagerOpsStockHealthProps {
  stockHealth: ManagerOpsStockHealthDTO | null;
  loading: boolean;
}

interface HealthBoxProps {
  label: string;
  value: number;
  colorScheme: 'green' | 'orange' | 'red';
}

function HealthBox({ label, value, colorScheme }: HealthBoxProps) {
  const bg = useColorModeValue(`${colorScheme}.50`, `${colorScheme}.900`);
  const border = useColorModeValue(`${colorScheme}.200`, `${colorScheme}.700`);
  const valueColor = useColorModeValue(`${colorScheme}.700`, `${colorScheme}.200`);
  const labelColor = useColorModeValue(`${colorScheme}.600`, `${colorScheme}.300`);

  return (
    <Box borderWidth="1px" borderColor={border} borderRadius="md" bg={bg} px={3} py={2.5} flex="1">
      <Text
        fontSize="xs"
        fontWeight="semibold"
        letterSpacing="wide"
        textTransform="uppercase"
        color={labelColor}
        mb={0.5}
      >
        {label}
      </Text>
      <Text fontSize="xl" fontWeight="bold" color={valueColor} lineHeight="shorter">
        {value}
      </Text>
    </Box>
  );
}

interface MetricItemProps {
  label: string;
  value: number;
}

function MetricItem({ label, value }: MetricItemProps) {
  const borderColor = useColorModeValue('gray.200', 'gray.700');
  const cardBg = useColorModeValue('gray.50', 'gray.900');
  const labelColor = useColorModeValue('gray.500', 'gray.400');
  const valueColor = useColorModeValue('gray.800', 'white');

  return (
    <Box borderWidth="1px" borderColor={borderColor} borderRadius="md" bg={cardBg} px={3} py={2}>
      <Text fontSize="xs" color={labelColor} noOfLines={1}>
        {label}
      </Text>
      <Text fontSize="md" fontWeight="semibold" color={valueColor}>
        {value}
      </Text>
    </Box>
  );
}

function StockHealthSkeleton() {
  return (
    <VStack align="stretch" spacing={2.5}>
      <HStack spacing={2.5}>
        {Array.from({ length: 3 }).map((_, index) => (
          <Skeleton key={index} height="56px" flex="1" borderRadius="md" />
        ))}
      </HStack>
      <SimpleGrid columns={{ base: 1, sm: 3 }} spacing={2.5}>
        {Array.from({ length: 3 }).map((_, index) => (
          <Skeleton key={index} height="48px" borderRadius="md" />
        ))}
      </SimpleGrid>
    </VStack>
  );
}

export function ManagerOpsStockHealth({ stockHealth, loading }: ManagerOpsStockHealthProps) {
  const borderColor = useColorModeValue('gray.200', 'gray.700');
  const cardBg = useColorModeValue('white', 'gray.800');
  const labelColor = useColorModeValue('gray.500', 'gray.400');
  const iconColor = useColorModeValue('blue.500', 'blue.300');

  return (
    <Box borderWidth="1px" borderColor={borderColor} borderRadius="md" bg={cardBg} p={3}>
      <HStack spacing={1.5} mb={3}>
        <Box as="span" display="inline-flex" color={iconColor}>
          <Activity size={16} />
        </Box>
        <Heading
          size="xs"
          fontWeight="semibold"
          letterSpacing="wide"
          textTransform="uppercase"
          color={labelColor}
        >
          Saúde do Estoque
        </Heading>
      </HStack>

      {loading && !stockHealth ? (
        <StockHealthSkeleton />
      ) : !stockHealth ? (
        <Text fontSize="sm" color={labelColor} py={4} textAlign="center">
          Sem dados de saúde do estoque no momento.
        </Text>
      ) : (
        <VStack align="stretch" spacing={2.5}>
          <HStack spacing={2.5}>
            <HealthBox label="Normal" value={stockHealth.normal} colorScheme="green" />
            <HealthBox label="Atenção" value={stockHealth.attention} colorScheme="orange" />
            <HealthBox label="Crítico" value={stockHealth.critical} colorScheme="red" />
          </HStack>
          <SimpleGrid columns={{ base: 1, sm: 3 }} spacing={2.5}>
            <MetricItem label="Inativos +180 dias" value={stockHealth.inactiveOver180Days} />
            <MetricItem label="Lotes vencendo" value={stockHealth.expiringBatches} />
            <MetricItem label="Lotes vencidos" value={stockHealth.expiredBatches} />
          </SimpleGrid>
        </VStack>
      )}
    </Box>
  );
}
