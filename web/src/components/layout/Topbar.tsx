"use client";

import React from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";

export default function Topbar() {
  const router = useRouter();
  return (
    <div className="mx-auto flex h-full w-full max-w-[1200px] items-center gap-4 px-8">
      <div className="flex w-full items-center">
        <div className="relative w-full max-w-[680px]">
          <div className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-slate-400">
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
            className="h-10 w-full rounded-full border border-slate-200 bg-white pl-10 pr-4 text-sm outline-none placeholder:text-slate-400 focus:border-slate-300"
          />
        </div>
      </div>

      <div className="flex items-center gap-3">
        <IconButton label="Notificaciones" onClick={() => router.push("/notifications")}>
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
        <IconButton label="Configuración" onClick={() => router.push("/settings")}>
          <Image
            src="/icons/topbar/settings.png"
            alt="Configuración"
            width={18}
            height={18}
            className="opacity-80"
          />

        </IconButton>
                <IconButton label="Perfil" onClick={() => router.push("/profile")} className="ml-5">
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

function IconButton({label,onClick,children,className="",}:{
  label?: string;
  onClick?: () => void;
  children?: React.ReactNode;
  className?: string;
}) {
  return (
    <button
    type="button"
    aria-label={label}
    onClick={onClick}
    className={`grid h-9 w-9 place-items-center rounded-md bg-transparent hover:bg-slate-100 active:scale-[0.98] ${className}`}
    >
      {children}
    </button>
  );
}