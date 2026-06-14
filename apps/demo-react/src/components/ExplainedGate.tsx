import {
  cloneElement,
  isValidElement,
  useMemo,
  useState,
  type ReactElement,
  type ReactNode,
} from "react";
import {
  useAccessGate,
  useAccessLens,
  type AccessNode,
  type AccessNodeType,
  type AccessReason,
  type AccessReasonType,
} from "@access-lens/react";
import { Badge } from "@workspace/ui/components/badge";
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "@workspace/ui/components/hover-card";
import { Input } from "@workspace/ui/components/input";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@workspace/ui/components/tabs";
import {
  ToggleGroup,
  ToggleGroupItem,
} from "@workspace/ui/components/toggle-group";
import { cn } from "@workspace/ui/lib/utils";
import type { AccessContext } from "../access.js";
import { buildAllSurfaces } from "../catalog.js";
import { useDemoCtx } from "../demo-ctx.js";
import { TENANTS, USERS, type Tenant, type User } from "../data.js";
import { ReasonList } from "./ReasonList.js";

export interface ExplainedGateProps {
  id: string;
  label: string;
  type: AccessNodeType;
  reasons: AccessReason[];
  children: ReactNode;
  /** Hint kept for API parity; ExplainedGate no longer wraps. */
  layout?: "block" | "inline";
}

type ClonableProps = {
  className?: string;
  "data-access-lens-id"?: string;
  "aria-disabled"?: boolean;
};

const REASON_PRIORITY: AccessReasonType[] = [
  "feature_flag",
  "plan",
  "entitlement",
  "tenant_config",
  "condition",
  "permission",
  "custom",
];

function primaryReasonType(
  reasons: AccessReason[],
): AccessReasonType | null {
  for (const target of REASON_PRIORITY) {
    if (reasons.some((r) => r.type === target)) return target;
  }
  return null;
}

const TYPE_OUTLINE: Record<
  AccessReasonType,
  { solid: string; dashed: string; chip: string }
> = {
  feature_flag: {
    solid: "outline outline-1 outline-indigo-400/70 outline-offset-2",
    dashed: "outline-dashed outline-1 outline-indigo-500/70 outline-offset-2",
    chip:
      "border-indigo-300 bg-indigo-50 text-indigo-700 dark:border-indigo-800 dark:bg-indigo-950 dark:text-indigo-300",
  },
  permission: {
    solid: "outline outline-1 outline-sky-400/70 outline-offset-2",
    dashed: "outline-dashed outline-1 outline-sky-500/70 outline-offset-2",
    chip:
      "border-sky-300 bg-sky-50 text-sky-700 dark:border-sky-800 dark:bg-sky-950 dark:text-sky-300",
  },
  plan: {
    solid: "outline outline-1 outline-amber-400/70 outline-offset-2",
    dashed: "outline-dashed outline-1 outline-amber-500/70 outline-offset-2",
    chip:
      "border-amber-300 bg-amber-50 text-amber-700 dark:border-amber-800 dark:bg-amber-950 dark:text-amber-300",
  },
  entitlement: {
    solid: "outline outline-1 outline-emerald-400/70 outline-offset-2",
    dashed: "outline-dashed outline-1 outline-emerald-500/70 outline-offset-2",
    chip:
      "border-emerald-300 bg-emerald-50 text-emerald-700 dark:border-emerald-800 dark:bg-emerald-950 dark:text-emerald-300",
  },
  tenant_config: {
    solid: "outline outline-1 outline-pink-400/70 outline-offset-2",
    dashed: "outline-dashed outline-1 outline-pink-500/70 outline-offset-2",
    chip:
      "border-pink-300 bg-pink-50 text-pink-700 dark:border-pink-800 dark:bg-pink-950 dark:text-pink-300",
  },
  condition: {
    solid: "outline outline-1 outline-slate-400/70 outline-offset-2",
    dashed: "outline-dashed outline-1 outline-slate-500/70 outline-offset-2",
    chip:
      "border-slate-300 bg-slate-50 text-slate-700 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300",
  },
  custom: {
    solid: "outline outline-1 outline-fuchsia-400/70 outline-offset-2",
    dashed: "outline-dashed outline-1 outline-fuchsia-500/70 outline-offset-2",
    chip:
      "border-fuchsia-300 bg-fuchsia-50 text-fuchsia-700 dark:border-fuchsia-800 dark:bg-fuchsia-950 dark:text-fuchsia-300",
  },
};

