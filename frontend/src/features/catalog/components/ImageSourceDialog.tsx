import { AlertDialog, AlertDialogOverlay, AlertDialogContent, AlertDialogHeader, AlertDialogBody, AlertDialogFooter, Button, VStack } from '@chakra-ui/react';
import { Camera, Image as ImageIcon } from 'lucide-react';
import React from 'react';

interface ImageSourceDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectGallery: () => void;
  onSelectCamera: () => void;
  leastDestructiveRef: React.RefObject<HTMLButtonElement>;
  title: string;
}

export function ImageSourceDialog({ isOpen, onClose, onSelectGallery, onSelectCamera, leastDestructiveRef, title }: ImageSourceDialogProps) {
  return (
    <AlertDialog
      isOpen={isOpen}
      leastDestructiveRef={leastDestructiveRef}
      onClose={onClose}
    >
      <AlertDialogOverlay />
      <AlertDialogContent>
        <AlertDialogHeader>{title}</AlertDialogHeader>
        <AlertDialogBody>
          <VStack spacing={4}>
            <Button leftIcon={<ImageIcon size={18} />} w="full" onClick={onSelectGallery}>
              Escolher da galeria
            </Button>
            <Button leftIcon={<Camera size={18} />} w="full" onClick={onSelectCamera} colorScheme="purple">
              Usar câmera
            </Button>
          </VStack>
        </AlertDialogBody>
        <AlertDialogFooter>
          <Button ref={leastDestructiveRef} onClick={onClose}>
            Cancelar
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
