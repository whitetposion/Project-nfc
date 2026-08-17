import { describe, it, expect, vi } from "vitest";
import { AuthService } from "../AuthService.js";
import { ApiError } from "../../core/ApiError.js";
import type { Profile, ProfileRepository } from "../../repositories/ProfileRepository.js";

const profile = (overrides: Partial<Profile> = {}): Profile => ({
  id: "u1",
  name: "Dikshant",
  phone: null,
  role: "customer",
  suspended: false,
  created_at: new Date().toISOString(),
  ...overrides
});

const fakeRepo = (overrides: Partial<ProfileRepository> = {}) =>
  ({
    findById: vi.fn().mockResolvedValue(profile()),
    updateContact: vi.fn().mockResolvedValue(profile({ name: "New" })),
    ...overrides
  }) as unknown as ProfileRepository;

describe("AuthService.getMe", () => {
  it("returns the profile for an existing active user", async () => {
    const svc = new AuthService(fakeRepo());
    const me = await svc.getMe("u1");
    expect(me.id).toBe("u1");
  });

  it("throws 404 when the profile does not exist", async () => {
    const svc = new AuthService(fakeRepo({ findById: vi.fn().mockResolvedValue(null) }));
    await expect(svc.getMe("ghost")).rejects.toMatchObject({ status: 404 });
  });

  it("throws 403 when the account is suspended", async () => {
    const svc = new AuthService(
      fakeRepo({ findById: vi.fn().mockResolvedValue(profile({ suspended: true })) })
    );
    await expect(svc.getMe("u1")).rejects.toMatchObject({
      status: 403,
      message: "Account suspended"
    });
  });
});

describe("AuthService.updateMe", () => {
  it("updates contact fields for an active user", async () => {
    const repo = fakeRepo();
    const svc = new AuthService(repo);
    const updated = await svc.updateMe("u1", { name: "New" });
    expect(updated.name).toBe("New");
    expect(repo.updateContact).toHaveBeenCalledWith("u1", { name: "New" });
  });

  it("refuses updates for suspended users (reuses getMe path)", async () => {
    const repo = fakeRepo({
      findById: vi.fn().mockResolvedValue(profile({ suspended: true }))
    });
    const svc = new AuthService(repo);
    await expect(svc.updateMe("u1", { name: "X" })).rejects.toBeInstanceOf(ApiError);
    expect(repo.updateContact).not.toHaveBeenCalled();
  });
});
