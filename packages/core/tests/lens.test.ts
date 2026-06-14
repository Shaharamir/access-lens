import { describe, expect, it } from "vitest";
import { defineAccessLens } from "../src/index.js";

const al = defineAccessLens({
  permissions: ["billing.read", "billing.write"] as const,
  entitlements: ["billing", "analytics"] as const,
  plans: ["free", "basic", "growth", "enterprise"] as const,
  flags: {
    billing_v2: { kind: "boolean" },
    risk_killswitch: { kind: "killswitch" },
    checkout_version: { kind: "variant", choices: ["v1", "v2", "v3"] as const },
    new_invoicing: { kind: "percent" },
    q3_features: { kind: "date" },
  },
  surfaces: ["sidebar.billing", "tab.reports"] as const,
});

describe("defineAccessLens — typed reason helpers", () => {
  it("permission produces a permission reason with the given key", () => {
    const r = al.permission("billing.read", true);
    expect(r.type).toBe("permission");
    expect(r.key).toBe("billing.read");
    expect(r.passed).toBe(true);
  });

  it("entitlement produces an entitlement reason", () => {
    const r = al.entitlement("analytics", false);
    expect(r.type).toBe("entitlement");
    expect(r.key).toBe("analytics");
    expect(r.passed).toBe(false);
  });

  describe("plan", () => {
    it("plan.is passes when equal", () => {
      expect(al.plan.is("enterprise", "enterprise").passed).toBe(true);
      expect(al.plan.is("enterprise", "free").passed).toBe(false);
    });

    it("plan.atLeast compares by declared order", () => {
      expect(al.plan.atLeast("free", "enterprise").passed).toBe(true);
      expect(al.plan.atLeast("growth", "growth").passed).toBe(true);
      expect(al.plan.atLeast("growth", "basic").passed).toBe(false);
      expect(al.plan.atLeast("enterprise", "growth").passed).toBe(false);
    });

    it("plan.atLeast denies when actual is not in the registry", () => {
      // @ts-expect-error — "ultra" is not in plans
      const r = al.plan.atLeast("free", "ultra");
      expect(r.passed).toBe(false);
    });
  });

  describe("flag — kind dispatch", () => {
    it("boolean flag uses .on()", () => {
      expect(al.flag.billing_v2.on(true).passed).toBe(true);
      expect(al.flag.billing_v2.on(false).passed).toBe(false);
    });

    it("killswitch flag uses .notEngaged() (engaged=true → fails)", () => {
      expect(al.flag.risk_killswitch.notEngaged(false).passed).toBe(true);
      expect(al.flag.risk_killswitch.notEngaged(true).passed).toBe(false);
    });

    it("variant flag uses .is() and compares strings", () => {
      expect(al.flag.checkout_version.is("v2", "v2").passed).toBe(true);
      expect(al.flag.checkout_version.is("v2", "v1").passed).toBe(false);
    });

    it("percent flag uses .inRollout() comparing bucket < threshold", () => {
      expect(al.flag.new_invoicing.inRollout(50, 25).passed).toBe(true);
      expect(al.flag.new_invoicing.inRollout(50, 50).passed).toBe(false);
      expect(al.flag.new_invoicing.inRollout(50, 75).passed).toBe(false);
    });

    it("date flag uses .activeFrom() comparing ISO strings", () => {
      expect(
        al.flag.q3_features.activeFrom("2026-07-01", "2026-08-01").passed,
      ).toBe(true);
      expect(
        al.flag.q3_features.activeFrom("2026-07-01", "2026-06-30").passed,
      ).toBe(false);
      expect(
        al.flag.q3_features.activeFrom("2026-07-01", "2026-07-01").passed,
      ).toBe(true); // inclusive
    });
  });

  describe("compile-time guardrails", () => {
    it("rejects unknown permission key", () => {
      // @ts-expect-error — "billing.raed" is a typo, not in registry
      al.permission("billing.raed", true);
    });

    it("rejects unknown variant value", () => {
      // @ts-expect-error — "v4" is not in the choices
      al.flag.checkout_version.is("v4", "v1");
    });

    it("does not expose .on() on a variant flag (compile + runtime)", () => {
      expect(() =>
        // @ts-expect-error — variant flag has no .on()
        al.flag.checkout_version.on(true),
      ).toThrow(TypeError);
    });

    it("does not expose .is() on a boolean flag (compile + runtime)", () => {
      expect(() =>
        // @ts-expect-error — boolean flag has no .is()
        al.flag.billing_v2.is("v2", "v2"),
      ).toThrow(TypeError);
    });
  });

  it("surfaces array exposes declared surface ids", () => {
    expect(al.surfaces).toEqual(["sidebar.billing", "tab.reports"]);
  });

  it("custom() escape hatch returns a custom reason", () => {
    expect(al.custom("anything", true).type).toBe("custom");
  });
});
