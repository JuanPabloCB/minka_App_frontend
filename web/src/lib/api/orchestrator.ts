import { apiFetch } from "./http";

export type UIHintChip = { label: string; value: string };

export type UIHint = {
  title?: string;
  chips?: UIHintChip[];
  note?: string;
};

export type UIHintType = "quick_replies" | "tool_select" | "actions";

export type UIHintOption = {
  key: string;
  label: string;
  value: string | null;
  enabled: boolean;
  reason: string | null;
};

export type UIHintItem = {
  type: UIHintType;
  title?: string | null;
  options: UIHintOption[];
  meta: Record<string, any>;
};

export type UIHintsOut = {
  hints: UIHintItem[];
};

export type UIBulletsVariant = "timeline" | "bullets";

export type UIBulletItem = {
  key: string;
  label: string;
};

export type UIBulletsOut = {
  title?: string | null;
  variant: UIBulletsVariant;
  items: UIBulletItem[];
};

export type UIContextOut = {
  task_type?: string | null;
  document_type?: string | null;
  analysis_goal?: string | null;
  input_source?: string | null;
  input_file_name?: string | null;
  output_format?: string | null;
  focus?: string[] | null;
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

  ui_hints?: UIHintsOut | null;
  ui_bullets?: UIBulletsOut | null;
  ui_context?: UIContextOut | null;
};

export async function orchestratorTurn(sessionId: string, content: string) {
  // POST /api/v1/orchestrator/turn/{sessionId}
  return apiFetch<OrchestratorTurnOut>(`/orchestrator/turn/${sessionId}`, {
    method: "POST",
    body: JSON.stringify({ content }),
  });
}