import { useEffect } from "react";
import { useUI } from "../context/UIContext.jsx";

export default function Notification() {
  const { toast, clearToast } = useUI();

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(clearToast, 3000);
    return () => clearTimeout(t);
  }, [toast, clearToast]);

  if (!toast) return null;
  return (
    <div className={`alert alert-${toast.type} fade-in`} role="status">
      {toast.message}
    </div>
  );
}
