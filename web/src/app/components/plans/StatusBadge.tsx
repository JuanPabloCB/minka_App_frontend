type StatusBadgeProps = {
    status: "Listo" | "Completado" | "Error";
};

export default function StatusBadge({ status }: StatusBadgeProps) {
    const styles =
        status === "Completado"
            ? "border-emerald-200 bg-emerald-500 text-white"
            : status === "Error"
                ? "border-red-200 bg-red-500 text-white"
                : "border-blue-200 bg-blue-500 text-white";

    return (
        <div
            className={`inline-flex min-w-[92px] items-center justify-center rounded-xl border px-4 py-2 text-xs font-semibold shadow-sm ${styles}`}
        >
            {status}
        </div>
    );
}