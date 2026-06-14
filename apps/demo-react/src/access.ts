import {
  condition,
  featureFlag,
  tenantConfig,
  type AccessReason,
} from "@access-lens/react";
import { al, type FlagKey, type PermissionKey } from "./access-lens.js";
import {
  TODAY,
  type FlagDef,
  type FlagsState,
  type Tenant,
  type User,
} from "./data.js";

export interface AccessContext {
  tenant: Tenant;
  user: User;
  flags: FlagsState;
}

/** Does the user hold this permission? (typed key) */
export function hasPermission(user: User, key: PermissionKey): boolean {
  return user.permissions.includes(key);
}

/** Typed wrappers — these are the "smart" reason recipes consumers see. */
export function permissionReason(
  user: User,
  key: PermissionKey,
): AccessReason {
  return al.permission(key, hasPermission(user, key), {
    message: hasPermission(user, key)
      ? undefined
      : `User role lacks ${key}`,
  });
}

export function entitlementReason(
  tenant: Tenant,
  key: keyof Tenant["entitlements"] & string,
): AccessReason {
  const has = tenant.entitlements[key] ?? false;
  return al.entitlement(key as never, has, {
    message: has
      ? undefined
      : `Tenant ${tenant.name} is not entitled to "${key}"`,
  });
}

export function planAtLeastReason(
  tenant: Tenant,
  min: (typeof al.config.plans)[number],
): AccessReason {
  return al.plan.atLeast(min, tenant.plan, {
    message:
      al.plan.atLeast(min, tenant.plan).passed
        ? undefined
        : `Tenant is on "${tenant.plan}", feature requires ${min}+`,
  });
}

/* -------- Flag reason (dynamic dispatch over runtime state) -------- */

/**
 * Generic flag reason — translates any runtime `FlagDef` into a feature_flag
 * `AccessReason`. The typed lens (`al.flag.<key>.<method>`) is the preferred
 * call site for hand-written gates; this helper exists because the catalog
 * iterates over flag keys dynamically and TypeScript can't narrow per-key.
 */
export interface FeatureFlagReasonOptions {
  variant?: string;
  source?: string;
  label?: string;
}
export function featureFlagReason(
  ctx: AccessContext,
  key: FlagKey,
  opts: FeatureFlagReasonOptions = {},
): AccessReason {
  const def: FlagDef | undefined = ctx.flags[key];
  const source = opts.source ?? "feature-flags";
  if (!def) {
    return featureFlag(key, false, {
      source: "flags-registry",
      message: `Flag "${key}" is not defined`,
    });
  }
  switch (def.kind) {
    case "boolean":
      return featureFlag(key, def.on, {
        label: opts.label ?? key,
        actual: def.on ? "on" : "off",
        expected: "on",
        source,
        message: def.on
          ? undefined
          : `Feature flag "${key}" is off for this environment`,
      });
    case "variant": {
      const want = opts.variant ?? def.choices[def.choices.length - 1]!;
      const passed = def.value === want;
      return featureFlag(key, passed, {
        label: opts.label ?? `${key} = ${want}`,
        actual: def.value,
        expected: want,
        source,
        message: passed
          ? undefined
          : `Variant flag "${key}" is on "${def.value}", this gate wants "${want}"`,
      });
    }
    case "percent": {
      const passed = ctx.tenant.bucketPercent < def.rollout;
      return featureFlag(key, passed, {
        label: opts.label ?? `${key} (rollout ${def.rollout}%)`,
        actual: `bucket ${ctx.tenant.bucketPercent}`,
        expected: `< ${def.rollout}`,
        source,
        message: passed
          ? undefined
          : `Tenant ${ctx.tenant.name} is outside the ${def.rollout}% rollout (bucket ${ctx.tenant.bucketPercent})`,
      });
    }
    case "date": {
      const passed = TODAY >= def.activeFrom;
      return featureFlag(key, passed, {
        label: opts.label ?? `${key} (from ${def.activeFrom})`,
        actual: TODAY,
        expected: `>= ${def.activeFrom}`,
        source,
        message: passed
          ? undefined
          : `Feature "${key}" activates on ${def.activeFrom}; today is ${TODAY}`,
      });
    }
    case "killswitch": {
      const passed = !def.engaged;
      return featureFlag(key, passed, {
        label: opts.label ?? `${key} (killswitch)`,
        actual: def.engaged ? "engaged" : "off",
        expected: "off",
        source,
        message: passed
          ? undefined
          : `Killswitch "${key}" is engaged — feature force-disabled`,
      });
    }
  }
}

/* -------- Reason recipes for the "main" demo page -------- */

export function billingSidebarReasons(ctx: AccessContext): AccessReason[] {
  const def = ctx.flags["billing_v2"];
  return [
    permissionReason(ctx.user, "billing.read"),
    al.flag.billing_v2.on(def?.kind === "boolean" ? def.on : false),
    al.entitlement("billing", ctx.tenant.entitlements.billing ?? false),
  ];
}

