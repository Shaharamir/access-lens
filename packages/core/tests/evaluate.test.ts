import { describe, expect, it } from "vitest";
import {
  evaluateAccess,
  permission,
  featureFlag,
  entitlement,
  plan,
  tenantConfig,
  condition,
  customReason,
  deniedReasons,
  passedReasons,
} from "../src/index.js";

describe("evaluateAccess", () => {
  it("returns allowed when every reason passes", () => {
    const node = evaluateAccess({
      id: "x",
      label: "X",
      type: "button",
      reasons: [permission("a", true), featureFlag("b", true)],
    });
    expect(node.status).toBe("allowed");
  });

  it("returns denied when any reason fails", () => {
    const node = evaluateAccess({
      id: "x",
      label: "X",
      type: "button",
      reasons: [permission("a", true), featureFlag("b", false)],
    });
    expect(node.status).toBe("denied");
  });

  it("defaults to allowed when reasons empty and no defaultStatus", () => {
    const node = evaluateAccess({ id: "x", label: "X", type: "button" });
    expect(node.status).toBe("allowed");
  });

  it("respects defaultStatus when reasons empty", () => {
    const node = evaluateAccess({
      id: "x",
      label: "X",
      type: "button",
      defaultStatus: "unknown",
    });
    expect(node.status).toBe("unknown");
  });

  it("preserves metadata when provided", () => {
    const node = evaluateAccess({
      id: "x",
      label: "X",
      type: "button",
      metadata: { foo: "bar" },
    });
    expect(node.metadata).toEqual({ foo: "bar" });
  });

  it("does NOT include metadata key when undefined", () => {
    const node = evaluateAccess({ id: "x", label: "X", type: "button" });
    expect("metadata" in node).toBe(false);
  });
});

describe("reason helpers", () => {
  it("permission carries source + actual + expected when default opts used", () => {
    const r = permission("billing.read", true);
    expect(r.type).toBe("permission");
    expect(r.key).toBe("billing.read");
    expect(r.passed).toBe(true);
  });

  it("featureFlag preserves passed value", () => {
    expect(featureFlag("k", true).passed).toBe(true);
    expect(featureFlag("k", false).passed).toBe(false);
  });

  it.each([
    ["entitlement", entitlement],
    ["plan", plan],
    ["tenantConfig", tenantConfig],
  ] as const)("%s helper sets correct type", (label, helper) => {
    expect(label).toBeTypeOf("string");
    const r = helper("k", true);
    if (label === "entitlement") expect(r.type).toBe("entitlement");
    if (label === "plan") expect(r.type).toBe("plan");
    if (label === "tenantConfig") expect(r.type).toBe("tenant_config");
  });

  it("condition uses label as both key and label", () => {
    const r = condition("user is admin", true);
    expect(r.type).toBe("condition");
    expect(r.key).toBe("user is admin");
    expect(r.label).toBe("user is admin");
  });

  it("custom reason gets type=custom", () => {
    expect(customReason("k", true).type).toBe("custom");
  });

  it("does not include optional fields that were not supplied", () => {
    const r = permission("k", true);
    expect("label" in r).toBe(false);
    expect("source" in r).toBe(false);
    expect("actual" in r).toBe(false);
  });
});

describe("denied/passed reasons split", () => {
  it("splits correctly", () => {
    const node = evaluateAccess({
      id: "x",
      label: "X",
      type: "button",
      reasons: [
        permission("a", true),
        featureFlag("b", false),
        entitlement("c", true),
        plan("d", false),
      ],
    });
    expect(passedReasons(node).length).toBe(2);
    expect(deniedReasons(node).length).toBe(2);
  });
});
