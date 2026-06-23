'use client';

import { useCallback, useEffect, useState } from 'react';
import {
  Badge,
  Box,
  Button,
  Center,
  Divider,
  Flex,
  Heading,
  Spinner,
  Table,
  Tbody,
  Td,
  Text,
  Th,
  Thead,
  Tr,
  useColorModeValue,
  useToast,
  VStack,
} from '@chakra-ui/react';
import { ArrowLeft } from 'lucide-react';
import { useParams, useRouter } from 'next/navigation';
import type { PurchaseRequestDTO } from '@ti-assistant/contracts';
import {
  fetchPurchaseRequestById,
  PurchaseRequestForm,
  purchaseRequestPriorityColor,
  purchaseRequestPriorityLabel,
  purchaseRequestStatusColor,
  purchaseRequestStatusLabel,
} from '@/features/procurement';

const ALLOWED_ROLES = ['COORDINATOR', 'ADMIN'];

export default function PurchaseRequestDetailPage() {
  const router = useRouter();
  const params = useParams();
  const toast = useToast();
  const id = params.id as string;

  const [authorized, setAuthorized] = useState(false);
  const [loading, setLoading] = useState(true);
  const [request, setRequest] = useState<PurchaseRequestDTO | null>(null);

  const bgColor = useColorModeValue('white', 'gray.700');
  const borderColor = useColorModeValue('gray.200', 'gray.600');
  const headingColor = useColorModeValue('gray.800', 'white');
  const textColor = useColorModeValue('gray.700', 'gray.200');

  const loadRequest = useCallback(async () => {
    const token = localStorage.getItem('@ti-assistant:token');
    if (!token) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const data = await fetchPurchaseRequestById(token, id);
      setRequest(data);
    } catch (err) {
      toast({
        title: 'Erro ao carregar solicitação',
        description: err instanceof Error ? err.message : 'Tente novamente.',
        status: 'error',
        duration: 4000,
        isClosable: true,
      });
    } finally {
      setLoading(false);
    }
  }, [id, toast]);

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem('@ti-assistant:user') || '{}');
    if (!user?.role || !ALLOWED_ROLES.includes(user.role)) {
      router.push('/unauthorized');
      return;
    }
    setAuthorized(true);
    loadRequest();
  }, [router, loadRequest]);

  if (!authorized) {
    return null;
  }

  if (loading) {
    return (
      <Center py={16}>
        <Spinner size="xl" />
      </Center>
    );
  }

  if (!request) {
    return (
      <Center py={16}>
        <Text color="gray.500">Solicitação não encontrada.</Text>
      </Center>
    );
  }

  const isDraft = request.status === 'DRAFT';

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
        <Flex align="center" gap={3}>
          <Button
            variant="ghost"
            leftIcon={<ArrowLeft size={18} />}
            onClick={() => router.push('/procurement/solicitacoes')}
          >
            Voltar
          </Button>
          <Heading size="lg" color={headingColor}>
            {request.display_code}
          </Heading>
          <Badge colorScheme={purchaseRequestStatusColor(request.status)}>
            {purchaseRequestStatusLabel(request.status)}
          </Badge>
          <Badge colorScheme={purchaseRequestPriorityColor(request.priority)}>
            {purchaseRequestPriorityLabel(request.priority)}
          </Badge>
        </Flex>

        <Divider />

        {isDraft ? (
          <PurchaseRequestForm
            initialData={request}
            onSuccess={() => {
              loadRequest();
              router.push('/procurement/solicitacoes');
            }}
          />
        ) : (
          <>
            <Box>
              <Text fontWeight="semibold" color={headingColor} mb={1}>
                Justificativa
              </Text>
              <Text color={textColor}>{request.justification}</Text>
            </Box>

            {request.notes && (
              <Box>
                <Text fontWeight="semibold" color={headingColor} mb={1}>
                  Observações
                </Text>
                <Text color={textColor}>{request.notes}</Text>
              </Box>
            )}

            <Box>
              <Text fontWeight="semibold" color={headingColor} mb={2}>
                Itens
              </Text>
              <Box overflowX="auto">
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
            </Box>

            {request.approvals.length > 0 && (
              <Box>
                <Text fontWeight="semibold" color={headingColor} mb={2}>
                  Histórico de aprovação
                </Text>
                <VStack align="stretch" spacing={2}>
                  {request.approvals.map((approval) => (
                    <Box
                      key={approval.id}
                      p={3}
                      borderWidth="1px"
                      borderColor={borderColor}
                      borderRadius="md"
                    >
                      <Text fontSize="sm" color={textColor}>
                        <strong>
                          {'name' in approval.approved_by
                            ? approval.approved_by.name
                            : 'Usuário'}
                        </strong>{' '}
                        — {approval.action}
                      </Text>
                      {approval.reason && (
                        <Text fontSize="sm" color="gray.500">
                          {approval.reason}
                        </Text>
                      )}
                      <Text fontSize="xs" color="gray.400">
                        {new Date(approval.approved_at).toLocaleString('pt-BR')}
                      </Text>
                    </Box>
                  ))}
                </VStack>
              </Box>
            )}
          </>
        )}
      </VStack>
    </Box>
  );
}
