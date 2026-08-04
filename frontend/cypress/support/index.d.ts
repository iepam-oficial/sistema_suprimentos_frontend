/// <reference types="cypress" />

import type { E2eRole } from './constants';

declare global {
  namespace Cypress {
    interface Chainable {
      loginAs(role: E2eRole): Chainable<void>;
      logout(): Chainable<void>;
      clickByText(text: string): Chainable<void>;
      clickByTestId(testId: string): Chainable<void>;
      findByTestId(testId: string): Chainable<JQuery<HTMLElement>>;
      waitForUrlContains(fragment: string, timeoutMs?: number): Chainable<void>;
      waitForText(text: string, timeoutMs?: number): Chainable<void>;
    }
  }
}

export {};
