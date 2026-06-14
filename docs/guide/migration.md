# Migrating from untyped helpers

If your codebase has the original free-string helpers (`permission`, `featureFlag`, `entitlement`, …) from `@access-lens/core`, here's the path to the typed `defineAccessLens` API. Both APIs still ship; you can adopt the typed lens incrementally.

## Before

```ts
import {
  permission,
  featureFlag,
  entitlement,
  plan,
} from "@access-lens/core";

const reasons = [
  permission("billing.read", user.perms.includes("billing.read")),
  featureFlag("billing_v2", flags.billing_v2),
  entitlement("billing", tenant.entitlements.billing),
  plan("enterprise", tenant.plan === "enterprise"),
];
```

Pros: simple, no setup, type-erased.
Cons: typos compile, no autocomplete, percent/variant/date/killswitch flags all look identical at the call site.

## After

```ts
import { defineAccessLens } from "@access-lens/core";

export const al = defineAccessLens({
  permissions: ["billing.read", "billing.write"] as const,
  entitlements: ["billing"] as const,
  plans: ["free", "basic", "growth", "enterprise"] as const,
  flags: {
    billing_v2: { kind: "boolean" },
  },
});

const reasons = [
  al.permission("billing.read", user.perms.includes("billing.read")),
  al.flag.billing_v2.on(flags.billing_v2),
  al.entitlement("billing", tenant.entitlements.billing),
  al.plan.atLeast("enterprise", tenant.plan),
];
```

Pros: typo = compile error, autocomplete from registry, kind-specific signatures.
Cons: requires the one-time config.

## Incremental adoption

Both APIs coexist. You can:

1. Build the lens config in one file.
2. Replace `permission(…)` → `al.permission(…)` one call site at a time.
3. When you replace a `featureFlag(key, …)` call, look at the flag's actual kind and use the matching typed method.

## Mass replacement script

```bash
# In your IDE, find and replace across the codebase
permission(   →   al.permission(
entitlement(  →   al.entitlement(
```

The flag calls aren't a simple find-and-replace because the method depends on the kind. Convert those by hand.

## When to keep the untyped helpers

Dynamic-key catalogs that iterate over arbitrary keys at runtime — for example, a "feature explorer" page that shows every flag — can't use the typed lens because TypeScript can't narrow `lens.flag[runtimeKey]`. Keep the untyped helpers for those generators.

## See also

- [defineAccessLens](/guide/define-access-lens)
- [LLM context](/) — pasteable doc that explains the migration to an LLM
