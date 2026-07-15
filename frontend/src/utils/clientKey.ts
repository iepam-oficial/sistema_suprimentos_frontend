/** Stable client-side key; works outside secure contexts (non-localhost HTTP). */
export function createClientKey(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    try {
      return crypto.randomUUID();
    } catch {
      // fall through — some browsers expose the API but throw outside secure contexts
    }
  }
  return `k-${Date.now().toString(36)}-${Math.random().toString(16).slice(2)}`;
}
