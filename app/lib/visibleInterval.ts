"use client";

type VisibleIntervalOptions = {
  runOnVisible?: boolean;
};

export function startVisibleInterval(
  callback: () => void,
  intervalMs: number,
  options: VisibleIntervalOptions = {}
) {
  if (typeof document === "undefined") return () => {};

  let timer: ReturnType<typeof setInterval> | null = null;

  const stopTimer = () => {
    if (!timer) return;
    clearInterval(timer);
    timer = null;
  };

  const startTimer = () => {
    stopTimer();
    if (document.hidden) return;
    timer = setInterval(callback, intervalMs);
  };

  const handleVisibility = () => {
    if (document.hidden) {
      stopTimer();
      return;
    }

    if (options.runOnVisible !== false) {
      callback();
    }

    startTimer();
  };

  startTimer();
  document.addEventListener("visibilitychange", handleVisibility);

  return () => {
    stopTimer();
    document.removeEventListener("visibilitychange", handleVisibility);
  };
}
