import { createContext, useContext, useState, useCallback } from "react";
import Toast, { ToastType } from "../components/Toast";

interface ToastContextValue {
  showToast: (type: ToastType, message: string) => void;
}

const ToastContext = createContext<ToastContextValue>({ showToast: () => {} });

export const useToast = () => useContext(ToastContext);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toast, setToast] = useState<{ visible: boolean; type: ToastType; message: string }>({
    visible: false,
    type: "error",
    message: "",
  });

  const showToast = useCallback((type: ToastType, message: string) => {
    // Reset first to re-trigger useEffect if already visible
    setToast({ visible: false, type: "error", message: "" });
    setTimeout(() => setToast({ visible: true, type, message }), 50);
  }, []);

  const dismiss = useCallback(() => {
    setToast((prev) => ({ ...prev, visible: false }));
  }, []);

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <Toast visible={toast.visible} type={toast.type} message={toast.message} onDismiss={dismiss} />
    </ToastContext.Provider>
  );
}
