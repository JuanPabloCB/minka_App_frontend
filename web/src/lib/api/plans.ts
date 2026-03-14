import { apiFetch } from "./http";

export type PlanOut = {
  id: string;
  session_id: string;
  status: string;
  title: string;
  ui_state: string;
  selected_analysts: Array<{
    analyst_key?: string;
    analyst_label?: string;
    reason?: string;
  }>;
  meta: Record<string, any>;
  created_at: string;
  updated_at: string;
};

export type PlanStepOut = {
  id: string;
  plan_id: string;
  step_index: number;
  title: string;
  status: string;
  meta: Record<string, any>;
  created_at: string;
  updated_at: string;
};

export type PlanWithStepsOut = {
  plan: PlanOut;
  steps: PlanStepOut[];
};

export type AnalystActionStepOut = {
  key: string;
  label: string;
  status: string;
  estimated_minutes: number;
};

export type SourceStepAssignmentOut = {
  step_index: number;
  title: string;
  analyst_key: string;
  analyst_label: string;
};

export type ExecutionRouteStepOut = {
  index: number;
  analyst_key: string;
  analyst_label: string;
  status: string;
  estimated_minutes: number;
  task_titles: string[];
  source_step_indexes: number[];
  source_step_assignments: SourceStepAssignmentOut[];
  analyst_actions: AnalystActionStepOut[];
  expected_output: string;
};

export type ExecutionRouteOut = {
  plan: PlanOut;
  progress_percent: number;
  execution_status: string;
  estimated_total_minutes: number;
  execution_steps: ExecutionRouteStepOut[];
};

export async function getPlan(planId: string) {
  return apiFetch<PlanWithStepsOut>(`/plans/${planId}`);
}

export async function getExecutionRoute(planId: string) {
  return apiFetch<ExecutionRouteOut>(`/plans/${planId}/execution-route`);
}