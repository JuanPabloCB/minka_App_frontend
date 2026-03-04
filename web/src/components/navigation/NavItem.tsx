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

  const isActive =
    pathname === href || pathname.startsWith(href + "/");

  return (
    <Link
      href={href}
      className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition
      ${
        isActive
          ? "bg-slate-100 text-slate-900"
          : "text-slate-700 hover:bg-slate-100"
      }`}
    >
      <Image
        src={icon}
        alt={label}
        width={18}
        height={18}
        className="opacity-80"
      />

      {label}
    </Link>
  );
}