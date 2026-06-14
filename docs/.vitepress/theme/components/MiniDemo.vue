<script setup lang="ts">
import { computed, ref } from "vue";

interface DemoSurface {
  id: string;
  label: string;
  reasons: { kind: "permission" | "feature_flag" | "entitlement" | "plan"; key: string; passed: boolean; message: string }[];
}

const tenant = ref<"acme" | "small">("acme");
const debugMode = ref(true);
const hovered = ref<string | null>(null);

const tenants = {
  acme:  { name: "Acme",    plan: "enterprise", entitlements: { billing: true,  payouts: true  } },
  small: { name: "SmallCo", plan: "free",       entitlements: { billing: false, payouts: false } },
};

const surfaces = computed<DemoSurface[]>(() => {
  const t = tenants[tenant.value];
  return [
    {
      id: "home",
      label: "Home",
      reasons: [],
    },
    {
      id: "billing",
      label: "Billing",
      reasons: [
        { kind: "entitlement", key: "billing", passed: t.entitlements.billing, message: `Tenant ${t.name} ${t.entitlements.billing ? "has" : "lacks"} billing entitlement` },
        { kind: "feature_flag", key: "billing_v2", passed: true, message: "billing_v2 flag is on" },
      ],
    },
    {
      id: "payouts",
      label: "Payouts",
      reasons: [
        { kind: "entitlement", key: "payouts", passed: t.entitlements.payouts, message: `Tenant ${t.name} ${t.entitlements.payouts ? "has" : "lacks"} payouts entitlement` },
      ],
    },
    {
      id: "risk",
      label: "Risk Settings",
      reasons: [
        { kind: "plan", key: "enterprise", passed: t.plan === "enterprise", message: `Tenant is on "${t.plan}", needs enterprise` },
      ],
    },
  ];
});

function isAllowed(surface: DemoSurface): boolean {
  return surface.reasons.every(r => r.passed);
}

function primaryKindColor(surface: DemoSurface): string {
  const failed = surface.reasons.find(r => !r.passed);
  const reason = failed ?? surface.reasons[0];
  if (!reason) return "transparent";
  switch (reason.kind) {
    case "feature_flag": return "indigo";
    case "permission":   return "sky";
    case "plan":         return "amber";
    case "entitlement":  return "emerald";
  }
}

function outlineClass(surface: DemoSurface): string {
  if (!debugMode.value || surface.reasons.length === 0) return "";
  const color = primaryKindColor(surface);
  const allowed = isAllowed(surface);
  return `outline-${color}-${allowed ? "solid" : "dashed"}`;
}
</script>

<template>
  <div class="mini-demo">
    <div class="mini-toolbar">
      <div class="mini-control">
        <span class="mini-label">Tenant</span>
        <div class="mini-segment">
          <button
            :class="{ active: tenant === 'acme' }"
            @click="tenant = 'acme'"
          >Acme · enterprise</button>
          <button
            :class="{ active: tenant === 'small' }"
            @click="tenant = 'small'"
          >SmallCo · free</button>
        </div>
      </div>
      <label class="mini-toggle">
        <input type="checkbox" v-model="debugMode" />
        <span class="mini-toggle-thumb" />
        <span class="mini-toggle-text">Debug</span>
      </label>
    </div>

    <div class="mini-sidebar">
      <div class="mini-sidebar-title">Workspace</div>
      <ul>
        <li
          v-for="surface in surfaces"
          :key="surface.id"
          :class="['mini-item', outlineClass(surface)]"
          @mouseenter="hovered = surface.id"
          @mouseleave="hovered = null"
        >
          <span class="mini-dot" :class="{ allowed: isAllowed(surface), denied: !isAllowed(surface) && surface.reasons.length > 0 }" />
          <span class="mini-item-label">{{ surface.label }}</span>
          <span v-if="debugMode && surface.reasons.length > 0" class="mini-badge" :class="`badge-${primaryKindColor(surface)}`">
            {{ isAllowed(surface) ? "gated" : "denied" }}
          </span>
        </li>
      </ul>

      <transition name="fade">
        <div v-if="debugMode && hovered" class="mini-popover">
          <div class="mini-popover-title">
            {{ surfaces.find(s => s.id === hovered)?.label }}
          </div>
          <ul>
            <li
              v-for="(reason, i) in surfaces.find(s => s.id === hovered)?.reasons ?? []"
              :key="i"
              :class="reason.passed ? 'reason-pass' : 'reason-fail'"
            >
              <span class="reason-icon">{{ reason.passed ? "✓" : "×" }}</span>
              <span class="reason-text">
                <strong>{{ reason.kind }}:</strong>
                {{ reason.message }}
              </span>
            </li>
            <li v-if="(surfaces.find(s => s.id === hovered)?.reasons ?? []).length === 0" class="reason-none">
              Always allowed — no gates.
            </li>
          </ul>
        </div>
      </transition>
    </div>

    <div class="mini-hint">
      <span>Try: flip <strong>Debug</strong> · switch the tenant · hover any item.</span>
    </div>
  </div>
