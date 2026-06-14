# Hooks (API)

## useAccessLens

```ts
function useAccessLens(): {
  client: AccessLensClient;
  debugMode: boolean;
  setDebugMode: (next: boolean) => void;
};
```

Throws if called outside `<AccessLensProvider>`.

## useAccessGate

```ts
function useAccessGate(input: EvaluateInput): {
  node: AccessNode;
  allowed: boolean;
  denied: boolean;
  unknown: boolean;
};
```

Registers a node with the client on mount, updates when reason content changes (shallow-equality by serialized reasons), unregisters on unmount.

## useAccessLensSnapshot

```ts
function useAccessLensSnapshot(): AccessSnapshot;
```

Subscribes via `useSyncExternalStore`. Re-renders only when the snapshot identity changes — see [`AccessLensClient.getSnapshot`](/api/client) for the caching contract.

## See also

- [Guide: hooks](/guide/hooks)
- [Provider](/guide/provider)
