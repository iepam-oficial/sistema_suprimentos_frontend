'use client';

import React, { useEffect, useState } from 'react';
import {
  Drawer,
  DrawerOverlay,
  DrawerContent,
  DrawerHeader,
  DrawerBody,
  DrawerCloseButton,
  DrawerFooter,
  FormControl,
  FormLabel,
  Select,
  VStack,
  HStack,
  Button,
  Badge,
  Text,
  useBreakpointValue,
  useColorModeValue,
} from '@chakra-ui/react';
import { FiEdit2 } from 'react-icons/fi';
import { getStatusLabel } from '../utils/statusUtils';
import type { InventoryItem, InventoryStatus } from '../types';
import {
  fetchSectorsByLocation,
  fetchLocales,
  type SectorDTO,
  type LocaleDTO,
} from '@/features/reference-data';

const STATUS_OPTIONS: InventoryStatus[] = [
  'STANDBY',
  'IN_USE',
  'MAINTENANCE',
  'DISCARDED',
  'LOST',
];

export interface InventoryQuickEditDrawerProps {
  item: InventoryItem | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: {
    status: string;
    sector_id: string | null;
    locale_id: string | null;
  }) => void | Promise<void>;
  isSaving?: boolean;
}

export const InventoryQuickEditDrawer: React.FC<InventoryQuickEditDrawerProps> = ({
  item,
  isOpen,
  onClose,
  onSave,
  isSaving = false,
}) => {
  const isMobile = useBreakpointValue({ base: true, md: false });

  const drawerBg = useColorModeValue('white', 'gray.800');
  const drawerBorder = useColorModeValue('gray.200', 'gray.600');
  const textColor = useColorModeValue('gray.800', 'white');
  const inputBg = useColorModeValue('white', 'gray.700');
  const inputBorder = useColorModeValue('gray.200', 'gray.600');

  const [status, setStatus] = useState('');
  const [sectorId, setSectorId] = useState('');
  const [localeId, setLocaleId] = useState('');
  const [sectors, setSectors] = useState<SectorDTO[]>([]);
  const [locales, setLocales] = useState<LocaleDTO[]>([]);

  useEffect(() => {
    if (!item) return;
    setStatus(item.status);
    setSectorId(item.sector_id ?? '');
    setLocaleId(item.locale_id ?? item.locale?.id ?? '');
  }, [item]);

  useEffect(() => {
    const locationId = item?.location_id ?? item?.location?.id;
    if (!isOpen || !locationId) {
      setSectors([]);
      setLocales([]);
      return;
    }

    const token = localStorage.getItem('@ti-assistant:token');
    if (!token) return;

    let cancelled = false;

    const load = async () => {
      try {
        const [sectorsData, localesData] = await Promise.all([
          fetchSectorsByLocation(token, locationId),
          fetchLocales(token),
        ]);
        if (!cancelled) {
          setSectors(sectorsData);
          setLocales(localesData.filter((locale) => locale.location_id === locationId));
        }
      } catch {
        if (!cancelled) {
          setSectors([]);
          setLocales([]);
        }
      }
    };

    load();
    return () => {
      cancelled = true;
    };
  }, [isOpen, item?.location_id, item?.location?.id]);

  const handleSave = () => {
    onSave({
      status,
      sector_id: sectorId || null,
      locale_id: localeId || null,
    });
  };

  const itemIdentifier = item?.item || item?.serial_number;

  return (
    <Drawer
      isOpen={isOpen}
      placement={isMobile ? 'bottom' : 'right'}
      onClose={onClose}
      size={isMobile ? undefined : 'sm'}
    >
      <DrawerOverlay />
      <DrawerContent
        bg={drawerBg}
        borderTopRadius={isMobile ? 'xl' : undefined}
        borderLeft={isMobile ? undefined : '1px solid'}
        borderColor={drawerBorder}
      >
        <DrawerCloseButton />
        <DrawerHeader
          color={textColor}
          borderBottom="1px solid"
          borderColor={drawerBorder}
        >
          <HStack spacing={2} flexWrap="wrap">
            <FiEdit2 size={20} />
            <Text>Editar item</Text>
            {itemIdentifier && (
              <Badge colorScheme="blue" fontSize="xs">
                {itemIdentifier}
              </Badge>
            )}
          </HStack>
        </DrawerHeader>
        <DrawerBody py={4}>
          <VStack spacing={4} pt={isMobile ? 0 : 4} align="stretch">
            <FormControl isRequired>
              <FormLabel color={textColor} fontSize="sm">
                Status
              </FormLabel>
              <Select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                bg={inputBg}
                borderColor={inputBorder}
                size="sm"
                isDisabled={!item}
              >
                {STATUS_OPTIONS.map((option) => (
                  <option key={option} value={option}>
                    {getStatusLabel(option)}
                  </option>
                ))}
              </Select>
            </FormControl>
            <FormControl>
              <FormLabel color={textColor} fontSize="sm">
                Setor
              </FormLabel>
              <Select
                placeholder="Nenhum setor"
                value={sectorId}
                onChange={(e) => setSectorId(e.target.value)}
                bg={inputBg}
                borderColor={inputBorder}
                size="sm"
                isDisabled={!item}
              >
                {sectors.map((sector) => (
                  <option key={sector.id} value={sector.id}>
                    {sector.name}
                  </option>
                ))}
              </Select>
            </FormControl>
            <FormControl>
              <FormLabel color={textColor} fontSize="sm">
                Ambiente
              </FormLabel>
              <Select
                placeholder="Nenhum ambiente"
                value={localeId}
                onChange={(e) => setLocaleId(e.target.value)}
                bg={inputBg}
                borderColor={inputBorder}
                size="sm"
                isDisabled={!item}
              >
                {locales.map((locale) => (
                  <option key={locale.id} value={locale.id}>
                    {locale.name}
                  </option>
                ))}
              </Select>
            </FormControl>
          </VStack>
        </DrawerBody>
        <DrawerFooter borderTop="1px solid" borderColor={drawerBorder}>
          <HStack spacing={3} w="full">
            <Button
              variant="outline"
              size="sm"
              flex={1}
              onClick={onClose}
              isDisabled={isSaving}
            >
              Cancelar
            </Button>
            <Button
              colorScheme="blue"
              size="sm"
              flex={1}
              onClick={handleSave}
              isLoading={isSaving}
              isDisabled={!item || !status}
            >
              Salvar
            </Button>
          </HStack>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
};