</template>

<style scoped>
.mini-demo {
  border: 1px solid var(--vp-c-divider);
  border-radius: 16px;
  background: var(--vp-c-bg);
  box-shadow: 0 16px 44px -28px rgba(15, 23, 42, 0.25);
  padding: 14px;
  display: flex;
  flex-direction: column;
  gap: 10px;
  font-size: 13px;
  max-width: 440px;
  margin: 0 auto;
}

.mini-toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}

.mini-control { display: flex; flex-direction: column; gap: 4px; }
.mini-label {
  font-size: 9.5px;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: var(--vp-c-text-3);
  font-weight: 700;
}

.mini-segment {
  display: inline-flex;
  border: 1px solid var(--vp-c-divider);
  border-radius: 999px;
  overflow: hidden;
  background: var(--vp-c-bg-soft);
}
.mini-segment button {
  border: none;
  background: transparent;
  padding: 4px 10px;
  font-size: 11px;
  color: var(--vp-c-text-2);
  cursor: pointer;
  font-family: inherit;
  transition: background 160ms ease, color 160ms ease;
}
.mini-segment button.active {
  background: var(--vp-c-brand-1);
  color: white;
}

.mini-toggle {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  user-select: none;
  font-size: 12px;
  color: var(--vp-c-text-1);
}
.mini-toggle input { display: none; }
.mini-toggle-thumb {
  width: 30px;
  height: 18px;
  border-radius: 999px;
  background: var(--vp-c-bg-soft);
  border: 1px solid var(--vp-c-divider);
  position: relative;
  transition: background 160ms ease, border-color 160ms ease;
}
.mini-toggle-thumb::after {
  content: "";
  position: absolute;
  inset: 2px auto 2px 2px;
  width: 12px;
  background: var(--vp-c-text-3);
  border-radius: 999px;
  transition: transform 200ms cubic-bezier(0.22, 1, 0.36, 1), background 160ms ease;
}
.mini-toggle input:checked + .mini-toggle-thumb {
  background: var(--vp-c-brand-1);
  border-color: var(--vp-c-brand-1);
}
.mini-toggle input:checked + .mini-toggle-thumb::after {
  background: white;
  transform: translateX(12px);
}

.mini-sidebar {
  background: var(--vp-c-bg-soft);
  border-radius: 12px;
  padding: 10px;
  position: relative;
}
.mini-sidebar-title {
  font-size: 9.5px;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: var(--vp-c-text-3);
  font-weight: 700;
  padding: 2px 6px 6px;
}
.mini-sidebar ul {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.mini-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px 8px;
  border-radius: 8px;
  font-size: 12.5px;
  cursor: default;
  transition: background 160ms ease;
}
.mini-item:hover { background: var(--vp-c-bg); }

