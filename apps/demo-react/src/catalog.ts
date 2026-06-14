import {
  condition,
  tenantConfig,
  type AccessNodeType,
  type AccessReason,
} from "@access-lens/react";
import {
  advancedReportsTabReasons,
  billingSidebarReasons,
  editRiskButtonReasons,
  entitlementReason,
  exportButtonReasons,
  featureFlagReason,
  legacyTabReasons,
  overviewCandidates,
  payoutsSidebarReasons,
  permissionReason,
  planAtLeastReason,
  reportsTabReasons,
  riskSidebarReasons,
  type AccessContext,
} from "./access.js";
import type { FlagKey, PermissionKey } from "./access-lens.js";
import type { Plan, Region } from "./data.js";

export interface CatalogEntry {
  id: string;
  label: string;
  type: AccessNodeType;
  group: string;
  module: string;
  reasons: AccessReason[];
}

interface FlagRef {
  key: string;
  variant?: string;
  label?: string;
}

interface ModuleSpec {
  key: string;
  label: string;
  group: string;
  flag?: FlagRef;
  flagSecondary?: FlagRef;
  entitlement?: string;
  planMin?: Plan;
  region?: Region[];
  cohort?: ("control" | "beta" | "ga")[];
  notLegacy?: boolean;
  advanced?: boolean;
  advancedFlag?: FlagRef;
  advancedPlanMin?: Plan;
}

const MODULES: ModuleSpec[] = [
  {
    key: "billing",
    label: "Billing",
    group: "Finance",
    flag: { key: "billing_v2" },
    entitlement: "billing",
    advanced: true,
    advancedFlag: { key: "advanced_reports" },
  },
  {
    key: "payouts",
    label: "Payouts",
    group: "Finance",
    flag: { key: "payouts_v2" },
    flagSecondary: { key: "payouts_killswitch", label: "payouts not killed" },
    entitlement: "payouts",
    advanced: true,
    advancedFlag: { key: "ai_assist_killswitch", label: "ai assist not killed" },
  },
  {
    key: "invoices",
    label: "Invoices",
    group: "Finance",
    flag: { key: "new_invoicing" },
  },
  {
    key: "subscriptions",
    label: "Subscriptions",
    group: "Finance",
    planMin: "growth",
  },
  {
    key: "refunds",
    label: "Refunds",
    group: "Support",
    flag: { key: "smart_refunds" },
  },
  {
    key: "disputes",
    label: "Disputes",
    group: "Support",
    flag: { key: "bulk_disputes" },
    advanced: true,
    advancedFlag: { key: "audit_log_v2" },
  },
  {
    key: "reports",
    label: "Reports",
    group: "Analytics",
  },
  {
    key: "analytics",
    label: "Analytics",
    group: "Analytics",
    entitlement: "analytics",
    planMin: "growth",
    advanced: true,
    advancedFlag: { key: "q3_features" },
    advancedPlanMin: "enterprise",
  },
  {
    key: "risk",
    label: "Risk",
    group: "Compliance",
    planMin: "enterprise",
    flag: { key: "risk_killswitch", label: "risk not killed" },
    notLegacy: true,
    advanced: true,
    advancedFlag: { key: "audit_log_v2" },
  },
  {
    key: "compliance",
    label: "Compliance",
    group: "Compliance",
    entitlement: "compliance",
    region: ["eu"],
    flag: { key: "eu_data_residency" },
  },
  {
    key: "customers",
    label: "Customers",
    group: "CRM",
    flag: { key: "search_engine", variant: "vector" },
    advanced: true,
    advancedFlag: { key: "ai_assist_killswitch", label: "ai assist not killed" },
  },
  {
    key: "products",
    label: "Products",
    group: "Catalog",
    flag: { key: "pricing_engine", variant: "v2" },
  },
  {
    key: "orders",
    label: "Orders",
    group: "Ops",
    flag: { key: "checkout_version", variant: "v2" },
    advanced: true,
    advancedFlag: { key: "black_friday_tools" },
  },
  {
    key: "inventory",
    label: "Inventory",
    group: "Ops",
    flag: { key: "beta_inventory" },
  },
  {
    key: "integrations",
    label: "Integrations",
    group: "Dev",
    entitlement: "integrations",
    flag: { key: "ga_release_2026" },
    advanced: true,
    advancedFlag: { key: "marketing_campaigns" },
  },
];

