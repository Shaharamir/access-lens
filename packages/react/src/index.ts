export { AccessLensProvider } from "./provider.js";
export type { AccessLensProviderProps } from "./provider.js";

export { AccessGate } from "./access-gate.js";
export type { AccessGateProps } from "./access-gate.js";

export {
  useAccessLens,
  useAccessGate,
  useAccessLensSnapshot,
} from "./hooks.js";
export type { UseAccessGateResult } from "./hooks.js";

export type { AccessLensContextValue } from "./context.js";

export { createReactBindings } from "./bindings.js";

export {
  permission,
  featureFlag,
  entitlement,
  plan,
  tenantConfig,
  condition,
  customReason,
  evaluateAccess,
  AccessLensClient,
  createAccessLensClient,
  defineAccessLens,
} from "@access-lens/core";

export type {
  AccessLens,
  AccessLensConfig,
  AccessNode,
  AccessNodeType,
  AccessReason,
  AccessReasonType,
  AccessSnapshot,
  AccessStatus,
  EvaluateInput,
  FlagApi,
  FlagMap,
  FlagSpec,
  SurfaceIdOf,
} from "@access-lens/core";
