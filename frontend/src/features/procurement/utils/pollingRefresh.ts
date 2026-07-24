export const PROCUREMENT_POLL_INTERVAL_MS = 5000;

export type StartPollingRefreshOptions = {
  enabled: boolean;
  intervalMs: number;
  onTick: () => void;
};

/**
 * Starts an interval that calls onTick while enabled.
 * Returns a dispose function (no-op when disabled).
 * Does not observe document visibility — callers keep polling in background tabs.
 */
export function startPollingRefresh({
  enabled,
  intervalMs,
  onTick,
}: StartPollingRefreshOptions): () => void {
  if (!enabled || intervalMs <= 0) {
    return () => undefined;
  }

  const id = setInterval(() => {
    onTick();
  }, intervalMs);

  return () => {
    clearInterval(id);
  };
}
