import { resolveInitialPurchaseRequestId } from '@/features/procurement/utils/quoteWizardEligibility';

describe('resolveInitialPurchaseRequestId', () => {
  const eligible = [{ id: 'sc-open-1' }, { id: 'sc-open-2' }];

  it('returns undefined id and not invalid when requestedId is absent', () => {
    expect(resolveInitialPurchaseRequestId(undefined, eligible)).toEqual({
      id: undefined,
      invalid: false,
    });
    expect(resolveInitialPurchaseRequestId('', eligible)).toEqual({
      id: undefined,
      invalid: false,
    });
  });

  it('returns the requested id when it is in the eligible list', () => {
    expect(resolveInitialPurchaseRequestId('sc-open-2', eligible)).toEqual({
      id: 'sc-open-2',
      invalid: false,
    });
  });

  it('returns invalid when requested id is not in the eligible list', () => {
    expect(resolveInitialPurchaseRequestId('sc-already-quoted', eligible)).toEqual({
      id: undefined,
      invalid: true,
    });
  });
});
