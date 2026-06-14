/**
 * Runtime "access set" for a single user/tenant — the typed wrapper around
 * whatever JSON your `/api/me/access` endpoint returns. Once you've built one
 * of these, the typed lens methods read from it directly:
 *
 * @example
 * ```ts
 * const json = await fetch("/api/me/access").then(r => r.json());
 * const access = createAccessSet(json);
 *
 * const reasons = [
 *   al.permission("billing.read", access.hasPermission("billing.read")),
 *   al.entitlement("billing", access.hasEntitlement("billing")),
 *   al.plan.atLeast("growth", access.plan),
 *   al.flag.billing_v2.on(access.booleanFlag("billing_v2")),
 *   al.flag.checkout_version.is("v2", access.variantFlag("checkout_version")),
 * ];
 * ```
 *
 * The helper is intentionally framework-agnostic — bring your own fetch /
 * React Query / SWR / RTK Query and pass the parsed JSON in.
 */

/* -------- Shape returned by your backend -------- */

export type FlagRuntimeValue =
  | { readonly kind: "boolean"; readonly on: boolean }
  | { readonly kind: "killswitch"; readonly engaged: boolean }
  | { readonly kind: "variant"; readonly value: string }
  | { readonly kind: "percent"; readonly rollout: number }
  | { readonly kind: "date"; readonly activeFrom: string };

export interface AccessSetJson {
  readonly permissions: readonly string[];
  readonly plan: string;
  readonly entitlements: Readonly<Record<string, boolean>>;
  readonly flags: Readonly<Record<string, FlagRuntimeValue>>;
  readonly tenantConfig?: Readonly<Record<string, unknown>>;
  readonly tenant?: {
    readonly bucketPercent?: number;
    readonly [key: string]: unknown;
  };
}

/* -------- The runtime object you actually use at gate sites -------- */

export interface AccessSet {
  readonly permissions: ReadonlySet<string>;
  readonly entitlements: Readonly<Record<string, boolean>>;
  readonly plan: string;
  readonly flags: Readonly<Record<string, FlagRuntimeValue>>;
  readonly tenantConfig: Readonly<Record<string, unknown>>;
  readonly bucketPercent: number;

  hasPermission(key: string): boolean;
  hasEntitlement(key: string): boolean;
  flag(key: string): FlagRuntimeValue | undefined;

  /** Extract the `on` value of a boolean flag; false if missing or wrong kind. */
  booleanFlag(key: string): boolean;
  /** Extract the `engaged` value of a killswitch; true if missing or wrong kind (fail-safe). */
  killswitchEngaged(key: string): boolean;
  /** Extract the `value` of a variant flag; empty string if missing or wrong kind. */
  variantFlag(key: string): string;
  /** Extract the `rollout` value of a percent flag; 0 if missing or wrong kind. */
  percentFlag(key: string): number;
  /** Extract the `activeFrom` value of a date flag; far-future ISO if missing. */
  dateFlag(key: string): string;
}

/* -------- Validation + construction -------- */

