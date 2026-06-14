import { cloneElement, isValidElement } from "react";
import type { CSSProperties, ReactNode } from "react";
import type {
  AccessNode,
  AccessNodeType,
  AccessReason,
  EvaluateInput,
} from "@access-lens/core";
import { useAccessGate, useAccessLens } from "./hooks.js";

export interface AccessGateProps {
  id: string;
  label: string;
  type: AccessNodeType;
  reasons?: AccessReason[];
  metadata?: Record<string, unknown>;
  defaultStatus?: EvaluateInput["defaultStatus"];
  children: ReactNode;
  fallback?: ReactNode;
  ghostInDebug?: boolean;
  ghostStyle?: CSSProperties;
  ghostClassName?: string;
}

const baseGhostStyle: CSSProperties = {
  position: "relative",
  outline: "1px dashed rgba(220, 38, 38, 0.7)",
  outlineOffset: "2px",
  opacity: 0.55,
  cursor: "help",
  borderRadius: "4px",
};

export function AccessGate(props: AccessGateProps) {
  const {
    id,
    label,
    type,
    reasons,
    metadata,
    defaultStatus,
    children,
    fallback = null,
    ghostInDebug = true,
    ghostStyle,
    ghostClassName,
  } = props;

  const { debugMode } = useAccessLens();
  const input: EvaluateInput = { id, label, type };
  if (reasons !== undefined) input.reasons = reasons;
  if (metadata !== undefined) input.metadata = metadata;
  if (defaultStatus !== undefined) input.defaultStatus = defaultStatus;

  const { node, allowed } = useAccessGate(input);

  if (allowed) {
    return <>{children}</>;
  }

  if (debugMode && ghostInDebug) {
    return (
      <GhostWrapper
        node={node}
        style={ghostStyle}
        className={ghostClassName}
      >
        {children}
      </GhostWrapper>
    );
  }

  return <>{fallback}</>;
}

interface GhostWrapperProps {
  node: AccessNode;
  children: ReactNode;
  style?: CSSProperties;
  className?: string;
}

function GhostWrapper({
  node,
  children,
  style,
  className,
}: GhostWrapperProps) {
  const tooltip = buildTooltip(node);
  const mergedStyle: CSSProperties = { ...baseGhostStyle, ...style };

  if (isValidElement(children)) {
    const element = children as React.ReactElement<{
      style?: CSSProperties;
      className?: string;
      title?: string;
      "aria-disabled"?: boolean;
    }>;
    const existingProps = element.props ?? {};
    return cloneElement(element, {
      style: { ...mergedStyle, ...(existingProps.style ?? {}) },
      className: joinClass(existingProps.className, className),
      title: tooltip,
      "aria-disabled": true,
      ...{ "data-access-lens-id": node.id },
    } as Record<string, unknown>);
  }

  return (
    <span
      data-access-lens-id={node.id}
      className={className}
      style={mergedStyle}
      title={tooltip}
      aria-disabled
    >
      {children}
    </span>
  );
}

function joinClass(a?: string, b?: string): string | undefined {
  if (!a && !b) return undefined;
  if (a && b) return `${a} ${b}`;
  return a ?? b;
}

function buildTooltip(node: AccessNode): string {
  const denials = node.reasons.filter((r) => !r.passed);
  if (denials.length === 0) {
    return `${node.label} (${node.status})`;
  }
  const lines = denials.map((r) => {
    const label = r.label ?? r.key;
    return `- ${r.type}: ${label}${r.message ? ` — ${r.message}` : ""}`;
  });
  return `${node.label} hidden because:\n${lines.join("\n")}`;
}
