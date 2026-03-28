"use client";

import { useMemo, useState } from "react";
import { useLegalAnalystExecution } from "../hooks/useLegalAnalystExecution";
import type {
  LegalAnalystExecuteRequest,
  StepUiDefinition,
} from "../types/legalAnalyst";
import LegalStepsSidebar from "./LegalStepsSidebar";
import LegalDetailsPanel from "./LegalDetailsPanel";
import LegalStepContent from "./LegalStepContent";
import { uploadContract } from "../api/uploadContract";

interface LegalAnalystShellProps {
  initialPayload?: LegalAnalystExecuteRequest;
  autoExecuteOnMount?: boolean;
}

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

const STEP_META: Record<StepId, StepMeta> = {
  load_contract: {
    index: 1,
    title: "Leer contrato",
    shortTitle: "Cargar Contrato",
  },
  detect_findings: {
    index: 2,
    title: "Hallazgos detectados",
    shortTitle: "Hallazgos Detectados",
  },
  prioritize_risks: {
    index: 3,
    title: "Riesgos priorizados",
    shortTitle: "Riesgos Priorizados",
  },
  practical_interpretation: {
    index: 4,
    title: "Interpretación práctica",
    shortTitle: "Interpretación Práctica",
  },
  generate_marked_contract: {
    index: 5,
    title: "Acción recomendada",
    shortTitle: "Acción Recomendada",
  },
};

const FALLBACK_STEPS: StepId[] = [
  "load_contract",
  "detect_findings",
  "prioritize_risks",
  "practical_interpretation",
  "generate_marked_contract",
];

const FALLBACK_STEP_UI_MAP: Partial<Record<StepId, StepUiDefinition>> = {
  load_contract: {
    step_id: "load_contract",
    title: "Cargar contrato",
    chat_scope: {
      mode: "step_only",
      allowed_topics: [
        "subida de archivo",
        "formatos permitidos",
        "validación del contrato",
        "uso de este paso",
      ],
    },
    initial_messages: [
      {
        id: "msg_load_contract_intro_1",
        type: "assistant_text",
        content:
          "Perfecto. Para comenzar el análisis legal, sube el contrato en PDF, DOCX o TXT.",
        animate: true,
      },
    ],
    render_blocks: [
      {
        id: "block_load_contract_uploader_1",
        type: "file_uploader",
        label: "Arrastra y suelta el archivo aquí, o súbelo desde tu equipo.",
        accepted_formats: ["pdf", "docx", "txt"],
      },
    ],
  },
};

