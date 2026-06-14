import type { AccessReason, ReasonOptions } from "./types.js";
import {
  condition,
  customReason,
  entitlement,
  featureFlag,
  permission,
  plan,
  tenantConfig,
} from "./reasons.js";

/* -------- Flag specs -------- */

/**
 * Spec describing the *shape* of a feature flag — its kind determines which
 * method the lens exposes for it (`on()`, `is()`, `inRollout()`, …).
 */
export type FlagSpec =
  | { readonly kind: "boolean" }
  | { readonly kind: "killswitch" }
  | { readonly kind: "variant"; readonly choices: readonly string[] }
  | { readonly kind: "percent" }
  | { readonly kind: "date" };

export type FlagMap = Readonly<Record<string, FlagSpec>>;

/* -------- Lens config -------- */

export interface AccessLensConfig<
  TPerm extends readonly string[] = readonly string[],
  TEnt extends readonly string[] = readonly string[],
  TPlan extends readonly string[] = readonly string[],
  TFlags extends FlagMap = FlagMap,
  TTenantCfg extends readonly string[] = readonly string[],
  TSurfaces extends readonly string[] = readonly string[],
> {
  /** Every permission key your app understands. */
  readonly permissions: TPerm;
  /** Every entitlement key your app understands. */
  readonly entitlements: TEnt;
  /** Plans listed from lowest to highest tier (used for `plan.atLeast`). */
  readonly plans: TPlan;
  /** Map of flag key → spec (kind). */
  readonly flags: TFlags;
  /** Optional: typed tenant-config keys (e.g. `"legacy"`, `"compliance_mode"`). */
  readonly tenantConfig?: TTenantCfg;
  /** Optional: typed surface ids that downstream `AccessGate` calls must use. */
  readonly surfaces?: TSurfaces;
}

/* -------- Per-kind flag API -------- */

/** Method surface exposed for a flag, derived from its `kind`. */
export type FlagApi<S extends FlagSpec> = S extends { kind: "boolean" }
  ? {
      /** Pass when the boolean flag is on. */
      on(value: boolean, options?: ReasonOptions): AccessReason;
    }
  : S extends { kind: "killswitch" }
    ? {
        /** Pass when the killswitch is NOT engaged. */
        notEngaged(engaged: boolean, options?: ReasonOptions): AccessReason;
      }
    : S extends { kind: "variant"; choices: readonly (infer C extends string)[] }
      ? {
          /** Pass when the flag resolves to the wanted variant. */
          is(want: C, actual: C, options?: ReasonOptions): AccessReason;
        }
      : S extends { kind: "percent" }
        ? {
            /** Pass when the tenant bucket is inside the rollout %. */
            inRollout(
              threshold: number,
              bucket: number,
              options?: ReasonOptions,
            ): AccessReason;
          }
        : S extends { kind: "date" }
          ? {
              /** Pass when `today >= activeFrom` (ISO strings sort correctly). */
              activeFrom(
                activeFrom: string,
                today: string,
                options?: ReasonOptions,
              ): AccessReason;
            }
          : never;

/* -------- The lens object returned by defineAccessLens -------- */

export interface AccessLens<
  TPerm extends readonly string[],
  TEnt extends readonly string[],
  TPlan extends readonly string[],
  TFlags extends FlagMap,
  TTenantCfg extends readonly string[],
  TSurfaces extends readonly string[],
