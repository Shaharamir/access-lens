import { useMemo, useState } from "react";
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
import { Tabs, TabsList, TabsTrigger } from "@workspace/ui/components/tabs";
import {
  ToggleGroup,
  ToggleGroupItem,
} from "@workspace/ui/components/toggle-group";
import { cn } from "@workspace/ui/lib/utils";
import type { AccessReason } from "@access-lens/react";
import type { FlagKey } from "../access-lens.js";
import { featureFlagReason, type AccessContext } from "../access.js";
import { buildCatalog, type CatalogEntry } from "../catalog.js";
import { TENANTS, type FlagDef, type Tenant } from "../data.js";

const KINDS = ["boolean", "variant", "percent", "date", "killswitch"] as const;
type FlagKind = (typeof KINDS)[number];
type StatusFilter = "all" | "open" | "closed";

interface FlagInspectorProps {
  ctx: AccessContext;
}

export function FlagInspector({ ctx }: FlagInspectorProps) {
  const [query, setQuery] = useState("");
  const [kindFilter, setKindFilter] = useState<"all" | FlagKind>("all");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [view, setView] = useState<"list" | "matrix">("list");

  const flagEntries = useMemo(
    () =>
      (Object.entries(ctx.flags) as [string, FlagDef][]).sort((a, b) =>
        a[0].localeCompare(b[0]),
      ),
    [ctx.flags],
  );

  const catalog = useMemo(() => buildCatalog(ctx), [ctx]);

  const affectedByFlag = useMemo(() => {
    const map = new Map<string, CatalogEntry[]>();
    for (const [key] of flagEntries) {
      const surfaces = catalog.filter((entry) =>
        entry.reasons.some(
          (r) => r.type === "feature_flag" && r.key === key,
        ),
      );
      map.set(key, surfaces);
    }
    return map;
  }, [catalog, flagEntries]);

  function evaluateForTenant(key: string, tenant: Tenant): AccessReason {
    return featureFlagReason(
      { tenant, user: ctx.user, flags: ctx.flags },
      key as FlagKey,
    );
  }

  const visibleFlags = flagEntries.filter(([key, def]) => {
    if (kindFilter !== "all" && def.kind !== kindFilter) return false;
    if (query && !key.toLowerCase().includes(query.toLowerCase())) return false;
    if (statusFilter !== "all") {
      const passing = evaluateForTenant(key, ctx.tenant).passed;
      if (statusFilter === "open" && !passing) return false;
      if (statusFilter === "closed" && passing) return false;
    }
    return true;
  });

  const openTenantCount = (key: string) =>
    TENANTS.filter((t) => evaluateForTenant(key, t).passed).length;

  return (
    <Card className="min-h-96">
      <CardHeader className="gap-3">
        <div className="flex items-start justify-between gap-3 flex-wrap">
          <div>
            <CardTitle>Flag inspector</CardTitle>
            <CardDescription>
              {flagEntries.length} flags · per-tenant evaluation · which
              surfaces depend on each. Currently viewing as{" "}
              <strong>{ctx.user.name}</strong> on{" "}
              <strong>{ctx.tenant.name}</strong>.
            </CardDescription>
          </div>
          <Tabs
            value={view}
            onValueChange={(v) => setView(v as "list" | "matrix")}
          >
            <TabsList>
              <TabsTrigger value="list">List</TabsTrigger>
              <TabsTrigger value="matrix">Matrix</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
        <Separator />
        <div className="flex flex-wrap items-center gap-3">
          <ToggleGroup
            value={[kindFilter]}
            onValueChange={(arr) => {
              const next = arr[0];
              if (next === "all" || (KINDS as readonly string[]).includes(next!)) {
                setKindFilter(next as "all" | FlagKind);
              }
            }}
            variant="outline"
            size="sm"
          >
            <ToggleGroupItem value="all">All kinds</ToggleGroupItem>
            {KINDS.map((k) => (
              <ToggleGroupItem key={k} value={k}>
                {k}
              </ToggleGroupItem>
            ))}
          </ToggleGroup>
          <ToggleGroup
            value={[statusFilter]}
            onValueChange={(arr) => {
              const next = arr[0];
              if (next === "all" || next === "open" || next === "closed") {
                setStatusFilter(next);
              }
            }}
            variant="outline"
            size="sm"
          >
            <ToggleGroupItem value="all">All</ToggleGroupItem>
            <ToggleGroupItem value="open">Open here</ToggleGroupItem>
            <ToggleGroupItem value="closed">Closed here</ToggleGroupItem>
          </ToggleGroup>
          <Input
            placeholder="filter flag key…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="h-8 w-44"
          />
          <Badge variant="secondary" className="ml-auto">
            {visibleFlags.length} / {flagEntries.length}
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        {view === "list" ? (
          <ItemGroup>
            {visibleFlags.map(([key, def]) => (
              <FlagDetail
                key={key}
                flagKey={key}
                def={def}
                ctx={ctx}
                affected={affectedByFlag.get(key) ?? []}
                openTenantCount={openTenantCount(key)}
                evaluateForTenant={evaluateForTenant}
              />
            ))}
            {visibleFlags.length === 0 ? (
              <p className="text-sm text-muted-foreground italic px-2 py-4 text-center">
                No flags match the current filters.
              </p>
            ) : null}
          </ItemGroup>
        ) : (
          <FlagMatrix
            flags={visibleFlags}
            ctx={ctx}
            evaluateForTenant={evaluateForTenant}
            affectedByFlag={affectedByFlag}
          />
        )}
      </CardContent>
    </Card>
  );
}