const TABS: Array<{ slug: string; label: string; permSuffix: string }> = [
  { slug: "overview", label: "Overview", permSuffix: "read" },
  { slug: "list", label: "List", permSuffix: "read" },
  { slug: "settings", label: "Settings", permSuffix: "write" },
];

const BUTTONS: Array<{ slug: string; label: string; permSuffix: string }> = [
  { slug: "create", label: "Create", permSuffix: "write" },
  { slug: "edit", label: "Edit", permSuffix: "write" },
  { slug: "export", label: "Export", permSuffix: "export" },
];

function moduleBaseReasons(
  m: ModuleSpec,
  ctx: AccessContext,
  permissionKey: string,
): AccessReason[] {
  const reasons: AccessReason[] = [
    permissionReason(ctx.user, permissionKey as PermissionKey),
  ];
  if (m.entitlement) {
    reasons.push(entitlementReason(ctx.tenant, m.entitlement));
  }
  if (m.planMin) {
    reasons.push(planAtLeastReason(ctx.tenant, m.planMin));
  }
  if (m.flag) {
    const opts: {
      variant?: string;
      label?: string;
    } = {};
    if (m.flag.variant !== undefined) opts.variant = m.flag.variant;
    if (m.flag.label !== undefined) opts.label = m.flag.label;
    reasons.push(featureFlagReason(ctx, m.flag.key as FlagKey, opts));
  }
  if (m.flagSecondary) {
    const opts: { variant?: string; label?: string } = {};
    if (m.flagSecondary.variant !== undefined)
      opts.variant = m.flagSecondary.variant;
    if (m.flagSecondary.label !== undefined)
      opts.label = m.flagSecondary.label;
    reasons.push(featureFlagReason(ctx, m.flagSecondary.key as FlagKey, opts));
  }
  if (m.region) {
    const passed = m.region.includes(ctx.tenant.region);
    reasons.push(
      condition(`region in ${m.region.join("|")}`, passed, {
        source: "tenant.region",
        actual: ctx.tenant.region,
        expected: m.region.join("|"),
        message: passed
          ? undefined
          : `Tenant region "${ctx.tenant.region}" not in [${m.region.join(", ")}]`,
      }),
    );
  }
  if (m.cohort) {
    const passed = m.cohort.includes(ctx.tenant.cohort);
    reasons.push(
      condition(`cohort in ${m.cohort.join("|")}`, passed, {
        source: "tenant.cohort",
        actual: ctx.tenant.cohort,
        expected: m.cohort.join("|"),
        message: passed
          ? undefined
          : `Tenant cohort "${ctx.tenant.cohort}" not in [${m.cohort.join(", ")}]`,
      }),
    );
  }
  if (m.notLegacy) {
    const passed = !ctx.tenant.legacy;
    reasons.push(
      tenantConfig("legacy", passed, {
        label: "Tenant is not legacy",
        actual: ctx.tenant.legacy,
        expected: false,
        source: "tenant.legacy",
        message: passed
          ? undefined
          : `Tenant ${ctx.tenant.name} is legacy — module hidden`,
      }),
    );
  }
  return reasons;
}

export function buildCatalog(ctx: AccessContext): CatalogEntry[] {
  const out: CatalogEntry[] = [];
  for (const m of MODULES) {
    out.push({
      id: `cat.${m.key}.sidebar`,
      label: m.label,
      type: "sidebar_item",
      group: m.group,
      module: m.key,
      reasons: moduleBaseReasons(m, ctx, `${m.key}.read`),
    });
    for (const t of TABS) {
      out.push({
        id: `cat.${m.key}.tab.${t.slug}`,
        label: `${m.label} · ${t.label}`,
        type: "tab",
        group: m.group,
        module: m.key,
        reasons: moduleBaseReasons(m, ctx, `${m.key}.${t.permSuffix}`),
      });
    }
    for (const b of BUTTONS) {
      out.push({
        id: `cat.${m.key}.button.${b.slug}`,
        label: `${m.label} · ${b.label}`,
        type: "button",
        group: m.group,
        module: m.key,
        reasons: moduleBaseReasons(m, ctx, `${m.key}.${b.permSuffix}`),
      });
    }
    if (m.advanced) {
      const reasons = moduleBaseReasons(m, ctx, `${m.key}.write`);
      if (m.advancedFlag) {
        const opts: { variant?: string; label?: string } = {};
        if (m.advancedFlag.variant !== undefined)
          opts.variant = m.advancedFlag.variant;
        if (m.advancedFlag.label !== undefined)
          opts.label = m.advancedFlag.label;
        reasons.push(featureFlagReason(ctx, m.advancedFlag.key as FlagKey, opts));
      }
      if (m.advancedPlanMin) {
        reasons.push(planAtLeastReason(ctx.tenant, m.advancedPlanMin));
      }
      out.push({
        id: `cat.${m.key}.section.advanced`,
        label: `${m.label} · Advanced`,
        type: "section",
        group: m.group,
        module: m.key,
        reasons,
      });
    }
  }
  return out;
}

