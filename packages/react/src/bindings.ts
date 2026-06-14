import type { JSX } from "react";
import type { EvaluateInput, SurfaceIdOf } from "@access-lens/core";
import { AccessGate as RawAccessGate, type AccessGateProps } from "./access-gate.js";
import {
  useAccessGate as rawUseAccessGate,
  useAccessLens as rawUseAccessLens,
  useAccessLensSnapshot as rawUseAccessLensSnapshot,
  type UseAccessGateResult,
} from "./hooks.js";
import { AccessLensProvider } from "./provider.js";

/**
 * Bind the framework-agnostic React adapter to a specific lens so that
 * `AccessGate#id` and `useAccessGate#input.id` auto-complete to the surfaces
 * you declared in `defineAccessLens({ surfaces })`. The runtime is identical
 * to the un-bound exports — only the TypeScript types narrow.
 *
 * @example
 * ```ts
 * // access-lens.ts
 * import { defineAccessLens } from "@access-lens/core";
 * import { createReactBindings } from "@access-lens/react";
 *
 * export const al = defineAccessLens({
 *   permissions: ["billing.read"] as const,
 *   entitlements: ["billing"] as const,
 *   plans: ["free", "enterprise"] as const,
 *   flags: { billing_v2: { kind: "boolean" } },
 *   surfaces: ["sidebar.billing", "tab.reports"] as const,
 * });
 *
 * export const { AccessLensProvider, AccessGate, useAccessGate, useAccessLensSnapshot, useAccessLens } =
 *   createReactBindings(al);
 *
 * // In components — `id` autocompletes, unknown id is a compile error:
 * <AccessGate id="sidebar.billing" type="sidebar_item" label="Billing"
 *   reasons={[al.permission("billing.read", true), al.flag.billing_v2.on(true)]}>
 *   <a href="/billing">Billing</a>
 * </AccessGate>
 * ```
 */
export function createReactBindings<TLens>(_lens: TLens) {
  type Sid = SurfaceIdOf<TLens>;

  type TypedAccessGate = (
    props: Omit<AccessGateProps, "id"> & { id: Sid },
  ) => JSX.Element | null;

  type TypedUseAccessGate = (
    input: Omit<EvaluateInput, "id"> & { id: Sid },
  ) => UseAccessGateResult;

  return {
    AccessLensProvider,
    AccessGate: RawAccessGate as unknown as TypedAccessGate,
    useAccessGate: rawUseAccessGate as unknown as TypedUseAccessGate,
    useAccessLensSnapshot: rawUseAccessLensSnapshot,
    useAccessLens: rawUseAccessLens,
  };
}
