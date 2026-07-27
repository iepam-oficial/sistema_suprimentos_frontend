'use client';

import { useCallback, useEffect, useState } from 'react';
import {
  Button,
  Center,
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalFooter,
  ModalHeader,
  ModalOverlay,
  Spinner,
  useToast,
} from '@chakra-ui/react';
import type { PurchaseRequestDTO } from '@ti-assistant/contracts';
import { fetchPurchaseRequestById } from '../../api/purchaseRequestApi';
import { PurchaseRequestDetailLayout } from './PurchaseRequestDetailLayout';

interface PurchaseRequestDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  purchaseRequestId: string | null;
  token: string | null;
}

export function PurchaseRequestDetailModal({
  isOpen,
  onClose,
  purchaseRequestId,
  token,
}: PurchaseRequestDetailModalProps) {
  const toast = useToast();
  const [loading, setLoading] = useState(false);
  const [request, setRequest] = useState<PurchaseRequestDTO | null>(null);

  const loadRequest = useCallback(async () => {
    if (!token || !purchaseRequestId) {
      return;
    }

    try {
      setLoading(true);
      const data = await fetchPurchaseRequestById(token, purchaseRequestId);
      setRequest(data);
    } catch (err) {
      toast({
        title: 'Erro ao carregar detalhes',
        description: err instanceof Error ? err.message : 'Tente novamente.',
        status: 'error',
        duration: 4000,
        isClosable: true,
      });
      onClose();
    } finally {
      setLoading(false);
    }
  }, [onClose, purchaseRequestId, toast, token]);

  useEffect(() => {
    if (isOpen && purchaseRequestId && token) {
      loadRequest();
    }
    if (!isOpen) {
      setRequest(null);
    }
  }, [isOpen, loadRequest, purchaseRequestId, token]);

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="4xl" scrollBehavior="inside">
      <ModalOverlay />
      <ModalContent maxH="90vh">
        <ModalHeader>Detalhes da solicitação</ModalHeader>
        <ModalCloseButton />
        <ModalBody>
          {loading ? (
            <Center py={12}>
              <Spinner size="lg" />
            </Center>
          ) : request ? (
            <PurchaseRequestDetailLayout
              request={request}
              variant="modal"
              emphasizedSummary
            />
          ) : null}
        </ModalBody>
        <ModalFooter>
          <Button variant="ghost" onClick={onClose}>
            Fechar
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}
