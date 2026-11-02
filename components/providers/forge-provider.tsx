"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { isForgeData, makeId, seedData, type ForgeData } from "@/lib/domain";

const KEY = "forgeflow-data-v2";
type ForgeContextValue = { data: ForgeData; ready: boolean; update: (recipe: (current: ForgeData) => ForgeData, action?: string, detail?: string) => void; refresh: () => boolean; reset: () => void };
const ForgeContext = createContext<ForgeContextValue | null>(null);

export function ForgeProvider({ children }: { children: ReactNode }) {
  const [data, setData] = useState<ForgeData>(seedData);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let initialData: ForgeData | undefined;
    try {
      window.localStorage.removeItem("forgeflow-data-v1");
      const saved = window.localStorage.getItem(KEY);
      if (saved) {
        const parsed: unknown = JSON.parse(saved);
        if (isForgeData(parsed)) initialData = parsed;
        else window.localStorage.removeItem(KEY);
      }
    } catch {
      // Use the bundled demo data if browser storage is unavailable or malformed.
    }
    const frame = window.requestAnimationFrame(() => {
      if (initialData) setData(initialData);
      setReady(true);
    });
    const sync = (event: StorageEvent) => {
      if (event.key !== KEY || !event.newValue) return;
      try { const parsed: unknown = JSON.parse(event.newValue); if (isForgeData(parsed)) setData(parsed); } catch { /* Ignore malformed updates from another tab. */ }
    };
    window.addEventListener("storage", sync);
    return () => { window.cancelAnimationFrame(frame); window.removeEventListener("storage", sync); };
  }, []);

  useEffect(() => {
    if (!ready) return;
    try { window.localStorage.setItem(KEY, JSON.stringify(data)); } catch { /* The UI remains usable for this session if storage is full. */ }
  }, [data, ready]);

  const update = useCallback((recipe: (current: ForgeData) => ForgeData, action?: string, detail?: string) => {
    setData((current) => {
      const next = recipe(current);
      if (!action) return next;
      return { ...next, history: [{ id: makeId("act"), action, detail: detail ?? "", createdAt: new Date().toISOString() }, ...next.history].slice(0, 500) };
    });
  }, []);
  const refresh = useCallback(() => {
    try {
      const saved = window.localStorage.getItem(KEY);
      if (!saved) return true;
      const parsed: unknown = JSON.parse(saved);
      if (!isForgeData(parsed)) return false;
      setData(parsed);
      return true;
    } catch {
      return false;
    }
  }, []);
  const reset = useCallback(() => { setData(seedData); }, []);
  const value = useMemo(() => ({ data, ready, update, refresh, reset }), [data, ready, update, refresh, reset]);
  return <ForgeContext.Provider value={value}>{children}</ForgeContext.Provider>;
}

export function useForge() {
  const value = useContext(ForgeContext);
  if (!value) throw new Error("useForge must be used inside ForgeProvider");
  return value;
}
