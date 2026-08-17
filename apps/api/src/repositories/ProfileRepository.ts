import type { SupabaseClient } from "@supabase/supabase-js";
import { ApiError } from "../core/ApiError.js";

export type Role = "customer" | "admin";

export interface Profile {
  id: string;
  name: string | null;
  phone: string | null;
  role: Role;
  suspended: boolean;
  created_at: string;
}

export interface ListUsersParams {
  search?: string;
  page: number;
  pageSize: number;
}

// The ONLY place profile queries live. Services never touch supabase directly.
export class ProfileRepository {
  constructor(private readonly db: SupabaseClient) {}

  async findById(id: string): Promise<Profile | null> {
    const { data, error } = await this.db
      .from("profiles")
      .select("*")
      .eq("id", id)
      .maybeSingle();
    if (error) throw new ApiError(500, `DB: ${error.message}`);
    return data;
  }

  async updateContact(
    id: string,
    fields: { name?: string; phone?: string }
  ): Promise<Profile> {
    const { data, error } = await this.db
      .from("profiles")
      .update(fields)
      .eq("id", id)
      .select()
      .single();
    if (error) throw new ApiError(500, `DB: ${error.message}`);
    return data;
  }

  async list({ search, page, pageSize }: ListUsersParams) {
    let query = this.db
      .from("profiles")
      .select("*", { count: "exact" })
      .order("created_at", { ascending: false })
      .range((page - 1) * pageSize, page * pageSize - 1);

    if (search) query = query.ilike("name", `%${search}%`);

    const { data, error, count } = await query;
    if (error) throw new ApiError(500, `DB: ${error.message}`);
    return { users: data ?? [], total: count ?? 0, page, pageSize };
  }

  async setSuspended(id: string, suspended: boolean): Promise<Profile> {
    return this.setColumn(id, { suspended });
  }

  async setRole(id: string, role: Role): Promise<Profile> {
    return this.setColumn(id, { role });
  }

  // Shared write path for privileged columns (service role only).
  private async setColumn(id: string, fields: Partial<Profile>): Promise<Profile> {
    const { data, error } = await this.db
      .from("profiles")
      .update(fields)
      .eq("id", id)
      .select()
      .single();
    if (error) throw new ApiError(500, `DB: ${error.message}`);
    if (!data) throw ApiError.notFound("User not found");
    return data;
  }
}
