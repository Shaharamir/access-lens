export type {
  AccessNode,
  AccessNodeType,
  AccessReason,
  AccessReasonType,
  AccessSnapshot,
  AccessStatus,
  AccessLensListener,
  EvaluateInput,
  ReasonOptions,
} from "./types.js";

export {
  permission,
  featureFlag,
  entitlement,
  plan,
  tenantConfig,
  condition,
  customReason,
} from "./reasons.js";

export {
  evaluateAccess,
  deniedReasons,
  passedReasons,
} from "./evaluate.js";

export {
  AccessLensClient,
  createAccessLensClient,
} from "./client.js";

export type { AccessLensClientOptions } from "./client.js";

export {
  defineAccessLens,
} from "./lens.js";

export type {
  AccessLens,
  AccessLensConfig,
  FlagApi,
  FlagMap,
  FlagSpec,
  SurfaceIdOf,
} from "./lens.js";

export {
  createAccessSet,
  emptyAccessSet,
  AccessSetValidationError,
} from "./access-set.js";

export type {
  AccessSet,
  AccessSetJson,
  FlagRuntimeValue,
} from "./access-set.js";
