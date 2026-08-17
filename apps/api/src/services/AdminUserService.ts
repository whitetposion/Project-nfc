import { ApiError } from "../core/ApiError.js";
import type {
  ListUsersParams,
  Profile,
  ProfileRepository,
  Role
} from "../repositories/ProfileRepository.js";

export class AdminUserService {
  constructor(private readonly profiles: ProfileRepository) {}

  list(params: ListUsersParams) {
    return this.profiles.list(params);
  }

  async setSuspended(
    actorId: string,
    targetId: string,
    suspended: boolean
  ): Promise<Profile> {
    if (actorId === targetId) {
      throw ApiError.badRequest("You cannot suspend yourself");
    }
    return this.profiles.setSuspended(targetId, suspended);
  }

  async setRole(actorId: string, targetId: string, role: Role): Promise<Profile> {
    if (actorId === targetId && role !== "admin") {
      throw ApiError.badRequest("You cannot demote yourself");
    }
    return this.profiles.setRole(targetId, role);
  }
}
