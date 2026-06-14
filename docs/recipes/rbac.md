# Recipe: RBAC with permissions

Classic per-user permissions, where the user object carries a list of permission strings.

## Setup

```ts
const al = defineAccessLens({
  permissions: [
    "billing.read", "billing.write", "billing.delete",
    "reports.read", "reports.export",
    "risk.write",
  ] as const,
  // …
});
```

## Helper

```ts
function hasPerm(user: User, key: PermissionKey): boolean {
  return user.permissions.includes(key);
}
```

## At gates

```tsx
<AccessGate
  id="button.delete-billing"
  type="button"
  label="Delete billing record"
  reasons={[
    al.permission("billing.delete", hasPerm(user, "billing.delete")),
  ]}
>
  <Button variant="destructive">Delete</Button>
</AccessGate>
```

## Composing multiple permissions

```ts
const reasons = [
  al.permission("reports.read", hasPerm(user, "reports.read")),
  al.permission("reports.export", hasPerm(user, "reports.export")),
];
```

A gate with both reasons requires **all** of them to pass.

## With CASL

```ts
import { defineAbility } from "@casl/ability";

const ability = defineAbility((can) => {
  can("read", "Billing");
  can("write", "Billing");
});

al.permission("billing.read", ability.can("read", "Billing"));
al.permission("billing.write", ability.can("write", "Billing"));
```

## With a backend permission API

```ts
const { data: perms } = useQuery({
  queryKey: ["permissions"],
  queryFn: () => api.getPermissions(),
});

const reasons = [
  al.permission("billing.read", perms?.has("billing.read") ?? false),
];
```

## See also

- [Permissions guide](/guide/permissions)
