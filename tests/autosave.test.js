import { vi } from 'vitest';
import { createAutosaveScheduler } from '../src/lib/autosave';

describe('autosave scheduler', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.runOnlyPendingTimers();
    vi.useRealTimers();
  });

  it('debounces repeated schedules for the same key', () => {
    const onSave = vi.fn();
    const scheduler = createAutosaveScheduler({ delayMs: 500, onSave });

    scheduler.schedule('note.md');
    scheduler.schedule('note.md');
    scheduler.schedule('note.md');

    vi.advanceTimersByTime(499);
    expect(onSave).not.toHaveBeenCalled();

    vi.advanceTimersByTime(1);
    expect(onSave).toHaveBeenCalledTimes(1);
    expect(onSave).toHaveBeenCalledWith('note.md');
  });

  it('cancels a pending save', () => {
    const onSave = vi.fn();
    const scheduler = createAutosaveScheduler({ delayMs: 300, onSave });

    scheduler.schedule('doc.md');
    scheduler.cancel('doc.md');

    vi.advanceTimersByTime(400);
    expect(onSave).not.toHaveBeenCalled();
  });
});
