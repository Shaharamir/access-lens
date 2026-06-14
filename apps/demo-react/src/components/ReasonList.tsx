import type { AccessReason, AccessReasonType } from "@access-lens/react";
import { Badge } from "@workspace/ui/components/badge";
import { Empty, EmptyDescription, EmptyHeader } from "@workspace/ui/components/empty";
import {
  Item,
  ItemContent,
  ItemDescription,
  ItemGroup,
  ItemMedia,
  ItemTitle,
} from "@workspace/ui/components/item";
import { cn } from "@workspace/ui/lib/utils";

export interface ReasonListProps {
  reasons: AccessReason[];
  emptyLabel?: string;
}

export function ReasonList({
  reasons,
  emptyLabel = "No reasons recorded.",
}: ReasonListProps) {
  if (reasons.length === 0) {
    return (
      <Empty className="py-3">
        <EmptyHeader>
          <EmptyDescription>{emptyLabel}</EmptyDescription>
        </EmptyHeader>
      </Empty>
    );
  }
  return (
    <ItemGroup>
      {reasons.map((reason, i) => (
        <ReasonItem key={`${reason.type}:${reason.key}:${i}`} reason={reason} />
      ))}
    </ItemGroup>
  );
}

function ReasonItem({ reason }: { reason: AccessReason }) {
  const passed = reason.passed;
  const isFlag = reason.type === "feature_flag";

  return (
    <Item
      size="xs"
      variant="outline"
      className={cn(
        passed && "border-emerald-300 bg-emerald-50/60 dark:border-emerald-900 dark:bg-emerald-950/40",
        !passed && !isFlag && "border-destructive/40 bg-destructive/5",
        !passed && isFlag && "border-indigo-300 bg-indigo-50/70 dark:border-indigo-800 dark:bg-indigo-950/40",
      )}
    >
      <ItemMedia variant="icon">
        <span
          className={cn(
            "font-mono font-bold text-[11px]",
            passed && "text-emerald-700 dark:text-emerald-300",
            !passed && !isFlag && "text-destructive",
            !passed && isFlag && "text-indigo-700 dark:text-indigo-300",
          )}
          aria-hidden
        >
          {passed ? "+" : iconFor(reason.type)}
        </span>
      </ItemMedia>
      <ItemContent>
        <ItemTitle className="gap-2 text-[11.5px] font-semibold font-mono">
          <Badge
            variant="outline"
            className="text-[9px] uppercase tracking-wider font-mono"
          >
            {reason.type}
          </Badge>
          <span className="break-all">{reason.label ?? reason.key}</span>
        </ItemTitle>
        {reason.message ? (
          <ItemDescription className="text-[11px]">
            {reason.message}
          </ItemDescription>
        ) : null}
        {reason.expected !== undefined || reason.actual !== undefined ? (
          <ItemDescription className="text-[10.5px] font-mono opacity-80">
            <em className="not-italic opacity-60">expected</em>{" "}
            {stringify(reason.expected)}{" "}
            <em className="not-italic opacity-60">· actual</em>{" "}
            {stringify(reason.actual)}
          </ItemDescription>
        ) : null}
        {reason.source ? (
          <ItemDescription className="text-[10px] font-mono opacity-60">
            source · {reason.source}
          </ItemDescription>
        ) : null}
      </ItemContent>
    </Item>
  );
}

function iconFor(type: AccessReasonType): string {
  switch (type) {
    case "feature_flag":
      return "?";
    case "permission":
      return "#";
    case "entitlement":
      return "$";
    case "plan":
      return "*";
    case "tenant_config":
      return "@";
    case "condition":
      return "!";
    default:
      return "x";
  }
}

function stringify(value: unknown): string {
  if (value === undefined) return "undefined";
  if (value === null) return "null";
  if (typeof value === "string") return JSON.stringify(value);
  try {
    return JSON.stringify(value);
  } catch {
    return String(value);
  }
}