> {
  /** Build a `permission` reason. `key` autocompletes from `config.permissions`. */
  permission(
    key: TPerm[number],
    passed: boolean,
    options?: ReasonOptions,
  ): AccessReason;

  /** Build an `entitlement` reason. `key` autocompletes from `config.entitlements`. */
  entitlement(
    key: TEnt[number],
    granted: boolean,
    options?: ReasonOptions,
  ): AccessReason;

  /** Plan helpers. `is` checks exact match, `atLeast` compares by declared order. */
  plan: {
    /** Pass when `actual === want`. */
    is(
      want: TPlan[number],
      actual: TPlan[number],
      options?: ReasonOptions,
    ): AccessReason;
    /** Pass when `actual` is at least `min` in declared order. */
    atLeast(
      min: TPlan[number],
      actual: TPlan[number],
      options?: ReasonOptions,
    ): AccessReason;
  };

  /**
   * Per-key flag helpers. Each key exposes only the method matching its
   * declared kind:
   *   `boolean`   → `.on(value)`
   *   `killswitch`→ `.notEngaged(engaged)`
   *   `variant`   → `.is(want, actual)`
   *   `percent`   → `.inRollout(threshold, bucket)`
   *   `date`      → `.activeFrom(activeFrom, today)`
   */
  flag: { [K in keyof TFlags]: FlagApi<TFlags[K]> };

  /** Build a `tenant_config` reason. `key` autocompletes if you declared `tenantConfig`. */
  tenantConfig(
    key: TTenantCfg[number] extends never ? string : TTenantCfg[number],
    passed: boolean,
    options?: ReasonOptions,
  ): AccessReason;

  /** Free-form named condition. */
  condition(
    label: string,
    passed: boolean,
    options?: ReasonOptions,
  ): AccessReason;

  /** Escape hatch for reason types this lens does not model directly. */
  custom(
    key: string,
    passed: boolean,
    options?: ReasonOptions,
  ): AccessReason;

  /**
   * Type guard used by `createReactBindings` to type `AccessGate#id`. If you
   * declared `surfaces`, this resolves to that literal union; otherwise it
   * falls back to `string`.
   */
  readonly surfaces: TSurfaces;

  /** Frozen copy of the config you supplied — useful for introspection. */
  readonly config: AccessLensConfig<
    TPerm,
    TEnt,
    TPlan,
    TFlags,
    TTenantCfg,
    TSurfaces
  >;
}

/* -------- defineAccessLens -------- */

/**
 * Build a typed access-lens from a single configuration object. Every helper
 * the lens exposes is locked to the keys you declared — passing an unknown
 * permission / flag / plan / entitlement is a compile error, and each flag
 * kind has its own kind-specific signature so percent / variant / date / etc.
 * can't be mixed up at the call site.
 *
 * @example
 * ```ts
 * import { defineAccessLens } from "@access-lens/core";
 *
 * export const al = defineAccessLens({
 *   permissions: ["billing.read", "billing.write", "reports.read"] as const,
 *   entitlements: ["billing", "analytics"] as const,
 *   plans: ["free", "basic", "growth", "enterprise"] as const,
 *   flags: {
 *     billing_v2:       { kind: "boolean" },
 *     checkout_version: { kind: "variant", choices: ["v1", "v2"] as const },
 *     new_invoicing:    { kind: "percent" },
 *     q3_features:      { kind: "date" },
 *     risk_killswitch:  { kind: "killswitch" },
 *   },
 *   surfaces: ["sidebar.billing", "tab.reports"] as const,
 * });
 *
 * const reasons = [
 *   al.permission("billing.read", true),
 *   al.flag.billing_v2.on(true),
 *   al.flag.checkout_version.is("v2", "v2"),
 *   al.plan.atLeast("growth", "enterprise"),
 *   al.entitlement("billing", true),
 * ];
 * ```
 */
export function defineAccessLens<
  const TPerm extends readonly string[],
  const TEnt extends readonly string[],
  const TPlan extends readonly string[],
  const TFlags extends FlagMap,
  const TTenantCfg extends readonly string[] = readonly [],
  const TSurfaces extends readonly string[] = readonly [],
>(
  config: AccessLensConfig<
    TPerm,
    TEnt,
    TPlan,
    TFlags,
    TTenantCfg,
    TSurfaces
  >,
): AccessLens<TPerm, TEnt, TPlan, TFlags, TTenantCfg, TSurfaces> {
  const planOrder = config.plans;

  return {
    permission(key, passed, options) {
      return permission(key, passed, {
        source: "user.permissions",
        actual: passed ? "granted" : "missing",
        expected: "granted",
        ...options,
      });
    },

    entitlement(key, granted, options) {
      return entitlement(key, granted, {
        source: "tenant.entitlements",
        actual: granted ? "granted" : "missing",
        expected: "granted",
        ...options,
      });
    },

    plan: {
      is(want, actual, options) {
        const passed = want === actual;
        return plan(`is:${want}`, passed, {
          label: `Plan = ${want}`,
          actual,
          expected: want,
          source: "tenant.plan",
          message: passed
            ? undefined
            : `Plan is "${actual}", needs "${want}"`,
          ...options,
        });
      },
      atLeast(min, actual, options) {
        const minIdx = planOrder.indexOf(min);
        const actualIdx = planOrder.indexOf(actual);
        const passed = actualIdx >= minIdx && minIdx !== -1;
        return plan(`atLeast:${min}`, passed, {
          label: `Requires ${min}+`,
          actual,
          expected: `>= ${min}`,
          source: "tenant.plan",
          message: passed
            ? undefined
            : `Plan is "${actual}", needs ${min}+`,
          ...options,
        });
      },
    },

    flag: buildFlagApi(config.flags) as {
      [K in keyof TFlags]: FlagApi<TFlags[K]>;
    },

    tenantConfig(key, passed, options) {
      return tenantConfig(key as string, passed, {
        source: "tenant.config",
        ...options,
      });
    },

    condition(label, passed, options) {
      return condition(label, passed, options);
    },

    custom(key, passed, options) {
      return customReason(key, passed, options);
    },

    surfaces: config.surfaces ?? ([] as unknown as TSurfaces),
    config,
  };
}

