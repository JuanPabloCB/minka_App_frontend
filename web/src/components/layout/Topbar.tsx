"use client";

import React from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";

interface TopbarProps {
  sidebarOpen: boolean;
  onToggleSidebar: () => void;
  showHamburger?: boolean;
}

export default function Topbar({
  sidebarOpen,
  onToggleSidebar,
  showHamburger = true,
}: TopbarProps) {
  const router = useRouter();

  return (
    <div
      className={`grid h-full w-full items-center px-6 ${
        showHamburger
          ? "grid-cols-[64px_1fr_180px]"
          : "grid-cols-[1fr_180px]"
      }`}
    >
      {showHamburger && (
        <div className="flex items-center justify-start">
          <button
            type="button"
            aria-label={sidebarOpen ? "Cerrar menú" : "Abrir menú"}
            onClick={onToggleSidebar}
            className="grid h-10 w-10 place-items-center rounded-xl bg-transparent text-slate-800 transition-all duration-200 hover:scale-[1.03] hover:bg-slate-100 active:scale-[0.97]"
          >
            <span className="text-[26px] leading-none">☰</span>
          </button>
        </div>
      )}

      <div className="flex items-center justify-center">
        <div className="relative w-full max-w-[880px]">
          <div className="pointer-events-none absolute inset-y-0 left-4 flex items-center text-slate-400">
            <Image
              src="/icons/topbar/search.svg"
              alt="Buscar"
              width={16}
              height={16}
              className="opacity-80"
            />
          </div>

          <input
            placeholder="Buscar..."
            className="h-11 w-full rounded-full border border-slate-200 bg-white pl-11 pr-4 text-sm outline-none transition-all duration-200 placeholder:text-slate-400 focus:border-slate-300 focus:shadow-[0_0_0_4px_rgba(99,102,241,0.06)]"
          />
        </div>
      </div>

      <div className="flex items-center justify-end gap-3">
        <IconButton
          label="Notificaciones"
          onClick={() => router.push("/notifications")}
        >
          <Image
            src="/icons/topbar/notification.png"
            alt="Notificaciones"
            width={18}
            height={18}
            className="opacity-80"
          />
        </IconButton>

        <IconButton label="Ayuda" onClick={() => router.push("/help")}>
          <Image
            src="/icons/topbar/help.png"
            alt="Ayuda"
            width={18}
            height={18}
            className="opacity-80"
          />
        </IconButton>

        <IconButton
          label="Configuración"
          onClick={() => router.push("/settings")}
        >
          <Image
            src="/icons/topbar/settings.png"
            alt="Configuración"
            width={18}
            height={18}
            className="opacity-80"
          />
        </IconButton>

        <IconButton label="Perfil" onClick={() => router.push("/profile")}>
          <Image
            src="/icons/topbar/avatar.svg"
            alt="Perfil"
            width={24}
            height={24}
            className="opacity-80"
          />
        </IconButton>
      </div>
    </div>
  );
}

function IconButton({
  label,
  onClick,
  children,
}: {
  label?: string;
  onClick?: () => void;
  children?: React.ReactNode;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      onClick={onClick}
      className="grid h-9 w-9 place-items-center rounded-xl bg-transparent transition-all duration-200 hover:scale-[1.04] hover:bg-slate-100 active:scale-[0.97]"
    >
      {children}
    </button>
  );
}