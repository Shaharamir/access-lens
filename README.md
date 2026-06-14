<div align="center">

<img src="assets/logo.svg" alt="Access Lens" width="96" height="96" />

# Access Lens

### **See why your UI hides what it hides.**

Authorization observability for SaaS apps. Record every gated UI decision with the exact reason it produced — and inspect it live.

<p align="center">
  <a href="https://www.npmjs.com/package/@access-lens/core"><img src="https://img.shields.io/npm/v/@access-lens/core?label=%40access-lens%2Fcore&style=flat-square&color=2563eb" alt="@access-lens/core npm version" /></a>
  <a href="https://www.npmjs.com/package/@access-lens/react"><img src="https://img.shields.io/npm/v/@access-lens/react?label=%40access-lens%2Freact&style=flat-square&color=2563eb" alt="@access-lens/react npm version" /></a>
  <a href="https://bundlephobia.com/package/@access-lens/core"><img src="https://img.shields.io/bundlephobia/minzip/@access-lens/core?label=core%20gzipped&style=flat-square&color=10b981" alt="bundle size" /></a>
  <a href="https://github.com/Shaharamir/access-lens/blob/main/LICENSE"><img src="https://img.shields.io/badge/license-MIT-blue?style=flat-square" alt="MIT License" /></a>
  <img src="https://img.shields.io/badge/types-included-3178c6?style=flat-square" alt="TypeScript included" />
  <img src="https://img.shields.io/badge/tests-42%20passing-10b981?style=flat-square" alt="42 tests passing" />
</p>

<p align="center">
  <a href="https://access-lens-theta.vercel.app"><strong>Live demo</strong></a>
  ·
  <a href="docs/llm-context.md"><strong>LLM context</strong></a>
  ·
  <a href="#-30-second-tour"><strong>Quick start</strong></a>
  ·
  <a href="#-vs-the-things-youre-already-using"><strong>vs alternatives</strong></a>
</p>

<br />

<!-- Replace with: assets/hero.gif (10s loop of debug toggle → outlines bloom → hover → matrix → flag flip → matrix recomputes) -->
<img src="assets/hero.gif" alt="Access Lens debug mode — every gated UI element outlined by reason, hover for the full reason graph + tenants × roles matrix" />

</div>

---

> [!TIP]
> **The pitch.** Your support team can't tell why a tenant can't see Billing. Permissions, plans, feature flags, entitlements, and one-off tenant conditions are scattered across the codebase. Access Lens records every gated UI decision with the **combined reason** it produced — and surfaces it through a hover-card on every outlined element that also tells you *which other tenants × roles can see it*.

## ✨ Why developers love it

<table>
  <tr>
    <td width="33%" align="center"><strong>🎯 Typed end-to-end</strong></td>
    <td width="33%" align="center"><strong>⚡ Headless core</strong></td>
    <td width="33%" align="center"><strong>🔍 Live debug overlay</strong></td>
  </tr>
  <tr>
    <td>One <code>defineAccessLens()</code> call. Every key autocompletes. <code>al.flag.billing_v2.on(…)</code> is type-safe; <code>al.permission("billing.raed")</code> is a <strong>compile error</strong>. No <code>any</code>, no free strings.</td>
    <td>Zero runtime deps. <strong>10kB gzipped</strong>. Framework-agnostic — React adapter ships today, Vue / Solid / Svelte are 150 LOC mirrors. Same model on the server (Next.js middleware → hydrate).</td>
    <td>Toggle Debug → every gated surface outlines in the color of its primary gate (flag · permission · plan · entitlement · tenant config · condition). Hover any of them → reasons + <strong>tenants × roles matrix</strong>.</td>
  </tr>
  <tr>
    <td width="33%" align="center"><strong>📊 5 flag kinds</strong></td>
    <td width="33%" align="center"><strong>🧩 No vendor lock-in</strong></td>
    <td width="33%" align="center"><strong>🤖 LLM-ready</strong></td>
  </tr>
  <tr>
    <td>Boolean · killswitch · A/B/C variant · % rollout · date-windowed. Each kind has its own typed signature; mixing them is a compile error.</td>
    <td>Use any auth, any flag SDK (LaunchDarkly / GrowthBook / OpenFeature / your own). Access Lens composes <em>their outputs</em> into one observable decision.</td>
    <td>Ships with <a href="llms.txt"><code>llms.txt</code></a> and a single-paste <a href="docs/llm-context.md">LLM context bundle</a>. Cursor, Claude, Copilot Chat write correct typed code on the first try.</td>
  </tr>
