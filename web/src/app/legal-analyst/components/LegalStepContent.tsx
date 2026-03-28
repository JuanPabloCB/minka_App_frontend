"use client";

import Image from "next/image";
import { useEffect, useMemo, useRef, useState } from "react";
import type { StepRenderBlock, StepUiDefinition } from "../types/legalAnalyst";
import { stepChat } from "../api/stepChat";

type StepConversationMessage =
  | {
      id: string;
      role: "assistant";
      kind: "text";
      content: string;
      displayedContent?: string;
      animate?: boolean;
      isTyping?: boolean;
      typingDone?: boolean;
    }
  | {
      id: string;
      role: "assistant";
      kind: "file_uploader";
      block: StepRenderBlock;
      animate?: boolean;
      revealAfterMessageId?: string;
      visible?: boolean;
    }
  | {
      id: string;
      role: "user";
      kind: "text";
      content: string;
      animate?: boolean;
    };

interface LegalStepContentProps {
  stepId: string | null;
  stepTitle: string;
  stepUi?: StepUiDefinition | null;
  stepOutput: Record<string, any>;
  message: string;
  onMessageChange: (value: string) => void;
  isLoading?: boolean;
  isConfirmEnabled?: boolean;
  onConfirm?: () => void;
  onFileSelected?: (file: File | null) => void;
  fileError?: string | null;
}

const TYPING_CHUNK = 2;
const TYPING_INTERVAL_MS = 22;
const BLOCK_REVEAL_DELAY_MS = 250;

