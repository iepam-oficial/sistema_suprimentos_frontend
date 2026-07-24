'use client';

import {
  Button,
  Drawer,
  DrawerBody,
  DrawerCloseButton,
  DrawerContent,
  DrawerFooter,
  DrawerHeader,
  DrawerOverlay,
  FormControl,
  FormLabel,
  Input,
  Select,
  useBreakpointValue,
  useColorModeValue,
} from '@chakra-ui/react';
import type { PurchaseRequestDrawerFilters } from '../../hooks/usePurchaseRequestFilters';
import {
  purchaseRequestPriorityLabel,
  purchaseRequestStatusLabel,
} from '../../types';

interface PurchaseRequestFiltersDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  filters: PurchaseRequestDrawerFilters;
  onChange: (filters: PurchaseRequestDrawerFilters) => void;
  onClear: () => void;
}

export function PurchaseRequestFiltersDrawer({
  isOpen,
  onClose,
  filters,
  onChange,
  onClear,
}: PurchaseRequestFiltersDrawerProps) {
  const placement = useBreakpointValue<'right' | 'bottom'>({ base: 'bottom', md: 'right' });
  const drawerBg = useColorModeValue('white', 'gray.800');
  const drawerBorder = useColorModeValue('gray.200', 'gray.600');

  const update = (patch: Partial<PurchaseRequestDrawerFilters>) => {
    onChange({ ...filters, ...patch });
  };

  return (
    <Drawer isOpen={isOpen} placement={placement ?? 'right'} onClose={onClose} size="sm">
      <DrawerOverlay />
      <DrawerContent bg={drawerBg} borderColor={drawerBorder}>
        <DrawerCloseButton />
        <DrawerHeader>Filtros</DrawerHeader>
        <DrawerBody>
          <FormControl mb={4}>
            <FormLabel>Status</FormLabel>
            <Select
              placeholder="Todos"
              value={filters.status}
              onChange={(e) => update({ status: e.target.value })}
            >
              {(['DRAFT', 'PENDING_APPROVAL', 'APPROVED', 'REJECTED', 'CANCELLED'] as const).map(
                (status) => (
                  <option key={status} value={status}>
                    {purchaseRequestStatusLabel(status)}
                  </option>
                ),
              )}
            </Select>
          </FormControl>

          <FormControl mb={4}>
            <FormLabel>Prioridade</FormLabel>
            <Select
              placeholder="Todas"
              value={filters.priority}
              onChange={(e) => update({ priority: e.target.value })}
            >
              {(['LOW', 'MEDIUM', 'HIGH', 'URGENT'] as const).map((priority) => (
                <option key={priority} value={priority}>
                  {purchaseRequestPriorityLabel(priority)}
                </option>
              ))}
            </Select>
          </FormControl>

          <FormControl mb={4}>
            <FormLabel>Criada a partir de</FormLabel>
            <Input
              type="date"
              value={filters.createdFrom}
              onChange={(e) => update({ createdFrom: e.target.value })}
            />
          </FormControl>

          <FormControl>
            <FormLabel>Criada até</FormLabel>
            <Input
              type="date"
              value={filters.createdTo}
              onChange={(e) => update({ createdTo: e.target.value })}
            />
          </FormControl>
        </DrawerBody>
        <DrawerFooter gap={2}>
          <Button variant="outline" onClick={onClear}>
            Limpar filtros
          </Button>
          <Button colorScheme="blue" onClick={onClose}>
            Aplicar
          </Button>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
}
