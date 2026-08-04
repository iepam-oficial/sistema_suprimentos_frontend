import './commands';
import { shouldSkipE2E } from './constants';

if (shouldSkipE2E()) {
  // eslint-disable-next-line no-console
  console.warn('[E2E] E2E_SKIP=1 — specs Cypress serão ignoradas.');
  before(function skipAllE2E() {
    this.skip();
  });
}
