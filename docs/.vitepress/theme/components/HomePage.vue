<script setup lang="ts">
import HeroRotator from "./HeroRotator.vue";
import MiniDemo from "./MiniDemo.vue";
import MatrixDemo from "./MatrixDemo.vue";
</script>

<template>
  <div class="page">
    <!-- ===== Hero ===== -->
    <section class="hero">
      <div class="hero-copy">
        <div class="eyebrow">
          <img src="/logo.svg" alt="" width="32" height="32" />
          <span>Access Lens</span>
          <span class="eyebrow-version">v0.1</span>
        </div>

        <h1 class="title">
          Stop guessing why<br />
          a tenant <span class="gradient">can't see</span> things.
        </h1>

        <HeroRotator />

        <p class="lede">
          Hover any gated UI element. See the exact reason it's hidden — and
          which tenants × roles can see it. One <code>defineAccessLens</code>
          call. Headless TypeScript core. Works with whatever auth, plan, and
          flag system you already use.
        </p>

        <div class="actions">
          <a class="btn-primary" href="/guide/quick-start">
            Get started
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg>
          </a>
          <a class="btn-secondary" href="https://access-lens-demo-react.vercel.app/">
            Live demo
          </a>
          <a class="btn-ghost" href="https://github.com/Shaharamir/access-lens" target="_blank" rel="noopener">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.4 3-.405 1.02.005 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12"/></svg>
            GitHub
          </a>
        </div>

        <div class="meta">
          <span><strong>10 kB</strong> gzipped core</span>
          <span class="dot">·</span>
          <span><strong>0</strong> runtime deps</span>
          <span class="dot">·</span>
          <span><strong>42</strong> tests</span>
          <span class="dot">·</span>
          <span>React 18 / 19</span>
        </div>
      </div>

      <div class="hero-demo">
        <div class="demo-frame">
          <MiniDemo />
        </div>
        <div class="demo-caption">
          <span class="kbd">↑</span>
          Interactive — toggle Debug, switch tenant, hover items
        </div>
      </div>
    </section>

    <!-- ===== Three-up value cards ===== -->
    <section class="features">
      <article class="feature">
        <div class="feature-icon"><img src="/icons/target.svg" alt="" width="24" height="24" /></div>
        <h3>Typed end-to-end</h3>
        <p>
          One <code>defineAccessLens</code> call. Every key autocompletes.
          Typos and wrong flag kinds are <strong>compile errors</strong>.
        </p>
      </article>
      <article class="feature">
        <div class="feature-icon"><img src="/icons/search.svg" alt="" width="24" height="24" /></div>
        <h3>Live debug overlay</h3>
        <p>
          Hover any gated surface for the reason graph and a
          <strong>tenants × roles matrix</strong> showing who else can see it.
        </p>
      </article>
      <article class="feature">
        <div class="feature-icon"><img src="/icons/puzzle.svg" alt="" width="24" height="24" /></div>
        <h3>No vendor lock-in</h3>
        <p>
          Wraps your existing auth, plan, and flag systems. Doesn't replace
          them. RBAC, ABAC, PBAC, ReBAC all compose.
        </p>
      </article>
    </section>

    <!-- ===== Code preview ===== -->
    <section class="snippet">
      <div class="snippet-header">
        <span class="section-eyebrow">The 30-second tour</span>
        <h2>One config. Every call site typed.</h2>
        <p>
          Declare your permissions, plans, entitlements, and flag kinds in one
          place. Every reason builder downstream autocompletes from this
          declaration — and rejects unknown keys at compile time.
        </p>
      </div>

      <div class="snippet-grid">
        <div class="snippet-card">
          <div class="snippet-label">access-lens.ts · the registry</div>
          <pre class="code">
<span class="c">// declare once, autocomplete everywhere</span>
<span class="k">import</span> { defineAccessLens } <span class="k">from</span> <span class="s">"@access-lens/core"</span>;