export default function LegalStepContent({
  stepId,
  stepTitle,
  stepUi,
  stepOutput,
  message,
  onMessageChange,
  isLoading = false,
  isConfirmEnabled = false,
  onConfirm,
  onFileSelected,
  fileError,
}: LegalStepContentProps) {
  const hasStepConversation =
    !!stepUi &&
    ((stepUi.initial_messages?.length ?? 0) > 0 ||
      (stepUi.render_blocks?.length ?? 0) > 0);

  const [conversationMessages, setConversationMessages] = useState<
    StepConversationMessage[]
  >([]);
  const [miniChatLoading, setMiniChatLoading] = useState(false);

  const initializedStepRef = useRef<string | null>(null);
  const scrollRef = useRef<HTMLDivElement | null>(null);

  const seededInitialMessages = useMemo<StepConversationMessage[]>(() => {
    if (!stepUi || !stepId) return [];

    const seeded: StepConversationMessage[] = [];
    let lastAssistantTextId: string | null = null;

    for (const msg of stepUi.initial_messages ?? []) {
      const textId = msg.id;
      seeded.push({
        id: textId,
        role: "assistant",
        kind: "text",
        content: msg.content,
        displayedContent: "",
        animate: true,
        isTyping: true,
        typingDone: false,
      });
      lastAssistantTextId = textId;
    }

    for (const block of stepUi.render_blocks ?? []) {
      if (block.type !== "file_uploader") continue;

      seeded.push({
        id: block.id,
        role: "assistant",
        kind: "file_uploader",
        block,
        animate: true,
        revealAfterMessageId: lastAssistantTextId ?? undefined,
        visible: lastAssistantTextId ? false : true,
      });
    }

    return seeded;
  }, [stepUi, stepId]);

  useEffect(() => {
    if (!hasStepConversation || !stepUi || !stepId) {
      setConversationMessages([]);
      initializedStepRef.current = null;
      return;
    }

    if (initializedStepRef.current === stepId) {
      return;
    }

    initializedStepRef.current = stepId;
    setConversationMessages(seededInitialMessages);
  }, [hasStepConversation, seededInitialMessages, stepUi, stepId]);

  useEffect(() => {
    const typingMessage = conversationMessages.find(
      (msg) =>
        msg.role === "assistant" &&
        msg.kind === "text" &&
        msg.isTyping &&
        !msg.typingDone
    );

    if (!typingMessage || typingMessage.kind !== "text") return;

    const interval = window.setInterval(() => {
      setConversationMessages((prev) =>
        prev.map((msg) => {
          if (
            msg.id !== typingMessage.id ||
            msg.role !== "assistant" ||
            msg.kind !== "text"
          ) {
            return msg;
          }

          const full = msg.content ?? "";
          const current = msg.displayedContent ?? "";
          const nextLength = Math.min(full.length, current.length + TYPING_CHUNK);
          const nextDisplayed = full.slice(0, nextLength);
          const done = nextLength >= full.length;

          return {
            ...msg,
            displayedContent: nextDisplayed,
            isTyping: !done,
            typingDone: done,
          };
        })
      );
    }, TYPING_INTERVAL_MS);

    return () => {
      window.clearInterval(interval);
    };
  }, [conversationMessages]);

  useEffect(() => {
    const pendingReveal = conversationMessages.find(
      (msg): msg is Extract<StepConversationMessage, { role: "assistant"; kind: "file_uploader" }> =>
        msg.role === "assistant" &&
        msg.kind === "file_uploader" &&
        msg.visible === false &&
        Boolean(msg.revealAfterMessageId)
    );

    if (!pendingReveal) return;

    const anchorMessage = conversationMessages.find(
      (
        msg
      ): msg is Extract<StepConversationMessage, { role: "assistant"; kind: "text" }> =>
        msg.id === pendingReveal.revealAfterMessageId &&
        msg.role === "assistant" &&
        msg.kind === "text"
    );

    if (!anchorMessage?.typingDone) {
      return;
    }

    const timer = window.setTimeout(() => {
      setConversationMessages((prev) =>
        prev.map((msg) => {
          if (
            msg.id === pendingReveal.id &&
            msg.role === "assistant" &&
            msg.kind === "file_uploader"
          ) {
            return {
              ...msg,
              visible: true,
            };
          }
          return msg;
        })
      );
    }, BLOCK_REVEAL_DELAY_MS);

    return () => {
      window.clearTimeout(timer);
    };
  }, [conversationMessages]);

  useEffect(() => {
    if (!scrollRef.current) return;

    scrollRef.current.scrollTo({
      top: scrollRef.current.scrollHeight,
      behavior: "smooth",
    });
  }, [conversationMessages, miniChatLoading]);

  async function handleMiniChatSend() {
    if (!stepId) return;

    const userText = message.trim();
    if (!userText) return;

    onMessageChange("");

    const userMsg: StepConversationMessage = {
      id: crypto.randomUUID(),
      role: "user",
      kind: "text",
      content: userText,
      animate: true,
    };

    setConversationMessages((prev) => [...prev, userMsg]);
    setMiniChatLoading(true);

    try {
      const out = await stepChat({
        step_id: stepId,
        user_message: userText,
        step_output: stepOutput ?? {},
      });

      const assistantMessages: StepConversationMessage[] = [];
      let lastAssistantTextId: string | null = null;

      if (out.reply?.trim()) {
        const assistantTextId = crypto.randomUUID();

        assistantMessages.push({
          id: assistantTextId,
          role: "assistant",
          kind: "text",
          content: out.reply.trim(),
          displayedContent: "",
          animate: true,
          isTyping: true,
          typingDone: false,
        });

        lastAssistantTextId = assistantTextId;
      }

      if (Array.isArray(out.render_blocks)) {
        for (const block of out.render_blocks) {
          if (block.type === "file_uploader") {
            assistantMessages.push({
              id: crypto.randomUUID(),
              role: "assistant",
              kind: "file_uploader",
              block,
              animate: true,
              revealAfterMessageId: lastAssistantTextId ?? undefined,
              visible: lastAssistantTextId ? false : true,
            });
          }
        }
      }

      if (assistantMessages.length === 0) {
        assistantMessages.push({
          id: crypto.randomUUID(),
          role: "assistant",
          kind: "text",
          content: "No hubo una respuesta válida para este paso.",
          displayedContent: "",
          animate: true,
          isTyping: true,
          typingDone: false,
        });
      }

      setConversationMessages((prev) => [...prev, ...assistantMessages]);
    } catch (error) {
      const fallbackText =
        error instanceof Error
          ? error.message
          : "No pude responder en este paso.";

      setConversationMessages((prev) => [
        ...prev,
        {
          id: crypto.randomUUID(),
          role: "assistant",
          kind: "text",
          content: fallbackText,
          displayedContent: "",
          animate: true,
          isTyping: true,
          typingDone: false,
        },
      ]);
    } finally {
      setMiniChatLoading(false);
    }
  }

  return (
    <section className="grid h-full min-h-0 grid-rows-[auto_minmax(0,1fr)_auto] gap-3 overflow-hidden rounded-[14px] border border-slate-200 bg-white p-4">
      <div className="min-h-0">
        <h2 className="mb-2 text-[17px] font-semibold text-slate-900">
          {stepTitle}
        </h2>

        {hasStepConversation ? (
          <p className="text-[13px] text-slate-600">
            Interactúa con el analista dentro del contexto de este paso.
          </p>
        ) : (
          <p className="text-[13px] text-slate-600">
            Visualiza aquí el contenido del paso activo.
          </p>
        )}
      </div>

      <div className="min-h-0 overflow-hidden rounded-[12px] border border-slate-200 bg-slate-50">
        <div ref={scrollRef} className="h-full min-h-0 overflow-y-auto p-3">
          {hasStepConversation && stepUi ? (
            <StepConversationRenderer
              messages={conversationMessages}
              onFileSelected={onFileSelected}
              fileError={fileError}
              isLoading={isLoading}
              miniChatLoading={miniChatLoading}
            />
          ) : (
            <pre className="whitespace-pre-wrap break-words text-[12px] leading-6 text-slate-700">
              {JSON.stringify(stepOutput, null, 2)}
            </pre>
          )}
        </div>
      </div>

      <BottomComposer
        message={message}
        onMessageChange={onMessageChange}
        isConfirmEnabled={isConfirmEnabled}
        onConfirm={onConfirm}
        isLoading={isLoading || miniChatLoading}
        onSend={handleMiniChatSend}
      />
    </section>
  );
}

