# RBAC, ABAC, PBAC, ReBAC

Access Lens is not itself an access-control system — it's an **observability layer** over whichever model your app uses. It models RBAC and ABAC natively in its reason types, and integrates with PBAC and ReBAC engines by treating their decisions as inputs.

## At a glance

| Model | What it evaluates | Native in Access Lens? | How |
|---|---|---|---|
| **RBAC** — Role-Based Access Control | "Who you are" (your role / permission grants) | ✓ fully native | `al.permission(key, granted)` |
| **ABAC** — Attribute-Based Access Control | "Who / what / when / where" attributes | ✓ fully native | `al.condition` + `al.tenantConfig` + `al.flag.percent` (bucket attribute) + `al.flag.date` (time attribute) |
| **PBAC** — Policy-Based Access Control | Centralized rule sets separating code from policy | ~ via integration | Use OPA / Cedar as the decision engine; pipe their boolean output through `al.permission()` or `al.custom()` |
| **ReBAC** — Relationship-Based Access Control | "How you relate to the resource" (graph relationships) | ~ via integration | Use SpiceDB / OpenFGA / Zanzibar-style engines; pipe their `check()` results through `al.custom()` or `al.condition()` |

## RBAC

The simplest model — each user holds a set of permissions or roles; gates check membership.

```ts
al.permission("billing.read", user.permissions.has("billing.read"));
```

Direct mapping. Pass any boolean from your role-resolution layer.

## ABAC

Decisions based on attributes of the user, resource, environment, or time. Access Lens models attribute checks through several reason types:

```ts
// User attribute
al.condition("User is in finance department", user.department === "finance");

// Resource attribute
al.tenantConfig("legacy", tenant.legacy);

// Environmental attribute (time)
al.flag.q3_features.activeFrom("2026-07-01", todayIso);

// Environmental attribute (rollout bucket)
al.flag.new_invoicing.inRollout(25, tenant.bucketPercent);
```

The `actual` and `expected` fields on every reason are explicitly ABAC-shaped — they capture the *attribute value* the gate compared against the *required value*.

## PBAC

Policy engines like [Open Policy Agent (OPA)](https://www.openpolicyagent.org/), [Cedar](https://www.cedarpolicy.com/), or [Permify](https://github.com/Permify/permify) externalize rules out of application code into a policy file. They take a context and emit allowed/denied.

Access Lens treats that output as an input:

```ts
import { OpaClient } from "@open-policy-agent/opa";

const opa = new OpaClient({ baseUrl: process.env.OPA_URL });

async function buildReasons(user, tenant, resource) {
  const decision = await opa.evaluate("billing/allow", { user, tenant, resource });

  return [
    al.custom("opa:billing.allow", decision.result === true, {
      source: "policy.opa",
      actual: decision.result,
      expected: true,
      message: decision.reasons?.join("; "),
    }),
  ];
}
```

You keep your policies in Rego/Cedar; Access Lens makes the *decision* observable in the UI overlay.

::: tip Future
A `@access-lens/opa` adapter that calls OPA and wraps the result in a typed reason is on the roadmap. For now, the manual wiring above takes ~10 lines.
:::

## ReBAC

Relationship engines like [SpiceDB](https://authzed.com/spicedb), [OpenFGA](https://openfga.dev/), or Google Zanzibar model permissions as a graph: "is user X an editor of document Y?" Access Lens accepts those check results as reasons:

```ts
import { v1 } from "@authzed/authzed-node";

const client = v1.NewClient(/* … */);

async function buildReasons(user, document) {
  const check = await client.promises.checkPermission(
    v1.CheckPermissionRequest.create({
      resource: v1.ObjectReference.create({ objectType: "document", objectId: document.id }),
      permission: "edit",
      subject: v1.SubjectReference.create({
        object: v1.ObjectReference.create({ objectType: "user", objectId: user.id }),
      }),
    }),
  );

  return [
    al.custom("spicedb:document.edit", check.permissionship === "HAS_PERMISSION", {
      source: "relationship.spicedb",
      message: `User ${user.id} → document ${document.id}`,
    }),
  ];
}
```

The relationship lookup happens in SpiceDB; Access Lens records the decision alongside whatever other reasons fed the same gate.

## Why this works

Every model — RBAC, ABAC, PBAC, ReBAC — ultimately produces a boolean for "should this user be able to do X?" Access Lens collects those booleans alongside the **why** that produced them, then renders the combined decision into one observable surface. It doesn't compete with your authorization stack; it makes it explainable to the humans who debug it.

## See also

- [Permissions](/guide/permissions)
- [Custom reasons](/guide/custom-reasons)
- [Server-side gates](/guide/server-side)
