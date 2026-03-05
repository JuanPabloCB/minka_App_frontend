"use client";

import React from "react";
import Sidebar from "./Sidebar";
import Topbar from "./Topbar";

export default function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-[#F6F7FB] text-slate-900">
      <aside className="fixed inset-y-0 left-0 w-[260px] border-r border-slate-200 bg-white">
        <Sidebar />
      </aside>

      <div className="pl-[260px]">
        <header className="sticky top-0 z-40 h-[64px] border-b border-slate-200 bg-white">
          <Topbar />
        </header>

        <main className="mx-auto w-full max-w-[1440px] px-8 py-8">
          {children}
        </main>
      </div>
    </div>
  );
}