<span class="k">export const</span> al = <span class="f">defineAccessLens</span>({
  permissions: [<span class="s">"billing.read"</span>] <span class="k">as const</span>,
  entitlements: [<span class="s">"billing"</span>] <span class="k">as const</span>,
  plans: [<span class="s">"free"</span>, <span class="s">"growth"</span>, <span class="s">"enterprise"</span>] <span class="k">as const</span>,
  flags: {
    billing_v2: { kind: <span class="s">"boolean"</span> },
  },
});
</pre>
        </div>

        <div class="snippet-card">
          <div class="snippet-label">App.tsx · the gate</div>
          <pre class="code">
<span class="t">&lt;AccessGate</span>
  <span class="a">id</span>=<span class="s">"sidebar.billing"</span>
  <span class="a">type</span>=<span class="s">"sidebar_item"</span>
  <span class="a">label</span>=<span class="s">"Billing"</span>
  <span class="a">reasons</span>={[
    al.<span class="f">permission</span>(<span class="s">"billing.read"</span>, user.perms.<span class="f">has</span>(<span class="s">"billing.read"</span>)),
    al.flag.billing_v2.<span class="f">on</span>(flags.billing_v2.on),
    al.<span class="f">entitlement</span>(<span class="s">"billing"</span>, tenant.entitlements.billing),
    al.plan.<span class="f">atLeast</span>(<span class="s">"growth"</span>, tenant.plan),
  ]}
<span class="t">&gt;</span>
  <span class="t">&lt;a</span> <span class="a">href</span>=<span class="s">"/billing"</span><span class="t">&gt;</span>Billing<span class="t">&lt;/a&gt;</span>
<span class="t">&lt;/AccessGate&gt;</span>
</pre>
        </div>
      </div>
    </section>

    <!-- ===== Access control models ===== -->
    <section class="models">
      <div class="models-header">
        <span class="section-eyebrow">Composes with every model</span>
        <h2>RBAC, ABAC, PBAC, ReBAC — pick your engine.</h2>
        <p>Access Lens isn't an authorization system. It's the observability layer over whichever engine you use.</p>
      </div>

      <div class="models-grid">
        <article class="model">
          <span class="model-kicker">RBAC</span>
          <h3>Role-based</h3>
          <p>"Who you are" — roles and permission grants.</p>
          <span class="badge badge-full">Native</span>
        </article>
        <article class="model">
          <span class="model-kicker">ABAC</span>
          <h3>Attribute-based</h3>
          <p>Who / what / when / where attributes.</p>
          <span class="badge badge-full">Native</span>
        </article>
        <article class="model">
          <span class="model-kicker">PBAC</span>
          <h3>Policy-based</h3>
          <p>Rules in OPA, Cedar, Permify.</p>
          <span class="badge badge-partial">Via integration</span>
        </article>
        <article class="model">
          <span class="model-kicker">ReBAC</span>
          <h3>Relationship-based</h3>
          <p>SpiceDB, OpenFGA, Zanzibar.</p>
          <span class="badge badge-partial">Via integration</span>
        </article>
      </div>

      <div class="models-link">
        <a href="/guide/access-control-models">Full breakdown of each model →</a>
      </div>
    </section>

    <!-- ===== Matrix demo ===== -->
    <section class="matrix-section">
      <div class="matrix-header">
        <span class="section-eyebrow">Tenants × Roles</span>
        <h2>One surface. Every combo. Real reasons.</h2>
        <p>
          Pick a surface. Every cell evaluates the actual reasons against that
          tenant + role pair. Hover to see what passed and what didn't — the
          same data the live debug overlay surfaces in your app.
        </p>
      </div>
      <MatrixDemo />
    </section>

    <!-- ===== Final CTA ===== -->
    <section class="final">
      <h2>Ship it.</h2>
      <p>Three packages. Dual ESM/CJS. 22 kB tarball. Live in 5 minutes.</p>
      <div class="actions actions-centered">
        <a class="btn-primary" href="/guide/quick-start">
          Get started
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg>
        </a>
        <a class="btn-secondary" href="/llm">Copy LLM context</a>
      </div>
    </section>
  </div>
</template>

