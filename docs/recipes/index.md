# Recipes

Copy-paste patterns for the common SaaS access-control problems.

## Frontend patterns

| Recipe | Problem it solves |
|---|---|
| [RBAC with permissions](/recipes/rbac) | "Some users can read, some can write, some can export, some can delete." |
| [Feature flag rollout](/recipes/rollout) | "We're rolling out X to 25% of tenants this week, 50% next week, all by Q3." |
| [Plan-tier gating](/recipes/plans) | "This feature is for growth+ customers; that one is enterprise-only." |
| [Tenant config](/recipes/tenant-config) | "Show this only to legacy tenants. Hide that from EU tenants." |
| [Variant routing](/recipes/variant-routing) | "Same tab leads to different screens for different cohorts." |
| [Gated select options](/recipes/gated-select) | "The Actions dropdown shows different items per role; in debug, denied options keep their slot dashed." |

## Backend integration recipes

| Recipe | Problem it solves |
|---|---|
| [`/me/access` endpoint](/recipes/me-access-endpoint) | "Where does the React app actually get the permission booleans from?" |
| [NestJS](/recipes/nestjs) | "Wire it up end-to-end with controllers, DTOs, and shared types." |
| [Express + CASL](/recipes/express-casl) | "We already use CASL — how do we connect it to Access Lens?" |
| [Next.js middleware](/recipes/nextjs-middleware) | "Server-side route guards that register into the same client the React app reads from." |
| [LaunchDarkly integration](/recipes/launchdarkly) | "Use LD for flag evaluation, Access Lens for the combined decision." |

See also: [Backend integration overview](/guide/backend-integration) — the four wiring patterns and how to choose between them.

Want a recipe that's not here? [Open an issue](https://github.com/shahar-amir/access-lens/issues/new?template=recipe-request.md) — every recurring SaaS pattern is fair game.
