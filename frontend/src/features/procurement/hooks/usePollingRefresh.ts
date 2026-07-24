'use client';

import { useEffect, useRef } from 'react';
import {
  PROCUREMENT_POLL_INTERVAL_MS,
  startPollingRefresh,
} from '../utils/pollingRefresh';

export type UsePollingRefreshOptions = {
  enabled: boolean;
  intervalMs?: number;
  onTick: () => void;
};

/**
 * Calls onTick on a fixed interval while enabled.
 * Continues while the tab is in the background; pause by setting enabled=false
 * (e.g. while a wizard/modal/form is open).
 */
export function usePollingRefresh({
  enabled,
  intervalMs = PROCUREMENT_POLL_INTERVAL_MS,
  onTick,
}: UsePollingRefreshOptions): void {
  const onTickRef = useRef(onTick);
  onTickRef.current = onTick;

  useEffect(() => {
    return startPollingRefresh({
      enabled,
      intervalMs,
      onTick: () => {
        onTickRef.current();
      },
    });
  }, [enabled, intervalMs]);
}
