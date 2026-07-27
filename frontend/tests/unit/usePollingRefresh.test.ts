import { startPollingRefresh } from '@/features/procurement/utils/pollingRefresh';

describe('startPollingRefresh', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('does not schedule ticks when enabled is false', () => {
    const onTick = jest.fn();
    const dispose = startPollingRefresh({ enabled: false, intervalMs: 5000, onTick });

    jest.advanceTimersByTime(15000);
    expect(onTick).not.toHaveBeenCalled();
    dispose();
  });

  it('calls onTick every intervalMs while enabled', () => {
    const onTick = jest.fn();
    const dispose = startPollingRefresh({ enabled: true, intervalMs: 5000, onTick });

    expect(onTick).not.toHaveBeenCalled();
    jest.advanceTimersByTime(4999);
    expect(onTick).not.toHaveBeenCalled();
    jest.advanceTimersByTime(1);
    expect(onTick).toHaveBeenCalledTimes(1);
    jest.advanceTimersByTime(10000);
    expect(onTick).toHaveBeenCalledTimes(3);
    dispose();
  });

  it('stops calling onTick after dispose', () => {
    const onTick = jest.fn();
    const dispose = startPollingRefresh({ enabled: true, intervalMs: 5000, onTick });

    jest.advanceTimersByTime(5000);
    expect(onTick).toHaveBeenCalledTimes(1);
    dispose();
    jest.advanceTimersByTime(15000);
    expect(onTick).toHaveBeenCalledTimes(1);
  });
});
