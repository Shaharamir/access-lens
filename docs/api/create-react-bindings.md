# createReactBindings

Binds the React adapter to a specific lens so that `AccessGate#id` and `useAccessGate#input.id` autocomplete from your declared `surfaces`. The runtime behavior is identical to the un-bound exports; only the TypeScript types narrow.

## Signature

```ts
function createReactBindings<TLens>(lens: TLens): {
  AccessLensProvider: typeof AccessLensProvider;
  AccessGate: TypedAccessGate;
  useAccessGate: TypedUseAccessGate;
  useAccessLensSnapshot: typeof useAccessLensSnapshot;
  useAccessLens: typeof useAccessLens;
};
```

`TypedAccessGate` and `TypedUseAccessGate` differ from the raw exports only in their `id` parameter — narrowed to `SurfaceIdOf<TLens>`.

## Example

```ts
import { defineAccessLens } from "@access-lens/core";
import { createReactBindings } from "@access-lens/react";

export const al = defineAccessLens({
  permissions: ["billing.read"] as const,
  entitlements: ["billing"] as const,
  plans: ["free", "enterprise"] as const,
  flags: { billing_v2: { kind: "boolean" } },
  surfaces: ["sidebar.billing", "tab.reports"] as const,
});

export const {
  AccessLensProvider,
  AccessGate,
  useAccessGate,
  useAccessLensSnapshot,
  useAccessLens,
} = createReactBindings(al);
```

Now in any component:

```tsx
<AccessGate
  id="sidebar.billing"       // ← autocompletes
  type="sidebar_item"
  label="Billing"
  reasons={[
    al.permission("billing.read", true),
    al.flag.billing_v2.on(true),
  ]}
>
  <a href="/billing">Billing</a>
</AccessGate>
```

```tsx
<AccessGate id="sidebar.bling" /* … */ />
// ✗ TS error: typo not in declared surfaces
```

## When `surfaces` is not declared

If you omit `surfaces` from your lens config, `AccessGate#id` falls back to `string`. The bindings still work; you just don't get autocomplete on the id.

## See also

- [Surfaces](/guide/surfaces)
- [AccessGate](/api/access-gate)
- [defineAccessLens](/api/define-access-lens)
