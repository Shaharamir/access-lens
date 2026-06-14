export type Plan = "free" | "basic" | "growth" | "enterprise";

export type Region = "us" | "eu" | "apac";

export interface Tenant {
  id: string;
  name: string;
  plan: Plan;
  legacy: boolean;
  region: Region;
  /** 0-99: deterministic bucket used for percentage rollouts. */
  bucketPercent: number;
  cohort: "control" | "beta" | "ga";
  entitlements: Record<string, boolean>;
}

export type Role = "admin" | "manager" | "viewer" | "support";

export interface User {
  id: string;
  name: string;
  role: Role;
  permissions: string[];
}

/**
 * Flag variants we want to demo. The reason helpers translate every kind
 * into a single `feature_flag` AccessReason but with rich expected/actual,
 * so the overlay + ExplainedGate can render specifics.
 */
export type FlagDef =
  | { kind: "boolean"; on: boolean }
  | { kind: "variant"; value: string; choices: string[] }
  | { kind: "percent"; rollout: number }
  | { kind: "date"; activeFrom: string }
  | { kind: "killswitch"; engaged: boolean };

export type FlagsState = Record<string, FlagDef>;

const PLAN_ORDER: Plan[] = ["free", "basic", "growth", "enterprise"];

export function planAtLeast(actual: Plan, min: Plan): boolean {
  return PLAN_ORDER.indexOf(actual) >= PLAN_ORDER.indexOf(min);
}

export const TENANTS: Tenant[] = [
  {
    id: "acme",
    name: "Acme Marketplace",
    plan: "enterprise",
    legacy: false,
    region: "us",
    bucketPercent: 14,
    cohort: "beta",
    entitlements: {
      billing: true,
      payouts: true,
      invoices: true,
      reports: true,
      risk: true,
      analytics: true,
      compliance: true,
      integrations: true,
      experiments: true,
      ai_assist: true,
    },
  },
  {
    id: "globex",
    name: "Globex Retail",
    plan: "growth",
    legacy: false,
    region: "eu",
    bucketPercent: 47,
    cohort: "ga",
    entitlements: {
      billing: true,
      payouts: true,
      invoices: true,
      reports: true,
      risk: false,
      analytics: true,
      compliance: true,
      integrations: false,
      experiments: false,
      ai_assist: false,
    },
  },
  {
    id: "small-shop",
    name: "Small Shop",
    plan: "basic",
    legacy: true,
    region: "us",
    bucketPercent: 83,
    cohort: "control",
    entitlements: {
      billing: false,
      payouts: false,
      invoices: true,
      reports: true,
      risk: false,
      analytics: false,
      compliance: false,
      integrations: false,
      experiments: false,
      ai_assist: false,
    },
  },
  {
    id: "nile-apac",
    name: "Nile APAC",
    plan: "growth",
    legacy: false,
    region: "apac",
    bucketPercent: 62,
    cohort: "beta",
    entitlements: {
      billing: true,
      payouts: false,
      invoices: true,
      reports: true,
      risk: true,
      analytics: true,
      compliance: false,
      integrations: true,
      experiments: true,
      ai_assist: false,
    },
  },
  {
    id: "indie-dev",
    name: "Indie Dev (Free)",
    plan: "free",
    legacy: false,
    region: "us",
    bucketPercent: 35,
    cohort: "control",
    entitlements: {
      billing: false,
      payouts: false,
      invoices: false,
      reports: false,
      risk: false,
      analytics: false,
      compliance: false,
      integrations: false,
      experiments: false,
      ai_assist: false,
    },
  },
];

const COMMON_READ = [
  "billing.read",
  "payouts.read",
  "invoices.read",
  "subscriptions.read",
  "refunds.read",
  "disputes.read",
  "reports.read",
  "analytics.read",
  "risk.read",
  "compliance.read",
  "customers.read",
  "products.read",
  "orders.read",
  "inventory.read",
  "integrations.read",
];

const ALL_WRITE = COMMON_READ.map((p) => p.replace(".read", ".write"));
const ALL_EXPORT = COMMON_READ.map((p) => p.replace(".read", ".export"));
const ALL_DELETE = COMMON_READ.map((p) => p.replace(".read", ".delete"));

