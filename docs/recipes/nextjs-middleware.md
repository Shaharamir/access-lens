# Recipe: Next.js middleware

Server-side route guards that register into the same client your React app reads from.

## Setup

```ts
// access-lens.ts
import { defineAccessLens } from "@access-lens/core";

export const al = defineAccessLens({
  permissions: ["billing.read"] as const,
  entitlements: ["billing"] as const,
  plans: ["free", "enterprise"] as const,
  flags: { billing_v2: { kind: "boolean" } },
  surfaces: ["route.billing"] as const,
});
```

## Middleware

```ts
// middleware.ts
import { NextResponse, type NextRequest } from "next/server";
import { createAccessLensClient, evaluateAccess } from "@access-lens/core";
import { al } from "./access-lens.js";

export async function middleware(req: NextRequest) {
  if (!req.nextUrl.pathname.startsWith("/billing")) {
    return NextResponse.next();
  }

  const user = await loadUserFromSession(req);
  const tenant = await loadTenantFromHostname(req);

  const client = createAccessLensClient({ notifyAsync: false });

  client.registerNode(evaluateAccess({
    id: "route.billing",
    label: "Billing route",
    type: "route",
    reasons: [
      al.permission("billing.read", user.permissions.includes("billing.read")),
      al.entitlement("billing", tenant.entitlements.billing),
    ],
  }));

  const snapshot = client.getSnapshot();
  const node = snapshot.nodes.find(n => n.id === "route.billing")!;

  if (node.status === "denied") {
    const url = req.nextUrl.clone();
    url.pathname = "/403";
    url.searchParams.set("denied", "route.billing");
    return NextResponse.redirect(url);
  }

  const res = NextResponse.next();
  res.headers.set("x-access-lens-snapshot", JSON.stringify(snapshot));
  return res;
}
```

## Hydrating into the client app

```tsx
// app/layout.tsx
import { headers } from "next/headers";
import type { AccessSnapshot } from "@access-lens/core";

export default async function RootLayout({ children }) {
  const h = await headers();
  const raw = h.get("x-access-lens-snapshot");
  const snapshot: AccessSnapshot | null = raw ? JSON.parse(raw) : null;

  return (
    <html>
      <body>
        <ClientShell snapshot={snapshot}>{children}</ClientShell>
      </body>
    </html>
  );
}
```

```tsx
// ClientShell.tsx — "use client"
"use client";
import { useEffect } from "react";
import { AccessLensProvider, useAccessLens } from "./access-lens.js";

function Hydrate({ snapshot }) {
  const { client } = useAccessLens();
  useEffect(() => {
    if (!snapshot) return;
    for (const node of snapshot.nodes) client.registerNode(node);
  }, [client, snapshot]);
  return null;
}

export function ClientShell({ snapshot, children }) {
  return (
    <AccessLensProvider>
      <Hydrate snapshot={snapshot} />
      {children}
    </AccessLensProvider>
  );
}
```

The debug overlay now shows both server-side and client-side denials in the same view.

## See also

- [Server-side gates guide](/guide/server-side)
- [AccessLensClient API](/api/client)
