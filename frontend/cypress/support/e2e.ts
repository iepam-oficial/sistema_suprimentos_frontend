import './commands';
import { shouldSkipE2E } from './constants';

if (shouldSkipE2E()) {
  // eslint-disable-next-line no-console
  console.warn('[E2E] E2E_SKIP=1 — specs Cypress serão ignoradas.');
  before(function skipAllE2E() {
    this.skip();
  });
}

Cypress.on('uncaught:exception', (err) => {
  // Chakra useBreakpointValue: SSR mobile vs viewport Cypress desktop.
  // Turbopack HMR no next dev pode falhar o chunk no visit inicial.
  if (
    /Hydration failed|error while hydrating|did not match|Unknown root exit status|Minified React error #(418|422|423)|Failed to load chunk|ChunkLoadError|Loading chunk|hmr-client/i.test(
      err.message,
    )
  ) {
    return false;
  }
  return true;
});

