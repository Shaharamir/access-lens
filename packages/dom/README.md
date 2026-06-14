# @access-lens/dom

Framework-agnostic debug overlay for Access Lens. Renders a floating panel that lists every access node registered with an `AccessLensClient` and shows the reasons behind each decision.

## Install

```bash
pnpm add @access-lens/dom @access-lens/core
```

## Usage

```ts
import { createAccessLensClient } from "@access-lens/core";
import { createAccessLensOverlay } from "@access-lens/dom";

const client = createAccessLensClient();
const overlay = createAccessLensOverlay(client, { open: true });

// Later, tear it down:
overlay.destroy();
```

The overlay groups nodes by type (route, sidebar_item, tab, button, section, field, custom), shows pass/fail dots, and lets you click a row to inspect the full reason list. Hovering a row also highlights any matching `data-access-lens-id` elements in the page (the React `AccessGate` adds this attribute in debug mode).

No framework dependency, no bundler-specific code — just call the function with any DOM document.
