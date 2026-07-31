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
import { Kanban } from 'lucide-react';
import type { ManagerOpsKanbanColumnDTO } from '@ti-assistant/contracts';

interface ManagerOpsKanbanProps {
  columns: ManagerOpsKanbanColumnDTO[];
  loading: boolean;
}

function KanbanItem({
  item,
  onClick,
}: {
  item: ManagerOpsKanbanColumnDTO['items'][number];
  onClick: () => void;
}) {
  const itemBorder = useColorModeValue('gray.200', 'gray.700');
  const itemBg = useColorModeValue('gray.50', 'gray.900');
  const itemHoverBg = useColorModeValue('gray.100', 'gray.700');
  const titleColor = useColorModeValue('gray.800', 'white');

  return (
    <Box
      borderWidth="1px"
      borderColor={itemBorder}
      borderRadius="md"
      bg={itemBg}
      px={2.5}
      py={2}
      cursor="pointer"
      transition="background 0.15s"
      _hover={{ bg: itemHoverBg }}
      onClick={onClick}
    >
      <Text fontSize="xs" fontWeight="medium" color={titleColor} noOfLines={2}>
        {item.title}
      </Text>
    </Box>
  );
}

function KanbanColumn({ column }: { column: ManagerOpsKanbanColumnDTO }) {
  const router = useRouter();
  const columnBorder = useColorModeValue('gray.200', 'gray.700');
  const columnBg = useColorModeValue('white', 'gray.800');
  const labelColor = useColorModeValue('gray.500', 'gray.400');

  return (
    <Box
      borderWidth="1px"
      borderColor={columnBorder}
      borderRadius="md"
      bg={columnBg}
      p={2.5}
      minW="200px"
      maxW="200px"
      flexShrink={0}
    >
      <HStack justify="space-between" mb={2}>
        <Text
          fontSize="xs"
          fontWeight="semibold"
          letterSpacing="wide"
          textTransform="uppercase"
          color={labelColor}
          noOfLines={1}
        >
          {column.label}
        </Text>
        <Badge colorScheme="gray" fontSize="9px" borderRadius="full">
          {column.count}
        </Badge>
      </HStack>

      {column.items.length === 0 ? (
        <Text fontSize="xs" color={labelColor} textAlign="center" py={3}>
          Vazio
        </Text>
      ) : (
        <VStack align="stretch" spacing={1.5} maxH="260px" overflowY="auto" pr={0.5}>
          {column.items.map((item) => (
            <KanbanItem
              key={item.id}
              item={item}
              onClick={() => router.push(item.href)}
            />
          ))}
        </VStack>
      )}
    </Box>
  );
}

function KanbanSkeleton() {
  const columnBorder = useColorModeValue('gray.200', 'gray.700');
  const columnBg = useColorModeValue('white', 'gray.800');
  return (
    <HStack spacing={2.5} overflowX="auto" pb={1}>
      {Array.from({ length: 7 }).map((_, index) => (
        <Box
          key={index}
          borderWidth="1px"
          borderColor={columnBorder}
          borderRadius="md"
          bg={columnBg}
          p={2.5}
          minW="200px"
          maxW="200px"
          flexShrink={0}
        >
          <Skeleton height="10px" width="70%" mb={3} />
          <Skeleton height="40px" mb={1.5} />
          <Skeleton height="40px" />
        </Box>
      ))}
    </HStack>
  );
}

export function ManagerOpsKanban({ columns, loading }: ManagerOpsKanbanProps) {
  const borderColor = useColorModeValue('gray.200', 'gray.700');
  const cardBg = useColorModeValue('white', 'gray.800');
  const labelColor = useColorModeValue('gray.500', 'gray.400');
  const iconColor = useColorModeValue('blue.500', 'blue.300');

  return (
    <Box borderWidth="1px" borderColor={borderColor} borderRadius="md" bg={cardBg} p={3}>
      <HStack spacing={1.5} mb={3}>
        <Box as="span" display="inline-flex" color={iconColor}>
          <Kanban size={16} />
        </Box>
        <Heading
          size="xs"
          fontWeight="semibold"
          letterSpacing="wide"
          textTransform="uppercase"
          color={labelColor}
        >
          Kanban de Compras
        </Heading>
      </HStack>

      {loading && columns.length === 0 ? (
        <KanbanSkeleton />
      ) : columns.length === 0 ? (
        <Text fontSize="sm" color={labelColor} py={4} textAlign="center">
          Nenhum item no fluxo de compras no momento.
        </Text>
      ) : (
        <HStack
          align="stretch"
          spacing={2.5}
          overflowX="auto"
          pb={1}
          sx={{ scrollbarGutter: 'stable' }}
        >
          {columns.map((column) => (
            <KanbanColumn key={column.key} column={column} />
          ))}
        </HStack>
      )}
    </Box>
  );
}
