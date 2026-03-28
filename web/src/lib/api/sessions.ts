import { apiFetch } from "./http";
import type {
  UIHintsOut,
  UIBulletsOut,
  UIContextOut,
} from "./orchestrator";

export type SessionOut = {
  id: string;
  user_id: string | null;
  status: string;
  created_at: string;
  updated_at: string;
};

export type OrchestratorMessageMetaOut = {
  ui_hints?: UIHintsOut | null;
  ui_bullets?: UIBulletsOut | null;
  ui_context?: UIContextOut | null;
  meta_understood?: boolean;
  missing_fields?: string[];
  needs_confirmation?: boolean;
  understanding_steps?: string[];
  confidence?: number;
  cta_ready?: boolean;
  plan_created?: boolean;
  plan_id?: string | null;
  plan_status?: string | null;

  interaction_mode?:
  | "free_text"
  | "hint_required"
  | "guided_options"
  | "review_edit"
  | null;
  active_step?:
  | "goal_intent"
  | "document_type"
  | "analysis_goal"
  | "focus"
  | "input_source"
  | "file_intake"
  | "result_type"
  | "output_format"
  | "confirmation"
  | "confirmation_edit"
  | null;
  confirmation_state?: "none" | "awaiting_confirmation" | "editing" | null;
};

export type OrchestratorMessageOut = {
  id: string;
  session_id: string;
  role: "user" | "assistant";
  content: string;
  meta?: OrchestratorMessageMetaOut | null;
  created_at: string;
};

export async function createSession(payload: { user_id: string | null }) {
  // POST /api/v1/sessions
  return apiFetch<SessionOut>("/sessions", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function listSessionMessages(sessionId: string) {
  // GET /api/v1/sessions/{id}/messages
  return apiFetch<OrchestratorMessageOut[]>(`/sessions/${sessionId}/messages`);
}