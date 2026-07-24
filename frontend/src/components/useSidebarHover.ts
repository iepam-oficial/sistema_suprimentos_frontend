'use client';

import { useCallback, useRef, useState, useEffect } from 'react';

export const CLOSE_DELAY_MS = 220;

export type FlyoutGroupId =
  | 'estoque'
  | 'operacoes'
  | 'compras'
  | 'financeiro'
  | 'configuracoes';

export type SidebarHoverState = {
  isExpanded: boolean;
  flyoutGroup: FlyoutGroupId | null;
};

type ControllerOptions = {
  closeDelayMs?: number;
  onChange?: (state: SidebarHoverState) => void;
  setTimeoutFn?: typeof setTimeout;
  clearTimeoutFn?: typeof clearTimeout;
};

const INITIAL_STATE: SidebarHoverState = {
  isExpanded: false,
  flyoutGroup: null,
};

/** Pure controller — unit-tested; React hook wraps it. */
export function createSidebarHoverController(options: ControllerOptions = {}) {
  const closeDelayMs = options.closeDelayMs ?? CLOSE_DELAY_MS;
  const setTimeoutFn = options.setTimeoutFn ?? setTimeout;
  const clearTimeoutFn = options.clearTimeoutFn ?? clearTimeout;
  const onChange = options.onChange;

  let state: SidebarHoverState = { ...INITIAL_STATE };
  let closeTimer: ReturnType<typeof setTimeout> | null = null;

  const emit = (next: SidebarHoverState) => {
    state = next;
    onChange?.(state);
  };

  const clearCloseTimer = () => {
    if (closeTimer !== null) {
      clearTimeoutFn(closeTimer);
      closeTimer = null;
    }
  };

  return {
    getState: () => state,
    onShellEnter: () => {
      clearCloseTimer();
      if (!state.isExpanded) {
        emit({ isExpanded: true, flyoutGroup: state.flyoutGroup });
      }
    },
    onShellLeave: () => {
      clearCloseTimer();
      closeTimer = setTimeoutFn(() => {
        closeTimer = null;
        emit({ isExpanded: false, flyoutGroup: null });
      }, closeDelayMs);
    },
    onGroupEnter: (id: FlyoutGroupId) => {
      clearCloseTimer();
      emit({ isExpanded: true, flyoutGroup: id });
    },
    clearFlyout: () => {
      clearCloseTimer();
      if (state.flyoutGroup !== null) {
        emit({ isExpanded: state.isExpanded, flyoutGroup: null });
      }
    },
    collapseNow: () => {
      clearCloseTimer();
      emit({ isExpanded: false, flyoutGroup: null });
    },
    dispose: () => {
      clearCloseTimer();
    },
  };
}

export function useSidebarHover(closeDelayMs: number = CLOSE_DELAY_MS) {
  const [state, setState] = useState<SidebarHoverState>(INITIAL_STATE);
  const controllerRef = useRef<ReturnType<typeof createSidebarHoverController> | null>(null);

  if (!controllerRef.current) {
    controllerRef.current = createSidebarHoverController({
      closeDelayMs,
      onChange: setState,
    });
  }

  useEffect(() => {
    return () => {
      controllerRef.current?.dispose();
    };
  }, []);

  const onShellEnter = useCallback(() => {
    controllerRef.current?.onShellEnter();
  }, []);

  const onShellLeave = useCallback(() => {
    controllerRef.current?.onShellLeave();
  }, []);

  const onGroupEnter = useCallback((id: FlyoutGroupId) => {
    controllerRef.current?.onGroupEnter(id);
  }, []);

  const clearFlyout = useCallback(() => {
    controllerRef.current?.clearFlyout();
  }, []);

  const collapseNow = useCallback(() => {
    controllerRef.current?.collapseNow();
  }, []);

  return {
    isExpanded: state.isExpanded,
    flyoutGroup: state.flyoutGroup,
    onShellEnter,
    onShellLeave,
    onGroupEnter,
    clearFlyout,
    collapseNow,
  };
}
