"use client";

import { useEffect, useMemo, useRef, useState, useCallback } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { listSessionMessages } from "@/lib/api/sessions";
import { orchestratorTurn } from "@/lib/api/orchestrator";
import { API_BASE } from "@/lib/api/http";
import {
  uploadSessionFile,
  completeFileIntake,
  listSessionFiles,
  type UploadFileResponse,
} from "@/lib/api/files";
import type {
  UIHintsOut,
  UIBulletsOut,
  UIContextOut,
  InteractionMode,
  ActiveStep,
  ConfirmationState,
} from "@/lib/api/orchestrator";
import {
  getInitialUserMessage,
  getTemplateKey,
  getTemplateTitle,
} from "@/lib/chat/templates";
import Image from "next/image";
import { ChatBullets } from "@/components/chat/ChatBullets";
import { ChatHints } from "@/components/chat/ChatHints";

type Msg = {
  id: string;
  role: "user" | "assistant";
  content: string;
  ui_hints?: UIHintsOut | null;
  ui_bullets?: UIBulletsOut | null;
  ui_context?: UIContextOut | null;
  interaction_mode?: InteractionMode | null;
  active_step?: ActiveStep | null;
  confirmation_state?: ConfirmationState | null;
  animate?: "user" | "assistant";
  fullText?: string;       // el texto completo a tipear
  isTyping?: boolean;      // si está en modo typewriter
  typingDone?: boolean;    // para desbloquear bullets/hints
  attachmentName?: string;
  attachmentKind?: ProcessedFileKind;
  attachmentUrl?: string | null;
  cta_ready?: boolean | null;
  plan_id?: string | null;
  plan_status?: string | null;
};

function capitalizeFirst(value: string | null | undefined) {
  if (!value) return "";
  return value.charAt(0).toUpperCase() + value.slice(1);
}

function formatUiContextValue(
  field:
    | "task_type"
    | "document_type"
    | "analysis_goal"
    | "input_source"
    | "input_file_name"
    | "uploaded_file_id"
    | "file_uploaded"
    | "file_validation_status"
    | "output_format"
    | "result_type",
  value: string | null | undefined
) {
  if (!value) return "";

  if (field === "input_source") {
    const map: Record<string, string> = {
      local_upload: "Archivo local",
      pending: "Aún no disponible",
      google_drive: "Google Drive",
      paste_text: "Texto pegado en el chat",
    };
    return map[value] ?? capitalizeFirst(value.replaceAll("_", " "));
  }

  if (field === "result_type") {
    const map: Record<string, string> = {
      highlighted_document: "Documento resaltado",
      analysis_report: "Informe",
      executive_summary: "Resumen ejecutivo",
      in_app_explanation: "Explicación en la app",
      dashboard_view: "Vista de dashboard",
    };
    return map[value] ?? capitalizeFirst(value.replaceAll("_", " "));
  }

  if (field === "file_uploaded") {
    if (value === "true") return "Sí";
    if (value === "false") return "No";
  }

  if (field === "file_validation_status") {
    const map: Record<string, string> = {
      accepted: "Validado",
      rejected: "Rechazado",
      pending: "Pendiente",
    };
    return map[value] ?? capitalizeFirst(value.replaceAll("_", " "));
  }

  if (field === "uploaded_file_id") {
    return "";
  }

  return capitalizeFirst(value.replaceAll("_", " "));
}

type DisplayedUiContext = {
  task_type: string;
  document_type: string;
  analysis_goal: string;
  input_source: string;
  input_file_name: string;
  uploaded_file_id: string;
  file_uploaded: string;
  file_validation_status: string;
  output_format: string;
  result_type: string;
  focus: string[];
};

type ProcessedFileKind = "pdf" | "word" | "txt";

type ProcessedFileItem = {
  id: string;
  name: string;
  kind: ProcessedFileKind;
  file: File;
  previewUrl: string | null;
  downloadUrl: string | null;
};

function mapBackendFileToProcessedFile(item: {
  id: string;
  original_filename: string;
  file_extension: string;
}): ProcessedFileItem {
  const ext = (item.file_extension || "").toLowerCase();

  const kind: ProcessedFileKind =
    ext === ".pdf" ? "pdf" : ext === ".doc" || ext === ".docx" ? "word" : "txt";

  return {
    id: item.id,
    name: item.original_filename,
    kind,
    file: new File([], item.original_filename),
    previewUrl: `${API_BASE}/files/preview/${item.id}`,
    downloadUrl: `${API_BASE}/files/download/${item.id}`,
  };
}
const emptyDisplayedUiContext: DisplayedUiContext = {
  task_type: "",
  document_type: "",
  analysis_goal: "",
  input_source: "",
  input_file_name: "",
  uploaded_file_id: "",
  file_uploaded: "",
  file_validation_status: "",
  output_format: "",
  result_type: "",
  focus: [],
};

function arraysEqual(a: string[], b: string[]) {
  if (a.length !== b.length) return false;
  return a.every((item, idx) => item === b[idx]);
}

function normalizeUiContext(uiContext: UIContextOut | null | undefined): UIContextOut | null {
  if (!uiContext || typeof uiContext !== "object") return null;

  return {
    task_type: typeof uiContext.task_type === "string" ? uiContext.task_type : null,
    document_type: typeof uiContext.document_type === "string" ? uiContext.document_type : null,
    analysis_goal: typeof uiContext.analysis_goal === "string" ? uiContext.analysis_goal : null,
    input_source: typeof uiContext.input_source === "string" ? uiContext.input_source : null,
    input_file_name: typeof uiContext.input_file_name === "string" ? uiContext.input_file_name : null,
    uploaded_file_id:
      typeof uiContext.uploaded_file_id === "string" ? uiContext.uploaded_file_id : null,
    file_uploaded:
      typeof uiContext.file_uploaded === "boolean" ? uiContext.file_uploaded : null,
    file_validation_status:
      typeof uiContext.file_validation_status === "string"
        ? uiContext.file_validation_status
        : null,
    upload_deferred:
      typeof uiContext.upload_deferred === "boolean" ? uiContext.upload_deferred : null,
    output_format: typeof uiContext.output_format === "string" ? uiContext.output_format : null,
    result_type: typeof uiContext.result_type === "string" ? uiContext.result_type : null,
    focus: Array.isArray(uiContext.focus)
      ? uiContext.focus.filter((item): item is string => typeof item === "string")
      : [],
  };
}

