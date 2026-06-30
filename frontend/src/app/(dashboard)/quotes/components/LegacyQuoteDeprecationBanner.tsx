'use client';

import { Alert, AlertDescription, AlertIcon, AlertTitle, Link } from '@chakra-ui/react';
import NextLink from 'next/link';

export function LegacyQuoteDeprecationBanner() {
  return (
    <Alert status="warning" borderRadius="md">
      <AlertIcon />
      <AlertTitle>Módulo legado</AlertTitle>
      <AlertDescription>
        Este módulo de cotações está depreciado. Para novas cotações, utilize{' '}
        <Link as={NextLink} href="/procurement/cotacoes" fontWeight="semibold" textDecoration="underline">
          Cotações de Compras
        </Link>
        . As funcionalidades aqui permanecem disponíveis apenas para consulta e compatibilidade.
      </AlertDescription>
    </Alert>
  );
}
