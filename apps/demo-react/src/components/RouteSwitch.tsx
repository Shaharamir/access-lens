import type { ReactNode } from "react";
import {
  evaluateAccess,
  useAccessGate,
  type AccessNode,
  type AccessReason,
} from "@access-lens/react";

export interface RouteCandidate {
  id: string;
  label: string;
  reasons: AccessReason[];
  metadata?: Record<string, unknown>;
}

export interface RouteSwitchRenderArgs {
  winner: AccessNode;
  nodes: AccessNode[];
  candidates: RouteCandidate[];
}

export interface RouteSwitchProps {
  candidates: RouteCandidate[];
  fallback?: ReactNode;
  children: (args: RouteSwitchRenderArgs) => ReactNode;
}

/**
 * Evaluates N candidate routes in priority order. The first allowed one wins
 * and renders. All candidates are registered with the AccessLensClient so the
 * overlay / catalog reflects every possible destination plus the reason each
 * tenant lands on the one they got.
 */
export function RouteSwitch({
  candidates,
  fallback = null,
  children,
}: RouteSwitchProps) {
  const nodes = candidates.map((c) => buildNode(c));
  const winner = nodes.find((n) => n.status === "allowed") ?? null;

  return (
    <>
      {candidates.map((c) => (
        <RouteRegistrar
          key={c.id}
          id={c.id}
          label={c.label}
          reasons={c.reasons}
          metadata={c.metadata}
        />
      ))}
      {winner ? children({ winner, nodes, candidates }) : fallback}
    </>
  );
}

function buildNode(c: RouteCandidate): AccessNode {
  return evaluateAccess({
    id: c.id,
    label: c.label,
    type: "route",
    reasons: c.reasons,
    ...(c.metadata !== undefined ? { metadata: c.metadata } : {}),
  });
}

interface RouteRegistrarProps {
  id: string;
  label: string;
  reasons: AccessReason[];
  metadata?: Record<string, unknown>;
}

function RouteRegistrar(props: RouteRegistrarProps) {
  const input: Parameters<typeof useAccessGate>[0] = {
    id: props.id,
    label: props.label,
    type: "route",
    reasons: props.reasons,
  };
  if (props.metadata !== undefined) input.metadata = props.metadata;
  useAccessGate(input);
  return null;
}
