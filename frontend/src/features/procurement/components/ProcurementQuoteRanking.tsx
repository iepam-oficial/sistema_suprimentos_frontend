'use client';

import { useMemo, useState } from 'react';
import {
  Badge,
  Box,
  Button,
  FormControl,
  FormLabel,
  HStack,
  Progress,
  Table,
  Tbody,
  Td,
  Text,
  Textarea,
  Th,
  Thead,
  Tr,
  useColorModeValue,
  useToast,
  VStack,
} from '@chakra-ui/react';
import type { ProcurementQuoteDTO, ProcurementQuoteRankingDTO } from '@ti-assistant/contracts';
import { approveProcurementQuote } from '../api/procurementQuoteApi';

interface ProcurementQuoteRankingProps {
  quote: ProcurementQuoteDTO;
  canApprove?: boolean;
  onApproved?: () => void;
}

function scoreBar(score: number, colorScheme: string) {
  return (
    <HStack spacing={2}>
      <Progress
        value={(score / 5) * 100}
        size="sm"
        colorScheme={colorScheme}
        flex={1}
        borderRadius="full"
      />
      <Text fontSize="xs" minW="28px" textAlign="right">
        {score.toFixed(1)}
      </Text>
    </HStack>
  );
}

function supplierName(ranking: ProcurementQuoteRankingDTO): string {
  return ranking.invite?.supplier?.name ?? '—';
}

