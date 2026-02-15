export function createAutosaveScheduler({ delayMs, onSave }) {
  const timers = new Map();

  function schedule(key) {
    cancel(key);
    const timer = setTimeout(() => {
      timers.delete(key);
      onSave(key);
    }, delayMs);
    timers.set(key, timer);
  }

  function cancel(key) {
    const timer = timers.get(key);
    if (timer) {
      clearTimeout(timer);
      timers.delete(key);
    }
  }

  function cancelAll() {
    for (const timer of timers.values()) {
      clearTimeout(timer);
    }
    timers.clear();
  }

  return {
    schedule,
    cancel,
    cancelAll
  };
}
