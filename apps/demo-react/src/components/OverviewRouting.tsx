import { useMemo } from "react";
import { evaluateAccess, type AccessNode } from "@access-lens/react";
import { RiArrowRightLine, RiCheckLine, RiCloseLine } from "@remixicon/react";
import { Badge } from "@workspace/ui/components/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@workspace/ui/components/card";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyTitle,
} from "@workspace/ui/components/empty";
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "@workspace/ui/components/hover-card";
import { cn } from "@workspace/ui/lib/utils";
import { overviewCandidates, type AccessContext } from "../access.js";
import { ReasonList } from "./ReasonList.js";
import { RouteSwitch, type RouteCandidate } from "./RouteSwitch.js";

interface OverviewRoutingProps {
  ctx: AccessContext;
}

export function OverviewRouting({ ctx }: OverviewRoutingProps) {
  const candidates = useMemo(() => overviewCandidates(ctx), [ctx]);

  return (
    <div className="flex flex-col gap-4">
      <header className="flex items-baseline gap-3 flex-wrap">
        <h3 className="text-sm font-semibold">Overview route resolution</h3>
        <span className="text-xs text-muted-foreground">
          one tab · multiple destinations · first allowed wins
        </span>
      </header>

      <CandidateRibbon candidates={candidates} />

      <RouteSwitch
        candidates={candidates}
        fallback={
          <Empty className="border border-dashed border-border rounded-2xl py-6">
            <EmptyHeader>
              <EmptyTitle>No overview available</EmptyTitle>
              <EmptyDescription>
                All candidate routes are denied for{" "}
                <strong>{ctx.user.name}</strong> on{" "}
                <strong>{ctx.tenant.name}</strong>. Hover the ribbon entries
                above to see why each one failed.
              </EmptyDescription>
            </EmptyHeader>
          </Empty>
        }
      >
        {({ winner }) => (
          <OverviewScreen
            variant={(winner.metadata?.screen as string) ?? "simple"}
            ctx={ctx}
            winner={winner}
          />
        )}
      </RouteSwitch>
    </div>
  );
}

interface CandidateRibbonProps {
  candidates: RouteCandidate[];
}

function CandidateRibbon({ candidates }: CandidateRibbonProps) {
  const nodes = candidates.map((c) =>
    evaluateAccess({
      id: c.id,
      label: c.label,
      type: "route",
      reasons: c.reasons,
    }),
  );
  const winnerIndex = nodes.findIndex((n) => n.status === "allowed");

  return (
    <ol className="flex flex-wrap items-center gap-2">
      {nodes.map((node, i) => {
        const isWinner = i === winnerIndex;
        const isShadowed =
          winnerIndex !== -1 && i !== winnerIndex && node.status === "allowed";
        const variant: "winner" | "shadowed" | "allowed" | "denied" =
          node.status === "denied"
            ? "denied"
            : isWinner
              ? "winner"
              : isShadowed
                ? "shadowed"
                : "allowed";

        return (
          <li key={node.id} className="flex items-center gap-2">
            <HoverCard>
              <HoverCardTrigger
                render={
                  <Badge
                    variant="outline"
                    className={cn(
                      "h-auto gap-2 rounded-2xl border px-3 py-1.5 text-xs cursor-help transition-colors normal-case tracking-normal",
                      variant === "winner" &&
                        "border-emerald-500 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300",
                      variant === "shadowed" &&
                        "border-dashed border-emerald-300 bg-emerald-500/5 text-muted-foreground",
                      variant === "denied" &&
                        "border-dashed border-destructive/40 bg-destructive/5 text-muted-foreground",
                      variant === "allowed" && "border-border bg-card",
                    )}
                  />
                }
              >
                <span className="font-mono text-[10px] opacity-60">
                  {i + 1}
                </span>
                <span className="font-medium">{node.label}</span>
                <Badge
                  variant="outline"
                  className={cn(
                    "text-[9px] uppercase tracking-wider",
                    variant === "winner" &&
                      "border-emerald-500 bg-emerald-500/15 text-emerald-700 dark:text-emerald-300",
                    variant === "shadowed" &&
                      "border-emerald-300 bg-transparent text-muted-foreground",
                    variant === "denied" &&
                      "border-destructive/40 bg-destructive/10 text-destructive",
                  )}
                >
                  {variant === "winner" ? (
                    <>
                      <RiCheckLine className="size-3" /> rendered
                    </>
                  ) : variant === "shadowed" ? (
                    "shadowed"
                  ) : variant === "allowed" ? (
                    "allowed"
                  ) : (
                    <>
                      <RiCloseLine className="size-3" /> denied
                    </>
                  )}
                </Badge>
              </HoverCardTrigger>
              <HoverCardContent className="w-80 p-3" sideOffset={6}>
                <div className="flex items-center gap-2 pb-2 mb-2 border-b border-border">
                  <Badge
                    variant="outline"
                    className="text-[9px] tracking-wider uppercase"
                  >
                    {node.status}
                  </Badge>
                  <span className="text-sm font-semibold truncate">
                    {node.label}
                  </span>
                </div>
                <ReasonList reasons={node.reasons} />
              </HoverCardContent>
            </HoverCard>
            {i < nodes.length - 1 ? (
              <RiArrowRightLine
                aria-hidden
                className="size-4 text-muted-foreground"
              />
            ) : null}
          </li>
        );
      })}
    </ol>
  );
}

