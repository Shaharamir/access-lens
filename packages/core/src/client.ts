import type {
  AccessLensListener,
  AccessNode,
  AccessSnapshot,
} from "./types.js";

export interface AccessLensClientOptions {
  notifyAsync?: boolean;
}

export class AccessLensClient {
  private nodes = new Map<string, AccessNode>();
  private listeners = new Set<AccessLensListener>();
  private notifyScheduled = false;
  private readonly notifyAsync: boolean;
  private cachedSnapshot: AccessSnapshot | null = null;

  constructor(options: AccessLensClientOptions = {}) {
    this.notifyAsync = options.notifyAsync ?? true;
  }

  registerNode(node: AccessNode): void {
    const existing = this.nodes.get(node.id);
    if (existing && nodesShallowEqual(existing, node)) {
      return;
    }
    this.nodes.set(node.id, node);
    this.cachedSnapshot = null;
    this.scheduleNotify();
  }

  unregisterNode(id: string): void {
    if (this.nodes.delete(id)) {
      this.cachedSnapshot = null;
      this.scheduleNotify();
    }
  }

  getNode(id: string): AccessNode | undefined {
    return this.nodes.get(id);
  }

  /**
   * Returns a referentially-stable snapshot — the SAME object is returned
   * until the registry actually mutates. This is required by React's
   * `useSyncExternalStore`, which would otherwise infinite-loop when the
   * snapshot identity changes on every read.
   */
  getSnapshot(): AccessSnapshot {
    if (this.cachedSnapshot !== null) return this.cachedSnapshot;
    const nodes = Array.from(this.nodes.values());
    let allowed = 0;
    let denied = 0;
    let unknown = 0;
    for (const node of nodes) {
      if (node.status === "allowed") allowed++;
      else if (node.status === "denied") denied++;
      else unknown++;
    }
    const snapshot: AccessSnapshot = {
      nodes,
      counts: {
        allowed,
        denied,
        unknown,
        total: nodes.length,
      },
      generatedAt: Date.now(),
    };
    this.cachedSnapshot = snapshot;
    return snapshot;
  }

  subscribe(listener: AccessLensListener): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  clear(): void {
    if (this.nodes.size === 0) return;
    this.nodes.clear();
    this.cachedSnapshot = null;
    this.scheduleNotify();
  }

  private scheduleNotify(): void {
    if (!this.notifyAsync) {
      this.emit();
      return;
    }
    if (this.notifyScheduled) return;
    this.notifyScheduled = true;
    scheduleMicrotask(() => {
      this.notifyScheduled = false;
      this.emit();
    });
  }

  private emit(): void {
    if (this.listeners.size === 0) return;
    const snapshot = this.getSnapshot();
    for (const listener of this.listeners) {
      try {
        listener(snapshot);
      } catch (err) {
        reportListenerError(err);
      }
    }
  }
}

function nodesShallowEqual(a: AccessNode, b: AccessNode): boolean {
  if (a.id !== b.id) return false;
  if (a.label !== b.label) return false;
  if (a.type !== b.type) return false;
  if (a.status !== b.status) return false;
  if (a.reasons.length !== b.reasons.length) return false;
  for (let i = 0; i < a.reasons.length; i++) {
    const ra = a.reasons[i]!;
    const rb = b.reasons[i]!;
    if (
      ra.type !== rb.type ||
      ra.key !== rb.key ||
      ra.passed !== rb.passed ||
      ra.label !== rb.label ||
      ra.message !== rb.message
    ) {
      return false;
    }
  }
  return true;
}

export function createAccessLensClient(
  options?: AccessLensClientOptions,
): AccessLensClient {
  return new AccessLensClient(options);
}

interface MicrotaskGlobal {
  queueMicrotask?: (cb: () => void) => void;
}

interface ConsoleGlobal {
  console?: { error?: (...args: unknown[]) => void };
}

function scheduleMicrotask(cb: () => void): void {
  const g = globalThis as MicrotaskGlobal;
  if (typeof g.queueMicrotask === "function") {
    g.queueMicrotask(cb);
    return;
  }
  Promise.resolve().then(cb);
}

function reportListenerError(err: unknown): void {
  const g = globalThis as ConsoleGlobal;
  g.console?.error?.("[access-lens] listener threw", err);
}