<style scoped>
/* ============================================================
   PAGE — flat, generous spacing, max-width container
   ============================================================ */

.page {
  max-width: 1180px;
  margin: 0 auto;
  padding: 1.5rem 1.5rem 6rem;
  color: var(--vp-c-text-1);
}

section {
  margin: 6rem 0;
}
section:first-child { margin-top: 2.5rem; }

/* ============================================================
   HERO
   ============================================================ */

.hero {
  display: grid;
  grid-template-columns: minmax(0, 1.05fr) minmax(0, 0.95fr);
  gap: 4rem;
  align-items: center;
}

@media (max-width: 960px) {
  .hero { grid-template-columns: 1fr; gap: 3rem; }
}

.hero-copy {
  display: flex;
  flex-direction: column;
  gap: 1.3rem;
}

.eyebrow {
  display: inline-flex;
  align-items: center;
  gap: 0.65rem;
  font-weight: 700;
  font-size: 0.9rem;
  letter-spacing: -0.005em;
  color: var(--vp-c-text-2);
}
.eyebrow img {
  border-radius: 8px;
}
.eyebrow-version {
  font-family: var(--vp-font-family-mono);
  font-size: 0.7rem;
  font-weight: 600;
  padding: 0.1rem 0.4rem;
  border-radius: 4px;
  background: var(--vp-c-bg-soft);
  border: 1px solid var(--vp-c-divider);
  color: var(--vp-c-text-3);
  text-transform: uppercase;
  letter-spacing: 0.04em;
}

.title {
  margin: 0;
  font-size: clamp(2.4rem, 4.6vw, 3.8rem);
  font-weight: 800;
  line-height: 1.02;
  letter-spacing: -0.04em;
  color: var(--vp-c-text-1);
}

.gradient {
  background: linear-gradient(
    90deg,
    var(--al-accent-from),
    var(--al-accent-via),
    var(--al-accent-to),
    var(--al-accent-via),
    var(--al-accent-from)
  );
  background-size: 200% 100%;
  -webkit-background-clip: text;
  background-clip: text;
  color: transparent;
  animation: al-shimmer 14s ease-in-out infinite;
}

.lede {
  margin: 0;
  font-size: 1.05rem;
  line-height: 1.6;
  color: var(--vp-c-text-2);
  max-width: 36rem;
}

.lede code {
  font-family: var(--vp-font-family-mono);
  font-size: 0.88em;
  padding: 0.12em 0.4em;
  border-radius: 5px;
  background: var(--vp-c-brand-soft);
  color: var(--vp-c-brand-1);
  border: 1px solid transparent;
  font-weight: 500;
}

/* Actions */
.actions {
  display: flex;
  flex-wrap: wrap;
  gap: 0.6rem;
  margin-top: 0.4rem;
}
.actions-centered { justify-content: center; }

.btn-primary,
.btn-secondary,
.btn-ghost {
  display: inline-flex;
  align-items: center;
  gap: 0.45rem;
  padding: 0.6rem 1.1rem;
  border-radius: 9px;
  font-weight: 600;
  font-size: 0.92rem;
  text-decoration: none;
  border: 1px solid transparent;
  transition:
    transform 140ms ease,
    background 140ms ease,
    border-color 140ms ease,
    box-shadow 140ms ease,
    color 140ms ease;
  cursor: pointer;
}

.btn-primary {
  background: var(--vp-c-text-1);
  color: var(--vp-c-bg);
  box-shadow: 0 1px 0 rgba(255, 255, 255, 0.08) inset;
}
.btn-primary:hover {
  transform: translateY(-1px);
  background: var(--vp-c-text-2);
}
.btn-primary svg {
  transition: transform 140ms ease;
}
.btn-primary:hover svg {
  transform: translateX(2px);
}

.btn-secondary {
  background: var(--vp-c-bg);
  color: var(--vp-c-text-1);
  border-color: var(--vp-c-divider);
}
.btn-secondary:hover {
  border-color: var(--vp-c-text-2);
}

