# Install

Access Lens ships three independently versioned packages.

::: code-group

```bash [pnpm]
pnpm add @access-lens/core @access-lens/react
```

```bash [npm]
npm install @access-lens/core @access-lens/react
```

```bash [yarn]
yarn add @access-lens/core @access-lens/react
```

```bash [bun]
bun add @access-lens/core @access-lens/react
```

:::

## What you get

| Package | Size (gzipped) | What's in it | When you need it |
|---|---|---|---|
| `@access-lens/core` | ~10 kB | `defineAccessLens`, `evaluateAccess`, `AccessLensClient`, all reason helpers and types. Zero runtime deps. | Always. |
| `@access-lens/react` | ~6 kB | React adapter — `AccessLensProvider`, `AccessGate`, `useAccessGate`, `useAccessLensSnapshot`, `createReactBindings`. | If you're in React. |
| `@access-lens/dom` | ~11 kB | Framework-agnostic floating debug overlay. No React. | If you're in Vue/Solid/Svelte/vanilla and want a debug overlay. |

::: tip
You don't need `@access-lens/dom` if you're using the React adapter — the React package ships its own richer debug overlay (`AccessLensWidget`) on top of the typed lens.
:::

## Peer dependencies

`@access-lens/react` needs React (works with React 18 or 19):

```json
"peerDependencies": {
  "react": "^18.0.0 || ^19.0.0",
  "react-dom": "^18.0.0 || ^19.0.0"
}
```

## Module format

Every package ships both **ESM** (`import`) and **CJS** (`require`), with full TypeScript declarations for each:

```jsonc
{
  "exports": {
    ".": {
      "types": "./dist/index.d.ts",
      "import": "./dist/index.js",     // ESM
      "require": "./dist/index.cjs"    // CJS
    }
  }
}
```

So you can use Access Lens in **Vite** (ESM), **Next.js** (ESM + RSC), **Jest** (CJS), **Node** (either), or anything else with a modern bundler.

## Node version

`>=18`. We use ES2022 features (top-level await isn't used, but it's the language target).

## Next

- [Quick start](/guide/quick-start) — wire up your first gate in 5 minutes
- [Concepts](/guide/concepts) — the data model
