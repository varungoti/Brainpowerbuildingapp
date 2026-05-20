import { describe, expect, it } from "vitest";

import { extractStoreProductIdFromTransaction, getStoreProductIdForPlan } from "./storeBilling";

describe("storeBilling", () => {
  it("getStoreProductIdForPlan falls back to defaults", () => {
    expect(getStoreProductIdForPlan("premium_year")).toBe("com.neurospark.app.premium_year");
  });

  it("extractStoreProductIdFromTransaction parses Android originalJson", () => {
    const tx = JSON.stringify({
      productId: "com.neurospark.app.premium_year",
      purchaseToken: "abc",
    });
    expect(extractStoreProductIdFromTransaction("android", tx)).toBe("com.neurospark.app.premium_year");
  });

  it("extractStoreProductIdFromTransaction parses Android productIds array", () => {
    const tx = JSON.stringify({ productIds: ["com.neurospark.app.day7"], purchaseToken: "x" });
    expect(extractStoreProductIdFromTransaction("android", tx)).toBe("com.neurospark.app.day7");
  });

  it("extractStoreProductIdFromTransaction parses iOS JWS payload (unverified decode)", () => {
    const payload = { productId: "com.neurospark.app.premium_year" };
    const b64 = btoa(JSON.stringify(payload)).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
    const jws = `xx.${b64}.yy`;
    expect(extractStoreProductIdFromTransaction("ios", jws)).toBe("com.neurospark.app.premium_year");
  });
});
