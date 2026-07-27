import {
  generateToken,
  hashToken,
  isExpired,
  verifyToken,
} from '../../../../sistema_suprimentos_backend/backend/src/domains/procurement/lib/portalToken';

describe('portalToken', () => {
  describe('generateToken', () => {
    it('returns a cryptographically random base64url token', () => {
      const tokenA = generateToken();
      const tokenB = generateToken();

      expect(tokenA).toBeTruthy();
      expect(tokenB).toBeTruthy();
      expect(tokenA).not.toBe(tokenB);
      expect(tokenA).toMatch(/^[A-Za-z0-9_-]+$/);
    });
  });

  describe('hashToken', () => {
    it('produces a stable SHA-256 hex digest for the same raw token', () => {
      const raw = 'sample-portal-token';

      expect(hashToken(raw)).toBe(hashToken(raw));
      expect(hashToken(raw)).toMatch(/^[a-f0-9]{64}$/);
    });
  });

  describe('verifyToken', () => {
    it('returns true when raw token matches stored hash', () => {
      const raw = generateToken();
      const hash = hashToken(raw);

      expect(verifyToken(raw, hash)).toBe(true);
      expect(verifyToken('wrong-token', hash)).toBe(false);
    });
  });

  describe('isExpired', () => {
    it('returns true for past dates and false for future dates', () => {
      const past = new Date(Date.now() - 60_000);
      const future = new Date(Date.now() + 60_000);

      expect(isExpired(past)).toBe(true);
      expect(isExpired(future)).toBe(false);
      expect(isExpired(past.toISOString())).toBe(true);
    });
  });
});
