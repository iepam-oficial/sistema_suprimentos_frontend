'use client';

import {
  Badge,
  Box,
  Button,
  Flex,
  Grid,
  Heading,
  Table,
  Tbody,
  Td,
  Text,
  Th,
  Thead,
  Tr,
  useColorModeValue,
  VStack,
} from '@chakra-ui/react';
import { ArrowLeft } from 'lucide-react';
import { useRouter } from 'next/navigation';
import type { PurchaseRequestDTO } from '@ti-assistant/contracts';
import {
  purchaseRequestPriorityColor,
  purchaseRequestPriorityLabel,
  purchaseRequestStatusColor,
  purchaseRequestStatusLabel,
} from '../../types';
import { PrioritySelect } from '../queue/PrioritySelect';
import { PurchaseRequestApprovalHistory } from './PurchaseRequestApprovalHistory';
import { PurchaseRequestSummaryPanel } from './PurchaseRequestSummaryPanel';

interface PurchaseRequestDetailLayoutProps {
  request: PurchaseRequestDTO;
  variant?: 'page' | 'modal';
  emphasizedSummary?: boolean;
  backHref?: string;
  userRoles?: readonly string[] | null;
  priorityDisabled?: boolean;
  onPriorityUpdated?: (updated: PurchaseRequestDTO) => void;
  showQuoteCta?: boolean;
}

export function PurchaseRequestDetailLayout({
  request,
  variant = 'page',
  emphasizedSummary = false,
  backHref = '/procurement/solicitacoes',
  userRoles,
  priorityDisabled = false,
  onPriorityUpdated,
  showQuoteCta = false,
}: PurchaseRequestDetailLayoutProps) {
  const router = useRouter();
  const isModal = variant === 'modal';
  const borderColor = useColorModeValue('gray.200', 'gray.600');
  const bgColor = useColorModeValue('white', 'gray.700');
  const textColor = useColorModeValue('gray.700', 'gray.200');

  const content = (
    <>
      <Flex align="center" gap={3} flexWrap="wrap">
        {!isModal && (
          <Button
            variant="ghost"
            leftIcon={<ArrowLeft size={18} />}
            onClick={() => router.push(backHref)}
            size="sm"
          >
            Voltar
          </Button>
        )}
        <Heading size={isModal ? 'md' : 'lg'}>{request.display_code}</Heading>
        <Badge colorScheme={purchaseRequestStatusColor(request.status)}>
          {purchaseRequestStatusLabel(request.status)}
        </Badge>
        {!isModal && userRoles?.length ? (
          <PrioritySelect
            purchaseRequestId={request.id}
            currentPriority={request.priority}
            userRoles={userRoles}
            disabled={priorityDisabled}
            onUpdated={onPriorityUpdated}
          />
        ) : (
          <Badge colorScheme={purchaseRequestPriorityColor(request.priority)}>
            {purchaseRequestPriorityLabel(request.priority)}
          </Badge>
        )}
        {!isModal && showQuoteCta && (
          <Button
            colorScheme="blue"
            size="sm"
            ml="auto"
            onClick={() =>
              router.push(`/procurement/cotacoes?newQuote=${request.id}`)
            }
          >
            Disparar cotação
          </Button>
        )}
      </Flex>

      <Grid templateColumns={{ base: '1fr', lg: '340px 1fr' }} gap={4} alignItems="start">
        <Box
          p={4}
          borderWidth="1px"
          borderColor={borderColor}
          borderRadius="md"
        >
          <PurchaseRequestSummaryPanel
            request={request}
            emphasized={emphasizedSummary}
          />
          <Box mt={4}>
            <PurchaseRequestApprovalHistory approvals={request.approvals} />
          </Box>
        </Box>

        <Box
          p={4}
          borderWidth="1px"
          borderColor={borderColor}
          borderRadius="md"
          overflowX="auto"
        >
          <Text fontWeight="semibold" mb={3}>
            Itens
          </Text>
          <Table size="sm">
            <Thead>
              <Tr>
                <Th>Descrição</Th>
                <Th>Quantidade</Th>
                <Th>Unidade</Th>
              </Tr>
            </Thead>
            <Tbody>
              {request.items.map((item) => (
                <Tr key={item.id}>
                  <Td color={textColor}>{item.description}</Td>
                  <Td color={textColor}>{item.quantity}</Td>
                  <Td color={textColor}>{item.unit || '—'}</Td>
                </Tr>
              ))}
            </Tbody>
          </Table>
        </Box>
      </Grid>
    </>
  );

  if (isModal) {
    return (
      <Box w="full">
        <VStack spacing={4} align="stretch">
          {content}
        </VStack>
      </Box>
    );
  }

  return (
    <Box w="full" h="full">
      <VStack
        spacing={4}
        align="stretch"
        bg={bgColor}
        p={{ base: 2, md: 6 }}
        borderRadius="lg"
        boxShadow="sm"
        borderWidth="1px"
        borderColor={borderColor}
      >
        {content}
      </VStack>
    </Box>
  );
}
