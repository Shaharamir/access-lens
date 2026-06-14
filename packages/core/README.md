# @access-lens/core

Framework-agnostic core for Access Lens. Pure TypeScript. No React. No DOM assumptions.

## Install

```bash
pnpm add @access-lens/core
```

## What it provides

- Access decision model (`AccessNode`, `AccessReason`, `AccessStatus`).
- Reason helpers (`permission`, `featureFlag`, `entitlement`, `plan`, `tenantConfig`, `condition`, `customReason`).
- `evaluateAccess()` — pure function turning reasons into an `AccessNode`.
- `AccessLensClient` — registry + snapshot + subscribe API for adapters.

## Basic usage

```ts
import {
  createAccessLensClient,
  evaluateAccess,
  permission,
  featureFlag,
  entitlement,
} from "@access-lens/core";

const client = createAccessLensClient();

const node = evaluateAccess({
  id: "sidebar.billing",
  label: "Billing",
  type: "sidebar_item",
  reasons: [
    permission("billing.read", user.permissions.includes("billing.read")),
    featureFlag("billing_v2", flags.billing_v2),
    entitlement("billing", tenant.entitlements.billing),
  ],
});

client.registerNode(node);

// Subscribe to snapshot changes.
const unsubscribe = client.subscribe((snapshot) => {
  console.log(snapshot.counts, snapshot.nodes);
});
```

## Why a headless core?

Adapters (React, Vue, Angular, plain DOM, server) all share the same evaluation rules. The core owns the model and registry, adapters own how nodes get registered and how denied UI is rendered.
