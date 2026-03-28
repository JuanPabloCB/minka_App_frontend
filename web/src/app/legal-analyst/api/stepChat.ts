import type { StepRenderBlock } from "../types/legalAnalyst";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://127.0.0.1:8000";
const API_PREFIX = process.env.NEXT_PUBLIC_API_PREFIX ?? "/api/v1";

export type StepChatRequest = {
  step_id: string;
  user_message: string;
  step_output?: Record<string, unknown>;
};

export type StepChatResponse = {
  reply: string;
  render_blocks?: StepRenderBlock[];
};

export async function stepChat(
  payload: StepChatRequest
): Promise<StepChatResponse> {
  const response = await fetch(`${API_BASE_URL}${API_PREFIX}/legal-analyst/step-chat`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Error en stepChat: ${response.status} - ${text}`);
  }

  return response.json();
}