import { ApiError } from "../core/ApiError.js";
import type { Profile, ProfileRepository } from "../repositories/ProfileRepository.js";

export class AuthService {
  constructor(private readonly profiles: ProfileRepository) {}

  async getMe(userId: string): Promise<Profile> {
    const profile = await this.profiles.findById(userId);
    if (!profile) throw ApiError.notFound("Profile not found");
    if (profile.suspended) throw ApiError.forbidden("Account suspended");
    return profile;
  }

  async updateMe(
    userId: string,
    fields: { name?: string; phone?: string }
  ): Promise<Profile> {
    await this.getMe(userId); // existence + suspension check, one path
    return this.profiles.updateContact(userId, fields);
  }
}
