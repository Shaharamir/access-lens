# Feature flags

Access Lens models five flag kinds. Each kind has its own typed method; using the wrong method for a kind is a compile error.

| Kind | Method | When to use |
|---|---|---|
| `boolean` | `.on(value)` | Classic on/off flag. |
| `killswitch` | `.notEngaged(engaged)` | Emergency disable; engaged means OFF. |
| `variant` | `.is(want, actual)` | A/B/C versioning. |
| `percent` | `.inRollout(threshold, bucket)` | Gradual rollout to N% of tenants. |
| `date` | `.activeFrom(activeFrom, today)` | Feature activates after a date. |

## Declaration

```ts
const al = defineAccessLens({
  flags: {
    billing_v2:        { kind: "boolean" },
    risk_killswitch:   { kind: "killswitch" },
    checkout_version:  { kind: "variant", choices: ["v1", "v2", "v3"] as const },
    new_invoicing:     { kind: "percent" },
    q3_features:       { kind: "date" },
  },
  // …
});
```

## Boolean

```ts
al.flag.billing_v2.on(currentFlagValue);
// passes when currentFlagValue is true
```

## Killswitch

```ts
al.flag.risk_killswitch.notEngaged(killswitchValue);
// passes when killswitchValue is false (i.e. NOT engaged)
```

## Variant

`want` and `actual` autocomplete from the declared `choices`.

```ts
al.flag.checkout_version.is("v2", currentVariant);
// passes when currentVariant === "v2"
```

## Percent rollout

Each tenant has a deterministic `bucket` (0–99). Passes when `bucket < threshold`.

```ts
al.flag.new_invoicing.inRollout(25, tenant.bucketPercent);
// passes for the 25% of tenants whose bucket is < 25
```

Compute the bucket once per tenant — for example, a hash of `tenant.id` mod 100 — and store it on the tenant record. The flag SDK then just compares.

## Date-windowed

ISO date strings sort correctly, so string comparison works.

```ts
al.flag.q3_features.activeFrom("2026-07-01", todayIso);
// passes when todayIso >= "2026-07-01"
```

## Wrong method = compile error

```ts
al.flag.billing_v2.is("v2", "v2");
// ✗ TS error: boolean flag has no .is()

al.flag.checkout_version.on(true);
// ✗ TS error: variant flag has no .on()
```

## See also

- [Recipe: feature flag rollout](/recipes/rollout)
- [Recipe: variant routing](/recipes/variant-routing)
- [Recipe: LaunchDarkly integration](/recipes/launchdarkly)
