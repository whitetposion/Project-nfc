import type { SupabaseClient } from "@supabase/supabase-js";
import { ApiError } from "../core/ApiError.js";

export type OrderStatus =
  | "pending" | "paid" | "processing" | "packed"
  | "shipped" | "delivered" | "cancelled" | "returned";

export interface Order {
  id: string;
  user_id: string;
  status: OrderStatus;
  subtotal_inr: number;
  shipping_inr: number;
  total_inr: number;
  shipping_address: Record<string, unknown>;
  tracking_number: string | null;
  created_at: string;
  updated_at: string;
}

export interface OrderItemInput {
  variant_id: string;
  quantity: number;
}

export class OrderRepository {
  constructor(private readonly db: SupabaseClient) {}

  /** Delegates to the atomic create_order Postgres function. */
  async create(
    userId: string,
    items: OrderItemInput[],
    shippingAddress: Record<string, unknown>,
    shippingInr: number
  ): Promise<Order> {
    const { data, error } = await this.db.rpc("create_order", {
      p_user_id: userId,
      p_items: items,
      p_shipping_address: shippingAddress,
      p_shipping_inr: shippingInr
    });
    if (error) throw this.mapDbError(error.message);
    return data as Order;
  }

  async findById(id: string): Promise<Order | null> {
    const { data, error } = await this.db
      .from("orders")
      .select("*")
      .eq("id", id)
      .maybeSingle();
    if (error) throw new ApiError(500, `DB: ${error.message}`);
    return data;
  }

  async updateStatus(id: string, status: OrderStatus): Promise<Order> {
    const { data, error } = await this.db
      .from("orders")
      .update({ status })
      .eq("id", id)
      .select()
      .single();
    if (error) throw new ApiError(500, `DB: ${error.message}`);
    return data;
  }

  /** Translate the DB function's raise exceptions into client-safe errors. */
  private mapDbError(message: string): ApiError {
    if (message.includes("INSUFFICIENT_STOCK")) {
      return ApiError.conflict("One or more items are out of stock");
    }
    if (message.includes("VARIANT_NOT_FOUND")) {
      return ApiError.badRequest("One or more items no longer exist");
    }
    if (message.includes("PRODUCT_INACTIVE")) {
      return ApiError.badRequest("One or more products are unavailable");
    }
    if (message.includes("EMPTY_ORDER")) {
      return ApiError.badRequest("Order has no items");
    }
    return new ApiError(500, `DB: ${message}`);
  }
}
