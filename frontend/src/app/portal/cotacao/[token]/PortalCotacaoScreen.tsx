'use client';

import { useCallback, useEffect, useState } from 'react';
import {
  Box,
  Button,
  Center,
  Flex,
  Heading,
  Spinner,
  Tab,
  TabList,
  TabPanel,
  TabPanels,
  Tabs,
  Text,
  useBreakpointValue,
  useToast,
  VStack,
} from '@chakra-ui/react';
import { FileText } from 'lucide-react';
import { useParams } from 'next/navigation';
import type {
  PortalQuoteInviteContextDTO,
  SubmitProcurementProposalItemInput,
} from '@ti-assistant/contracts';
import {
  acceptPortalQuoteInvite,
  declinePortalQuoteInvite,
  extractPortalQuotePdf,
  fetchPortalQuoteInvite,
  revisePortalQuoteProposal,
  submitPortalQuoteProposal,
} from '@/features/procurement/api/portalQuoteApi';
import { mulMoney } from '@/utils/money';
import {
  GlassPanel,
  GlassScrollArea,
  PortalActionBar,
  useGlassTokens,
} from '@/components/layout';
import {
  buildInitialItems,
  PortalQuoteAcceptPanel,
  PortalQuoteHeader,
  PortalQuoteItemsTable,
  PortalQuoteProposalForm,
  PortalQuoteProposalItemsTable,
  PortalQuoteSubmittedView,
  PortalQuoteSummary,
  sumProposalItemsTotal,
} from '../components';
import { PortalQuoteCorrectionBanner } from '../components/PortalQuoteCorrectionBanner';

