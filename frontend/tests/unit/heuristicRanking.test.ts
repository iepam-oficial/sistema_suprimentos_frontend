import {
  computeHeuristicRanking,
  scoreMaxBetter,
  scoreMinBetter,
} from '../../../../sistema_suprimentos_backend/backend/src/domains/procurement/lib/heuristicRanking';

describe('heuristicRanking', () => {
  describe('scoreMinBetter', () => {
    it('returns 5 for the minimum value', () => {
      expect(scoreMinBetter(100, 100, 200)).toBe(5);
    });

    it('returns 0 for the maximum value', () => {
      expect(scoreMinBetter(200, 100, 200)).toBe(0);
    });

    it('returns 5 when min equals max (zero denominator)', () => {
      expect(scoreMinBetter(150, 150, 150)).toBe(5);
    });
  });

  describe('scoreMaxBetter', () => {
    it('returns 5 for the maximum value', () => {
      expect(scoreMaxBetter(45, 20, 45)).toBe(5);
    });

    it('returns 0 for the minimum value', () => {
      expect(scoreMaxBetter(20, 20, 45)).toBe(0);
    });

    it('returns 5 when min equals max (zero denominator)', () => {
      expect(scoreMaxBetter(30, 30, 30)).toBe(5);
    });
  });

  describe('computeHeuristicRanking', () => {
    it('assigns score 5 to every criterion when all proposals are identical', () => {
      const proposals = [
        {
          invite_id: 'a',
          total_value: 1000,
          delivery_days: 10,
          payment_days: 30,
          freight: 50,
          taxes: 100,
        },
        {
          invite_id: 'b',
          total_value: 1000,
          delivery_days: 10,
          payment_days: 30,
          freight: 50,
          taxes: 100,
        },
      ];

      const rankings = computeHeuristicRanking(proposals);

      expect(rankings).toHaveLength(2);
      for (const ranking of rankings) {
        expect(ranking.score_price).toBe(5);
        expect(ranking.score_delivery).toBe(5);
        expect(ranking.score_payment).toBe(5);
        expect(ranking.score_freight).toBe(5);
        expect(ranking.score_taxes).toBe(5);
        expect(ranking.total_score).toBe(25);
        expect(ranking.rank).toBe(1);
        expect(ranking.is_tied).toBe(true);
        expect(ranking.is_recommended).toBe(false);
      }
    });

    it('marks tied proposals with the same rank and no automatic recommendation', () => {
      const proposals = [
        {
          invite_id: 'best',
          total_value: 800,
          delivery_days: 5,
          payment_days: 45,
          freight: 30,
          taxes: 80,
        },
        {
          invite_id: 'tied',
          total_value: 800,
          delivery_days: 5,
          payment_days: 45,
          freight: 30,
          taxes: 80,
        },
        {
          invite_id: 'worst',
          total_value: 1200,
          delivery_days: 15,
          payment_days: 20,
          freight: 70,
          taxes: 120,
        },
      ];

      const rankings = computeHeuristicRanking(proposals);
      const best = rankings.find((r) => r.invite_id === 'best');
      const tied = rankings.find((r) => r.invite_id === 'tied');
      const worst = rankings.find((r) => r.invite_id === 'worst');

      expect(best?.rank).toBe(1);
      expect(tied?.rank).toBe(1);
      expect(worst?.rank).toBe(2);
      expect(best?.is_tied).toBe(true);
      expect(tied?.is_tied).toBe(true);
      expect(best?.is_recommended).toBe(false);
      expect(tied?.is_recommended).toBe(false);
    });

    it('orders three distinct proposals and recommends the top scorer', () => {
      const proposals = [
        {
          invite_id: 'a',
          total_value: 1000,
          delivery_days: 10,
          payment_days: 30,
          freight: 50,
          taxes: 100,
        },
        {
          invite_id: 'b',
          total_value: 800,
          delivery_days: 15,
          payment_days: 20,
          freight: 30,
          taxes: 80,
        },
        {
          invite_id: 'c',
          total_value: 1200,
          delivery_days: 5,
          payment_days: 45,
          freight: 70,
          taxes: 120,
        },
      ];

      const rankings = computeHeuristicRanking(proposals);

      expect(rankings.map((r) => r.invite_id)).toEqual(['b', 'a', 'c']);
      expect(rankings[0].rank).toBe(1);
      expect(rankings[0].total_score).toBe(15);
      expect(rankings[0].is_recommended).toBe(true);
      expect(rankings[0].is_tied).toBe(false);
      expect(rankings[1].rank).toBe(2);
      expect(rankings[1].total_score).toBe(12);
      expect(rankings[2].rank).toBe(3);
      expect(rankings[2].total_score).toBe(10);
    });

    it('returns an empty array when there are no proposals', () => {
      expect(computeHeuristicRanking([])).toEqual([]);
    });
  });
});
