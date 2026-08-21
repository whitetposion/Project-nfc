import type { SupabaseClient } from "@supabase/supabase-js";
import { ApiError } from "../core/ApiError.js";

export interface Address {
  id: string;
  user_id: string;
  label: string | null;
  line1: string;
  line2: string | null;
  city: string;
  state: string;
  country: string;
  postal_code: string;
  is_default: boolean;
}

export class AddressRepository {
  constructor(private readonly db: SupabaseClient) {}

  /** Returns the address only if it belongs to the given user. */
  async findOwned(id: string, userId: string): Promise<Address | null> {
    const { data, error } = await this.db
      .from("addresses")
      .select("*")
      .eq("id", id)
      .eq("user_id", userId)
      .maybeSingle();
    if (error) throw new ApiError(500, `DB: ${error.message}`);
    return data;
  }
}
