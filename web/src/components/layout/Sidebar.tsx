"use client";

import Image from "next/image";
import React from "react";
import NavItem from "@/components/navigation/NavItem";
import { sidebarNavigation } from "@/config/navigation";

interface SidebarProps {
  isOpen?: boolean;
}

export default function Sidebar({ isOpen = true }: SidebarProps) {
  if (!isOpen) return null;

  return (
    <aside className="flex h-full w-[260px] flex-col bg-white px-4 py-5">
      <div className="mb-5 flex h-[72px] items-center justify-center border-b border-slate-100 pb-4">
        <div className="transition-transform duration-300 hover:scale-[1.02]">
          <Image
            src="/brand/Logo_Minka.png"
            alt="Minka"
            width={110}
            height={32}
            priority
            className="object-contain"
          />
        </div>
      </div>

      {sidebarNavigation.map((section) => (
        <div key={section.section} className="mt-5">
          {section.section && (
            <p className="mb-2 px-2 text-[11px] font-semibold uppercase tracking-[0.08em] text-slate-400">
              {section.section}
            </p>
          )}

          <div className="space-y-1.5">
            {section.items.map((item) => (
              <NavItem
                key={item.label}
                label={item.label}
                href={item.href}
                icon={item.icon}
              />
            ))}
          </div>
        </div>
      ))}

      <div className="flex-1" />

      <div className="space-y-2 border-t border-slate-200 pt-4">
        <NavItem
          label="Soporte"
          href="/support"
          icon="/icons/sidebar/context_icon.png"
        />
        <NavItem
          label="Configuración"
          href="/settings"
          icon="/icons/sidebar/context_icon.png"
        />
      </div>
    </aside>
  );
}