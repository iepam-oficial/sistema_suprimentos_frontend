'use client';

import { Box, Flex, type FlexProps } from '@chakra-ui/react';
import { useGlassTokens } from './useGlassTokens';

export interface PortalActionBarProps extends FlexProps {
  children: React.ReactNode;
}

export function PortalActionBar({ children, ...rest }: PortalActionBarProps) {
  const { borderColor } = useGlassTokens();

  return (
    <Box flexShrink={0} pt={2} borderTopWidth="1px" borderColor={borderColor}>
      <Flex gap={2} flexWrap="wrap" align="center" justify="flex-end" {...rest}>
        {children}
      </Flex>
    </Box>
  );
}
