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
  IconButton,
  Spinner,
  Table,
  Tbody,
  Td,
  Text,
  Th,
  Thead,
  Tr,
  useColorModeValue,
  useDisclosure,
  useToast,
  VStack,
} from '@chakra-ui/react';
import { ArrowLeft, Clock, FileText, History } from 'lucide-react';
import { useParams, useRouter } from 'next/navigation';
import type {
  ProcurementQuoteDTO,
  ProcurementQuoteInviteDTO,
} from '@ti-assistant/contracts';
import { ProposalReviewStatus, QuoteInviteStatus } from '@ti-assistant/contracts';
import {
  closeProcurementQuote,
  CloseQuoteConfirmModal,
  CloseQuotePendingReviewError,
  type CloseQuotePendingSupplier,
  fetchProcurementQuoteById,
  getReviewBadge,
  markProposalReviewOk,
  ProcurementQuoteRanking,
  procurementQuoteStatusColor,
  procurementQuoteStatusLabel,
  ProposalCorrectionModal,
  ProposalPdfPreviewDrawer,
  ProposalReviewHistoryDrawer,
  QuoteOriginSection,
  QuoteTimelineDrawer,
  sendProcurementQuote,
  usePollingRefresh,
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
  const [pdfPreview, setPdfPreview] = useState<{
    supplierName: string;
    pdfUrl: string;
  } | null>(null);
  const [reviewingInviteId, setReviewingInviteId] = useState<string | null>(null);
  const [correctionInvite, setCorrectionInvite] =
    useState<ProcurementQuoteInviteDTO | null>(null);
  const [historyInvite, setHistoryInvite] = useState<{
    inviteId: string;
    supplierName: string;
  } | null>(null);
  const [pendingSuppliers, setPendingSuppliers] = useState<
    CloseQuotePendingSupplier[]
  >([]);

  const {
    isOpen: isTimelineOpen,
    onOpen: onTimelineOpen,
    onClose: onTimelineClose,
  } = useDisclosure();
  const {
    isOpen: isPdfOpen,
    onOpen: onPdfOpen,
    onClose: onPdfClose,
  } = useDisclosure();
  const {
    isOpen: isCorrectionOpen,
    onOpen: onCorrectionOpen,
    onClose: onCorrectionClose,
  } = useDisclosure();
  const {
    isOpen: isHistoryOpen,
    onOpen: onHistoryOpen,
    onClose: onHistoryClose,
  } = useDisclosure();
  const {
    isOpen: isCloseConfirmOpen,
    onOpen: onCloseConfirmOpen,
    onClose: onCloseConfirmClose,
  } = useDisclosure();

  const bgColor = useColorModeValue('white', 'gray.700');
  const borderColor = useColorModeValue('gray.200', 'gray.600');
  const headingColor = useColorModeValue('gray.800', 'white');
  const textColor = useColorModeValue('gray.700', 'gray.200');
  const mutedColor = useColorModeValue('gray.500', 'gray.400');

  const loadQuote = useCallback(async (options?: { silent?: boolean }) => {
    const silent = options?.silent === true;
    const token = localStorage.getItem('@ti-assistant:token');
    if (!token) {
      if (!silent) {
        setLoading(false);
      }
      return;
    }

    try {
      if (!silent) {
        setLoading(true);
      }
      const data = await fetchProcurementQuoteById(
        token,
        quoteId,
        silent ? { polling: true } : undefined,
      );
      setQuote(data);
    } catch (err) {
      if (!silent) {
        toast({
          title: 'Erro ao carregar cotação',
          description: err instanceof Error ? err.message : 'Tente novamente.',
          status: 'error',
          duration: 4000,
          isClosable: true,
        });
      }
    } finally {
      if (!silent) {
        setLoading(false);
      }
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
      void loadQuote();
    }
  }, [authorized, loadQuote]);

  const blockingOverlayOpen =
    isPdfOpen || isCorrectionOpen || isHistoryOpen || isCloseConfirmOpen;

  usePollingRefresh({
    enabled: authorized && !blockingOverlayOpen && !actionLoading,
    onTick: () => {
      void loadQuote({ silent: true });
    },
  });

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
      if (err instanceof CloseQuotePendingReviewError) {
        setPendingSuppliers(err.pending_suppliers);
        onCloseConfirmOpen();
        return;
      }
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

  const handleReviewOk = async (invite: ProcurementQuoteInviteDTO) => {
    const token = localStorage.getItem('@ti-assistant:token');
    if (!token) return;

    setReviewingInviteId(invite.id);
    try {
      await markProposalReviewOk(token, quoteId, invite.id);
      toast({
        title: 'Revisão registrada',
        description: 'A proposta foi marcada como Revisão OK.',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
      await loadQuote();
    } catch (err) {
      toast({
        title: 'Erro ao registrar revisão',
        description: err instanceof Error ? err.message : 'Tente novamente.',
        status: 'error',
        duration: 4000,
        isClosable: true,
      });
    } finally {
      setReviewingInviteId(null);
    }
  };

  const handleOpenCorrection = (invite: ProcurementQuoteInviteDTO) => {
    setCorrectionInvite(invite);
    onCorrectionOpen();
  };

  const handleCorrectionClose = () => {
    onCorrectionClose();
    setCorrectionInvite(null);
  };

  const handleOpenHistory = (invite: ProcurementQuoteInviteDTO) => {
    setHistoryInvite({
      inviteId: invite.id,
      supplierName: invite.supplier?.name ?? 'Fornecedor',
    });
    onHistoryOpen();
  };

  const handleHistoryClose = () => {
    onHistoryClose();
    setHistoryInvite(null);
  };

  const handleCloseConfirmSuccess = () => {
    setPendingSuppliers([]);
    loadQuote();
  };

  const handleOpenPdf = (supplierName: string, pdfUrl: string) => {
    setPdfPreview({ supplierName, pdfUrl });
    onPdfOpen();
  };

  const handlePdfClose = () => {
    onPdfClose();
    setPdfPreview(null);
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
            <Button
              variant="outline"
              size="sm"
              leftIcon={<Clock size={16} />}
              onClick={onTimelineOpen}
            >
              Linha do tempo
            </Button>
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
          {quote.purchase_request && (
            <QuoteOriginSection purchaseRequest={quote.purchase_request} />
          )}
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
                  <Th>Revisão</Th>
                  <Th>Proposta</Th>
                  <Th>Valor total</Th>
                  <Th>PDF</Th>
                  {isManager && <Th>Ações</Th>}
                </Tr>
              </Thead>
              <Tbody>
                {(quote.invites ?? []).map((invite) => {
                  const pdfUrl = invite.proposal?.proposal_pdf_url;
                  const hasProposal = !!invite.proposal;
                  const reviewBadge = getReviewBadge(
                    invite.proposal_review_status,
                    invite.status,
                    hasProposal
                  );
                  const canReview =
                    hasProposal &&
                    invite.proposal_review_status ===
                      ProposalReviewStatus.PENDING_REVIEW &&
                    invite.status === QuoteInviteStatus.RESPONDED &&
                    quote.status === 'SENT';
                  const hasHistory =
                    hasProposal ||
                    invite.proposal_review_status != null ||
                    invite.status === QuoteInviteStatus.CORRECTION_REQUESTED;

                  return (
                    <Tr key={invite.id}>
                      <Td color={textColor}>{invite.supplier?.name ?? '—'}</Td>
                      <Td>
                        <Badge>{inviteStatusLabel(invite.status)}</Badge>
                      </Td>
                      <Td>
                        <Badge colorScheme={reviewBadge.colorScheme}>
                          {reviewBadge.label}
                        </Badge>
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
                      <Td>
                        {pdfUrl ? (
                          <IconButton
                            aria-label="Ver PDF da proposta"
                            icon={<FileText size={16} />}
                            size="sm"
                            variant="outline"
                            onClick={() =>
                              handleOpenPdf(invite.supplier?.name ?? 'Fornecedor', pdfUrl)
                            }
                          />
                        ) : (
                          <Text fontSize="sm" color={mutedColor}>
                            —
                          </Text>
                        )}
                      </Td>
                      {isManager && (
                        <Td>
                          <HStack spacing={2} flexWrap="wrap">
                            {canReview && (
                              <>
                                <Button
                                  size="xs"
                                  colorScheme="green"
                                  onClick={() => handleReviewOk(invite)}
                                  isLoading={reviewingInviteId === invite.id}
                                  loadingText="Salvando..."
                                >
                                  Revisão OK
                                </Button>
                                <Button
                                  size="xs"
                                  colorScheme="orange"
                                  variant="outline"
                                  onClick={() => handleOpenCorrection(invite)}
                                >
                                  Solicitar correção
                                </Button>
                              </>
                            )}
                            {hasHistory && (
                              <Button
                                size="xs"
                                variant="ghost"
                                leftIcon={<History size={14} />}
                                onClick={() => handleOpenHistory(invite)}
                              >
                                Histórico
                              </Button>
                            )}
                            {!canReview && !hasHistory && (
                              <Text fontSize="sm" color={mutedColor}>
                                —
                              </Text>
                            )}
                          </HStack>
                        </Td>
                      )}
                    </Tr>
                  );
                })}
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

      <QuoteTimelineDrawer
        isOpen={isTimelineOpen}
        onClose={onTimelineClose}
        quoteId={quoteId}
        invites={quote.invites ?? []}
        pollingEnabled={!blockingOverlayOpen && !actionLoading}
      />

      <ProposalPdfPreviewDrawer
        isOpen={isPdfOpen}
        onClose={handlePdfClose}
        supplierName={pdfPreview?.supplierName ?? ''}
        pdfUrl={pdfPreview?.pdfUrl ?? null}
      />

      {correctionInvite && (
        <ProposalCorrectionModal
          quoteId={quoteId}
          inviteId={correctionInvite.id}
          proposal={correctionInvite.proposal}
          supplierName={correctionInvite.supplier?.name}
          isOpen={isCorrectionOpen}
          onClose={handleCorrectionClose}
          onSuccess={loadQuote}
        />
      )}

      <ProposalReviewHistoryDrawer
        quoteId={quoteId}
        inviteId={historyInvite?.inviteId ?? null}
        supplierName={historyInvite?.supplierName}
        isOpen={isHistoryOpen}
        onClose={handleHistoryClose}
      />

      <CloseQuoteConfirmModal
        quoteId={quoteId}
        pendingSuppliers={pendingSuppliers}
        isOpen={isCloseConfirmOpen}
        onClose={onCloseConfirmClose}
        onSuccess={handleCloseConfirmSuccess}
      />
    </Box>
  );
}
