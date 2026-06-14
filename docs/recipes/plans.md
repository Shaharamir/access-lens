# Recipe: plan-tier gating

Features that are only available on certain plan tiers.

## Setup

```ts
const al = defineAccessLens({
  plans: ["free", "basic", "growth", "enterprise"] as const,
  // …
});
```

Order matters — lowest to highest tier.

## "Growth or higher"

```tsx
<AccessGate
  id="tab.analytics"
  type="tab"
  label="Analytics"
  reasons={[
    al.plan.atLeast("growth", tenant.plan),
  ]}
>
  <TabTrigger>Analytics</TabTrigger>
</AccessGate>
```

`atLeast("growth", "enterprise")` passes. `atLeast("growth", "basic")` fails.

## Exact match

```ts
al.plan.is("enterprise", tenant.plan);
// passes only when tenant is exactly on enterprise
```

## With Stripe subscriptions

```ts
const sub = await stripe.subscriptions.retrieve(customer.subscriptionId);
const plan = sub.items.data[0].price.lookup_key as PlanKey;

al.plan.atLeast("growth", plan);
```

## Plan + entitlement combo

A feature might require a plan tier AND a specific entitlement:

```ts
const reasons = [
  al.plan.atLeast("growth", tenant.plan),
  al.entitlement("analytics", tenant.entitlements.analytics),
];
```

## See also

- [Plans & entitlements guide](/guide/plans-entitlements)
