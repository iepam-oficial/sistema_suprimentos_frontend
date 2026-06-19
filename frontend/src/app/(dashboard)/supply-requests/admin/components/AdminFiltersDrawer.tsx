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
    HStack,
    Text,
    VStack,
    useColorModeValue,
} from '@chakra-ui/react';
import { Filter } from 'lucide-react';

interface AdminFiltersDrawerProps {
    isOpen: boolean;
    onClose: () => void;
    placement: 'right' | 'bottom';
    filtersActive: boolean;
    onClearFilters: () => void;
    children: React.ReactNode;
}

export function AdminFiltersDrawer({
    isOpen,
    onClose,
    placement,
    filtersActive,
    onClearFilters,
    children,
}: AdminFiltersDrawerProps) {
    const drawerBg = useColorModeValue('white', 'gray.800');
    const drawerBorder = useColorModeValue('gray.200', 'gray.600');
    const textColor = useColorModeValue('gray.800', 'white');

    return (
        <Drawer isOpen={isOpen} placement={placement} onClose={onClose} size="sm">
            <DrawerOverlay />
            <DrawerContent bg={drawerBg} borderLeft={placement === 'right' ? '1px solid' : undefined} borderColor={drawerBorder}>
                <DrawerCloseButton />
                <DrawerHeader color={textColor} borderBottom="1px solid" borderColor={drawerBorder}>
                    <HStack spacing={2}>
                        <Filter size={20} />
                        <Text>Filtros</Text>
                    </HStack>
                </DrawerHeader>
                <DrawerBody>
                    <VStack spacing={4} pt={4} align="stretch">
                        {children}
                    </VStack>
                </DrawerBody>
                <DrawerFooter borderTop="1px solid" borderColor={drawerBorder}>
                    <Button
                        variant="outline"
                        size="sm"
                        w="full"
                        onClick={onClearFilters}
                        isDisabled={!filtersActive}
                    >
                        Limpar filtros
                    </Button>
                </DrawerFooter>
            </DrawerContent>
        </Drawer>
    );
}
