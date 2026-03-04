import { http } from "./http";

export type SessionOut = {
  id: string;
  user_id: string | null;
  status: string;
  created_at: string;
  updated_at: string;
};

export async function createSession(payload: { user_id: string | null }) {
  return http<SessionOut>("/sessions", {
    method: "POST",
    body: payload,
  });
}

export async function getSession(sessionId: string) {
  return http<SessionOut>(`/sessions/${sessionId}`);
}

export type OrchestratorMessageOut = {
  id: string;
  session_id: string;
  role: "user" | "assistant";
  content: string;
  created_at: string;
};

export async function listSessionMessages(sessionId: string) {
  return http<OrchestratorMessageOut[]>(`/sessions/${sessionId}/messages`);
}