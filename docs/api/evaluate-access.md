# evaluateAccess

The pure function that turns an `EvaluateInput` into an `AccessNode`. Used internally by `AccessGate` and `useAccessGate`. You rarely call it yourself.

## Signature

```ts
function evaluateAccess(input: EvaluateInput): AccessNode;
```

## Input

```ts
interface EvaluateInput {
  id: string;
  label: string;
  type: AccessNodeType;
  reasons?: AccessReason[];
  metadata?: Record<string, unknown>;
  defaultStatus?: AccessStatus;
}
```

## Behavior

- `status = "allowed"` when every `reason.passed === true`.
- `status = "denied"` when any `reason.passed === false`.
- When `reasons` is empty or missing: `status = defaultStatus ?? "allowed"`.

The function is pure — no side effects, no client registration. Use it for testing, server-side evaluation, or composing your own gate components.

## Example

```ts
import { evaluateAccess, permission, featureFlag } from "@access-lens/core";

const node = evaluateAccess({
  id: "sidebar.billing",
  label: "Billing",
  type: "sidebar_item",
  reasons: [
    permission("billing.read", true),
    featureFlag("billing_v2", false),
  ],
});

console.log(node.status); // "denied"
```

## See also

- [AccessLensClient](/api/client)
- [Types](/api/types)
