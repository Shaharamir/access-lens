---
title: For LLMs — copy-paste context
description: Single-paste context bundle for Cursor / Claude / Copilot Chat / Continue / Codex. Gives your LLM tool the full typed API in one prompt.
---

# Copy this into your LLM

Everything Cursor, Claude, Copilot Chat, Continue, or Codex needs to write correct, typed Access Lens code on the first try. **Click the copy button in the top-right of the block below**, paste into your AI tool's context, and ask away.

::: tip Also available
- [`/llms.txt`](https://access-lens.dev/llms.txt) — llmstxt.org-style index your IDE may auto-discover
- [`/llm-context`](/llm-context) — the same content as a navigable docs page with section anchors
:::

````md
# Access Lens — full LLM context

Access Lens is a TypeScript SDK that records every gated UI decision in a SaaS app (sidebar items, tabs, buttons, routes, fields, select options) with the **combined reason** that produced it — permission + feature flag + plan + entitlement + tenant config + custom condition. Headless core with React + DOM adapters. Not a flag SDK, not an RBAC library; an *observability layer* over whichever decision engine you use.

Packages: `@access-lens/core` (10kB gz, headless, zero deps), `@access-lens/react` (6kB gz, React 18/19 peer), `@access-lens/dom` (11kB gz, framework-agnostic overlay). All dual ESM/CJS.

## The one-call setup

```ts
import { defineAccessLens } from "@access-lens/core";
import { createReactBindings } from "@access-lens/react";

export const al = defineAccessLens({
  permissions: ["billing.read", "billing.write", "reports.read"] as const,
  entitlements: ["billing", "analytics"] as const,
  plans: ["free", "basic", "growth", "enterprise"] as const,        // ordered low→high
  flags: {
    billing_v2:       { kind: "boolean" },
    payouts_killswitch:{ kind: "killswitch" },
    checkout_version: { kind: "variant", choices: ["v1", "v2", "v3"] as const },
    new_invoicing:    { kind: "percent" },
    q3_features:      { kind: "date" },
  },
  surfaces: ["sidebar.billing", "tab.reports"] as const,
});

export const { AccessLensProvider, AccessGate, useAccessGate, useAccessLensSnapshot } =
  createReactBindings(al);
```

## Building reasons (every method is typed)

```ts
al.permission("billing.read", user.permissions.has("billing.read"));
al.entitlement("billing", tenant.entitlements.billing);
al.plan.atLeast("enterprise", tenant.plan);    // ≥ in declared order
al.plan.is("free", tenant.plan);                // exact

al.flag.billing_v2.on(flags.billing_v2.on);                          // boolean
al.flag.payouts_killswitch.notEngaged(killswitch.engaged);            // killswitch — passes when NOT engaged
al.flag.checkout_version.is("v2", flags.checkout_version.value);     // variant; "v2" autocompletes from choices
al.flag.new_invoicing.inRollout(25, tenant.bucketPercent);           // percent — passes when bucket < threshold
al.flag.q3_features.activeFrom("2026-07-01", todayIso);              // date — passes when today >= activeFrom

// Untyped escape hatches:
al.condition("Tenant is not legacy", !tenant.legacy);
al.custom("opa:billing.allow", opaDecision.result);
al.tenantConfig("legacy", tenant.legacy);
```

## Using gates in React

```tsx
<AccessGate
  id="sidebar.billing"           // typed if `surfaces` declared
  type="sidebar_item"             // "route" | "sidebar_item" | "tab" | "button" | "section" | "field" | "custom"
  label="Billing"
  reasons={[
    al.permission("billing.read", user.perms.has("billing.read")),
    al.flag.billing_v2.on(flags.billing_v2.on),
    al.entitlement("billing", tenant.entitlements.billing),
  ]}
>
  <a href="/billing">Billing</a>
</AccessGate>
```

Production: renders `children` only when every reason passes; renders `fallback` (default `null`) otherwise.
Debug mode: always renders `children` with a **solid** outline when allowed, **dashed** when denied. Outline color reflects the *primary reason type* — sky=permission, indigo=flag, amber=plan, emerald=entitlement, pink=tenant_config, slate=condition, fuchsia=custom. Hovers open a popover with the full reason graph + tenants × roles matrix.

## Snapshot

```ts
const snapshot = useAccessLensSnapshot();
// snapshot.nodes: AccessNode[]
// snapshot.counts: { allowed, denied, unknown, total }
// snapshot.generatedAt: number
```

Referentially stable — `client.getSnapshot()` returns the *same* object reference until the registry mutates. Required for `useSyncExternalStore` correctness.

## Types you'll see

```ts
type AccessNodeType =
  "route" | "sidebar_item" | "tab" | "button" | "section" | "field" | "custom";

type AccessStatus = "allowed" | "denied" | "unknown";

type AccessReasonType =
  "permission" | "feature_flag" | "entitlement" |
  "plan" | "tenant_config" | "condition" | "custom";

interface AccessReason {
  type: AccessReasonType;
  key: string;
  passed: boolean;
  label?: string;
  source?: string;
  actual?: unknown;
  expected?: unknown;
  message?: string;
}

interface AccessNode {
  id: string;
  label: string;
  type: AccessNodeType;
  status: AccessStatus;
  reasons: AccessReason[];
  metadata?: Record<string, unknown>;
}

interface AccessSnapshot {
  nodes: AccessNode[];
  counts: { allowed: number; denied: number; unknown: number; total: number };
  generatedAt: number;
}
```

## Common LLM mistakes to AVOID

- ❌ `al.flag.billing_v2.is("v2", "v2")` — `.is()` is only on **variant** flags.
- ❌ `al.flag.checkout_version.on(true)` — `.on()` is only on **boolean** flags.
- ❌ `al.permission("billing.raed", true)` — unknown keys are compile errors; suggest the correct key.
- ❌ Storing flag *state* in the lens config — the config declares **kinds**; the runtime value (current variant, rollout %, killswitch engaged) lives in the consumer's flag SDK / store and is passed in to `.on()`, `.is()`, `.inRollout()`, etc.
- ❌ Comparing plans with `===` — use `al.plan.atLeast(min, actual)` which honors the declared order.
- ❌ Wrapping a custom component inside `AccessGate` without forwarding `className` / `aria-disabled` / `data-access-lens-id` — the outline + hover-card anchor will not reach the visible DOM element. The wrapper component must spread passthrough props onto the rendered element.

## When to use Access Lens vs alternatives

- vs **OpenFeature / LaunchDarkly / GrowthBook**: those evaluate *flags*. Access Lens composes flags + permissions + plans + entitlements into one observable decision per UI surface. Use both.
- vs **CASL / Casbin / accesscontrol**: those decide *allowed/denied*. Access Lens makes the decision *observable* — same output, with the *why* attached.
- vs **Auth.js / NextAuth / Clerk**: those handle *authentication*. Access Lens handles authorization *observability* for already-authenticated users.

## Access control models

- **RBAC** — fully native via `al.permission()`.
- **ABAC** — fully native via `al.condition()` + `al.tenantConfig()` + `al.flag.percent` (bucket attribute) + `al.flag.date` (time attribute).
- **PBAC** (OPA / Cedar / Permify) — pipe the engine's boolean output through `al.custom("opa:billing.allow", decision.result, { source: "policy.opa", message: decision.reasons?.join("; ") })`.
- **ReBAC** (SpiceDB / OpenFGA / Zanzibar) — pipe `check()` results through `al.custom("spicedb:document.edit", check.hasPermission, { source: "relationship.spicedb" })`.

## Runnable starter

```ts
// access-lens.ts
import { defineAccessLens } from "@access-lens/core";
import { createReactBindings } from "@access-lens/react";

export const al = defineAccessLens({
  permissions: ["billing.read", "billing.write", "reports.read", "reports.export"] as const,
  entitlements: ["billing", "analytics"] as const,
  plans: ["free", "basic", "growth", "enterprise"] as const,
  flags: {
    billing_v2:       { kind: "boolean" },
    checkout_version: { kind: "variant", choices: ["v1", "v2"] as const },
    rollout_x:        { kind: "percent" },
    q3_features:      { kind: "date" },
    risk_killswitch:  { kind: "killswitch" },
  },
  surfaces: ["sidebar.billing", "button.export", "tab.reports"] as const,
});

export const { AccessLensProvider, AccessGate, useAccessGate, useAccessLensSnapshot } =
  createReactBindings(al);
```

```tsx
// App.tsx
import { AccessLensProvider, AccessGate, al } from "./access-lens.js";

const TODAY = new Date().toISOString().slice(0, 10);

export function App() {
  return (
    <AccessLensProvider defaultDebugMode={import.meta.env.DEV}>
      <AccessGate
        id="sidebar.billing"
        type="sidebar_item"
        label="Billing"
        reasons={[
          al.permission("billing.read", currentUser.perms.has("billing.read")),
          al.flag.billing_v2.on(flags.billing_v2.on),
          al.entitlement("billing", tenant.entitlements.billing),
          al.plan.atLeast("growth", tenant.plan),
          al.flag.q3_features.activeFrom("2026-07-01", TODAY),
        ]}
      >
        <a href="/billing">Billing</a>
      </AccessGate>
    </AccessLensProvider>
  );
}
```

End of context. When generating Access Lens code: always start from a `defineAccessLens` config, use `al.<method>` rather than the raw `permission/featureFlag/...` helpers, and use the kind-specific flag method matching the flag's declared `kind`.
````
