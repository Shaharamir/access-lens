# Backend integration

The single most common question about Access Lens: *"My permissions / plans / flags live on the backend. How does the frontend stay in sync?"*

Short answer: **Access Lens never talks to your backend on its own.** It records the booleans you give it. Whether the user "really" has the permission is determined by your backend; Access Lens just observes the result and attaches a reason.

This page lays out the four wiring patterns. Pick the one that matches your stack.

## The boundary

```
Frontend:  AccessGate hides the Billing button (UX)
           ↓ user opens devtools, calls fetch("/api/billing") anyway
Backend:   middleware rejects the request with 403  (security)
```

Access Lens is the UX layer. The backend is the security boundary. A malicious user with devtools can flip every boolean in the page and make every gate render "allowed" — the API still rejects them.

So the goal isn't "make Access Lens secure" (the backend already is). The goal is **make the frontend booleans match what the backend will actually allow**, so users don't see a button that 403s when they click it.

## Pattern 1 — `/me/access` endpoint *(most common)*

One API call after login returns everything Access Lens needs. The frontend stores it (React Query, SWR, RTK Query, Zustand — your call) and feeds reason builders from it.

### The backend response shape

```ts
// GET /api/me/access
{
  "permissions": ["billing.read", "reports.read"],
  "plan": "growth",
  "entitlements": { "billing": true, "payouts": false, "analytics": true },
  "flags": {
    "billing_v2": { "kind": "boolean", "on": true },
    "risk_killswitch": { "kind": "killswitch", "engaged": false },
    "checkout_version": { "kind": "variant", "value": "v2" },
    "new_invoicing": { "kind": "percent", "rollout": 25 },
    "q3_features": { "kind": "date", "activeFrom": "2026-07-01" }
  },
  "tenantConfig": { "legacy": false, "region": "eu" },
  "tenant": { "bucketPercent": 17 }
}
```

### Frontend: `createAccessSet` parses and validates

```ts
import { createAccessSet } from "@access-lens/core";
import { useQuery } from "@tanstack/react-query";

function useAccess() {
  return useQuery({
    queryKey: ["access"],
    queryFn: async () => {
      const response = await fetch("/api/me/access");
      if (!response.ok) throw new Error("auth required");
      return createAccessSet(await response.json());
      //     ^^^^^^^^^^^^^^^^^ runtime-validates the JSON shape; throws
      //                       AccessSetValidationError if the backend sends
      //                       malformed data
    },
    staleTime: 5 * 60_000,
  });
}
```

### At the gate

```tsx
import { al, AccessGate } from "./access-lens.js";

function BillingSidebarItem() {
  const { data: access } = useAccess();
  if (!access) return <Skeleton />;

  return (
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
  );
}
```

`access` exposes typed convenience accessors:

| Method | Returns | When the key is missing |
|---|---|---|
| `access.hasPermission(key)` | `boolean` | `false` |
| `access.hasEntitlement(key)` | `boolean` | `false` |
| `access.booleanFlag(key)` | `boolean` | `false` |
| `access.killswitchEngaged(key)` | `boolean` | `true` (fail-safe — assume killswitch is on) |
| `access.variantFlag(key)` | `string` | `""` |
| `access.percentFlag(key)` | `number` | `0` |
| `access.dateFlag(key)` | `string` (ISO) | `"9999-12-31"` (never activates) |

The fail-safe defaults mean: if your backend forgets to ship a flag, gates depending on that flag stay **closed**, not silently open.

See the [/me/access endpoint recipe](/recipes/me-access-endpoint) for a complete Express + React example.

## Pattern 2 — Shared types via a monorepo / npm package

Best paired with Pattern 1. The backend's permission registry becomes a TypeScript constant, both sides import it, and any drift becomes a **compile error**.

```ts
// packages/auth-types/src/permissions.ts — shared between BE and FE
export const PERMISSIONS = [
  "billing.read",
  "billing.write",
  "billing.export",
  "payouts.read",
  "reports.read",
  "reports.export",
] as const;

export type Permission = (typeof PERMISSIONS)[number];

export const PLANS = ["free", "basic", "growth", "enterprise"] as const;
export type Plan = (typeof PLANS)[number];

export const ENTITLEMENTS = ["billing", "payouts", "analytics"] as const;
export type Entitlement = (typeof ENTITLEMENTS)[number];
```

Then the backend's authorization code is typed against it:

```ts
// backend/auth.ts
import { Permission } from "@yourcompany/auth-types";

function userCan(user: User, permission: Permission): boolean {
  return user.roles.some(role => role.permissions.includes(permission));
}
```

And the frontend's lens config imports the same constants:

```ts
// frontend/access-lens.ts
import { defineAccessLens } from "@access-lens/core";
import { PERMISSIONS, PLANS, ENTITLEMENTS } from "@yourcompany/auth-types";

export const al = defineAccessLens({
  permissions: PERMISSIONS,    // ← same array, same literal types
  plans: PLANS,
  entitlements: ENTITLEMENTS,
  flags: { /* ... */ },
});
```

Now adding `"billing.delete"` to the backend automatically extends the frontend's `Permission` union. If a gate references a removed permission, TypeScript fails the build.

::: tip Monorepo not required
Same pattern works with a publishing-only types package: backend depends on `@yourcompany/auth-types`, frontend depends on `@yourcompany/auth-types`. Bump version → both update.
:::

## Pattern 3 — Server-rendered + hydration