.btn-ghost {
  background: transparent;
  color: var(--vp-c-text-2);
  padding: 0.6rem 0.9rem;
}
.btn-ghost:hover {
  background: var(--vp-c-bg-soft);
  color: var(--vp-c-text-1);
}

/* Meta */
.meta {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.55rem;
  margin-top: 0.6rem;
  font-size: 0.85rem;
  color: var(--vp-c-text-3);
}
.meta strong {
  color: var(--vp-c-text-1);
  font-weight: 700;
}
.dot { opacity: 0.45; }

/* Hero demo */
.hero-demo {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.8rem;
  position: relative;
}
.demo-frame {
  width: 100%;
  position: relative;
}
.demo-frame::before {
  content: "";
  position: absolute;
  inset: -30px;
  background: radial-gradient(60% 60% at 50% 50%, var(--al-glow), transparent 70%);
  z-index: 0;
  pointer-events: none;
}
.demo-frame > * {
  position: relative;
  z-index: 1;
}
.demo-caption {
  font-size: 0.78rem;
  color: var(--vp-c-text-3);
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
}
.kbd {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-family: var(--vp-font-family-mono);
  font-size: 0.7rem;
  font-weight: 600;
  padding: 0.05rem 0.35rem;
  border-radius: 4px;
  background: var(--vp-c-bg-soft);
  border: 1px solid var(--vp-c-divider);
  border-bottom-width: 2px;
}

/* ============================================================
   FEATURES — 3 flat cards
   ============================================================ */

.features {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 1rem;
}
@media (max-width: 800px) {
  .features { grid-template-columns: 1fr; }
}

.feature {
  padding: 1.6rem 1.5rem;
  border: 1px solid var(--vp-c-divider);
  border-radius: 14px;
  background: var(--vp-c-bg);
  transition: border-color 200ms ease, transform 200ms ease;
}
.feature:hover {
  border-color: var(--vp-c-text-3);
  transform: translateY(-2px);
}

.feature-icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 42px;
  height: 42px;
  border-radius: 10px;
  background: var(--vp-c-bg-soft);
  border: 1px solid var(--vp-c-divider);
  color: var(--vp-c-text-1);
  margin-bottom: 1rem;
}

.feature h3 {
  margin: 0 0 0.4rem;
  font-size: 1.05rem;
  font-weight: 700;
  letter-spacing: -0.01em;
  color: var(--vp-c-text-1);
}

.feature p {
  margin: 0;
  font-size: 0.92rem;
  line-height: 1.55;
  color: var(--vp-c-text-2);
}

.feature code {
  font-family: var(--vp-font-family-mono);
  font-size: 0.85em;
  padding: 0.08em 0.32em;
  border-radius: 4px;
  background: var(--vp-c-bg-soft);
  border: 1px solid var(--vp-c-divider);
}

/* ============================================================
   SECTION HEADERS — eyebrow + h2 + lede
   ============================================================ */

.section-eyebrow {
  display: inline-block;
  font-family: var(--vp-font-family-mono);
  font-size: 0.72rem;
  font-weight: 600;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: var(--vp-c-brand-1);
  margin-bottom: 0.8rem;
}

.snippet-header h2,
.models-header h2,
.matrix-header h2 {
  margin: 0 0 0.8rem;
  font-size: clamp(1.7rem, 3.2vw, 2.4rem);
  font-weight: 800;
  line-height: 1.1;
  letter-spacing: -0.03em;
  color: var(--vp-c-text-1);
}

.snippet-header p,
.models-header p,
.matrix-header p {
  margin: 0 0 2rem;
  font-size: 1rem;
  color: var(--vp-c-text-2);
  max-width: 42rem;
  line-height: 1.6;
}

.matrix-section {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

/* ============================================================
   SNIPPET — two side-by-side hand-styled code cards
   ============================================================ */

.snippet-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;
}
@media (max-width: 880px) {
  .snippet-grid { grid-template-columns: 1fr; }
}

