# `defineAccessLens(config)`

Build a typed access lens from a single configuration object.

## Signature

```ts
function defineAccessLens<
  TPerm extends readonly string[],
  TEnt extends readonly string[],
  TPlan extends readonly string[],
  TFlags extends FlagMap,
  TTenantCfg extends readonly string[] = readonly [],
  TSurfaces extends readonly string[] = readonly [],
>(config: AccessLensConfig<TPerm, TEnt, TPlan, TFlags, TTenantCfg, TSurfaces>): AccessLens<…>
```

## Config

| Field | Type | Required | Description |
|---|---|---|---|
| `permissions` | `readonly string[]` | ✅ | Every permission key your app understands. Use `as const` to preserve literals. |
| `entitlements` | `readonly string[]` | ✅ | Every entitlement key (per-tenant feature add-ons). |
| `plans` | `readonly string[]` | ✅ | Plans listed **from lowest to highest tier** (used by `plan.atLeast`). |
| `flags` | `Record<string, FlagSpec>` | ✅ | Map of flag key → `{ kind: "boolean" \| "killswitch" \| "variant" \| "percent" \| "date" }`. Variant flags additionally take `choices: readonly string[] as const`. |
| `tenantConfig` | `readonly string[]` | optional | Typed tenant-config keys (e.g. `"legacy"`, `"region"`). |
| `surfaces` | `readonly string[]` | optional | Typed surface ids — narrows `AccessGate#id`. |

## Returns

An `AccessLens` object with these methods:

### `al.permission(key, passed, options?): AccessReason`

`key` autocompletes from `config.permissions`.

```ts
al.permission("billing.read", user.perms.has("billing.read"));
```

### `al.entitlement(key, granted, options?): AccessReason`

```ts
al.entitlement("billing", tenant.entitlements.billing);
```

### `al.plan.is(want, actual, options?): AccessReason`

Passes when `actual === want`.

```ts
al.plan.is("enterprise", tenant.plan);
```

### `al.plan.atLeast(min, actual, options?): AccessReason`

Passes when `actual`'s index in the declared `plans` array is ≥ `min`'s index.

```ts
al.plan.atLeast("growth", tenant.plan);
// passes for growth, enterprise; fails for free, basic
```

### `al.flag.<key>.<method>(…): AccessReason`

The method exposed depends on the flag's declared `kind`:

| Kind | Method | Signature |
|---|---|---|
| `boolean` | `.on()` | `(value: boolean) => AccessReason` |
| `killswitch` | `.notEngaged()` | `(engaged: boolean) => AccessReason` — passes when engaged is **false** |
| `variant` | `.is()` | `(want: C, actual: C) => AccessReason` — where `C` is the union of declared choices |
| `percent` | `.inRollout()` | `(threshold: number, bucket: number) => AccessReason` — passes when bucket < threshold |
| `date` | `.activeFrom()` | `(activeFrom: string, today: string) => AccessReason` — ISO date strings, passes when today ≥ activeFrom |

### `al.condition(label, passed, options?): AccessReason`

Free-form. Use for one-off named conditions like `"tenant is not legacy"`.

### `al.tenantConfig(key, passed, options?): AccessReason`

`key` autocompletes from `config.tenantConfig` if declared, otherwise `string`.

### `al.custom(key, passed, options?): AccessReason`

Escape hatch for reason types Access Lens doesn't model directly.

### `al.surfaces: readonly string[]`

The surfaces array you declared (or `[]` if you didn't). Useful with `SurfaceIdOf<typeof al>`.

### `al.config`

A frozen reference to the config you passed in — useful for introspection.

## Example

```ts
import { defineAccessLens, type SurfaceIdOf } from "@access-lens/core";

export const al = defineAccessLens({
  permissions: [
    "billing.read", "billing.write",
    "payouts.read", "payouts.write",
    "reports.read", "reports.export",
  ] as const,

  entitlements: ["billing", "payouts", "analytics"] as const,

  plans: ["free", "basic", "growth", "enterprise"] as const,

  flags: {
    billing_v2:       { kind: "boolean" },
    payouts_killswitch:{ kind: "killswitch" },
    checkout_version: { kind: "variant", choices: ["v1", "v2", "v3"] as const },
    new_invoicing:    { kind: "percent" },
    q3_features:      { kind: "date" },
  },

  tenantConfig: ["legacy", "region"] as const,

  surfaces: [
    "sidebar.billing",
    "tab.reports",
    "button.export",
  ] as const,
});

export type SurfaceId = SurfaceIdOf<typeof al>;
// "sidebar.billing" | "tab.reports" | "button.export"
```

## Compile-time guardrails

```ts
al.permission("billing.raed", true);
// ❌ TS error: typo not in registry

al.flag.checkout_version.is("v4", "v2");
// ❌ TS error: "v4" not in choices

al.flag.billing_v2.is("v2", "v2");
// ❌ TS error: boolean flag has no .is()

al.flag.checkout_version.on(true);
// ❌ TS error: variant flag has no .on()
```

## See also

- [`createReactBindings`](/api/create-react-bindings) — bind the lens to React
- [Feature flags guide](/guide/feature-flags) — all 5 kinds in detail
- [Plans & entitlements guide](/guide/plans-entitlements)
