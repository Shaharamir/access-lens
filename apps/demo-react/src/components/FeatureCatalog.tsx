import { useMemo, useState } from "react";
import { useAccessGate, type AccessNodeType } from "@access-lens/react";
import { RiAddLine, RiSubtractLine } from "@remixicon/react";
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
import { buildCatalog, catalogGroups, type CatalogEntry } from "../catalog.js";
import type { AccessContext } from "../access.js";
import { ReasonList } from "./ReasonList.js";

interface FeatureCatalogProps {
  ctx: AccessContext;
}

type StatusFilter = "all" | "allowed" | "denied";

export function FeatureCatalog({ ctx }: FeatureCatalogProps) {
  const entries = useMemo(() => buildCatalog(ctx), [ctx]);
  const groups = useMemo(() => catalogGroups(), []);

  const [filter, setFilter] = useState<StatusFilter>("all");
  const [query, setQuery] = useState("");

  return (
    <Card className="min-h-96">
      <CardHeader className="gap-3">
        <div className="flex items-start justify-between gap-3 flex-wrap">
          <div>
            <CardTitle>Feature catalog</CardTitle>
            <CardDescription>
              {entries.length} gated surfaces · {groups.length} domains · click
              a row to inspect, hover the <code className="font-mono">?</code>{" "}
              to peek at flag deps.
            </CardDescription>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <ToggleGroup
              value={[filter]}
              onValueChange={(arr) => {
                const next = arr[0];
                if (next === "all" || next === "allowed" || next === "denied") {
                  setFilter(next);
                }
              }}
              variant="outline"
              size="sm"
            >
              <ToggleGroupItem value="all">All</ToggleGroupItem>
              <ToggleGroupItem value="allowed">Allowed</ToggleGroupItem>
              <ToggleGroupItem value="denied">Denied</ToggleGroupItem>
            </ToggleGroup>
            <Input
              placeholder="filter…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="h-8 w-44"
            />
          </div>
        </div>
      </CardHeader>
      <CardContent className="flex flex-col gap-5">
        {groups.map((g) => (
          <CatalogGroup
            key={g}
            group={g}
            entries={entries.filter((e) => e.group === g)}
            filter={filter}
            query={query.trim().toLowerCase()}
          />
        ))}
      </CardContent>
    </Card>
  );
}

interface CatalogGroupProps {
  group: string;
  entries: CatalogEntry[];
  filter: StatusFilter;
  query: string;
}

function CatalogGroup({ group, entries, filter, query }: CatalogGroupProps) {
  const visible = entries.filter((e) => matchesQuery(e, query));
  if (visible.length === 0) return null;

  return (
    <section className="flex flex-col gap-2">
      <h3 className="text-[11px] uppercase tracking-wider text-muted-foreground flex items-center gap-2">
        <span>{group}</span>
        <Badge variant="secondary" className="text-[9px]">
          {visible.length}
        </Badge>
      </h3>
      <Separator />
      <ItemGroup>
        {visible.map((entry) => (
          <CatalogRow key={entry.id} entry={entry} filter={filter} />
        ))}
      </ItemGroup>
    </section>
  );
}

function matchesQuery(entry: CatalogEntry, query: string): boolean {
  if (!query) return true;
  const hay = `${entry.id} ${entry.label} ${entry.module}`.toLowerCase();
  return hay.includes(query);
}

interface CatalogRowProps {
  entry: CatalogEntry;
  filter: StatusFilter;
}

const KIND_LABEL: Record<AccessNodeType, string> = {
  sidebar_item: "nav",
  tab: "tab",
  button: "btn",
  section: "sec",
  route: "rt",
  field: "fld",
  custom: "custom",
};

const KIND_COLOR: Record<AccessNodeType, string> = {
  sidebar_item:
    "bg-violet-100 text-violet-700 dark:bg-violet-950 dark:text-violet-300",
  tab: "bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300",
  button: "bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300",
  section: "bg-pink-100 text-pink-700 dark:bg-pink-950 dark:text-pink-300",
  route: "bg-cyan-100 text-cyan-700 dark:bg-cyan-950 dark:text-cyan-300",
  field: "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300",
  custom: "bg-muted text-muted-foreground",
};

