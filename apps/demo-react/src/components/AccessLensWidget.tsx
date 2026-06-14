import { useMemo, useState } from "react";
import {
  useAccessLens,
  useAccessLensSnapshot,
  type AccessNode,
  type AccessNodeType,
} from "@access-lens/react";
import {
  RiEyeLine,
  RiSparklingLine,
} from "@remixicon/react";
import { Badge } from "@workspace/ui/components/badge";
import { Button } from "@workspace/ui/components/button";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@workspace/ui/components/collapsible";
import { Input } from "@workspace/ui/components/input";
import {
  Item,
  ItemActions,
  ItemContent,
  ItemGroup,
  ItemMedia,
  ItemTitle,
} from "@workspace/ui/components/item";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@workspace/ui/components/sheet";
import {
  ToggleGroup,
  ToggleGroupItem,
} from "@workspace/ui/components/toggle-group";
import { cn } from "@workspace/ui/lib/utils";
import { GatedHoverPanel } from "./ExplainedGate.js";

const TYPES: AccessNodeType[] = [
  "sidebar_item",
  "tab",
  "button",
  "section",
  "route",
  "field",
];

type StatusFilter = "all" | "allowed" | "denied";
type TypeFilter = "all" | AccessNodeType;

export function AccessLensWidget() {
  const snapshot = useAccessLensSnapshot();
  const { debugMode, setDebugMode } = useAccessLens();
  const [open, setOpen] = useState(false);
  const [typeFilter, setTypeFilter] = useState<TypeFilter>("all");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    return snapshot.nodes.filter((n) => {
      if (typeFilter !== "all" && n.type !== typeFilter) return false;
      if (statusFilter !== "all" && n.status !== statusFilter) return false;
      if (query) {
        const hay = `${n.id} ${n.label}`.toLowerCase();
        if (!hay.includes(query.toLowerCase())) return false;
      }
      return true;
    });
  }, [snapshot.nodes, typeFilter, statusFilter, query]);

  const grouped = useMemo(() => {
    const map = new Map<AccessNodeType, AccessNode[]>();
    for (const node of filtered) {
      const arr = map.get(node.type) ?? [];
      arr.push(node);
      map.set(node.type, arr);
    }
    for (const arr of map.values()) {
      arr.sort((a, b) => a.label.localeCompare(b.label));
    }
    return map;
  }, [filtered]);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger
        render={
          <Button
            size="sm"
            variant="default"
            className="fixed bottom-4 end-4 z-50 shadow-xl gap-2 rounded-full pl-3 pr-3.5"
          />
        }
      >
        <RiSparklingLine />
        <span>Access Lens</span>
        <Badge
          variant="outline"
          className={cn(
            "border-transparent bg-background/20 text-primary-foreground font-mono text-[10px]",
          )}
        >
          {snapshot.counts.allowed}/{snapshot.counts.total}
        </Badge>
      </SheetTrigger>
      <SheetContent
        className="w-full sm:max-w-[460px] flex flex-col gap-0 p-0"
        side="right"
      >
        <SheetHeader className="pb-3 border-b border-border">
          <SheetTitle className="flex items-center gap-2">
            <span className="size-2 rounded-full bg-primary" />
            Access Lens · inspector
          </SheetTitle>
          <SheetDescription>
            Live snapshot of every AccessNode registered with the core client.
          </SheetDescription>
        </SheetHeader>

        <div className="px-6 py-3 grid grid-cols-3 gap-2 border-b border-border">
          <Stat
            label="Allowed"
            value={snapshot.counts.allowed}
            total={snapshot.counts.total}
            tone="ok"
          />
          <Stat
            label="Denied"
            value={snapshot.counts.denied}
            total={snapshot.counts.total}
            tone="no"
          />
          <Stat
            label="Unknown"
            value={snapshot.counts.unknown}
            total={snapshot.counts.total}
            tone="muted"
          />
        </div>

        <div className="px-6 py-3 flex flex-col gap-2 border-b border-border">
          <ToggleGroup
            value={[statusFilter]}
            onValueChange={(arr) => {
              const next = arr[0];
              if (
                next === "all" ||
                next === "allowed" ||
                next === "denied"
              ) {
                setStatusFilter(next);
              }
            }}
            variant="outline"
            size="sm"
            className="w-fit"
          >
            <ToggleGroupItem value="all" className="h-7 px-3 text-[11px]">
              All
            </ToggleGroupItem>
            <ToggleGroupItem
              value="allowed"
              className="h-7 px-3 text-[11px]"
            >
              Allowed
            </ToggleGroupItem>
            <ToggleGroupItem
              value="denied"
              className="h-7 px-3 text-[11px]"
            >
              Denied
            </ToggleGroupItem>
          </ToggleGroup>
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
            className="flex-wrap"
          >
            <ToggleGroupItem value="all" className="h-7 px-2 text-[10px]">
              all
            </ToggleGroupItem>
            {TYPES.map((t) => (
              <ToggleGroupItem
                key={t}
                value={t}
                className="h-7 px-2 text-[10px] font-mono"
              >
                {kindLabel(t)}
              </ToggleGroupItem>
            ))}
          </ToggleGroup>
          <div className="flex items-center gap-2">
            <Input
              placeholder="filter id / label…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="h-8 flex-1"
            />
            <Button
              size="sm"
              variant={debugMode ? "default" : "outline"}
              onClick={() => setDebugMode(!debugMode)}
              className="gap-1.5"
            >
              <RiEyeLine />
              Debug
            </Button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-3">
          {filtered.length === 0 ? (
            <p className="text-center text-[11px] text-muted-foreground italic py-8">
              No nodes match these filters.
            </p>
          ) : (
            <div className="flex flex-col gap-4">
              {Array.from(grouped.entries()).map(([type, nodes]) => (
                <section key={type} className="flex flex-col gap-1.5">
                  <h3 className="text-[10px] uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                    <span>{kindLabel(type)}</span>
                    <Badge variant="secondary" className="text-[9px]">
                      {nodes.length}
                    </Badge>
                  </h3>
                  <ItemGroup>
                    {nodes.map((node) => (
                      <NodeRow key={node.id} node={node} />
                    ))}
                  </ItemGroup>
                </section>
              ))}
            </div>
          )}
        </div>

        <footer className="px-6 py-3 border-t border-border text-[10px] text-muted-foreground flex items-center justify-between">
          <span>
            generatedAt{" "}
            <code className="font-mono">{snapshot.generatedAt}</code>
          </span>
          <span>{snapshot.counts.total} nodes registered</span>
        </footer>
      </SheetContent>
    </Sheet>
  );
}

