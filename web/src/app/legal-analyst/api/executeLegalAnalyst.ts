import type {
  LegalAnalystExecuteRequest,
  LegalAnalystExecuteResponse,
} from "../types/legalAnalyst";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://127.0.0.1:8000";
const API_PREFIX = process.env.NEXT_PUBLIC_API_PREFIX ?? "/api/v1";

export async function executeLegalAnalyst(
  payload: LegalAnalystExecuteRequest
): Promise<LegalAnalystExecuteResponse> {
  const response = await fetch(
    `${API_BASE_URL}${API_PREFIX}/legal-analyst/execute`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    }
  );

  if (!response.ok) {
    const text = await response.text();
    throw new Error(
      `Error ejecutando Legal Analyst: ${response.status} - ${text}`
    );
  }

  return response.json();
}