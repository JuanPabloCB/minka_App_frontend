"use client";

import React, { useEffect, useMemo, useState } from "react";
import { usePathname } from "next/navigation";
import Sidebar from "./Sidebar";
import Topbar from "./Topbar";

type LayoutMode = "static" | "focus";

function resolveLayoutMode(pathname: string): LayoutMode {
  const focusRoutes = ["/legal-analyst", "/summary-analyst"];

  const isFocusRoute = focusRoutes.some(
    (route) => pathname === route || pathname.startsWith(route + "/")
  );

  return isFocusRoute ? "focus" : "static";
}

export default function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const layoutMode = useMemo(() => resolveLayoutMode(pathname), [pathname]);

  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    if (layoutMode === "static") {
      setSidebarOpen(false);
    }
  }, [layoutMode]);

  if (layoutMode === "static") {
    return (
      <div className="min-h-screen bg-[#F6F7FB] text-slate-900">
        <aside className="fixed inset-y-0 left-0 z-30 w-[260px] border-r border-slate-200 bg-white">
          <Sidebar isOpen />
        </aside>

        <div className="min-h-screen pl-[260px]">
          <header className="sticky top-0 z-20 h-[72px] border-b border-slate-200 bg-white">
            <Topbar
              sidebarOpen={true}
              onToggleSidebar={() => {}}
              showHamburger={false}
            />
          </header>

          <main className="mx-auto w-full max-w-[1560px] px-6 py-6 2xl:max-w-[1640px]">
            {children}
          </main>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen overflow-hidden bg-[#F6F7FB] text-slate-900">
      <div
        onClick={() => setSidebarOpen(false)}
        className={`fixed inset-0 z-30 bg-black/20 backdrop-blur-[1px] transition-all duration-300 ease-out ${
          sidebarOpen
            ? "pointer-events-auto opacity-100"
            : "pointer-events-none opacity-0"
        }`}
      />

      <aside
        className={`fixed inset-y-0 left-0 z-40 w-[260px] border-r border-slate-200 bg-white shadow-[0_10px_40px_rgba(15,23,42,0.12)] transition-all duration-300 ease-out ${
          sidebarOpen
            ? "translate-x-0 opacity-100"
            : "-translate-x-full opacity-0"
        }`}
      >
        <Sidebar isOpen />
      </aside>

      <div className="flex h-screen flex-col">
        <header className="sticky top-0 z-20 h-[72px] shrink-0 border-b border-slate-200 bg-white/95 backdrop-blur-md">
          <Topbar
            sidebarOpen={sidebarOpen}
            onToggleSidebar={() => setSidebarOpen((prev) => !prev)}
            showHamburger={true}
          />
        </header>

        <main className="mx-auto h-[calc(100vh-72px)] w-full max-w-[1720px] overflow-hidden px-5 py-5 xl:px-8 2xl:max-w-[1800px]">
          {children}
        </main>
      </div>
    </div>
  );
}