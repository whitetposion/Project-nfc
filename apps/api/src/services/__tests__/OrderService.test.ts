import { describe, it, expect, vi } from "vitest";
import { OrderService } from "../OrderService.js";
import { ApiError } from "../../core/ApiError.js";
import type { AddressRepository } from "../../repositories/AddressRepository.js";
import type { OrderRepository, Order } from "../../repositories/OrderRepository.js";

const address = {
  id: "a1", user_id: "u1", label: "Home", line1: "12 MG Road", line2: null,
  city: "Mumbai", state: "MH", country: "IN", postal_code: "400001", is_default: true
};

const order = (overrides: Partial<Order> = {}): Order => ({
  id: "o1", user_id: "u1", status: "pending",
  subtotal_inr: 49900, shipping_inr: 4900, total_inr: 54800,
  shipping_address: {}, tracking_number: null,
  created_at: "", updated_at: "", ...overrides
});

const fakeOrders = (overrides: Partial<OrderRepository> = {}) =>
  ({
    create: vi.fn().mockResolvedValue(order()),
    findById: vi.fn().mockResolvedValue(order()),
    updateStatus: vi.fn().mockImplementation((_id, status) =>
      Promise.resolve(order({ status }))
    ),
    ...overrides
  }) as unknown as OrderRepository;

const fakeAddresses = (found = true) =>
  ({
    findOwned: vi.fn().mockResolvedValue(found ? address : null)
  }) as unknown as AddressRepository;

const input = { items: [{ variantId: "v1", quantity: 2 }], addressId: "a1" };

describe("OrderService.placeOrder", () => {
  it("snapshots the address and delegates to the atomic create", async () => {
    const orders = fakeOrders();
    const svc = new OrderService(orders, fakeAddresses(), 4900);
    await svc.placeOrder("u1", input);
    expect(orders.create).toHaveBeenCalledWith(
      "u1",
      [{ variant_id: "v1", quantity: 2 }],
      expect.objectContaining({ line1: "12 MG Road", postal_code: "400001" }),
      4900
    );
  });

  it("404s when the address is not owned by the caller", async () => {
    const svc = new OrderService(fakeOrders(), fakeAddresses(false), 0);
    await expect(svc.placeOrder("u1", input)).rejects.toMatchObject({ status: 404 });
  });

  it("propagates stock conflicts from the DB layer", async () => {
    const orders = fakeOrders({
      create: vi.fn().mockRejectedValue(ApiError.conflict("One or more items are out of stock"))
    });
    const svc = new OrderService(orders, fakeAddresses(), 0);
    await expect(svc.placeOrder("u1", input)).rejects.toMatchObject({ status: 409 });
  });
});

describe("OrderService.updateStatus (state machine)", () => {
  it("allows legal transitions", async () => {
    const svc = new OrderService(fakeOrders(), fakeAddresses(), 0);
    const updated = await svc.updateStatus("o1", "paid");
    expect(updated.status).toBe("paid");
  });

  it("rejects illegal transitions with 409", async () => {
    const orders = fakeOrders({
      findById: vi.fn().mockResolvedValue(order({ status: "pending" }))
    });
    const svc = new OrderService(orders, fakeAddresses(), 0);
    await expect(svc.updateStatus("o1", "delivered")).rejects.toMatchObject({
      status: 409
    });
    expect(orders.updateStatus).not.toHaveBeenCalled();
  });

  it("terminal states allow nothing", async () => {
    const orders = fakeOrders({
      findById: vi.fn().mockResolvedValue(order({ status: "cancelled" }))
    });
    const svc = new OrderService(orders, fakeAddresses(), 0);
    await expect(svc.updateStatus("o1", "paid")).rejects.toMatchObject({ status: 409 });
  });

  it("404s on a missing order", async () => {
    const orders = fakeOrders({ findById: vi.fn().mockResolvedValue(null) });
    const svc = new OrderService(orders, fakeAddresses(), 0);
    await expect(svc.updateStatus("ghost", "paid")).rejects.toMatchObject({ status: 404 });
  });
});
