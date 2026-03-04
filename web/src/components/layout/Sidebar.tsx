"use client";

import Image from "next/image";
import React from "react";
import NavItem from "@/components/navigation/NavItem";

import { sidebarNavigation } from "@/config/navigation";

export default function Sidebar() {
  return (
    <aside className="flex h-full w-[260px] flex-col border-r border-slate-200 bg-white px-4 py-5">

      {/* LOGO */}
      <div className="flex items-center justify-center h-[70px] mb-4">
        <Image
          src="/brand/Logo_Minka.png"
          alt="Minka"
          width={110}
          height={32}
          priority
          className="object-contain"
        />
      </div>

      {/* SECTIONS */}
      {sidebarNavigation.map((section) => (
        <div key={section.section} className="mt-6">

          {section.section && (
            <p className="mb-2 px-2 text-[11px] font-semibold uppercase tracking-wide text-slate-400">
              {section.section}
            </p>
          )}

          <div className="space-y-1">
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

      {/* Spacer */}
      <div className="flex-1" />

      {/* FOOTER */}
      <div className="border-t border-slate-200 pt-4 space-y-2">

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