export default function PortalCotacaoScreen() {
  const params = useParams();
  const token = params.token as string;
  const toast = useToast();
  const { mutedColor, headingColor } = useGlassTokens();
  const isMobile = useBreakpointValue({ base: true, md: false });

  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [extractLoading, setExtractLoading] = useState(false);
  const [notFound, setNotFound] = useState(false);
  const [context, setContext] = useState<PortalQuoteInviteContextDTO | null>(null);
  const [declineReason, setDeclineReason] = useState('');
  const [showDeclineForm, setShowDeclineForm] = useState(false);
  const [hasAiSuggestions, setHasAiSuggestions] = useState(false);
  const [selectedProposalPdf, setSelectedProposalPdf] = useState<File | null>(null);
  const [proposalTab, setProposalTab] = useState(0);

  const [totalValue, setTotalValue] = useState(0);
  const [deliveryDays, setDeliveryDays] = useState(0);
  const [freight, setFreight] = useState(0);
  const [taxes, setTaxes] = useState(0);
  const [selectedPaymentCodes, setSelectedPaymentCodes] = useState<string[]>([]);
  const [boletoGraceDays, setBoletoGraceDays] = useState(0);
  const [boletoInstallments, setBoletoInstallments] = useState(0);
  const [proposalItems, setProposalItems] = useState<SubmitProcurementProposalItemInput[]>([]);

  const loadInvite = useCallback(async () => {
    try {
      setLoading(true);
      setNotFound(false);
      const data = await fetchPortalQuoteInvite(token);
      setContext(data);
      if (data.status === 'CORRECTION_REQUESTED' && data.proposal) {
        const proposal = data.proposal;
        const items = proposal.items.map((item) => ({
          description: item.description,
          quantity: item.quantity,
          unit_price: item.unit_price,
          total_price: item.total_price,
        }));
        setDeliveryDays(proposal.delivery_days);
        setFreight(proposal.freight);
        setTaxes(proposal.taxes);
        setProposalItems(items);
        setTotalValue(sumProposalItemsTotal(items));
        setSelectedPaymentCodes(
          (proposal.payment_methods ?? []).map((m) => m.code),
        );
        setBoletoGraceDays(proposal.boleto_grace_days ?? 0);
        setBoletoInstallments(proposal.boleto_installments ?? 0);
      } else {
        setProposalItems(buildInitialItems(data));
      }
      setHasAiSuggestions(false);
    } catch (err) {
      if (err instanceof Error && err.message.includes('inválido')) {
        setNotFound(true);
      } else {
        toast({
          title: 'Erro ao carregar cotação',
          description: err instanceof Error ? err.message : 'Tente novamente.',
          status: 'error',
          duration: 5000,
          isClosable: true,
        });
      }
    } finally {
      setLoading(false);
    }
  }, [token, toast]);

  useEffect(() => {
    if (token) {
      loadInvite();
    }
  }, [token, loadInvite]);

  const handleAccept = async () => {
    try {
      setActionLoading(true);
      const data = await acceptPortalQuoteInvite(token);
      setContext(data);
      setProposalItems(buildInitialItems(data));
      setTotalValue(0);
      setProposalTab(1);
      toast({
        title: 'Participação confirmada',
        description: 'Agora você pode enviar sua proposta.',
        status: 'success',
        duration: 4000,
        isClosable: true,
      });
    } catch (err) {
      toast({
        title: 'Erro ao aceitar convite',
        description: err instanceof Error ? err.message : 'Tente novamente.',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setActionLoading(false);
    }
  };

  const handleDecline = async () => {
    const trimmedReason = declineReason.trim();
    if (!trimmedReason) {
      toast({
        title: 'Motivo obrigatório',
        description: 'Informe o motivo da recusa.',
        status: 'warning',
        duration: 4000,
        isClosable: true,
      });
      return;
    }

    try {
      setActionLoading(true);
      const data = await declinePortalQuoteInvite(token, { reason: trimmedReason });
      setContext(data);
      setShowDeclineForm(false);
      toast({
        title: 'Convite recusado',
        status: 'info',
        duration: 4000,
        isClosable: true,
      });
    } catch (err) {
      toast({
        title: 'Erro ao recusar convite',
        description: err instanceof Error ? err.message : 'Tente novamente.',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setActionLoading(false);
    }
  };

  const handlePdfSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;

    if (file.type !== 'application/pdf') {
      toast({
        title: 'Arquivo inválido',
        description: 'Selecione um arquivo PDF.',
        status: 'warning',
        duration: 4000,
        isClosable: true,
      });
      return;
    }

    setSelectedProposalPdf(file);

    try {
      setExtractLoading(true);
      const suggestions = await extractPortalQuotePdf(token, file);

      if (suggestions.delivery_days != null) setDeliveryDays(suggestions.delivery_days);
      if (suggestions.freight != null) setFreight(suggestions.freight);
      if (suggestions.taxes != null) setTaxes(suggestions.taxes);

      if (suggestions.items && suggestions.items.length > 0) {
        setProposalItems(suggestions.items);
        setTotalValue(sumProposalItemsTotal(suggestions.items));
      }

      const hasFields =
        suggestions.total_value != null ||
        suggestions.delivery_days != null ||
        suggestions.freight != null ||
        suggestions.taxes != null ||
        (suggestions.items != null && suggestions.items.length > 0);

      setHasAiSuggestions(hasFields);
      if (hasFields) setProposalTab(1);

      toast({
        title: hasFields ? 'Sugestões extraídas' : 'Nenhum campo identificado',
        description: hasFields
          ? 'Revise os campos sugeridos antes de enviar a proposta.'
          : 'Não foi possível identificar campos com confiança suficiente no PDF.',
        status: hasFields ? 'info' : 'warning',
        duration: 5000,
        isClosable: true,
      });
    } catch (err) {
      toast({
        title: 'Erro na extração do PDF',
        description: err instanceof Error ? err.message : 'Tente novamente.',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setExtractLoading(false);
    }
  };

  const updateItem = (
    index: number,
    field: keyof SubmitProcurementProposalItemInput,
    value: string | number,
  ) => {
    let nextTotal: number | null = null;

    setProposalItems((prev) => {
      const next = [...prev];
      const item = { ...next[index] };

      if (field === 'description') {
        item.description = String(value);
      } else if (field === 'quantity') {
        item.quantity = Number(value);
        item.total_price = mulMoney(item.unit_price, item.quantity);
      } else if (field === 'unit_price') {
        item.unit_price = Number(value);
        item.total_price = mulMoney(item.unit_price, item.quantity);
      } else if (field === 'total_price') {
        item.total_price = Number(value);
      }

      next[index] = item;

      if (field === 'quantity' || field === 'unit_price') {
        nextTotal = sumProposalItemsTotal(next);
      }

      return next;
    });

    if (nextTotal !== null) {
      setTotalValue(nextTotal);
    }
  };

  const buildProposalPayload = () => {
    const methods = context?.available_payment_methods ?? [];
    const needsBoleto = methods.some(
      (m) => selectedPaymentCodes.includes(m.code) && m.requires_boleto_terms,
    );
    return {
      total_value: totalValue,
      delivery_days: deliveryDays,
      freight,
      taxes,
      items: proposalItems,
      payment_method_codes: selectedPaymentCodes,
      boleto_grace_days: needsBoleto ? boletoGraceDays : null,
      boleto_installments: needsBoleto ? boletoInstallments : null,
    };
  };

  const validatePaymentBeforeSubmit = (): string | null => {
    if (selectedPaymentCodes.length === 0) {
      return 'Selecione ao menos uma forma de pagamento.';
    }
    const methods = context?.available_payment_methods ?? [];
    const needsBoleto = methods.some(
      (m) => selectedPaymentCodes.includes(m.code) && m.requires_boleto_terms,
    );
    if (needsBoleto) {
      if (
        !Number.isInteger(boletoGraceDays) ||
        boletoGraceDays < 1 ||
        boletoGraceDays > 365
      ) {
        return 'Informe a carência do boleto a prazo (1 a 365 dias).';
      }
      if (
        !Number.isInteger(boletoInstallments) ||
        boletoInstallments < 1 ||
        boletoInstallments > 12
      ) {
        return 'Informe o número de parcelas (1 a 12).';
      }
    }
    return null;
  };

  const handleSubmitProposal = async () => {
    const validationError = validatePaymentBeforeSubmit();
    if (validationError) {
      toast({
        title: 'Formas de pagamento',
        description: validationError,
        status: 'warning',
        duration: 4000,
        isClosable: true,
      });
      return;
    }

    try {
      setActionLoading(true);
      const proposal = await submitPortalQuoteProposal(
        token,
        buildProposalPayload(),
        selectedProposalPdf ?? undefined,
      );

      setContext((prev) =>
        prev ? { ...prev, status: 'RESPONDED', proposal } : prev,
      );
      setHasAiSuggestions(false);
      setSelectedProposalPdf(null);

      toast({
        title: 'Proposta enviada',
        description: 'Sua proposta foi registrada com sucesso.',
        status: 'success',
        duration: 4000,
        isClosable: true,
      });
    } catch (err) {
      toast({
        title: 'Erro ao enviar proposta',
        description: err instanceof Error ? err.message : 'Tente novamente.',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setActionLoading(false);
    }
  };

  const handleReviseProposal = async () => {
    const validationError = validatePaymentBeforeSubmit();
    if (validationError) {
      toast({
        title: 'Formas de pagamento',
        description: validationError,
        status: 'warning',
        duration: 4000,
        isClosable: true,
      });
      return;
    }

    try {
      setActionLoading(true);
      const proposal = await revisePortalQuoteProposal(
        token,
        buildProposalPayload(),
        selectedProposalPdf ?? undefined,
      );

      setContext((prev) =>
        prev ? { ...prev, status: 'RESPONDED', proposal, correction_request: null } : prev,
      );
      setHasAiSuggestions(false);
      setSelectedProposalPdf(null);

      toast({
        title: 'Proposta reenviada',
        description: 'Sua proposta corrigida foi registrada e aguarda revisão.',
        status: 'success',
        duration: 4000,
        isClosable: true,
      });
    } catch (err) {
      toast({
        title: 'Erro ao reenviar proposta',
        description: err instanceof Error ? err.message : 'Tente novamente.',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <Center flex="1" minH={0}>
        <Spinner size="xl" />
      </Center>
    );
  }

  if (notFound || !context) {
    return (
      <GlassPanel justifyContent="center">
        <Center flex="1" p={8}>
          <VStack spacing={4} textAlign="center">
            <FileText size={48} />
            <Heading size="lg" color={headingColor}>
              Convite inválido ou expirado
            </Heading>
            <Text color={mutedColor}>
              O link da cotação não é válido ou já expirou. Entre em contato com quem enviou o
              convite.
            </Text>
          </VStack>
        </Center>
      </GlassPanel>
    );
  }

  const canAcceptOrDecline = context.status === 'PENDING';
  const canSubmitProposal = context.status === 'ACCEPTED' && !context.proposal;
  const canReviseProposal = context.status === 'CORRECTION_REQUESTED' && !!context.proposal;
  const aiAvailable = context.ai_extraction_available;
  const isFinalState =
    context.status === 'DECLINED' ||
    context.status === 'EXPIRED' ||
    context.status === 'RESPONDED' ||
    (!!context.proposal && !canReviseProposal);

  const renderProposalTabs = () => (
    <Tabs
      variant="enclosed"
      colorScheme="blue"
      size="sm"
      index={proposalTab}
      onChange={setProposalTab}
      display="flex"
      flexDirection="column"
      flex="1"
      minH={0}
    >
      <TabList flexShrink={0}>
        <Tab>Itens solicitados</Tab>
        <Tab>Minha proposta</Tab>
      </TabList>
      <TabPanels flex="1" minH={0} overflow="hidden">
        <TabPanel p={2} h="full" overflow="auto">
          <PortalQuoteItemsTable items={context.items} />
        </TabPanel>
        <TabPanel p={2} h="full" overflow="auto">
          <PortalQuoteProposalForm
            aiAvailable={aiAvailable}
            hasAiSuggestions={hasAiSuggestions}
            extractLoading={extractLoading}
            totalValue={totalValue}
            deliveryDays={deliveryDays}
            freight={freight}
            taxes={taxes}
            availablePaymentMethods={context.available_payment_methods ?? []}
            selectedPaymentCodes={selectedPaymentCodes}
            boletoGraceDays={boletoGraceDays}
            boletoInstallments={boletoInstallments}
            onDeliveryDaysChange={setDeliveryDays}
            onFreightChange={setFreight}
            onTaxesChange={setTaxes}
            onSelectedPaymentCodesChange={setSelectedPaymentCodes}
            onBoletoGraceDaysChange={setBoletoGraceDays}
            onBoletoInstallmentsChange={setBoletoInstallments}
            onPdfSelect={handlePdfSelect}
          />
          <PortalQuoteProposalItemsTable items={proposalItems} onUpdateItem={updateItem} />
        </TabPanel>
      </TabPanels>
    </Tabs>
  );

  const renderMainContent = () => {
    if (context.status === 'EXPIRED') {
      return (
        <Center flex="1" p={4}>
          <Text color={mutedColor}>Este convite expirou e não pode mais ser respondido.</Text>
        </Center>
      );
    }

    if (context.status === 'DECLINED') {
      return (
        <Center flex="1" p={4}>
          <Text color={mutedColor}>Você recusou participar desta cotação.</Text>
        </Center>
      );
    }

    if (canReviseProposal) {
      return (
        <VStack align="stretch" spacing={3} flex="1" minH={0} h="full">
          {context.correction_request && (
            <PortalQuoteCorrectionBanner correctionRequest={context.correction_request} />
          )}
          {renderProposalTabs()}
        </VStack>
      );
    }

    if ((context.status === 'RESPONDED' || context.proposal) && context.proposal) {
      return <PortalQuoteSubmittedView proposal={context.proposal} />;
    }

    if (canSubmitProposal) {
      return renderProposalTabs();
    }

    if (canAcceptOrDecline) {
      return (
        <VStack align="stretch" spacing={4} h="full">
          <PortalQuoteAcceptPanel
            showDeclineForm={showDeclineForm}
            declineReason={declineReason}
            onDeclineReasonChange={setDeclineReason}
          />
          <Box flex="1" minH={0} overflow="auto">
            <PortalQuoteItemsTable items={context.items} />
          </Box>
        </VStack>
      );
    }

    return <PortalQuoteItemsTable items={context.items} />;
  };

  const renderActionBar = () => {
    if (canAcceptOrDecline) {
      return (
        <PortalActionBar>
          {showDeclineForm ? (
            <>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setShowDeclineForm(false)}
                isDisabled={actionLoading}
              >
                Cancelar
              </Button>
              <Button
                size="sm"
                colorScheme="red"
                onClick={handleDecline}
                isLoading={actionLoading}
                loadingText="Recusando..."
              >
                Confirmar recusa
              </Button>
            </>
          ) : (
            <>
              <Button
                size="sm"
                variant="outline"
                colorScheme="red"
                onClick={() => setShowDeclineForm(true)}
                isDisabled={actionLoading}
              >
                Recusar convite
              </Button>
              <Button
                size="sm"
                colorScheme="green"
                onClick={handleAccept}
                isLoading={actionLoading}
                loadingText="Aceitando..."
              >
                Aceitar convite
              </Button>
            </>
          )}
        </PortalActionBar>
      );
    }

    if (canSubmitProposal) {
      return (
        <PortalActionBar>
          <Button
            size="sm"
            colorScheme="blue"
            onClick={handleSubmitProposal}
            isLoading={actionLoading}
            loadingText="Enviando..."
          >
            Enviar proposta
          </Button>
        </PortalActionBar>
      );
    }

    if (canReviseProposal) {
      return (
        <PortalActionBar>
          <Button
            size="sm"
            colorScheme="orange"
            onClick={handleReviseProposal}
            isLoading={actionLoading}
            loadingText="Reenviando..."
          >
            Reenviar proposta corrigida
          </Button>
        </PortalActionBar>
      );
    }

    return null;
  };

  return (
    <GlassPanel>
      <PortalQuoteHeader context={context} />

      {isMobile ? (
        <>
          <PortalQuoteSummary context={context} />
          <GlassScrollArea withBorder={false}>{renderMainContent()}</GlassScrollArea>
        </>
      ) : (
        <Flex flex="1" minH={0} gap={2} overflow="hidden">
          <PortalQuoteSummary context={context} />
          <GlassScrollArea>{renderMainContent()}</GlassScrollArea>
        </Flex>
      )}

      {!isFinalState && renderActionBar()}
    </GlassPanel>
  );
}
