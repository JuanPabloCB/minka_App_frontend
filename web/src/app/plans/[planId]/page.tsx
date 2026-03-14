"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import {
  ExecutionRouteOut,
  getExecutionRoute,
} from "@/lib/api/plans";
import { listSessionMessages } from "@/lib/api/sessions";
import PlanOverview from "@/app/components/plans/PlanOverview";
import PlanTable from "@/app/components/plans/PlanTable";

type RouteStatusUi = "Listo" | "Completado" | "Error";

type UiContextDisplay = {
  task_type: string;
  document_type: string;
  focus: string[];
};

function capitalizeFirst(value: string | null | undefined) {
  if (!value) return "";
  return value.charAt(0).toUpperCase() + value.slice(1);
}

function mapExecutionStatusToUi(status: string): RouteStatusUi {
  const normalized = (status || "").trim().toLowerCase();

  if (normalized === "error") return "Error";
  if (normalized === "completado" || normalized === "completed") return "Completado";
  return "Listo";
}

function getLatestUiContextFromMessages(messages: any[]): UiContextDisplay {
  for (let i = messages.length - 1; i >= 0; i--) {
    const msg = messages[i];
    const uiContext = msg?.meta?.ui_context;

    if (msg?.role === "assistant" && uiContext) {
      return {
        task_type: capitalizeFirst(uiContext.task_type ?? ""),
        document_type: capitalizeFirst(uiContext.document_type ?? ""),
        focus: Array.isArray(uiContext.focus)
          ? uiContext.focus.map((item: string) => capitalizeFirst(item)).filter(Boolean)
          : [],
      };
    }
  }

  return {
    task_type: "",
    document_type: "",
    focus: [],
  };
}

function getSelectedAnalysts(route: ExecutionRouteOut) {
  if (Array.isArray(route.plan.selected_analysts) && route.plan.selected_analysts.length > 0) {
    return route.plan.selected_analysts.map((item) => ({
      analyst_key: item.analyst_key ?? "unknown_analyst",
      analyst_label: item.analyst_label ?? item.analyst_key ?? "Analyst",
    }));
  }

  const unique = new Map<string, string>();

  route.execution_steps.forEach((step) => {
    if (!unique.has(step.analyst_key)) {
      unique.set(step.analyst_key, step.analyst_label);
    }
  });

  return Array.from(unique.entries()).map(([analyst_key, analyst_label]) => ({
    analyst_key,
    analyst_label,
  }));
}

export default function PlanPage() {
  const params = useParams<{ planId: string }>();
  const planId = params.planId;

  const [route, setRoute] = useState<ExecutionRouteOut | null>(null);
  const [uiContext, setUiContext] = useState<UiContextDisplay>({
    task_type: "",
    document_type: "",
    focus: [],
  });
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        setErr(null);

        const executionRoute = await getExecutionRoute(planId);
        if (cancelled) return;

        setRoute(executionRoute);

        try {
          const history = await listSessionMessages(executionRoute.plan.session_id);
          if (cancelled) return;

          setUiContext(getLatestUiContextFromMessages(history));
        } catch {
          if (!cancelled) {
            setUiContext({
              task_type: "",
              document_type: "",
              focus: [],
            });
          }
        }
      } catch (e: any) {
        if (!cancelled) {
          setErr(e?.message ?? "Error");
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [planId]);

  const routeStatus = useMemo<RouteStatusUi>(() => {
    return mapExecutionStatusToUi(route?.execution_status ?? "");
  }, [route]);

  const selectedAnalysts = useMemo(() => {
    if (!route) return [];
    return getSelectedAnalysts(route);
  }, [route]);

  if (err) {
    return (
      <div className="p-6">
        <div className="rounded-2xl border border-red-200 bg-red-50 px-5 py-4 text-sm text-red-700">
          Error: {err}
        </div>
      </div>
    );
  }

  if (!route) {
    return <div className="p-6 text-sm text-slate-500">Cargando ruta de ejecución...</div>;
  }

  return (
    <div className="px-6 py-5">
      <div className="mx-auto min-h-[720px] max-w-[1440px] overflow-hidden rounded-[18px] border border-slate-200 bg-[#FBFBFB] shadow-sm">
        <PlanOverview
          routeStatus={routeStatus}
          estimatedTotalMinutes={route.estimated_total_minutes}
          context={uiContext}
          analysts={selectedAnalysts}
        />

        <PlanTable steps={route.execution_steps} />
      </div>
    </div>
  );
}