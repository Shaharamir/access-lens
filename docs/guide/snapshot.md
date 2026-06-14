# Snapshot inspection

The snapshot is your programmatic view into every gated surface in your app. Use it to build inspectors, analytics dashboards, or support-tool deep-links.

## Reading the snapshot

```tsx
import { useAccessLensSnapshot } from "./access-lens.js";

function Inspector() {
  const snapshot = useAccessLensSnapshot();

  return (
    <ul>
      {snapshot.nodes.map(node => (
        <li key={node.id}>
          {node.label} — {node.status}
        </li>
      ))}
    </ul>
  );
}
```

## Shape

```ts
interface AccessSnapshot {
  nodes: AccessNode[];
  counts: {
    allowed: number;
    denied: number;
    unknown: number;
    total: number;
  };
  generatedAt: number;
}
```

Each `AccessNode`:

```ts
interface AccessNode {
  id: string;
  label: string;
  type: AccessNodeType;
  status: "allowed" | "denied" | "unknown";
  reasons: AccessReason[];
  metadata?: Record<string, unknown>;
}
```

## Referential stability

```ts
const a = client.getSnapshot();
const b = client.getSnapshot();
// a === b until the registry actually mutates
```

This matters for `useSyncExternalStore` correctness — React would loop if the snapshot identity changed on every read.

## Outside React

```ts
import { createAccessLensClient } from "@access-lens/core";

const client = createAccessLensClient();
// register nodes…

const snapshot = client.getSnapshot();
const denials = snapshot.nodes.filter(n => n.status === "denied");

console.log(`${denials.length} surfaces denied for current context`);
```

## Subscribing imperatively

```ts
const unsubscribe = client.subscribe(snapshot => {
  console.log("snapshot changed", snapshot.counts);
});

// later:
unsubscribe();
```

The subscriber is called on a microtask after the registry mutates, batching multiple register/unregister calls into one notification.

## Sending to analytics

```ts
function trackDeniedSurfaces(snapshot) {
  for (const node of snapshot.nodes) {
    if (node.status !== "denied") continue;
    analytics.track("access.denied", {
      surface: node.id,
      reasons: node.reasons.filter(r => !r.passed).map(r => `${r.type}:${r.key}`),
    });
  }
}
```

You now have a closed-loop view of which surfaces fail for which tenants in production.

## See also

- [AccessLensClient API](/api/client)
- [Recipe: building a custom inspector](/recipes/)
