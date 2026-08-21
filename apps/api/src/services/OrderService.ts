import { ApiError } from "../core/ApiError.js";
import type { AddressRepository } from "../repositories/AddressRepository.js";
import type {
  Order,
  OrderRepository,
  OrderStatus
} from "../repositories/OrderRepository.js";

/** Legal state machine. Anything not listed is an invalid transition. */
const TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
  pending:    ["paid", "cancelled"],
  paid:       ["processing", "cancelled"],
  processing: ["packed", "cancelled"],
  packed:     ["shipped"],
  shipped:    ["delivered"],
  delivered:  ["returned"],
  cancelled:  [],
  returned:   []
};

export interface PlaceOrderInput {
  items: { variantId: string; quantity: number }[];
  addressId: string;
}

export class OrderService {
  constructor(
    private readonly orders: OrderRepository,
    private readonly addresses: AddressRepository,
    private readonly shippingFlatInr: number
  ) {}

  async placeOrder(userId: string, input: PlaceOrderInput): Promise<Order> {
    const address = await this.addresses.findOwned(input.addressId, userId);
    if (!address) throw ApiError.notFound("Address not found");

    // Snapshot: the order keeps this address forever, even if edited later.
    const snapshot = {
      label: address.label,
      line1: address.line1,
      line2: address.line2,
      city: address.city,
      state: address.state,
      country: address.country,
      postal_code: address.postal_code
    };

    const items = input.items.map((i) => ({
      variant_id: i.variantId,
      quantity: i.quantity
    }));

    return this.orders.create(userId, items, snapshot, this.shippingFlatInr);
  }

  async updateStatus(orderId: string, next: OrderStatus): Promise<Order> {
    const order = await this.orders.findById(orderId);
    if (!order) throw ApiError.notFound("Order not found");

    if (!TRANSITIONS[order.status].includes(next)) {
      throw ApiError.conflict(
        `Cannot move order from '${order.status}' to '${next}'`
      );
    }
    return this.orders.updateStatus(orderId, next);
  }
}