interface OverviewScreenProps {
  variant: string;
  ctx: AccessContext;
  winner: AccessNode;
}

function OverviewScreen({ variant, ctx, winner }: OverviewScreenProps) {
  return (
    <Card className="bg-muted/30">
      <CardHeader className="flex items-baseline gap-2 flex-row">
        <span className="text-[10px] uppercase tracking-wider text-muted-foreground">
          Resolved to
        </span>
        <code className="font-mono text-[11px] bg-primary/10 text-primary px-2 py-0.5 rounded-md">
          {winner.id}
        </code>
      </CardHeader>
      <CardContent>
        {variant === "beta_analytics" ? (
          <BetaScreen ctx={ctx} />
        ) : variant === "standard" ? (
          <StandardScreen ctx={ctx} />
        ) : (
          <SimpleScreen ctx={ctx} />
        )}
      </CardContent>
    </Card>
  );
}

function BetaScreen({ ctx }: { ctx: AccessContext }) {
  return (
    <div className="flex flex-col gap-3">
      <p className="text-sm">
        Beta analytics dashboard — KPI tiles + anomaly highlights. Shown
        because <strong>{ctx.tenant.name}</strong> is in cohort{" "}
        <Badge variant="secondary">beta</Badge> and{" "}
        <code className="font-mono text-xs">advanced_reports</code> is on.
      </p>
      <div className="grid grid-cols-3 gap-2">
        <Tile label="GMV" value="$1.42M" delta="+12.4%" />
        <Tile label="Active merchants" value="3,902" delta="+4.1%" />
        <Tile label="Refund anomalies" value="14" delta="flagged" warn />
      </div>
    </div>
  );
}

function StandardScreen({ ctx }: { ctx: AccessContext }) {
  return (
    <div className="flex flex-col gap-2">
      <p className="text-sm">
        Standard overview. Shown because <strong>{ctx.tenant.name}</strong> is
        in cohort <Badge variant="secondary">{ctx.tenant.cohort}</Badge> and
        the beta variant didn't apply.
      </p>
      <ul className="text-sm text-muted-foreground list-disc pl-5">
        <li>Recent activity feed</li>
        <li>Open tasks · 4</li>
        <li>Team announcements</li>
      </ul>
    </div>
  );
}

function SimpleScreen({ ctx }: { ctx: AccessContext }) {
  return (
    <p className="text-sm">
      Welcome, <strong>{ctx.user.name}</strong>. This is the minimal home for
      the <Badge variant="secondary">control</Badge> cohort or tenants without
      cohort-targeted variants.
    </p>
  );
}

interface TileProps {
  label: string;
  value: string;
  delta: string;
  warn?: boolean;
}

function Tile({ label, value, delta, warn }: TileProps) {
  return (
    <Card className="bg-card gap-1 py-3 px-3">
      <CardDescription className="text-[10px] uppercase tracking-wider">
        {label}
      </CardDescription>
      <CardTitle className="text-xl">{value}</CardTitle>
      <em
        className={cn(
          "not-italic text-xs",
          warn
            ? "text-destructive"
            : "text-emerald-600 dark:text-emerald-400",
        )}
      >
        {delta}
      </em>
    </Card>
  );
}
