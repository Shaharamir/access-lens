import { useContext, useEffect, useMemo, useRef } from "react";
import { useSyncExternalStore } from "react";
import {
  evaluateAccess,
  type AccessNode,
  type AccessSnapshot,
  type EvaluateInput,
} from "@access-lens/core";
import { AccessLensContext } from "./context.js";
import type { AccessLensContextValue } from "./context.js";

export function useAccessLens(): AccessLensContextValue {
  const ctx = useContext(AccessLensContext);
  if (!ctx) {
    throw new Error(
      "useAccessLens must be used inside <AccessLensProvider>.",
    );
  }
  return ctx;
}

export function useAccessLensSnapshot(): AccessSnapshot {
  const { client } = useAccessLens();
  return useSyncExternalStore(
    (listener) => client.subscribe(() => listener()),
    () => client.getSnapshot(),
    () => client.getSnapshot(),
  );
}

export interface UseAccessGateResult {
  node: AccessNode;
  allowed: boolean;
  denied: boolean;
  unknown: boolean;
}

export function useAccessGate(
  input: EvaluateInput,
): UseAccessGateResult {
  const { client } = useAccessLens();
  const node = useMemo(() => evaluateAccess(input), [
    input.id,
    input.label,
    input.type,
    input.defaultStatus,
    input.metadata,
    serializeReasons(input.reasons),
  ]);

  const lastIdRef = useRef<string | null>(null);

  useEffect(() => {
    client.registerNode(node);
    if (lastIdRef.current && lastIdRef.current !== node.id) {
      client.unregisterNode(lastIdRef.current);
    }
    lastIdRef.current = node.id;
  }, [client, node]);

  useEffect(() => {
    return () => {
      if (lastIdRef.current) {
        client.unregisterNode(lastIdRef.current);
        lastIdRef.current = null;
      }
    };
  }, [client]);

  return {
    node,
    allowed: node.status === "allowed",
    denied: node.status === "denied",
    unknown: node.status === "unknown",
  };
}

function serializeReasons(reasons: EvaluateInput["reasons"]): string {
  if (!reasons || reasons.length === 0) return "";
  return reasons
    .map(
      (r) =>
        `${r.type}:${r.key}:${r.passed ? 1 : 0}:${r.message ?? ""}`,
    )
    .join("|");
}
