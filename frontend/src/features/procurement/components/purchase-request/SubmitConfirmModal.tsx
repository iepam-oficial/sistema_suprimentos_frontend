'use client';

import {
  Button,
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalFooter,
  ModalHeader,
  ModalOverlay,
  Text,
} from '@chakra-ui/react';

interface SubmitConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  isLoading?: boolean;
}

export function SubmitConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  isLoading = false,
}: SubmitConfirmModalProps) {
  return (
    <Modal isOpen={isOpen} onClose={onClose} isCentered>
      <ModalOverlay />
      <ModalContent>
        <ModalHeader>Enviar solicitação?</ModalHeader>
        <ModalCloseButton />
        <ModalBody>
          <Text>
            Após o envio, a solicitação não poderá ser editada e seguirá para aprovação.
          </Text>
        </ModalBody>
        <ModalFooter gap={2}>
          <Button variant="ghost" onClick={onClose} isDisabled={isLoading}>
            Cancelar
          </Button>
          <Button colorScheme="blue" onClick={onConfirm} isLoading={isLoading} loadingText="Enviando...">
            Confirmar envio
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}
