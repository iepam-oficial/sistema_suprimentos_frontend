import {
  ProposalReviewAction,
  ProposalReviewStatus,
  QuoteInviteStatus,
} from '@ti-assistant/contracts';
import type { ProposalReviewStatus as ProposalReviewStatusType } from '@ti-assistant/contracts';

export interface ReviewBadgeDescriptor {
  label: string;
  colorScheme: string;
}

/**
 * Descreve o badge de revisão exibido por convite na tabela do gerente.
 *
 * Regras:
 * - `null`/sem proposta → `—`
 * - convite `CORRECTION_REQUESTED` → `Correção solicitada`
 * - `proposal_review_status === REVIEW_OK` → `Revisão OK`
 * - `proposal_review_status === PENDING_REVIEW` → `Aguardando revisão`
 */
export function getReviewBadge(
  reviewStatus: ProposalReviewStatusType | null | undefined,
  inviteStatus?: QuoteInviteStatus,
  hasProposal = true
): ReviewBadgeDescriptor {
  if (!hasProposal || (reviewStatus == null && inviteStatus !== QuoteInviteStatus.CORRECTION_REQUESTED)) {
    return { label: '—', colorScheme: 'gray' };
  }

  if (inviteStatus === QuoteInviteStatus.CORRECTION_REQUESTED) {
    return { label: 'Correção solicitada', colorScheme: 'orange' };
  }

  if (reviewStatus === ProposalReviewStatus.REVIEW_OK) {
    return { label: 'Revisão OK', colorScheme: 'green' };
  }

  if (reviewStatus === ProposalReviewStatus.PENDING_REVIEW) {
    return { label: 'Aguardando revisão', colorScheme: 'yellow' };
  }

  return { label: '—', colorScheme: 'gray' };
}

/** Rótulo textual do badge de revisão (sem cor). */
export function getReviewBadgeLabel(
  reviewStatus: ProposalReviewStatusType | null | undefined,
  inviteStatus?: QuoteInviteStatus,
  hasProposal = true
): string {
  return getReviewBadge(reviewStatus, inviteStatus, hasProposal).label;
}

/** Rótulo da ação registrada no histórico de revisões. */
export function getReviewActionLabel(action: ProposalReviewAction): string {
  switch (action) {
    case ProposalReviewAction.REVIEW_OK:
      return 'Revisão OK';
    case ProposalReviewAction.CORRECTION_REQUESTED:
      return 'Correção solicitada';
    default:
      return action;
  }
}

/** Cor (colorScheme Chakra) associada à ação do histórico de revisões. */
export function getReviewActionColorScheme(action: ProposalReviewAction): string {
  switch (action) {
    case ProposalReviewAction.REVIEW_OK:
      return 'green';
    case ProposalReviewAction.CORRECTION_REQUESTED:
      return 'orange';
    default:
      return 'gray';
  }
}
