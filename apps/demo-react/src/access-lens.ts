import { defineAccessLens, type SurfaceIdOf } from "@access-lens/core";
import { createReactBindings } from "@access-lens/react";

/**
 * The single source of truth for everything the access lens knows about.
 * Keys declared here become string literal unions that autocomplete across
 * every call site (`al.permission("billing.read", …)` etc.). Adding a
 * permission / flag / plan / entitlement here is the *only* place you need
 * to declare it.
 */
export const al = defineAccessLens({
  permissions: [
    "billing.read",
    "billing.write",
    "billing.export",
    "billing.delete",
    "payouts.read",
    "payouts.write",
    "payouts.export",
    "payouts.delete",
    "invoices.read",
    "invoices.write",
    "invoices.export",
    "invoices.delete",
    "subscriptions.read",
    "subscriptions.write",
    "subscriptions.export",
    "subscriptions.delete",
    "refunds.read",
    "refunds.write",
    "refunds.export",
    "refunds.delete",
    "disputes.read",
    "disputes.write",
    "disputes.export",
    "disputes.delete",
    "reports.read",
    "reports.write",
    "reports.export",
    "reports.delete",
    "analytics.read",
    "analytics.write",
    "analytics.export",
    "analytics.delete",
    "risk.read",
    "risk.write",
    "risk.export",
    "risk.delete",
    "compliance.read",
    "compliance.write",
    "compliance.export",
    "compliance.delete",
    "customers.read",
    "customers.write",
    "customers.export",
    "customers.delete",
    "products.read",
    "products.write",
    "products.export",
    "products.delete",
    "orders.read",
    "orders.write",
    "orders.export",
    "orders.delete",
    "inventory.read",
    "inventory.write",
    "inventory.export",
    "inventory.delete",
    "integrations.read",
    "integrations.write",
    "integrations.export",
    "integrations.delete",
    "admin.access",
    "audit.read",
    "audit.export",
    "experiments.read",
    "experiments.write",
  ] as const,

  entitlements: [
    "billing",
    "payouts",
    "invoices",
    "reports",
    "risk",
    "analytics",
    "compliance",
    "integrations",
    "experiments",
    "ai_assist",
  ] as const,

  plans: ["free", "basic", "growth", "enterprise"] as const,

  flags: {
    // boolean
    billing_v2: { kind: "boolean" },
    payouts_v2: { kind: "boolean" },
    advanced_reports: { kind: "boolean" },
    risk_settings: { kind: "boolean" },
    eu_data_residency: { kind: "boolean" },
    legacy_compat: { kind: "boolean" },
    inventory_v2: { kind: "boolean" },
    marketing_campaigns: { kind: "boolean" },
    audit_log_v2: { kind: "boolean" },
    // variant
    checkout_version: { kind: "variant", choices: ["v1", "v2", "v3"] as const },
    search_engine: {
      kind: "variant",
      choices: ["legacy", "elastic", "vector"] as const,
    },
    dashboard_layout: {
      kind: "variant",
      choices: ["compact", "comfortable", "spacious"] as const,
    },
    pricing_engine: { kind: "variant", choices: ["v1", "v2"] as const },
    // percent
    new_invoicing: { kind: "percent" },
    beta_inventory: { kind: "percent" },
    smart_refunds: { kind: "percent" },
    bulk_disputes: { kind: "percent" },
    // date
    q3_features: { kind: "date" },
    black_friday_tools: { kind: "date" },
    ga_release_2026: { kind: "date" },
    // killswitch
    risk_killswitch: { kind: "killswitch" },
    payouts_killswitch: { kind: "killswitch" },
    ai_assist_killswitch: { kind: "killswitch" },
  },

  tenantConfig: ["legacy", "cohort", "region"] as const,
});

/** Surface id literal union derived from `al`. */
export type SurfaceId = SurfaceIdOf<typeof al>;

/** Permission keys this app understands. */
export type PermissionKey = (typeof al.config.permissions)[number];

/** Entitlement keys this app understands. */
export type EntitlementKey = (typeof al.config.entitlements)[number];

/** Plan keys, in ascending order. */
export type PlanKey = (typeof al.config.plans)[number];

/** Flag keys (all kinds). */
export type FlagKey = keyof typeof al.config.flags;

/**
 * Pre-bound React adapter. Use these instead of the raw `@access-lens/react`
 * exports — the runtime is identical but `id` autocompletes from `surfaces`.
 */
export const {
  AccessLensProvider,
  AccessGate,
  useAccessGate,
  useAccessLensSnapshot,
  useAccessLens,
} = createReactBindings(al);
