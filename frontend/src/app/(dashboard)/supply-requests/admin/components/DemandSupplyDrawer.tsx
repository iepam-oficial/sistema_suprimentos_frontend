'use client';

import {
    Badge,
    Drawer,
    DrawerBody,
    DrawerCloseButton,
    DrawerContent,
    DrawerHeader,
    DrawerOverlay,
    HStack,
    Spinner,
    Text,
    VStack,
    useColorModeValue,
    useToast,
} from '@chakra-ui/react';
import { DemandSupplyApprovalAction } from '@ti-assistant/contracts';
import type { DemandSupplyDetailDTO } from '@ti-assistant/contracts';
import { Package } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import {
    confirmApprovalBatchManager,
    fetchDeliveryReportPayload,
    fetchDemandSupplyDetail,
    submitApproval,
} from '@/features/supply-requests/api/demandSupplyApi';
import { generateDeliveryReportPDF } from '../utils/generateDeliveryReportPDF';
import {
    formatAggregateStatusLabel,
    formatDemandSupplyCode,
} from '@/features/supply-requests/utils/formatDemandSupply';
import { ApprovalHistorySection } from './ApprovalHistorySection';
import { PendingItemsSection } from './PendingItemsSection';

interface DemandSupplyDrawerProps {
    isOpen: boolean;
    onClose: () => void;
    demandSupplyId: string | null;
    placement: 'right' | 'bottom';
}

function getStatusColorScheme(status: string): string {
    switch (status) {
        case 'APPROVED':
            return 'green';
        case 'REJECTED':
            return 'red';
        case 'DELIVERED':
            return 'purple';
        case 'PARTIAL':
            return 'orange';
        case 'MIXED':
            return 'gray';
        case 'PENDING':
        default:
            return 'yellow';
    }
}

function formatDeadline(value: string): string {
    return new Date(value).toLocaleDateString('pt-BR');
}