export class AccessSetValidationError extends Error {
  constructor(message: string) {
    super(`[access-lens] AccessSetJson invalid: ${message}`);
    this.name = "AccessSetValidationError";
  }
}

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new AccessSetValidationError(message);
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function validateFlag(key: string, raw: unknown): FlagRuntimeValue {
  assert(isRecord(raw), `flag "${key}" must be an object`);
  const kind = raw["kind"];
  assert(
    typeof kind === "string" &&
      (kind === "boolean" ||
        kind === "killswitch" ||
        kind === "variant" ||
        kind === "percent" ||
        kind === "date"),
    `flag "${key}" has invalid kind "${String(kind)}"`,
  );
  switch (kind) {
    case "boolean": {
      const on = raw["on"];
      assert(typeof on === "boolean", `flag "${key}".on must be boolean`);
      return { kind: "boolean", on };
    }
    case "killswitch": {
      const engaged = raw["engaged"];
      assert(
        typeof engaged === "boolean",
        `flag "${key}".engaged must be boolean`,
      );
      return { kind: "killswitch", engaged };
    }
    case "variant": {
      const value = raw["value"];
      assert(typeof value === "string", `flag "${key}".value must be string`);
      return { kind: "variant", value };
    }
    case "percent": {
      const rollout = raw["rollout"];
      assert(
        typeof rollout === "number" && rollout >= 0 && rollout <= 100,
        `flag "${key}".rollout must be a number in [0, 100]`,
      );
      return { kind: "percent", rollout };
    }
    case "date": {
      const activeFrom = raw["activeFrom"];
      assert(
        typeof activeFrom === "string",
        `flag "${key}".activeFrom must be an ISO date string`,
      );
      return { kind: "date", activeFrom };
    }
  }
}

/**
 * Validate a raw JSON response and return a typed `AccessSet` ready to feed
 * into reason builders.
 *
 * @throws {AccessSetValidationError} when the JSON shape is wrong.
 */
export function createAccessSet(json: unknown): AccessSet {
  assert(isRecord(json), "expected an object at the top level");

  const permissionsRaw = json["permissions"];
  assert(Array.isArray(permissionsRaw), "`permissions` must be an array");
  for (const p of permissionsRaw) {
    assert(typeof p === "string", "every permission must be a string");
  }
  const permissions = new Set<string>(permissionsRaw as readonly string[]);

  const plan = json["plan"];
  assert(typeof plan === "string", "`plan` must be a string");

  const entitlementsRaw = json["entitlements"];
  assert(isRecord(entitlementsRaw), "`entitlements` must be an object");
  const entitlements: Record<string, boolean> = {};
  for (const [key, value] of Object.entries(entitlementsRaw)) {
    assert(
      typeof value === "boolean",
      `entitlement "${key}" must be a boolean`,
    );
    entitlements[key] = value;
  }

  const flagsRaw = json["flags"];
  assert(isRecord(flagsRaw), "`flags` must be an object");
  const flags: Record<string, FlagRuntimeValue> = {};
  for (const [key, raw] of Object.entries(flagsRaw)) {
    flags[key] = validateFlag(key, raw);
  }

  const tenantConfigRaw = json["tenantConfig"];
  const tenantConfig: Record<string, unknown> = isRecord(tenantConfigRaw)
    ? { ...tenantConfigRaw }
    : {};

  const tenantRaw = json["tenant"];
  let bucketPercent = 0;
  if (isRecord(tenantRaw)) {
    const candidate = tenantRaw["bucketPercent"];
    if (typeof candidate === "number") bucketPercent = candidate;
  }

  return {
    permissions,
    entitlements,
    plan,
    flags,
    tenantConfig,
    bucketPercent,

    hasPermission(key) {
      return permissions.has(key);
    },
    hasEntitlement(key) {
      return entitlements[key] === true;
    },
    flag(key) {
      return flags[key];
    },

    booleanFlag(key) {
      const f = flags[key];
      return f?.kind === "boolean" ? f.on : false;
    },
    killswitchEngaged(key) {
      const f = flags[key];
      return f?.kind === "killswitch" ? f.engaged : true;
    },
    variantFlag(key) {
      const f = flags[key];
      return f?.kind === "variant" ? f.value : "";
    },
    percentFlag(key) {
      const f = flags[key];
      return f?.kind === "percent" ? f.rollout : 0;
    },
    dateFlag(key) {
      const f = flags[key];
      return f?.kind === "date" ? f.activeFrom : "9999-12-31";
    },
  };
}

/** An "empty" access set — useful during initial load before /me/access resolves. */
export function emptyAccessSet(plan = "free"): AccessSet {
  return createAccessSet({
    permissions: [],
    plan,
    entitlements: {},
    flags: {},
  });
}