export function ExplainedGate(props: ExplainedGateProps) {
  const { id, label, type, reasons, children } = props;
  const { debugMode } = useAccessLens();
  const { node, allowed } = useAccessGate({ id, label, type, reasons });

  if (!isValidElement(children)) {
    if (allowed) return <>{children}</>;
    return null;
  }
  const childEl = children as ReactElement<ClonableProps>;

  if (allowed && !debugMode) return <>{children}</>;
  if (!allowed && !debugMode) return null;

  const hasAnyReason = node.reasons.length > 0;
  if (allowed && !hasAnyReason) return <>{children}</>;

  const primary = primaryReasonType(node.reasons) ?? "custom";
  const style = TYPE_OUTLINE[primary];
  const outlineClass = allowed ? style.solid : style.dashed;

  const enhanced = cloneElement(childEl, {
    className: cn(
      childEl.props.className,
      outlineClass,
      "cursor-help rounded-sm",
      // shadcn TabsTrigger/Button apply `aria-disabled:pointer-events-none`
      // when we mark the element as gated-closed; that would block hover
      // detection on the trigger. Force pointer-events back on so the
      // HoverCard always fires while keeping the dashed visual.
      "pointer-events-auto!",
    ),
    "aria-disabled": !allowed,
    "data-access-lens-id": node.id,
  });

  return (
    <HoverCard>
      <HoverCardTrigger render={enhanced} />
      <HoverCardContent className="w-104 p-3" sideOffset={6}>
        <GatedHoverPanel node={node} allowed={allowed} />
      </HoverCardContent>
    </HoverCard>
  );
}

export interface GatedHoverPanelProps {
  node: AccessNode;
  allowed: boolean;
}

export function GatedHoverPanel({ node, allowed }: GatedHoverPanelProps) {
  return (
    <div className="flex flex-col gap-2">
      <header className="flex items-center gap-2 pb-2 border-b border-border flex-wrap">
        <Badge
          variant={allowed ? "outline" : "destructive"}
          className="text-[9px] tracking-wider uppercase"
        >
          {allowed ? "gated · open" : "gated · closed"}
        </Badge>
        <span className="text-sm font-semibold truncate flex-1 min-w-0">
          {node.label}
        </span>
      </header>
      <Tabs defaultValue="reasons" className="gap-2">
        <TabsList className="h-7 p-0.5">
          <TabsTrigger value="reasons" className="text-[11px] px-3 h-6">
            Reasons · {node.reasons.length}
          </TabsTrigger>
          <TabsTrigger value="matrix" className="text-[11px] px-3 h-6">
            Tenants × Roles
          </TabsTrigger>
        </TabsList>
        <TabsContent value="reasons">
          <ReasonsTab node={node} />
        </TabsContent>
        <TabsContent value="matrix">
          <MatrixTab nodeId={node.id} />
        </TabsContent>
      </Tabs>
    </div>
  );
}

type StatusFilter = "all" | "passing" | "failing";

