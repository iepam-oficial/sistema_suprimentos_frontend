'use client';

import { useCallback, useEffect, useState } from 'react';
import {
  Badge,
  Box,
  Drawer,
  DrawerBody,
  DrawerCloseButton,
  DrawerContent,
  DrawerHeader,
  DrawerOverlay,
  HStack,
  Spinner,
  Text,
  useColorModeValue,
  VStack,
} from '@chakra-ui/react';
import type { ProcurementQuoteProposalReviewDTO } from '@ti-assistant/contracts';
import { fetchProposalReviews } from '../api/procurementQuoteApi';
import {
  getReviewActionColorScheme,
  getReviewActionLabel,
} from '../lib/proposalReviewLabels';

interface ProposalReviewHistoryDrawerProps {
  quoteId: string;
  inviteId: string | null;
  supplierName?: string;
  isOpen: boolean;
  onClose: () => void;
}

function formatDateTime(value: string): string {
  return new Date(value).toLocaleString('pt-BR');
}

export function ProposalReviewHistoryDrawer({
  quoteId,
  inviteId,
  supplierName,
  isOpen,
  onClose,
}: ProposalReviewHistoryDrawerProps) {
  const drawerBg = useColorModeValue('white', 'gray.800');
  const drawerBorder = useColorModeValue('gray.200', 'gray.600');
  const textColor = useColorModeValue('gray.800', 'white');
  const mutedColor = useColorModeValue('gray.500', 'gray.400');
  const itemBg = useColorModeValue('gray.50', 'gray.700');

  const [reviews, setReviews] = useState<ProcurementQuoteProposalReviewDTO[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadReviews = useCallback(async () => {
    if (!inviteId) return;

    setLoading(true);
    setError(null);

    try {
      const token = localStorage.getItem('@ti-assistant:token');
      if (!token) {
        throw new Error('Token não encontrado');
      }

      const data = await fetchProposalReviews(token, quoteId, inviteId);
      setReviews(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao carregar histórico');
      setReviews([]);
    } finally {
      setLoading(false);
    }
  }, [quoteId, inviteId]);

  useEffect(() => {
    if (isOpen && inviteId) {
      void loadReviews();
    } else if (!isOpen) {
      setReviews([]);
      setError(null);
    }
  }, [isOpen, inviteId, loadReviews]);

  return (
    <Drawer isOpen={isOpen} placement="right" onClose={onClose} size="md">
      <DrawerOverlay />
      <DrawerContent bg={drawerBg} borderLeft="1px solid" borderColor={drawerBorder}>
        <DrawerCloseButton />
        <DrawerHeader color={textColor} borderBottom="1px solid" borderColor={drawerBorder}>
          <Text>Histórico de revisões{supplierName ? ` — ${supplierName}` : ''}</Text>
        </DrawerHeader>
        <DrawerBody>
          {loading ? (
            <VStack py={8}>
              <Spinner size="lg" />
            </VStack>
          ) : error ? (
            <Text color="red.500" py={4}>
              {error}
            </Text>
          ) : reviews.length === 0 ? (
            <Text color={mutedColor} py={4}>
              Nenhuma revisão registrada ainda.
            </Text>
          ) : (
            <VStack spacing={3} pt={2} align="stretch">
              {reviews.map((review) => (
                <Box
                  key={review.id}
                  bg={itemBg}
                  borderRadius="md"
                  p={3}
                  borderWidth="1px"
                  borderColor={drawerBorder}
                >
                  <HStack spacing={2} flexWrap="wrap" mb={1}>
                    <Text fontSize="sm" color={mutedColor}>
                      {formatDateTime(review.created_at)}
                    </Text>
                    <Text fontSize="sm" color={mutedColor}>
                      · {review.reviewed_by?.name ?? 'Usuário'}
                    </Text>
                    <Badge colorScheme={getReviewActionColorScheme(review.action)}>
                      {getReviewActionLabel(review.action)}
                    </Badge>
                  </HStack>

                  {review.message && (
                    <Text fontSize="sm" color={textColor} mb={2} whiteSpace="pre-wrap">
                      {review.message}
                    </Text>
                  )}

                  {(review.flagged_items?.length ?? 0) > 0 ? (
                    <VStack spacing={1} align="stretch" mt={1}>
                      <Text fontSize="xs" fontWeight="medium" color={mutedColor}>
                        Linhas marcadas:
                      </Text>
                      {review.flagged_items!.map((item) => (
                        <Text key={item.id} fontSize="xs" color={textColor}>
                          • {item.description} (Qtd: {item.quantity})
                        </Text>
                      ))}
                    </VStack>
                  ) : review.flagged_item_ids.length > 0 ? (
                    <Text fontSize="xs" color={mutedColor} mt={1}>
                      {review.flagged_item_ids.length} linha(s) marcada(s).
                    </Text>
                  ) : null}
                </Box>
              ))}
            </VStack>
          )}
        </DrawerBody>
      </DrawerContent>
    </Drawer>
  );
}
