import type {
  AccessLensClient,
  AccessNode,
  AccessNodeType,
  AccessSnapshot,
} from "@access-lens/core";
import { ensureStylesInjected } from "./styles.js";

export interface AccessLensOverlayOptions {
  title?: string;
  open?: boolean;
  container?: HTMLElement;
  document?: Document;
}

export interface AccessLensOverlayHandle {
  open: () => void;
  close: () => void;
  toggle: () => void;
  destroy: () => void;
  setSnapshot: (snapshot: AccessSnapshot) => void;
}

const TYPE_TITLES: Record<AccessNodeType, string> = {
  route: "Routes",
  sidebar_item: "Sidebar",
  tab: "Tabs",
  button: "Buttons",
  section: "Sections",
  field: "Fields",
  custom: "Custom",
};

const TYPE_ORDER: AccessNodeType[] = [
  "route",
  "sidebar_item",
  "tab",
  "section",
  "button",
  "field",
  "custom",
];

export function createAccessLensOverlay(
  client: AccessLensClient,
  options: AccessLensOverlayOptions = {},
): AccessLensOverlayHandle {
  const doc = options.document ?? document;
  const container = options.container ?? doc.body;
  ensureStylesInjected(doc);

  let isOpen = options.open ?? false;
  let selectedId: string | null = null;
  let snapshot: AccessSnapshot = client.getSnapshot();

  const root = doc.createElement("div");
  root.className = "al-overlay";

  const toggleBtn = doc.createElement("button");
  toggleBtn.className = "al-toggle";
  toggleBtn.type = "button";
  toggleBtn.addEventListener("click", () => {
    isOpen = !isOpen;
    render();
  });
  root.appendChild(toggleBtn);

  const panel = doc.createElement("div");
  panel.className = "al-panel";
  root.appendChild(panel);

  container.appendChild(root);

  const unsubscribe = client.subscribe((next) => {
    snapshot = next;
    render();
  });

  function render() {
    const { counts } = snapshot;
    toggleBtn.textContent = `Access Lens · ${counts.allowed}/${counts.total}`;
    panel.style.display = isOpen ? "flex" : "none";
    if (!isOpen) return;

    panel.innerHTML = "";
    panel.appendChild(renderHeader(snapshot));
    panel.appendChild(renderList(snapshot));
    if (selectedId) {
      const node = snapshot.nodes.find((n) => n.id === selectedId);
      if (node) panel.appendChild(renderDetails(node));
    }
  }

  function renderHeader(snap: AccessSnapshot): HTMLElement {
    const header = doc.createElement("div");
    header.className = "al-header";

    const titleEl = doc.createElement("div");
    titleEl.className = "al-title";
    titleEl.textContent = options.title ?? "Access Lens";
    header.appendChild(titleEl);

    const counts = doc.createElement("div");
    counts.className = "al-counts";
    counts.appendChild(pill("allowed", snap.counts.allowed));
    counts.appendChild(pill("denied", snap.counts.denied));
    if (snap.counts.unknown > 0) {
      counts.appendChild(pill("unknown", snap.counts.unknown));
    }
    header.appendChild(counts);

    const close = doc.createElement("button");
    close.className = "al-close-btn";
    close.type = "button";
    close.textContent = "X";
    close.addEventListener("click", () => {
      isOpen = false;
      render();
    });
    header.appendChild(close);
    return header;
  }

  function pill(kind: "allowed" | "denied" | "unknown", value: number) {
    const el = doc.createElement("span");
    el.className = `al-pill al-pill-${kind}`;
    el.textContent = `${kind} ${value}`;
    return el;
  }

  function renderList(snap: AccessSnapshot): HTMLElement {
    const list = doc.createElement("div");
    list.className = "al-list";

    if (snap.nodes.length === 0) {
      const empty = doc.createElement("div");
      empty.className = "al-empty";
      empty.textContent = "No access nodes registered yet.";
      list.appendChild(empty);
      return list;
    }

    const grouped = groupByType(snap.nodes);
    for (const type of TYPE_ORDER) {
      const nodes = grouped.get(type);
      if (!nodes || nodes.length === 0) continue;
      list.appendChild(renderGroup(type, nodes));
    }
    return list;
  }

  function renderGroup(
    type: AccessNodeType,
    nodes: AccessNode[],
  ): HTMLElement {
    const group = doc.createElement("div");
    group.className = "al-group";
    const title = doc.createElement("div");
    title.className = "al-group-title";
    title.textContent = `${TYPE_TITLES[type]} (${nodes.length})`;
    group.appendChild(title);

    for (const node of nodes) {
      group.appendChild(renderRow(node));
    }
    return group;
  }

  function renderRow(node: AccessNode): HTMLElement {
    const row = doc.createElement("div");
    row.className = "al-row";
    if (selectedId === node.id) row.classList.add("selected");

    const dot = doc.createElement("span");
    dot.className = `al-status-dot al-status-${node.status}`;
    row.appendChild(dot);

    const label = doc.createElement("span");
    label.className = "al-row-label";
    label.textContent = node.label || node.id;
    row.appendChild(label);

    const status = doc.createElement("span");
    status.className = `al-pill al-pill-${node.status}`;
    status.textContent = node.status;
    row.appendChild(status);

    row.addEventListener("click", () => {
      selectedId = selectedId === node.id ? null : node.id;
      render();
    });
    row.addEventListener("mouseenter", () => {
      highlightNode(node.id, true);
    });
    row.addEventListener("mouseleave", () => {
      highlightNode(node.id, false);
    });

    return row;
  }

  function highlightNode(id: string, on: boolean) {
    const els = doc.querySelectorAll(
      `[data-access-lens-id="${cssEscape(id)}"]`,
    );
    els.forEach((el) => {
      const target = el as HTMLElement;
      if (on) {
        target.dataset.accessLensHighlight = "1";
        target.style.boxShadow = "0 0 0 2px #3b82f6";
      } else {
        delete target.dataset.accessLensHighlight;
        target.style.boxShadow = "";
      }
    });
  }

  function renderDetails(node: AccessNode): HTMLElement {
    const details = doc.createElement("div");
    details.className = "al-details";

    const heading = doc.createElement("h4");
    heading.textContent = `${node.label}  ·  ${node.status.toUpperCase()}`;
    details.appendChild(heading);

    if (node.reasons.length === 0) {
      const empty = doc.createElement("div");
      empty.className = "al-empty";
      empty.textContent = "No reasons recorded.";
      details.appendChild(empty);
      return details;
    }

    for (const reason of node.reasons) {
      const row = doc.createElement("div");
      row.className = "al-reason";

      const icon = doc.createElement("span");
      icon.className = `al-reason-icon ${reason.passed ? "al-reason-pass" : "al-reason-fail"}`;
      icon.textContent = reason.passed ? "+" : "-";
      row.appendChild(icon);

      const body = doc.createElement("div");
      body.className = "al-reason-body";
      const labelLine = doc.createElement("div");
      const labelText = reason.label ?? reason.key;
      labelLine.textContent = `${reason.type}: ${labelText}`;
      body.appendChild(labelLine);

      if (reason.message) {
        const msg = doc.createElement("div");
        msg.className = "al-reason-meta";
        msg.textContent = reason.message;
        body.appendChild(msg);
      }
      if (reason.source) {
        const src = doc.createElement("div");
        src.className = "al-reason-meta";
        src.textContent = `source: ${reason.source}`;
        body.appendChild(src);
      }
      if (reason.expected !== undefined || reason.actual !== undefined) {
        const cmp = doc.createElement("div");
        cmp.className = "al-reason-meta";
        cmp.textContent = `expected ${safe(reason.expected)} · actual ${safe(reason.actual)}`;
        body.appendChild(cmp);
      }

      row.appendChild(body);
      details.appendChild(row);
    }
    return details;
  }

  render();

  return {
    open: () => {
      isOpen = true;
      render();
    },
    close: () => {
      isOpen = false;
      render();
    },
    toggle: () => {
      isOpen = !isOpen;
      render();
    },
    setSnapshot: (next) => {
      snapshot = next;
      render();
    },
    destroy: () => {
      unsubscribe();
      if (root.parentElement) root.parentElement.removeChild(root);
    },
  };
}

function groupByType(nodes: AccessNode[]): Map<AccessNodeType, AccessNode[]> {
  const map = new Map<AccessNodeType, AccessNode[]>();
  for (const node of nodes) {
    const arr = map.get(node.type) ?? [];
    arr.push(node);
    map.set(node.type, arr);
  }
  for (const arr of map.values()) {
    arr.sort((a, b) => a.label.localeCompare(b.label));
  }
  return map;
}

function safe(value: unknown): string {
  if (value === undefined) return "undefined";
  if (value === null) return "null";
  if (typeof value === "string") return JSON.stringify(value);
  try {
    return JSON.stringify(value);
  } catch {
    return String(value);
  }
}

function cssEscape(value: string): string {
  if (typeof CSS !== "undefined" && typeof CSS.escape === "function") {
    return CSS.escape(value);
  }
  return value.replace(/["\\]/g, "\\$&");
}
