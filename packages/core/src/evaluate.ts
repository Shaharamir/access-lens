import type {
  AccessNode,
  AccessStatus,
  EvaluateInput,
} from "./types.js";

export function evaluateAccess(input: EvaluateInput): AccessNode {
  const reasons = input.reasons ?? [];
  const status: AccessStatus = computeStatus(
    reasons,
    input.defaultStatus,
  );
  const node: AccessNode = {
    id: input.id,
    label: input.label,
    type: input.type,
    status,
    reasons,
  };
  if (input.metadata !== undefined) {
    node.metadata = input.metadata;
  }
  return node;
}

function computeStatus(
  reasons: EvaluateInput["reasons"],
  defaultStatus?: AccessStatus,
): AccessStatus {
  if (!reasons || reasons.length === 0) {
    return defaultStatus ?? "allowed";
  }
  for (const reason of reasons) {
    if (!reason.passed) return "denied";
  }
  return "allowed";
}

export function deniedReasons(node: AccessNode) {
  return node.reasons.filter((r) => !r.passed);
}

export function passedReasons(node: AccessNode) {
  return node.reasons.filter((r) => r.passed);
}
