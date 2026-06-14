# Recipe: feature flag rollout

Gradually roll a feature out to N% of tenants.

## Setup

```ts
const al = defineAccessLens({
  flags: {
    new_dashboard: { kind: "percent" },
  },
  // …
});
```

## Compute the tenant bucket

Each tenant needs a deterministic bucket in `[0, 100)`. Compute it once when the tenant is created and store it.

```ts
import { createHash } from "node:crypto";

function bucketOf(tenantId: string): number {
  const hash = createHash("sha256").update(tenantId).digest("hex");
  return parseInt(hash.slice(0, 8), 16) % 100;
}

await db.tenants.update(tenant.id, {
  bucketPercent: bucketOf(tenant.id),
});
```

## At gates

```tsx
<AccessGate
  id="sidebar.new-dashboard"
  type="sidebar_item"
  label="New dashboard"
  reasons={[
    al.flag.new_dashboard.inRollout(25, tenant.bucketPercent),
  ]}
>
  <a href="/dashboard/v2">Dashboard</a>
</AccessGate>
```

Set the rollout threshold to 25 — 25% of tenants get it. Bump to 50, 75, 100 as you ramp.

## Controlling the rollout

Store the rollout threshold somewhere editable — a feature-flag SDK, a config table, or an env var.

```ts
const threshold = await flagSdk.getNumber("new_dashboard_rollout") ?? 0;
al.flag.new_dashboard.inRollout(threshold, tenant.bucketPercent);
```

When you change `threshold` from 25 to 50 in your flag dashboard, every tenant with a bucket between 25 and 49 instantly gets the feature.

## With LaunchDarkly

LaunchDarkly's percentage rollouts already pick a bucket per tenant. Use the result directly:

```ts
const enabled = await ldClient.variation("new_dashboard", { kind: "tenant", key: tenant.id }, false);
al.flag.new_dashboard.inRollout(enabled ? 100 : 0, 0);
// or just use the boolean kind:
// al.flag.new_dashboard_bool.on(enabled);
```

## See also

- [Feature flags guide](/guide/feature-flags)
- [Recipe: LaunchDarkly integration](/recipes/launchdarkly)