interface FlagDetailProps {
  flagKey: string;
  def: FlagDef;
  ctx: AccessContext;
  affected: CatalogEntry[];
  openTenantCount: number;
  evaluateForTenant: (key: string, tenant: Tenant) => AccessReason;
}

function FlagDetail({
  flagKey,
  def,
  ctx,
  affected,
  openTenantCount,
  evaluateForTenant,
}: FlagDetailProps) {
  const [open, setOpen] = useState(false);
  const passingForCurrentTenant = evaluateForTenant(flagKey, ctx.tenant).passed;

  return (
    <Collapsible open={open} onOpenChange={setOpen}>
      <Item
        size="sm"
        variant="outline"
        className={cn(
          passingForCurrentTenant
            ? "border-indigo-300/70 bg-indigo-50/40 dark:border-indigo-900/70 dark:bg-indigo-950/30"
            : "border-destructive/30 bg-destructive/5",
        )}
      >
        <ItemMedia>
          <Badge
            variant="outline"
            className="font-mono text-[9px] uppercase tracking-wider"
          >
            {def.kind}
          </Badge>
        </ItemMedia>
        <ItemContent>
          <ItemTitle className="font-mono">
            {flagKey}
            <FlagStateBadge def={def} />
          </ItemTitle>
          <ItemDescription className="text-[11px]">
            open for {openTenantCount}/{TENANTS.length} tenants · affects{" "}
            {affected.length} surface{affected.length === 1 ? "" : "s"}
          </ItemDescription>
        </ItemContent>
        <ItemActions>
          <Badge
            variant={passingForCurrentTenant ? "outline" : "destructive"}
            className={cn(
              "uppercase text-[10px] tracking-wider",
              passingForCurrentTenant &&
                "border-emerald-300 bg-emerald-50 text-emerald-700 dark:border-emerald-800 dark:bg-emerald-950 dark:text-emerald-300",
            )}
          >
            {passingForCurrentTenant ? "open here" : "closed here"}
          </Badge>
          <CollapsibleTrigger
            render={
              <Badge
                variant="outline"
                className="cursor-pointer uppercase text-[10px] tracking-wider"
              />
            }
          >
            {open ? "collapse" : "details"}
          </CollapsibleTrigger>
        </ItemActions>
      </Item>
      <CollapsibleContent>
        <div className="px-3 pt-2 pb-3 -mt-2 rounded-b-2xl border border-t-0 border-border bg-muted/30 grid gap-3 md:grid-cols-2">
          <FlagTenantPanel
            flagKey={flagKey}
            evaluateForTenant={evaluateForTenant}
          />
          <FlagSurfacesPanel affected={affected} />
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
}

function FlagTenantPanel({
  flagKey,
  evaluateForTenant,
}: {
  flagKey: string;
  evaluateForTenant: (key: string, tenant: Tenant) => AccessReason;
}) {
  return (
    <div>
      <h4 className="text-[10px] uppercase tracking-wider text-muted-foreground mb-2">
        Per tenant
      </h4>
      <ItemGroup>
        {TENANTS.map((tenant) => {
          const e = evaluateForTenant(flagKey, tenant);
          return (
            <HoverCard key={tenant.id}>
              <HoverCardTrigger
                render={
                  <Item
                    size="xs"
                    variant="outline"
                    className="cursor-help"
                  />
                }
              >
                <ItemMedia>
                  <span
                    className={cn(
                      "size-2 rounded-full",
                      e.passed ? "bg-emerald-500" : "bg-destructive",
                    )}
                  />
                </ItemMedia>
                <ItemContent>
                  <ItemTitle className="text-[12px]">{tenant.name}</ItemTitle>
                  <ItemDescription className="text-[10px] font-mono">
                    plan: {tenant.plan} · cohort: {tenant.cohort} · bucket:{" "}
                    {tenant.bucketPercent}
                  </ItemDescription>
                </ItemContent>
                <ItemActions>
                  <Badge
                    variant={e.passed ? "outline" : "destructive"}
                    className={cn(
                      "uppercase text-[9px] tracking-wider",
                      e.passed &&
                        "border-emerald-300 bg-emerald-50 text-emerald-700 dark:border-emerald-800 dark:bg-emerald-950 dark:text-emerald-300",
                    )}
                  >
                    {e.passed ? "open" : "closed"}
                  </Badge>
                </ItemActions>
              </HoverCardTrigger>
              <HoverCardContent className="w-72 p-3" sideOffset={6}>
                <div className="text-xs font-semibold mb-1">{tenant.name}</div>
                <p className="text-[11px] text-muted-foreground mb-2">
                  {e.message ?? (e.passed ? "Flag passes for this tenant." : "Flag fails for this tenant.")}
                </p>
                <div className="font-mono text-[10.5px] text-muted-foreground">
                  <em className="not-italic opacity-60">expected</em>{" "}
                  {String(e.expected)}
                  {"  ·  "}
                  <em className="not-italic opacity-60">actual</em>{" "}
                  {String(e.actual)}
                </div>
              </HoverCardContent>
            </HoverCard>
          );
        })}
      </ItemGroup>
    </div>
  );
}

function FlagSurfacesPanel({ affected }: { affected: CatalogEntry[] }) {
  return (
    <div>
      <h4 className="text-[10px] uppercase tracking-wider text-muted-foreground mb-2">
        Affected surfaces ({affected.length})
      </h4>
      {affected.length === 0 ? (
        <p className="text-[11px] text-muted-foreground italic">
          No catalog surfaces depend on this flag.
        </p>
      ) : (
        <ItemGroup>
          {affected.slice(0, 20).map((entry) => (
            <Item key={entry.id} size="xs" variant="outline">
              <ItemMedia>
                <Badge
                  variant="outline"
                  className="font-mono text-[9px] uppercase"
                >
                  {entry.type}
                </Badge>
              </ItemMedia>
              <ItemContent>
                <ItemTitle className="text-[12px]">{entry.label}</ItemTitle>
                <ItemDescription className="font-mono text-[10px]">
                  {entry.id}
                </ItemDescription>
              </ItemContent>
            </Item>
          ))}
          {affected.length > 20 ? (
            <p className="text-[11px] text-muted-foreground italic px-2 pt-1">
              + {affected.length - 20} more
            </p>
          ) : null}
        </ItemGroup>
      )}
    </div>
  );
}

function FlagStateBadge({ def }: { def: FlagDef }) {
  switch (def.kind) {
    case "boolean":
      return (
        <Badge
          variant={def.on ? "outline" : "destructive"}
          className={cn(
            "ml-2 text-[9px] uppercase tracking-wider",
            def.on &&
              "border-emerald-300 bg-emerald-50 text-emerald-700 dark:border-emerald-800 dark:bg-emerald-950 dark:text-emerald-300",
          )}
        >
          {def.on ? "on" : "off"}
        </Badge>
      );
    case "killswitch":
      return (
        <Badge
          variant={def.engaged ? "destructive" : "outline"}
          className={cn(
            "ml-2 text-[9px] uppercase tracking-wider",
            !def.engaged &&
              "border-emerald-300 bg-emerald-50 text-emerald-700 dark:border-emerald-800 dark:bg-emerald-950 dark:text-emerald-300",
          )}
        >
          {def.engaged ? "engaged" : "off"}
        </Badge>
      );
    case "variant":
      return (
        <Badge variant="secondary" className="ml-2 text-[9px] uppercase tracking-wider">
          {def.value}
        </Badge>
      );
    case "percent":
      return (
        <Badge variant="secondary" className="ml-2 text-[9px] uppercase tracking-wider">
          {def.rollout}%
        </Badge>
      );
    case "date":
      return (
        <Badge variant="secondary" className="ml-2 text-[9px] uppercase tracking-wider font-mono">
          {def.activeFrom}
        </Badge>
      );
  }
}

interface FlagMatrixProps {
  flags: Array<[string, FlagDef]>;
  ctx: AccessContext;
  evaluateForTenant: (key: string, tenant: Tenant) => AccessReason;
  affectedByFlag: Map<string, CatalogEntry[]>;
}

function FlagMatrix({ flags, ctx, evaluateForTenant, affectedByFlag }: FlagMatrixProps) {
  if (flags.length === 0) {
    return (
      <p className="text-sm text-muted-foreground italic px-2 py-4 text-center">
        No flags match the current filters.
      </p>
    );
  }
  return (
    <div className="overflow-x-auto rounded-2xl border border-border">
      <table className="w-full border-collapse text-[11px]">
        <thead className="bg-muted/40 sticky top-0">
          <tr>
            <th className="text-left px-3 py-2 font-mono font-semibold w-64">
              flag
            </th>
            <th className="text-left px-2 py-2 font-mono font-semibold w-20">
              kind
            </th>
            <th className="text-left px-2 py-2 font-mono font-semibold w-20">
              surfaces
            </th>
            {TENANTS.map((t) => (
              <th
                key={t.id}
                className={cn(
                  "px-2 py-2 font-medium text-center min-w-24",
                  t.id === ctx.tenant.id && "bg-primary/10",
                )}
              >
                <div className="flex flex-col items-center gap-0.5">
                  <span className="truncate max-w-24">{t.name}</span>
                  <span className="font-mono text-[9px] text-muted-foreground">
                    {t.plan} · {t.cohort} · {t.bucketPercent}
                  </span>
                </div>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {flags.map(([key, def]) => {
            const affected = affectedByFlag.get(key) ?? [];
            return (
              <tr key={key} className="border-t border-border">
                <td className="px-3 py-2 font-mono">
                  <span className="flex items-center gap-2">
                    {key}
                    <FlagStateBadge def={def} />
                  </span>
                </td>
                <td className="px-2 py-2">
                  <Badge variant="outline" className="font-mono text-[9px] uppercase">
                    {def.kind}
                  </Badge>
                </td>
                <td className="px-2 py-2">
                  <Badge variant="secondary" className="text-[9px]">
                    {affected.length}
                  </Badge>
                </td>
                {TENANTS.map((t) => {
                  const e = evaluateForTenant(key, t);
                  return (
                    <td
                      key={t.id}
                      className={cn(
                        "px-2 py-2 text-center",
                        t.id === ctx.tenant.id && "bg-primary/5",
                      )}
                    >
                      <HoverCard>
                        <HoverCardTrigger
                          render={
                            <span
                              className={cn(
                                "inline-flex size-4 items-center justify-center rounded-full cursor-help text-white text-[10px] font-bold",
                                e.passed
                                  ? "bg-emerald-500"
                                  : "bg-destructive",
                              )}
                            />
                          }
                        >
                          {e.passed ? "✓" : "×"}
                        </HoverCardTrigger>
                        <HoverCardContent className="w-72 p-3" sideOffset={6}>
                          <div className="text-xs font-semibold mb-1">
                            {t.name} · <span className="font-mono">{key}</span>
                          </div>
                          <p className="text-[11px] text-muted-foreground mb-2">
                            {e.message ?? (e.passed ? "Flag passes." : "Flag fails.")}
                          </p>
                          <div className="font-mono text-[10.5px] text-muted-foreground">
                            <em className="not-italic opacity-60">expected</em>{" "}
                            {String(e.expected)}
                            {"  ·  "}
                            <em className="not-italic opacity-60">actual</em>{" "}
                            {String(e.actual)}
                          </div>
                        </HoverCardContent>
                      </HoverCard>
                    </td>
                  );
                })}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