function Stat({
  label,
  value,
  total,
  tone,
}: {
  label: string;
  value: number;
  total: number;
  tone: "ok" | "no" | "muted";
}) {
  const ratio = total > 0 ? value / total : 0;
  return (
    <div
      className={cn(
        "rounded-xl border p-2.5 flex flex-col gap-0.5",
        tone === "ok" &&
          "border-emerald-300/60 bg-emerald-50/40 dark:border-emerald-900/60 dark:bg-emerald-950/30",
        tone === "no" &&
          "border-destructive/30 bg-destructive/5",
        tone === "muted" && "border-border bg-muted/30",
      )}
    >
      <span className="text-[10px] uppercase tracking-wider text-muted-foreground">
        {label}
      </span>
      <strong className="text-lg leading-tight">{value}</strong>
      <span className="font-mono text-[10px] text-muted-foreground">
        {Math.round(ratio * 100)}%
      </span>
    </div>
  );
}

function NodeRow({ node }: { node: AccessNode }) {
  const [open, setOpen] = useState(false);
  const allowed = node.status === "allowed";
  const denials = node.reasons.filter((r) => !r.passed).length;

  function highlight(on: boolean) {
    if (typeof document === "undefined") return;
    const els = document.querySelectorAll(
      `[data-access-lens-id="${cssEscape(node.id)}"]`,
    );
    els.forEach((el) => {
      const target = el as HTMLElement;
      if (on) {
        target.dataset.alHighlight = "1";
        target.style.boxShadow = "0 0 0 3px rgb(37 99 235 / 0.6)";
      } else {
        delete target.dataset.alHighlight;
        target.style.boxShadow = "";
      }
    });
  }

  return (
    <Collapsible open={open} onOpenChange={setOpen}>
      <Item
        size="xs"
        variant="outline"
        className={cn(
          "transition-colors",
          allowed
            ? "border-emerald-300/60 bg-emerald-50/30 dark:border-emerald-900/60 dark:bg-emerald-950/20"
            : "border-destructive/30 bg-destructive/5",
        )}
        onMouseEnter={() => highlight(true)}
        onMouseLeave={() => highlight(false)}
      >
        <ItemMedia>
          <span
            className={cn(
              "size-2 rounded-full",
              allowed ? "bg-emerald-500" : "bg-destructive",
            )}
          />
        </ItemMedia>
        <ItemContent>
          <ItemTitle className="text-[12px]">{node.label}</ItemTitle>
          <span className="font-mono text-[10px] text-muted-foreground truncate">
            {node.id}
          </span>
        </ItemContent>
        <ItemActions>
          {denials > 0 ? (
            <Badge
              variant="destructive"
              className="text-[9px] uppercase tracking-wider"
            >
              {denials} fail
            </Badge>
          ) : null}
          <CollapsibleTrigger
            render={
              <Badge
                variant="outline"
                className="cursor-pointer uppercase text-[9px] tracking-wider"
              />
            }
          >
            {open ? "collapse" : "inspect"}
          </CollapsibleTrigger>
        </ItemActions>
      </Item>
      <CollapsibleContent>
        <div className="mt-1.5 rounded-xl border border-border bg-card p-3">
          <GatedHoverPanel node={node} allowed={allowed} />
        </div>
      </CollapsibleContent>
    </Collapsible>
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

function cssEscape(value: string): string {
  if (typeof CSS !== "undefined" && typeof CSS.escape === "function") {
    return CSS.escape(value);
  }
  return value.replace(/["\\]/g, "\\$&");
}
