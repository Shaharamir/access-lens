<script setup lang="ts">
import { computed, ref } from "vue";

type Plan = "free" | "growth" | "enterprise";
type RoleId = "owner" | "manager" | "viewer";
type TenantId = "acme" | "globex" | "smallco";
type SurfaceId = "billing" | "reports_export" | "payouts" | "risk";

interface Reason {
  kind: "permission" | "entitlement" | "plan" | "feature_flag";
  key: string;
  passed: boolean;
  message: string;
}

const PLAN_ORDER: Plan[] = ["free", "growth", "enterprise"];
function planAtLeast(actual: Plan, min: Plan): boolean {
  return PLAN_ORDER.indexOf(actual) >= PLAN_ORDER.indexOf(min);
}

const tenants = {
  acme:    { name: "Acme",    plan: "enterprise" as Plan, entitlements: { billing: true,  payouts: true  } },
  globex:  { name: "Globex",  plan: "growth"     as Plan, entitlements: { billing: true,  payouts: false } },
  smallco: { name: "SmallCo", plan: "free"       as Plan, entitlements: { billing: false, payouts: false } },
};

const roles = {
  owner:   { name: "Owner",   perms: new Set(["billing.read", "billing.write", "payouts.manage", "reports.read", "reports.export", "risk.write"]) },
  manager: { name: "Manager", perms: new Set(["billing.read", "billing.write", "payouts.manage", "reports.read"]) },
  viewer:  { name: "Viewer",  perms: new Set(["billing.read", "reports.read"]) },
};

const surfaces: { id: SurfaceId; label: string; type: string; build: (t: TenantId, r: RoleId) => Reason[] }[] = [
  {
    id: "billing",
    label: "Billing",
    type: "sidebar_item",
    build: (tId, rId) => {
      const t = tenants[tId], r = roles[rId];
      return [
        { kind: "entitlement", key: "billing",      passed: t.entitlements.billing, message: `${t.name} ${t.entitlements.billing ? "has" : "lacks"} billing entitlement` },
        { kind: "permission",  key: "billing.read", passed: r.perms.has("billing.read"), message: `${r.name} ${r.perms.has("billing.read") ? "has" : "lacks"} billing.read` },
      ];
    },
  },
  {
    id: "reports_export",
    label: "Reports → Export",
    type: "button",
    build: (tId, rId) => {
      const t = tenants[tId], r = roles[rId];
      return [
        { kind: "permission", key: "reports.export", passed: r.perms.has("reports.export"), message: `${r.name} ${r.perms.has("reports.export") ? "has" : "lacks"} reports.export` },
        { kind: "plan",       key: ">=growth",       passed: planAtLeast(t.plan, "growth"),  message: `Tenant on "${t.plan}", needs growth+` },
      ];
    },
  },
  {
    id: "payouts",
    label: "Payouts",
    type: "tab",
    build: (tId, rId) => {
      const t = tenants[tId], r = roles[rId];
      return [
        { kind: "entitlement",  key: "payouts",         passed: t.entitlements.payouts, message: `${t.name} ${t.entitlements.payouts ? "has" : "lacks"} payouts entitlement` },
        { kind: "permission",   key: "payouts.manage",  passed: r.perms.has("payouts.manage"), message: `${r.name} ${r.perms.has("payouts.manage") ? "has" : "lacks"} payouts.manage` },
        { kind: "feature_flag", key: "payouts_killswitch", passed: true, message: "payouts_killswitch is off (passing)" },
      ];
    },
  },
  {
    id: "risk",
    label: "Risk settings",
    type: "section",
    build: (tId, rId) => {
      const t = tenants[tId], r = roles[rId];
      return [
        { kind: "plan",       key: ">=enterprise", passed: planAtLeast(t.plan, "enterprise"), message: `Tenant on "${t.plan}", needs enterprise` },
        { kind: "permission", key: "risk.write",   passed: r.perms.has("risk.write"),         message: `${r.name} ${r.perms.has("risk.write") ? "has" : "lacks"} risk.write` },
      ];
    },
  },
];

