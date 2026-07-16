import {
  CLOSE_DELAY_MS,
  createSidebarHoverController,
  type FlyoutGroupId,
} from '@/components/useSidebarHover';

describe('createSidebarHoverController', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  function setup(closeDelayMs = CLOSE_DELAY_MS) {
    const onChange = jest.fn();
    const controller = createSidebarHoverController({
      closeDelayMs,
      onChange,
    });
    return { controller, onChange };
  }

  it('starts collapsed with no flyout', () => {
    const { controller } = setup();
    expect(controller.getState()).toEqual({ isExpanded: false, flyoutGroup: null });
  });

  it('expands on shell enter', () => {
    const { controller, onChange } = setup();
    controller.onShellEnter();
    expect(controller.getState()).toEqual({ isExpanded: true, flyoutGroup: null });
    expect(onChange).toHaveBeenLastCalledWith({ isExpanded: true, flyoutGroup: null });
  });

  it('sets flyout group on group enter while expanded', () => {
    const { controller } = setup();
    controller.onShellEnter();
    const id: FlyoutGroupId = 'compras';
    controller.onGroupEnter(id);
    expect(controller.getState()).toEqual({ isExpanded: true, flyoutGroup: 'compras' });
  });

  it('swaps flyout group when entering another group', () => {
    const { controller } = setup();
    controller.onShellEnter();
    controller.onGroupEnter('estoque');
    controller.onGroupEnter('operacoes');
    expect(controller.getState().flyoutGroup).toBe('operacoes');
  });

  it('closes after delay on shell leave', () => {
    const { controller } = setup(220);
    controller.onShellEnter();
    controller.onGroupEnter('compras');
    controller.onShellLeave();
    expect(controller.getState().isExpanded).toBe(true);
    jest.advanceTimersByTime(219);
    expect(controller.getState().isExpanded).toBe(true);
    jest.advanceTimersByTime(1);
    expect(controller.getState()).toEqual({ isExpanded: false, flyoutGroup: null });
  });

  it('cancels pending close when shell re-enters before delay', () => {
    const { controller } = setup(220);
    controller.onShellEnter();
    controller.onGroupEnter('compras');
    controller.onShellLeave();
    jest.advanceTimersByTime(100);
    controller.onShellEnter();
    jest.advanceTimersByTime(500);
    expect(controller.getState()).toEqual({ isExpanded: true, flyoutGroup: 'compras' });
  });

  it('collapseNow resets immediately and clears pending timer', () => {
    const { controller } = setup(220);
    controller.onShellEnter();
    controller.onGroupEnter('financeiro');
    controller.onShellLeave();
    controller.collapseNow();
    expect(controller.getState()).toEqual({ isExpanded: false, flyoutGroup: null });
    jest.advanceTimersByTime(500);
    expect(controller.getState()).toEqual({ isExpanded: false, flyoutGroup: null });
  });
});
