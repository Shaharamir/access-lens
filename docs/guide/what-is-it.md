# What is Access Lens?

A TypeScript SDK that records *every* gated UI decision in a SaaS app — sidebar items, tabs, buttons, routes, fields, anything — with the **combined reason** that produced it.

## The problem

Your SaaS app has feature flags. It has plans. It has entitlements. It has permissions. It has one-off tenant conditions. Five different systems, each owning a slice of "what should this tenant see?", scattered across however many years of incremental decisions your codebase has lived through.

Then a customer support ticket comes in: *"Why can't this merchant see the Payouts page?"*

You spend the next 40 minutes:

1. Open the admin tool. Switch to their tenant.
2. Open the codebase. Find the Payouts sidebar item.
3. Grep for permission checks. Find three.
4. Grep for feature flag checks. Find two more.
5. Check the entitlements table. Manually compute.
6. Realize you missed a `tenant.config` check buried in a hook.
7. Email back: *"It's because flag X is off for your account, which we turned off after the Y incident in March."*

This happens dozens of times a quarter across your team.

## What Access Lens does

Access Lens turns that 40-minute lookup into a `hover`.

Every gated surface (sidebar item, tab, button, etc.) registers a list of **reasons** — typed values from your permissions, plans, entitlements, flags, tenant config, and any custom conditions you care about. A built-in client stores them; a debug overlay surfaces them; React components light up in the color of their gating reason and open a hover-card with the full breakdown plus a **tenants × roles matrix** showing who else can see the same thing.

In production it's invisible — gated surfaces just hide as they always did. In development (or wherever you flip `debugMode`), it's an X-ray of your access-control decisions.

## What it is not

| | |
|---|---|
| ❌ A flag SDK | Use LaunchDarkly, GrowthBook, OpenFeature, or your own. Access Lens *composes* their outputs. |
| ❌ An RBAC library | Use CASL, Casbin, accesscontrol, or hand-rolled checks. Access Lens *observes* their results. |
| ❌ An auth library | Use Auth.js, NextAuth, Clerk. Access Lens runs after the user is authenticated. |
| ❌ A backend permission system | Access Lens is observability layered on top of whatever decides allowed/denied — it doesn't itself decide. |

## Who's it for

- **SaaS frontend teams** with multi-tenant apps where "why doesn't this tenant see X?" is a recurring support escalation.
- **Customer Success / Support teams** who need a self-serve way to debug tenant visibility without reading code.
- **QA** who need to verify access-control changes across the matrix of tenants × roles × flags.
- **PMs** who need to know which tenants are eligible for a feature that's rolling out.

## What you get

- **`defineAccessLens()`** — one source of truth. Permissions, flags, plans, entitlements, surfaces all declared once, autocompleted everywhere. No free strings, no `any`.
- **`AccessGate`** — wrap any gated UI element. Hidden in production, ghost-outlined + hover-inspectable in debug.
- **Live snapshot** — `useAccessLensSnapshot()` returns a stable list of every registered node with its status + reasons. Use it for analytics, support tools, custom inspectors.
- **Floating widget** — drop-in React inspector with filters by type/status/kind plus per-surface tenant × role grid.
- **`@access-lens/dom`** — same debug overlay but plain DOM, no React. For Vue/Svelte/Solid consumers.

## How it composes with the rest of your stack

```
       ┌─────────────────────────────────────────────────────┐
       │                  Your app                            │
       └────────────┬────────────┬───────────┬────────────────┘
                    │            │           │
       ┌────────────▼──┐  ┌──────▼──────┐  ┌─▼─────────────┐
       │ Permission DB │  │ Flag SDK    │  │ Plans/billing │
       │ (RBAC/CASL/…) │  │ (LD/GB/…)   │  │ (Stripe/…)    │
       └────────────┬──┘  └──────┬──────┘  └─┬─────────────┘
                    │            │           │
                    └────────────▼───────────┘
                                 │
                       ┌─────────▼─────────┐
                       │   Access Lens     │
                       │   reasons[]       │
                       └─────────┬─────────┘
                                 │
                       ┌─────────▼─────────┐
                       │   Debug overlay   │
                       │   Snapshot        │
                       │   Matrix          │
                       └───────────────────┘
```

Each input system stays exactly as it is. Access Lens reads their outputs and produces one observable decision per UI surface.

## Next

- [Install →](/guide/install)
- [Quick start →](/guide/quick-start)
- [Concepts →](/guide/concepts)
