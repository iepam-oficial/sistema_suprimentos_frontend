'use client';

import { Box, type BoxProps } from '@chakra-ui/react';

export interface ViewportPageShellProps extends BoxProps {
  children: React.ReactNode;
}

export function ViewportPageShell({ children, ...rest }: ViewportPageShellProps) {
  return (
    <Box
      h="100vh"
      display="flex"
      flexDirection="column"
      overflow="hidden"
      px={2}
      py={2}
      bg="transparent"
      {...rest}
    >
      {children}
    </Box>
  );
}
