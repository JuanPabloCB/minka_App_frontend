import { http } from "./http";

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
  ui_hints?: any;
};

export async function orchestratorTurn(sessionId: string, content: string) {
  return http<OrchestratorTurnOut>(`/orchestrator/turn/${sessionId}`, {
    method: "POST",
    body: { content },
  });
}