export function DemandSupplyDrawer({
    isOpen,
    onClose,
    demandSupplyId,
    placement,
}: DemandSupplyDrawerProps) {
    const toast = useToast();
    const drawerBg = useColorModeValue('white', 'gray.800');
    const drawerBorder = useColorModeValue('gray.200', 'gray.600');
    const textColor = useColorModeValue('gray.800', 'white');
    const mutedColor = useColorModeValue('gray.500', 'gray.400');

    const [detail, setDetail] = useState<DemandSupplyDetailDTO | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isConfirmingDelivery, setIsConfirmingDelivery] = useState(false);
    const [confirmingDeliveryId, setConfirmingDeliveryId] = useState<string | null>(null);
    const [isGeneratingReport, setIsGeneratingReport] = useState(false);
    const [generatingReportId, setGeneratingReportId] = useState<string | null>(null);

    const loadDetail = useCallback(async () => {
        if (!demandSupplyId) return;

        setLoading(true);
        setError(null);

        try {
            const token = localStorage.getItem('@ti-assistant:token');
            if (!token) {
                throw new Error('Token não encontrado');
            }

            const data = await fetchDemandSupplyDetail(token, demandSupplyId);
            setDetail(data);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Erro ao carregar pedido');
            setDetail(null);
        } finally {
            setLoading(false);
        }
    }, [demandSupplyId]);

    useEffect(() => {
        if (isOpen && demandSupplyId) {
            void loadDetail();
        } else if (!isOpen) {
            setDetail(null);
            setError(null);
        }
    }, [isOpen, demandSupplyId, loadDetail]);

    const handleApproval = async (
        supplyRequestIds: string[],
        action: 'APPROVED' | 'REJECTED',
    ) => {
        if (!demandSupplyId || supplyRequestIds.length === 0) return;

        setIsSubmitting(true);

        try {
            const token = localStorage.getItem('@ti-assistant:token');
            if (!token) {
                throw new Error('Token não encontrado');
            }

            const actionEnum =
                action === 'APPROVED'
                    ? DemandSupplyApprovalAction.APPROVED
                    : DemandSupplyApprovalAction.REJECTED;

            const result = await submitApproval(
                token,
                demandSupplyId,
                actionEnum,
                supplyRequestIds,
            );

            if (result.failed_items.length > 0) {
                toast({
                    title: 'Parcialmente processado',
                    description: `${result.failed_items.length} item(ns) falharam`,
                    status: 'warning',
                    duration: 4000,
                    isClosable: true,
                });
            } else {
                toast({
                    title: 'Sucesso',
                    description:
                        action === 'APPROVED'
                            ? 'Itens aprovados com sucesso'
                            : 'Itens reprovados com sucesso',
                    status: 'success',
                    duration: 3000,
                    isClosable: true,
                });
            }

            await loadDetail();
        } catch (err) {
            toast({
                title: 'Erro',
                description:
                    err instanceof Error ? err.message : 'Erro ao processar aprovação',
                status: 'error',
                duration: 3000,
                isClosable: true,
            });
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleGenerateReport = async (approvalId: string) => {
        setIsGeneratingReport(true);
        setGeneratingReportId(approvalId);

        try {
            const token = localStorage.getItem('@ti-assistant:token');
            if (!token) {
                throw new Error('Token não encontrado');
            }

            const payload = await fetchDeliveryReportPayload(token, approvalId);
            await generateDeliveryReportPDF(payload);

            toast({
                title: 'Sucesso',
                description: 'Relatório PDF gerado com sucesso',
                status: 'success',
                duration: 3000,
                isClosable: true,
            });
        } catch (err) {
            toast({
                title: 'Erro',
                description:
                    err instanceof Error ? err.message : 'Erro ao gerar relatório PDF',
                status: 'error',
                duration: 3000,
                isClosable: true,
            });
        } finally {
            setIsGeneratingReport(false);
            setGeneratingReportId(null);
        }
    };

    const handleConfirmDelivery = async (approvalId: string) => {
        setIsConfirmingDelivery(true);
        setConfirmingDeliveryId(approvalId);

        try {
            const token = localStorage.getItem('@ti-assistant:token');
            if (!token) {
                throw new Error('Token não encontrado');
            }

            await confirmApprovalBatchManager(token, approvalId, true);

            toast({
                title: 'Sucesso',
                description: 'Entrega confirmada com sucesso',
                status: 'success',
                duration: 3000,
                isClosable: true,
            });

            await loadDetail();
        } catch (err) {
            toast({
                title: 'Erro',
                description:
                    err instanceof Error ? err.message : 'Erro ao confirmar entrega',
                status: 'error',
                duration: 3000,
                isClosable: true,
            });
        } finally {
            setIsConfirmingDelivery(false);
            setConfirmingDeliveryId(null);
        }
    };

    const drawerSize = placement === 'bottom' ? 'full' : 'md';
    const codeLabel = detail
        ? detail.demand_supply_code || formatDemandSupplyCode(detail.code)
        : '';

    const subtitleParts = detail
        ? [detail.user.name, detail.sector?.name, formatDeadline(detail.delivery_deadline)].filter(
              Boolean,
          )
        : [];

    return (
        <Drawer isOpen={isOpen} placement={placement} onClose={onClose} size={drawerSize}>
            <DrawerOverlay />
            <DrawerContent
                bg={drawerBg}
                borderLeft={placement === 'right' ? '1px solid' : undefined}
                borderColor={drawerBorder}
            >
                <DrawerCloseButton />
                <DrawerHeader color={textColor} borderBottom="1px solid" borderColor={drawerBorder}>
                    <HStack spacing={2}>
                        <Package size={20} />
                        <Text>
                            {loading && !detail ? 'Carregando...' : `Pedido ${codeLabel}`}
                        </Text>
                    </HStack>
                    {detail && subtitleParts.length > 0 && (
                        <Text fontSize="sm" color={mutedColor} mt={1}>
                            {subtitleParts.join(' · ')}
                        </Text>
                    )}
                </DrawerHeader>
                <DrawerBody>
                    {loading && !detail ? (
                        <VStack py={8}>
                            <Spinner size="lg" />
                        </VStack>
                    ) : error ? (
                        <Text color="red.500" py={4}>{error}</Text>
                    ) : detail ? (
                        <VStack spacing={4} pt={2} align="stretch">
                            <HStack spacing={2} flexWrap="wrap">
                                <Text fontSize="sm" color={mutedColor}>
                                    Destino: {detail.destination || '-'}
                                </Text>
                                <Text fontSize="sm" color={mutedColor}>
                                    Prazo: {formatDeadline(detail.delivery_deadline)}
                                </Text>
                                <Badge colorScheme={getStatusColorScheme(detail.aggregate_status)}>
                                    {formatAggregateStatusLabel(detail.aggregate_status)}
                                </Badge>
                            </HStack>

                            {(detail.location?.name || detail.locale?.name) && (
                                <Text fontSize="sm" color={mutedColor}>
                                    {[detail.location?.name, detail.sector?.name, detail.locale?.name]
                                        .filter(Boolean)
                                        .join(' · ')}
                                </Text>
                            )}

                            <PendingItemsSection
                                items={detail.items}
                                onApproveSelected={(ids) => handleApproval(ids, 'APPROVED')}
                                onRejectSelected={(ids) => handleApproval(ids, 'REJECTED')}
                                isSubmitting={isSubmitting}
                            />

                            <ApprovalHistorySection
                                approvals={detail.approvals}
                                demandSupplyCode={detail.code}
                                onGenerateReport={handleGenerateReport}
                                isGeneratingReport={isGeneratingReport}
                                generatingReportId={generatingReportId}
                                onConfirmDelivery={handleConfirmDelivery}
                                isConfirmingDelivery={isConfirmingDelivery}
                                confirmingDeliveryId={confirmingDeliveryId}
                            />
                        </VStack>
                    ) : null}
                </DrawerBody>
            </DrawerContent>
        </Drawer>
    );
}
