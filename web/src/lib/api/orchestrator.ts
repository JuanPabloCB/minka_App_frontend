import { apiFetch } from "./http";

export type UIHintChip = { label: string; value: string };

export type UIHint = {
  title?: string;
  chips?: UIHintChip[];
  note?: string;
};

export type OrchestratorTurnOut = {
  session_id: string;
  user_message_id: string;
  assistant_message_id: string;
  reply: string;
  created_at: string;

  cta_ready: boolean;
  plan_created: boolean;
  plan_id: string | null;
  plan_status: string | null;

  ui_hints?: UIHint | null;
};

export async function orchestratorTurn(sessionId: string, content: string) {
  // POST /api/v1/orchestrator/turn/{sessionId}
  return apiFetch<OrchestratorTurnOut>(`/orchestrator/turn/${sessionId}`, {
    method: "POST",
    body: JSON.stringify({ content }),
  });
}