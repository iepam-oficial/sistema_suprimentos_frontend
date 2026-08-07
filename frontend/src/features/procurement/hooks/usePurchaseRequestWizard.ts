'use client';

import { useCallback, useEffect, useState } from 'react';
import { useToast } from '@chakra-ui/react';
import { useRouter } from 'next/navigation';
import type { PurchaseRequestDTO } from '@ti-assistant/contracts';
import {
  createPurchaseRequest,
  fetchPurchaseRequestById,
  submitPurchaseRequest,
  updatePurchaseRequest,
} from '../api/purchaseRequestApi';
import {
  buildPurchaseRequestPayload,
  createEmptyWizardForm,
  wizardFormFromDto,
  type PurchaseRequestWizardForm,
} from '../components/purchase-request/purchaseRequestWizardTypes';

const STEPS = ['Dados gerais', 'Itens', 'Revisão'];

export type PurchaseRequestWizardMode = 'create' | 'edit';

interface UsePurchaseRequestWizardOptions {
  mode: PurchaseRequestWizardMode;
  id?: string;
}

function getToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('@ti-assistant:token');
}

function validateStep(step: number, form: PurchaseRequestWizardForm): boolean {
  if (step === 0) {
    return Boolean(form.justification.trim());
  }
  if (step === 1) {
    return form.items.some(
      (item) => item.description.trim() && item.quantity >= 1 && item.unit.trim(),
    );
  }
  return buildPurchaseRequestPayload(form) !== null;
}

export function usePurchaseRequestWizard({ mode, id }: UsePurchaseRequestWizardOptions) {
  const router = useRouter();
  const toast = useToast();

  const [step, setStep] = useState(0);
  const [form, setForm] = useState<PurchaseRequestWizardForm>(createEmptyWizardForm);
  const [loading, setLoading] = useState(mode === 'edit');
  const [saving, setSaving] = useState(false);
  const [requestId, setRequestId] = useState<string | undefined>(id);
  const [displayCode, setDisplayCode] = useState<string | null>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);

  const loadDraft = useCallback(async () => {
    if (!id) return;

    const token = getToken();
    if (!token) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const dto = await fetchPurchaseRequestById(token, id);

      if (dto.status !== 'DRAFT') {
        router.replace(`/procurement/solicitacoes/${id}`);
        return;
      }

      setForm(wizardFormFromDto(dto));
      setRequestId(dto.id);
      setDisplayCode(dto.display_code);
    } catch (err) {
      toast({
        title: 'Erro ao carregar rascunho',
        description: err instanceof Error ? err.message : 'Tente novamente.',
        status: 'error',
        duration: 4000,
        isClosable: true,
      });
    } finally {
      setLoading(false);
    }
  }, [id, router, toast]);

  useEffect(() => {
    if (mode === 'edit' && id) {
      loadDraft();
    }
  }, [mode, id, loadDraft]);

  const showStepError = (currentStep: number) => {
    if (currentStep === 0) {
      if (!form.justification.trim()) {
        toast({ title: 'Justificativa obrigatória', status: 'warning', duration: 3000, isClosable: true });
        return;
      }
    }
    if (currentStep === 1) {
      toast({
        title: 'Itens incompletos',
        description: 'Adicione ao menos um item com descrição, quantidade e unidade.',
        status: 'warning',
        duration: 3000,
        isClosable: true,
      });
    }
  };

  const canAdvanceStep = () => validateStep(step, form);

  const goNext = () => {
    if (!canAdvanceStep()) {
      showStepError(step);
      return;
    }
    setStep((s) => Math.min(s + 1, STEPS.length - 1));
  };

  const goBack = () => setStep((s) => Math.max(s - 1, 0));

  const saveDraft = async (): Promise<PurchaseRequestDTO | null> => {
    const payload = buildPurchaseRequestPayload(form);
    if (!payload) {
      toast({
        title: 'Dados incompletos',
        description: 'Preencha justificativa e ao menos um item válido.',
        status: 'warning',
        duration: 3000,
        isClosable: true,
      });
      return null;
    }

    const token = getToken();
    if (!token) {
      toast({ title: 'Sessão expirada', description: 'Faça login novamente.', status: 'error', duration: 3000, isClosable: true });
      return null;
    }

    setSaving(true);
    try {
      let saved: PurchaseRequestDTO;

      if (requestId) {
        saved = await updatePurchaseRequest(token, requestId, payload);
      } else {
        saved = await createPurchaseRequest(token, payload);
        setRequestId(saved.id);
        setDisplayCode(saved.display_code);
      }

      toast({
        title: 'Rascunho salvo',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });

      if (mode === 'create' && !id) {
        router.replace(`/procurement/solicitacoes/${saved.id}/editar`);
      }

      return saved;
    } catch (err) {
      toast({
        title: 'Erro ao salvar rascunho',
        description: err instanceof Error ? err.message : 'Tente novamente.',
        status: 'error',
        duration: 4000,
        isClosable: true,
      });
      return null;
    } finally {
      setSaving(false);
    }
  };

  const submit = async () => {
    const payload = buildPurchaseRequestPayload(form);
    if (!payload) {
      toast({
        title: 'Dados incompletos',
        description: 'Revise os campos antes de submeter.',
        status: 'warning',
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    const token = getToken();
    if (!token) {
      toast({ title: 'Sessão expirada', status: 'error', duration: 3000, isClosable: true });
      return;
    }

    setSaving(true);
    try {
      let currentId = requestId;

      if (currentId) {
        await updatePurchaseRequest(token, currentId, payload);
      } else {
        const created = await createPurchaseRequest(token, payload);
        currentId = created.id;
        setRequestId(created.id);
      }

      await submitPurchaseRequest(token, currentId);

      toast({
        title: 'Solicitação enviada',
        description: 'A solicitação foi submetida para aprovação.',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });

      setConfirmOpen(false);
      router.push(`/procurement/solicitacoes/${currentId}`);
    } catch (err) {
      toast({
        title: 'Erro ao submeter solicitação',
        description: err instanceof Error ? err.message : 'Tente novamente.',
        status: 'error',
        duration: 4000,
        isClosable: true,
      });
    } finally {
      setSaving(false);
    }
  };

  const cancel = () => {
    if (requestId) {
      router.push(`/procurement/solicitacoes/${requestId}`);
    } else {
      router.push('/procurement/solicitacoes');
    }
  };

  return {
    step,
    steps: STEPS,
    form,
    setForm,
    loading,
    saving,
    requestId,
    displayCode,
    confirmOpen,
    setConfirmOpen,
    canAdvanceStep,
    goNext,
    goBack,
    saveDraft,
    submit,
    cancel,
    isLastStep: step === STEPS.length - 1,
  };
}
