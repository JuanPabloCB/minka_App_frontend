"use client";

type StepId =
  | "load_contract"
  | "detect_findings"
  | "prioritize_risks"
  | "practical_interpretation"
  | "generate_marked_contract";

type StepMeta = {
  index: number;
  title: string;
  shortTitle: string;
};

type StepStatus = "locked" | "active" | "completed";

interface LegalStepsSidebarProps {
  stepIds: StepId[];
  currentStep: StepId;
  onSelectStep: (stepId: StepId) => void;
  stepMeta: Record<StepId, StepMeta>;
  stepStatuses: Record<StepId, StepStatus>;
}

export default function LegalStepsSidebar({
  stepIds,
  currentStep,
  onSelectStep,
  stepMeta,
  stepStatuses,
}: LegalStepsSidebarProps) {
  return (
    <aside className="h-full min-h-0 overflow-y-auto rounded-[14px] border border-slate-200 bg-white p-4">
      <h3 className="mb-4 text-[17px] font-medium text-slate-900">
        Pasos a seguir
      </h3>

      <div className="space-y-3">
        {stepIds.map((stepId, idx) => {
          const meta = stepMeta[stepId];
          const isActive = currentStep === stepId;
          const status = stepStatuses[stepId] ?? "locked";
          const isLocked = status === "locked";

          return (
            <button
              key={stepId}
              type="button"
              onClick={() => {
                if (!isLocked) onSelectStep(stepId);
              }}
              disabled={isLocked}
              className={`w-full rounded-[12px] border px-4 py-4 text-left transition-all duration-200 ${
                isActive
                  ? "border-slate-200 bg-slate-100 shadow-sm"
                  : isLocked
                  ? "cursor-not-allowed border-slate-100 bg-slate-50 opacity-60"
                  : "border-slate-100 bg-slate-50 hover:bg-slate-100"
              }`}
            >
              <div className="flex items-start gap-3">
                <div
                  className={`mt-1 flex h-[18px] w-[18px] shrink-0 items-center justify-center rounded-full text-[10px] font-semibold ${
                    status === "completed"
                      ? "bg-green-700 text-white"
                      : status === "active"
                      ? "bg-blue-600 text-white"
                      : "bg-slate-200 text-slate-500"
                  }`}
                >
                  {status === "completed" ? "✓" : status === "active" ? "↻" : "•"}
                </div>

                <div className="min-w-0">
                  <div className="text-[15px] font-medium leading-5 text-slate-800">
                    {meta?.shortTitle || `Paso ${idx + 1}`}
                  </div>

                  <div className="mt-1 text-[13px] leading-5 text-slate-600">
                    {status === "completed"
                      ? "Completo"
                      : status === "active"
                      ? "En curso"
                      : "Bloqueado"}
                  </div>
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </aside>
  );
}