export function ProcurementQuoteRanking({
  quote,
  canApprove = false,
  onApproved,
}: ProcurementQuoteRankingProps) {
  const toast = useToast();
  const [selectedInviteId, setSelectedInviteId] = useState<string | null>(null);
  const [justification, setJustification] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const borderColor = useColorModeValue('gray.200', 'gray.600');
  const textColor = useColorModeValue('gray.800', 'white');
  const mutedColor = useColorModeValue('gray.600', 'gray.400');
  const hoverBg = useColorModeValue('blue.50', 'gray.700');
  const approvedBg = useColorModeValue('green.50', 'green.900');

  const rankings = useMemo(
    () => [...(quote.rankings ?? [])].sort((a, b) => a.rank - b.rank),
    [quote.rankings]
  );

  const topRankInviteId = rankings.find((r) => r.rank === 1)?.invite_id ?? null;
  const selectedRanking = rankings.find((r) => r.invite_id === selectedInviteId);
  const requiresJustification =
    selectedRanking != null && selectedRanking.rank > 1;

  const handleApprove = async () => {
    if (!selectedInviteId) {
      toast({
        title: 'Selecione um fornecedor',
        description: 'Escolha o fornecedor vencedor na tabela.',
        status: 'warning',
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    if (requiresJustification && !justification.trim()) {
      toast({
        title: 'Justificativa obrigatória',
        description: 'Informe o motivo ao escolher fornecedor fora da 1ª colocação.',
        status: 'warning',
        duration: 4000,
        isClosable: true,
      });
      return;
    }

    const token = localStorage.getItem('@ti-assistant:token');
    if (!token) {
      toast({ title: 'Sessão expirada', status: 'error', duration: 3000, isClosable: true });
      return;
    }

    setSubmitting(true);
    try {
      await approveProcurementQuote(token, quote.id, {
        winner_invite_id: selectedInviteId,
        winner_justification: justification.trim() || undefined,
      });
      toast({
        title: 'Cotação aprovada',
        status: 'success',
        duration: 4000,
        isClosable: true,
      });
      onApproved?.();
    } catch (err) {
      toast({
        title: 'Erro ao aprovar cotação',
        description: err instanceof Error ? err.message : 'Tente novamente.',
        status: 'error',
        duration: 4000,
        isClosable: true,
      });
    } finally {
      setSubmitting(false);
    }
  };

  if (rankings.length === 0) {
    return (
      <Text color={mutedColor} fontSize="sm">
        Ranking ainda não calculado. Encerre a cotação após receber as propostas.
      </Text>
    );
  }

  return (
    <VStack align="stretch" spacing={4}>
      <Box overflowX="auto" borderWidth="1px" borderColor={borderColor} borderRadius="md">
        <Table size="sm">
          <Thead>
            <Tr>
              <Th>Pos.</Th>
              <Th>Fornecedor</Th>
              <Th>Preço</Th>
              <Th>Entrega</Th>
              <Th>Pagamento</Th>
              <Th>Frete</Th>
              <Th>Impostos</Th>
              <Th>Total</Th>
            </Tr>
          </Thead>
          <Tbody>
            {rankings.map((ranking) => {
              const isTop = ranking.rank === 1;
              const isSelected = selectedInviteId === ranking.invite_id;

              return (
                <Tr
                  key={ranking.id}
                  cursor={canApprove && quote.status === 'CLOSED' ? 'pointer' : 'default'}
                  bg={isSelected ? hoverBg : undefined}
                  _hover={canApprove && quote.status === 'CLOSED' ? { bg: hoverBg } : undefined}
                  onClick={() => {
                    if (canApprove && quote.status === 'CLOSED') {
                      setSelectedInviteId(ranking.invite_id);
                    }
                  }}
                >
                  <Td color={textColor} fontWeight="medium">
                    <HStack>
                      <Text>#{ranking.rank}</Text>
                      {isTop && (
                        <Badge colorScheme="green" fontSize="2xs">
                          Recomendado
                        </Badge>
                      )}
                    </HStack>
                  </Td>
                  <Td color={textColor}>{supplierName(ranking)}</Td>
                  <Td minW="100px">{scoreBar(ranking.score_price, 'green')}</Td>
                  <Td minW="100px">{scoreBar(ranking.score_delivery, 'blue')}</Td>
                  <Td minW="100px">{scoreBar(ranking.score_payment, 'purple')}</Td>
                  <Td minW="100px">{scoreBar(ranking.score_freight, 'orange')}</Td>
                  <Td minW="100px">{scoreBar(ranking.score_taxes, 'red')}</Td>
                  <Td color={textColor} fontWeight="bold">
                    {ranking.total_score.toFixed(2)}
                  </Td>
                </Tr>
              );
            })}
          </Tbody>
        </Table>
      </Box>

      {canApprove && quote.status === 'CLOSED' && (
        <Box borderWidth="1px" borderColor={borderColor} borderRadius="md" p={4}>
          <Text fontSize="sm" fontWeight="medium" mb={3}>
            Aprovar fornecedor vencedor
          </Text>

          {selectedInviteId ? (
            <Text fontSize="sm" color={mutedColor} mb={3}>
              Selecionado:{' '}
              <strong>
                {supplierName(rankings.find((r) => r.invite_id === selectedInviteId)!)}
              </strong>
              {selectedInviteId !== topRankInviteId && (
                <Badge ml={2} colorScheme="orange">
                  Fora da 1ª colocação
                </Badge>
              )}
            </Text>
          ) : (
            <Text fontSize="sm" color={mutedColor} mb={3}>
              Clique em uma linha da tabela para selecionar o vencedor.
            </Text>
          )}

          <FormControl isRequired={requiresJustification} mb={4}>
            <FormLabel>
              Justificativa{requiresJustification ? '' : ' (opcional)'}
            </FormLabel>
            <Textarea
              value={justification}
              onChange={(e) => setJustification(e.target.value)}
              placeholder={
                requiresJustification
                  ? 'Explique por que o fornecedor recomendado não foi escolhido'
                  : 'Comentário opcional sobre a decisão'
              }
              rows={3}
            />
          </FormControl>

          <Button
            colorScheme="green"
            onClick={handleApprove}
            isLoading={submitting}
            loadingText="Aprovando..."
            isDisabled={!selectedInviteId}
          >
            Aprovar cotação
          </Button>
        </Box>
      )}

      {quote.status === 'APPROVED' && quote.winner_invite && (
        <Box p={3} bg={approvedBg} borderRadius="md">
          <Text fontSize="sm" fontWeight="medium" color={textColor}>
            Vencedor: {quote.winner_invite.supplier?.name ?? '—'}
          </Text>
          {quote.winner_justification && (
            <Text fontSize="sm" color={mutedColor} mt={1}>
              Justificativa: {quote.winner_justification}
            </Text>
          )}
        </Box>
      )}
    </VStack>
  );
}
