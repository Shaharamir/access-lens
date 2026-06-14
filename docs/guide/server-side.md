# Server-side gates

Access Lens runs anywhere a JavaScript runtime runs. The core has no DOM dependency, so you can register nodes from Node middleware, edge functions, or serverless handlers — then hydrate them into the React client on the next render.

## Why bother

Route guards often live server-side (Next.js middleware, Express routes, Hono handlers). When a tenant hits `/billing` and gets a `403`, that decision is invisible to the React client. Hydrating it back into the lens makes the support overlay show **every** denial — client and server alike.

## Registering server-side

```ts
import { createAccessLensClient, evaluateAccess } from "@access-lens/core";
import { al } from "./access-lens.js";

export async function billingRouteGuard(req, res) {
  const client = createAccessLensClient({ notifyAsync: false });

  client.registerNode(evaluateAccess({
    id: "route.billing",
    label: "Billing route",
    type: "route",
    reasons: [
      al.permission("billing.read", req.user.permissions.has("billing.read")),
      al.entitlement("billing", req.tenant.entitlements.billing),
    ],
  }));

  const snapshot = client.getSnapshot();
  const billingNode = snapshot.nodes.find(n => n.id === "route.billing")!;

  if (billingNode.status === "denied") {
    return res.status(403).json({
      reason: billingNode.reasons.filter(r => !r.passed),
    });
  }

  // Pass the snapshot to the client for hydration
  res.locals.accessLensSnapshot = snapshot;
}
```

## Hydrating into the React client

Send the snapshot down with the page payload, then register every node into the client at mount.

```tsx
import { useEffect } from "react";
import { useAccessLens } from "./access-lens.js";

export function HydrateAccessLens({ snapshot }: { snapshot: AccessSnapshot }) {
  const { client } = useAccessLens();

  useEffect(() => {
    for (const node of snapshot.nodes) {
      client.registerNode(node);
    }
  }, [client, snapshot]);

  return null;
}
```

Then in your Next.js page:

```tsx
export default function BillingPage({ snapshot }) {
  return (
    <AccessLensProvider>
      <HydrateAccessLens snapshot={snapshot} />
      <YourBillingUI />
    </AccessLensProvider>
  );
}
```

Now the debug overlay shows both client gates and server gates.

## See also

- [Recipe: Next.js middleware](/recipes/nextjs-middleware)
- [AccessLensClient](/api/client)
