'use client';

import { useColorMode } from '@chakra-ui/react';

export function useGlassTokens() {
  const { colorMode } = useColorMode();
  const isDark = colorMode === 'dark';

  return {
    panelBg: isDark ? 'rgba(45, 55, 72, 0.5)' : 'rgba(255, 255, 255, 0.5)',
    borderColor: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)',
    borderColorHover: isDark ? 'rgba(255, 255, 255, 0.2)' : 'rgba(0, 0, 0, 0.2)',
    inputBg: isDark ? 'rgba(45, 55, 72, 0.5)' : 'rgba(255, 255, 255, 0.5)',
    mutedColor: isDark ? 'gray.300' : 'gray.600',
    headingColor: isDark ? 'white' : 'gray.800',
    theadBg: isDark ? 'rgba(45, 55, 72, 0.95)' : 'rgba(255, 255, 255, 0.95)',
  };
}