function isInputLocked(interactionMode: InteractionMode | null | undefined) {
  return interactionMode === "hint_required";
}

function isGuidedMode(interactionMode: InteractionMode | null | undefined) {
  return interactionMode === "guided_options";
}

function isReviewEditMode(interactionMode: InteractionMode | null | undefined) {
  return interactionMode === "review_edit";
}

function getPendingHintAssistantMessageId(messages: Msg[]): string | null {
  for (let i = messages.length - 1; i >= 0; i--) {
    const msg = messages[i];

    if (msg.role !== "assistant") continue;

    const hasHints = (msg.ui_hints?.hints?.length ?? 0) > 0;
    if (!hasHints) return null;

    const hasUserAfter = messages.slice(i + 1).some((next) => next.role === "user");
    if (hasUserAfter) return null;

    return msg.id;
  }

  return null;
}

function getLatestPlanIdFromHistory(
  history: Awaited<ReturnType<typeof listSessionMessages>>
): string | null {
  for (let i = history.length - 1; i >= 0; i--) {
    const msg = history[i];
    if (msg.role !== "assistant") continue;

    const planId = msg.meta?.plan_id;
    if (typeof planId === "string" && planId.trim()) {
      return planId;
    }
  }

  return null;
}

export default function ChatPage() {
  const { sessionId } = useParams<{ sessionId: string }>();
  const router = useRouter();
  const sp = useSearchParams();

  const templateKey = useMemo(() => getTemplateKey(sp.get("template")), [sp]);
  const templateTitle = useMemo(
    () => getTemplateTitle(templateKey),
    [templateKey]
  );

  const presetInitStorageKey = useMemo(
    () => `minkabot:preset-init:${sessionId}:${templateKey}`,
    [sessionId, templateKey]
  );

  const [msgs, setMsgs] = useState<Msg[]>([]);
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(false);

  const [planId, setPlanId] = useState<string | null>(null);
  const [historyLoaded, setHistoryLoaded] = useState(false);

  const [displayedUiContext, setDisplayedUiContext] =
    useState<DisplayedUiContext>(emptyDisplayedUiContext);

  const [draggingFile, setDraggingFile] = useState(false);

  const injectedRef = useRef(false);

  const endRef = useRef<HTMLDivElement | null>(null);
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const [showScrollDown, setShowScrollDown] = useState(false);
  const autoScrollLockUntilRef = useRef<number>(0);
  const lastLockMsgIdRef = useRef<string | null>(null);

  const [dismissedHintMsgIds, setDismissedHintMsgIds] = useState<Set<string>>(
    () => new Set()
  );

  const [showAttachMenu, setShowAttachMenu] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [processedFiles, setProcessedFiles] = useState<ProcessedFileItem[]>([]);

  const [uploadingFile, setUploadingFile] = useState(false);
  const [lastUploadResult, setLastUploadResult] = useState<UploadFileResponse | null>(null);

  const attachMenuRef = useRef<HTMLDivElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // cargar historial
  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        setHistoryLoaded(false);

        const [history, sessionFiles] = await Promise.all([
          listSessionMessages(sessionId),
          listSessionFiles(sessionId, true),
        ]);

        if (cancelled) return;

        setMsgs(
          history.map((m) => {
            const meta = m.meta ?? null;
            return {
              id: m.id,
              role: m.role,
              content: m.content,
              ui_hints: m.role === "assistant" ? meta?.ui_hints ?? null : null,
              ui_bullets: m.role === "assistant" ? meta?.ui_bullets ?? null : null,
              ui_context: m.role === "assistant" ? normalizeUiContext(meta?.ui_context) : null,
              interaction_mode: m.role === "assistant" ? meta?.interaction_mode ?? null : null,
              active_step: m.role === "assistant" ? meta?.active_step ?? null : null,
              confirmation_state: m.role === "assistant" ? meta?.confirmation_state ?? null : null,
              isTyping: false,
              typingDone: true,
            };
          })
        );

        setPlanId(getLatestPlanIdFromHistory(history));
        setProcessedFiles(sessionFiles.map(mapBackendFileToProcessedFile));
      } finally {
        if (!cancelled) {
          setHistoryLoaded(true);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [sessionId]);

  // inyectar primer mensaje del preset solo una vez por sesión/template
  useEffect(() => {
    if (!historyLoaded) return;
    if (injectedRef.current) return;
    if (msgs.length > 0) return;

    const alreadyInitialized =
      typeof window !== "undefined" &&
      sessionStorage.getItem(presetInitStorageKey) === "1";

    if (alreadyInitialized) {
      injectedRef.current = true;
      return;
    }

    injectedRef.current = true;
    sessionStorage.setItem(presetInitStorageKey, "1");

    const initial = getInitialUserMessage(templateKey);
    void sendText(initial, { hiddenUserMessage: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [historyLoaded, msgs.length, templateKey, presetInitStorageKey]);


  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;

    const onScroll = () => {
      const distanceToBottom = el.scrollHeight - el.scrollTop - el.clientHeight;
      setShowScrollDown(distanceToBottom > 160);

      // si el usuario se fue arriba, desactivamos auto-scroll forzado
      if (distanceToBottom > 160) {
        autoScrollLockUntilRef.current = 0;
      }
    };

    onScroll(); // inicial
    el.addEventListener("scroll", onScroll);
    return () => el.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    const onPointerDown = (event: MouseEvent) => {
      const target = event.target as Node;
      if (!attachMenuRef.current?.contains(target)) {
        setShowAttachMenu(false);
      }
    };

    document.addEventListener("mousedown", onPointerDown);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
    };
  }, []);

  useEffect(() => {
    const typingMsg = msgs.find((m) => m.role === "assistant" && m.isTyping && !m.typingDone);
    if (!typingMsg) return;

    let cancelled = false;

    // Config "snappy"
    const CHUNK = 2;        // caracteres por tick (sube a 3-4 si lo quieres más rápido)
    const TICK_MS = 12;     // velocidad (10-16 se siente pro)

    const run = () => {
      if (cancelled) return;

      setMsgs((prev) =>
        prev.map((m) => {
          if (m.id !== typingMsg.id) return m;

          const full = m.fullText ?? "";
          const nextLen = Math.min(full.length, (m.content?.length ?? 0) + CHUNK);
          const nextContent = full.slice(0, nextLen);

          const done = nextLen >= full.length;

          return {
            ...m,
            content: nextContent,
            typingDone: done,
            isTyping: !done,
          };
        })
      );
    };

    const interval = window.setInterval(run, TICK_MS);

    return () => {
      cancelled = true;
      window.clearInterval(interval);
    };
  }, [msgs]);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;

    const last = msgs[msgs.length - 1];
    if (!last || last.role !== "assistant") return;

    // Solo cuando el último mensaje del bot terminó de tipear
    if (last.typingDone !== true) return;

    // Evitar re-lock para el mismo msg
    if (lastLockMsgIdRef.current === last.id) return;
    lastLockMsgIdRef.current = last.id;

    // --- calcula ventana aproximada donde crecerá el contenido (bullets/hints) ---
    const bulletsCount = last.ui_bullets?.items?.length ?? 0;
    const hintsCount =
      last.ui_hints?.hints?.reduce((acc, h) => acc + (h.options?.length ?? 0), 0) ?? 0;

    const BULLETS_TITLE_MS = 100;
    const BULLETS_GAP_MS = 200;
    const BULLETS_ITEM_MS = 200;
    const AFTER_BULLETS_PAUSE_MS = 250;

    const HINTS_TITLE_MS = 100;
    const HINTS_GAP_MS = 200;
    const HINTS_ITEM_MS = 120;

    const bulletsTotalMs =
      bulletsCount > 0
        ? BULLETS_TITLE_MS + BULLETS_GAP_MS + (bulletsCount - 1) * BULLETS_ITEM_MS
        : 0;

    const hintsTotalMs =
      hintsCount > 0
        ? HINTS_TITLE_MS + HINTS_GAP_MS + (hintsCount - 1) * HINTS_ITEM_MS
        : 0;

    const totalWindowMs =
      bulletsTotalMs + (bulletsCount ? AFTER_BULLETS_PAUSE_MS : 0) + hintsTotalMs;

    // lock durante la animación (+ colchón)
    autoScrollLockUntilRef.current = Date.now() + totalWindowMs + 500;

    // un scroll inmediato al terminar typing ayuda bastante
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [msgs]);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;

    const ro = new ResizeObserver(() => {
      // si estamos en lock, seguimos “pegados” al final
      if (Date.now() < autoScrollLockUntilRef.current) {
        endRef.current?.scrollIntoView({ behavior: "smooth" });
      }
    });

    ro.observe(el);

    return () => {
      ro.disconnect();
    };
  }, []);

  const typeField = useCallback(async (field: keyof Omit<DisplayedUiContext, "focus">, value: string) => {
    await new Promise<void>((resolve) => {
      let i = 0;

      const interval = window.setInterval(() => {
        i += 2;

        setDisplayedUiContext((prev) => ({
          ...prev,
          [field]: value.slice(0, i),
        }));

        if (i >= value.length) {
          window.clearInterval(interval);
          resolve();
        }
      }, 12);
    });
  }, []);

  const latestUiContext = useMemo(() => {
    for (let i = msgs.length - 1; i >= 0; i--) {
      const msg = msgs[i];
      if (msg.role === "assistant" && msg.ui_context) {
        return msg.ui_context;
      }
    }
    return null;
  }, [msgs]);

  const pendingHintMsgId = useMemo(() => {
    return getPendingHintAssistantMessageId(msgs);
  }, [msgs]);

  useEffect(() => {
    if (!latestUiContext) {
      setDisplayedUiContext(emptyDisplayedUiContext);
      return;
    }
    

    setDisplayedUiContext({
      task_type: formatUiContextValue("task_type", latestUiContext.task_type ?? ""),
      document_type: formatUiContextValue("document_type", latestUiContext.document_type ?? ""),
      analysis_goal: formatUiContextValue("analysis_goal", latestUiContext.analysis_goal ?? ""),
      input_source: formatUiContextValue("input_source", latestUiContext.input_source ?? ""),
      input_file_name: formatUiContextValue("input_file_name", latestUiContext.input_file_name ?? ""),
      uploaded_file_id: formatUiContextValue("uploaded_file_id", String(latestUiContext.uploaded_file_id ?? "")),
      file_uploaded: formatUiContextValue("file_uploaded", String(latestUiContext.file_uploaded ?? "")),
      file_validation_status: formatUiContextValue(
        "file_validation_status",
        latestUiContext.file_validation_status ?? ""
      ),
      output_format: formatUiContextValue("output_format", latestUiContext.output_format ?? ""),
      result_type: formatUiContextValue("result_type", latestUiContext.result_type ?? ""),
      focus: Array.isArray(latestUiContext.focus)
        ? latestUiContext.focus.map((item) => capitalizeFirst(item.replaceAll("_", " ")))
        : [],
    });
  }, [latestUiContext]);

  const hasTyping = msgs.some(
    (m) => m.role === "assistant" && m.isTyping && m.typingDone === false
  );

  const latestAssistantInteractionMode = useMemo(() => {
    for (let i = msgs.length - 1; i >= 0; i--) {
      const msg = msgs[i];
      if (msg.role === "assistant" && msg.interaction_mode) {
        return msg.interaction_mode;
      }
    }
    return null;
  }, [msgs]);

  const latestAssistantActiveStep = useMemo(() => {
    for (let i = msgs.length - 1; i >= 0; i--) {
      const msg = msgs[i];
      if (msg.role === "assistant" && msg.active_step) {
        return msg.active_step;
      }
    }
    return null;
  }, [msgs]);

  const inputLockedByInteractionMode = isInputLocked(latestAssistantInteractionMode);
  const isGuidedOptionsMode = isGuidedMode(latestAssistantInteractionMode);
  const isReviewMode = isReviewEditMode(latestAssistantInteractionMode);
  const isFileIntakeStep = latestAssistantActiveStep === "file_intake";

  const attachmentsLocked =
    loading || (inputLockedByInteractionMode && !isFileIntakeStep);

  useEffect(() => {
    if (attachmentsLocked && showAttachMenu) {
      setShowAttachMenu(false);
    }
  }, [attachmentsLocked, showAttachMenu]);


  async function sendText(
    content: string,
    options?: { hiddenUserMessage?: boolean }
  ) {
    if (!content.trim()) return;

    const hiddenUserMessage = options?.hiddenUserMessage === true;

    if (!hiddenUserMessage) {
      setMsgs((prev) => [
        ...prev,
        { id: crypto.randomUUID(), role: "user", content, animate: "user" },
      ]);

      setTimeout(() => {
        endRef.current?.scrollIntoView({ behavior: "smooth" });
      }, 0);

      setTimeout(() => {
        setMsgs((prev) =>
          prev.map((x) => (x.animate ? { ...x, animate: undefined } : x))
        );
      }, 250);
    }

    setLoading(true);

    try {
      const out = await orchestratorTurn(sessionId, content);

      const assistantId = crypto.randomUUID();

      setMsgs((prev) => [
        ...prev,
        {
          id: assistantId,
          role: "assistant",
          content: "",
          fullText: out.reply,
          isTyping: true,
          typingDone: false,
          ui_hints: out.ui_hints ?? null,
          ui_bullets: out.ui_bullets ?? null,
          ui_context: normalizeUiContext(out.ui_context ?? null),
          interaction_mode: out.interaction_mode ?? null,
          active_step: out.active_step ?? null,
          confirmation_state: out.confirmation_state ?? null,
          cta_ready: out.cta_ready ?? false,
          plan_id: out.plan_id ?? null,
          plan_status: out.plan_status ?? null,
          animate: "assistant",
        },
      ]);


      // Si ya existe plan_id, mostrar CTA (NO redirigir automático)
      if (out.plan_id) setPlanId(out.plan_id);
    } finally {
      setLoading(false);
    }
  }

  async function onSend() {
    const c = text;
    const fileToSend = selectedFile;

    if (inputLockedByInteractionMode && !isFileIntakeStep) return;
    if (!c.trim() && !fileToSend) return;

    if (isFileIntakeStep && fileToSend) {
      return;
    }

    setText("");

    if (fileToSend) {
      const fileName = fileToSend.name.toLowerCase();

      const nextKind: ProcessedFileKind = fileName.endsWith(".pdf")
        ? "pdf"
        : fileName.endsWith(".doc") || fileName.endsWith(".docx")
          ? "word"
          : "txt";

      const nextAttachmentUrl = URL.createObjectURL(fileToSend);

      setMsgs((prev) => [
        ...prev,
        {
          id: crypto.randomUUID(),
          role: "user",
          content: "",
          animate: "user",
          attachmentName: fileToSend.name,
          attachmentKind: nextKind,
          attachmentUrl: nextAttachmentUrl,
        },
      ]);

      setTimeout(() => {
        endRef.current?.scrollIntoView({ behavior: "smooth" });
      }, 0);

      setTimeout(() => {
        setMsgs((prev) =>
          prev.map((x) => (x.animate ? { ...x, animate: undefined } : x))
        );
      }, 250);

      setSelectedFile(null);
    }

    if (c.trim()) {
      await sendText(c);
      return;
    }

    // Si por ahora solo se adjunta archivo sin texto, no enviamos turno al backend todavía.
    // Aquí luego podrás conectar el upload real.
  }

  function onClickUploadDocument() {
    setShowAttachMenu(false);
    fileInputRef.current?.click();
  }

  async function handleSelectedFile(file: File) {
    const fileName = file.name.toLowerCase();

    const isPdf = fileName.endsWith(".pdf");
    const isWord = fileName.endsWith(".doc") || fileName.endsWith(".docx");
    const isTxt = fileName.endsWith(".txt");

    const isAllowed = isPdf || isWord || isTxt;

    if (!isAllowed) {
      alert("Solo se permiten archivos PDF, Word o TXT.");
      return;
    }

    setSelectedFile(file);
    setShowAttachMenu(false);
    setUploadingFile(true);
    setLastUploadResult(null);

    try {
      const uploadResult = await uploadSessionFile(sessionId, file);
      setLastUploadResult(uploadResult);

      const uploadedFile = uploadResult.file;

      if (!uploadResult.ok || !uploadedFile) {
        setMsgs((prev) => [
          ...prev,
          {
            id: crypto.randomUUID(),
            role: "assistant",
            content: uploadResult.message,
            animate: "assistant",
          },
        ]);
        return;
      }

      setMsgs((prev) => [
        ...prev,
        {
          id: crypto.randomUUID(),
          role: "assistant",
          content: uploadResult.message,
          animate: "assistant",
        },
      ]);

      const syncResult = await completeFileIntake(sessionId, uploadedFile.id);
      const refreshedFiles = await listSessionFiles(sessionId, true);
      setProcessedFiles(refreshedFiles.map(mapBackendFileToProcessedFile));

      setMsgs((prev) => [
        ...prev,
        {
          id: crypto.randomUUID(),
          role: "assistant",
          content: "",
          fullText: syncResult.reply,
          isTyping: true,
          typingDone: false,
          ui_hints: syncResult.ui_hints ?? null,
          ui_bullets: syncResult.ui_bullets ?? null,
          ui_context: normalizeUiContext(syncResult.ui_context ?? null),
          interaction_mode: syncResult.interaction_mode ?? null,
          active_step: syncResult.active_step ?? null,
          confirmation_state: syncResult.confirmation_state ?? null,
          cta_ready: syncResult.cta_ready ?? false,
          plan_id: syncResult.plan_id ?? null,
          plan_status: syncResult.plan_status ?? null,
          animate: "assistant",
        },
      ]);

      if (syncResult.plan_id) {
        setPlanId(syncResult.plan_id);
      }

      setSelectedFile(null);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "No se pudo subir el archivo.";

      setLastUploadResult({
        ok: false,
        message,
        file: null,
        ui_context: null,
      });

      setMsgs((prev) => [
        ...prev,
        {
          id: crypto.randomUUID(),
          role: "assistant",
          content: "No se pudo subir el archivo. Intenta nuevamente o hazlo después.",
          animate: "assistant",
        },
      ]);
    } finally {
      setUploadingFile(false);
      setDraggingFile(false);
    }
  }

  async function onFileChange(event: React.ChangeEvent<HTMLInputElement>) {
    const inputEl = event.currentTarget;
    const file = inputEl.files?.[0] ?? null;

    if (!file) {
      inputEl.value = "";
      return;
    }

    if (!isFileIntakeStep) {
      setSelectedFile(file);
      setShowAttachMenu(false);
      inputEl.value = "";
      return;
    }

    try {
      await handleSelectedFile(file);
    } finally {
      inputEl.value = "";
    }
  }

  return (
    <div className="flex h-[calc(100dvh-120px)] min-h-0 flex-col gap-6 overflow-hidden xl:flex-row xl:items-stretch">
      {/* Columna izquierda: Chat */}
      <section className="flex min-h-0 flex-1 flex-col">
        <div className="flex h-full min-h-0 flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          {/* Banner (imagen) + botón Volver encima */}
          <div className="relative">
            <Image
              src="/banners/banner-tipo1.png"
              alt=""
              width={1440}
              height={80}
              className="h-[80px] w-full object-cover"
              priority
            />
            <button
              onClick={() => router.push("/")}
              className="absolute top-5 right-4 rounded-xl border border-white/40 bg-white/70 px-3 py-2 text-sm font-semibold text-slate-800 backdrop-blur hover:bg-white"
              type="button"
            >
              Volver
            </button>
          </div>

          {/* Contenedor del chat */}
          <div className="relative flex h-full min-h-0 flex-col">
            {/* Mensajes */}
            <div ref={scrollRef} className="flex-1 overflow-y-auto px-6 py-5">
              {msgs.map((m) => (
                <div
                  key={m.id}
                  className={
                    m.animate === "user"
                      ? "animate-[minkaUserIn_220ms_ease-out]"
                      : "animate-[minkaIn_300ms_ease-out]"
                  }
                  style={{
                    maxWidth: 820,
                    marginLeft: m.role === "user" ? "auto" : 0,
                    marginBottom: 18,
                  }}
                >
                  {/* mensaje */}
                  {m.role === "assistant" && (
                    <div className="flex items-flex gap-6">
                      <img
                        src="/chat-items/ai-symbol.png"
                        alt="MinkaBot"
                        className="h-10 w-10 rounded-xl"
                        draggable={false}
                      />

                      <div className="flex-1 max-w-[520px] pt-2">
                        <div className="text-[14px] leading-relaxed text-slate-1000 whitespace-pre-wrap">
                          <span>
                            {m.content}
                            {m.isTyping && m.typingDone === false ? (
                              <span
                                className="ml-[2px] inline-block h-[14px] w-[2px] align-middle bg-slate-700 animate-[minkaCursor_900ms_infinite]"
                                aria-hidden="true"
                              />
                            ) : null}
                          </span>
                        </div>

                        {m.active_step === "file_intake" && m.typingDone !== false ? (
                          <div className="mt-5 flex justify-start">
                            <div
                              onDragOver={(e) => {
                                e.preventDefault();
                                if (!uploadingFile) setDraggingFile(true);
                              }}
                              onDragLeave={(e) => {
                                e.preventDefault();
                                setDraggingFile(false);
                              }}
                              onDrop={(e) => {
                                e.preventDefault();
                                setDraggingFile(false);

                                if (uploadingFile) return;

                                const droppedFile = e.dataTransfer.files?.[0] ?? null;
                                if (!droppedFile) return;

                                void handleSelectedFile(droppedFile);
                              }}
                              className={[
                                "group relative w-full max-w-[500px] overflow-hidden rounded-[20px] border border-dashed px-5 py-5 text-center transition-all duration-200",
                                draggingFile
                                  ? "border-indigo-400 bg-indigo-50/70 shadow-[0_0_0_4px_rgba(99,102,241,0.08)]"
                                  : "border-slate-300 bg-[#FCFCFD] hover:border-slate-400 hover:bg-slate-50",
                                uploadingFile ? "pointer-events-none opacity-80" : "",
                              ].join(" ")}
                            >
                              <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(99,102,241,0.08),_transparent_45%)]" />

                              <div className="relative mx-auto flex max-w-[420px] flex-col items-center">
                                <div
                                  className={[
                                    "mb-4 flex h-14 w-14 items-center justify-center rounded-2xl border transition-all duration-200",
                                    draggingFile
                                      ? "border-indigo-200 bg-white"
                                      : "border-slate-200 bg-white",
                                  ].join(" ")}
                                >
                                  <Image
                                    src="/chat-items/upload-icon-2.svg"
                                    alt="Subir archivo"
                                    width={26}
                                    height={26}
                                    className="h-[26px] w-[26px] object-contain"
                                  />
                                </div>

                                <div className="text-[16px] font-semibold text-slate-900">
                                  {uploadingFile
                                    ? "Estamos subiendo tu archivo…"
                                    : draggingFile
                                      ? "Suelta tu archivo aquí"
                                      : "Sube tu archivo para continuar"}
                                </div>

                                <div className="mt-2 max-w-[380px] text-sm leading-6 text-slate-500">
                                  Arrástralo y suéltalo aquí o selecciónalo desde tu dispositivo.
                                  Aceptamos archivos PDF, Word y TXT.
                                </div>

                                <div className="mt-5 flex flex-wrap items-center justify-center gap-3">
                                  <button
                                    type="button"
                                    onClick={onClickUploadDocument}
                                    disabled={uploadingFile}
                                    className="inline-flex min-w-[140px] items-center justify-center rounded-xl border border-slate-300 bg-white px-5 py-2.5 text-sm font-semibold text-slate-700 shadow-sm transition hover:border-slate-400 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
                                  >
                                    {uploadingFile ? "Subiendo..." : "Subir archivo"}
                                  </button>

                                  <button
                                    type="button"
                                    onClick={() => void sendText("Lo haré después")}
                                    disabled={uploadingFile || loading}
                                    className="inline-flex items-center justify-center rounded-xl px-3 py-2 text-sm font-medium text-slate-500 transition hover:bg-slate-100 hover:text-slate-700 disabled:cursor-not-allowed disabled:opacity-50"
                                  >
                                    Lo haré después
                                  </button>
                                </div>

                                <div className="mt-4 flex flex-wrap items-center justify-center gap-2 text-xs text-slate-400">
                                  <span className="rounded-full border border-slate-200 bg-white px-2.5 py-1">
                                    PDF
                                  </span>
                                  <span className="rounded-full border border-slate-200 bg-white px-2.5 py-1">
                                    DOC / DOCX
                                  </span>
                                  <span className="rounded-full border border-slate-200 bg-white px-2.5 py-1">
                                    TXT
                                  </span>
                                </div>

                                {lastUploadResult && !lastUploadResult.ok ? (
                                  <div className="mt-5 w-full rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
                                    {lastUploadResult.message}
                                  </div>
                                ) : null}
                              </div>
                            </div>
                          </div>
                        ) : null}

                        <div className="mt-2 space-y-3">
                          {(() => {
                            const canShowExtras = m.typingDone !== false;
                            if (!canShowExtras) return null;

                            const bulletsCount = m.ui_bullets?.items?.length ?? 0;

                            const BULLETS_TITLE_MS = 100;
                            const BULLETS_GAP_MS = 200;
                            const BULLETS_ITEM_MS = 200;
                            const AFTER_BULLETS_PAUSE_MS = 250;

                            const bulletsTotalMs =
                              bulletsCount > 0
                                ? BULLETS_TITLE_MS +
                                BULLETS_GAP_MS +
                                (bulletsCount - 1) * BULLETS_ITEM_MS
                                : 0;

                            const hintsBaseDelay = bulletsCount
                              ? bulletsTotalMs + AFTER_BULLETS_PAUSE_MS
                              : 0;

                            return (
                              <div className="mt-2 space-y-3">
                                {m.ui_bullets ? (
                                  <ChatBullets
                                    bullets={m.ui_bullets}
                                    baseDelayMs={BULLETS_TITLE_MS}
                                  />
                                ) : null}

                                {m.ui_hints &&
                                  pendingHintMsgId === m.id &&
                                  !dismissedHintMsgIds.has(m.id) &&
                                  m.active_step !== "file_intake" ? (
                                  <ChatHints
                                    hints={m.ui_hints}
                                    baseDelayMs={hintsBaseDelay}
                                    onPick={(v) => {
                                      const normalized = (v || "").trim().toLowerCase();

                                      if (
                                        m.active_step === "file_intake" &&
                                        (normalized === "subir ahora" || normalized === "subir archivo ahora")
                                      ) {
                                        onClickUploadDocument();
                                        return;
                                      }

                                      setDismissedHintMsgIds((prev) => {
                                        const next = new Set(prev);
                                        next.add(m.id);
                                        return next;
                                      });

                                      void sendText(v);
                                    }}
                                  />
                                ) : null}
                              </div>
                            );
                          })()}
                        </div>
                      </div>
                    </div>
                  )}
                  {m.role === "user" && (
                    <div className="flex justify-end">
                      {m.attachmentName && m.attachmentKind ? (
                        <button
                          type="button"
                          onClick={() => {
                            if (m.attachmentUrl) {
                              window.open(m.attachmentUrl, "_blank", "noopener,noreferrer");
                            }
                          }}
                          className="max-w-[280px] min-w-[100px] rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-sm transition hover:border-slate-300 hover:shadow-md"
                          title="Abrir archivo"
                        >
                          <div className="flex items-center gap-3">
                            <div
                              className={
                                m.attachmentKind === "pdf"
                                  ? "shrink-0 flex h-10 w-10 items-center justify-center rounded-xl bg-red-100 text-xs font-bold text-red-600"
                                  : m.attachmentKind === "word"
                                    ? "shrink-0 flex h-10 w-10 items-center justify-center rounded-xl bg-blue-100 text-xs font-bold text-blue-600"
                                    : "shrink-0 flex h-10 w-10 items-center justify-center rounded-xl bg-slate-200 text-xs font-bold text-slate-700"
                              }
                            >
                              {m.attachmentKind === "pdf"
                                ? "PDF"
                                : m.attachmentKind === "word"
                                  ? "DOC"
                                  : "TXT"}
                            </div>

                            <div className="min-w-0 text-center">
                              <div className="truncate text-sm font-medium text-slate-900">
                                {m.attachmentName}
                              </div>
                            </div>
                          </div>
                        </button>
                      ) : (
                        <div className="rounded-[10px] bg-[#EEEEEE] border border-[#E7E7E7] p-[3px]">
                          <div
                            className="max-w-[490px] rounded-[5px] px-3 py-1.5 text-white text-[14px] shadow-sm"
                            style={{
                              backgroundImage: "url('/chat-items/user-msg-rectangle.png')",
                              backgroundSize: "100% 100%",
                              backgroundRepeat: "no-repeat",
                              backgroundPosition: "center",
                              display: "flex",
                              alignItems: "center",
                            }}
                          >
                            {m.content}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}

              {loading && !hasTyping ? (
                <div className="mb-4 max-w-[820px] animate-[minkaIn_300ms_ease-out]">
                  <div className="flex items-start gap-3">
                    <img
                      src="/chat-items/ai-symbol.png"
                      alt="MinkaBot"
                      className="h-10 w-10 rounded-xl animate-[minkaPulse_1.2s_ease-in-out_infinite]"
                      draggable={false}
                    />

                    <div className="flex-1 max-w-[520px]">
                      <div
                        className="inline-flex items-center gap-2 rounded-[8px] px-3.5 py-1.5 text-[14px] leading-relaxed text-slate-900 border border-[#E7E7E7]"
                        style={{
                          background: "linear-gradient(90deg, #EAEAEA 0%, #E2E2E2 100%)",
                        }}
                      >
                        <span>Analizando</span>
                        <span className="inline-flex gap-1">
                          <span className="h-1 w-1 rounded-full bg-slate-600 animate-[minkaDot_1s_infinite] [animation-delay:0ms]" />
                          <span className="h-1 w-1 rounded-full bg-slate-600 animate-[minkaDot_1s_infinite] [animation-delay:150ms]" />
                          <span className="h-1 w-1 rounded-full bg-slate-600 animate-[minkaDot_1s_infinite] [animation-delay:300ms]" />
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              ) : null}
              <div ref={endRef} />
            </div>

            {showScrollDown ? (
              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  const el = scrollRef.current;
                  if (!el) return;
                  el.scrollTo({ top: el.scrollHeight, behavior: "smooth" });
                }}
                className="absolute bottom-18 left-1/2 -translate-x-1/2 grid h-10 w-10 place-items-center py-35"
                title="Ir al final"
              >
                <img
                  src="/chat-items/scroll-down-button.png"
                  alt="Ir al final"
                  className="h-8 w-8"
                  draggable={false}
                />
              </button>
            ) : null}

            {/* CTA plan */}
            {planId ? (
              <div className="pb-3 flex justify-center">
                <div className="w-fit bg-transparent">
                  <div className="rounded-[10px] border border-[#E7E7E7] bg-[#EEEEEE] p-[3px]">
                    <button
                      onClick={() => router.push(`/plans/${planId}`)}
                      className="w-[120px] rounded-[8px] bg-black px-4 py-3 text-sm font-extrabold text-white shadow-sm hover:opacity-95"
                    >
                      Ruta creada
                    </button>
                  </div>
                </div>
              </div>
            ) : null}

            {/* Input (mockup) */}
            <div className="px-7 pb-4 bg-transparent">
              <div className="relative flex items-center rounded-full border border-slate-200 bg-white shadow-sm pl-1 pr-1 py-0">
                {/* + dentro */}
                <div ref={attachMenuRef} className="relative mr-2">
                  <button
                    className="grid h-10 w-10 place-items-center rounded-full text-slate-500 transition-transform duration-150 ease-out hover:scale-110 active:scale-95 hover:text-slate-700 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:scale-100"
                    type="button"
                    title={attachmentsLocked ? "No disponible en este paso" : "Adjuntar"}
                    disabled={attachmentsLocked}
                    onClick={() => {
                      if (attachmentsLocked) return;
                      setShowAttachMenu((prev) => !prev);
                    }}
                  >
                    <span className="text-[40px] leading-none">+</span>
                  </button>

                  {showAttachMenu ? (
                    <div className="absolute bottom-[52px] left-0 z-20 min-w-[200px] rounded-xl border border-slate-200 bg-white p-2 shadow-lg">
                      <button
                        type="button"
                        onClick={onClickUploadDocument}
                        className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm font-medium text-slate-700 hover:bg-slate-100"
                      >
                        <Image
                          src="/chat-items/upload-icon.svg"
                          alt="Subir documento"
                          width={20}
                          height={20}
                          className="shrink-0"
                        />
                        <span>Subir documento</span>
                      </button>
                    </div>
                  ) : null}

                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".pdf,.doc,.docx,.txt,application/pdf,text/plain,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                    className="hidden"
                    onChange={onFileChange}
                  />
                </div>

                {/* input */}
                <input
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  placeholder={
                    inputLockedByInteractionMode
                      ? "Selecciona una de las opciones para continuar…"
                      : isReviewMode
                        ? "Indica qué quieres corregir…"
                        : isGuidedOptionsMode
                          ? "Puedes escribir, pero lo ideal es elegir una opción…"
                          : "Escribe tu mensaje…"
                  }
                  disabled={loading || inputLockedByInteractionMode}
                  className="flex-1 h-10 bg-transparent text-sm outline-none text-slate-700 placeholder:text-slate-400 disabled:opacity-60"
                  onKeyDown={(e) => {
                    if (e.key === "Enter") void onSend();
                  }}
                />

                {/* botón enviar dentro */}
                <button
                  onClick={() => void onSend()}
                  disabled={loading || inputLockedByInteractionMode}
                  className="ml-3 grid h-8 w-8 place-items-center rounded-full bg-[#5B63FF] text-white shadow-md hover:opacity-95 disabled:opacity-100 disabled:cursor-not-allowed"
                  type="button"
                  title={loading ? "Procesando..." : "Enviar"}
                  style={{
                    backgroundImage: loading
                      ? "url(/chat-items/send-button-without-arrow.png)"
                      : "url(/chat-items/send-button.png)",
                    backgroundSize: "cover",
                    backgroundRepeat: "no-repeat",
                    backgroundPosition: "center",
                  }}
                >
                  {loading ? (
                    <span className="inline-flex items-center gap-1">
                      <span className="h-1 w-1 rounded-full bg-white animate-[minkaDot_1s_infinite] [animation-delay:0ms]" />
                      <span className="h-1 w-1 rounded-full bg-white animate-[minkaDot_1s_infinite] [animation-delay:150ms]" />
                      <span className="h-1 w-1 rounded-full bg-white animate-[minkaDot_1s_infinite] [animation-delay:300ms]" />
                    </span>
                  ) : null}
                </button>
              </div>

              {selectedFile ? (
                <div className="mt-3 flex items-center gap-2 px-2">
                  <span className="rounded-full border border-slate-200 bg-slate-100 px-3 py-1 text-xs font-medium text-slate-700">
                    {selectedFile.name}
                  </span>

                  <button
                    type="button"
                    onClick={() => setSelectedFile(null)}
                    className="text-xs font-medium text-slate-500 hover:text-slate-700"
                  >
                    Quitar
                  </button>
                </div>
              ) : null}
            </div>
          </div>
        </div>
      </section>

      {/* Columna derecha: contexto + archivos */}
      <aside className="flex min-h-0 w-full xl:w-[32%] xl:min-w-[300px] xl:max-w-[380px]">
        <div className="flex h-full min-h-0 flex-1 flex-col rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex min-h-0 flex-1 flex-col">
            <div className="text-sm font-semibold text-slate-900">
              Contexto según MinkaBot
            </div>

            <div className="mt-3 min-h-0 flex-1 overflow-y-auto rounded-xl border border-slate-200 bg-slate-50 p-4">
              {!displayedUiContext.task_type &&
                !displayedUiContext.document_type &&
                !displayedUiContext.analysis_goal &&
                !displayedUiContext.result_type &&
                !displayedUiContext.input_source &&
                !displayedUiContext.input_file_name &&
                !displayedUiContext.output_format &&
                displayedUiContext.focus.length === 0 ? (
                <div className="flex min-h-[280px] items-center justify-center text-center text-sm text-slate-500">
                  El contexto aparecerá aquí conforme MinkaBot entienda mejor tu meta.
                </div>
              ) : (
                <div className="space-y-4">
                  {displayedUiContext.task_type ? (
                    <div>
                      <div className="text-[13px] font-semibold uppercase tracking-[0.08em] text-slate-500">
                        Tipo de tarea
                      </div>
                      <div className="mt-2 flex flex-wrap gap-2">
                        <span className="rounded-full border border-blue-200 bg-blue-50 px-3 py-1 text-xs font-medium text-blue-800">
                          {displayedUiContext.task_type}
                        </span>
                      </div>
                    </div>
                  ) : null}

                  {displayedUiContext.document_type ? (
                    <div>
                      <div className="text-[13px] font-semibold uppercase tracking-[0.08em] text-slate-500">
                        Tipo de documento
                      </div>
                      <div className="mt-2 flex flex-wrap gap-2">
                        <span className="rounded-full border border-red-300 bg-red-100 px-3 py-1 text-xs font-medium text-red-900">
                          {displayedUiContext.document_type}
                        </span>
                      </div>
                    </div>
                  ) : null}

                  {displayedUiContext.analysis_goal ? (
                    <div>
                      <div className="text-[13px] font-semibold uppercase tracking-[0.08em] text-slate-500">
                        Objetivo del análisis
                      </div>
                      <div className="mt-2 flex flex-wrap gap-2">
                        <span className="rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-xs font-medium text-amber-800">
                          {displayedUiContext.analysis_goal}
                        </span>
                      </div>
                    </div>
                  ) : null}

                  {displayedUiContext.result_type ? (
                    <div>
                      <div className="text-[13px] font-semibold uppercase tracking-[0.08em] text-slate-500">
                        Tipo de resultado
                      </div>
                      <div className="mt-2 flex flex-wrap gap-2">
                        <span className="rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-xs font-medium text-amber-800">
                          {displayedUiContext.result_type}
                        </span>
                      </div>
                    </div>
                  ) : null}

                  {displayedUiContext.input_source ? (
                    <div>
                      <div className="text-[13px] font-semibold uppercase tracking-[0.08em] text-slate-500">
                        Fuente de entrada
                      </div>
                      <div className="mt-2 flex flex-wrap gap-2">
                        <span className="rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-800">
                          {displayedUiContext.input_source}
                        </span>
                      </div>
                    </div>
                  ) : null}

                  {displayedUiContext.input_file_name ? (
                    <div>
                      <div className="text-[13px] font-semibold uppercase tracking-[0.08em] text-slate-500">
                        Archivo
                      </div>
                      <div className="mt-2 flex flex-wrap gap-2">
                        <span className="rounded-full border border-orange-200 bg-orange-50 px-3 py-1 text-xs font-medium text-orange-700">
                          {displayedUiContext.input_file_name}
                        </span>
                      </div>
                    </div>
                  ) : null}

                  {displayedUiContext.output_format ? (
                    <div>
                      <div className="text-[13px] font-semibold uppercase tracking-[0.08em] text-slate-500">
                        Formato de salida
                      </div>
                      <div className="mt-2 flex flex-wrap gap-2">
                        <span className="rounded-full border border-fuchsia-200 bg-fuchsia-100 px-3 py-1 text-xs font-medium text-fuchsia-700">
                          {displayedUiContext.output_format}
                        </span>
                      </div>
                    </div>
                  ) : null}

                  {Array.isArray(displayedUiContext.focus) &&
                    displayedUiContext.focus.length > 0 ? (
                    <div>
                      <div className="text-[13px] font-semibold uppercase tracking-[0.08em] text-slate-500">
                        Enfoque
                      </div>
                      <div className="mt-2 flex flex-wrap gap-2">
                        {displayedUiContext.focus.map((item, idx) => (
                          <span
                            key={`${item}-${idx}`}
                            className="rounded-full border border-violet-300 bg-violet-100 px-3 py-1 text-xs font-medium text-violet-900"
                          >
                            {capitalizeFirst(item)}
                          </span>
                        ))}
                      </div>
                    </div>
                  ) : null}
                </div>
              )}
            </div>
          </div>

          <div className="mt-6 border-t border-slate-100 pt-6">
            <div className="text-sm font-semibold text-slate-900">
              Archivos procesados
            </div>

            <div className="mt-3 max-h-[240px] overflow-y-auto space-y-3 pr-1">
              {processedFiles.length === 0 ? (
                <div className="flex min-h-[160px] items-center justify-center rounded-xl border border-dashed border-slate-200 bg-slate-50 text-sm text-slate-500">
                  Aún no hay archivos procesados.
                </div>
              ) : (
                processedFiles.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center justify-between rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-sm transition hover:border-slate-300 hover:shadow-md"
                  >
                    <div
                      role={item.previewUrl ? "button" : undefined}
                      tabIndex={item.previewUrl ? 0 : -1}
                      onClick={() => {
                        if (item.previewUrl) {
                          window.open(item.previewUrl, "_blank", "noopener,noreferrer");
                        }
                      }}
                      onKeyDown={(e) => {
                        if (!item.previewUrl) return;
                        if (e.key === "Enter" || e.key === " ") {
                          e.preventDefault();
                          window.open(item.previewUrl, "_blank", "noopener,noreferrer");
                        }
                      }}
                      className={`flex min-w-0 flex-1 items-center gap-3 ${item.previewUrl ? "cursor-pointer" : ""
                        }`}
                    >
                      <div
                        className={
                          item.kind === "pdf"
                            ? "shrink-0 flex h-10 w-10 items-center justify-center rounded-xl bg-red-100 text-xs font-bold text-red-600"
                            : item.kind === "word"
                              ? "shrink-0 flex h-10 w-10 items-center justify-center rounded-xl bg-blue-100 text-xs font-bold text-blue-600"
                              : "shrink-0 flex h-10 w-10 items-center justify-center rounded-xl bg-slate-200 text-xs font-bold text-slate-700"
                        }
                      >
                        {item.kind === "pdf" ? "PDF" : item.kind === "word" ? "DOC" : "TXT"}
                      </div>

                      <div className="min-w-0">
                        <div className="truncate text-sm font-medium text-slate-900">
                          {item.name}
                        </div>
                      </div>
                    </div>

                    {item.downloadUrl ? (
                      <a
                        href={item.downloadUrl}
                        download={item.name}
                        className="ml-3 shrink-0 rounded-lg p-2 text-slate-500 hover:bg-slate-100 hover:text-slate-700"
                        title="Descargar"
                      >
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          className="h-5 w-5"
                        >
                          <path d="M12 3v12" />
                          <path d="M7 10l5 5 5-5" />
                          <path d="M5 21h14" />
                        </svg>
                      </a>
                    ) : (
                      <button
                        type="button"
                        disabled
                        className="ml-3 shrink-0 rounded-lg p-2 text-slate-300"
                        title="Descargar"
                      >
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          className="h-5 w-5"
                        >
                          <path d="M12 3v12" />
                          <path d="M7 10l5 5 5-5" />
                          <path d="M5 21h14" />
                        </svg>
                      </button>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </aside>
    </div>
  );
}