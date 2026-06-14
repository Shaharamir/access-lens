# AccessLensClient

The in-memory registry that holds every `AccessNode`. The React adapter wires one of these up for you; you rarely instantiate it yourself except for server-side use or custom adapters.

## Construct

```ts
import { AccessLensClient, createAccessLensClient } from "@access-lens/core";

const client = createAccessLensClient({ notifyAsync: true });
// or
const client = new AccessLensClient({ notifyAsync: false });
```

## Options

| Option | Default | Description |
|---|---|---|
| `notifyAsync` | `true` | Batches listener notifications via microtask. Set `false` for sync (mostly useful in tests). |

## Methods

### `registerNode(node: AccessNode): void`

Stores the node. Dedup: if a node with the same `id` already exists with identical reason content, the call is a no-op and listeners are not notified.

### `unregisterNode(id: string): void`

Removes the node. If the id wasn't registered, no-op.

### `getNode(id: string): AccessNode | undefined`

Direct lookup.

### `getSnapshot(): AccessSnapshot`

Returns the current snapshot. **Referentially stable** — calling twice without intervening mutations returns the *same* object reference. This makes it safe for `useSyncExternalStore`.

### `subscribe(listener): () => void`

Listener is called asynchronously (batched via microtask) when the registry mutates. Returns an unsubscribe function.

### `clear(): void`

Removes every node.

## Snapshot

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

## Example

```ts
import { createAccessLensClient, evaluateAccess, permission } from "@access-lens/core";

const client = createAccessLensClient({ notifyAsync: false });

const unsubscribe = client.subscribe(snapshot => {
  console.log(`now ${snapshot.counts.total} nodes`);
});

client.registerNode(evaluateAccess({
  id: "x",
  label: "X",
  type: "button",
  reasons: [permission("p", true)],
}));

unsubscribe();
```

## See also

- [evaluateAccess](/api/evaluate-access)
- [Snapshot inspection](/guide/snapshot)
