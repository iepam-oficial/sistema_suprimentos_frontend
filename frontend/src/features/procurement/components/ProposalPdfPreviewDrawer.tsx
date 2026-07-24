'use client';

import {
  Box,
  Drawer,
  DrawerBody,
  DrawerCloseButton,
  DrawerContent,
  DrawerHeader,
  DrawerOverlay,
  Text,
  useColorModeValue,
} from '@chakra-ui/react';

interface ProposalPdfPreviewDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  supplierName: string;
  pdfUrl: string | null;
}

export function ProposalPdfPreviewDrawer({
  isOpen,
  onClose,
  supplierName,
  pdfUrl,
}: ProposalPdfPreviewDrawerProps) {
  const drawerBg = useColorModeValue('white', 'gray.800');
  const headerColor = useColorModeValue('gray.800', 'white');
  const mutedColor = useColorModeValue('gray.500', 'gray.400');

  return (
    <Drawer isOpen={isOpen} placement="right" onClose={onClose} size="lg">
      <DrawerOverlay />
      <DrawerContent bg={drawerBg}>
        <DrawerCloseButton />
        <DrawerHeader borderBottomWidth="1px" color={headerColor}>
          Proposta — {supplierName}
        </DrawerHeader>
        <DrawerBody p={4}>
          {pdfUrl ? (
            <Box
              as="iframe"
              src={pdfUrl}
              w="100%"
              h="calc(100vh - 120px)"
              borderWidth="1px"
              borderRadius="md"
            />
          ) : (
            <Text fontSize="sm" color={mutedColor}>
              PDF indisponível. Feche e recarregue a cotação para obter um novo link.
            </Text>
          )}
        </DrawerBody>
      </DrawerContent>
    </Drawer>
  );
}
