# Recipe: tenant config

Per-tenant flags that aren't quite feature flags and aren't quite entitlements — things like "legacy account", "EU compliance mode", "trial expired".

## Two ways to model

### Option A: typed via `tenantConfig`

```ts
const al = defineAccessLens({
  tenantConfig: ["legacy", "trial_expired", "eu_compliance"] as const,
  // …
});

al.tenantConfig("legacy", tenant.legacy);
```

Best when the tenant-config keys are stable and you want autocomplete.

### Option B: free-form `condition`

```ts
al.condition("Tenant is not legacy", !tenant.legacy);
```

Best for one-off checks and rapid prototyping.

## "Legacy mode" tab

```tsx
<AccessGate
  id="tab.legacy"
  type="tab"
  label="Legacy mode"
  reasons={[
    al.tenantConfig("legacy", tenant.legacy),
  ]}
>
  <TabTrigger>Legacy mode</TabTrigger>
</AccessGate>
```

Only renders for tenants whose `legacy` flag is true.

## EU-only feature

```tsx
<AccessGate
  id="section.gdpr-export"
  type="section"
  label="GDPR data export"
  reasons={[
    al.condition("Tenant region is EU", tenant.region === "eu", {
      source: "tenant.region",
      actual: tenant.region,
      expected: "eu",
    }),
  ]}
>
  <GdprExportPanel />
</AccessGate>
```

## See also

- [Custom reasons guide](/guide/custom-reasons)
