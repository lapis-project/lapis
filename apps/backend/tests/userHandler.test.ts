import { beforeEach, describe, expect, it, vi } from "vitest";

import { argon2Config } from "@/config/config.ts";
import type { Userroles } from "@/types/db.ts";

import { createTestApp, jsonRequest, testUser } from "./testutils.ts";

const repo = vi.hoisted(() => ({
	getUsersByRole: vi.fn(),
	editUserRoleByUserId: vi.fn(),
	editUserData: vi.fn(),
	editUserPassword: vi.fn(),
	setUserActiveState: vi.fn(),
}));
const getUserById = vi.hoisted(() => vi.fn());
const hash = vi.hoisted(() => vi.fn());

vi.mock("@/db/userRepository.ts", () => repo);
vi.mock("@/db/authRepository.ts", () => ({ getUserById }));
vi.mock("@node-rs/argon2", () => ({ hash }));

const { default: users } = await import("@/handler/userHandler.ts");

const targetUser = {
	id: 7,
	username: "test-user",
	firstname: "Test",
	lastname: "User",
	email: "test-user@example.com",
	role_name: "editor",
};

function appFor(role: Userroles | null) {
	return createTestApp(role).route("/user", users);
}

describe("User handler", () => {
	beforeEach(() => {
		vi.resetAllMocks();
		repo.getUsersByRole.mockResolvedValue([targetUser]);
		getUserById.mockResolvedValue(targetUser);
		hash.mockResolvedValue("hashed-password");
	});

	it.each([null, "editor"] as const)("denies listing roles as %s", async (role) => {
		const response = await appFor(role).request("/user/roles/admin");
		expect(response.status).toBe(403);
		expect(repo.getUsersByRole).not.toHaveBeenCalled();
	});

	it.each([null, "editor"] as const)("denies editing roles as %s", async (role) => {
		const response = await appFor(role).request(
			"/user/roles/7",
			jsonRequest("PUT", { user_role: "admin" }),
		);
		expect(response.status).toBe(403);
		expect(getUserById).not.toHaveBeenCalled();
		expect(repo.editUserRoleByUserId).not.toHaveBeenCalled();
	});

	it.each(["admin", "superadmin"] as const)(
		"lists users with a requested role as %s",
		async (role) => {
			const response = await appFor(role).request("/user/roles/editor");
			expect(response.status).toBe(200);
			expect(await response.json()).toEqual([targetUser]);
			expect(repo.getUsersByRole).toHaveBeenCalledExactlyOnceWith("editor");
		},
	);

	it.each(["editor", "admin", "superadmin"] as const)(
		"accepts the role filter %s",
		async (role) => {
			expect((await appFor("superadmin").request(`/user/roles/${role}`)).status).toBe(200);
			expect(repo.getUsersByRole).toHaveBeenCalledExactlyOnceWith(role);
		},
	);

	it("rejects an invalid role filter before querying", async () => {
		const response = await appFor("superadmin").request("/user/roles/invalid");
		expect(response.status).toBe(400);
		expect(await response.json()).toBe("Invalid role provided");
		expect(repo.getUsersByRole).not.toHaveBeenCalled();
	});

	it.each([
		{ actor: "admin", target: "editor", nextRole: "admin", status: 200 },
		{ actor: "superadmin", target: "admin", nextRole: "superadmin", status: 200 },
		{ actor: "superadmin", target: "superadmin", nextRole: "admin", status: 200 },
		{ actor: "admin", target: "superadmin", nextRole: "admin", status: 403 },
		{ actor: "admin", target: "admin", nextRole: "superadmin", status: 403 },
	] satisfies Array<{ actor: Userroles; target: Userroles; nextRole: Userroles; status: number }>)(
		"returns $status when $actor changes $target to $nextRole",
		async ({ actor, target, nextRole, status }) => {
			getUserById.mockResolvedValue({ ...targetUser, role_name: target });
			const response = await appFor(actor).request(
				"/user/roles/7",
				jsonRequest("PUT", { user_role: nextRole }),
			);
			expect(response.status).toBe(status);
			expect(getUserById).toHaveBeenCalledExactlyOnceWith(7);
			if (status === 200) {
				expect(repo.editUserRoleByUserId).toHaveBeenCalledExactlyOnceWith(7, nextRole);
				expect(await response.json()).toBe("Roles for user test-user have been updated");
			} else {
				expect(repo.editUserRoleByUserId).not.toHaveBeenCalled();
				expect(await response.json()).toBe("Forbidden action");
			}
		},
	);

	it.each([{}, { role: "admin" }, { user_role: "invalid" }])(
		"rejects an invalid role edit body %# before updating",
		async (body) => {
			const response = await appFor("superadmin").request(
				"/user/roles/7",
				jsonRequest("PUT", body),
			);
			expect(response.status).toBe(400);
			expect(getUserById).not.toHaveBeenCalled();
			expect(repo.editUserRoleByUserId).not.toHaveBeenCalled();
		},
	);

	it("rejects an invalid user ID before querying", async () => {
		const response = await appFor("superadmin").request(
			"/user/roles/invalid",
			jsonRequest("PUT", { user_role: "editor" }),
		);
		expect(response.status).toBe(400);
		expect(await response.json()).toBe("Invalid user id provided");
		expect(getUserById).not.toHaveBeenCalled();
		expect(repo.editUserRoleByUserId).not.toHaveBeenCalled();
	});

	it("returns an empty list when no users match the role", async () => {
		repo.getUsersByRole.mockResolvedValue([]);
		const response = await appFor("admin").request("/user/roles/editor");
		expect(response.status).toBe(200);
		expect(await response.json()).toEqual([]);
		expect(repo.getUsersByRole).toHaveBeenCalledExactlyOnceWith("editor");
	});

	it("uses an empty username in the role update message when it is absent", async () => {
		getUserById.mockResolvedValue({ ...targetUser, username: null });
		const response = await appFor("admin").request(
			"/user/roles/7",
			jsonRequest("PUT", { user_role: "editor" }),
		);
		expect(response.status).toBe(200);
		expect(await response.json()).toBe("Roles for user  have been updated");
		expect(repo.editUserRoleByUserId).toHaveBeenCalledExactlyOnceWith(7, "editor");
	});

	describe("user lookup and shared validation", () => {
		const routes = [
			{ path: "/user/7", init: undefined },
			{ path: "/user/roles/7", init: jsonRequest("PUT", { user_role: "editor" }) },
			{
				path: "/user/data/7",
				init: jsonRequest("PUT", {
					username: "test-user",
					email: "test-user@example.com",
					firstname: "Test",
				}),
			},
			{ path: "/user/password/7", init: jsonRequest("PUT", { password: "password123" }) },
			{ path: "/user/active/7", init: jsonRequest("PUT", { active: "inactive" }) },
		];

		it("returns a user by ID", async () => {
			const response = await appFor("editor").request("/user/7");
			expect(response.status).toBe(200);
			expect(response.headers.get("content-type")).toContain("application/json");
			expect(await response.json()).toEqual(targetUser);
			expect(getUserById).toHaveBeenCalledExactlyOnceWith(7);
		});

		it.each(routes)("requires authentication for $path", async ({ path, init }) => {
			const response = await appFor(null).request(path, init);
			expect(response.status).toBe(403);
			expect(await response.json()).toBe("Forbidden");
			expect(getUserById).not.toHaveBeenCalled();
			expect(hash).not.toHaveBeenCalled();
			expect(repo.editUserRoleByUserId).not.toHaveBeenCalled();
			expect(repo.editUserData).not.toHaveBeenCalled();
			expect(repo.editUserPassword).not.toHaveBeenCalled();
			expect(repo.setUserActiveState).not.toHaveBeenCalled();
		});

		it.each(routes)(
			"rejects an invalid user ID at $path before querying",
			async ({ path, init }) => {
				const response = await appFor("superadmin").request(path.replace("/7", "/invalid"), init);
				expect(response.status).toBe(400);
				expect(await response.json()).toBe("Invalid user id provided");
				expect(getUserById).not.toHaveBeenCalled();
				expect(repo.editUserRoleByUserId).not.toHaveBeenCalled();
				expect(repo.editUserData).not.toHaveBeenCalled();
				expect(repo.editUserPassword).not.toHaveBeenCalled();
				expect(repo.setUserActiveState).not.toHaveBeenCalled();
			},
		);

		it.each(routes)(
			"returns 404 at $path when the lookup returns no user ID",
			async ({ path, init }) => {
				getUserById.mockResolvedValue({});
				const response = await appFor("superadmin").request(path, init);
				expect(response.status).toBe(404);
				expect(await response.json()).toBe("User not found");
				expect(getUserById).toHaveBeenCalledExactlyOnceWith(7);
				expect(repo.editUserRoleByUserId).not.toHaveBeenCalled();
				expect(repo.editUserData).not.toHaveBeenCalled();
				expect(repo.editUserPassword).not.toHaveBeenCalled();
				expect(repo.setUserActiveState).not.toHaveBeenCalled();
			},
		);
	});

	describe("PUT /data/:id", () => {
		const profile = {
			username: "test-user",
			email: "test-user@example.com",
			firstname: "Test",
			lastname: "User",
		};

		it("normalizes profile data and returns the update result", async () => {
			getUserById.mockResolvedValue({ ...targetUser, id: testUser.id });
			const updatedUser = { ...targetUser, id: testUser.id, ...profile };
			repo.editUserData.mockResolvedValue(updatedUser);
			const response = await appFor("editor").request(
				`/user/data/${testUser.id}`,
				jsonRequest("PUT", {
					username: "  test-user  ",
					email: "  TEST-USER@EXAMPLE.COM  ",
					firstname: "  Test  ",
					lastname: "  User  ",
				}),
			);
			expect(response.status).toBe(200);
			expect(await response.json()).toEqual(updatedUser);
			expect(getUserById).toHaveBeenCalledExactlyOnceWith(testUser.id);
			expect(repo.editUserData).toHaveBeenCalledExactlyOnceWith(testUser.id, profile);
		});

		it("allows an omitted lastname", async () => {
			getUserById.mockResolvedValue({ ...targetUser, id: testUser.id });
			repo.editUserData.mockResolvedValue({ updated: true });
			const response = await appFor("editor").request(
				`/user/data/${testUser.id}`,
				jsonRequest("PUT", {
					username: profile.username,
					email: profile.email,
					firstname: profile.firstname,
				}),
			);
			expect(response.status).toBe(200);
			expect(await response.json()).toEqual({ updated: true });
			expect(repo.editUserData).toHaveBeenCalledExactlyOnceWith(testUser.id, {
				...profile,
				lastname: undefined,
			});
		});

		it.each([
			{},
			{ ...profile, username: "ab" },
			{ ...profile, username: "   " },
			{ ...profile, email: "invalid" },
			{ ...profile, firstname: "   " },
			{ ...profile, lastname: "   " },
			{ ...profile, lastname: null },
		])("rejects invalid profile data %j before querying", async (body) => {
			const response = await appFor("editor").request(
				`/user/data/${testUser.id}`,
				jsonRequest("PUT", body),
			);
			expect(response.status).toBe(400);
			expect(await response.json()).toMatchObject({ success: false });
			expect(getUserById).not.toHaveBeenCalled();
			expect(repo.editUserData).not.toHaveBeenCalled();
		});

		it.each([
			{ actor: "editor", target: "editor", own: false, status: 403 },
			{ actor: "admin", target: "editor", own: false, status: 403 },
			{ actor: "superadmin", target: "editor", own: false, status: 403 },
			{ actor: "admin", target: "admin", own: true, status: 403 },
			{ actor: "superadmin", target: "superadmin", own: true, status: 200 },
		] satisfies Array<{ actor: Userroles; target: Userroles; own: boolean; status: number }>)(
			"returns $status when $actor edits $target profile with own=$own",
			async ({ actor, target, own, status }) => {
				const userId = own ? testUser.id : targetUser.id;
				getUserById.mockResolvedValue({ ...targetUser, id: userId, role_name: target });
				repo.editUserData.mockResolvedValue({ updated: true });
				const response = await appFor(actor).request(
					`/user/data/${userId}`,
					jsonRequest("PUT", profile),
				);
				expect(response.status).toBe(status);
				expect(getUserById).toHaveBeenCalledExactlyOnceWith(userId);
				if (status === 200) {
					expect(await response.json()).toEqual({ updated: true });
					expect(repo.editUserData).toHaveBeenCalledExactlyOnceWith(userId, profile);
				} else {
					expect(await response.json()).toBe("Forbidden action");
					expect(repo.editUserData).not.toHaveBeenCalled();
				}
			},
		);
	});

	describe("PUT /password/:id", () => {
		it("trims the password and persists its hash using the configured Argon2 options", async () => {
			getUserById.mockResolvedValue({ ...targetUser, id: testUser.id });
			const response = await appFor("editor").request(
				`/user/password/${testUser.id}`,
				jsonRequest("PUT", { password: "  password123  " }),
			);
			expect(response.status).toBe(200);
			expect(await response.json()).toBe("ok");
			expect(getUserById).toHaveBeenCalledExactlyOnceWith(testUser.id);
			expect(hash).toHaveBeenCalledExactlyOnceWith("password123", argon2Config);
			expect(repo.editUserPassword).toHaveBeenCalledExactlyOnceWith(testUser.id, "hashed-password");
		});

		it.each([
			{},
			{ password: 12345678 },
			{ password: "" },
			{ password: "1234567" },
			{ password: " 1234567 " },
		])("rejects invalid password data %j before hashing or querying", async (body) => {
			const response = await appFor("editor").request(
				`/user/password/${testUser.id}`,
				jsonRequest("PUT", body),
			);
			expect(response.status).toBe(400);
			expect(await response.json()).toMatchObject({ success: false });
			expect(hash).not.toHaveBeenCalled();
			expect(getUserById).not.toHaveBeenCalled();
			expect(repo.editUserPassword).not.toHaveBeenCalled();
		});

		it("accepts an eight-character password", async () => {
			getUserById.mockResolvedValue({ ...targetUser, id: testUser.id });
			const response = await appFor("editor").request(
				`/user/password/${testUser.id}`,
				jsonRequest("PUT", { password: "12345678" }),
			);
			expect(response.status).toBe(200);
			expect(await response.json()).toBe("ok");
			expect(hash).toHaveBeenCalledExactlyOnceWith("12345678", argon2Config);
			expect(repo.editUserPassword).toHaveBeenCalledExactlyOnceWith(testUser.id, "hashed-password");
		});

		it.each([
			{ actor: "editor", target: "editor", own: false, status: 403 },
			{ actor: "admin", target: "editor", own: false, status: 403 },
			{ actor: "admin", target: "admin", own: true, status: 403 },
			{ actor: "superadmin", target: "editor", own: false, status: 200 },
			{ actor: "superadmin", target: "admin", own: false, status: 200 },
			{ actor: "superadmin", target: "superadmin", own: false, status: 200 },
			{ actor: "superadmin", target: "superadmin", own: true, status: 200 },
		] satisfies Array<{ actor: Userroles; target: Userroles; own: boolean; status: number }>)(
			"returns $status when $actor changes $target password with own=$own",
			async ({ actor, target, own, status }) => {
				const userId = own ? testUser.id : targetUser.id;
				getUserById.mockResolvedValue({ ...targetUser, id: userId, role_name: target });
				const response = await appFor(actor).request(
					`/user/password/${userId}`,
					jsonRequest("PUT", { password: "password123" }),
				);
				expect(response.status).toBe(status);
				expect(getUserById).toHaveBeenCalledExactlyOnceWith(userId);
				if (status === 200) {
					expect(await response.json()).toBe("ok");
					expect(repo.editUserPassword).toHaveBeenCalledExactlyOnceWith(userId, "hashed-password");
				} else {
					expect(await response.json()).toBe("Forbidden action");
					expect(repo.editUserPassword).not.toHaveBeenCalled();
				}
			},
		);
	});

	describe("PUT /active/:id", () => {
		it.each(["active", "inactive"])("sets the account state to %s", async (active) => {
			const response = await appFor("admin").request(
				"/user/active/7",
				jsonRequest("PUT", { active }),
			);
			expect(response.status).toBe(200);
			expect(await response.json()).toBe("Ok");
			expect(getUserById).toHaveBeenCalledExactlyOnceWith(7);
			expect(repo.setUserActiveState).toHaveBeenCalledExactlyOnceWith(7, active);
		});

		it.each([{}, { active: true }, { active: "invalid" }, { active: "Active" }, { active: null }])(
			"rejects invalid account state %j before querying",
			async (body) => {
				const response = await appFor("admin").request("/user/active/7", jsonRequest("PUT", body));
				expect(response.status).toBe(400);
				expect(await response.json()).toMatchObject({ success: false });
				expect(getUserById).not.toHaveBeenCalled();
				expect(repo.setUserActiveState).not.toHaveBeenCalled();
			},
		);
	});
});