export default function LegalAnalystShell({
  initialPayload,
}: LegalAnalystShellProps) {
  const { data, isLoading, error, execute } = useLegalAnalystExecution();

  const [currentStep, setCurrentStep] = useState<StepId>("load_contract");
  const [message, setMessage] = useState("");

  const [uploadedDocumentId, setUploadedDocumentId] = useState<string | null>(
    null
  );
  const [uploadedFileName, setUploadedFileName] = useState<string | null>(null);
  const [uploadedFileSizeLabel, setUploadedFileSizeLabel] = useState<
    string | null
  >(null);
  const [uploadedPagesLabel, setUploadedPagesLabel] = useState<string | null>(
    null
  );
  const [isUploadingFile, setIsUploadingFile] = useState(false);

  const [completedSteps, setCompletedSteps] = useState<StepId[]>([]);
  const [stepErrors, setStepErrors] = useState<Record<string, string | null>>(
    {}
  );

  const orderedSteps = useMemo<StepId[]>(() => [...FALLBACK_STEPS], []);

  const runtimeContext = data?.runtime_context ?? null;
  const sharedState = runtimeContext?.shared_state ?? {};
  const activeStepOutput = sharedState[currentStep] ?? {};

  const stepUiMap = useMemo<Partial<Record<StepId, StepUiDefinition>>>(() => {
    return {
      ...FALLBACK_STEP_UI_MAP,
      ...((data?.step_ui_map ?? {}) as Partial<Record<StepId, StepUiDefinition>>),
    };
  }, [data?.step_ui_map]);

  const currentStepUi = stepUiMap[currentStep] ?? null;
  const currentStepIndex = orderedSteps.indexOf(currentStep);
  const activeStepTitle = STEP_META[currentStep]?.title ?? "Paso actual";

  const topFilename =
    uploadedFileName ||
    (runtimeContext?.inputs?.filename as string | undefined) ||
    "Sin archivo";

  const topPages =
    uploadedPagesLabel ||
    ((runtimeContext?.inputs?.page_count as string | undefined) ?? "N/D");

  const topSize =
    uploadedFileSizeLabel ||
    ((runtimeContext?.inputs?.file_size as string | undefined) ?? "N/D");

  const topEstimatedTime =
    (runtimeContext?.inputs?.estimated_time as string | undefined) ||
    (initialPayload?.inputs?.estimated_time as string | undefined) ||
    "18 min restantes";

  const progressPercent = useMemo(() => {
    const total = orderedSteps.length || 1;
    return Math.round((completedSteps.length / total) * 100);
  }, [orderedSteps.length, completedSteps.length]);

  const isCurrentStepConfirmable = useMemo(() => {
    if (currentStep === "load_contract") {
      return Boolean(uploadedDocumentId);
    }
    return true;
  }, [currentStep, uploadedDocumentId]);

  function handleStepSelect(stepId: StepId) {
    const clickedIndex = orderedSteps.indexOf(stepId);
    const maxUnlockedIndex = completedSteps.length;

    if (clickedIndex <= maxUnlockedIndex) {
      setCurrentStep(stepId);
      setMessage("");
    }
  }

  async function handleConfirmStep() {
    if (!isCurrentStepConfirmable) {
      if (currentStep === "load_contract") {
        setStepErrors((prev) => ({
          ...prev,
          [currentStep]: "Debes subir un archivo antes de confirmar este paso.",
        }));
      }
      return;
    }

    setStepErrors((prev) => ({
      ...prev,
      [currentStep]: null,
    }));

    if (currentStep === "load_contract" && uploadedDocumentId) {
      const payload: LegalAnalystExecuteRequest = {
        goal_type: initialPayload?.goal_type ?? "critical_clause_detection",
        inputs: {
          ...(initialPayload?.inputs ?? {}),
          document_id: uploadedDocumentId,
          filename: uploadedFileName ?? topFilename,
          source: "uploaded_by_user",
          input_format: "pdf",
          file_size: uploadedFileSizeLabel ?? topSize,
          page_count: uploadedPagesLabel ?? topPages,
          estimated_time: topEstimatedTime,
        },
        assigned_macro_steps: initialPayload?.assigned_macro_steps ?? [],
      };

      const result = await execute(payload);

      if (!result) {
        setStepErrors((prev) => ({
          ...prev,
          load_contract: "No se pudo ejecutar el análisis legal.",
        }));
        return;
      }
    }

    if (!completedSteps.includes(currentStep)) {
      setCompletedSteps((prev) => [...prev, currentStep]);
    }

    const nextStep = orderedSteps[currentStepIndex + 1];
    if (nextStep) {
      setCurrentStep(nextStep);
      setMessage("");
    }
  }

  async function handleFileSelected(file: File | null) {
    setStepErrors((prev) => ({
      ...prev,
      load_contract: null,
    }));

    if (!file) {
      setUploadedDocumentId(null);
      setUploadedFileName(null);
      setUploadedFileSizeLabel(null);
      setUploadedPagesLabel(null);
      return;
    }

    try {
      setIsUploadingFile(true);

      const result = await uploadContract(file);

      setUploadedDocumentId(result.document_id);
      setUploadedFileName(result.filename);
      setUploadedFileSizeLabel(result.size_label);
      setUploadedPagesLabel(
        result.page_count ? `${result.page_count} Páginas` : "PDF"
      );
    } catch (err) {
      const nextMessage =
        err instanceof Error ? err.message : "No se pudo subir el archivo.";

      setUploadedDocumentId(null);
      setUploadedFileName(null);
      setUploadedFileSizeLabel(null);
      setUploadedPagesLabel(null);

      setStepErrors((prev) => ({
        ...prev,
        load_contract: nextMessage,
      }));
    } finally {
      setIsUploadingFile(false);
    }
  }

  const stepStatuses: Record<StepId, StepStatus> = {
    load_contract: "locked",
    detect_findings: "locked",
    prioritize_risks: "locked",
    practical_interpretation: "locked",
    generate_marked_contract: "locked",
  };

  orderedSteps.forEach((stepId, idx) => {
    if (completedSteps.includes(stepId)) {
      stepStatuses[stepId] = "completed";
    } else if (idx === completedSteps.length) {
      stepStatuses[stepId] = "active";
    } else {
      stepStatuses[stepId] = "locked";
    }
  });

  return (
    <section className="flex h-full min-h-0 w-full flex-col overflow-hidden rounded-[18px] border border-slate-200 bg-white px-4 py-4 shadow-sm xl:px-5 xl:py-4">
      <div className="mb-3 flex shrink-0 items-start justify-between">
        <h1 className="text-[26px] font-semibold tracking-[-0.02em] text-slate-900 md:text-[30px]">
          Analista Legal
        </h1>

        <span className="rounded-[10px] bg-[#F5A208] px-4 py-2 text-sm font-semibold text-white shadow-sm">
          En Progreso
        </span>
      </div>

      <div className="mb-3 shrink-0 rounded-[14px] border border-slate-200 px-4 py-3">
        <div className="grid grid-cols-1 gap-4 xl:grid-cols-[1fr_1.25fr]">
          <div className="flex flex-wrap items-center gap-3">
            <div className="inline-flex max-w-full items-center gap-2 rounded-full border border-slate-300 bg-white px-4 py-2 text-sm text-slate-700">
              <span
                className={`h-2 w-2 rounded-full ${
                  topFilename === "Sin archivo" ? "bg-slate-300" : "bg-slate-500"
                }`}
              />
              <span className="truncate">{topFilename}</span>
            </div>

            <div className="inline-flex items-center rounded-full border border-slate-300 bg-white px-4 py-2 text-sm text-slate-700">
              {topPages}
            </div>

            <div className="inline-flex items-center rounded-full border border-slate-300 bg-white px-4 py-2 text-sm text-slate-700">
              {topSize}
            </div>
          </div>

          <div>
            <div className="mb-2 flex items-center justify-between">
              <span className="text-sm text-slate-700">Progreso</span>
              <div className="inline-flex items-center rounded-full border border-slate-300 bg-white px-4 py-1.5 text-sm text-slate-600">
                {topEstimatedTime}
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="h-[8px] flex-1 rounded-full bg-slate-200">
                <div
                  className="h-[8px] rounded-full bg-slate-300 transition-all duration-300"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
              <span className="min-w-[34px] text-sm font-medium text-slate-600">
                {progressPercent}%
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="grid min-h-0 flex-1 grid-cols-1 items-stretch gap-4 overflow-hidden xl:grid-cols-[255px_minmax(0,1fr)_270px]">
        <div className="h-full min-h-0">
          <LegalStepsSidebar
            stepIds={orderedSteps}
            currentStep={currentStep}
            onSelectStep={handleStepSelect}
            stepMeta={STEP_META}
            stepStatuses={stepStatuses}
          />
        </div>

        <div className="h-full min-h-0">
          <LegalStepContent
            stepId={currentStep}
            stepTitle={activeStepTitle}
            stepUi={currentStepUi}
            stepOutput={activeStepOutput}
            message={message}
            onMessageChange={setMessage}
            isLoading={isLoading || isUploadingFile}
            isConfirmEnabled={isCurrentStepConfirmable}
            onConfirm={handleConfirmStep}
            onFileSelected={handleFileSelected}
            fileError={stepErrors[currentStep] ?? null}
          />
        </div>

        <div className="h-full min-h-0">
          <LegalDetailsPanel
            activeStepId={currentStep}
            activeStepTitle={activeStepTitle}
            planningReasoning={data?.planning_reasoning ?? []}
            selectedSteps={data?.selected_steps ?? []}
            orderedSteps={orderedSteps}
            errorMessage={error ? String(error) : null}
          />
        </div>
      </div>
    </section>
  );
}