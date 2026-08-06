import { useState, useCallback } from 'react';

export function useToast(durationMs = 4500) {
  const [toast, setToast] = useState(null);
  const show = useCallback((msg) => {
    setToast(msg);
    setTimeout(() => setToast(null), durationMs);
  }, [durationMs]);
  return { toast, show };
}