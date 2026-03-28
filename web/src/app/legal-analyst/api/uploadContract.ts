export interface UploadContractResponse {
  document_id: string;
  filename: string;
  content_type: string;
  size_bytes: number;
  size_label: string;
  page_count: number | null;
  storage_path: string;
}

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://127.0.0.1:8000";
const API_PREFIX = process.env.NEXT_PUBLIC_API_PREFIX ?? "/api/v1";

export async function uploadContract(
  file: File
): Promise<UploadContractResponse> {
  const formData = new FormData();
  formData.append("file", file);

  const response = await fetch(
    `${API_BASE_URL}${API_PREFIX}/legal-analyst/upload-contract`,
    {
      method: "POST",
      body: formData,
    }
  );

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Error subiendo contrato: ${response.status} - ${text}`);
  }

  return response.json();
}