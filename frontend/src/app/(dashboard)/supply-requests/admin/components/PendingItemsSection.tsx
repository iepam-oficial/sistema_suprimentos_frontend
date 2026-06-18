'use client';

import {
    Box,
    Button,
    Checkbox,
    HStack,
    Text,
    VStack,
    useColorMode,
    useColorModeValue,
} from '@chakra-ui/react';
import type { SupplyRequestDTO } from '@ti-assistant/contracts';
import { CheckCircle, XCircle } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';

interface PendingItemsSectionProps {
    items: SupplyRequestDTO[];
    onApproveSelected: (supplyRequestIds: string[]) => void;
    onRejectSelected: (supplyRequestIds: string[]) => void;
    isSubmitting?: boolean;
}

function getItemName(item: SupplyRequestDTO): string {
    return item.is_custom ? item.item_name ?? '-' : item.supply?.name ?? '-';
}

function getItemUnit(item: SupplyRequestDTO): string {
    return item.supply?.unit?.symbol ?? item.unit?.symbol ?? item.supply?.unit?.name ?? '';
}

export function PendingItemsSection({
    items,
    onApproveSelected,
    onRejectSelected,
    isSubmitting = false,
}: PendingItemsSectionProps) {
    const { colorMode } = useColorMode();
    const textColor = useColorModeValue('gray.800', 'white');
    const mutedColor = useColorModeValue('gray.500', 'gray.400');
    const sectionBorder = useColorModeValue('gray.200', 'gray.600');
    const sectionBg = useColorModeValue('white', 'rgba(45, 55, 72, 0.5)');

    const pendingItems = useMemo(
        () => items.filter((item) => item.status === 'PENDING'),
        [items],
    );

    const [selectedIds, setSelectedIds] = useState<string[]>(() =>
        pendingItems.map((item) => item.id),
    );

    useEffect(() => {
        setSelectedIds(pendingItems.map((item) => item.id));
    }, [pendingItems]);

    const hasSelection = selectedIds.length > 0;
    const actionsDisabled = !hasSelection || isSubmitting;

    const toggleItem = (id: string, checked: boolean) => {
        setSelectedIds((current) =>
            checked ? [...current, id] : current.filter((itemId) => itemId !== id),
        );
    };

    if (pendingItems.length === 0) {
        return null;
    }

    return (
        <Box
            borderWidth="1px"
            borderColor={sectionBorder}
            borderRadius="md"
            bg={sectionBg}
            p={3}
        >
            <Text
                fontSize="xs"
                fontWeight="semibold"
                textTransform="uppercase"
                letterSpacing="wider"
                color={mutedColor}
                mb={3}
            >
                Itens pendentes ({pendingItems.length})
            </Text>

            <VStack spacing={2} align="stretch" mb={4}>
                {pendingItems.map((item) => (
                    <HStack
                        key={item.id}
                        spacing={3}
                        p={2}
                        borderRadius="md"
                        borderWidth="1px"
                        borderColor={colorMode === 'dark' ? 'rgba(255,255,255,0.08)' : 'gray.100'}
                    >
                        <Checkbox
                            isChecked={selectedIds.includes(item.id)}
                            onChange={(event) => toggleItem(item.id, event.target.checked)}
                            colorScheme="blue"
                            isDisabled={isSubmitting}
                        />
                        <Text flex={1} fontSize="sm" color={textColor} fontWeight="medium">
                            {getItemName(item)}
                        </Text>
                        <Text fontSize="sm" color={mutedColor} whiteSpace="nowrap">
                            {item.quantity} {getItemUnit(item)}
                        </Text>
                    </HStack>
                ))}
            </VStack>

            <HStack spacing={2} flexWrap="wrap">
                <Button
                    size="sm"
                    colorScheme="green"
                    leftIcon={<CheckCircle size={14} />}
                    onClick={() => onApproveSelected(selectedIds)}
                    isDisabled={actionsDisabled}
                    isLoading={isSubmitting}
                >
                    Aprovar selecionados
                </Button>
                <Button
                    size="sm"
                    colorScheme="red"
                    variant="outline"
                    leftIcon={<XCircle size={14} />}
                    onClick={() => onRejectSelected(selectedIds)}
                    isDisabled={actionsDisabled}
                    isLoading={isSubmitting}
                >
                    Reprovar selecionados
                </Button>
            </HStack>
        </Box>
    );
}