const active = ref<SurfaceId>("billing");
const hover = ref<{ t: TenantId; r: RoleId } | null>(null);

const currentSurface = computed(() => surfaces.find(s => s.id === active.value)!);

const cells = computed(() => {
  const grid: Record<TenantId, Record<RoleId, { allowed: boolean; reasons: Reason[] }>> = {} as any;
  for (const tId of Object.keys(tenants) as TenantId[]) {
    grid[tId] = {} as any;
    for (const rId of Object.keys(roles) as RoleId[]) {
      const reasons = currentSurface.value.build(tId, rId);
      grid[tId][rId] = { allowed: reasons.every(r => r.passed), reasons };
    }
  }
  return grid;
});

const coverage = computed(() => {
  let open = 0, total = 0;
  for (const tId of Object.keys(tenants) as TenantId[]) {
    for (const rId of Object.keys(roles) as RoleId[]) {
      total++;
      if (cells.value[tId][rId].allowed) open++;
    }
  }
  return { open, total };
});

function reasonChipClass(kind: Reason["kind"]) {
  return `chip-${kind}`;
}
</script>

<template>
  <div class="matrix-demo">
    <div class="matrix-toolbar">
      <span class="matrix-eyebrow">Surface</span>
      <div class="matrix-tabs">
        <button
          v-for="s in surfaces"
          :key="s.id"
          :class="['matrix-tab', { active: active === s.id }]"
          @click="active = s.id"
        >
          <span class="matrix-tab-label">{{ s.label }}</span>
          <span class="matrix-tab-type">{{ s.type }}</span>
        </button>
      </div>
      <span class="matrix-coverage">
        open <strong>{{ coverage.open }}</strong> / {{ coverage.total }}
      </span>
    </div>

    <div class="matrix-grid">
      <table>
        <thead>
          <tr>
            <th class="corner">tenant ↓ · role →</th>
            <th v-for="(r, rId) in roles" :key="rId">
              <div class="cell-role">
                <span>{{ r.name }}</span>
                <span class="cell-role-perms">{{ r.perms.size }} perms</span>
              </div>
            </th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="(t, tId) in tenants" :key="tId">
            <th scope="row" class="cell-tenant">
              <span class="cell-tenant-name">{{ t.name }}</span>
              <span class="cell-tenant-plan">{{ t.plan }}</span>
            </th>
            <td
              v-for="(r, rId) in roles"
              :key="rId"
              @mouseenter="hover = { t: tId as any, r: rId as any }"
              @mouseleave="hover = null"
              :class="['cell', cells[tId as any][rId as any].allowed ? 'cell-open' : 'cell-closed']"
            >
              <span class="cell-mark">{{ cells[tId as any][rId as any].allowed ? "✓" : "×" }}</span>
            </td>
          </tr>
        </tbody>
      </table>

      <transition name="fade">
        <div v-if="hover" class="matrix-popover">
          <div class="matrix-popover-head">
            <span :class="['matrix-popover-status', cells[hover.t][hover.r].allowed ? 'status-open' : 'status-closed']">
              {{ cells[hover.t][hover.r].allowed ? "open" : "closed" }}
            </span>
            <span class="matrix-popover-title">
              {{ tenants[hover.t].name }} · {{ roles[hover.r].name }}
            </span>
            <span class="matrix-popover-surface">{{ currentSurface.label }}</span>
          </div>
          <ul>
            <li
              v-for="(reason, i) in cells[hover.t][hover.r].reasons"
              :key="i"
              :class="reason.passed ? 'reason-pass' : 'reason-fail'"
            >
              <span class="reason-icon">{{ reason.passed ? "+" : "×" }}</span>
              <span class="reason-body">
                <span class="reason-meta">
                  <span :class="['reason-chip', reasonChipClass(reason.kind)]">{{ reason.kind }}</span>
                  <code class="reason-key">{{ reason.key }}</code>
                </span>
                <span class="reason-msg">{{ reason.message }}</span>
              </span>
            </li>
          </ul>
        </div>
      </transition>
    </div>

    <div class="matrix-hint">
      <span>Click any surface · hover any cell · every cell evaluates real reasons against tenant + role.</span>
    </div>
  </div>