function ReasonsTab({ node }: { node: AccessNode }) {
  const [kindFilter, setKindFilter] = useState<"all" | AccessReasonType>("all");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [query, setQuery] = useState("");

  const kindsPresent = useMemo(() => {
    const set = new Set<AccessReasonType>();
    for (const r of node.reasons) set.add(r.type);
    return Array.from(set);
  }, [node.reasons]);

  const failingCount = node.reasons.filter((r) => !r.passed).length;
  const passingCount = node.reasons.length - failingCount;

  const filtered = useMemo(() => {
    return node.reasons.filter((r) => {
      if (kindFilter !== "all" && r.type !== kindFilter) return false;
      if (statusFilter === "passing" && !r.passed) return false;
      if (statusFilter === "failing" && r.passed) return false;
      if (query) {
        const hay = `${r.type} ${r.key} ${r.label ?? ""} ${r.message ?? ""} ${r.source ?? ""}`.toLowerCase();
        if (!hay.includes(query.toLowerCase())) return false;
      }
      return true;
    });
  }, [node.reasons, kindFilter, statusFilter, query]);

  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-wrap gap-1.5 items-center">
        <ToggleGroup
          value={[kindFilter]}
          onValueChange={(arr) => {
            const next = arr[0];
            if (next === "all") return setKindFilter("all");
            if (
              next === "permission" ||
              next === "feature_flag" ||
              next === "entitlement" ||
              next === "plan" ||
              next === "tenant_config" ||
              next === "condition" ||
              next === "custom"
            ) {
              setKindFilter(next);
            }
          }}
          variant="outline"
          size="sm"
          className="flex-wrap"
        >
          <ToggleGroupItem value="all" className="h-6 px-2 text-[10px]">
            all
          </ToggleGroupItem>
          {kindsPresent.map((k) => (
            <ToggleGroupItem
              key={k}
              value={k}
              className={cn(
                "h-6 px-2 text-[10px] font-mono",
                kindFilter === k && TYPE_OUTLINE[k].chip,
              )}
            >
              {k}
            </ToggleGroupItem>
          ))}
        </ToggleGroup>
      </div>
      <div className="flex flex-wrap gap-1.5 items-center">
        <ToggleGroup
          value={[statusFilter]}
          onValueChange={(arr) => {
            const next = arr[0];
            if (next === "all" || next === "passing" || next === "failing") {
              setStatusFilter(next);
            }
          }}
          variant="outline"
          size="sm"
        >
          <ToggleGroupItem value="all" className="h-6 px-2 text-[10px]">
            all
          </ToggleGroupItem>
          <ToggleGroupItem value="passing" className="h-6 px-2 text-[10px]">
            passing · {passingCount}
          </ToggleGroupItem>
          <ToggleGroupItem value="failing" className="h-6 px-2 text-[10px]">
            failing · {failingCount}
          </ToggleGroupItem>
        </ToggleGroup>
      </div>
      <Input
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="filter key / label / message / source…"
        className="h-7 text-[11px]"
      />
      <div className="max-h-64 overflow-y-auto pr-1">
        {filtered.length === 0 ? (
          <p className="text-[11px] text-muted-foreground italic px-1 py-3 text-center">
            No reasons match these filters.
          </p>
        ) : (
          <ReasonList reasons={filtered} />
        )}
      </div>
    </div>
  );
}

interface MatrixCell {
  tenant: Tenant;
  user: User;
  allowed: boolean;
  reasons: AccessReason[];
}

