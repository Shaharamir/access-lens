# @access-lens/react

React adapter for Access Lens.

## Install

```bash
pnpm add @access-lens/react @access-lens/core
```

## Quick start

```tsx
import {
  AccessLensProvider,
  AccessGate,
  permission,
  featureFlag,
  entitlement,
} from "@access-lens/react";

function App() {
  return (
    <AccessLensProvider defaultDebugMode={false}>
      <Sidebar />
    </AccessLensProvider>
  );
}

function Sidebar() {
  return (
    <AccessGate
      id="sidebar.billing"
      label="Billing"
      type="sidebar_item"
      reasons={[
        permission("billing.read", user.permissions.includes("billing.read")),
        featureFlag("billing_v2", flags.billing_v2),
        entitlement("billing", tenant.entitlements.billing),
      ]}
    >
      <a href="/billing">Billing</a>
    </AccessGate>
  );
}
```

## Behavior

- `allowed` → renders `children` unchanged.
- `denied` and `debugMode = false` → renders `fallback` (or nothing).
- `denied` and `debugMode = true` and `ghostInDebug = true` → renders `children`
  wrapped in a dashed/ghost style with a tooltip listing the failed reasons and
  a `data-access-lens-id` attribute for the overlay.

## Hooks

- `useAccessLens()` — returns `{ client, debugMode, setDebugMode }`.
- `useAccessGate(input)` — returns `{ node, allowed, denied, unknown }` and
  registers the node into the client.
- `useAccessLensSnapshot()` — subscribes to the live snapshot via React's
  `useSyncExternalStore`.

The reason helpers and the core types are re-exported here for convenience so a React app rarely needs to import `@access-lens/core` directly.
