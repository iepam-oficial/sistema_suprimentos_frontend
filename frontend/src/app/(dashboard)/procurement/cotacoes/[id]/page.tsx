'use client';

import { useCallback, useEffect, useState } from 'react';
import {
  Badge,
  Box,
  Button,
  Center,
  Divider,
  Heading,
  HStack,
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
import type { ProcurementQuoteDTO } from '@ti-assistant/contracts';
import {
  closeProcurementQuote,
  fetchProcurementQuoteById,
  ProcurementQuoteRanking,
  procurementQuoteStatusColor,
  procurementQuoteStatusLabel,
  sendProcurementQuote,
} from '@/features/procurement';

const VIEW_ROLES = ['MANAGER', 'DIRECTOR', 'ADMIN'];
const MANAGER_ROLES = ['MANAGER', 'ADMIN'];
const DIRECTOR_ROLES = ['DIRECTOR', 'ADMIN'];

function inviteStatusLabel(status: string): string {
  const labels: Record<string, string> = {
    PENDING: 'Pendente',
    ACCEPTED: 'Aceito',
    DECLINED: 'Recusado',
    RESPONDED: 'Respondido',
    EXPIRED: 'Expirado',
  };
  return labels[status] ?? status;
}

export default function ProcurementQuoteDetailPage() {
  const router = useRouter();
  const params = useParams();
  const toast = useToast();
  const quoteId = params.id as string;

  const [authorized, setAuthorized] = useState(false);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [quote, setQuote] = useState<ProcurementQuoteDTO | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  const bgColor = useColorModeValue('white', 'gray.700');
  const borderColor = useColorModeValue('gray.200', 'gray.600');
  const headingColor = useColorModeValue('gray.800', 'white');
  const textColor = useColorModeValue('gray.700', 'gray.200');
  const mutedColor = useColorModeValue('gray.500', 'gray.400');

  const loadQuote = useCallback(async () => {
    const token = localStorage.getItem('@ti-assistant:token');
    if (!token) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const data = await fetchProcurementQuoteById(token, quoteId);
      setQuote(data);
    } catch (err) {
      toast({
        title: 'Erro ao carregar cotação',
        description: err instanceof Error ? err.message : 'Tente novamente.',
        status: 'error',
        duration: 4000,
        isClosable: true,
      });
    } finally {
      setLoading(false);
    }
  }, [quoteId, toast]);

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem('@ti-assistant:user') || '{}');
    if (!user?.role || !VIEW_ROLES.includes(user.role)) {
      router.push('/unauthorized');
      return;
    }
    setUserRole(user.role);
    setAuthorized(true);
  }, [router]);

  useEffect(() => {
    if (authorized) {
      loadQuote();
    }
  }, [authorized, loadQuote]);

  const handleSend = async () => {
    const token = localStorage.getItem('@ti-assistant:token');
    if (!token) return;

    setActionLoading(true);
    try {
      await sendProcurementQuote(token, quoteId);
      toast({
        title: 'Cotação enviada',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
      loadQuote();
    } catch (err) {
      toast({
        title: 'Erro ao enviar',
        description: err instanceof Error ? err.message : 'Tente novamente.',
        status: 'error',
        duration: 4000,
        isClosable: true,
      });
    } finally {
      setActionLoading(false);
    }
  };

  const handleClose = async () => {
    const token = localStorage.getItem('@ti-assistant:token');
    if (!token) return;

    setActionLoading(true);
    try {
      await closeProcurementQuote(token, quoteId);
      toast({
        title: 'Cotação encerrada',
        description: 'O ranking foi calculado.',
        status: 'success',
        duration: 4000,
        isClosable: true,
      });
      loadQuote();
    } catch (err) {
      toast({
        title: 'Erro ao encerrar',
        description: err instanceof Error ? err.message : 'Tente novamente.',
        status: 'error',
        duration: 4000,
        isClosable: true,
      });
    } finally {
      setActionLoading(false);
    }
  };

  if (!authorized) {
    return null;
  }

  if (loading) {
    return (
      <Center py={20}>
        <Spinner size="xl" />
      </Center>
    );
  }

  if (!quote) {
    return (
      <Center py={20}>
        <Text color={mutedColor}>Cotação não encontrada.</Text>
      </Center>
    );
  }

  const isManager = userRole != null && MANAGER_ROLES.includes(userRole);
  const isDirector = userRole != null && DIRECTOR_ROLES.includes(userRole);

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
        h="full"
      >
        <HStack justify="space-between" flexWrap="wrap" gap={2}>
          <HStack>
            <Button
              variant="ghost"
              size="sm"
              leftIcon={<ArrowLeft size={16} />}
              onClick={() => router.push('/procurement/cotacoes')}
            >
              Voltar
            </Button>
            <Heading size="lg" color={headingColor}>
              {quote.display_code}
            </Heading>
            <Badge colorScheme={procurementQuoteStatusColor(quote.status)}>
              {procurementQuoteStatusLabel(quote.status)}
            </Badge>
          </HStack>

          <HStack>
            {isManager && quote.status === 'DRAFT' && (
              <Button
                colorScheme="blue"
                size="sm"
                onClick={handleSend}
                isLoading={actionLoading}
                loadingText="Enviando..."
              >
                Enviar cotação
              </Button>
            )}
            {isManager && quote.status === 'SENT' && (
              <Button
                colorScheme="purple"
                size="sm"
                onClick={handleClose}
                isLoading={actionLoading}
                loadingText="Encerrando..."
              >
                Encerrar e calcular ranking
              </Button>
            )}
          </HStack>
        </HStack>

        <Box>
          <Text fontSize="sm" color={mutedColor}>
            Solicitação: {quote.purchase_request?.display_code ?? '—'}
          </Text>
          {quote.notes && (
            <Text fontSize="sm" color={textColor} mt={1}>
              Observações: {quote.notes}
            </Text>
          )}
          <Text fontSize="sm" color={mutedColor} mt={1}>
            Prazo de resposta:{' '}
            {new Date(quote.response_deadline).toLocaleString('pt-BR')}
          </Text>
        </Box>

        <Divider />

        <Box>
          <Heading size="sm" mb={3} color={headingColor}>
            Convites aos fornecedores
          </Heading>
          <Box overflowX="auto">
            <Table size="sm">
              <Thead>
                <Tr>
                  <Th>Fornecedor</Th>
                  <Th>Status</Th>
                  <Th>Proposta</Th>
                  <Th>Valor total</Th>
                </Tr>
              </Thead>
              <Tbody>
                {(quote.invites ?? []).map((invite) => (
                  <Tr key={invite.id}>
                    <Td color={textColor}>{invite.supplier?.name ?? '—'}</Td>
                    <Td>
                      <Badge>{inviteStatusLabel(invite.status)}</Badge>
                    </Td>
                    <Td color={textColor}>
                      {invite.proposal ? 'Enviada' : '—'}
                    </Td>
                    <Td color={textColor}>
                      {invite.proposal
                        ? invite.proposal.total_value.toLocaleString('pt-BR', {
                            style: 'currency',
                            currency: 'BRL',
                          })
                        : '—'}
                    </Td>
                  </Tr>
                ))}
              </Tbody>
            </Table>
          </Box>
        </Box>

        <Divider />

        <Box>
          <Heading size="sm" mb={3} color={headingColor}>
            Ranking de propostas
          </Heading>
          <ProcurementQuoteRanking
            quote={quote}
            canApprove={isDirector}
            onApproved={loadQuote}
          />
        </Box>
      </VStack>
    </Box>
  );
}
