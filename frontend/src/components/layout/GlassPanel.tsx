'use client';

import { VStack, type StackProps } from '@chakra-ui/react';
import { useGlassTokens } from './useGlassTokens';

export interface GlassPanelProps extends StackProps {
  children: React.ReactNode;
}

export function GlassPanel({ children, ...rest }: GlassPanelProps) {
  const { panelBg, borderColor } = useGlassTokens();

  return (
    <VStack
      spacing={2}
      align="stretch"
      flex="1"
      minH={0}
      overflow="hidden"
      bg={panelBg}
      backdropFilter="blur(12px)"
      p={2}
      borderRadius="md"
      boxShadow="sm"
      borderWidth="1px"
      borderColor={borderColor}
      {...rest}
    >
      {children}
    </VStack>
  );
}
