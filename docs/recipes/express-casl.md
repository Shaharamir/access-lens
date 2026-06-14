# Recipe: Express + CASL

For Node/Express backends that already use [CASL](https://casl.js.org/) for authorization. CASL decides what each user can do; Access Lens records the decision with the reason attached.

## 1. CASL ability factory

```ts
// backend/auth/ability.ts
import { defineAbility, AbilityBuilder, MongoAbility } from "@casl/ability";

type Actions = "read" | "write" | "delete" | "export";
type Subjects = "Billing" | "Reports" | "Payouts" | "Risk";

export function abilityFor(user, tenant): MongoAbility<[Actions, Subjects]> {
  const { can, build } = new AbilityBuilder<MongoAbility<[Actions, Subjects]>>(MongoAbility);

  // Admins can do everything
  if (user.roles.includes("admin")) {
    can("read", "Billing");
    can("write", "Billing");
    can("read", "Reports");
    can("export", "Reports");
    can("read", "Payouts");
    can("write", "Risk");
  }

  // Managers — reads + non-destructive writes
  if (user.roles.includes("manager")) {
    can("read", "Billing");
    can("read", "Reports");
    can("export", "Reports");
  }

  // Viewers — read-only
  if (user.roles.includes("viewer")) {
    can("read", "Reports");
  }

  // Enterprise tenants get Risk write capability
  if (tenant.plan !== "enterprise") {
    // (already not granted above for non-admins, but explicit is good)
  }

  return build();
}
```

## 2. `/me/access` endpoint that pipes CASL output

CASL's `can()` returns a boolean; that's exactly what Access Lens needs.

```ts
// backend/routes/me.ts
import { Router } from "express";
import { requireAuth } from "../middleware/auth.js";
import { abilityFor } from "../auth/ability.js";
import { resolveFlags } from "../flags/index.js";

export const meRouter = Router();

meRouter.get("/me/access", requireAuth, async (req, res) => {
  const user = req.user;
  const tenant = req.tenant;
  const ability = abilityFor(user, tenant);

  // Translate CASL "can(action, subject)" into flat permission strings
  const permissions = [];
  if (ability.can("read", "Billing"))   permissions.push("billing.read");
  if (ability.can("write", "Billing"))  permissions.push("billing.write");
  if (ability.can("read", "Reports"))   permissions.push("reports.read");
  if (ability.can("export", "Reports")) permissions.push("reports.export");
  if (ability.can("read", "Payouts"))   permissions.push("payouts.read");
  if (ability.can("write", "Risk"))     permissions.push("risk.write");

  res.json({
    permissions,
    plan: tenant.plan,
    entitlements: tenant.entitlements,
    flags: await resolveFlags(tenant),
    tenantConfig: { legacy: tenant.legacy, region: tenant.region },
    tenant: { bucketPercent: tenant.bucketPercent },
  });
});
```

::: tip
You can also expose the CASL ability directly (it serializes via `ability.rules`), but flat permission strings are simpler for the frontend lens and you don't need to ship the CASL SDK to the client.
:::

## 3. Same `userCan` check at the route level

The boolean shown to the UI must match what the route enforces:

```ts
// backend/routes/billing.ts
import { Router } from "express";
import { abilityFor } from "../auth/ability.js";

export const billingRouter = Router();

billingRouter.get("/billing", requireAuth, (req, res) => {
  const ability = abilityFor(req.user, req.tenant);
  if (ability.cannot("read", "Billing")) {
    return res.status(403).json({ error: "billing.read required" });
  }

  // ... return billing data
});
```

Both the `/me/access` endpoint and the `/billing` endpoint call `abilityFor()`. **Single source of truth.** The frontend Access Lens hides the link; the backend Express route enforces the same rule. They can't diverge.

## 4. Frontend — same as Pattern 1

```tsx
import { al, AccessGate } from "./access-lens.js";
import { useAccess } from "./hooks/useAccess.js";

function BillingItem() {
  const { data: access } = useAccess();
  if (!access) return null;

  return (
    <AccessGate
      id="sidebar.billing"
      type="sidebar_item"
      label="Billing"
      reasons={[
        al.permission("billing.read", access.hasPermission("billing.read")),
        al.entitlement("billing", access.hasEntitlement("billing")),
      ]}
    >
      <a href="/billing">Billing</a>
    </AccessGate>
  );
}
```

## Optional — surface the *full* CASL reasoning client-side

If you want the debug overlay to show CASL's `reason` (e.g. "user lacks the admin role"), pipe it through `al.custom()`:

```ts
const billingRead = ability.can("read", "Billing");
const billingReadReason = billingRead
  ? undefined
  : `Roles ${user.roles.join(", ")} lack permission "Billing:read"`;

al.custom("casl:Billing.read", billingRead, {
  source: "casl.ability",
  message: billingReadReason,
})
```

Now the hover-card matrix on `<AccessGate>` shows exactly which CASL rule failed, not just "permission denied."

## See also

- [Backend integration overview](/guide/backend-integration)
- [Recipe: `/me/access` endpoint](/recipes/me-access-endpoint)
- [Recipe: NestJS](/recipes/nestjs)
- [RBAC / ABAC / PBAC / ReBAC](/guide/access-control-models)
