import { useMemo, useState } from "react";
import type {
  AccessNodeType,
  AccessReason,
  AccessReasonType,
} from "@access-lens/react";
import { Badge } from "@workspace/ui/components/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@workspace/ui/components/card";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@workspace/ui/components/collapsible";
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "@workspace/ui/components/hover-card";
import { Input } from "@workspace/ui/components/input";
import {
  Item,
  ItemActions,
  ItemContent,
  ItemDescription,
  ItemGroup,
  ItemMedia,
  ItemTitle,
} from "@workspace/ui/components/item";
import { Separator } from "@workspace/ui/components/separator";
import {
  ToggleGroup,
  ToggleGroupItem,
} from "@workspace/ui/components/toggle-group";
import { cn } from "@workspace/ui/lib/utils";
import { type AccessContext } from "../access.js";
import { buildCatalog, type CatalogEntry } from "../catalog.js";
import { TENANTS, USERS, type Tenant, type User } from "../data.js";

interface AccessMatrixProps {
  ctx: AccessContext;
}

interface Cell {
  tenant: Tenant;
  user: User;
  allowed: boolean;
  reasons: AccessReason[];
}

const TYPES: AccessNodeType[] = [
  "sidebar_item",
  "tab",
  "button",
  "section",
  "route",
  "field",
];

const REASON_KINDS: AccessReasonType[] = [
  "permission",
  "feature_flag",
  "entitlement",
  "plan",
  "tenant_config",
  "condition",
];

type TypeFilter = "all" | AccessNodeType;
type ReasonFilter = "all" | AccessReasonType;
type StatusFilter = "all" | "open" | "closed" | "partial";

