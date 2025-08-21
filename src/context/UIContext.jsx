import React, { createContext, useContext, useMemo, useState } from "react";

const UIContext = createContext(null);

export function UIProvider({ children }) {
  const [sidebarOpen, setSidebarOpen] = useState(window.innerWidth > 768);
  const [role, setRole] = useState("owner"); // owner | driver
  const [search, setSearch] = useState("");
  const [toast, setToast] = useState(null);

  const value = useMemo(
    () => ({
      sidebarOpen,
      setSidebarOpen,
      role,
      setRole,
      search,
      setSearch,
      toast,
      setToast,
      notify: (message, type = "info") =>
        setToast({ id: Date.now(), message, type }),
      clearToast: () => setToast(null),
    }),
    [sidebarOpen, role, search, toast]
  );

  return <UIContext.Provider value={value}>{children}</UIContext.Provider>;
}

export function useUI() {
  const ctx = useContext(UIContext);
  if (!ctx) throw new Error("useUI must be used within UIProvider");
  return ctx;
}