.mini-dot {
  width: 6px;
  height: 6px;
  border-radius: 999px;
  background: var(--vp-c-text-3);
}
.mini-dot.allowed { background: #10b981; }
.mini-dot.denied  { background: #ef4444; }

.mini-item-label { flex: 1; }

.mini-badge {
  font-size: 9px;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  padding: 1px 6px;
  border-radius: 999px;
  font-weight: 700;
}
.badge-sky     { background: rgba(56, 189, 248, 0.18); color: #0369a1; }
.badge-indigo  { background: rgba(129, 140, 248, 0.22); color: #4338ca; }
.badge-amber   { background: rgba(251, 191, 36, 0.22); color: #92400e; }
.badge-emerald { background: rgba(16, 185, 129, 0.20); color: #047857; }
.dark .badge-sky     { color: #7dd3fc; }
.dark .badge-indigo  { color: #a5b4fc; }
.dark .badge-amber   { color: #fcd34d; }
.dark .badge-emerald { color: #6ee7b7; }

/* Outline variants */
.outline-sky-solid     { outline: 1px solid rgba(56, 189, 248, 0.7);    outline-offset: 2px; border-radius: 8px; }
.outline-sky-dashed    { outline: 1px dashed rgba(56, 189, 248, 0.85);  outline-offset: 2px; border-radius: 8px; }
.outline-indigo-solid  { outline: 1px solid rgba(129, 140, 248, 0.75);  outline-offset: 2px; border-radius: 8px; }
.outline-indigo-dashed { outline: 1px dashed rgba(129, 140, 248, 0.95); outline-offset: 2px; border-radius: 8px; }
.outline-amber-solid   { outline: 1px solid rgba(251, 191, 36, 0.85);   outline-offset: 2px; border-radius: 8px; }
.outline-amber-dashed  { outline: 1px dashed rgba(251, 146, 60, 0.95);  outline-offset: 2px; border-radius: 8px; }
.outline-emerald-solid { outline: 1px solid rgba(16, 185, 129, 0.7);    outline-offset: 2px; border-radius: 8px; }
.outline-emerald-dashed{ outline: 1px dashed rgba(244, 63, 94, 0.9);    outline-offset: 2px; border-radius: 8px; }

.mini-popover {
  position: absolute;
  top: calc(100% + 6px);
  left: 10px;
  right: 10px;
  z-index: 5;
  background: var(--vp-c-bg);
  border: 1px solid var(--vp-c-divider);
  border-radius: 12px;
  padding: 10px 12px;
  box-shadow: 0 18px 38px -20px rgba(15, 23, 42, 0.35);
}
.mini-popover-title {
  font-weight: 700;
  font-size: 12px;
  margin-bottom: 6px;
  color: var(--vp-c-text-1);
}
.mini-popover ul {
  display: flex;
  flex-direction: column;
  gap: 4px;
}
.mini-popover li {
  display: grid;
  grid-template-columns: 14px 1fr;
  gap: 6px;
  padding: 4px 6px;
  border-radius: 6px;
  font-size: 11px;
  line-height: 1.4;
}
.reason-pass { background: rgba(16, 185, 129, 0.10); color: var(--vp-c-text-1); }
.reason-fail { background: rgba(239, 68, 68, 0.12); color: #b91c1c; }
.dark .reason-fail { color: #fca5a5; }
.reason-icon { font-family: monospace; font-weight: 800; text-align: center; }
.reason-text strong {
  font-family: monospace;
  font-size: 9.5px;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  opacity: 0.7;
  margin-right: 2px;
}
.reason-none {
  grid-template-columns: 1fr !important;
  color: var(--vp-c-text-3);
  font-style: italic;
}

.mini-hint {
  text-align: center;
  font-size: 11px;
  color: var(--vp-c-text-3);
}

.fade-enter-active, .fade-leave-active { transition: opacity 180ms ease, transform 180ms ease; }
.fade-enter-from, .fade-leave-to { opacity: 0; transform: translateY(-4px); }
</style>
