# Debug overlay

What you get when `debugMode` is on.

## Three visual layers

| Layer | When it appears | What it does |
|---|---|---|
| **Outlines** | On every `AccessGate` with reasons | Solid color when allowed; dashed when denied. Color = primary reason type. |
| **Hover card** | On hover over any outlined surface | Reasons (filterable) + Tenants × Roles matrix. |
| **Floating widget** | Always in debug mode | Sheet with stats, filters, and per-node inspection. |

## Outline color legend

```
sky        permission
indigo     feature_flag
amber      plan
emerald    entitlement
pink       tenant_config
slate      condition
fuchsia    custom
```

The primary type is chosen by priority — flags first, then plan, entitlement, tenant_config, condition, permission, custom.

## Hover card

Tab 1: **Reasons** — every reason with filters by kind, status (passing/failing), and free-text search over key/label/message/source.

Tab 2: **Tenants × Roles** — every (tenant, role) combination evaluated for this surface, with a colored dot per cell. Hover any cell for the full reason breakdown for that combo. Filter to open/closed only.

## Floating widget

Drops into the corner of the page. Open it for:

- Total counts (allowed, denied, unknown).
- Filter by status, type, search.
- Per-node inspection with the same Reasons / Tenants × Roles panel.
- DOM highlight on hover — moves a box-shadow ring to the matching `[data-access-lens-id]` on the page.

```tsx
import { AccessLensWidget } from "./components/AccessLensWidget.js";

<AccessLensWidget />;
```

## Turning it on

```tsx
// Hardcoded for development
<AccessLensProvider defaultDebugMode={import.meta.env.DEV}>

// User-controlled
const [debug, setDebug] = useState(false);
<AccessLensProvider debugMode={debug} onDebugModeChange={setDebug}>
```

## Production safety

`debugMode={false}` (the default) means:

- `AccessGate` renders only `children` when allowed and `fallback` when denied. **No outlines. No hover cards. No widget.**
- The snapshot still updates internally — `useAccessLensSnapshot()` works either way — so production analytics consumers keep working.

## See also

- [Provider](/guide/provider)
- [AccessGate](/guide/access-gate)
- [Snapshot inspection](/guide/snapshot)
