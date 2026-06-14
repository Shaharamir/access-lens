# Hooks

Three React hooks for reading from the lens client outside of `AccessGate`.

## useAccessLens

Returns the live context — `client`, `debugMode`, `setDebugMode`.

```tsx
import { useAccessLens } from "./access-lens.js";

function DebugToggle() {
  const { debugMode, setDebugMode } = useAccessLens();
  return (
    <button onClick={() => setDebugMode(!debugMode)}>
      Debug: {debugMode ? "on" : "off"}
    </button>
  );
}
```

## useAccessGate

Register a node imperatively. Returns `{ node, allowed, denied, unknown }`. Useful when you want to read the result but render something custom.

```tsx
import { useAccessGate } from "./access-lens.js";

function BillingCard({ user, tenant, flags }) {
  const { allowed, node } = useAccessGate({
    id: "card.billing-summary",
    type: "section",
    label: "Billing summary",
    reasons: [
      al.permission("billing.read", user.perms.has("billing.read")),
      al.flag.billing_v2.on(flags.billing_v2.on),
    ],
  });

  if (!allowed) return null;

  return <Card>…</Card>;
}
```

Identical to `<AccessGate>` under the hood — same registration, same dedup — minus the rendering wrapper.

## useAccessLensSnapshot

Subscribes to the live snapshot of every registered node. Returns the snapshot object; re-renders only when the snapshot identity changes.

```tsx
import { useAccessLensSnapshot } from "./access-lens.js";

function StatusBar() {
  const snapshot = useAccessLensSnapshot();
  return (
    <div>
      {snapshot.counts.allowed} allowed · {snapshot.counts.denied} denied
    </div>
  );
}
```

The snapshot is referentially stable across reads — see [Snapshot inspection](/guide/snapshot) for what you can do with it.

## See also

- [Provider](/guide/provider)
- [AccessGate](/guide/access-gate)
- [Snapshot inspection](/guide/snapshot)
