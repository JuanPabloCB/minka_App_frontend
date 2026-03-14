import type { ExecutionRouteStepOut } from "@/lib/api/plans";
import PlanRow from "./PlanRow";

type PlanTableProps = {
    steps: ExecutionRouteStepOut[];
};

function isStepCompleted(step: ExecutionRouteStepOut) {
    return (
        step.analyst_actions.length > 0 &&
        step.analyst_actions.every((action) => action.status?.toLowerCase() === "done")
    );
}

export default function PlanTable({ steps }: PlanTableProps) {
    return (
        <div className="px-7 pb-8">
            <div className="rounded-[18px] min-h-[320px] border border-slate-200 bg-white p-5 shadow-sm">
                <div className="max-h-[360px] overflow-y-auto pr-2 md:max-h-[420px]">
                    <div className="space-y-4">
                        {steps.map((step, index) => {
                            const previousCompleted =
                                index === 0 ? true : isStepCompleted(steps[index - 1]);

                            return (
                                <PlanRow
                                    key={`${step.analyst_key}-${step.index}`}
                                    step={step}
                                    locked={!previousCompleted}
                                    actionLabel="Trabajar"
                                />
                            );
                        })}
                    </div>
                </div>
            </div>

            <div className="mx-auto mt-5 w-full max-w-[700px] max-h-[200px] rounded-[10px] border border-slate-200 bg-white pl-10 py-3 shadow-sm">
                <div className="text-base text-[14px] font-semibold text-slate-900">¿Qué debo hacer?</div>

                <div className="mt-4 grid gap-3 text-[12px] text-slate-600 md:grid-cols-2">
                    <div>1. Espera a que el estado de la ruta esté en “Listo”.</div>
                    <div>2. Entra al primer analista dándole a “Trabajar”.</div>
                    <div>3. Completa los micropasos con ayuda del analista.</div>
                    <div>4. Cuando termines con el analista, vuelve a la ruta.</div>
                    <div>5. Verás que el siguiente analista ya está disponible.</div>
                    <div>6. Repite el ciclo hasta terminar toda la ruta.</div>
                </div>
            </div>
        </div>
    );
}