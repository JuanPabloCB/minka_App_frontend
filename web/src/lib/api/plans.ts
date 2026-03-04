import { http } from "./http";

export type PlanOut = {
  id: string;
  session_id: string;
  status: string;
  title: string;
  ui_state: string;
  selected_analysts: any[];
  meta: any;
  created_at: string;
  updated_at: string;
};

export type PlanStepOut = {
  id: string;
  plan_id: string;
  step_index: number;
  title: string;
  status: string;
  meta: any;
  created_at: string;
  updated_at: string;
};

export type PlanWithStepsOut = {
  plan: PlanOut;
  steps: PlanStepOut[];
};

export async function getPlan(planId: string) {
  return http<PlanWithStepsOut>(`/plans/${planId}`);
}