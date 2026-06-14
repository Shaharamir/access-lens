export const STYLE_ID = "access-lens-overlay-styles";

export const OVERLAY_CSS = `
.al-overlay {
  position: fixed;
  bottom: 16px;
  right: 16px;
  z-index: 2147483646;
  font-family: ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, sans-serif;
  font-size: 12px;
  color: #e5e7eb;
}
.al-toggle {
  background: #111827;
  color: #f9fafb;
  border: 1px solid #374151;
  border-radius: 999px;
  padding: 8px 14px;
  cursor: pointer;
  box-shadow: 0 4px 14px rgba(0, 0, 0, 0.25);
  font-weight: 600;
  letter-spacing: 0.02em;
}
.al-toggle:hover { background: #1f2937; }
.al-panel {
  margin-top: 8px;
  width: 360px;
  max-height: 70vh;
  background: #0f172a;
  border: 1px solid #1f2937;
  border-radius: 10px;
  box-shadow: 0 12px 32px rgba(0, 0, 0, 0.45);
  display: flex;
  flex-direction: column;
  overflow: hidden;
}
.al-header {
  padding: 10px 12px;
  border-bottom: 1px solid #1f2937;
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 8px;
}
.al-title { font-weight: 700; color: #f9fafb; }
.al-counts { display: flex; gap: 6px; }
.al-pill {
  font-size: 10px;
  font-weight: 700;
  padding: 2px 6px;
  border-radius: 999px;
  text-transform: uppercase;
  letter-spacing: 0.04em;
}
.al-pill-allowed { background: rgba(34, 197, 94, 0.15); color: #4ade80; }
.al-pill-denied { background: rgba(239, 68, 68, 0.15); color: #f87171; }
.al-pill-unknown { background: rgba(234, 179, 8, 0.15); color: #facc15; }
.al-list { overflow-y: auto; flex: 1; }
.al-group { padding: 6px 12px 4px; }
.al-group-title {
  font-size: 10px;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: #6b7280;
  padding: 6px 0;
}
.al-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 6px 8px;
  border-radius: 6px;
  cursor: pointer;
  gap: 8px;
}
.al-row:hover { background: #1f2937; }
.al-row.selected { background: #1e3a8a40; outline: 1px solid #3b82f6; }
.al-row-label { color: #f3f4f6; flex: 1; min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.al-status-dot {
  width: 8px;
  height: 8px;
  border-radius: 999px;
  flex-shrink: 0;
}
.al-status-allowed { background: #22c55e; }
.al-status-denied { background: #ef4444; }
.al-status-unknown { background: #eab308; }
.al-details {
  border-top: 1px solid #1f2937;
  padding: 10px 12px;
  background: #0b1220;
  max-height: 40%;
  overflow-y: auto;
}
.al-details h4 {
  margin: 0 0 6px;
  font-size: 12px;
  color: #f3f4f6;
  font-weight: 700;
}
.al-reason {
  display: grid;
  grid-template-columns: 12px 1fr;
  gap: 6px;
  padding: 4px 0;
  border-bottom: 1px dashed #1f2937;
}
.al-reason:last-child { border-bottom: none; }
.al-reason-icon { font-weight: 700; }
.al-reason-pass { color: #4ade80; }
.al-reason-fail { color: #f87171; }
.al-reason-body { color: #cbd5e1; }
.al-reason-meta {
  font-size: 10px;
  color: #6b7280;
  margin-top: 2px;
}
.al-empty { padding: 20px 12px; text-align: center; color: #6b7280; }
.al-close-btn {
  background: transparent;
  border: none;
  color: #9ca3af;
  font-size: 14px;
  cursor: pointer;
}
.al-close-btn:hover { color: #f9fafb; }
`;

export function ensureStylesInjected(doc: Document): void {
  if (doc.getElementById(STYLE_ID)) return;
  const style = doc.createElement("style");
  style.id = STYLE_ID;
  style.textContent = OVERLAY_CSS;
  doc.head.appendChild(style);
}
