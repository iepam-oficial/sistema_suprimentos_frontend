'use client';

import { Box, VStack, useColorMode } from '@chakra-ui/react';

interface AdminTabShellProps {
    children: React.ReactNode;
    scrollContent: React.ReactNode;
}

export function AdminTabShell({ children, scrollContent }: AdminTabShellProps) {
    const { colorMode } = useColorMode();

    return (
        <VStack
            spacing={2}
            align="stretch"
            flex="1"
            minH={0}
            overflow="hidden"
            bg={colorMode === 'dark' ? 'rgba(45, 55, 72, 0.5)' : 'rgba(255, 255, 255, 0.5)'}
            backdropFilter="blur(12px)"
            p={2}
            borderRadius="md"
            boxShadow="sm"
            borderWidth="1px"
            borderColor={colorMode === 'dark' ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'}
        >
            <Box flexShrink={0}>{children}</Box>
            <Box
                flex="1"
                minH={0}
                overflowX="auto"
                overflowY="auto"
                borderWidth="1px"
                borderColor={colorMode === 'dark' ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'}
                borderRadius="md"
            >
                {scrollContent}
            </Box>
        </VStack>
    );
}
