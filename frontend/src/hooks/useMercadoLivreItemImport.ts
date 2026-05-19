'use client';

import { useCallback, useRef, useState } from 'react';
import { useToast } from '@chakra-ui/react';
import {
  importProductFromLink,
  isMercadoLivreUrl,
  type QuoteItemFromML,
} from '@/utils/mercadoLivre';

export function useMercadoLivreItemImport() {
  const toast = useToast();
  const [loadingIndex, setLoadingIndex] = useState<number | null>(null);
  const lastImportedRef = useRef<Record<number, string>>({});

  const tryImportFromLink = useCallback(
    async (index: number, rawLink: string): Promise<QuoteItemFromML | null> => {
      const trimmed = rawLink.trim();
      if (!trimmed || !isMercadoLivreUrl(trimmed)) {
        return null;
      }

      if (loadingIndex === index) {
        return null;
      }

      const normalizedKey = trimmed.toLowerCase();
      if (lastImportedRef.current[index] === normalizedKey) {
        return null;
      }

      const token = localStorage.getItem('@ti-assistant:token');
      if (!token) {
        toast({
          title: 'Erro',
          description: 'Faça login para importar produtos do Mercado Livre.',
          status: 'error',
          duration: 3000,
        });
        return null;
      }

      setLoadingIndex(index);
      try {
        const draft = await importProductFromLink(trimmed, token);
        lastImportedRef.current[index] = normalizedKey;
        toast({
          title: 'Produto importado',
          description: 'Dados preenchidos a partir do Mercado Livre.',
          status: 'success',
          duration: 3000,
        });
        return draft;
      } catch (error) {
        const message =
          error instanceof Error
            ? error.message
            : 'Não foi possível importar o produto do Mercado Livre.';
        toast({
          title: 'Mercado Livre',
          description: message,
          status: 'error',
          duration: 4000,
        });
        return null;
      } finally {
        setLoadingIndex(null);
      }
    },
    [loadingIndex, toast]
  );

  const resetImportCache = useCallback((index: number) => {
    delete lastImportedRef.current[index];
  }, []);

  return {
    loadingIndex,
    tryImportFromLink,
    resetImportCache,
  };
}
