# Recipe: LaunchDarkly integration

LaunchDarkly evaluates flags; Access Lens composes those evaluations with permissions / plans / entitlements into one observable decision.

## Setup

```ts
// access-lens.ts
import { defineAccessLens } from "@access-lens/core";

export const al = defineAccessLens({
  permissions: ["billing.read"] as const,
  entitlements: ["billing"] as const,
  plans: ["free", "enterprise"] as const,
  flags: {
    billing_v2:       { kind: "boolean" },
    checkout_version: { kind: "variant", choices: ["v1", "v2"] as const },
  },
  // …
});
```

## React provider hierarchy

```tsx
import { LDProvider } from "launchdarkly-react-client-sdk";
import { AccessLensProvider } from "./access-lens.js";

<LDProvider clientSideID={process.env.NEXT_PUBLIC_LD_CLIENT_ID!}>
  <AccessLensProvider defaultDebugMode={import.meta.env.DEV}>
    <App />
  </AccessLensProvider>
</LDProvider>
```

## At gates

```tsx
import { useFlags } from "launchdarkly-react-client-sdk";

function BillingTab({ user, tenant }) {
  const ld = useFlags();

  return (
    <AccessGate
      id="tab.billing"
      type="tab"
      label="Billing"
      reasons={[
        al.permission("billing.read", user.perms.has("billing.read")),
        al.flag.billing_v2.on(ld["billing-v2"] ?? false),
        al.flag.checkout_version.is("v2", ld["checkout-version"] ?? "v1"),
        al.entitlement("billing", tenant.entitlements.billing),
      ]}
    >
      <TabTrigger>Billing</TabTrigger>
    </AccessGate>
  );
}
```

LaunchDarkly returns the flag value; Access Lens records the *combined* decision and surfaces it in the debug overlay.

## With GrowthBook

```tsx
import { useFeatureValue } from "@growthbook/growthbook-react";

al.flag.billing_v2.on(useFeatureValue("billing_v2", false));
al.flag.checkout_version.is("v2", useFeatureValue("checkout_version", "v1"));
```

## With OpenFeature

```tsx
import { useFlag } from "@openfeature/react-sdk";

const billingV2 = useFlag("billing_v2", false);
al.flag.billing_v2.on(billingV2.value);
```

The pattern is identical for any flag SDK — they return values, Access Lens records the decision.

## See also

- [Feature flags guide](/guide/feature-flags)
- [Recipe: feature flag rollout](/recipes/rollout)
