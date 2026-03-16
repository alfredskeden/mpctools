import { useCallback, useRef } from "react";

const INITIAL_DELAY = 300;
const REPEAT_INTERVAL = 50;

type RepeatOnHoldHandlers = {
  onPointerDown: () => void;
  onPointerUp: () => void;
  onPointerLeave: () => void;
};

export function useRepeatOnHold(callback: () => void): RepeatOnHoldHandlers {
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const stop = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  const onPointerDown = useCallback(() => {
    callback();
    timerRef.current = setTimeout(() => {
      intervalRef.current = setInterval(callback, REPEAT_INTERVAL);
    }, INITIAL_DELAY);
  }, [callback]);

  const onPointerUp = stop;
  const onPointerLeave = stop;

  return { onPointerDown, onPointerUp, onPointerLeave };
}
