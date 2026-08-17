import { z } from "zod";

// ---- Orders ----
export const createOrderSchema = z.object({
  items: z
    .array(
      z.object({
        variantId: z.string().uuid(),
        quantity: z.number().int().min(1).max(20)
      })
    )
    .min(1),
  addressId: z.string().uuid()
});
export type CreateOrderInput = z.infer<typeof createOrderSchema>;

// ---- NFC claim ----
export const claimTagSchema = z.object({
  uid: z.string().min(4).max(64)
});
export type ClaimTagInput = z.infer<typeof claimTagSchema>;

// ---- Experience publish ----
export const publishExperienceSchema = z.object({
  content: z.record(z.unknown()) // tightened per-template in M4
});

// ---- Auth / profile ----
export const updateProfileSchema = z
  .object({
    name: z.string().min(1).max(100).optional(),
    phone: z.string().min(6).max(20).optional()
  })
  .refine((d) => d.name !== undefined || d.phone !== undefined, {
    message: "Provide at least one field"
  });

// ---- Admin user management ----
export const setSuspendedSchema = z.object({
  suspended: z.boolean()
});

export const setRoleSchema = z.object({
  role: z.enum(["customer", "admin"])
});
