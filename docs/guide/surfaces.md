# Surfaces

A surface is a single gated UI element — a sidebar item, a tab, a button, a route, a select option, anything. Declare your surface ids in the lens config and `AccessGate#id` becomes a typed literal union.

## Optional, not required

If you don't declare `surfaces`, `AccessGate#id` accepts any string. Opt in only when you want compile-time guarantees.

## Declaration

```ts
const al = defineAccessLens({
  // …
  surfaces: [
    "sidebar.billing",
    "sidebar.payouts",
    "tab.reports",
    "tab.advanced_reports",
    "button.export",
    "route.home.overview.beta",
  ] as const,
});
```

## Usage

`AccessGate#id` and `useAccessGate#id` autocomplete from your declared surfaces:

```tsx
<AccessGate
  id="sidebar.billing"     // ← autocompletes
  type="sidebar_item"
  label="Billing"
  reasons={[ /* … */ ]}
>
  <a href="/billing">Billing</a>
</AccessGate>
```

```tsx
<AccessGate id="sidebar.bling" /* … */>...</AccessGate>
// ✗ TS error: typo not in surfaces
```

## Extracting the type

```ts
import type { SurfaceIdOf } from "@access-lens/core";
import { al } from "./access-lens.js";

export type SurfaceId = SurfaceIdOf<typeof al>;
// "sidebar.billing" | "sidebar.payouts" | …
```

Useful when you store surface ids in a router config, analytics events, or a custom inspector.

## Naming convention

Pick one and stick to it. Common patterns:

- `kind.module` — `sidebar.billing`, `tab.reports`, `button.export`
- `module.kind.detail` — `billing.button.export`, `risk.section.advanced`
- Flat dotted — `home.overview.beta`

The convention doesn't matter to Access Lens; it matters for your team's grep-ability.

## See also

- [AccessGate](/guide/access-gate)
- [createReactBindings](/api/create-react-bindings)
