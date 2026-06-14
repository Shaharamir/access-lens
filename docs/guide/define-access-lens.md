# defineAccessLens

The single configuration call that powers everything. Declare every permission, entitlement, plan, flag, and surface your app understands; receive a typed object whose every method autocompletes from your declaration.

## Basic shape

```ts
import { defineAccessLens } from "@access-lens/core";

export const al = defineAccessLens({
  permissions: ["billing.read", "billing.write"] as const,
  entitlements: ["billing", "analytics"] as const,
  plans: ["free", "basic", "growth", "enterprise"] as const,
  flags: {
    billing_v2: { kind: "boolean" },
  },
  surfaces: ["sidebar.billing"] as const,
});
```

`al` now exposes typed reason builders for every key declared.

## Why `as const`

`as const` keeps each array as a readonly tuple of literal strings so TypeScript can derive a `"billing.read" | "billing.write"` union. Without it the type widens to `string[]` and you lose autocomplete.

```ts
// ✗ widens to string[] — no autocomplete
permissions: ["billing.read"]

// ✓ preserves literal — autocomplete works
permissions: ["billing.read"] as const
```

## Required vs optional fields

| Field | Required | Notes |
|---|---|---|
| `permissions` | yes | Permission keys your app understands. |
| `entitlements` | yes | Per-tenant feature add-ons. |
| `plans` | yes | Ordered from lowest to highest tier. Order matters for `plan.atLeast`. |
| `flags` | yes | Map of key to `{ kind: … }`. See [Feature flags](/guide/feature-flags). |
| `tenantConfig` | no | Typed tenant-config keys. |
| `surfaces` | no | Typed `AccessGate#id` values. |

## Full reference

See the [`defineAccessLens` API page](/api/define-access-lens) for every method, parameter, and return type.

## See also

- [Permissions](/guide/permissions)
- [Plans & entitlements](/guide/plans-entitlements)
- [Feature flags](/guide/feature-flags)
- [Surfaces](/guide/surfaces)
