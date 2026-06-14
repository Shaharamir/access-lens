# Plans and entitlements

Two related but distinct concepts. Plans are tiers (`free`, `growth`, `enterprise`) that a tenant is on; entitlements are per-feature flags that the tenant has paid for or been granted.

## Plans

Declared as an ordered array — lowest to highest tier:

```ts
const al = defineAccessLens({
  plans: ["free", "basic", "growth", "enterprise"] as const,
  // …
});
```

### `plan.is(want, actual)`

Exact-match comparison.

```ts
al.plan.is("enterprise", tenant.plan);
```

### `plan.atLeast(min, actual)`

Honors the declared order — `actual >= min`.

```ts
al.plan.atLeast("growth", tenant.plan);
// passes for growth and enterprise; fails for free and basic
```

## Entitlements

Boolean per-feature add-ons the tenant has or doesn't.

```ts
const al = defineAccessLens({
  entitlements: ["billing", "payouts", "analytics"] as const,
  // …
});

al.entitlement("billing", tenant.entitlements.billing);
```

## Combining both

```ts
const reasons = [
  al.plan.atLeast("growth", tenant.plan),
  al.entitlement("analytics", tenant.entitlements.analytics),
];
```

## With Stripe entitlements

```ts
const stripeEntitlements = await stripe.entitlements.activeEntitlements.list({ customer });
const hasAnalytics = stripeEntitlements.data.some(e => e.lookup_key === "analytics");
al.entitlement("analytics", hasAnalytics);
```

## See also

- [Permissions](/guide/permissions)
- [Recipe: plan-tier gating](/recipes/plans)
