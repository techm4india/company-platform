import { useEffect, useState } from "react";

export function useIsNarrow(maxWidthPx = 768) {
  const [isNarrow, setIsNarrow] = useState(() => {
    if (typeof window === "undefined") return false;
    return window.matchMedia?.(`(max-width: ${maxWidthPx}px)`)?.matches ?? false;
  });

  useEffect(() => {
    const mq = window.matchMedia?.(`(max-width: ${maxWidthPx}px)`);
    if (!mq) return;
    const handler = () => setIsNarrow(mq.matches);
    handler();
    mq.addEventListener?.("change", handler);
    return () => mq.removeEventListener?.("change", handler);
  }, [maxWidthPx]);

  return isNarrow;
}