export function payoutsSidebarReasons(ctx: AccessContext): AccessReason[] {
  const v2 = ctx.flags["payouts_v2"];
  const ks = ctx.flags["payouts_killswitch"];
  return [
    permissionReason(ctx.user, "payouts.read"),
    al.flag.payouts_v2.on(v2?.kind === "boolean" ? v2.on : false),
    al.flag.payouts_killswitch.notEngaged(
      ks?.kind === "killswitch" ? ks.engaged : true,
    ),
    al.entitlement("payouts", ctx.tenant.entitlements.payouts ?? false),
  ];
}

export function riskSidebarReasons(ctx: AccessContext): AccessReason[] {
  const ks = ctx.flags["risk_killswitch"];
  return [
    permissionReason(ctx.user, "risk.write"),
    al.plan.atLeast("enterprise", ctx.tenant.plan),
    al.flag.risk_killswitch.notEngaged(
      ks?.kind === "killswitch" ? ks.engaged : true,
    ),
  ];
}

export function reportsTabReasons(ctx: AccessContext): AccessReason[] {
  return [permissionReason(ctx.user, "reports.read")];
}

export function advancedReportsTabReasons(
  ctx: AccessContext,
): AccessReason[] {
  const ar = ctx.flags["advanced_reports"];
  const q3 = ctx.flags["q3_features"];
  return [
    al.flag.advanced_reports.on(ar?.kind === "boolean" ? ar.on : false),
    al.plan.atLeast("enterprise", ctx.tenant.plan),
    al.flag.q3_features.activeFrom(
      q3?.kind === "date" ? q3.activeFrom : "9999-12-31",
      TODAY,
    ),
  ];
}

export function legacyTabReasons(ctx: AccessContext): AccessReason[] {
  return [
    tenantConfig("legacy", ctx.tenant.legacy, {
      label: "Tenant is legacy",
      actual: ctx.tenant.legacy,
      expected: true,
      source: "tenant.legacy",
      message: ctx.tenant.legacy
        ? undefined
        : `Tenant ${ctx.tenant.name} is not flagged as legacy`,
    }),
  ];
}

export function exportButtonReasons(ctx: AccessContext): AccessReason[] {
  const bd = ctx.flags["bulk_disputes"];
  return [
    permissionReason(ctx.user, "reports.export"),
    al.flag.bulk_disputes.inRollout(
      bd?.kind === "percent" ? bd.rollout : 0,
      ctx.tenant.bucketPercent,
      { label: "in bulk-export rollout" },
    ),
  ];
}

export function editRiskButtonReasons(ctx: AccessContext): AccessReason[] {
  const rs = ctx.flags["risk_settings"];
  const pe = ctx.flags["pricing_engine"];
  return [
    permissionReason(ctx.user, "risk.write"),
    al.flag.risk_settings.on(rs?.kind === "boolean" ? rs.on : false),
    al.flag.pricing_engine.is(
      "v2",
      pe?.kind === "variant" ? (pe.value as "v1" | "v2") : "v1",
    ),
    condition(
      "Tenant is not flagged legacy",
      !ctx.tenant.legacy,
      {
        source: "tenant.legacy",
        actual: ctx.tenant.legacy,
        expected: false,
        message: ctx.tenant.legacy
          ? `Tenant ${ctx.tenant.name} is legacy — risk editing is locked`
          : undefined,
      },
    ),
  ];
}

/* -------- Variant routing -------- */

export interface OverviewCandidate {
  id: string;
  label: string;
  reasons: AccessReason[];
  metadata: {
    screen: "beta_analytics" | "standard" | "simple";
    priority: number;
  };
}

export function overviewCandidates(ctx: AccessContext): OverviewCandidate[] {
  const cohortIs = (target: string) =>
    condition(`cohort = ${target}`, ctx.tenant.cohort === target, {
      source: "tenant.cohort",
      actual: ctx.tenant.cohort,
      expected: target,
      message:
        ctx.tenant.cohort === target
          ? undefined
          : `Cohort is "${ctx.tenant.cohort}", route requires "${target}"`,
    });
  const cohortIn = (targets: string[]) =>
    condition(
      `cohort in {${targets.join(",")}}`,
      targets.includes(ctx.tenant.cohort),
      {
        source: "tenant.cohort",
        actual: ctx.tenant.cohort,
        expected: targets.join("|"),
        message: targets.includes(ctx.tenant.cohort)
          ? undefined
          : `Cohort "${ctx.tenant.cohort}" not in [${targets.join(", ")}]`,
      },
    );

  const ar = ctx.flags["advanced_reports"];
  return [
    {
      id: "route.home.overview.beta_analytics",
      label: "Overview · Beta analytics",
      reasons: [
        permissionReason(ctx.user, "reports.read"),
        cohortIs("beta"),
        al.flag.advanced_reports.on(ar?.kind === "boolean" ? ar.on : false),
      ],
      metadata: { screen: "beta_analytics", priority: 1 },
    },
    {
      id: "route.home.overview.standard",
      label: "Overview · Standard",
      reasons: [
        permissionReason(ctx.user, "reports.read"),
        cohortIn(["ga", "beta"]),
      ],
      metadata: { screen: "standard", priority: 2 },
    },
    {
      id: "route.home.overview.simple",
      label: "Overview · Simple",
      reasons: [permissionReason(ctx.user, "reports.read")],
      metadata: { screen: "simple", priority: 3 },
    },
  ];
}
