# Recipe: gated select options

A dropdown where some options are hidden from some users. In debug mode, hidden options stay in their slot with a dashed outline so the menu shows what teammates on other tenants would see.

## A `GatedSelectItem` component

```tsx
import { useAccessGate, useAccessLens } from "./access-lens.js";
import { SelectItem } from "@workspace/ui/components/select";
import { cn } from "@workspace/ui/lib/utils";

interface GatedSelectItemProps {
  id: string;
  label: string;
  value: string;
  reasons: AccessReason[];
  children: ReactNode;
}

export function GatedSelectItem(props: GatedSelectItemProps) {
  const { debugMode } = useAccessLens();
  const { node, allowed } = useAccessGate({
    id: props.id,
    label: props.label,
    type: "field",
    reasons: props.reasons,
  });

  if (!debugMode) {
    return allowed ? <SelectItem value={props.value}>{props.children}</SelectItem> : null;
  }

  return (
    <SelectItem
      value={props.value}
      disabled={!allowed}
      className={cn(
        "data-disabled:opacity-100 data-disabled:pointer-events-auto!",
        allowed
          ? "outline-1 outline-sky-400/70 -outline-offset-2"
          : "outline-dashed outline-1 outline-destructive/60 -outline-offset-2",
      )}
    >
      {props.children}
    </SelectItem>
  );
}
```

## Using it

```tsx
<Select>
  <SelectTrigger>Actions</SelectTrigger>
  <SelectContent>
    <SelectGroup>
      <SelectLabel>Actions</SelectLabel>
      <SelectItem value="view">View details</SelectItem>

      <GatedSelectItem
        id="action.edit"
        label="Edit record"
        value="edit"
        reasons={[al.permission("billing.write", user.perms.has("billing.write"))]}
      >
        Edit
      </GatedSelectItem>

      <GatedSelectItem
        id="action.delete"
        label="Delete record"
        value="delete"
        reasons={[
          al.permission("billing.delete", user.perms.has("billing.delete")),
          al.plan.atLeast("growth", tenant.plan),
        ]}
      >
        Delete
      </GatedSelectItem>
    </SelectGroup>
  </SelectContent>
</Select>
```

## Why disable-with-outline beats hiding

Hiding silently means teammates can't help each other debug "why doesn't my menu have Delete?" The dashed-disabled approach in debug mode preserves the position and shows the reason on hover — the answer is right there in the menu.

In production, the disabled options vanish (return `null`) so end users see a clean list.

## See also

- [AccessGate guide](/guide/access-gate)
- [Debug overlay guide](/guide/debug-overlay)
