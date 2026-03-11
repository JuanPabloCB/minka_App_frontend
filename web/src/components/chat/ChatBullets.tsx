"use client";

import type { UIBulletsOut } from "@/lib/api/orchestrator";

function DotHalo() {
    return (
        <div className="relative mt-[4px] h-3 w-3 shrink-0">
            {/* halo con color */}
            <div className="absolute inset-0 rounded-full bg-[#D9D9D9] border border-none" />
            {/* núcleo */}
            <div className="absolute inset-[3px] rounded-full bg-[#656565]" />
        </div>
    );
}

export function ChatBullets({
    bullets,
    baseDelayMs = 0,
}: {
    bullets: UIBulletsOut;
    baseDelayMs?: number;
}) {
    return (
        <div className="rounded-2xl bg-none px-4 py-3">
            {bullets.title ? (
                <div
                    className="mb-2 text-[14px] font-medium text-slate-600 opacity-0 animate-[minkaInUp_220ms_ease-out_forwards]"
                    style={{ animationDelay: `${baseDelayMs}ms` }}
                >
                    {bullets.title}
                </div>
            ) : null}
            {bullets.variant === "bullets" ? (
                <div className="space-y-2">
                    {bullets.items.map((it, idx) => (
                        <div
                            key={it.key}
                            className="flex gap-3 opacity-0 animate-[minkaInUp_220ms_ease-out_forwards]"
                            style={{ animationDelay: `${baseDelayMs + 140 + idx * 90}ms` }}
                        >
                            <DotHalo />
                            <div className="text-[13px] text-[#ABABAB] leading-relaxed">
                                {it.label}
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="space-y-3">
                    {bullets.items.map((it, idx) => (
                        <div
                            key={it.key}
                            className="flex gap-3 items-start opacity-0 animate-[minkaInUp_220ms_ease-out_forwards]"
                            style={{ animationDelay: `${baseDelayMs + 140 + idx * 110}ms` }}
                        >
                            {/* rail: dot + línea continua */}
                            <div className="relative w-6 flex justify-center">
                                {/* Línea vertical (solo si no es el último) */}
                                {idx < bullets.items.length - 1 ? (
                                    <div className="absolute left-1/2 top-[16px] h-[calc(100%+12px)] w-[0.5px] -translate-x-1/2 bg-slate-300" />
                                ) : null}

                                {/* Dot con halo */}
                                <DotHalo />
                            </div>

                            {/* texto */}
                            <div className="text-[13px] text-[#ABABAB] leading-relaxed">
                                {it.label}
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}