.snippet-card {
  border: 1px solid var(--vp-c-divider);
  border-radius: 14px;
  background: var(--al-code-bg, #f7f7f8);
  overflow: hidden;
}

.snippet-label {
  display: flex;
  align-items: center;
  padding: 0.6rem 1rem;
  font-family: var(--vp-font-family-mono);
  font-size: 0.72rem;
  font-weight: 600;
  letter-spacing: 0.04em;
  color: var(--vp-c-text-3);
  border-bottom: 1px solid var(--vp-c-divider);
  background: var(--vp-c-bg);
}

.code {
  margin: 0;
  padding: 1rem 1.25rem !important;
  font-family: var(--vp-font-family-mono);
  font-size: 12.5px;
  line-height: 1.65;
  color: var(--vp-c-text-1);
  white-space: pre;
  overflow-x: auto;
  background: transparent !important;
}

/* Hand-tinted tokens */
.code .c { color: var(--vp-c-text-3); font-style: italic; }
.code .k { color: #8250df; }
.code .s { color: #0a3069; }
.code .f { color: #6f42c1; }
.code .t { color: #116329; }
.code .a { color: #0550ae; }
:global(.dark) .code .c { color: #6e7681; }
:global(.dark) .code .k { color: #d2a8ff; }
:global(.dark) .code .s { color: #a5d6ff; }
:global(.dark) .code .f { color: #d2a8ff; }
:global(.dark) .code .t { color: #7ee787; }
:global(.dark) .code .a { color: #79c0ff; }

/* ============================================================
   MODELS — 4-column grid of access-control model cards
   ============================================================ */

.models-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 0.85rem;
}
@media (max-width: 900px) {
  .models-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); }
}

.model {
  padding: 1.2rem;
  border: 1px solid var(--vp-c-divider);
  border-radius: 12px;
  background: var(--vp-c-bg);
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  transition: border-color 200ms ease, transform 200ms ease;
}
.model:hover {
  border-color: var(--vp-c-text-3);
  transform: translateY(-2px);
}

.model-kicker {
  font-family: var(--vp-font-family-mono);
  font-size: 0.72rem;
  font-weight: 700;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: var(--vp-c-text-3);
}

.model h3 {
  margin: 0;
  font-size: 1rem;
  font-weight: 700;
  letter-spacing: -0.01em;
  color: var(--vp-c-text-1);
}

.model p {
  margin: 0 0 auto;
  font-size: 0.85rem;
  color: var(--vp-c-text-2);
  line-height: 1.5;
}

.badge {
  display: inline-flex;
  width: fit-content;
  padding: 0.15rem 0.5rem;
  border-radius: 6px;
  font-size: 0.7rem;
  font-weight: 600;
  letter-spacing: 0.01em;
  margin-top: 0.3rem;
}
.badge-full {
  background: rgba(16, 185, 129, 0.14);
  color: #047857;
}
.badge-partial {
  background: rgba(245, 158, 11, 0.18);
  color: #b45309;
}
:global(.dark) .badge-full { color: #34d399; }
:global(.dark) .badge-partial { color: #fbbf24; }

.models-link {
  text-align: center;
  margin-top: 1.5rem;
}
.models-link a {
  color: var(--vp-c-brand-1);
  font-weight: 600;
  text-decoration: none;
  font-size: 0.95rem;
}
.models-link a:hover {
  text-decoration: underline;
}

/* ============================================================
   FINAL CTA
   ============================================================ */

.final {
  text-align: center;
  padding: 4rem 1rem 3rem;
  border-top: 1px solid var(--vp-c-divider);
  margin-bottom: 0 !important;
}

.final h2 {
  margin: 0 0 0.5rem;
  font-size: clamp(2rem, 3.6vw, 2.6rem);
  font-weight: 800;
  letter-spacing: -0.03em;
}

.final p {
  margin: 0 0 1.5rem;
  color: var(--vp-c-text-2);
  font-size: 1rem;
}

/* ============================================================
   GRADIENT shimmer (shared with hero rotator)
   ============================================================ */

@keyframes al-shimmer {
  0%, 100% { background-position: 0% 50%; }
  50%      { background-position: 100% 50%; }
}
</style>
