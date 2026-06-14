# Permissions

The classic RBAC slice. Each permission is a string key declared in your lens; `al.permission(key, passed)` produces a reason with `type: "permission"`.

## Declaration

```ts
const al = defineAccessLens({
  permissions: [
    "billing.read",
    "billing.write",
    "billing.export",
    "reports.read",
    "reports.export",
  ] as const,
  // …
});
```

## Use at gates

```ts
al.permission("billing.read", user.permissions.has("billing.read"));
//             ^^^^^^^^^^^^^ autocompletes from the union
```

Pass the boolean from wherever your permission system lives — a `Set<string>`, a JWT claim, a `useUser()` hook, a CASL ability check. Access Lens does not own the source of truth; it observes the result.

## With CASL

```ts
import { defineAbility } from "@casl/ability";

const ability = defineAbility((can) => {
  can("read", "Billing");
});

al.permission("billing.read", ability.can("read", "Billing"));
```

## With a bitmask / role table

```ts
function hasPerm(user: User, key: PermissionKey): boolean {
  return user.permissions.includes(key);
}

const reasons = [
  al.permission("billing.read", hasPerm(user, "billing.read")),
  al.permission("billing.write", hasPerm(user, "billing.write")),
];
```

## Compile-time guardrails

```ts
al.permission("billing.raed", true);
// ✗ TS error: typo not in the registry
```

## See also

- [Plans & entitlements](/guide/plans-entitlements)
- [Recipe: RBAC](/recipes/rbac)