export const USERS: User[] = [
  {
    id: "u-admin",
    name: "Admin",
    role: "admin",
    permissions: [
      ...COMMON_READ,
      ...ALL_WRITE,
      ...ALL_EXPORT,
      ...ALL_DELETE,
      "admin.access",
      "audit.read",
      "audit.export",
      "experiments.write",
      "experiments.read",
    ],
  },
  {
    id: "u-manager",
    name: "Manager",
    role: "manager",
    permissions: [
      ...COMMON_READ,
      ...ALL_WRITE.filter((p) => !p.startsWith("risk")),
      "billing.export",
      "reports.export",
      "analytics.export",
      "experiments.read",
    ],
  },
  {
    id: "u-viewer",
    name: "Viewer",
    role: "viewer",
    permissions: [
      "reports.read",
      "analytics.read",
      "invoices.read",
      "customers.read",
      "products.read",
      "orders.read",
    ],
  },
  {
    id: "u-support",
    name: "Support",
    role: "support",
    permissions: [
      "customers.read",
      "orders.read",
      "invoices.read",
      "refunds.read",
      "refunds.write",
      "disputes.read",
      "audit.read",
    ],
  },
];

export const DEFAULT_FLAGS: FlagsState = {
  // boolean flags — classic on/off
  billing_v2: { kind: "boolean", on: true },
  payouts_v2: { kind: "boolean", on: false },
  advanced_reports: { kind: "boolean", on: true },
  risk_settings: { kind: "boolean", on: false },
  eu_data_residency: { kind: "boolean", on: true },
  legacy_compat: { kind: "boolean", on: true },
  inventory_v2: { kind: "boolean", on: false },
  marketing_campaigns: { kind: "boolean", on: false },
  audit_log_v2: { kind: "boolean", on: true },

  // variant flags — A/B/C versions of a feature
  checkout_version: {
    kind: "variant",
    value: "v2",
    choices: ["v1", "v2", "v3"],
  },
  search_engine: {
    kind: "variant",
    value: "elastic",
    choices: ["legacy", "elastic", "vector"],
  },
  dashboard_layout: {
    kind: "variant",
    value: "comfortable",
    choices: ["compact", "comfortable", "spacious"],
  },
  pricing_engine: {
    kind: "variant",
    value: "v1",
    choices: ["v1", "v2"],
  },

  // percentage rollouts — gated on tenant.bucketPercent
  new_invoicing: { kind: "percent", rollout: 25 },
  beta_inventory: { kind: "percent", rollout: 60 },
  smart_refunds: { kind: "percent", rollout: 10 },
  bulk_disputes: { kind: "percent", rollout: 80 },

  // date-windowed
  q3_features: { kind: "date", activeFrom: "2026-07-01" },
  black_friday_tools: { kind: "date", activeFrom: "2026-11-01" },
  ga_release_2026: { kind: "date", activeFrom: "2026-01-01" },

  // killswitches — default true, can be engaged to disable a feature
  risk_killswitch: { kind: "killswitch", engaged: false },
  payouts_killswitch: { kind: "killswitch", engaged: false },
  ai_assist_killswitch: { kind: "killswitch", engaged: true },
};

export const FLAG_GROUPS: { label: string; keys: string[] }[] = [
  {
    label: "Boolean",
    keys: [
      "billing_v2",
      "payouts_v2",
      "advanced_reports",
      "risk_settings",
      "eu_data_residency",
      "legacy_compat",
      "inventory_v2",
      "marketing_campaigns",
      "audit_log_v2",
    ],
  },
  {
    label: "Variant (A/B/C)",
    keys: [
      "checkout_version",
      "search_engine",
      "dashboard_layout",
      "pricing_engine",
    ],
  },
  {
    label: "Rollout %",
    keys: ["new_invoicing", "beta_inventory", "smart_refunds", "bulk_disputes"],
  },
  {
    label: "Date-windowed",
    keys: ["q3_features", "black_friday_tools", "ga_release_2026"],
  },
  {
    label: "Killswitch",
    keys: ["risk_killswitch", "payouts_killswitch", "ai_assist_killswitch"],
  },
];

/** Friendly today date for date-window evaluation. */
export const TODAY = "2026-06-14";