</table>

## 🚀 30-second tour

```bash
pnpm add @access-lens/core @access-lens/react
```

**Step 1.** Declare your registry once. Every subsequent call autocompletes from this:

```ts
// access-lens.ts
import { defineAccessLens } from "@access-lens/core";
import { createReactBindings } from "@access-lens/react";

export const al = defineAccessLens({
  permissions: ["billing.read", "reports.read"] as const,
  entitlements: ["billing"] as const,
  plans: ["free", "basic", "growth", "enterprise"] as const,
  flags: {
    billing_v2:       { kind: "boolean" },
    checkout_version: { kind: "variant", choices: ["v1", "v2"] as const },
    new_invoicing:    { kind: "percent" },
    q3_features:      { kind: "date" },
    risk_killswitch:  { kind: "killswitch" },
  },
  surfaces: ["sidebar.billing"] as const,
});

export const { AccessLensProvider, AccessGate, useAccessLensSnapshot } =
  createReactBindings(al);
```

**Step 2.** Wrap any gated surface. Reasons compose freely:

```tsx
<AccessLensProvider defaultDebugMode={import.meta.env.DEV}>
  <AccessGate
    id="sidebar.billing"
    type="sidebar_item"
    label="Billing"
    reasons={[
      al.permission("billing.read", user.perms.has("billing.read")),
      al.flag.billing_v2.on(flags.billing_v2.on),                    // ← boolean
      al.entitlement("billing", tenant.entitlements.billing),
      al.plan.atLeast("growth", tenant.plan),                        // ← respects declared order
      al.flag.checkout_version.is("v2", flags.checkout_version),     // ← variant, autocompletes choices
      al.flag.q3_features.activeFrom("2026-07-01", TODAY),           // ← date-windowed
      al.flag.risk_killswitch.notEngaged(flags.risk_killswitch.on),  // ← killswitch
    ]}
  >
    <a href="/billing">Billing</a>
  </AccessGate>
</AccessLensProvider>
```

**Step 3.** That's it. In production the link renders only when all reasons pass. In debug mode every gated surface lights up with a colored outline — hover for the reason graph + tenants × roles matrix.

> [!NOTE]
> Every key in those reason calls autocompletes. Every flag has a kind-specific method. Typos are compile errors. **No `any`, no free strings.**

## 🎬 What the debug mode looks like

<!-- screenshot or GIF strip -->

<table>
  <tr>
    <td width="50%" valign="top">

**Outlined by primary gate type**

Sidebar items, tabs, buttons, route candidates, and select options all get an outline in debug mode. The color tells you what's gating it:

🟦 sky · permission
🟪 indigo · feature flag
🟧 amber · plan
🟩 emerald · entitlement
🟥 pink · tenant config
⬜ slate · condition

Dashed = denied. Solid = allowed but gated.

  </td>
  <td width="50%" valign="top">

<!-- Replace with: assets/screenshot-outlines.png -->
<img src="assets/screenshot-outlines.png" alt="Sidebar items outlined by their primary reason type" />

  </td>
  </tr>
  <tr>
    <td width="50%" valign="top">

<!-- Replace with: assets/screenshot-hover.png -->
<img src="assets/screenshot-hover.png" alt="Hover card with reasons + tenants × roles matrix" />

  </td>
  <td width="50%" valign="top">