</template>

<style scoped>
.matrix-demo {
  border: 1px solid var(--vp-c-divider);
  border-radius: 18px;
  background: var(--vp-c-bg);
  box-shadow: 0 22px 60px -36px rgba(15, 23, 42, 0.35);
  padding: 18px;
  display: flex;
  flex-direction: column;
  gap: 14px;
  font-size: 13px;
}

.matrix-toolbar {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 12px;
}
.matrix-eyebrow {
  font-size: 10px;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  color: var(--vp-c-text-3);
  font-weight: 700;
}
.matrix-coverage {
  margin-left: auto;
  font-size: 11px;
  color: var(--vp-c-text-2);
  font-family: var(--vp-font-family-mono, monospace);
}
.matrix-coverage strong {
  color: var(--vp-c-brand-1);
}

.matrix-tabs {
  display: inline-flex;
  flex-wrap: wrap;
  gap: 4px;
  background: var(--vp-c-bg-soft);
  border: 1px solid var(--vp-c-divider);
  border-radius: 12px;
  padding: 3px;
}
.matrix-tab {
  border: none;
  background: transparent;
  padding: 6px 10px;
  border-radius: 9px;
  font-family: inherit;
  font-size: 12px;
  color: var(--vp-c-text-2);
  cursor: pointer;
  display: inline-flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 1px;
  line-height: 1.1;
  transition: background 160ms ease, color 160ms ease;
}
.matrix-tab:hover { color: var(--vp-c-text-1); }
.matrix-tab.active {
  background: var(--vp-c-bg);
  color: var(--vp-c-text-1);
  box-shadow: 0 1px 2px rgba(15, 23, 42, 0.06);
}
.matrix-tab-label { font-weight: 600; }
.matrix-tab-type {
  font-size: 9px;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: var(--vp-c-text-3);
  font-family: var(--vp-font-family-mono, monospace);
}

.matrix-grid {
  position: relative;
  border: 1px solid var(--vp-c-divider);
  border-radius: 14px;
  overflow: hidden;
  background: var(--vp-c-bg-soft);
}
.matrix-grid table {
  width: 100%;
  border-collapse: collapse;
  font-size: 12.5px;
}
.matrix-grid th,
.matrix-grid td {
  padding: 10px 12px;
  text-align: left;
  border-bottom: 1px solid var(--vp-c-divider);
}
.matrix-grid tr:last-child th,
.matrix-grid tr:last-child td { border-bottom: none; }

.corner {
  font-family: var(--vp-font-family-mono, monospace);
  font-size: 10.5px;
  color: var(--vp-c-text-3);
  font-weight: 600;
  background: var(--vp-c-bg);
  width: 33%;
}

.cell-role {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
}
.cell-role span:first-child { font-weight: 700; color: var(--vp-c-text-1); font-size: 12.5px; }
.cell-role-perms {
  font-size: 9.5px;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: var(--vp-c-text-3);
  font-family: var(--vp-font-family-mono, monospace);
}

.matrix-grid thead th { text-align: center; background: var(--vp-c-bg); }

.cell-tenant {
  display: flex;
  flex-direction: column;
  gap: 2px;
  background: var(--vp-c-bg);
}
.cell-tenant-name { font-weight: 700; color: var(--vp-c-text-1); }
.cell-tenant-plan {
  font-family: var(--vp-font-family-mono, monospace);
  font-size: 9.5px;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: var(--vp-c-text-3);
}

.cell {
  text-align: center;
  cursor: default;
  transition: background 160ms ease;
}
.cell:hover { background: var(--vp-c-bg); }