Best for Next.js, Remix, TanStack Start, or any framework that runs JS server-side. The gate evaluation happens during the server request and the snapshot ships to the client in the page payload.

```ts
// middleware.ts
import { NextResponse } from "next/server";
import { createAccessLensClient, evaluateAccess, createAccessSet } from "@access-lens/core";
import { al } from "./access-lens.js";

export async function middleware(request) {
  const user = await loadUserFromSession(request);
  const access = createAccessSet(await loadAccessFromDb(user.id));

  const client = createAccessLensClient({ notifyAsync: false });

  // Pre-evaluate critical routes server-side
  client.registerNode(evaluateAccess({
    id: "route.billing",
    label: "Billing route",
    type: "route",
    reasons: [
      al.permission("billing.read", access.hasPermission("billing.read")),
      al.entitlement("billing", access.hasEntitlement("billing")),
    ],
  }));

  const snapshot = client.getSnapshot();

  // If the route itself is denied, redirect before rendering
  const billingNode = snapshot.nodes.find(n => n.id === "route.billing");
  if (request.nextUrl.pathname.startsWith("/billing") && billingNode?.status === "denied") {
    return NextResponse.redirect(new URL("/403", request.url));
  }

  // Otherwise pass the snapshot down so the React client can hydrate it
  const response = NextResponse.next();
  response.headers.set("x-access-lens-snapshot", JSON.stringify(snapshot));
  return response;
}
```

On the client:

```tsx
"use client";
import { useEffect } from "react";
import { useAccessLens } from "./access-lens.js";

export function HydrateAccessLens({ snapshot }) {
  const { client } = useAccessLens();
  useEffect(() => {
    for (const node of snapshot.nodes) {
      client.registerNode(node);
    }
  }, [client, snapshot]);
  return null;
}
```

The debug overlay then shows both server-side and client-side denials in the same view — a customer support agent can hover a hidden Billing tab and see "permission billing.read failed at server, before page render."

Full recipe: [/recipes/nextjs-middleware](/recipes/nextjs-middleware).

## Pattern 4 — Code-gen the lens config from your auth schema

If you have a structured permission registry — a YAML file, a DB table, an OpenAPI spec, GraphQL schema, OPA Rego policies — write a small build-step script that reads it and emits the lens config. Add it to CI so any drift fails the build.

```ts
// scripts/generate-access-lens.ts
import fs from "node:fs";
import { parse } from "yaml";

const schema = parse(fs.readFileSync("auth/permissions.yaml", "utf8"));

const output = `
// AUTO-GENERATED from auth/permissions.yaml at ${new Date().toISOString()}
// Do not edit by hand.

import { defineAccessLens } from "@access-lens/core";

export const al = defineAccessLens({
  permissions: ${JSON.stringify(schema.permissions)} as const,
  plans:       ${JSON.stringify(schema.plans)} as const,
  entitlements: ${JSON.stringify(schema.entitlements)} as const,
  flags: {
${Object.entries(schema.flags).map(([key, spec]) =>
  `    ${key}: ${JSON.stringify(spec)},`
).join("\n")}
  },
});
`;

fs.writeFileSync("src/access-lens.generated.ts", output);
```

```bash
# CI fails if regen produces a diff
pnpm dlx ts-node scripts/generate-access-lens.ts
git diff --exit-code src/access-lens.generated.ts
```

This is what `@access-lens/cli init` will do natively when shipped — for now, the script above is ~30 lines and covers most stacks.

## Choosing a pattern

| You're using | Pick |
|---|---|
| Single backend, single frontend, no monorepo | Pattern 1 alone |
| Monorepo (Turborepo, Nx, pnpm workspaces) | Pattern 1 + Pattern 2 |
| Next.js, Remix, TanStack Start | Pattern 3 (often combined with Pattern 1 for client-only mutations) |
| OPA / Cedar / a permissions YAML / GraphQL schema | Pattern 4 (auto-gen) + Pattern 1 (runtime hydration) |
| Casbin / CASL / accesscontrol with rules in code | Pattern 1; let those libraries decide the booleans, pipe results into `al.permission()` / `al.custom()` |

Most real apps end up at **Pattern 1 + Pattern 2**.

## What about security?

Anything Access Lens does on the client can be tampered with. Don't put security guarantees on it.

- ✅ Use it to hide UI the user can't operate (good UX).
- ✅ Use it to surface *why* something is hidden (good observability).
- ❌ Don't use it as the only thing standing between a user and your billing data.

Standard practice: the same booleans you feed the lens also gate the **API**. Your route handlers check `userCan(user, "billing.read")` before reading the data. If a user forges `permissions: ["billing.read"]` on the client, the API still rejects.

For the highest-stakes operations (delete, refund, payouts), pair the API check with an audit log: "user X attempted operation Y from tenant Z." Access Lens snapshots make great input to that audit pipeline because they record every decision the UI made with the reason attached.

## See also

- [`createAccessSet` API reference](/api/types#createaccessset)
- [Recipe: `/me/access` endpoint](/recipes/me-access-endpoint)
- [Recipe: NestJS](/recipes/nestjs)
- [Recipe: Express + CASL](/recipes/express-casl)
- [Recipe: Next.js middleware](/recipes/nextjs-middleware)
- [RBAC / ABAC / PBAC / ReBAC](/guide/access-control-models) — how Access Lens composes with whichever authorization model you've chosen
