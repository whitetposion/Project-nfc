import { describe, it, expect, vi } from "vitest";
import { AdminUserService } from "../AdminUserService.js";
import type { ProfileRepository } from "../../repositories/ProfileRepository.js";

const fakeRepo = () =>
  ({
    list: vi.fn().mockResolvedValue({ users: [], total: 0, page: 1, pageSize: 20 }),
    setSuspended: vi.fn().mockResolvedValue({ id: "u2", suspended: true }),
    setRole: vi.fn().mockResolvedValue({ id: "u2", role: "admin" })
  }) as unknown as ProfileRepository;

describe("AdminUserService", () => {
  it("blocks self-suspension", async () => {
    const svc = new AdminUserService(fakeRepo());
    await expect(svc.setSuspended("admin1", "admin1", true)).rejects.toMatchObject({
      status: 400
    });
  });

  it("suspends another user", async () => {
    const repo = fakeRepo();
    const svc = new AdminUserService(repo);
    await svc.setSuspended("admin1", "u2", true);
    expect(repo.setSuspended).toHaveBeenCalledWith("u2", true);
  });

  it("blocks self-demotion but allows self role reaffirm to admin", async () => {
    const svc = new AdminUserService(fakeRepo());
    await expect(svc.setRole("admin1", "admin1", "customer")).rejects.toMatchObject({
      status: 400
    });
    await expect(svc.setRole("admin1", "admin1", "admin")).resolves.toBeDefined();
  });

  it("promotes another user", async () => {
    const repo = fakeRepo();
    const svc = new AdminUserService(repo);
    await svc.setRole("admin1", "u2", "admin");
    expect(repo.setRole).toHaveBeenCalledWith("u2", "admin");
  });
});
