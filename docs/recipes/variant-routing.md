# Recipe: variant routing

Same UI affordance (e.g. an Overview tab) leads to different screens for different cohorts. Model each destination as its own `AccessGate` with mutually-exclusive reasons; the first allowed one renders.

## Setup

```ts
const al = defineAccessLens({
  flags: {
    advanced_reports: { kind: "boolean" },
  },
  // …
});
```

## RouteSwitch component

```tsx
import { evaluateAccess } from "@access-lens/core";

interface RouteCandidate {
  id: string;
  label: string;
  reasons: AccessReason[];
  metadata?: Record<string, unknown>;
}

function RouteSwitch({
  candidates,
  fallback,
  children,
}: {
  candidates: RouteCandidate[];
  fallback?: ReactNode;
  children: (winner: AccessNode) => ReactNode;
}) {
  const nodes = candidates.map(c =>
    evaluateAccess({ id: c.id, label: c.label, type: "route", reasons: c.reasons })
  );
  const winner = nodes.find(n => n.status === "allowed");
  return (
    <>
      {candidates.map(c => <RouteRegistrar key={c.id} candidate={c} />)}
      {winner ? children(winner) : fallback}
    </>
  );
}

function RouteRegistrar({ candidate }: { candidate: RouteCandidate }) {
  useAccessGate({
    id: candidate.id,
    label: candidate.label,
    type: "route",
    reasons: candidate.reasons,
    metadata: candidate.metadata,
  });
  return null;
}
```

## Defining candidates

```ts
const overviewCandidates = (ctx) => [
  {
    id: "route.overview.beta",
    label: "Beta analytics overview",
    reasons: [
      al.permission("reports.read", ctx.user.perms.has("reports.read")),
      al.condition("cohort = beta", ctx.tenant.cohort === "beta"),
      al.flag.advanced_reports.on(ctx.flags.advanced_reports.on),
    ],
  },
  {
    id: "route.overview.standard",
    label: "Standard overview",
    reasons: [
      al.permission("reports.read", ctx.user.perms.has("reports.read")),
      al.condition("cohort in beta|ga", ["beta", "ga"].includes(ctx.tenant.cohort)),
    ],
  },
  {
    id: "route.overview.simple",
    label: "Simple overview",
    reasons: [
      al.permission("reports.read", ctx.user.perms.has("reports.read")),
    ],
  },
];
```

## Using it

```tsx
<RouteSwitch
  candidates={overviewCandidates(ctx)}
  fallback={<p>No overview available.</p>}
>
  {winner => <OverviewScreen variantId={winner.id} />}
</RouteSwitch>
```

All three candidates register as nodes, so the debug overlay's catalog and matrix show every destination — not just the winner.

## See also

- [Feature flags guide](/guide/feature-flags)
- [Snapshot inspection](/guide/snapshot)
