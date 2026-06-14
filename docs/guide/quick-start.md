# Quick start

A complete working setup in under 5 minutes.

## 1. Install

::: code-group

```bash [pnpm]
pnpm add @access-lens/core @access-lens/react
```

```bash [npm]
npm install @access-lens/core @access-lens/react
```

```bash [yarn]
yarn add @access-lens/core @access-lens/react
```

```bash [bun]
bun add @access-lens/core @access-lens/react
```

:::

## 2. Declare the lens

The whole point of the typed API: every key in your app's access vocabulary gets declared once. Every call site afterwards autocompletes from this and rejects unknown keys at compile time.

```ts
// access-lens.ts
import { defineAccessLens } from "@access-lens/core";
import { createReactBindings } from "@access-lens/react";

export const al = defineAccessLens({
  permissions: [
    "billing.read",
    "billing.write",
    "reports.read",
    "reports.export",
  ] as const,
  entitlements: ["billing", "analytics"] as const,
  plans: ["free", "basic", "growth", "enterprise"] as const,
  flags: {
    billing_v2:       { kind: "boolean" },
    checkout_version: { kind: "variant", choices: ["v1", "v2"] as const },
    new_invoicing:    { kind: "percent" },
    q3_features:      { kind: "date" },
    risk_killswitch:  { kind: "killswitch" },
  },
  surfaces: ["sidebar.billing", "button.export", "tab.reports"] as const,
});

export const {
  AccessLensProvider,
  AccessGate,
  useAccessGate,
  useAccessLensSnapshot,
} = createReactBindings(al);
```

::: tip
The `as const` on each array is what gives you the typed literal unions. Without it, TypeScript widens to `string[]` and you lose autocomplete.
:::

## 3. Mount the provider

```tsx
// App.tsx
import { AccessLensProvider } from "./access-lens.js";

export function App() {
  return (
    <AccessLensProvider defaultDebugMode={import.meta.env.DEV}>
      <YourApp />
    </AccessLensProvider>
  );
}
```

::: info
`defaultDebugMode={import.meta.env.DEV}` turns the overlay on in development and off in production. You can also pass `debugMode={…}` to control it from outside, or use `useAccessLens().setDebugMode(boolean)` to flip it from a toggle.
:::

## 4. Wrap a gated surface

```tsx
import { al, AccessGate } from "./access-lens.js";

function Sidebar({ user, tenant, flags }) {
  return (
    <nav>
      <AccessGate
        id="sidebar.billing"     // ← autocompletes from `surfaces`
        type="sidebar_item"
        label="Billing"
        reasons={[
          al.permission("billing.read", user.perms.has("billing.read")),
          al.flag.billing_v2.on(flags.billing_v2.on),
          al.entitlement("billing", tenant.entitlements.billing),
          al.plan.atLeast("growth", tenant.plan),
        ]}
      >
        <a href="/billing">Billing</a>
      </AccessGate>
    </nav>
  );
}
```

That's it.

## What just happened

- **Production mode** — the link only renders when every reason in the array has `passed: true`. If any reason fails, the gate renders `null` (or whatever you pass as `fallback`).
- **Debug mode** — the link *always* renders, even when denied. Denied surfaces get a dashed outline; allowed-but-gated surfaces get a solid outline. The outline color reflects the **primary reason type** (sky=permission, indigo=flag, amber=plan, emerald=entitlement, …). Hover any outlined surface for the reason graph + tenants × roles matrix.
- **Snapshot** — every registered surface is in `useAccessLensSnapshot().nodes`, which you can read from any component for custom inspector views.

## Next

- [Concepts](/guide/concepts) — the data model behind the scenes
- [defineAccessLens](/guide/define-access-lens) — every config option
- [Feature flags](/guide/feature-flags) — all 5 kinds in detail
- [Debug overlay](/guide/debug-overlay) — what you see and how to customize it
- [Recipes](/recipes/) — real-world patterns
