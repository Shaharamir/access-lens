import type { AccessReason, ReasonOptions } from "./types.js";

function build(
  type: AccessReason["type"],
  key: string,
  passed: boolean,
  options?: ReasonOptions,
): AccessReason {
  const reason: AccessReason = { type, key, passed };
  if (options?.label !== undefined) reason.label = options.label;
  if (options?.source !== undefined) reason.source = options.source;
  if (options?.actual !== undefined) reason.actual = options.actual;
  if (options?.expected !== undefined) reason.expected = options.expected;
  if (options?.message !== undefined) reason.message = options.message;
  return reason;
}

export function permission(
  key: string,
  passed: boolean,
  options?: ReasonOptions,
): AccessReason {
  return build("permission", key, passed, options);
}

export function featureFlag(
  key: string,
  enabled: boolean,
  options?: ReasonOptions,
): AccessReason {
  return build("feature_flag", key, enabled, options);
}

export function entitlement(
  key: string,
  allowed: boolean,
  options?: ReasonOptions,
): AccessReason {
  return build("entitlement", key, allowed, options);
}

export function plan(
  key: string,
  passed: boolean,
  options?: ReasonOptions,
): AccessReason {
  return build("plan", key, passed, options);
}

export function tenantConfig(
  key: string,
  passed: boolean,
  options?: ReasonOptions,
): AccessReason {
  return build("tenant_config", key, passed, options);
}

export function condition(
  label: string,
  passed: boolean,
  options?: ReasonOptions,
): AccessReason {
  const opts: ReasonOptions = { ...(options ?? {}) };
  if (opts.label === undefined) opts.label = label;
  return build("condition", label, passed, opts);
}

export function customReason(
  key: string,
  passed: boolean,
  options?: ReasonOptions,
): AccessReason {
  return build("custom", key, passed, options);
}
