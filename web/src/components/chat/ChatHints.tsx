"use client";

import type { UIHintsOut } from "@/lib/api/orchestrator";

export function ChatHints({
    hints,
    onPick,
    baseDelayMs = 0,
}: {
    hints: UIHintsOut;
    onPick: (value: string) => void;
    baseDelayMs?: number;
}) {
    if (!hints?.hints?.length) return null;

    const chipBase =
        "rounded-full border border-slate-200 bg-[#F0F0F0] font-semibold shadow-sm hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed";
    const chipText = "text-slate-800";

    return (
        <div className="px-4 space-y-3">
            {hints.hints.map((h, idx) => {
                const chipSize =
                    h.type === "quick_replies"
                        ? "px-3 py-1.5 text-[12px]"
                        : "px-4 py-2 text-[13px]";

                return (
                    <div key={idx}>
                        {h.title ? (
                            <div
                                className="mb-2 text-[14px] text-slate-900 opacity-0 animate-[minkaInUp_220ms_ease-out_forwards]"
                                style={{ animationDelay: `${baseDelayMs}ms` }}
                            >
                                {h.title}
                            </div>
                        ) : null}


                        {/* actions: CTA negro */}
                        {h.type === "actions" ? (
                            <div className="space-y-2">
                                {h.options.map((opt, jdx) => (
                                    <button
                                        key={opt.key}
                                        onClick={() => onPick(opt.value ?? opt.label)}
                                        disabled={!opt.enabled}
                                        title={opt.reason ?? undefined}
                                        type="button"
                                        style={{ animationDelay: `${baseDelayMs + 140 + jdx * 90}ms` }}
                                        className="w-full rounded-2xl bg-black px-4 py-3 text-sm font-extrabold text-white shadow-md hover:opacity-95 active:scale-[0.99] disabled:opacity-50 disabled:cursor-not-allowed opacity-0 animate-[minkaInUp_220ms_ease-out_forwards]"
                                    >
                                        <span className="flex items-center justify-center gap-2">
                                            <span>{opt.label}</span>
                                            {opt.reason ? (
                                                <span className="rounded-full bg-white/10 px-2 py-0.5 text-[10px] font-bold text-[white/80]">
                                                    {opt.reason}
                                                </span>
                                            ) : null}
                                        </span>
                                    </button>
                                ))}
                            </div>
                        ) : (
                            // tool_select / quick_replies: chips
                            <div className="flex flex-wrap gap-2">
                                    {h.options.map((opt, jdx) => (
                                        <button
                                            key={opt.key}
                                            onClick={() => onPick(opt.value ?? opt.label)}
                                            disabled={!opt.enabled}
                                            title={opt.reason ?? undefined}
                                            type="button"
                                            style={{ animationDelay: `${baseDelayMs + 140 + jdx * 90}ms` }}
                                            className={`${chipBase} ${chipSize} ${chipText} opacity-0 animate-[minkaInUp_220ms_ease-out_forwards]`}
                                        >
                                        <span className="flex items-center gap-2">
                                            <span>{opt.label}</span>
                                        </span>
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
                );
            })}
        </div>
    );
}