import { apiFetch } from "./http";

export type SessionOut = {
  id: string;
  user_id: string | null;
  status: string;
  created_at: string;
  updated_at: string;
};

export type OrchestratorMessageOut = {
  id: string;
  session_id: string;
  role: "user" | "assistant";
  content: string;
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