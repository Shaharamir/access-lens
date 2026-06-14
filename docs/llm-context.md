# Access Lens — LLM context

Paste this entire file into your LLM tool to give it complete project context. Designed for Claude / GPT / Cursor / Continue.

---

## 1. What Access Lens is

A TypeScript SDK that records *every* gated UI decision in a SaaS app — sidebar items, tabs, buttons, routes, fields, anything — with the **combined reason** that produced it. Reasons come from any input you wire up: permission checks, feature flag evaluations, plan tier comparisons, entitlement lookups, tenant config flags, and free-form named conditions. Decisions register into an in-memory client; a snapshot of every node and its status is available at any time; React/DOM adapters render denied UI as ghost / dashed elements in debug mode with a hover-card that shows the exact reason it failed and which tenants × roles it would be open for.

**Not** a flag SDK. **Not** an RBAC library. It composes both into a single observable model so support / CS / QA can answer "why doesn't this tenant see X?" without grepping the codebase.

## 2. The one-call setup

```ts
import { defineAccessLens } from "@access-lens/core";
import { createReactBindings } from "@access-lens/react";

export const al = defineAccessLens({
  permissions: ["billing.read", "billing.write", "reports.read"] as const,
  entitlements: ["billing", "analytics"] as const,
  plans: ["free", "basic", "growth", "enterprise"] as const,
  flags: {
    billing_v2:       { kind: "boolean" },
    payouts_killswitch:{ kind: "killswitch" },
    checkout_version: { kind: "variant", choices: ["v1", "v2", "v3"] as const },
    new_invoicing:    { kind: "percent" },
    q3_features:      { kind: "date" },
  },
  surfaces: ["sidebar.billing", "tab.reports"] as const,
});

// React bindings narrowed to `al`'s surfaces / lens
export const { AccessLensProvider, AccessGate, useAccessGate, useAccessLensSnapshot } =
  createReactBindings(al);
```

Every subsequent call site is statically typed against the registry above.

## 3. Building reasons — typed, no free strings

```ts
al.permission("billing.read", user.permissions.has("billing.read"));
// ❌ al.permission("billing.raed", true)  // compile error — typo not in registry

al.entitlement("billing", tenant.entitlements.billing);
al.plan.atLeast("enterprise", tenant.plan);    // ≥ enterprise in declared order
al.plan.is("free", tenant.plan);                // exact match

al.flag.billing_v2.on(flags.billing_v2.on);                          // boolean
al.flag.payouts_killswitch.notEngaged(flags.killswitch.engaged);     // killswitch (engaged=true → fails)
al.flag.checkout_version.is("v2", flags.checkout_version.value);     // variant — `"v2"` autocompletes from choices
al.flag.new_invoicing.inRollout(25, tenant.bucketPercent);           // percent — bucket < threshold
al.flag.q3_features.activeFrom("2026-07-01", today);                 // date  — today >= activeFrom

// Free-form when typed model doesn't fit:
al.condition("Tenant is not legacy", !tenant.legacy);
al.custom("any_key", true);
al.tenantConfig("legacy", tenant.legacy);  // typed if `tenantConfig` declared in config
```

Each flag kind only exposes the method matching its declared `kind`. Mixing them is a compile error:

```ts
al.flag.billing_v2.is("v2", "v2");        // ❌ boolean flag has no .is()
al.flag.checkout_version.on(true);        // ❌ variant flag has no .on()
```

## 4. Using gates in React

```tsx
<AccessGate
  id="sidebar.billing"           // ← if `surfaces` declared, autocompletes
  type="sidebar_item"             // ← typed union of AccessNodeType
  label="Billing"
  reasons={[
    al.permission("billing.read", user.permissions.has("billing.read")),
    al.flag.billing_v2.on(flags.billing_v2.on),
    al.entitlement("billing", tenant.entitlements.billing),
  ]}
>
  <a href="/billing">Billing</a>
</AccessGate>
```

