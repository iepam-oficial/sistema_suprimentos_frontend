'use client';

import { Box, Heading, useColorMode, VStack } from '@chakra-ui/react';

interface PurchaseRequestPageShellProps {
  title?: string;
  toolbar?: React.ReactNode;
  children: React.ReactNode;
}

export function PurchaseRequestPageShell({
  title = 'Solicitações de Compra',
  toolbar,
  children,
}: PurchaseRequestPageShellProps) {
  const { colorMode } = useColorMode();

  return (
    <Box h="100vh" display="flex" flexDirection="column" overflow="hidden" px={2} py={2}>
      <VStack
        spacing={2}
        align="stretch"
        bg={colorMode === 'dark' ? 'rgba(45, 55, 72, 0.5)' : 'rgba(255, 255, 255, 0.5)'}
        backdropFilter="blur(12px)"
        p={2}
        borderRadius="md"
        boxShadow="sm"
        borderWidth="1px"
        borderColor={colorMode === 'dark' ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'}
        flex="1"
        minH={0}
        overflow="hidden"
      >
        <Heading size="md" flexShrink={0} display={{ base: 'none', md: 'block' }}>
          {title}
        </Heading>
        {toolbar}
        <Box flex="1" minH={0} overflow="hidden" display="flex" flexDirection="column">
          {children}
        </Box>
      </VStack>
    </Box>
  );
}
