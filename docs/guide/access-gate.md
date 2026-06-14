# AccessGate

The component that wraps any gated UI element. Pass it an id, type, label, and the array of reasons; it registers a node with the client and decides whether to render the children, the fallback, or a debug ghost.

## Basic usage

```tsx
<AccessGate
  id="sidebar.billing"
  type="sidebar_item"
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

## Props

| Prop | Type | Required | Description |
|---|---|---|---|
| `id` | `string` (or `SurfaceId` if declared) | yes | Unique identifier for this surface. |
| `type` | `AccessNodeType` | yes | `"sidebar_item" \| "tab" \| "button" \| "section" \| "route" \| "field" \| "custom"`. |
| `label` | `string` | yes | Human-readable label shown in inspectors. |
| `reasons` | `AccessReason[]` | yes | The list of reasons that determine this surface's status. |
| `children` | `ReactNode` | yes | What to render when allowed. |
| `fallback` | `ReactNode` | no | What to render when denied in production mode. Default `null`. |
| `metadata` | `Record<string, unknown>` | no | Free-form metadata attached to the node, visible in inspectors. |

## Render behavior

| Mode | Status | Renders |
|---|---|---|
| Production | allowed | `children` unchanged |
| Production | denied | `fallback` (default `null`) |
| Debug | allowed | `children` with **solid** colored outline + hover-card |
| Debug | denied | `children` with **dashed** colored outline + hover-card |

The outline color reflects the **primary reason type**:

| Reason type | Color |
|---|---|
| `permission` | sky |
| `feature_flag` | indigo |
| `plan` | amber |
| `entitlement` | emerald |
| `tenant_config` | pink |
| `condition` | slate |
| `custom` | fuchsia |

## Child element requirements

`AccessGate` adds the outline className via `React.cloneElement`. Your child element **must forward** `className`, `aria-disabled`, and `data-access-lens-id` to its rendered DOM element. shadcn primitives (Button, TabsTrigger, etc.) already do this.

If you wrap your gate around a custom component, spread the rest props onto the visible element:

```tsx
function NavItem({ label, ...rest }) {
  return <Item {...rest}>{label}</Item>;
}
```

## See also

- [Provider](/guide/provider)
- [Debug overlay](/guide/debug-overlay)
- [Recipe: gated select options](/recipes/gated-select)
