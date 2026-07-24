'use client';

import { Box, type BoxProps } from '@chakra-ui/react';
import { useGlassTokens } from './useGlassTokens';

export interface GlassScrollAreaProps extends BoxProps {
  children: React.ReactNode;
  withBorder?: boolean;
}

export function GlassScrollArea({
  children,
  withBorder = true,
  ...rest
}: GlassScrollAreaProps) {
  const { borderColor } = useGlassTokens();

  return (
    <Box
      flex="1"
      minH={0}
      overflowX="auto"
      overflowY="auto"
      borderWidth={withBorder ? '1px' : undefined}
      borderColor={withBorder ? borderColor : undefined}
      borderRadius={withBorder ? 'md' : undefined}
      {...rest}
    >
      {children}
    </Box>
  );
}
