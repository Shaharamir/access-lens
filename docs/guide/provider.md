# AccessLensProvider

The React context provider that hosts the `AccessLensClient` your gates register into. Mount it once near the top of your app tree.

## Basic usage

```tsx
import { AccessLensProvider } from "./access-lens.js";

export function App() {
  return (
    <AccessLensProvider defaultDebugMode={import.meta.env.DEV}>
      <YourApp />
    </AccessLensProvider>
  );
}
```

## Props

| Prop | Type | Default | Description |
|---|---|---|---|
| `defaultDebugMode` | `boolean` | `false` | Initial debug-mode state (uncontrolled). |
| `debugMode` | `boolean` | — | Controlled debug-mode state. Pass when you want to drive it from outside. |
| `onDebugModeChange` | `(next: boolean) => void` | — | Called when debug mode changes. |
| `client` | `AccessLensClient` | auto-created | Bring your own client (e.g. for server-side hydration). |

## Uncontrolled

```tsx
<AccessLensProvider defaultDebugMode={true}>
  <YourApp />
</AccessLensProvider>
```

Inside any descendant component:

```tsx
const { debugMode, setDebugMode } = useAccessLens();
<button onClick={() => setDebugMode(!debugMode)}>Toggle debug</button>;
```

## Controlled

```tsx
const [debug, setDebug] = useState(false);

<AccessLensProvider debugMode={debug} onDebugModeChange={setDebug}>
  <YourApp />
</AccessLensProvider>;
```

## Custom client

Useful when you have a pre-populated snapshot from the server.

```tsx
import { createAccessLensClient } from "@access-lens/core";

const client = createAccessLensClient();
// Pre-register server-side nodes here…

<AccessLensProvider client={client}>
  <YourApp />
</AccessLensProvider>;
```

## See also

- [AccessGate](/guide/access-gate)
- [Hooks](/guide/hooks)
- [Debug overlay](/guide/debug-overlay)
