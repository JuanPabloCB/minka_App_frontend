"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import type { ExecutionRouteStepOut } from "@/lib/api/plans";

type PlanRowProps = {
    step: ExecutionRouteStepOut;
    locked: boolean;
    actionLabel: string;
};

const TASKS_PREVIEW_MAX = 78;

function getCompletedActionsCount(step: ExecutionRouteStepOut) {
    return step.analyst_actions.filter(
        (action) => action.status?.toLowerCase() === "done"
    ).length;
}

function getStepProgress(step: ExecutionRouteStepOut) {
    const total = step.analyst_actions.length;
    if (total === 0) return 0;
    const done = getCompletedActionsCount(step);
    return Math.round((done / total) * 100);
}

function getStepUiState(
    step: ExecutionRouteStepOut
): "Completado" | "Pendiente" | "Error" {
    if (step.analyst_actions.some((action) => action.status?.toLowerCase() === "error")) {
        return "Error";
    }

    if (
        step.analyst_actions.length > 0 &&
        step.analyst_actions.every((action) => action.status?.toLowerCase() === "done")
    ) {
        return "Completado";
    }

    return "Pendiente";
}

function getIndicator(uiState: "Completado" | "Pendiente" | "Error") {
    const src =
        uiState === "Completado"
            ? "/icons/exec-route/analyst-status-complete.png"
            : uiState === "Error"
                ? "/icons/exec-route/analyst-status-error.png"
                : "/icons/exec-route/analyst-status-in-progress.png";

    return (
        <div className="relative h-5 w-5 shrink-0">
            <Image
                src={src}
                alt={uiState}
                fill
                className="object-contain"
                draggable={false}
            />
        </div>
    );
}

function buildTasksPreview(text: string, maxChars: number) {
    if (text.length <= maxChars) {
        return { preview: text, truncated: false };
    }

    return {
        preview: `${text.slice(0, maxChars).trimEnd()}...`,
        truncated: true,
    };
}

export default function PlanRow({ step, locked, actionLabel }: PlanRowProps) {
    const [showTasksModal, setShowTasksModal] = useState(false);

    const progress = getStepProgress(step);
    const uiState = getStepUiState(step);

    const buttonStyles =
        uiState === "Completado"
            ? "bg-emerald-600 text-white"
            : locked
                ? "bg-slate-300 text-white"
                : "bg-violet-400 text-white";

    const buttonText = uiState === "Completado" ? "Completado" : actionLabel;

    const fullTasksText = useMemo(() => step.task_titles.join(", "), [step.task_titles]);
    const { preview, truncated } = useMemo(
        () => buildTasksPreview(fullTasksText, TASKS_PREVIEW_MAX),
        [fullTasksText]
    );

    return (
        <>
            <div className="rounded-2xl border border-slate-200 bg-white pr-8 pl-12 py-4 shadow-sm">
                <div className="grid grid-cols-[auto_1fr] gap-x-6 gap-y-1 md:grid-cols-[auto_minmax(0,190px)_minmax(0,1fr)_auto] md:gap-x-8 md:gap-y-[2px]">
                    {/* indicador */}
                    <div className="flex items-center md:row-span-2 md:self-center">
                        {getIndicator(uiState)}
                    </div>

                    {/* titulo + duracion */}
                    <div className="min-w-0 md:row-span-2 md:flex md:items-center px-4">
                        <div className="flex flex-col justify-center">
                            <div className="text-[21px] font-medium leading-tight tracking-[-0.02em] text-slate-950 md:text-[22px]">
                                {step.analyst_label}
                            </div>

                            <div className="mt-3 whitespace-nowrap text-left text-[13px] leading-5 text-slate-500 md:pr-8">
                                Duración estimada: {step.estimated_minutes} min
                            </div>
                        </div>
                    </div>

                    {/* tareas + barra de progreso */}
                    <div className="min-w-0 self-center md:pr-10 translate-y-[6px]">
                        <div className="flex items-start gap-2 text-[12px] leading-5 text-slate-500">
                            <span className="shrink-0 font-medium text-slate-700">Tareas:</span>

                            <div className="min-w-0 flex items-start gap-2">
                                <span className="break-words md:break-normal">{preview}</span>

                                {truncated ? (
                                    <button
                                        type="button"
                                        onClick={() => setShowTasksModal(true)}
                                        className="mt-[2px] shrink-0 rounded-md border border-slate-200 bg-slate-50 px-2 py-[2px] text-[11px] font-semibold leading-none text-slate-600 hover:bg-slate-100"
                                        title="Ver tareas completas"
                                    >
                                        ...
                                    </button>
                                ) : null}
                            </div>
                        </div>

                        <div className="mt-4 flex items-center gap-2 translate-y-[1px]">
                            <div className="h-2.5 w-full overflow-hidden rounded-full border border-slate-300 bg-none">
                                <div
                                    className="h-full rounded-full bg-no-repeat bg-cover bg-left transition-all"
                                    style={{
                                        width: `${progress}%`,
                                        backgroundImage: "url('/illustrations/exec-route/progress-bar.png')",
                                        backgroundSize: "cover",
                                        backgroundPosition: "center",
                                        backgroundRepeat: "no-repeat",
                                    }}
                                />
                            </div>

                            <div className="w-6 shrink-0 text-right text-xs font-semibold text-slate-700">
                                {progress}%
                            </div>
                        </div>
                    </div>

                    {/* boton */}
                    <div className="col-span-2 flex justify-end self-center md:col-span-1 md:row-span-2">
                        <button
                            type="button"
                            disabled={locked || uiState === "Completado"}
                            className={`min-w-[140px] max-h-[36px] rounded-[5px] px-5 py-2 text-sm font-semibold shadow-sm transition ${buttonStyles} ${locked || uiState === "Completado" ? "cursor-default" : "cursor-pointer"}`}
                        >
                            {buttonText}
                        </button>
                    </div>

                </div>
            </div>

            {showTasksModal ? (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/35 px-4">
                    <div className="w-full max-w-[560px] rounded-2xl border border-slate-200 bg-white p-6 shadow-xl">
                        <div className="flex items-start justify-between gap-4">
                            <div>
                                <div className="text-lg font-semibold text-slate-900">
                                    Tareas del analista
                                </div>
                                <div className="mt-1 text-sm text-slate-500">
                                    {step.analyst_label}
                                </div>
                            </div>

                            <button
                                type="button"
                                onClick={() => setShowTasksModal(false)}
                                className="rounded-lg border border-slate-200 px-3 py-1.5 text-sm font-medium text-slate-600 hover:bg-slate-50"
                            >
                                Cerrar
                            </button>
                        </div>

                        <div className="mt-5 max-h-[320px] overflow-y-auto rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm leading-7 text-slate-700">
                            {fullTasksText}
                        </div>
                    </div>
                </div>
            ) : null}
        </>
    );
}