.cell-mark {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 22px;
  height: 22px;
  border-radius: 999px;
  font-weight: 800;
  font-family: var(--vp-font-family-mono, monospace);
  font-size: 11px;
  transition: transform 160ms ease;
}
.cell:hover .cell-mark { transform: scale(1.08); }
.cell-open .cell-mark { background: #10b981; color: white; }
.cell-closed .cell-mark { background: #ef4444; color: white; }
.cell-open { background: rgba(16, 185, 129, 0.05); }
.cell-closed { background: rgba(239, 68, 68, 0.04); }

.matrix-popover {
  position: absolute;
  top: 10px;
  right: 10px;
  width: 320px;
  z-index: 6;
  background: var(--vp-c-bg);
  border: 1px solid var(--vp-c-divider);
  border-radius: 12px;
  padding: 12px 14px;
  box-shadow: 0 22px 50px -22px rgba(15, 23, 42, 0.4);
  pointer-events: none;
}
.matrix-popover-head {
  display: flex;
  align-items: center;
  gap: 8px;
  padding-bottom: 8px;
  margin-bottom: 8px;
  border-bottom: 1px solid var(--vp-c-divider);
  flex-wrap: wrap;
}
.matrix-popover-status {
  font-size: 9px;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  padding: 2px 7px;
  border-radius: 999px;
  font-weight: 700;
}
.status-open { background: rgba(16, 185, 129, 0.16); color: #047857; }
.status-closed { background: rgba(239, 68, 68, 0.16); color: #b91c1c; }
.dark .status-open  { color: #6ee7b7; }
.dark .status-closed { color: #fca5a5; }
.matrix-popover-title { font-weight: 700; font-size: 12.5px; color: var(--vp-c-text-1); }
.matrix-popover-surface {
  margin-left: auto;
  font-family: var(--vp-font-family-mono, monospace);
  font-size: 10px;
  color: var(--vp-c-text-3);
}
.matrix-popover ul {
  display: flex;
  flex-direction: column;
  gap: 5px;
  list-style: none;
  margin: 0;
  padding: 0;
}
.matrix-popover li {
  display: grid;
  grid-template-columns: 16px 1fr;
  gap: 6px;
  padding: 6px 8px;
  border-radius: 7px;
  font-size: 11px;
  line-height: 1.45;
}
.reason-pass { background: rgba(16, 185, 129, 0.10); color: var(--vp-c-text-1); }
.reason-fail { background: rgba(239, 68, 68, 0.12); color: #b91c1c; }
.dark .reason-fail { color: #fca5a5; }
.reason-icon {
  font-family: var(--vp-font-family-mono, monospace);
  font-weight: 800;
  text-align: center;
}
.reason-body { display: flex; flex-direction: column; gap: 2px; min-width: 0; }
.reason-meta { display: inline-flex; align-items: center; gap: 6px; flex-wrap: wrap; }
.reason-chip {
  font-size: 8.5px;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  padding: 1px 5px;
  border-radius: 4px;
  font-weight: 700;
  font-family: var(--vp-font-family-mono, monospace);
}
.chip-permission   { background: rgba(56, 189, 248, 0.18); color: #0369a1; }
.chip-feature_flag { background: rgba(129, 140, 248, 0.22); color: #4338ca; }
.chip-plan         { background: rgba(251, 191, 36, 0.22); color: #92400e; }
.chip-entitlement  { background: rgba(16, 185, 129, 0.20); color: #047857; }
.dark .chip-permission   { color: #7dd3fc; }
.dark .chip-feature_flag { color: #a5b4fc; }
.dark .chip-plan         { color: #fcd34d; }
.dark .chip-entitlement  { color: #6ee7b7; }
.reason-key {
  font-family: var(--vp-font-family-mono, monospace);
  font-size: 10.5px;
  color: var(--vp-c-text-1);
  background: transparent;
}
.reason-msg { opacity: 0.85; font-size: 10.5px; }

.matrix-hint {
  text-align: center;
  font-size: 11px;
  color: var(--vp-c-text-3);
}

.fade-enter-active, .fade-leave-active { transition: opacity 160ms ease, transform 160ms ease; }
.fade-enter-from, .fade-leave-to { opacity: 0; transform: translateY(-4px); }

@media (max-width: 720px) {
  .matrix-popover {
    position: static;
    width: auto;
    margin: 8px;
  }
}
</style>