/* -------- buildFlagApi: runtime side of the typed flag accessors -------- */

interface BooleanFlagApi {
  on(value: boolean, options?: ReasonOptions): AccessReason;
}
interface KillswitchFlagApi {
  notEngaged(engaged: boolean, options?: ReasonOptions): AccessReason;
}
interface VariantFlagApi {
  is(want: string, actual: string, options?: ReasonOptions): AccessReason;
}
interface PercentFlagApi {
  inRollout(
    threshold: number,
    bucket: number,
    options?: ReasonOptions,
  ): AccessReason;
}
interface DateFlagApi {
  activeFrom(
    activeFrom: string,
    today: string,
    options?: ReasonOptions,
  ): AccessReason;
}

type AnyFlagApi =
  | BooleanFlagApi
  | KillswitchFlagApi
  | VariantFlagApi
  | PercentFlagApi
  | DateFlagApi;

function buildFlagApi(
  flags: FlagMap,
): Record<string, AnyFlagApi> {
  const out: Record<string, AnyFlagApi> = {};
  for (const key of Object.keys(flags)) {
    const spec = flags[key]!;
    switch (spec.kind) {
      case "boolean":
        out[key] = {
          on: (value, options) =>
            featureFlag(key, value, {
              source: "feature-flags",
              actual: value ? "on" : "off",
              expected: "on",
              message: value
                ? undefined
                : `Flag "${key}" is off`,
              ...options,
            }),
        } satisfies BooleanFlagApi;
        break;
      case "killswitch":
        out[key] = {
          notEngaged: (engaged, options) =>
            featureFlag(key, !engaged, {
              source: "feature-flags",
              label: `${key} (killswitch)`,
              actual: engaged ? "engaged" : "off",
              expected: "off",
              message: engaged
                ? `Killswitch "${key}" is engaged — feature disabled`
                : undefined,
              ...options,
            }),
        } satisfies KillswitchFlagApi;
        break;
      case "variant":
        out[key] = {
          is: (want, actual, options) => {
            const passed = want === actual;
            return featureFlag(key, passed, {
              source: "feature-flags",
              label: `${key} = ${want}`,
              actual,
              expected: want,
              message: passed
                ? undefined
                : `Variant flag "${key}" is "${actual}", gate wants "${want}"`,
              ...options,
            });
          },
        } satisfies VariantFlagApi;
        break;
      case "percent":
        out[key] = {
          inRollout: (threshold, bucket, options) => {
            const passed = bucket < threshold;
            return featureFlag(key, passed, {
              source: "feature-flags",
              label: `${key} (rollout ${threshold}%)`,
              actual: `bucket ${bucket}`,
              expected: `< ${threshold}`,
              message: passed
                ? undefined
                : `Bucket ${bucket} is outside the ${threshold}% rollout`,
              ...options,
            });
          },
        } satisfies PercentFlagApi;
        break;
      case "date":
        out[key] = {
          activeFrom: (activeFrom, today, options) => {
            const passed = today >= activeFrom;
            return featureFlag(key, passed, {
              source: "feature-flags",
              label: `${key} (from ${activeFrom})`,
              actual: today,
              expected: `>= ${activeFrom}`,
              message: passed
                ? undefined
                : `"${key}" activates on ${activeFrom}; today is ${today}`,
              ...options,
            });
          },
        } satisfies DateFlagApi;
        break;
    }
  }
  return out;
}

/* -------- Surface id extractor -------- */

/**
 * Pull the literal surface union out of a configured lens — useful when
 * narrowing `AccessGate#id` in app code.
 *
 * @example
 * ```ts
 * type SurfaceId = SurfaceIdOf<typeof al>;  // "sidebar.billing" | "tab.reports" | …
 * ```
 */
export type SurfaceIdOf<L> = L extends {
  readonly surfaces: readonly (infer S extends string)[];
}
  ? S
  : string;
