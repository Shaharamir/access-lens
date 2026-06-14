export type AccessNodeType =
  | "route"
  | "sidebar_item"
  | "tab"
  | "button"
  | "section"
  | "field"
  | "custom";

export type AccessStatus = "allowed" | "denied" | "unknown";

export type AccessReasonType =
  | "permission"
  | "feature_flag"
  | "entitlement"
  | "plan"
  | "tenant_config"
  | "condition"
  | "custom";

export interface AccessReason {
  type: AccessReasonType;
  key: string;
  label?: string;
  passed: boolean;
  source?: string;
  actual?: unknown;
  expected?: unknown;
  message?: string;
}

export interface AccessNode {
  id: string;
  label: string;
  type: AccessNodeType;
  status: AccessStatus;
  reasons: AccessReason[];
  metadata?: Record<string, unknown>;
}

export interface AccessSnapshot {
  nodes: AccessNode[];
  counts: {
    allowed: number;
    denied: number;
    unknown: number;
    total: number;
  };
  generatedAt: number;
}

export type AccessLensListener = (snapshot: AccessSnapshot) => void;

export interface EvaluateInput {
  id: string;
  label: string;
  type: AccessNodeType;
  reasons?: AccessReason[];
  metadata?: Record<string, unknown>;
  defaultStatus?: AccessStatus;
}

export interface ReasonOptions {
  label?: string;
  source?: string;
  actual?: unknown;
  expected?: unknown;
  message?: string;
}
