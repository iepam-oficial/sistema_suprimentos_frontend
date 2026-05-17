'use client';

import { useColorMode } from '@chakra-ui/react';
import { useEffect } from 'react';

/** Sincroniza a classe `dark` do Tailwind com o colorMode do Chakra. */
export function ChakraColorModeSync() {
  const { colorMode } = useColorMode();

  useEffect(() => {
    const root = document.documentElement;
    if (colorMode === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
  }, [colorMode]);

  return null;
}
