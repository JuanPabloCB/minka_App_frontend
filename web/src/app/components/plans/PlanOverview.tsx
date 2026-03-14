import Image from "next/image";
import StatusBadge from "./StatusBadge";

type ContextData = {
    task_type: string;
    document_type: string;
    focus: string[];
};

type AnalystChip = {
    analyst_key: string;
    analyst_label: string;
};

type PlanOverviewProps = {
    routeStatus: "Listo" | "Completado" | "Error";
    estimatedTotalMinutes: number;
    context: ContextData;
    analysts: AnalystChip[];
};

function Chip({
    children,
    muted = false,
}: {
    children: React.ReactNode;
    muted?: boolean;
}) {
    return (
        <span
            className={
                muted
                    ? "inline-flex items-center rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-medium text-slate-600"
                    : "inline-flex items-center rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-medium text-slate-700"
            }
        >
            {children}
        </span>
    );
}

function formatMinutes(minutes: number) {
    if (!minutes || minutes <= 0) return "0 min";
    if (minutes < 60) return `${minutes} min`;

    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return mins > 0 ? `${hours} h ${mins} min` : `${hours} h`;
}

export default function PlanOverview({
    routeStatus,
    estimatedTotalMinutes,
    context,
    analysts,
}: PlanOverviewProps) {
    return (
        <>
            <div className="relative h-[72px] w-full overflow-hidden rounded-t-[8px]">
                <Image
                    src="/banners/banner-tipo1.png"
                    alt=""
                    fill
                    className="object-cover"
                    priority
                />

                <div className="relative z-10 flex h-full items-center justify-between px-7">
                    <h1 className="text-[18px] font-semibold tracking-[-0.02em] text-slate-950 md:text-[28px] px-[0px] py-[6px]">
                        Ruta de Ejecución
                    </h1>
                    <StatusBadge status={routeStatus} />
                </div>
            </div>

            <div className="px-7 pb-6 pt-6">
                <div className="text-sm font-medium text-slate-700">
                    Ruta generada por MinkaBot
                </div>

                <div className="mt-4 flex flex-wrap gap-2">
                    {context.task_type ? <Chip>{context.task_type}</Chip> : null}
                    {context.document_type ? <Chip>{context.document_type}</Chip> : null}
                    {context.focus.map((item, idx) => (
                        <Chip key={`${item}-${idx}`}>{item}</Chip>
                    ))}
                    <Chip muted>🕒 Tiempo estimado: {formatMinutes(estimatedTotalMinutes)}</Chip>
                </div>

                <div className="mt-5">
                    <div className="text-sm font-medium text-slate-700">
                        Analistas seleccionados:
                    </div>

                    <div className="mt-3 flex flex-wrap gap-2">
                        {analysts.length > 0 ? (
                            analysts.map((analyst) => (
                                <Chip key={analyst.analyst_key}>{analyst.analyst_label}</Chip>
                            ))
                        ) : (
                            <Chip muted>Aún no definidos</Chip>
                        )}
                    </div>
                </div>
            </div>
        </>
    );
}