- Allowed in production → renders `children` untouched.
- Denied in production → renders `fallback` (default null) — hidden.
- Allowed in debug → renders `children` with a solid color outline whose color reflects the **primary reason type** (indigo=flag, sky=permission, amber=plan, emerald=entitlement, pink=tenant_config, slate=condition, fuchsia=custom). Hover → popover with the reasons + tenants × roles matrix.
- Denied in debug → renders `children` with a *dashed* outline (red if any non-flag failure, indigo if flag-only). Same popover.

## 5. Reading the snapshot

```ts
const snapshot = useAccessLensSnapshot();  // React
//   .nodes:  AccessNode[]
//   .counts: { allowed, denied, unknown, total }
//   .generatedAt: number
```

The snapshot is referentially stable — `getSnapshot()` returns the *same* object until the registry actually mutates (this matters for `useSyncExternalStore` correctness).

## 6. Public types you'll see

```ts
type AccessNodeType =
  | "route" | "sidebar_item" | "tab" | "button" | "section" | "field" | "custom";

type AccessStatus = "allowed" | "denied" | "unknown";

type AccessReasonType =
  | "permission" | "feature_flag" | "entitlement"
  | "plan" | "tenant_config" | "condition" | "custom";

interface AccessReason {
  type: AccessReasonType;
  key: string;
  label?: string;
  passed: boolean;
  source?: string;       // free-form attribution ("user.permissions", "tenant.plan", …)
  actual?: unknown;      // what the current value was
  expected?: unknown;    // what the gate needed
  message?: string;      // human-readable reason
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

## 7. Common LLM mistakes to avoid

| Tempted to suggest | Use instead |
|---|---|
| `featureFlag("billing_v2", true)` raw helper from core | `al.flag.billing_v2.on(true)` from a configured lens |
| `permission("billing.raed", …)` typo | The lens rejects unknown keys at compile time — fix the typo |
| `al.flag.billing_v2.is("v2", …)` | `al.flag.billing_v2.on(…)` — only variant flags have `.is()` |
| Storing flag *state* in the lens config | Lens config declares **kinds**; runtime state (current value, rollout %, killswitch engaged) lives in the consumer's flag service / store |
| Comparing plans with `===` everywhere | `al.plan.atLeast("growth", tenant.plan)` honors the declared order |
| Wrapping a gated `<TabsTrigger>` in a custom `<div>` | The `AccessGate` already wraps via `cloneElement`; nesting works but the wrapper must forward `className` to its visible element or the outline gets lost |

## 8. Migration from un-typed helpers

If your codebase has the original free-string helpers:

```ts
// before
import { permission, featureFlag, entitlement } from "@access-lens/core";
permission("billing.read", true);
featureFlag("billing_v2", true);

// after
import { defineAccessLens } from "@access-lens/core";
const al = defineAccessLens({ permissions: ["billing.read"] as const, flags: { billing_v2: { kind: "boolean" } }, /* … */ });
al.permission("billing.read", true);
al.flag.billing_v2.on(true);
```

The raw helpers (`permission`, `featureFlag`, etc.) are still exported as an escape hatch for dynamic-key cases (e.g., a catalog that iterates over arbitrary flag keys at runtime) but every hand-written gate should use the lens.

## 9. When to use Access Lens vs alternatives

- **vs OpenFeature / LaunchDarkly / GrowthBook**: those evaluate *flags*. Access Lens composes flags + permissions + plans + entitlements into one observable decision per surface. You probably want both — the flag SDK feeds inputs into Access Lens reasons.
- **vs CASL / Casbin / accesscontrol**: those decide *allowed/denied*. Access Lens makes the decision *observable* — same allow/deny output, but with the why attached and a debug overlay that surfaces it.
- **vs Auth.js / NextAuth / Clerk**: those handle authentication. Access Lens handles authorization observability for already-authenticated users.

## 10. Full working starter — copy-paste runnable

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

That's the entire API surface to know. Everything else is recipe-level composition.
