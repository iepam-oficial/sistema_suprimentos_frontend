'use client';

import {
    Badge,
    Box,
    Button,
    HStack,
    Text,
    VStack,
    useColorModeValue,
} from '@chakra-ui/react';
import type { DemandSupplyApprovalDTO } from '@ti-assistant/contracts';
import { CheckCircle, FileText } from 'lucide-react';
import { useMemo } from 'react';
import { formatApprovalBatchItemLines } from '@/features/supply-requests/utils/formatApprovalBatchItems';
import { formatApprovalReportId } from '@/features/supply-requests/utils/formatDemandSupply';

interface ApprovalHistorySectionProps {
    approvals: DemandSupplyApprovalDTO[];
    demandSupplyCode: number;
    onGenerateReport?: (approvalId: string) => void;
    onConfirmDelivery?: (approvalId: string) => void;
    isGeneratingReport?: boolean;
    isConfirmingDelivery?: boolean;
    generatingReportId?: string | null;
    confirmingDeliveryId?: string | null;
}

function formatApprovalDate(value: string): string {
    return new Date(value).toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
    });
}

function canConfirmManagerDelivery(approval: DemandSupplyApprovalDTO): boolean {
    if (approval.action !== 'APPROVED') return false;
    const items = approval.items ?? [];
    if (items.length === 0) return false;
    return (
        items.every((item) => item.status === 'APPROVED') &&
        items.some((item) => !item.manager_delivery_confirmation)
    );
}

function ApprovalActionBadge({ action }: { action: DemandSupplyApprovalDTO['action'] }) {
    const isApproved = action === 'APPROVED';
    return (
        <Badge colorScheme={isApproved ? 'green' : 'red'} fontSize="xs">
            {isApproved ? 'Aprovado' : 'Reprovado'}
        </Badge>
    );
}

export function ApprovalHistorySection({
    approvals,
    demandSupplyCode,
    onGenerateReport,
    onConfirmDelivery,
    isGeneratingReport = false,
    isConfirmingDelivery = false,
    generatingReportId = null,
    confirmingDeliveryId = null,
}: ApprovalHistorySectionProps) {
    const textColor = useColorModeValue('gray.800', 'white');
    const mutedColor = useColorModeValue('gray.500', 'gray.400');
    const sectionBorder = useColorModeValue('gray.200', 'gray.600');
    const entryBorder = useColorModeValue('gray.100', 'rgba(255,255,255,0.08)');

    const sortedApprovals = useMemo(
        () =>
            [...approvals].sort(
                (a, b) =>
                    new Date(a.approved_at).getTime() - new Date(b.approved_at).getTime(),
            ),
        [approvals],
    );

    if (sortedApprovals.length === 0) {
        return null;
    }

    return (
        <Box borderWidth="1px" borderColor={sectionBorder} borderRadius="md" p={3}>
            <Text
                fontSize="xs"
                fontWeight="semibold"
                textTransform="uppercase"
                letterSpacing="wider"
                color={mutedColor}
                mb={3}
            >
                Histórico
            </Text>

            <VStack spacing={3} align="stretch">
                {sortedApprovals.map((approval) => {
                    const reportLabel =
                        approval.report_id ||
                        formatApprovalReportId(demandSupplyCode, approval.sequence);
                    const showPdfButton = approval.action === 'APPROVED';
                    const showConfirmDelivery = canConfirmManagerDelivery(approval);
                    const showActions = showPdfButton || showConfirmDelivery;
                    const items = approval.items ?? [];
                    const count = approval.item_count || items.length;
                    const itemLabel = count === 1 ? 'item' : 'itens';
                    const itemLines = formatApprovalBatchItemLines(items);

                    return (
                        <Box
                            key={approval.id}
                            p={3}
                            borderWidth="1px"
                            borderColor={entryBorder}
                            borderRadius="md"
                        >
                            <HStack
                                spacing={2}
                                mb={2}
                                flexWrap="wrap"
                                justify="space-between"
                                align="start"
                            >
                                <HStack spacing={2} flexWrap="wrap">
                                    <Text fontSize="sm" fontWeight="semibold" color={textColor}>
                                        Lote {reportLabel}
                                    </Text>
                                    <ApprovalActionBadge action={approval.action} />
                                </HStack>
                                <Text fontSize="xs" color={mutedColor}>
                                    {formatApprovalDate(approval.approved_at)}
                                </Text>
                            </HStack>

                            <Text fontSize="sm" color={textColor} mb={1}>
                                {approval.approved_by.name}
                            </Text>
                            <Box mb={showActions ? 3 : 0}>
                                <Text fontSize="sm" color={mutedColor}>
                                    {count} {itemLabel}
                                </Text>
                                {itemLines.length > 0 && (
                                    <VStack align="stretch" spacing={0.5} mt={1}>
                                        {itemLines.map((line, index) => (
                                            <Text
                                                key={items[index]?.id ?? `${approval.id}-item-${index}`}
                                                fontSize="sm"
                                                color={mutedColor}
                                            >
                                                {line}
                                            </Text>
                                        ))}
                                    </VStack>
                                )}
                            </Box>

                            {showActions && (
                                <HStack spacing={2} flexWrap="wrap">
                                    {showPdfButton && (
                                        <Button
                                            size="xs"
                                            colorScheme="blue"
                                            variant="outline"
                                            leftIcon={<FileText size={12} />}
                                            onClick={() => onGenerateReport?.(approval.id)}
                                            isDisabled={!onGenerateReport || isGeneratingReport}
                                            isLoading={
                                                isGeneratingReport &&
                                                generatingReportId === approval.id
                                            }
                                        >
                                            Gerar relatório PDF
                                        </Button>
                                    )}
                                    {showConfirmDelivery && (
                                        <Button
                                            size="xs"
                                            colorScheme="blue"
                                            leftIcon={<CheckCircle size={12} />}
                                            onClick={() => onConfirmDelivery?.(approval.id)}
                                            isDisabled={!onConfirmDelivery || isConfirmingDelivery}
                                            isLoading={
                                                isConfirmingDelivery &&
                                                confirmingDeliveryId === approval.id
                                            }
                                        >
                                            Confirmar entrega
                                        </Button>
                                    )}
                                </HStack>
                            )}
                        </Box>
                    );
                })}
            </VStack>
        </Box>
    );
}
