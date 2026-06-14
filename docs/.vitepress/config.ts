import { defineConfig } from "vitepress";

export default defineConfig({
  title: "Access Lens",
  description:
    "See why your UI hides what it hides. Authorization observability for SaaS apps.",
  cleanUrls: true,
  lastUpdated: true,

  markdown: {
    theme: {
      light: "vitesse-light",
      dark: "vitesse-dark",
    },
    lineNumbers: false,
  },

  head: [
    ["link", { rel: "icon", type: "image/svg+xml", href: "/favicon.svg" }],
    ["link", { rel: "icon", type: "image/x-icon", href: "/favicon.ico", sizes: "any" }],
    ["link", { rel: "apple-touch-icon", href: "/apple-touch-icon.png", sizes: "180x180" }],
    ["link", { rel: "manifest", href: "/site.webmanifest" }],
    ["meta", { name: "theme-color", content: "#2563eb" }],
    ["meta", { name: "color-scheme", content: "light dark" }],
    ["meta", { name: "author", content: "Shahar Amir" }],
    [
      "meta",
      {
        name: "description",
        content:
          "Authorization observability for SaaS apps. Typed lens for RBAC, ABAC, PBAC, ReBAC, feature flags, plans, entitlements — hover any gated UI element and see exactly why it's hidden.",
      },
    ],
    [
      "meta",
      {
        name: "keywords",
        content:
          "rbac, abac, pbac, rebac, authorization, access control, feature flags, react permissions, casl, permit.io, openfga, debug overlay, saas, devtools, typescript",
      },
    ],
    ["link", { rel: "canonical", href: "https://access-lens.dev" }],

    [
      "meta",
      {
        property: "og:title",
        content: "Access Lens — see why your UI hides what it hides",
      },
    ],
    [
      "meta",
      {
        property: "og:description",
        content:
          "Authorization observability for SaaS apps. Hover any gated UI element and see exactly why it's hidden, plus which tenants × roles can see it.",
      },
    ],
    ["meta", { property: "og:site_name", content: "Access Lens" }],
    ["meta", { property: "og:type", content: "website" }],
    ["meta", { property: "og:url", content: "https://access-lens.dev" }],
    ["meta", { property: "og:locale", content: "en_US" }],
    [
      "meta",
      { property: "og:image", content: "https://access-lens.dev/og.png" },
    ],
    ["meta", { property: "og:image:width", content: "1200" }],
    ["meta", { property: "og:image:height", content: "630" }],
    [
      "meta",
      {
        property: "og:image:alt",
        content: "Access Lens — typed access observability for SaaS apps",
      },
    ],

    ["meta", { name: "twitter:card", content: "summary_large_image" }],
    [
      "meta",
      {
        name: "twitter:title",
        content: "Access Lens — see why your UI hides what it hides",
      },
    ],
    [
      "meta",
      {
        name: "twitter:description",
        content:
          "Authorization observability for SaaS apps. RBAC, flags, plans, entitlements — explained, observable, debuggable.",
      },
    ],
    [
      "meta",
      {
        name: "twitter:image",
        content: "https://access-lens.dev/og.png",
      },
    ],

    [
      "script",
      { type: "application/ld+json" },
      JSON.stringify({
        "@context": "https://schema.org",
        "@type": "SoftwareApplication",
        name: "Access Lens",
        applicationCategory: "DeveloperApplication",
        operatingSystem: "Web",
        description:
          "Framework-agnostic authorization observability SDK for modern SaaS apps. Typed RBAC/ABAC/PBAC/ReBAC + feature flags + plans + entitlements with a hover-to-explain debug overlay.",
        url: "https://access-lens.dev",
        author: {
          "@type": "Person",
          name: "Shahar Amir",
          url: "https://github.com/Shaharamir",
        },
        license: "https://opensource.org/licenses/MIT",
        codeRepository: "https://github.com/Shaharamir/access-lens",
        offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
      }),
    ],
  ],

  themeConfig: {
    logo: "/logo.svg",

    nav: [
      { text: "Guide", link: "/guide/what-is-it" },
      { text: "API", link: "/api/define-access-lens" },
      { text: "Recipes", link: "/recipes/" },
      { text: "LLM", link: "/llm" },
      { text: "Demo", link: "https://access-lens-demo-react.vercel.app/" },
      {
        text: "0.1.0",
        items: [
          {
            text: "Changelog",
            link: "https://github.com/Shaharamir/access-lens/blob/main/CHANGELOG.md",
          },
          {
            text: "npm · @access-lens/core",
            link: "https://www.npmjs.com/package/@access-lens/core",
          },
          {
            text: "npm · @access-lens/react",
            link: "https://www.npmjs.com/package/@access-lens/react",
          },
        ],
      },
    ],

    sidebar: {
      "/guide/": [
        {
          text: "Getting started",
          items: [
            { text: "What is Access Lens?", link: "/guide/what-is-it" },
            { text: "Install", link: "/guide/install" },
            { text: "Quick start", link: "/guide/quick-start" },
            { text: "Concepts", link: "/guide/concepts" },
            { text: "RBAC / ABAC / PBAC / ReBAC", link: "/guide/access-control-models" },
          ],
        },
        {
          text: "Typed lens",
          items: [
            { text: "defineAccessLens", link: "/guide/define-access-lens" },
            { text: "Permissions", link: "/guide/permissions" },
            { text: "Plans & entitlements", link: "/guide/plans-entitlements" },
            { text: "Feature flags", link: "/guide/feature-flags" },
            { text: "Surfaces", link: "/guide/surfaces" },
          ],
        },
        {
          text: "React adapter",
          items: [
            { text: "AccessLensProvider", link: "/guide/provider" },
            { text: "AccessGate", link: "/guide/access-gate" },
            { text: "Hooks", link: "/guide/hooks" },
            { text: "Debug overlay", link: "/guide/debug-overlay" },
          ],
        },
        {
          text: "Backend integration",
          items: [
            { text: "Overview & patterns", link: "/guide/backend-integration" },
          ],
        },
        {
          text: "Advanced",
          items: [
            { text: "Snapshot inspection", link: "/guide/snapshot" },
            { text: "Custom reasons", link: "/guide/custom-reasons" },
            { text: "Server-side gates", link: "/guide/server-side" },
            { text: "Migrating from untyped helpers", link: "/guide/migration" },
          ],
        },
      ],
      "/api/": [
        {
          text: "Core",
          items: [
            { text: "defineAccessLens", link: "/api/define-access-lens" },
            { text: "evaluateAccess", link: "/api/evaluate-access" },
            { text: "AccessLensClient", link: "/api/client" },
            { text: "Types", link: "/api/types" },
          ],
        },
        {
          text: "React",
          items: [
            { text: "createReactBindings", link: "/api/create-react-bindings" },
            { text: "AccessGate", link: "/api/access-gate" },
            { text: "Hooks", link: "/api/hooks" },
          ],
        },
        {
          text: "DOM",
          items: [
            {
              text: "createAccessLensOverlay",
              link: "/api/create-access-lens-overlay",
            },
          ],
        },
      ],
      "/recipes/": [
        {
          text: "Patterns",
          items: [
            { text: "Overview", link: "/recipes/" },
            { text: "RBAC with permissions", link: "/recipes/rbac" },
            { text: "Feature flag rollout", link: "/recipes/rollout" },
            { text: "Plan-tier gating", link: "/recipes/plans" },
            { text: "Tenant config", link: "/recipes/tenant-config" },
            { text: "Variant routing", link: "/recipes/variant-routing" },
            { text: "Gated select options", link: "/recipes/gated-select" },
          ],
        },
        {
          text: "Backend recipes",
          items: [
            { text: "/me/access endpoint", link: "/recipes/me-access-endpoint" },
            { text: "NestJS", link: "/recipes/nestjs" },
            { text: "Express + CASL", link: "/recipes/express-casl" },
            { text: "Next.js middleware", link: "/recipes/nextjs-middleware" },
            { text: "LaunchDarkly integration", link: "/recipes/launchdarkly" },
          ],
        },
      ],
    },

    socialLinks: [
      { icon: "github", link: "https://github.com/Shaharamir/access-lens" },
      {
        icon: "npm",
        link: "https://www.npmjs.com/package/@access-lens/core",
      },
    ],

    footer: {
      message: "Released under the MIT License.",
      copyright: "Copyright © 2026 Shahar Amir",
    },

    search: {
      provider: "local",
    },

    editLink: {
      pattern:
        "https://github.com/Shaharamir/access-lens/edit/main/docs/:path",
      text: "Edit this page on GitHub",
    },
  },

  sitemap: {
    hostname: "https://access-lens.dev",
  },
});
