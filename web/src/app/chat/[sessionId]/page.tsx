"use client";

import { useEffect, useMemo, useRef, useState, useCallback } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { listSessionMessages } from "@/lib/api/sessions";
import { orchestratorTurn } from "@/lib/api/orchestrator";
import type { UIHintsOut, UIBulletsOut, UIContextOut, } from "@/lib/api/orchestrator";
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
  animate?: "user" | "assistant";
  fullText?: string;       // el texto completo a tipear
  isTyping?: boolean;      // si está en modo typewriter
  typingDone?: boolean;    // para desbloquear bullets/hints
  attachmentName?: string;
  attachmentKind?: ProcessedFileKind;
  attachmentUrl?: string | null;
};

function capitalizeFirst(value: string | null | undefined) {
  if (!value) return "";
  return value.charAt(0).toUpperCase() + value.slice(1);
}

type DisplayedUiContext = {
  task_type: string;
  document_type: string;
  analysis_goal: string;
  input_source: string;
  input_file_name: string;
  output_format: string;
  focus: string[];
};

type ProcessedFileKind = "pdf" | "word" | "txt";

type ProcessedFileItem = {
  id: string;
  name: string;
  kind: ProcessedFileKind;
  file: File;
  downloadUrl: string | null;
};

const emptyDisplayedUiContext: DisplayedUiContext = {
  task_type: "",
  document_type: "",
  analysis_goal: "",
  input_source: "",
  input_file_name: "",
  output_format: "",
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
    output_format: typeof uiContext.output_format === "string" ? uiContext.output_format : null,
    focus: Array.isArray(uiContext.focus)
      ? uiContext.focus.filter((item): item is string => typeof item === "string")
      : [],
  };
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

  const attachMenuRef = useRef<HTMLDivElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // cargar historial
  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        setHistoryLoaded(false);

        const history = await listSessionMessages(sessionId);
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
              isTyping: false,
              typingDone: true,
            };
          })
        );

        setPlanId(getLatestPlanIdFromHistory(history));
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
      task_type: capitalizeFirst(latestUiContext.task_type ?? ""),
      document_type: capitalizeFirst(latestUiContext.document_type ?? ""),
      analysis_goal: capitalizeFirst(latestUiContext.analysis_goal ?? ""),
      input_source: capitalizeFirst(latestUiContext.input_source ?? ""),
      input_file_name: capitalizeFirst(latestUiContext.input_file_name ?? ""),
      output_format: capitalizeFirst(latestUiContext.output_format ?? ""),
      focus: Array.isArray(latestUiContext.focus)
        ? latestUiContext.focus.map((item) => capitalizeFirst(item))
        : [],
    });
  }, [latestUiContext]);

  const hasTyping = msgs.some(
    (m) => m.role === "assistant" && m.isTyping && m.typingDone === false
  );

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
          content: "",                 // empieza vacío
          fullText: out.reply,         // guardamos el texto completo
          isTyping: true,
          typingDone: false,
          ui_hints: out.ui_hints ?? null,
          ui_bullets: out.ui_bullets ?? null,
          ui_context: out.ui_context ?? null,
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

    if (!c.trim() && !fileToSend) return;

    setText("");

    if (fileToSend) {
      const fileName = fileToSend.name.toLowerCase();

      const nextKind: ProcessedFileKind = fileName.endsWith(".pdf")
        ? "pdf"
        : fileName.endsWith(".doc") || fileName.endsWith(".docx")
          ? "word"
          : "txt";

      const nextAttachmentUrl = URL.createObjectURL(fileToSend);

      setProcessedFiles((prev) => [
        {
          id: crypto.randomUUID(),
          name: fileToSend.name,
          kind: nextKind,
          file: fileToSend,
          downloadUrl: nextAttachmentUrl,
        },
        ...prev,
      ]);

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

  function onFileChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0] ?? null;

    if (!file) {
      event.currentTarget.value = "";
      return;
    }

    const fileName = file.name.toLowerCase();

    const isPdf = fileName.endsWith(".pdf");
    const isWord = fileName.endsWith(".doc") || fileName.endsWith(".docx");
    const isTxt = fileName.endsWith(".txt");

    const isAllowed = isPdf || isWord || isTxt;

    if (!isAllowed) {
      alert("Solo se permiten archivos PDF, Word o TXT.");
      event.currentTarget.value = "";
      return;
    }

    setSelectedFile(file);

    // preparado para conectar upload real después:
    // aquí luego podrás llamar a una función tipo uploadSessionFile(sessionId, file)

    event.currentTarget.value = "";
  }

  return (
    <div className="flex flex-col gap-6 xl:flex-row">
      {/* Columna izquierda: Chat */}
      <section className="flex-1">
        <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
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
          <div className="relative flex h-[calc(106vh-64px-64px-56px-92px)] flex-col">
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
                                  !dismissedHintMsgIds.has(m.id) ? (
                                  <ChatHints
                                    hints={m.ui_hints}
                                    baseDelayMs={hintsBaseDelay}
                                    onPick={(v) => {
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
            <div className="px-7 pb-4">
              <div className="relative flex items-center rounded-full border border-slate-200 bg-white shadow-sm pl-1 pr-1 py-0">
                {/* + dentro */}
                <div ref={attachMenuRef} className="relative mr-2">
                  <button
                    className="grid h-10 w-10 place-items-center rounded-full text-slate-500 transition-transform duration-150 ease-out hover:scale-110 active:scale-95 hover:text-slate-700 cursor-pointer"
                    type="button"
                    title="Adjuntar"
                    onClick={() => setShowAttachMenu((prev) => !prev)}
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
                  placeholder="Escribe tu mensaje…"
                  disabled={loading}
                  className="flex-1 h-10 bg-transparent text-sm outline-none text-slate-700 placeholder:text-slate-400 disabled:opacity-60"
                  onKeyDown={(e) => {
                    if (e.key === "Enter") void onSend();
                  }}
                />

                {/* botón enviar dentro */}
                <button
                  onClick={() => void onSend()}
                  disabled={loading}
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

      {/* Columna derecha: contexto */}
      <aside className="w-[32%] min-w-[300px] max-w-[380px]">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="text-sm font-semibold text-slate-900">
            Contexto según MinkaBot
          </div>

          <div className="mt-3 h-[476px] overflow-y-auto rounded-xl border border-slate-200 bg-slate-50 p-4">
            {!displayedUiContext.task_type &&
              !displayedUiContext.document_type &&
              !displayedUiContext.analysis_goal &&
              !displayedUiContext.input_source &&
              !displayedUiContext.input_file_name &&
              !displayedUiContext.output_format &&
              displayedUiContext.focus.length === 0 ? (
              <div className="flex h-full items-center justify-center text-center text-sm text-slate-500">
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

        <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="text-sm font-semibold text-slate-900">
            Archivos procesados
          </div>

          <div className="mt-3 h-[160px] overflow-y-auto space-y-3 pr-1">
            {processedFiles.length === 0 ? (
              <div className="flex h-[160px] items-center justify-center rounded-xl border border-dashed border-slate-200 bg-slate-50 text-sm text-slate-500">
                Aún no hay archivos procesados.
              </div>
            ) : (
              processedFiles.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-sm"
                >
                  <div className="flex items-center gap-3 min-w-0">
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
      </aside>
    </div>
  );
}