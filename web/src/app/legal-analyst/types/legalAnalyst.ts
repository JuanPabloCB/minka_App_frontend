export type LegalGoalType =
  | "critical_clause_detection"
  | "contract_risk_review"
  | "marked_contract_export"
  | "executive_legal_summary";

export interface AssignedMacroStep {
  id: string;
  title?: string;
  name?: string;
  description?: string;
  expected_output?: string;
}

export interface LegalAnalystExecuteRequest {
  goal_type: string;
  inputs: Record<string, unknown>;
  assigned_macro_steps: AssignedMacroStep[];
}

export interface StepChatScope {
  mode: string;
  allowed_topics: string[];
}

export interface StepInitialMessage {
  id: string;
  type: string;
  content: string;
  animate?: boolean;
}

export interface StepRenderBlock {
  id: string;
  type: string;
  label?: string | null;
  accepted_formats?: string[];
}

export interface StepUiDefinition {
  step_id: string;
  title: string;
  chat_scope: StepChatScope;
  initial_messages: StepInitialMessage[];
  render_blocks: StepRenderBlock[];
}

export interface StepExecutionResult {
  step_id: string;
  status: "completed" | "failed" | string;
  output: Record<string, unknown>;
  error: string | null;
}

export interface LegalFinding {
  finding_id: string;
  title: string;
  category: string;
  severity: string;
  page: number;
  excerpt: string;
  reason: string;
}

export interface PrioritizedRisk {
  finding_id: string;
  title: string;
  category: string;
  severity: string;
  severity_rank: number;
  page: number;
  excerpt: string;
  reason: string;
  attention_level: string;
  practical_impact: string;
  recommendation: string;
}

export interface PracticalInterpretation {
  finding_id: string;
  title: string;
  severity: string;
  page: number;
  excerpt: string;
  what_it_means: string;
  business_impact: string;
  suggested_action: string;
  recommendation: string;
  attention_level: string;
}

export interface MarkedSection {
  finding_id: string;
  title: string;
  page: number;
  excerpt: string;
  severity: string;
  highlight_color: string;
  reason: string;
  practical_impact: string;
  recommendation: string;
  what_it_means?: string;
  business_impact?: string;
  suggested_action?: string;
}

export interface ExportPreview {
  artifact_type: string;
  filename: string;
  status: string;
  total_marks: number;
}

export interface UploadContractResponse {
  document_id: string;
  filename: string;
  content_type: string;
  size_bytes: number;
  size_label: string;
  page_count: number | null;
  storage_path: string;
}

export interface RuntimeSharedState {
  load_contract?: {
    document_source?: string;
    document_id?: string;
    filename?: string;
    source?: string;
    message?: string;
    document_ready?: boolean;
  };
  detect_findings?: {
    document_ready?: boolean;
    filename?: string;
    findings?: LegalFinding[];
    total_findings?: number;
    message?: string;
  };
  prioritize_risks?: {
    prioritized_risks?: PrioritizedRisk[];
    total_prioritized?: number;
    summary?: {
      high: number;
      medium: number;
      low: number;
    };
    message?: string;
  };
  practical_interpretation?: {
    interpretations?: PracticalInterpretation[];
    total_interpretations?: number;
    general_summary?: {
      headline: string;
      summary: string;
      high_priority_count: number;
      medium_priority_count: number;
      low_priority_count: number;
    };
    message?: string;
  };
  generate_marked_contract?: {
    marked_document_ready?: boolean;
    marked_sections?: MarkedSection[];
    total_marked_sections?: number;
    export_preview?: ExportPreview;
    message?: string;
  };
  [key: string]: unknown;
}

export interface RuntimeContext {
  analyst_id: string;
  goal_type: string;
  inputs: Record<string, unknown>;
  shared_state: RuntimeSharedState;
  step_results: StepExecutionResult[];
}

export interface LegalAnalystExecuteResponse {
  analyst_id: string;
  goal_type: string;
  selected_steps: string[];
  ordered_steps: string[];
  planning_reasoning: string[];
  dependency_errors: string[];
  missing_dependencies: string[];
  runtime_context: RuntimeContext | null;
  step_ui_map?: Record<string, StepUiDefinition>;
}

export interface StepChatResponse {
  step_id: string;
  reply: string;
}