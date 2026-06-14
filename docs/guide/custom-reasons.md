# Custom reasons

When the typed `permission`, `entitlement`, `plan`, `flag`, `tenant_config` model doesn't quite fit, two escape hatches.

## condition — free-form named conditions

```ts
al.condition(
  "Tenant is not flagged legacy",
  !tenant.legacy,
);
```

Use for one-off checks that aren't worth typing into the registry: "tenant is in EU", "user is account owner", "trial has expired".

## custom — anything else

```ts
al.custom("invitation-required", user.hasInvite);
```

Use for reason types Access Lens doesn't model directly. Renders in the debug overlay with the `custom` color (fuchsia) so they're visually distinct.

## With richer options

Both accept the full `ReasonOptions` so you can attach `message`, `source`, `actual`, `expected`:

```ts
al.condition(
  "Tenant region is EU",
  tenant.region === "eu",
  {
    source: "tenant.region",
    actual: tenant.region,
    expected: "eu",
    message: tenant.region === "eu"
      ? undefined
      : `Tenant is in ${tenant.region}; this requires EU.`,
  },
);
```

These all surface in the debug overlay's hover card.

## When to graduate to the typed model

If you find yourself repeating the same `al.condition("tenant is in EU", …)` across many gates, that's a signal to add it to the registry as a `tenantConfig` key or to extend your config.

## See also

- [defineAccessLens](/guide/define-access-lens)
- [Recipe: tenant config](/recipes/tenant-config)
