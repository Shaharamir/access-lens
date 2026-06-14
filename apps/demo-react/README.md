# @access-lens/demo-react

Demo app for Access Lens.

## Run

```bash
pnpm install
pnpm --filter @access-lens/demo-react dev
```

Open `http://localhost:5173`.

## What to try

- Pick **Acme Marketplace + Admin** — most things are allowed.
- Switch to **Small Shop + Viewer** — most things are hidden.
- Flip the **Debug mode** toggle — hidden UI now renders as dashed ghosts, hovering them shows a tooltip with the failed reasons, and a floating panel lists every registered access node.
- Toggle individual feature flags — UI updates instantly and the overlay snapshot follows.
