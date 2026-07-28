'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  AlertDialog,
  AlertDialogBody,
  AlertDialogContent,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogOverlay,
  Box,
  Button,
  Divider,
  FormControl,
  FormHelperText,
  FormLabel,
  Heading,
  HStack,
  Input,
  NumberInput,
  NumberInputField,
  Text,
  useDisclosure,
  useToast,
  VStack,
} from '@chakra-ui/react';
import type { CatalogSettingsDTO } from '@ti-assistant/contracts';
import {
  fetchCatalogSettings,
  migrateInternalCodes,
  updateCatalogSettings,
} from '@/features/financeiro/api/catalogSettingsApi';

function formatExample(prefix: string, padding: number): string {
  const safePadding = Number.isFinite(padding) && padding > 0 ? padding : 6;
  const safePrefix = prefix.trim() || 'XXX';
  return `${safePrefix}-${String(1).padStart(safePadding, '0')}`;
}

export default function CatalogCodesSettingsPage() {
  const router = useRouter();
  const toast = useToast();
  const cancelRef = useRef<HTMLButtonElement>(null);
  const { isOpen, onOpen, onClose } = useDisclosure();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [migrating, setMigrating] = useState(false);
  const [authorized, setAuthorized] = useState(false);
  const [supplyPrefix, setSupplyPrefix] = useState('SUP');
  const [inventoryPrefix, setInventoryPrefix] = useState('PAT');
  const [padding, setPadding] = useState(6);
  const [updatedAt, setUpdatedAt] = useState<string | null>(null);

  const applySettings = useCallback((data: CatalogSettingsDTO) => {
    setSupplyPrefix(data.supply_domain_prefix);
    setInventoryPrefix(data.inventory_domain_prefix);
    setPadding(data.internal_code_padding);
    setUpdatedAt(data.updated_at);
  }, []);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await fetchCatalogSettings();
      applySettings(data);
    } catch (err) {
      toast({
        title: 'Erro ao carregar configurações',
        description: err instanceof Error ? err.message : 'Tente novamente.',
        status: 'error',
        duration: 4000,
        isClosable: true,
      });
    } finally {
      setLoading(false);
    }
  }, [applySettings, toast]);

  useEffect(() => {
    const token = localStorage.getItem('@ti-assistant:token');
    const user = JSON.parse(localStorage.getItem('@ti-assistant:user') || '{}');

    if (!token) {
      router.push('/');
      return;
    }

    if (user.role !== 'ADMIN') {
      toast({
        title: 'Acesso negado',
        description: 'Somente administradores podem alterar códigos internos.',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
      router.push('/dashboard');
      return;
    }

    setAuthorized(true);
    void load();
  }, [load, router, toast]);

  const handleSave = async () => {
    if (!supplyPrefix.trim() || !inventoryPrefix.trim()) {
      toast({
        title: 'Prefixos obrigatórios',
        description: 'Informe os prefixos de suprimentos e patrimônio.',
        status: 'warning',
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    if (!Number.isFinite(padding) || padding < 1 || padding > 12) {
      toast({
        title: 'Padding inválido',
        description: 'Use um valor entre 1 e 12 dígitos.',
        status: 'warning',
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    setSaving(true);
    try {
      const data = await updateCatalogSettings({
        supply_domain_prefix: supplyPrefix.trim(),
        inventory_domain_prefix: inventoryPrefix.trim(),
        internal_code_padding: padding,
      });
      applySettings(data);
      toast({
        title: 'Configurações salvas',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
    } catch (err) {
      toast({
        title: 'Erro ao salvar',
        description: err instanceof Error ? err.message : 'Tente novamente.',
        status: 'error',
        duration: 4000,
        isClosable: true,
      });
    } finally {
      setSaving(false);
    }
  };

  const handleMigrate = async () => {
    setMigrating(true);
    try {
      const result = await migrateInternalCodes();
      onClose();
      toast({
        title: 'Migração concluída',
        description: `${result.supplies_updated} suprimento(s) e ${result.inventory_updated} item(ns) de patrimônio atualizados.`,
        status: 'success',
        duration: 6000,
        isClosable: true,
      });
    } catch (err) {
      toast({
        title: 'Erro na migração',
        description: err instanceof Error ? err.message : 'Tente novamente.',
        status: 'error',
        duration: 4000,
        isClosable: true,
      });
    } finally {
      setMigrating(false);
    }
  };

  if (!authorized) {
    return null;
  }

  return (
    <Box>
      <Heading size="lg" mb={2}>
        Códigos internos do catálogo
      </Heading>
      <Text mb={6} fontSize="sm" color="gray.500">
        Configure prefixos e padding usados na geração de códigos internos de suprimentos e
        patrimônio. Salve as alterações antes de migrar códigos existentes.
      </Text>

      {loading ? (
        <Text>Carregando...</Text>
      ) : (
        <VStack align="stretch" spacing={6} maxW="560px">
          <FormControl>
            <FormLabel fontSize="sm">Prefixo de suprimentos</FormLabel>
            <Input
              value={supplyPrefix}
              onChange={(e) => setSupplyPrefix(e.target.value)}
              placeholder="SUP"
              size="sm"
            />
            <FormHelperText>Exemplo: {formatExample(supplyPrefix, padding)}</FormHelperText>
          </FormControl>

          <FormControl>
            <FormLabel fontSize="sm">Prefixo de patrimônio</FormLabel>
            <Input
              value={inventoryPrefix}
              onChange={(e) => setInventoryPrefix(e.target.value)}
              placeholder="PAT"
              size="sm"
            />
            <FormHelperText>Exemplo: {formatExample(inventoryPrefix, padding)}</FormHelperText>
          </FormControl>

          <FormControl>
            <FormLabel fontSize="sm">Padding numérico</FormLabel>
            <NumberInput
              min={1}
              max={12}
              value={padding}
              onChange={(_, value) => setPadding(Number.isFinite(value) ? value : 6)}
              size="sm"
            >
              <NumberInputField />
            </NumberInput>
            <FormHelperText>Quantidade de dígitos após o hífen (1 a 12).</FormHelperText>
          </FormControl>

          {updatedAt && (
            <Text fontSize="xs" color="gray.500">
              Última atualização: {new Date(updatedAt).toLocaleString('pt-BR')}
            </Text>
          )}

          <HStack>
            <Button colorScheme="blue" onClick={() => void handleSave()} isLoading={saving}>
              Salvar configurações
            </Button>
          </HStack>

          <Divider />

          <Box>
            <Heading size="sm" mb={2}>
              Migrar códigos existentes
            </Heading>
            <Text fontSize="sm" color="gray.500" mb={4}>
              Recalcula os códigos internos de todos os suprimentos e itens de patrimônio com base
              nos prefixos e padding atuais. Operação irreversível em massa — confirme antes de
              continuar.
            </Text>
            <Button colorScheme="orange" variant="outline" onClick={onOpen}>
              Migrar códigos
            </Button>
          </Box>
        </VStack>
      )}

      <AlertDialog isOpen={isOpen} leastDestructiveRef={cancelRef} onClose={onClose}>
        <AlertDialogOverlay>
          <AlertDialogContent>
            <AlertDialogHeader fontSize="lg" fontWeight="bold">
              Confirmar migração de códigos
            </AlertDialogHeader>
            <AlertDialogBody>
              Esta ação irá recalcular os códigos internos de todos os suprimentos e itens de
              patrimônio usando os prefixos{' '}
              <Text as="span" fontWeight="semibold">
                {supplyPrefix.trim() || '—'}
              </Text>{' '}
              e{' '}
              <Text as="span" fontWeight="semibold">
                {inventoryPrefix.trim() || '—'}
              </Text>{' '}
              com padding {padding}. Deseja continuar?
            </AlertDialogBody>
            <AlertDialogFooter>
              <Button ref={cancelRef} onClick={onClose} isDisabled={migrating}>
                Cancelar
              </Button>
              <Button
                colorScheme="orange"
                onClick={() => void handleMigrate()}
                isLoading={migrating}
                ml={3}
              >
                Migrar
              </Button>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialogOverlay>
      </AlertDialog>
    </Box>
  );
}