**Hover any outlined surface**

The popover opens with two tabs:

**Reasons** — every reason that fed the decision, filterable by kind, status, and free-text search.

**Tenants × Roles** — a live 5×4 grid showing *who else can see this*, with per-cell hover details. Switch tenants in the header and watch the grid recompute.

  </td>
  </tr>
  <tr>
    <td width="50%" valign="top">

**Power-tool inspectors**

- **Feature catalog** — 100+ gated surfaces across domains. Filter, search, expand for full reason breakdown.
- **Flag inspector** — every flag with per-tenant evaluation, affected-surfaces count, and a matrix view.
- **Access matrix** — every surface × every tenant×user combo. Filter by surface type, reason kind, or coverage (open everywhere · partial · closed everywhere).
- **Floating widget** — drop-in React inspector with status filters and per-node DOM highlighting.

  </td>
  <td width="50%" valign="top">

<!-- Replace with: assets/screenshot-matrix.png -->
<img src="assets/screenshot-matrix.png" alt="Access matrix view — surface × tenant × user grid" />

  </td>
  </tr>
</table>

## 🤔 vs the things you're already using

Access Lens is **complementary** to your existing tools, not a replacement:

<table>
  <tr>
    <th align="left">If you use…</th>
    <th align="left">…use it together with Access Lens, because</th>
  </tr>
  <tr>
    <td><strong>OpenFeature · LaunchDarkly · GrowthBook</strong></td>
    <td>Those evaluate <em>flags</em>. Access Lens composes flag-eval + permissions + plans + entitlements into one observable decision per UI surface.</td>
  </tr>
  <tr>
    <td><strong>CASL · Casbin · accesscontrol</strong></td>
    <td>Those decide <em>allowed/denied</em>. Access Lens makes the decision <em>observable</em> — same output, with the <em>why</em> attached and a debug overlay that surfaces it.</td>
  </tr>
  <tr>
    <td><strong>Auth.js · NextAuth · Clerk</strong></td>
    <td>Those handle authentication. Access Lens handles authorization <em>observability</em> for already-authenticated users.</td>
  </tr>
  <tr>
    <td><strong>React DevTools</strong></td>
    <td>Those show component trees. Access Lens shows <em>why your tree rendered the way it did</em> from an access-control perspective.</td>
  </tr>
</table>

## 📦 Packages

| Package | Size | What's in it |
|---|---|---|
| [`@access-lens/core`](packages/core) | **22kB** tarball / 10kB ESM gz | Headless TypeScript. `defineAccessLens`, `evaluateAccess`, `AccessLensClient`. Zero runtime deps. Dual ESM/CJS. |
| [`@access-lens/react`](packages/react) | **10kB** tarball / 6kB ESM gz | React adapter. `AccessLensProvider`, `AccessGate`, `useAccessGate`, `useAccessLensSnapshot`, `createReactBindings`. Peer deps on React 18 or 19. |
| [`@access-lens/dom`](packages/dom) | **11kB** tarball / 11kB ESM gz | Framework-agnostic floating debug overlay. No React. |

## 💡 The story

Your SaaS app has feature flags. It has plans. It has entitlements. It has permissions. It has one-off tenant conditions. Five different systems, each owning a slice of "what should this tenant see?", scattered across however many years of incremental decisions your codebase has lived through.

Then a customer support ticket comes in: *"Why can't this merchant see the Payouts page?"*

You spend the next 40 minutes:
1. Open the admin tool. Switch to their tenant.
2. Open the codebase. Find the Payouts sidebar item.
3. Grep for permission checks. Find three.
4. Grep for feature flag checks. Find two more.
5. Check the entitlements table. Manually compute.
6. Realize you missed a tenant.config check buried in a hook.
7. Email back: *"It's because flag X is off for your account, which we turned off after the Y incident in March."*

This happens dozens of times a quarter across your team.

