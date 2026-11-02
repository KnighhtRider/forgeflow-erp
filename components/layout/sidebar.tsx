"use client";

import { useState, useEffect } from "react";
import { SidebarContent } from "./sidebar-content";

export function Sidebar() {
  const [collapsed, setCollapsed] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const stored = window.localStorage.getItem("forgeflow.sidebar.collapsed");
    const frame = window.requestAnimationFrame(() => {
      if (stored === "1") setCollapsed(true);
      setMounted(true);
    });
    return () => window.cancelAnimationFrame(frame);
  }, []);

  useEffect(() => {
    document.documentElement.style.setProperty(
      "--sidebar-w",
      collapsed ? "4rem" : "15rem"
    );
  }, [collapsed]);

  useEffect(() => {
    if (mounted) {
      window.localStorage.setItem(
        "forgeflow.sidebar.collapsed",
        collapsed ? "1" : "0"
      );
    }
  }, [collapsed, mounted]);

  return (
    <aside
      className={`fixed inset-y-0 left-0 z-30 hidden border-r border-sidebar-border bg-sidebar lg:flex lg:flex-col transition-[width] duration-300 ease-out ${
        collapsed ? "w-16" : "w-60"
      }`}
    >
      <SidebarContent
        collapsed={collapsed}
        onToggleCollapse={() => setCollapsed((v) => !v)}
      />
    </aside>
  );
}
