import { describe, it, expect } from "vitest";
import {
  createOrderSchema,
  claimTagSchema,
  updateProfileSchema,
  setSuspendedSchema,
  setRoleSchema
} from "../index.js";

describe("updateProfileSchema", () => {
  it("accepts name only, phone only, or both", () => {
    expect(updateProfileSchema.safeParse({ name: "D" }).success).toBe(true);
    expect(updateProfileSchema.safeParse({ phone: "9876543210" }).success).toBe(true);
    expect(updateProfileSchema.safeParse({ name: "D", phone: "9876543210" }).success).toBe(true);
  });

  it("rejects an empty object", () => {
    expect(updateProfileSchema.safeParse({}).success).toBe(false);
  });

  it("rejects role injection attempts", () => {
    const r = updateProfileSchema.safeParse({ role: "admin" });
    expect(r.success).toBe(false); // no valid field provided
  });
});

describe("createOrderSchema", () => {
  const item = { variantId: "9f1b2c3d-0000-4000-8000-000000000000", quantity: 2 };

  it("accepts a valid order", () => {
    expect(
      createOrderSchema.safeParse({
        items: [item],
        addressId: "9f1b2c3d-0000-4000-8000-000000000001"
      }).success
    ).toBe(true);
  });

  it("rejects empty items, zero quantity, and bad UUIDs", () => {
    expect(createOrderSchema.safeParse({ items: [], addressId: item.variantId }).success).toBe(false);
    expect(
      createOrderSchema.safeParse({
        items: [{ ...item, quantity: 0 }],
        addressId: item.variantId
      }).success
    ).toBe(false);
    expect(
      createOrderSchema.safeParse({
        items: [{ ...item, variantId: "not-a-uuid" }],
        addressId: item.variantId
      }).success
    ).toBe(false);
  });
});

describe("claimTagSchema", () => {
  it("accepts a plausible UID and rejects extremes", () => {
    expect(claimTagSchema.safeParse({ uid: "04A2B3C4D5" }).success).toBe(true);
    expect(claimTagSchema.safeParse({ uid: "abc" }).success).toBe(false);
    expect(claimTagSchema.safeParse({ uid: "x".repeat(65) }).success).toBe(false);
  });
});

describe("admin schemas", () => {
  it("suspended must be boolean", () => {
    expect(setSuspendedSchema.safeParse({ suspended: true }).success).toBe(true);
    expect(setSuspendedSchema.safeParse({ suspended: "yes" }).success).toBe(false);
  });

  it("role is a closed enum", () => {
    expect(setRoleSchema.safeParse({ role: "admin" }).success).toBe(true);
    expect(setRoleSchema.safeParse({ role: "superadmin" }).success).toBe(false);
  });
});
