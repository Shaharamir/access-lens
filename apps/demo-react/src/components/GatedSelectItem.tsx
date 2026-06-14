import type { ReactNode } from "react";
import {
  useAccessGate,
  useAccessLens,
  type AccessReason,
} from "@access-lens/react";
import { Badge } from "@workspace/ui/components/badge";
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "@workspace/ui/components/hover-card";
import { SelectItem } from "@workspace/ui/components/select";
import { cn } from "@workspace/ui/lib/utils";
import { GatedHoverPanel } from "./ExplainedGate.js";

export interface GatedSelectItemProps {
  id: string;
  label: string;
  value: string;
  reasons: AccessReason[];
  children: ReactNode;
}

/**
 * Select option subject to access rules. Production behavior:
 *  - allowed → plain SelectItem
 *  - denied  → hidden
 *
 * Debug mode renders BOTH states with marker outlines + a HoverCard that
 * exposes the same Reasons + Tenants×Roles matrix panel as ExplainedGate,
 * so the menu shows exactly what teammates on other tenants/roles would see.
 */
export function GatedSelectItem(props: GatedSelectItemProps) {
  const { id, label, value, reasons, children } = props;
  const { debugMode } = useAccessLens();
  const { node, allowed } = useAccessGate({
    id,
    label,
    type: "field",
    reasons,
  });

  if (!debugMode) {
    if (allowed) {
      return <SelectItem value={value}>{children}</SelectItem>;
    }
    return null;
  }

  const failed = node.reasons.filter((r) => !r.passed);

  return (
    <SelectItem
      value={value}
      disabled={!allowed}
      data-access-lens-id={node.id}
      className={cn(
        // shadcn SelectItem applies `data-disabled:pointer-events-none` and
        // `data-disabled:opacity-50` when we pass `disabled`. Override both so
        // the option stays visually present and the HoverCard still triggers.
        "data-disabled:opacity-100 data-disabled:pointer-events-auto!",
        allowed
          ? "outline-1 outline-sky-400/70 -outline-offset-2"
          : "outline-dashed outline-1 outline-destructive/60 -outline-offset-2",
      )}
    >
      <HoverCard>
        <HoverCardTrigger
          render={
            <span className="flex items-center gap-2 w-full cursor-help" />
          }
        >
          <span className={cn("flex-1", !allowed && "opacity-70")}>
            {children}
          </span>
          {allowed ? (
            <Badge
              variant="outline"
              className="text-[9px] uppercase tracking-wider border-sky-300 bg-sky-50 text-sky-700 dark:border-sky-800 dark:bg-sky-950 dark:text-sky-300"
            >
              gated · {node.reasons.length}
            </Badge>
          ) : (
            <Badge
              variant="destructive"
              className="text-[9px] uppercase tracking-wider"
            >
              denied · {failed.length}
            </Badge>
          )}
        </HoverCardTrigger>
        <HoverCardContent className="w-104 p-3" sideOffset={6}>
          <GatedHoverPanel node={node} allowed={allowed} />
        </HoverCardContent>
      </HoverCard>
    </SelectItem>
  );
}
