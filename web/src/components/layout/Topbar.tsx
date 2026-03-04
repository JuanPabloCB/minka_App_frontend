"use client";

import React from "react";

export default function Topbar() {
  return (
    <div className="mx-auto flex h-full w-full max-w-[1200px] items-center gap-4 px-8">
      <div className="flex w-full items-center">
        <div className="relative w-full max-w-[680px]">
          <div className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-slate-400">
            <span className="h-4 w-4 rounded bg-slate-300" />
          </div>
          <input
            placeholder="Buscar..."
            className="h-10 w-full rounded-full border border-slate-200 bg-white pl-10 pr-4 text-sm outline-none placeholder:text-slate-400 focus:border-slate-300"
          />
        </div>
      </div>

      <div className="flex items-center gap-3">
        <IconButton />
        <IconButton />
        <IconButton />
        <div className="h-9 w-9 rounded-full border border-slate-200 bg-white" />
      </div>
    </div>
  );
}

function IconButton() {
  return (
    <button className="grid h-9 w-9 place-items-center rounded-full border border-slate-200 bg-white hover:bg-slate-50">
      <span className="h-4 w-4 rounded bg-slate-300" />
    </button>
  );
}