function StepConversationRenderer({
  messages,
  onFileSelected,
  fileError,
  isLoading,
  miniChatLoading,
}: {
  messages: StepConversationMessage[];
  onFileSelected?: (file: File | null) => void;
  fileError?: string | null;
  isLoading?: boolean;
  miniChatLoading?: boolean;
}) {
  return (
    <div className="space-y-4">
      {messages.map((msg) => {
        if (msg.role === "assistant" && msg.kind === "text") {
          return (
            <div
              key={msg.id}
              className={msg.animate ? "animate-[minkaIn_300ms_ease-out]" : undefined}
            >
              <div className="flex items-start gap-3">
                <Image
                  src="/chat-items/ai-symbol.png"
                  alt="MinkaBot"
                  width={24}
                  height={24}
                  className="mt-1 h-6 w-6 shrink-0"
                  draggable={false}
                />

                <div className="pt-0.5 text-[14px] leading-relaxed text-slate-800 whitespace-pre-wrap">
                  {msg.displayedContent ?? ""}
                  {msg.isTyping ? (
                    <span
                      className="ml-[2px] inline-block h-[14px] w-[2px] align-middle bg-slate-700 animate-[minkaCursor_900ms_infinite]"
                      aria-hidden="true"
                    />
                  ) : null}
                </div>
              </div>
            </div>
          );
        }

        if (msg.role === "user" && msg.kind === "text") {
          return (
            <div
              key={msg.id}
              className={
                msg.animate
                  ? "flex justify-end animate-[minkaUserIn_220ms_ease-out]"
                  : "flex justify-end"
              }
            >
              <div className="rounded-[10px] border border-[#E7E7E7] bg-[#EEEEEE] p-[3px]">
                <div
                  className="max-w-[490px] rounded-[5px] px-3 py-1.5 text-[14px] text-white shadow-sm"
                  style={{
                    backgroundImage: "url('/chat-items/user-msg-rectangle.png')",
                    backgroundSize: "100% 100%",
                    backgroundRepeat: "no-repeat",
                    backgroundPosition: "center",
                    display: "flex",
                    alignItems: "center",
                  }}
                >
                  {msg.content}
                </div>
              </div>
            </div>
          );
        }

        if (msg.role === "assistant" && msg.kind === "file_uploader") {
          if (!msg.visible) return null;

          return (
            <div
              key={msg.id}
              className={msg.animate ? "animate-[minkaIn_300ms_ease-out]" : undefined}
            >
              <div className="flex items-start gap-3">
                <Image
                  src="/chat-items/ai-symbol.png"
                  alt="MinkaBot"
                  width={24}
                  height={24}
                  className="mt-1 h-6 w-6 shrink-0"
                  draggable={false}
                />

                <InlineFileUploader
                  label={
                    msg.block.label ??
                    "Arrastra y suelta el archivo aquí, o súbelo desde tu equipo."
                  }
                  acceptedFormats={msg.block.accepted_formats ?? []}
                  onFileSelected={onFileSelected}
                  fileError={fileError}
                  isLoading={isLoading}
                />
              </div>
            </div>
          );
        }

        return null;
      })}

      {miniChatLoading ? (
        <div className="animate-[minkaIn_300ms_ease-out]">
          <div className="flex items-start gap-3">
            <Image
              src="/chat-items/ai-symbol.png"
              alt="MinkaBot"
              width={24}
              height={24}
              className="mt-1 h-6 w-6 shrink-0 animate-[minkaPulse_1.2s_ease-in-out_infinite]"
              draggable={false}
            />

            <div className="pt-0.5">
              <div
                className="inline-flex items-center gap-2 rounded-[8px] border border-[#E7E7E7] px-3.5 py-1.5 text-[14px] leading-relaxed text-slate-900"
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
    </div>
  );
}

function InlineFileUploader({
  label,
  acceptedFormats,
  onFileSelected,
  fileError,
  isLoading,
}: {
  label: string;
  acceptedFormats: string[];
  onFileSelected?: (file: File | null) => void;
  fileError?: string | null;
  isLoading?: boolean;
}) {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [dragActive, setDragActive] = useState(false);

  function handleChooseClick() {
    fileInputRef.current?.click();
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0] || null;
    onFileSelected?.(file);
    e.currentTarget.value = "";
  }

  function handleDrop(e: React.DragEvent<HTMLDivElement>) {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    const file = e.dataTransfer.files?.[0] || null;
    onFileSelected?.(file);
  }

  const accept = acceptedFormats.length
    ? acceptedFormats.map((ext) => `.${ext}`).join(",")
    : ".pdf,.doc,.docx,.txt";

  return (
    <div className="flex-1 pt-1">
      <div
        onDragEnter={(e) => {
          e.preventDefault();
          setDragActive(true);
        }}
        onDragOver={(e) => {
          e.preventDefault();
          setDragActive(true);
        }}
        onDragLeave={(e) => {
          e.preventDefault();
          setDragActive(false);
        }}
        onDrop={handleDrop}
        className={`w-full max-w-[360px] rounded-[12px] border bg-white px-5 py-5 text-center transition-all duration-200 ${
          dragActive
            ? "border-violet-400 bg-violet-50 shadow-[0_0_0_4px_rgba(139,92,246,0.08)]"
            : "border-dashed border-slate-300"
        }`}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept={accept}
          className="hidden"
          onChange={handleFileChange}
        />

        <div className="mb-2 text-[28px] text-slate-400">☁</div>
        <div className="mb-3 text-[13px] text-slate-500">{label}</div>

        <button
          type="button"
          onClick={handleChooseClick}
          className="rounded-[8px] bg-[#5B5CF0] px-5 py-2 text-sm font-medium text-white shadow-sm transition hover:opacity-95"
          disabled={isLoading}
        >
          {isLoading ? "Subiendo..." : "Subir archivo"}
        </button>

        {fileError ? (
          <div className="mt-3 rounded-[10px] border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-600">
            {fileError}
          </div>
        ) : null}
      </div>
    </div>
  );
}

function BottomComposer({
  message,
  onMessageChange,
  isConfirmEnabled,
  onConfirm,
  isLoading,
  onSend,
}: {
  message: string;
  onMessageChange: (value: string) => void;
  isConfirmEnabled?: boolean;
  onConfirm?: () => void;
  isLoading?: boolean;
  onSend?: () => void;
}) {
  return (
    <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-4">
      <div className="relative min-w-0">
        <div className="flex h-[46px] items-center rounded-full border border-slate-200 bg-white pl-3 pr-2 shadow-sm">
          <button
            type="button"
            className="mr-2 grid h-8 w-8 shrink-0 place-items-center rounded-full text-slate-500 transition hover:text-slate-700"
            title="Adjuntar"
          >
            <span className="text-[28px] leading-none">＋</span>
          </button>

          <input
            value={message}
            onChange={(e) => onMessageChange(e.target.value)}
            placeholder="Escribe tu mensaje..."
            className="min-w-0 flex-1 bg-transparent text-[13px] text-slate-700 outline-none placeholder:text-slate-400"
            onKeyDown={(e) => {
              if (e.key === "Enter" && onSend) {
                e.preventDefault();
                void onSend();
              }
            }}
          />

          <button
            type="button"
            disabled={isLoading}
            onClick={onSend}
            className="ml-2 grid h-8 w-8 shrink-0 place-items-center rounded-full bg-[#5B63FF] text-white shadow-md hover:opacity-95 disabled:cursor-not-allowed disabled:opacity-70"
            title={isLoading ? "Procesando..." : "Enviar"}
          >
            ➤
          </button>
        </div>
      </div>

      <button
        type="button"
        onClick={onConfirm}
        disabled={!isConfirmEnabled}
        className={`h-[46px] shrink-0 rounded-[16px] px-6 text-[13px] font-medium text-white shadow-sm transition ${
          isConfirmEnabled
            ? "bg-[#4F23F7] hover:opacity-95"
            : "cursor-not-allowed bg-slate-300 text-slate-100"
        }`}
      >
        Confirmar
      </button>
    </div>
  );
}