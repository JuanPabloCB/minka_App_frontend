"use client";

interface LegalDetailsPanelProps {
  activeStepId: string | null;
  activeStepTitle: string;
  planningReasoning: string[];
  selectedSteps: string[];
  orderedSteps: string[];
  errorMessage: string | null;
}

export default function LegalDetailsPanel({
  activeStepId,
  activeStepTitle,
  planningReasoning,
  selectedSteps,
  orderedSteps,
  errorMessage,
}: LegalDetailsPanelProps) {
  return (
    <aside className="min-h-0 overflow-auto rounded-[14px] border border-slate-200 bg-white p-4">
      <h3 className="mb-4 text-[18px] font-medium text-slate-900">Detalles</h3>

      <div className="space-y-5 text-[14px] text-slate-700">
        <div>
          <div className="mb-2 font-medium text-slate-900">Paso actual</div>
          <div className="text-slate-600">{activeStepTitle}</div>
        </div>

        <div>
          <div className="mb-2 font-medium text-slate-900">Resumen</div>
          <div className="space-y-1 text-slate-600">
            <div>Steps seleccionados: {selectedSteps.length}</div>
            <div>Steps ordenados: {orderedSteps.length}</div>
            <div>ID actual: {activeStepId ?? "-"}</div>
          </div>
        </div>

        <div>
          <div className="mb-2 font-medium text-slate-900">Reasoning</div>
          <div className="space-y-2">
            {planningReasoning.length ? (
              planningReasoning.slice(0, 4).map((item, idx) => (
                <div
                  key={idx}
                  className="rounded-[10px] bg-slate-50 p-3 text-slate-600"
                >
                  {item}
                </div>
              ))
            ) : (
              <div className="text-slate-500">Sin reasoning disponible aún.</div>
            )}
          </div>
        </div>

        {errorMessage && (
          <div>
            <div className="mb-2 font-medium text-slate-900">Error</div>
            <div className="rounded-[10px] border border-red-200 bg-red-50 p-3 text-red-600">
              {errorMessage}
            </div>
          </div>
        )}
      </div>
    </aside>
  );
}