# Recipe: `/me/access` endpoint

The single most-used pattern. One backend endpoint returns the full access set; the React app fetches once after login and feeds reason builders from the result.

## 1. Backend — the endpoint

Any framework works. Here in plain Express + Drizzle, but the shape is the same for Fastify, Hono, NestJS, Rails, Django, Phoenix, etc.

```ts
// backend/routes/me.ts
import { Router } from "express";
import { requireAuth } from "../middleware/auth.js";
import { db } from "../db.js";

export const meRouter = Router();

meRouter.get("/me/access", requireAuth, async (req, res) => {
  const userId = req.session.userId;

  const [user, tenant, rolePermissions, flags] = await Promise.all([
    db.query.users.findFirst({ where: eq(users.id, userId) }),
    db.query.tenants.findFirst({ where: eq(tenants.id, req.session.tenantId) }),
    db.query.userRoles.findMany({
      where: eq(userRoles.userId, userId),
      with: { role: { with: { permissions: true } } },
    }),
    flagSdk.getAllFlagsFor({ tenantId: req.session.tenantId }),
  ]);

  res.json({
    permissions: rolePermissions.flatMap(r => r.role.permissions.map(p => p.key)),
    plan: tenant.plan,
    entitlements: tenant.entitlements,
    flags: serializeFlags(flags),
    tenantConfig: {
      legacy: tenant.legacy,
      region: tenant.region,
    },
    tenant: {
      bucketPercent: tenant.bucketPercent,
    },
  });
});

function serializeFlags(flags) {
  // Normalize whatever your flag SDK gives you into the Access Lens runtime shape
  return Object.fromEntries(
    Object.entries(flags).map(([key, raw]) => [key, normalize(key, raw)]),
  );
}

function normalize(key, raw) {
  switch (raw.kind) {
    case "boolean":    return { kind: "boolean", on: raw.value };
    case "killswitch": return { kind: "killswitch", engaged: raw.engaged };
    case "variant":    return { kind: "variant", value: raw.value };
    case "percent":    return { kind: "percent", rollout: raw.threshold };
    case "date":       return { kind: "date", activeFrom: raw.activeFrom };
  }
}
```

The exact column names and SDK calls are yours — what matters is the **response shape**:

```json
{
  "permissions": ["billing.read", "reports.read"],
  "plan": "growth",
  "entitlements": { "billing": true, "payouts": false },
  "flags": {
    "billing_v2": { "kind": "boolean", "on": true },
    "checkout_version": { "kind": "variant", "value": "v2" }
  },
  "tenantConfig": { "legacy": false },
  "tenant": { "bucketPercent": 17 }
}
```

## 2. Frontend — the hook

```ts
// hooks/useAccess.ts
import { createAccessSet, type AccessSet } from "@access-lens/core";
import { useQuery } from "@tanstack/react-query";

export function useAccess() {
  return useQuery({
    queryKey: ["me", "access"],
    queryFn: async (): Promise<AccessSet> => {
      const response = await fetch("/api/me/access", { credentials: "include" });
      if (!response.ok) throw new Error(`access fetch failed: ${response.status}`);
      const json = await response.json();
      return createAccessSet(json);
      //     ^^^^^^^^^^^^^^^^^
      //     Throws AccessSetValidationError if the backend ships a malformed
      //     payload — surfaces backend bugs at the boundary, not deep in a
      //     component tree.
    },
    staleTime: 5 * 60_000,
    refetchOnWindowFocus: true,
  });
}
```

For Pinia / Zustand / RTK Query / SWR, the same idea — fetch, parse with `createAccessSet`, cache.

## 3. Frontend — at the gate

```tsx
import { al, AccessGate } from "./access-lens.js";
import { useAccess } from "./hooks/useAccess.js";

function Sidebar() {
  const { data: access, isLoading } = useAccess();

  if (isLoading || !access) {
    return <SidebarSkeleton />;
  }

  return (
    <nav>
      <AccessGate
        id="sidebar.billing"
        type="sidebar_item"
        label="Billing"
        reasons={[
          al.permission("billing.read", access.hasPermission("billing.read")),
          al.entitlement("billing", access.hasEntitlement("billing")),
          al.plan.atLeast("growth", access.plan),
          al.flag.billing_v2.on(access.booleanFlag("billing_v2")),
        ]}
      >
        <a href="/billing">Billing</a>
      </AccessGate>

      <AccessGate
        id="tab.advanced_reports"
        type="tab"
        label="Advanced Reports"
        reasons={[
          al.permission("reports.read", access.hasPermission("reports.read")),
          al.plan.atLeast("enterprise", access.plan),
          al.flag.q3_features.activeFrom(
            access.dateFlag("q3_features"),
            new Date().toISOString().slice(0, 10),
          ),
        ]}
      >
        <a href="/reports/advanced">Advanced Reports</a>
      </AccessGate>
    </nav>
  );
}
```

## 4. Optional — invalidate the cache on access changes

If you have a websocket / Server-Sent Events / Pusher / Ably channel for live updates, push a "access invalidated" event from the backend whenever the user's plan / role / entitlements change, and refetch:

```ts
useEffect(() => {
  return socket.on("access:invalidated", () => {
    queryClient.invalidateQueries({ queryKey: ["me", "access"] });
  });
}, [queryClient]);
```

Now if an admin upgrades the tenant's plan in another tab, every connected client refreshes the lens within ~100ms.

## What about loading state?

Two options:

**A. Block render until access loads** (what the example above does). Simple, never shows misleading UI.

**B. Render with `emptyAccessSet()` while loading**:

```ts
import { emptyAccessSet } from "@access-lens/core";

const access = useAccess().data ?? emptyAccessSet();
```

Every gate evaluates to denied during loading, so the UI looks like the user has access to nothing. Cleaner for layouts that need to render before access arrives (e.g. you don't want the sidebar to disappear and reappear).

## See also

- [Backend integration overview](/guide/backend-integration)
- [`createAccessSet` API](/api/types#createaccessset)
- [Recipe: NestJS](/recipes/nestjs)
- [Recipe: Express + CASL](/recipes/express-casl)
