'use client';

import { useEffect, useState } from 'react';

/**
 * A clock that ticks every `intervalMs`, aligned to the interval boundary.
 *
 * Returns 0 until the component has mounted: the server renders at its own
 * wall-clock time, so baking a real timestamp into the HTML guarantees a
 * hydration mismatch on every load. Callers treat 0 as "not started yet".
 */
export function useNow(intervalMs = 1000): number {
  const [now, setNow] = useState(0);

  useEffect(() => {
    setNow(Date.now());
    let timer: ReturnType<typeof setTimeout>;
    const tick = () => {
      const at = Date.now();
      setNow(at);
      // Re-align each tick so drift never accumulates on a long-running display.
      timer = setTimeout(tick, intervalMs - (at % intervalMs));
    };
    timer = setTimeout(tick, intervalMs - (Date.now() % intervalMs));
    return () => clearTimeout(timer);
  }, [intervalMs]);

  return now;
}
