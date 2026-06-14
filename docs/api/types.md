# Types

Every public type exported by `@access-lens/core`.

## AccessReason

```ts
type AccessReasonType =
  | "permission"
  | "feature_flag"
  | "entitlement"
  | "plan"
  | "tenant_config"
  | "condition"
  | "custom";

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

## AccessNode

```ts
type AccessNodeType =
  | "route"
  | "sidebar_item"
  | "tab"
  | "button"
  | "section"
  | "field"
  | "custom";

type AccessStatus = "allowed" | "denied" | "unknown";

interface AccessNode {
  id: string;
  label: string;
  type: AccessNodeType;
  status: AccessStatus;
  reasons: AccessReason[];
  metadata?: Record<string, unknown>;
}
```

## AccessSnapshot

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

type AccessLensListener = (snapshot: AccessSnapshot) => void;
```

## EvaluateInput

```ts
interface EvaluateInput {
  id: string;
  label: string;
  type: AccessNodeType;
  reasons?: AccessReason[];
  metadata?: Record<string, unknown>;
  defaultStatus?: AccessStatus;
}
```

## ReasonOptions

Shared by every reason builder.

```ts
interface ReasonOptions {
  label?: string;
  source?: string;
  actual?: unknown;
  expected?: unknown;
  message?: string;
}
```

## Lens types

```ts
type FlagSpec =
  | { kind: "boolean" }
  | { kind: "killswitch" }
  | { kind: "variant"; choices: readonly string[] }
  | { kind: "percent" }
  | { kind: "date" };

type FlagMap = Readonly<Record<string, FlagSpec>>;

interface AccessLensConfig<TPerm, TEnt, TPlan, TFlags, TTenantCfg, TSurfaces> { /* … */ }
interface AccessLens<TPerm, TEnt, TPlan, TFlags, TTenantCfg, TSurfaces> { /* … */ }

type SurfaceIdOf<L> = …;
type FlagApi<S extends FlagSpec> = …;
```

See [`defineAccessLens`](/api/define-access-lens) for full generic forms.

## See also

- [defineAccessLens](/api/define-access-lens)
- [evaluateAccess](/api/evaluate-access)
- [AccessLensClient](/api/client)