Access Lens makes that lookup a `hover` instead of a `grep`. Every gated surface registers its reasons; the debug overlay surfaces them; the matrix tells you *who else* would see the same thing. Support → CS → QA → engineering all stop asking each other "why is this hidden?" because the UI itself answers.

## 🏎️ Run the demo

```bash
git clone https://github.com/Shaharamir/access-lens
cd access-lens
pnpm install
pnpm dev:demo
```

Open `http://localhost:5173`. Toggle **Debug** in the header — outlines bloom across every gated surface. Hover any one for the reason graph. Sidebar → **Flag inspector** / **Access matrix** for the standalone power-tool views.

Or skip the clone: **[access-lens.dev](https://access-lens-theta.vercel.app)** runs it live.

## 🤖 LLM tooling

Pasting this repo into Cursor / Claude / Continue / Copilot Chat? Two purpose-built artifacts:

- **[`llms.txt`](llms.txt)** at the repo root, following [llmstxt.org](https://llmstxt.org) — a hierarchical index your IDE's AI tool can ingest as project context.
- **[`docs/llm-context.md`](docs/llm-context.md)** — a single-file paste-anywhere bundle: every public type, every typed-API call shape, common LLM mistakes preempted, a runnable starter at the bottom. Use this when you want correct `al.flag.<key>.<method>()` code on the first try instead of un-typed `featureFlag("key", …)` variants.

## 📚 Docs

- **[LLM context bundle](docs/llm-context.md)** — start here if you're an LLM or want to feed one
- **[API reference](packages/core/README.md)** — every public export, typed
- **[React adapter](packages/react/README.md)** — Provider, gate, hooks, bindings

## 🛣️ Roadmap

- [x] Typed `defineAccessLens` with autocomplete and per-kind flag dispatch
- [x] React adapter with hover-card matrix + floating widget
- [x] DOM overlay for framework-agnostic consumers
- [x] 42 Vitest cases on core including caching/identity regression
- [x] Dual ESM/CJS published via tsup
- [ ] `@access-lens/vue` adapter (~150 LOC mirror)
- [ ] `@access-lens/next` — server-side route gates registered from middleware
- [ ] Recipes for NextAuth, Clerk, LaunchDarkly, GrowthBook, Stripe Entitlements
- [ ] `@access-lens/svelte`, `@access-lens/solid`

## 🤝 Contributing

PRs welcome. Open an issue first for non-trivial changes.

```bash
pnpm install
pnpm -r typecheck
pnpm --filter "@access-lens/core" test
pnpm --filter "@access-lens/core" build
pnpm dev:demo
```

## ⭐ If this saved your support team an afternoon

[![Star on GitHub](https://img.shields.io/github/stars/Shaharamir/access-lens?style=social)](https://github.com/Shaharamir/access-lens/stargazers)
[![Share on X](https://img.shields.io/badge/share%20on-X-000?style=flat-square)](https://twitter.com/intent/tweet?text=Just%20found%20Access%20Lens%20%E2%80%94%20hover%20any%20UI%20element%20in%20your%20SaaS%20app%20and%20see%20EXACTLY%20why%20it%27s%20hidden%20from%20a%20tenant.%20Permissions%20%2B%20plans%20%2B%20flags%20%2B%20entitlements%20unified.%20%F0%9F%94%8D&url=https%3A%2F%2Fgithub.com%2FShaharamir%2Faccess-lens)
[![Share on HN](https://img.shields.io/badge/share%20on-HN-ff6600?style=flat-square)](https://news.ycombinator.com/submitlink?u=https%3A%2F%2Fgithub.com%2FShaharamir%2Faccess-lens&t=Show%20HN%3A%20Access%20Lens%20%E2%80%94%20see%20why%20a%20tenant%20can%27t%20see%20a%20feature%20in%20your%20SaaS%20app)

Tell your support team. They'll thank you.

## 📄 License

[MIT](LICENSE) © Shahar Amir

</div>