function MatrixTab({ nodeId }: { nodeId: string }) {
  const ctx = useDemoCtx();

  const cells = useMemo<MatrixCell[]>(() => {
    if (!ctx) return [];
    const out: MatrixCell[] = [];
    for (const t of TENANTS) {
      for (const u of USERS) {
        const all = buildAllSurfaces({
          tenant: t,
          user: u,
          flags: ctx.flags,
        });
        const entry = all.find((s) => s.id === nodeId);
        if (entry) {
          out.push({
            tenant: t,
            user: u,
            allowed: entry.reasons.every((r) => r.passed),
            reasons: entry.reasons,
          });
        }
      }
    }
    return out;
  }, [nodeId, ctx]);

  const [showOnly, setShowOnly] = useState<"all" | "open" | "closed">("all");

  if (!ctx) {
    return (
      <p className="text-[11px] text-muted-foreground italic px-1 py-3 text-center">
        Demo context unavailable for this surface.
      </p>
    );
  }
  if (cells.length === 0) {
    return (
      <p className="text-[11px] text-muted-foreground italic px-1 py-3 text-center">
        This surface isn't registered with the catalog index — matrix
        unavailable.
      </p>
    );
  }

  const openCount = cells.filter((c) => c.allowed).length;
  const visibleCells = cells.filter((c) =>
    showOnly === "all"
      ? true
      : showOnly === "open"
        ? c.allowed
        : !c.allowed,
  );

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <ToggleGroup
          value={[showOnly]}
          onValueChange={(arr) => {
            const next = arr[0];
            if (next === "all" || next === "open" || next === "closed") {
              setShowOnly(next);
            }
          }}
          variant="outline"
          size="sm"
        >
          <ToggleGroupItem value="all" className="h-6 px-2 text-[10px]">
            all
          </ToggleGroupItem>
          <ToggleGroupItem value="open" className="h-6 px-2 text-[10px]">
            open · {openCount}
          </ToggleGroupItem>
          <ToggleGroupItem value="closed" className="h-6 px-2 text-[10px]">
            closed · {cells.length - openCount}
          </ToggleGroupItem>
        </ToggleGroup>
        <Badge variant="secondary" className="text-[10px]">
          open · {openCount}/{cells.length}
        </Badge>
      </div>

      <div className="overflow-x-auto rounded-lg border border-border bg-background">
        <table className="w-full border-collapse text-[10.5px]">
          <thead>
            <tr className="bg-muted/40">
              <th className="text-start px-2 py-1.5 font-mono font-semibold">
                tenant ↓ · role →
              </th>
              {USERS.map((u) => (
                <th
                  key={u.id}
                  className={cn(
                    "px-2 py-1.5 text-center font-medium",
                    u.id === ctx.user.id && "bg-primary/10",
                  )}
                >
                  <div className="flex flex-col items-center gap-0.5">
                    <span>{u.name}</span>
                    <Badge
                      variant="outline"
                      className="font-mono text-[8.5px] uppercase"
                    >
                      {u.role}
                    </Badge>
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {TENANTS.map((t) => {
              const row = USERS.map((u) =>
                visibleCells.find(
                  (c) => c.tenant.id === t.id && c.user.id === u.id,
                ),
              );
              const hasVisibleCell = row.some((c) => c !== undefined);
              if (!hasVisibleCell && showOnly !== "all") return null;
              return (
                <tr
                  key={t.id}
                  className={cn(
                    "border-t border-border",
                    t.id === ctx.tenant.id && "bg-primary/5",
                  )}
                >
                  <td className="px-2 py-1.5 font-mono">
                    <div className="flex flex-col gap-0.5">
                      <span className="font-semibold">{t.name}</span>
                      <span className="text-[8.5px] text-muted-foreground">
                        {t.plan} · {t.cohort} · b{t.bucketPercent}
                      </span>
                    </div>
                  </td>
                  {USERS.map((u) => {
                    const cell = row[USERS.indexOf(u)];
                    if (!cell) {
                      return (
                        <td
                          key={u.id}
                          className="px-2 py-1.5 text-center text-muted-foreground opacity-30"
                        >
                          ·
                        </td>
                      );
                    }
                    const highlighted =
                      t.id === ctx.tenant.id && u.id === ctx.user.id;
                    const failedCount = cell.reasons.filter(
                      (r) => !r.passed,
                    ).length;
                    const title = cell.allowed
                      ? `${t.name} · ${u.name} (${u.role}) — OPEN`
                      : `${t.name} · ${u.name} (${u.role}) — CLOSED (${failedCount} reason${failedCount === 1 ? "" : "s"} failing)`;
                    return (
                      <td
                        key={u.id}
                        className={cn(
                          "px-2 py-1.5 text-center",
                          highlighted && "ring-1 ring-primary/40 rounded",
                        )}
                      >
                        <span
                          title={title}
                          className={cn(
                            "inline-flex size-4 items-center justify-center rounded-full text-white text-[9px] font-bold cursor-help",
                            cell.allowed
                              ? "bg-emerald-500"
                              : "bg-destructive",
                          )}
                        >
                          {cell.allowed ? "✓" : "×"}
                        </span>
                      </td>
                    );
                  })}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// Re-export for GatedSelectItem
export type { AccessContext };