export function catalogGroups(): string[] {
  const seen = new Set<string>();
  const groups: string[] = [];
  for (const m of MODULES) {
    if (!seen.has(m.group)) {
      seen.add(m.group);
      groups.push(m.group);
    }
  }
  return groups;
}

/**
 * Every gated surface across the demo: catalog entries + the main-page
 * sidebar / tabs / buttons / action-picker / overview-route surfaces.
 * Used by ExplainedGate's hover-card matrix to evaluate the same surface
 * against every (tenant, user) combo.
 */
export function buildAllSurfaces(ctx: AccessContext): CatalogEntry[] {
  const out: CatalogEntry[] = [...buildCatalog(ctx)];

  // Main demo sidebar
  out.push({
    id: "sidebar.billing",
    label: "Billing",
    type: "sidebar_item",
    group: "Sidebar",
    module: "main",
    reasons: billingSidebarReasons(ctx),
  });
  out.push({
    id: "sidebar.payouts",
    label: "Payouts",
    type: "sidebar_item",
    group: "Sidebar",
    module: "main",
    reasons: payoutsSidebarReasons(ctx),
  });
  out.push({
    id: "sidebar.risk",
    label: "Risk Settings",
    type: "sidebar_item",
    group: "Sidebar",
    module: "main",
    reasons: riskSidebarReasons(ctx),
  });

  // Main demo tabs
  out.push({
    id: "tab.reports",
    label: "Reports",
    type: "tab",
    group: "Tabs",
    module: "main",
    reasons: reportsTabReasons(ctx),
  });
  out.push({
    id: "tab.advanced_reports",
    label: "Advanced Reports",
    type: "tab",
    group: "Tabs",
    module: "main",
    reasons: advancedReportsTabReasons(ctx),
  });
  out.push({
    id: "tab.legacy_mode",
    label: "Legacy Mode",
    type: "tab",
    group: "Tabs",
    module: "main",
    reasons: legacyTabReasons(ctx),
  });

  // Main demo buttons
  out.push({
    id: "button.export",
    label: "Export",
    type: "button",
    group: "Buttons",
    module: "main",
    reasons: exportButtonReasons(ctx),
  });
  out.push({
    id: "button.edit_risk",
    label: "Edit Risk",
    type: "button",
    group: "Buttons",
    module: "main",
    reasons: editRiskButtonReasons(ctx),
  });

  // Overview route candidates
  for (const c of overviewCandidates(ctx)) {
    out.push({
      id: c.id,
      label: c.label,
      type: "route",
      group: "Overview Routes",
      module: "main",
      reasons: c.reasons,
    });
  }

  // Action picker dropdown items
  out.push({
    id: "action.edit",
    label: "Edit",
    type: "field",
    group: "Action Picker",
    module: "main",
    reasons: [permissionReason(ctx.user, "customers.write")],
  });
  out.push({
    id: "action.refund",
    label: "Issue refund",
    type: "field",
    group: "Action Picker",
    module: "main",
    reasons: [
      permissionReason(ctx.user, "refunds.write"),
      featureFlagReason(ctx, "smart_refunds"),
    ],
  });
  out.push({
    id: "action.delete",
    label: "Delete record",
    type: "field",
    group: "Action Picker",
    module: "main",
    reasons: [
      permissionReason(ctx.user, "customers.delete"),
      planAtLeastReason(ctx.tenant, "growth"),
    ],
  });
  out.push({
    id: "action.export",
    label: "Custom export",
    type: "field",
    group: "Action Picker",
    module: "main",
    reasons: [
      permissionReason(ctx.user, "reports.export"),
      featureFlagReason(ctx, "advanced_reports"),
      entitlementReason(ctx.tenant, "analytics"),
    ],
  });

  return out;
}
