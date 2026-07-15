import { computeAnchoredRect } from '@/lib/anchoredDropdownPosition';

describe('computeAnchoredRect', () => {
  it('positions dropdown below anchor with default gap', () => {
    const rect = {
      top: 100,
      left: 50,
      width: 300,
      height: 40,
      bottom: 140,
    };

    expect(computeAnchoredRect(rect)).toEqual({
      top: 144,
      left: 50,
      width: 300,
    });
  });

  it('uses custom gap', () => {
    const rect = {
      top: 0,
      left: 10,
      width: 200,
      height: 32,
      bottom: 32,
    };

    expect(computeAnchoredRect(rect, 8)).toEqual({
      top: 40,
      left: 10,
      width: 200,
    });
  });

  it('matches anchor width', () => {
    const rect = {
      top: 20,
      left: 0,
      width: 480,
      height: 24,
      bottom: 44,
    };

    expect(computeAnchoredRect(rect).width).toBe(480);
  });
});
