import { API_BASE } from "./http";
import { apiFetch } from "./http";
import type {
    UIHintsOut,
    UIBulletsOut,
    UIContextOut,
    InteractionMode,
    ActiveStep,
    ConfirmationState,
} from "./orchestrator";

export type UploadedFileOut = {
    id: string;
    session_id: string;
    original_filename: string;
    stored_filename: string;
    file_extension: string;
    mime_type?: string | null;
    size_bytes: number;
    storage_path: string;
    upload_status: string;
    validation_status: "pending" | "accepted" | "rejected";
    validation_label?: string | null;
    validation_reason?: string | null;
    created_at: string;
    updated_at: string;
};

export type UploadFileResponse = {
    ok: boolean;
    message: string;
    file: UploadedFileOut | null;
    ui_context?: {
        input_file_name?: string | null;
        uploaded_file_id?: string | null;
        file_uploaded?: boolean | null;
        file_validation_status?: string | null;
    } | null;
};

export async function uploadSessionFile(sessionId: string, file: File): Promise<UploadFileResponse> {
    const url = `${API_BASE}/files/upload/${sessionId}`;

    const formData = new FormData();
    formData.append("file", file);

    const res = await fetch(url, {
        method: "POST",
        body: formData,
    });

    if (!res.ok) {
        const text = await res.text().catch(() => "");
        throw new Error(`${res.status} ${res.statusText} ${text}`);
    }

    return res.json() as Promise<UploadFileResponse>;
}

export type FileIntakeCompleteResponse = {
    session_id: string;
    assistant_message_id: string;
    reply: string;
    created_at: string;
    active_step: ActiveStep;
    interaction_mode: InteractionMode;
    confirmation_state: ConfirmationState;
    cta_ready: boolean;
    plan_created: boolean;
    plan_id: string | null;
    plan_status: string | null;
    ui_hints?: UIHintsOut | null;
    ui_bullets?: UIBulletsOut | null;
    ui_context?: UIContextOut | null;
};

export async function completeFileIntake(
    sessionId: string,
    uploadedFileId: string
) {
    return apiFetch<FileIntakeCompleteResponse>(
        `/orchestrator/file-intake-complete/${sessionId}`,
        {
            method: "POST",
            body: JSON.stringify({ uploaded_file_id: uploadedFileId }),
        }
    );
}

export type UploadedFileListItemOut = {
    id: string;
    session_id: string;
    original_filename: string;
    file_extension: string;
    mime_type?: string | null;
    size_bytes: number;
    validation_status: "pending" | "accepted" | "rejected";
    validation_label?: string | null;
    created_at: string;
};

export async function listSessionFiles(
    sessionId: string,
    onlyAccepted = true
) {
    const query = `?only_accepted=${onlyAccepted ? "true" : "false"}`;

    return apiFetch<UploadedFileListItemOut[]>(
        `/files/by-session/${sessionId}${query}`
    );
}