# Changelog

All notable changes to Access Lens are documented in this file.

The format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/) and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.1.0] - 2026-06-14

Initial public release.

### Added
- `@access-lens/core` — framework-agnostic, headless lens + client + evaluator (10 kB gz, zero runtime deps)
- `@access-lens/react` — React 18/19 bindings: `AccessLensProvider`, `AccessGate`, `useAccessGate`, `useAccessLensSnapshot`, debug overlay outlines (6 kB gz)
- `@access-lens/dom` — framework-agnostic floating debug overlay via `createAccessLensOverlay` (11 kB gz)
- Typed `defineAccessLens` configuration with const generics — permissions, plans, entitlements, flags (5 kinds), surfaces all autocomplete and reject unknown keys at compile time
- Five flag kinds: `boolean`, `variant`, `percent`, `date`, `killswitch` — each with its own typed methods
- Access control model coverage — RBAC and ABAC native, PBAC and ReBAC via `al.custom()` integration
- Snapshot inspection — referentially stable, compatible with `useSyncExternalStore`
- VitePress documentation site with full guide, API reference, recipes, and copy-paste LLM context
- `llms.txt` and `llms-full.txt` at root for IDE auto-discovery
- Interactive demo app showcasing tenants × roles × flags switching

### Docs
- 11 backend integration recipes (NestJS, Express + CASL, Next.js middleware, LaunchDarkly, `/me/access` endpoint)
- 6 frontend pattern recipes (RBAC, rollout, plan-tier gating, tenant config, variant routing, gated select)
- Access control models guide — RBAC / ABAC / PBAC / ReBAC compatibility breakdown
- Backend integration overview — four wiring patterns and how to choose

[0.1.0]: https://github.com/Shaharamir/access-lens/releases/tag/v0.1.0