export function AccessMatrix({ ctx }: AccessMatrixProps) {
  const [query, setQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState<TypeFilter>("all");
  const [reasonFilter, setReasonFilter] = useState<ReasonFilter>("all");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");

  /**
   * Build the full matrix: for every (tenant, user) combo we re-run
   * buildCatalog so each surface has reasons evaluated against THAT context.
   * Memoized on ctx.flags so flipping a flag re-evaluates everything.
   */
  const matrices = useMemo(() => {
    const map = new Map<string, Cell[]>();
    for (const tenant of TENANTS) {
      for (const user of USERS) {
        const c = buildCatalog({ tenant, user, flags: ctx.flags });
        for (const entry of c) {
          const cell: Cell = {
            tenant,
            user,
            allowed: entry.reasons.every((r) => r.passed),
            reasons: entry.reasons,
          };
          const list = map.get(entry.id) ?? [];
          list.push(cell);
          map.set(entry.id, list);
        }
      }
    }
    return map;
  }, [ctx.flags]);

  const catalog = useMemo(() => buildCatalog(ctx), [ctx]);

  const totalCombos = TENANTS.length * USERS.length;

  const visible = useMemo(() => {
    return catalog.filter((entry) => {
      if (typeFilter !== "all" && entry.type !== typeFilter) return false;
      if (
        reasonFilter !== "all" &&
        !entry.reasons.some((r) => r.type === reasonFilter)
      )
        return false;
      if (statusFilter !== "all") {
        const cells = matrices.get(entry.id) ?? [];
        const openCount = cells.filter((c) => c.allowed).length;
        if (statusFilter === "open" && openCount === 0) return false;
        if (statusFilter === "closed" && openCount > 0) return false;
        if (
          statusFilter === "partial" &&
          (openCount === 0 || openCount === totalCombos)
        )
          return false;
      }
      if (query) {
        const hay =
          `${entry.id} ${entry.label} ${entry.module} ${entry.group}`.toLowerCase();
        if (!hay.includes(query.toLowerCase())) return false;
      }
      return true;
    });
  }, [catalog, typeFilter, reasonFilter, statusFilter, query, matrices, totalCombos]);

  return (
    <Card className="min-h-96">
      <CardHeader className="gap-3">
        <div>
          <CardTitle>Access matrix</CardTitle>
          <CardDescription>
            Every gated surface evaluated against every{" "}
            <strong>tenant × user</strong> combo. Live with your flag drawer.
            Expand any row to see the full grid.
          </CardDescription>
        </div>
        <Separator />
        <div className="flex flex-wrap gap-3 items-center">
          <Filter label="Type">
            <ToggleGroup
              value={[typeFilter]}
              onValueChange={(arr) => {
                const next = arr[0];
                if (
                  next === "all" ||
                  (TYPES as readonly string[]).includes(next!)
                ) {
                  setTypeFilter(next as TypeFilter);
                }
              }}
              variant="outline"
              size="sm"
            >
              <ToggleGroupItem value="all">All</ToggleGroupItem>
              {TYPES.map((t) => (
                <ToggleGroupItem key={t} value={t}>
                  {kindLabel(t)}
                </ToggleGroupItem>
              ))}
            </ToggleGroup>
          </Filter>
          <Filter label="Reason kind">
            <ToggleGroup
              value={[reasonFilter]}
              onValueChange={(arr) => {
                const next = arr[0];
                if (
                  next === "all" ||
                  (REASON_KINDS as readonly string[]).includes(next!)
                ) {
                  setReasonFilter(next as ReasonFilter);
                }
              }}
              variant="outline"
              size="sm"
            >
              <ToggleGroupItem value="all">All</ToggleGroupItem>
              {REASON_KINDS.map((r) => (
                <ToggleGroupItem key={r} value={r}>
                  {r}
                </ToggleGroupItem>
              ))}
            </ToggleGroup>
          </Filter>
          <Filter label="Coverage">
            <ToggleGroup
              value={[statusFilter]}
              onValueChange={(arr) => {
                const next = arr[0];
                if (
                  next === "all" ||
                  next === "open" ||
                  next === "closed" ||
                  next === "partial"
                ) {
                  setStatusFilter(next);
                }
              }}
              variant="outline"
              size="sm"
            >
              <ToggleGroupItem value="all">All</ToggleGroupItem>
              <ToggleGroupItem value="open">Any open</ToggleGroupItem>
              <ToggleGroupItem value="partial">Partial</ToggleGroupItem>
              <ToggleGroupItem value="closed">All closed</ToggleGroupItem>
            </ToggleGroup>
          </Filter>
          <Input
            placeholder="filter id / label / module…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="h-8 w-56"
          />
          <Badge variant="secondary" className="ml-auto">
            {visible.length} / {catalog.length}
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <ItemGroup>
          {visible.map((entry) => (
            <SurfaceRow
              key={entry.id}
              entry={entry}
              cells={matrices.get(entry.id) ?? []}
              ctx={ctx}
              totalCombos={totalCombos}
            />
          ))}
          {visible.length === 0 ? (
            <p className="text-sm text-muted-foreground italic px-2 py-6 text-center">
              No surfaces match the current filters.
            </p>
          ) : null}
        </ItemGroup>
      </CardContent>
    </Card>
  );
}

function Filter({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1">
      <span className="text-[10px] uppercase tracking-wider text-muted-foreground">
        {label}
      </span>
      {children}
    </div>
  );
}

interface SurfaceRowProps {
  entry: CatalogEntry;
  cells: Cell[];
  ctx: AccessContext;
  totalCombos: number;
}

function SurfaceRow({ entry, cells, ctx, totalCombos }: SurfaceRowProps) {
  const [open, setOpen] = useState(false);
  const openCount = cells.filter((c) => c.allowed).length;
  const here = cells.find(
    (c) => c.tenant.id === ctx.tenant.id && c.user.id === ctx.user.id,
  );
  const allowedHere = here?.allowed ?? false;

  const reasonTypes = Array.from(
    new Set(entry.reasons.map((r) => r.type)),
  );

  return (
    <Collapsible open={open} onOpenChange={setOpen}>
      <Item
        size="sm"
        variant="outline"
        className={cn(
          "transition-colors",
          allowedHere
            ? "border-emerald-300/60 bg-emerald-50/40 dark:border-emerald-900/60 dark:bg-emerald-950/30"
            : "border-destructive/30 bg-destructive/5",
        )}
        data-access-lens-id={entry.id}
      >
        <ItemMedia>
          <Badge
            variant="outline"
            className="font-mono text-[9px] uppercase tracking-wider"
          >
            {kindLabel(entry.type)}
          </Badge>
        </ItemMedia>
        <ItemContent>
          <ItemTitle className="flex items-center gap-2 flex-wrap">
            <span>{entry.label}</span>
            <span className="text-[10px] text-muted-foreground font-mono opacity-70">
              {entry.id}
            </span>
          </ItemTitle>
          <ItemDescription className="flex items-center gap-1.5 flex-wrap text-[11px]">
            <span className="opacity-80">{entry.group}</span>
            <span className="opacity-50">·</span>
            {reasonTypes.map((t) => (
              <Badge
                key={t}
                variant="outline"
                className="font-mono text-[8.5px] uppercase tracking-wider"
              >
                {t}
              </Badge>
            ))}
          </ItemDescription>
        </ItemContent>
        <ItemActions>
          <CoverageStat openCount={openCount} total={totalCombos} />
          <Badge
            variant={allowedHere ? "outline" : "destructive"}
            className={cn(
              "uppercase text-[10px] tracking-wider",
              allowedHere &&
                "border-emerald-300 bg-emerald-50 text-emerald-700 dark:border-emerald-800 dark:bg-emerald-950 dark:text-emerald-300",
            )}
          >
            {allowedHere ? "open here" : "closed here"}
          </Badge>
          <CollapsibleTrigger
            render={
              <Badge
                variant="outline"
                className="cursor-pointer uppercase text-[10px] tracking-wider"
              />
            }
          >
            {open ? "collapse" : "matrix"}
          </CollapsibleTrigger>
        </ItemActions>
      </Item>
      <CollapsibleContent>
        <div className="px-3 pt-3 pb-4 -mt-2 rounded-b-2xl border border-t-0 border-border bg-muted/30">
          <MatrixGrid cells={cells} ctx={ctx} />
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
}

function CoverageStat({
  openCount,
  total,
}: {
  openCount: number;
  total: number;
}) {
  const ratio = openCount / total;
  return (
    <Badge
      variant="secondary"
      className={cn(
        "font-mono text-[10px] uppercase tracking-wider",
        ratio === 1 &&
          "border-emerald-300 bg-emerald-50 text-emerald-700 dark:border-emerald-800 dark:bg-emerald-950 dark:text-emerald-300",
        ratio === 0 &&
          "border-destructive/40 bg-destructive/10 text-destructive",
      )}
    >
      open · {openCount}/{total}
    </Badge>
  );
}

function MatrixGrid({ cells, ctx }: { cells: Cell[]; ctx: AccessContext }) {
  return (
    <div className="overflow-x-auto rounded-xl border border-border bg-background">
      <table className="w-full border-collapse text-[11px]">
        <thead>
          <tr className="bg-muted/40">
            <th className="text-start px-3 py-2 font-mono font-semibold w-48">
              tenant ↓ · user →
            </th>
            {USERS.map((u) => (
              <th
                key={u.id}
                className={cn(
                  "px-3 py-2 text-center font-medium min-w-28",
                  u.id === ctx.user.id && "bg-primary/10",
                )}
              >
                <div className="flex flex-col items-center gap-0.5">
                  <span>{u.name}</span>
                  <Badge
                    variant="outline"
                    className="font-mono text-[9px] uppercase"
                  >
                    {u.role}
                  </Badge>
                </div>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {TENANTS.map((t) => (
            <tr
              key={t.id}
              className={cn(
                "border-t border-border",
                t.id === ctx.tenant.id && "bg-primary/5",
              )}
            >
              <td className="px-3 py-2 font-mono">
                <div className="flex flex-col gap-0.5">
                  <span className="font-semibold">{t.name}</span>
                  <span className="text-[9px] text-muted-foreground">
                    {t.plan} · {t.cohort} · {t.region.toUpperCase()} · b
                    {t.bucketPercent}
                  </span>
                </div>
              </td>
              {USERS.map((u) => {
                const cell = cells.find(
                  (c) => c.tenant.id === t.id && c.user.id === u.id,
                );
                if (!cell) {
                  return (
                    <td
                      key={u.id}
                      className="px-2 py-2 text-center text-muted-foreground"
                    >
                      —
                    </td>
                  );
                }
                const highlighted =
                  t.id === ctx.tenant.id && u.id === ctx.user.id;
                return (
                  <td
                    key={u.id}
                    className={cn(
                      "px-2 py-2 text-center",
                      highlighted && "ring-1 ring-primary/40 rounded",
                    )}
                  >
                    <HoverCard>
                      <HoverCardTrigger
                        render={
                          <span
                            className={cn(
                              "inline-flex size-5 items-center justify-center rounded-full cursor-help text-white text-[10px] font-bold transition-transform hover:scale-110",
                              cell.allowed
                                ? "bg-emerald-500"
                                : "bg-destructive",
                            )}
                          />
                        }
                      >
                        {cell.allowed ? "✓" : "×"}
                      </HoverCardTrigger>
                      <HoverCardContent
                        className="w-80 p-3"
                        sideOffset={6}
                      >
                        <div className="flex items-center gap-2 pb-2 mb-2 border-b border-border">
                          <Badge
                            variant={cell.allowed ? "outline" : "destructive"}
                            className={cn(
                              "text-[9px] tracking-wider uppercase",
                              cell.allowed &&
                                "border-emerald-300 bg-emerald-50 text-emerald-700 dark:border-emerald-800 dark:bg-emerald-950 dark:text-emerald-300",
                            )}
                          >
                            {cell.allowed ? "open" : "closed"}
                          </Badge>
                          <span className="text-xs font-semibold truncate">
                            {t.name} · {u.name}
                          </span>
                        </div>
                        <ul className="flex flex-col gap-1.5">
                          {cell.reasons.map((r, i) => (
                            <li
                              key={`${r.type}:${r.key}:${i}`}
                              className={cn(
                                "flex items-start gap-2 rounded-md px-2 py-1 text-[11px]",
                                r.passed
                                  ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300"
                                  : "bg-destructive/10 text-destructive",
                              )}
                            >
                              <span className="font-mono font-bold w-3 text-center shrink-0">
                                {r.passed ? "+" : "×"}
                              </span>
                              <span className="flex flex-col min-w-0 flex-1">
                                <span className="flex items-baseline gap-1.5">
                                  <span className="font-mono text-[9px] uppercase opacity-70">
                                    {r.type}
                                  </span>
                                  <span className="font-mono font-semibold">
                                    {r.label ?? r.key}
                                  </span>
                                </span>
                                {r.message ? (
                                  <span className="opacity-80">
                                    {r.message}
                                  </span>
                                ) : null}
                              </span>
                            </li>
                          ))}
                        </ul>
                      </HoverCardContent>
                    </HoverCard>
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function kindLabel(type: AccessNodeType): string {
  switch (type) {
    case "sidebar_item":
      return "nav";
    case "tab":
      return "tab";
    case "button":
      return "btn";
    case "section":
      return "sec";
    case "route":
      return "rt";
    case "field":
      return "fld";
    default:
      return type;
  }
}
