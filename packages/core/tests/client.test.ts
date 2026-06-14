import { describe, expect, it, vi } from "vitest";
import {
  AccessLensClient,
  createAccessLensClient,
  evaluateAccess,
  permission,
} from "../src/index.js";

function node(id: string, passed: boolean) {
  return evaluateAccess({
    id,
    label: id,
    type: "button",
    reasons: [permission("k", passed)],
  });
}

describe("AccessLensClient", () => {
  it("registers and exposes nodes", () => {
    const c = createAccessLensClient({ notifyAsync: false });
    c.registerNode(node("a", true));
    c.registerNode(node("b", false));
    const snap = c.getSnapshot();
    expect(snap.nodes).toHaveLength(2);
    expect(snap.counts.allowed).toBe(1);
    expect(snap.counts.denied).toBe(1);
    expect(snap.counts.total).toBe(2);
  });

  it("unregisters", () => {
    const c = createAccessLensClient({ notifyAsync: false });
    c.registerNode(node("a", true));
    c.unregisterNode("a");
    expect(c.getSnapshot().nodes).toHaveLength(0);
  });

  it("clear() empties everything", () => {
    const c = createAccessLensClient({ notifyAsync: false });
    c.registerNode(node("a", true));
    c.registerNode(node("b", false));
    c.clear();
    expect(c.getSnapshot().counts.total).toBe(0);
  });

  it("getSnapshot returns the SAME reference until state changes (caching)", () => {
    const c = createAccessLensClient({ notifyAsync: false });
    c.registerNode(node("a", true));
    const first = c.getSnapshot();
    const second = c.getSnapshot();
    expect(first).toBe(second); // referential equality
  });

  it("getSnapshot returns a NEW reference after a registry change", () => {
    const c = createAccessLensClient({ notifyAsync: false });
    c.registerNode(node("a", true));
    const before = c.getSnapshot();
    c.registerNode(node("b", false));
    const after = c.getSnapshot();
    expect(before).not.toBe(after);
  });

  it("registerNode dedups identical content (keeps snapshot cached)", () => {
    const c = createAccessLensClient({ notifyAsync: false });
    c.registerNode(node("a", true));
    const before = c.getSnapshot();
    c.registerNode(node("a", true)); // same content, new object identity
    const after = c.getSnapshot();
    expect(before).toBe(after); // snapshot identity preserved by dedup
  });

  it("invalidates cache when reason status changes", () => {
    const c = createAccessLensClient({ notifyAsync: false });
    c.registerNode(node("a", true));
    const before = c.getSnapshot();
    c.registerNode(node("a", false)); // same id, different passed
    const after = c.getSnapshot();
    expect(before).not.toBe(after);
    expect(after.counts.denied).toBe(1);
  });

  it("subscribe + unsubscribe", () => {
    const c = createAccessLensClient({ notifyAsync: false });
    const listener = vi.fn();
    const unsubscribe = c.subscribe(listener);
    c.registerNode(node("a", true));
    expect(listener).toHaveBeenCalledTimes(1);
    unsubscribe();
    c.registerNode(node("b", true));
    expect(listener).toHaveBeenCalledTimes(1);
  });

  it("sync mode emits immediately", () => {
    const c = new AccessLensClient({ notifyAsync: false });
    const listener = vi.fn();
    c.subscribe(listener);
    c.registerNode(node("a", true));
    expect(listener).toHaveBeenCalledTimes(1);
  });

  it("async mode batches via microtask", async () => {
    const c = new AccessLensClient({ notifyAsync: true });
    const listener = vi.fn();
    c.subscribe(listener);
    c.registerNode(node("a", true));
    c.registerNode(node("b", true));
    c.registerNode(node("c", false));
    expect(listener).toHaveBeenCalledTimes(0); // not yet
    await Promise.resolve(); // flush microtasks
    expect(listener).toHaveBeenCalledTimes(1); // batched
  });

  it("listener error does not crash subsequent listeners", () => {
    const c = new AccessLensClient({ notifyAsync: false });
    const boom = vi.fn(() => {
      throw new Error("boom");
    });
    const ok = vi.fn();
    c.subscribe(boom);
    c.subscribe(ok);
    c.registerNode(node("a", true));
    expect(boom).toHaveBeenCalled();
    expect(ok).toHaveBeenCalled();
  });
});
