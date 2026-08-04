import { runProcurementQuoteCorrection } from './flows/procurementQuoteCorrection';

describe('procurement quote correction', () => {
  it('solicita correção, reenvia pelo portal e encerra com Revisão OK', () => {
    runProcurementQuoteCorrection().then((result) => {
      expect(result.quoteId).to.be.a('string').and.not.be.empty;
      expect(result.correctedInviteId).to.be.a('string').and.not.be.empty;
      expect(result.oldToken).to.be.a('string').and.not.be.empty;
      expect(result.newToken).to.be.a('string').and.not.be.empty;
      expect(result.newToken).to.not.equal(result.oldToken);
    });
  });
});