function CatalogRow({ entry, filter }: CatalogRowProps) {
  const { node, allowed } = useAccessGate({
    id: entry.id,
    label: entry.label,
    type: entry.type,
    reasons: entry.reasons,
  });
  const [open, setOpen] = useState(false);

  if (filter === "allowed" && !allowed) return null;
  if (filter === "denied" && allowed) return null;

  const failed = node.reasons.filter((r) => !r.passed);
  const featureFlagReasons = node.reasons.filter((r) => r.type === "feature_flag");
  const passedFlagCount = featureFlagReasons.filter((r) => r.passed).length;

  return (
    <Collapsible open={open} onOpenChange={setOpen}>
      <Item
        size="sm"
        variant="outline"
        data-access-lens-id={entry.id}
        className={cn(
          "transition-colors",
          !allowed && "border-destructive/30 bg-destructive/5",
        )}
      >
        <ItemMedia>
          <span
            className={cn(
              "size-2 rounded-full",
              allowed ? "bg-emerald-500" : "bg-destructive",
            )}
            aria-hidden
          />
          <Badge
            variant="outline"
            className={cn(
              "font-mono text-[9px] uppercase tracking-wider px-1.5 py-0",
              KIND_COLOR[entry.type],
            )}
          >
            {KIND_LABEL[entry.type]}
          </Badge>
        </ItemMedia>
        <ItemContent>
          <ItemTitle>{entry.label}</ItemTitle>
        </ItemContent>
        <ItemActions>
          {featureFlagReasons.length > 0 ? (
            <HoverCard>
              <HoverCardTrigger
                render={
                  <Badge
                    variant="outline"
                    className={cn(
                      "size-5 p-0 flex items-center justify-center cursor-help font-bold text-[10px]",
                      passedFlagCount === featureFlagReasons.length
                        ? "border-indigo-300 bg-indigo-50 text-indigo-700 dark:border-indigo-800 dark:bg-indigo-950 dark:text-indigo-300"
                        : "border-indigo-500 bg-indigo-500 text-white",
                    )}
                    aria-label="feature-flag-gated"
                  />
                }
              >
                ?
              </HoverCardTrigger>
              <HoverCardContent className="w-80 p-3" sideOffset={6}>
                <div className="flex items-center gap-2 pb-2 mb-2 border-b border-border">
                  <Badge
                    variant="outline"
                    className="text-[9px] tracking-wider uppercase"
                  >
                    flag deps
                  </Badge>
                  <span className="text-sm font-semibold truncate">
                    {entry.label}
                  </span>
                </div>
                <ReasonList reasons={featureFlagReasons} />
              </HoverCardContent>
            </HoverCard>
          ) : null}
          {allowed ? (
            <Badge
              variant="outline"
              className="border-emerald-300 bg-emerald-50 text-emerald-700 text-[10px] uppercase tracking-wider dark:border-emerald-800 dark:bg-emerald-950 dark:text-emerald-300"
            >
              allowed
            </Badge>
          ) : (
            <HoverCard>
              <HoverCardTrigger
                render={
                  <Badge
                    variant="destructive"
                    className="cursor-help text-[10px] uppercase tracking-wider"
                  />
                }
              >
                {failed.length} denied
              </HoverCardTrigger>
              <HoverCardContent className="w-80 p-3" sideOffset={6}>
                <div className="flex items-center gap-2 pb-2 mb-2 border-b border-border">
                  <Badge
                    variant="destructive"
                    className="text-[9px] tracking-wider uppercase"
                  >
                    denied
                  </Badge>
                  <span className="text-sm font-semibold truncate">
                    {entry.label}
                  </span>
                </div>
                <ReasonList reasons={node.reasons} />
              </HoverCardContent>
            </HoverCard>
          )}
          <CollapsibleTrigger
            render={
              <Badge
                variant="outline"
                className="size-5 p-0 flex items-center justify-center cursor-pointer text-muted-foreground"
                aria-label={open ? "Collapse" : "Expand"}
              />
            }
          >
            {open ? (
              <RiSubtractLine className="size-3" />
            ) : (
              <RiAddLine className="size-3" />
            )}
          </CollapsibleTrigger>
        </ItemActions>
      </Item>
      <CollapsibleContent>
        <div className="px-4 pt-2 pb-3 bg-muted/30 rounded-b-2xl -mt-2 border border-t-0 border-border">
          <code className="font-mono text-[10.5px] text-muted-foreground block mb-2">
            {entry.id}
          </code>
          <ReasonList reasons={node.reasons} />
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
}
