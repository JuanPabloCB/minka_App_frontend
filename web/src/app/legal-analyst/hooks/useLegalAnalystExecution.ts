"use client";

import { useCallback, useState } from "react";

import { executeLegalAnalyst } from "../api/executeLegalAnalyst";
import type {
  LegalAnalystExecuteRequest,
  LegalAnalystExecuteResponse,
} from "../types/legalAnalyst";

interface UseLegalAnalystExecutionReturn {
  data: LegalAnalystExecuteResponse | null;
  isLoading: boolean;
  error: string | null;
  execute: (
    payload: LegalAnalystExecuteRequest
  ) => Promise<LegalAnalystExecuteResponse | null>;
  reset: () => void;
}

export function useLegalAnalystExecution(): UseLegalAnalystExecutionReturn {
  const [data, setData] = useState<LegalAnalystExecuteResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const execute = useCallback(
    async (
      payload: LegalAnalystExecuteRequest
    ): Promise<LegalAnalystExecuteResponse | null> => {
      setIsLoading(true);
      setError(null);

      try {
        const result = await executeLegalAnalyst(payload);
        setData(result);
        return result;
      } catch (err) {
        const message =
          err instanceof Error
            ? err.message
            : "Ocurrió un error inesperado al ejecutar el Analista Legal.";

        setError(message);
        return null;
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  const reset = useCallback(() => {
    setData(null);
    setError(null);
    setIsLoading(false);
  }, []);

  return {
    data,
    isLoading,
    error,
    execute,
    reset,
  };
}