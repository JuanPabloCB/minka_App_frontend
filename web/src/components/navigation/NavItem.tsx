"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";

interface NavItemProps {
  label: string;
  href: string;
  icon: string;
}

export default function NavItem({ label, href, icon }: NavItemProps) {
  const pathname = usePathname();

  const isActive = pathname === href || pathname.startsWith(href + "/");

  return (
    <Link
      href={href}
      className={`group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition-all duration-200 ease-out ${
        isActive
          ? "bg-slate-100 text-slate-900 shadow-[inset_0_0_0_1px_rgba(148,163,184,0.18)]"
          : "text-slate-700 hover:-translate-y-[1px] hover:bg-slate-50 hover:text-slate-900 hover:shadow-[0_6px_18px_rgba(15,23,42,0.05)]"
      }`}
    >
      <Image
        src={icon}
        alt={label}
        width={18}
        height={18}
        className={`opacity-80 transition-transform duration-200 ${
          isActive ? "scale-100" : "group-hover:scale-105"
        }`}
      />

      <span className="transition-colors duration-200">{label}</span>
    </Link>
  );
}