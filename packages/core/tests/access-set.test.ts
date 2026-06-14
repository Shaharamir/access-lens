import { describe, expect, it } from "vitest";
import {
  AccessSetValidationError,
  createAccessSet,
  emptyAccessSet,
} from "../src/index.js";

const validJson = {
  permissions: ["billing.read", "reports.read"],
  plan: "growth",
  entitlements: { billing: true, payouts: false },
  flags: {
    billing_v2: { kind: "boolean", on: true },
    risk_killswitch: { kind: "killswitch", engaged: false },
    checkout_version: { kind: "variant", value: "v2" },
    new_invoicing: { kind: "percent", rollout: 25 },
    q3_features: { kind: "date", activeFrom: "2026-07-01" },
  },
  tenantConfig: { legacy: false, region: "eu" },
  tenant: { bucketPercent: 17 },
};

describe("createAccessSet", () => {
  it("parses a valid JSON payload", () => {
    const set = createAccessSet(validJson);
    expect(set.plan).toBe("growth");
    expect(set.bucketPercent).toBe(17);
    expect([...set.permissions]).toEqual(["billing.read", "reports.read"]);
  });

  it("hasPermission checks the Set", () => {
    const set = createAccessSet(validJson);
    expect(set.hasPermission("billing.read")).toBe(true);
    expect(set.hasPermission("billing.write")).toBe(false);
  });

  it("hasEntitlement returns false for explicit false and missing keys", () => {
    const set = createAccessSet(validJson);
    expect(set.hasEntitlement("billing")).toBe(true);
    expect(set.hasEntitlement("payouts")).toBe(false);
    expect(set.hasEntitlement("nope")).toBe(false);
  });

  describe("flag accessors", () => {
    it("booleanFlag returns the on value", () => {
      const set = createAccessSet(validJson);
      expect(set.booleanFlag("billing_v2")).toBe(true);
    });

    it("booleanFlag returns false when missing or wrong kind", () => {
      const set = createAccessSet(validJson);
      expect(set.booleanFlag("nope")).toBe(false);
      expect(set.booleanFlag("checkout_version")).toBe(false);
    });

    it("killswitchEngaged returns true (fail-safe) when missing", () => {
      const set = createAccessSet(validJson);
      expect(set.killswitchEngaged("risk_killswitch")).toBe(false);
      expect(set.killswitchEngaged("missing")).toBe(true);
    });

    it("variantFlag returns the value or empty string", () => {
      const set = createAccessSet(validJson);
      expect(set.variantFlag("checkout_version")).toBe("v2");
      expect(set.variantFlag("billing_v2")).toBe("");
    });

    it("percentFlag returns the rollout or 0", () => {
      const set = createAccessSet(validJson);
      expect(set.percentFlag("new_invoicing")).toBe(25);
      expect(set.percentFlag("missing")).toBe(0);
    });

    it("dateFlag returns the date or far-future fallback", () => {
      const set = createAccessSet(validJson);
      expect(set.dateFlag("q3_features")).toBe("2026-07-01");
      expect(set.dateFlag("missing")).toBe("9999-12-31");
    });
  });

  describe("validation errors", () => {
    it("rejects non-object json", () => {
      expect(() => createAccessSet(null)).toThrow(AccessSetValidationError);
      expect(() => createAccessSet("nope")).toThrow(AccessSetValidationError);
    });

    it("rejects non-array permissions", () => {
      expect(() =>
        createAccessSet({ ...validJson, permissions: "billing.read" }),
      ).toThrow(/permissions/);
    });

    it("rejects non-string permission element", () => {
      expect(() =>
        createAccessSet({
          ...validJson,
          permissions: ["billing.read", 42],
        }),
      ).toThrow(/string/);
    });

    it("rejects unknown flag kind", () => {
      expect(() =>
        createAccessSet({
          ...validJson,
          flags: { f: { kind: "bogus" } },
        }),
      ).toThrow(/kind/);
    });

    it("rejects boolean flag without `on`", () => {
      expect(() =>
        createAccessSet({
          ...validJson,
          flags: { f: { kind: "boolean" } },
        }),
      ).toThrow(/on/);
    });

    it("rejects out-of-range percent", () => {
      expect(() =>
        createAccessSet({
          ...validJson,
          flags: { f: { kind: "percent", rollout: 250 } },
        }),
      ).toThrow(/rollout/);
    });
  });
});

describe("emptyAccessSet", () => {
  it("returns a usable empty set", () => {
    const set = emptyAccessSet();
    expect(set.plan).toBe("free");
    expect(set.hasPermission("anything")).toBe(false);
    expect(set.hasEntitlement("anything")).toBe(false);
    expect(set.booleanFlag("anything")).toBe(false);
    expect(set.bucketPercent).toBe(0);
  });

  it("accepts a custom default plan", () => {
    expect(emptyAccessSet("enterprise").plan).toBe("enterprise");
  });
});
