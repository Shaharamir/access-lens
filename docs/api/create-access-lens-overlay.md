# createAccessLensOverlay

Framework-agnostic floating debug overlay from `@access-lens/dom`. Use this when your app isn't in React.

## Signature

```ts
function createAccessLensOverlay(
  client: AccessLensClient,
  options?: AccessLensOverlayOptions,
): AccessLensOverlayHandle;

interface AccessLensOverlayOptions {
  title?: string;
  open?: boolean;
  container?: HTMLElement;  // default: document.body
  document?: Document;       // default: window.document
}

interface AccessLensOverlayHandle {
  open(): void;
  close(): void;
  toggle(): void;
  destroy(): void;
  setSnapshot(snapshot: AccessSnapshot): void;
}
```

## Example

```ts
import { createAccessLensClient } from "@access-lens/core";
import { createAccessLensOverlay } from "@access-lens/dom";

const client = createAccessLensClient();
const overlay = createAccessLensOverlay(client, { open: true });

// later:
overlay.destroy();
```

## What it renders

A floating panel with:

- Toggle button showing allowed/total counts.
- Per-type grouping of nodes.
- Click a row → see the full reason list.
- Hover a row → highlights matching `[data-access-lens-id]` elements on the page.

Styles are injected once via a `<style id="access-lens-overlay-styles">` tag; no CSS dependency required.

## See also

- [`@access-lens/dom` README](https://github.com/Shaharamir/access-lens/tree/main/packages/dom)
