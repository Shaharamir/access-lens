# AccessGate (API)

```ts
function AccessGate(props: AccessGateProps): JSX.Element | null;

interface AccessGateProps {
  id: string;
  label: string;
  type: AccessNodeType;
  reasons: AccessReason[];
  children: ReactNode;
  fallback?: ReactNode;
  metadata?: Record<string, unknown>;
}
```

See the [Guide page](/guide/access-gate) for usage, props, render behavior, and the outline color legend.

## When bound via `createReactBindings`

`id` becomes `SurfaceIdOf<typeof lens>` — typed to your declared surfaces.

## See also

- [Guide: AccessGate](/guide/access-gate)
- [createReactBindings](/api/create-react-bindings)
- [Types](/api/types)
