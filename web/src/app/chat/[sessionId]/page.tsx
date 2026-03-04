"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { listSessionMessages } from "@/lib/api/sessions";
import { orchestratorTurn, UIHint } from "@/lib/api/orchestrator";
import {
  getInitialUserMessage,
  getTemplateKey,
  getTemplateTitle,
} from "@/lib/chat/templates";

type Msg = { role: "user" | "assistant"; content: string };

export default function ChatPage() {
  const { sessionId } = useParams<{ sessionId: string }>();
  const router = useRouter();
  const sp = useSearchParams();

  const templateKey = useMemo(() => getTemplateKey(sp.get("template")), [sp]);
  const templateTitle = useMemo(
    () => getTemplateTitle(templateKey),
    [templateKey]
  );

  const [msgs, setMsgs] = useState<Msg[]>([]);
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(false);

  const [planId, setPlanId] = useState<string | null>(null);
  const [uiHints, setUiHints] = useState<UIHint | null>(null);

  const injectedRef = useRef(false);

  // cargar historial
  useEffect(() => {
    (async () => {
      const history = await listSessionMessages(sessionId);
      setMsgs(history.map((m) => ({ role: m.role, content: m.content })));
    })();
  }, [sessionId]);

  // inyectar primer mensaje del preset si el chat está vacío
  useEffect(() => {
    if (injectedRef.current) return;
    if (msgs.length > 0) return;

    injectedRef.current = true;

    const initial = getInitialUserMessage(templateKey);
    void sendText(initial);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [msgs.length, templateKey]);

  async function sendText(content: string) {
    if (!content.trim()) return;

    setMsgs((prev) => [...prev, { role: "user", content }]);
    setLoading(true);
    setUiHints(null);

    try {
      const out = await orchestratorTurn(sessionId, content);

      setMsgs((prev) => [...prev, { role: "assistant", content: out.reply }]);

      if (out.ui_hints) setUiHints(out.ui_hints);

      // Si ya existe plan_id, mostrar CTA (NO redirigir automático)
      if (out.plan_id) setPlanId(out.plan_id);
    } finally {
      setLoading(false);
    }
  }

  async function onSend() {
    const c = text;
    setText("");
    await sendText(c);
  }

  return (
    <div
      style={{
        height: "100vh",
        display: "flex",
        flexDirection: "column",
        background: "#0b1220",
        color: "white",
      }}
    >
      {/* header */}
      <div
        style={{
          padding: 16,
          borderBottom: "1px solid rgba(255,255,255,.08)",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 12,
        }}
      >
        <div>
          <div style={{ fontWeight: 800, fontSize: 14 }}>{templateTitle}</div>
          <div style={{ opacity: 0.7, fontSize: 12 }}>session: {sessionId}</div>
        </div>

        <button
          onClick={() => router.push("/")}
          style={{
            padding: "10px 12px",
            borderRadius: 12,
            border: "1px solid rgba(255,255,255,.12)",
            background: "rgba(255,255,255,.06)",
            color: "white",
            cursor: "pointer",
            fontWeight: 700,
          }}
        >
          Volver
        </button>
      </div>

      {/* mensajes */}
      <div style={{ flex: 1, overflowY: "auto", padding: 18 }}>
        {msgs.map((m, i) => (
          <div
            key={i}
            style={{
              maxWidth: 820,
              marginLeft: m.role === "user" ? "auto" : 0,
              marginBottom: 10,
              padding: "10px 12px",
              borderRadius: 14,
              background:
                m.role === "user"
                  ? "rgba(37,99,235,.95)"
                  : "rgba(148,163,184,.12)",
              border: "1px solid rgba(255,255,255,.06)",
              whiteSpace: "pre-wrap",
              lineHeight: 1.35,
            }}
          >
            {m.content}
          </div>
        ))}

        {loading && (
          <div
            style={{
              maxWidth: 820,
              marginBottom: 10,
              padding: "10px 12px",
              borderRadius: 14,
              background: "rgba(148,163,184,.12)",
              border: "1px solid rgba(255,255,255,.06)",
            }}
          >
            Analizando...
          </div>
        )}

        {/* UI hints (chips) */}
        {uiHints?.chips?.length ? (
          <div
            style={{
              maxWidth: 820,
              marginTop: 10,
              display: "flex",
              flexWrap: "wrap",
              gap: 8,
            }}
          >
            {uiHints.chips.map((c, idx) => (
              <button
                key={idx}
                onClick={() => sendText(c.value)}
                style={{
                  padding: "8px 10px",
                  borderRadius: 999,
                  background: "rgba(255,255,255,.08)",
                  border: "1px solid rgba(255,255,255,.12)",
                  color: "white",
                  cursor: "pointer",
                  fontWeight: 700,
                }}
              >
                {c.label}
              </button>
            ))}
          </div>
        ) : null}
      </div>

      {/* CTA “Ruta creada” dentro del chat */}
      {planId && (
        <div style={{ padding: "10px 18px" }}>
          <button
            onClick={() => router.push(`/plans/${planId}`)}
            style={{
              width: "100%",
              padding: "12px 14px",
              borderRadius: 14,
              background: "#22c55e",
              color: "#05120a",
              fontWeight: 900,
              border: "none",
              cursor: "pointer",
            }}
          >
            🚀 Ruta creada — abrir ejecución
          </button>
        </div>
      )}

      {/* input */}
      <div
        style={{
          display: "flex",
          gap: 10,
          padding: 14,
          borderTop: "1px solid rgba(255,255,255,.08)",
        }}
      >
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Escribe tu mensaje…"
          style={{
            flex: 1,
            padding: "12px 12px",
            borderRadius: 14,
            border: "1px solid rgba(255,255,255,.10)",
            background: "rgba(255,255,255,.06)",
            color: "white",
            outline: "none",
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter") void onSend();
          }}
        />
        <button
          onClick={() => void onSend()}
          style={{
            padding: "12px 14px",
            borderRadius: 14,
            border: "none",
            background: "#2563eb",
            color: "white",
            fontWeight: 800,
            cursor: "pointer",
          }}
        >
          Enviar
        </button>
      </div>
    </div>
  );
}