"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useSearchParams, useRouter } from "next/navigation";
import { listSessionMessages } from "@/lib/api/sessions";
import { orchestratorTurn } from "@/lib/api/orchestrator";
import { presetFirstMessage, GoalPresetKey } from "@/lib/chatTemplates";

type Msg = { role: "user" | "assistant"; content: string };

export default function ChatPage() {
  const params = useParams<{ sessionId: string }>();
  const sessionId = params.sessionId;

  const search = useSearchParams();
  const router = useRouter();
  const preset = (search.get("preset") as GoalPresetKey | null) ?? null;

  const [msgs, setMsgs] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);

  const firstPresetMessage = useMemo(() => {
    if (!preset) return null;
    return presetFirstMessage(preset);
  }, [preset]);

  // 1) Cargar historial
  useEffect(() => {
    (async () => {
      const history = await listSessionMessages(sessionId);
      const mapped: Msg[] = history.map((m) => ({ role: m.role, content: m.content }));
      setMsgs(mapped);
    })();
  }, [sessionId]);

  // 2) Si hay preset y el chat está vacío, auto-enviar primer mensaje
  useEffect(() => {
    if (!firstPresetMessage) return;
    if (msgs.length > 0) return;

    (async () => {
      setLoading(true);
      try {
        const out = await orchestratorTurn(sessionId, firstPresetMessage);
        setMsgs([
          { role: "user", content: firstPresetMessage },
          { role: "assistant", content: out.reply },
        ]);

        // si ya creó plan, navega
        if (out.plan_id) router.push(`/plans/${out.plan_id}`);
      } finally {
        setLoading(false);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [firstPresetMessage, sessionId, router, msgs.length]);

  async function send() {
    if (!input.trim()) return;

    const userText = input.trim();
    setInput("");
    setMsgs((prev) => [...prev, { role: "user", content: userText }]);

    setLoading(true);
    try {
      const out = await orchestratorTurn(sessionId, userText);
      setMsgs((prev) => [...prev, { role: "assistant", content: out.reply }]);

      if (out.plan_id) router.push(`/plans/${out.plan_id}`);
    } catch (e: any) {
      setMsgs((prev) => [
        ...prev,
        { role: "assistant", content: `Error: ${e?.message ?? "unknown"}` },
      ]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ padding: 24 }}>
      <h2>Chat Orquestador</h2>

      <div style={{ border: "1px solid #ddd", padding: 12, minHeight: 260, marginTop: 12 }}>
        {msgs.map((m, idx) => (
          <div key={idx} style={{ marginBottom: 10 }}>
            <b>{m.role}:</b> <span>{m.content}</span>
          </div>
        ))}
        {loading && <div>...</div>}
      </div>

      <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          style={{ flex: 1 }}
          placeholder="Escribe..."
        />
        <button onClick={send} disabled={loading}>
          Enviar
        </button>
      </div>
    </div>
  );
}