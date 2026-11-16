import { useState, useCallback } from "react";
import type { ToastMessage, ToastType } from "@/components/Toast";

export function useToast() {
  const [toast, setToast] = useState<ToastMessage | null>(null);

  const showToast = useCallback(
    (message: string, type: ToastType = "info", duration?: number) => {
      const id = `${Date.now()}-${Math.random()}`;
      setToast({ id, message, type, duration });
    },
    [],
  );

  const dismissToast = useCallback(() => {
    setToast(null);
  }, []);

  return { toast, showToast, dismissToast };
}
