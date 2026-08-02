/**
 * Retrying XPath lookup — Selenium flows rely heavily on XPath;
 * Cypress has no built-in xpath, so we evaluate against the document.
 */
export function getByXPath(
  xpath: string,
  options?: { timeout?: number },
): Cypress.Chainable<JQuery<HTMLElement>> {
  const timeout = options?.timeout ?? 15000;
  return cy
    .get('html', { timeout, log: false })
    .should(($html) => {
      const doc = $html[0].ownerDocument!;
      const node = doc.evaluate(
        xpath,
        doc,
        null,
        XPathResult.FIRST_ORDERED_NODE_TYPE,
        null,
      ).singleNodeValue;
      expect(node, `xpath: ${xpath}`).to.not.equal(null);
    })
    .then(($html) => {
      const doc = $html[0].ownerDocument!;
      const node = doc.evaluate(
        xpath,
        doc,
        null,
        XPathResult.FIRST_ORDERED_NODE_TYPE,
        null,
      ).singleNodeValue as HTMLElement;
      return cy.wrap(Cypress.$(node));
    });
}

export function countByXPath(xpath: string): Cypress.Chainable<number> {
  return cy.get('html', { log: false }).then(($html) => {
    const doc = $html[0].ownerDocument!;
    const result = doc.evaluate(
      xpath,
      doc,
      null,
      XPathResult.ORDERED_NODE_SNAPSHOT_TYPE,
      null,
    );
    return result.snapshotLength;
  });
}
