# Concepts

The whole library fits in 5 concepts. If you understand these you understand everything.

## 1. `AccessReason`

A single input to an access decision. Has a `type` (`permission`, `feature_flag`, `entitlement`, `plan`, `tenant_config`, `condition`, `custom`), a `key`, and crucially a `passed: boolean`. Plus optional metadata (`label`, `source`, `actual`, `expected`, `message`).

```ts
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
```

You never construct these by hand. The typed lens builds them for you:

```ts
al.permission("billing.read", true)
// → { type: "permission", key: "billing.read", passed: true,
//     source: "user.permissions", actual: "granted", expected: "granted" }
```

## 2. `AccessNode`

A single gated UI surface, with the reasons that fed its decision and the resulting `status` (`allowed` / `denied` / `unknown`).

```ts
interface AccessNode {
  id: string;
  label: string;
  type: AccessNodeType;     // "sidebar_item" | "tab" | "button" | "section" | "route" | "field" | "custom"
  status: AccessStatus;
  reasons: AccessReason[];
  metadata?: Record<string, unknown>;
}
```

`evaluateAccess({ id, label, type, reasons })` returns one of these. The status is computed deterministically:

- All `reasons` have `passed: true` → `allowed`
- Any reason has `passed: false` → `denied`
- Empty `reasons` → `allowed` (or whatever `defaultStatus` you pass)

## 3. `AccessLensClient`

The in-memory registry. Holds every registered `AccessNode`. Exposes:

- `registerNode(node)` — store/update (dedups identical content).
- `unregisterNode(id)` — remove.
- `getSnapshot()` — referentially stable read of the current state.
- `subscribe(listener)` — async-batched notification when the registry changes.

You rarely touch this directly; the React adapter wires it up for you. But it's the same client whether you use React, Vue, vanilla JS, or run it server-side.

## 4. `AccessSnapshot`

The output of `getSnapshot()` — everything you need to render an inspector view.

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

The snapshot identity is **stable across reads** — `client.getSnapshot() === client.getSnapshot()` until something actually changes. This is what makes it safe to use with React's `useSyncExternalStore`.

## 5. The typed lens (`defineAccessLens`)

The reason-builder API, bound to your app's vocabulary.

```ts
const al = defineAccessLens({
  permissions: [...] as const,
  entitlements: [...] as const,
  plans: [...] as const,         // ordered from lowest to highest tier
  flags: { ... },                // per-kind spec
  surfaces: [...] as const,      // optional: typed AccessGate#id
});
```

`al` then exposes:

- `al.permission(key, passed)` — `key` autocompletes from `permissions`.
- `al.entitlement(key, granted)` — `key` autocompletes from `entitlements`.
- `al.plan.is(want, actual)` / `al.plan.atLeast(min, actual)` — `want`/`min`/`actual` all autocomplete from `plans`.
- `al.flag.<key>.<method>(…)` — `<method>` is the *only* method for that flag's `kind`:
  - `boolean` → `.on(value)`
  - `killswitch` → `.notEngaged(engaged)`
  - `variant` → `.is(want, actual)` (with `want`/`actual` autocompleted from `choices`)
  - `percent` → `.inRollout(threshold, bucket)`
  - `date` → `.activeFrom(activeFrom, today)`
- `al.condition(label, passed)` — free-form named condition (no registry).
- `al.tenantConfig(key, passed)` — typed if you declared `tenantConfig` in the config.
- `al.custom(key, passed)` — escape hatch.

All of these return `AccessReason`. They're inputs you pass to `AccessGate#reasons`.

## How they fit together

```
                       Your app
                          │
                          │   (build reasons via the lens)
                          ▼
                  ┌───────────────┐
                  │ AccessReason[]│
                  └───────┬───────┘
                          │
                          │   (wrap a surface)
                          ▼
                  ┌───────────────┐
                  │  AccessGate   │ ──► evaluateAccess()
                  └───────┬───────┘
                          │
                          │   (registers the node)
                          ▼
                  ┌───────────────┐
                  │AccessLensClient│
                  └───────┬───────┘
                          │
                          │   (snapshot read by inspectors)
                          ▼
                  ┌───────────────┐
                  │ AccessSnapshot│
                  └───────────────┘
```

That's the whole architecture. Everything else — the debug overlay, the matrix, the catalog, the floating widget — is just a different view on the same `AccessSnapshot`.

## Next

- [defineAccessLens](/guide/define-access-lens) — every config option
- [AccessGate](/guide/access-gate) — props, behavior, ghost rendering
- [Snapshot inspection](/guide/snapshot) — building your own inspector views
