/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-argument */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { afterAll, afterEach, beforeAll, describe, expect, test } from "vitest";

import { app } from "@/app";
import { db } from "@/db/connect";
import type { Userroles } from "@/types/db";

import { apiHeaders, loginUserAndReturnCookie, logoutUser } from "./testutils";

describe("test endpoint GET /user/roles/:role", () => {
	const loginHeaders = structuredClone(apiHeaders);

	const users: Array<{
		username: string;
		email: string;
		role_name: Userroles;
		firstname: string;
		lastname: string;
		password: string;
		id: number;
	}> = [];
	beforeAll(async () => {
		// create admin, superadmin and user account
		// login as admin
		const sessionCookie = await loginUserAndReturnCookie("admin@oeaw.ac.at", "adminadmin");
		loginHeaders.Cookie = sessionCookie;

		const editorUser = await app.request("/auth/signup", {
			headers: loginHeaders,
			method: "POST",
			body: JSON.stringify({
				username: "testeditor",
				password: "testeditor",
				email: "testeditor@oeaw.ac.at",
				user_role: "editor",
				firstname: "testeditor",
				lastname: "test",
			}),
		});

		let body = await editorUser.json();
		body.password = "testeditor";
		users.push(body);

		const testadminUser = await app.request("/auth/signup", {
			headers: loginHeaders,
			method: "POST",
			body: JSON.stringify({
				username: "testadmin",
				password: "testtest",
				email: "testadmin@oeaw.ac.at",
				user_role: "admin",
				firstname: "testadmin",
				lastname: "test",
			}),
		});

		body = await testadminUser.json();
		body.password = "testtest";
		users.push(body);

		const superadmin = await app.request("/auth/signup", {
			headers: loginHeaders,
			method: "POST",
			body: JSON.stringify({
				username: "testsuperadmin",
				password: "testsuperadmin",
				email: "testsuperadmin@oeaw.ac.at",
				user_role: "superadmin",
				firstname: "testsuperadmin",
				lastname: "test",
			}),
		});

		body = await superadmin.json();
		body.password = "testsuperadmin";
		users.push(body);
	});

	afterEach(async () => {
		await logoutUser(loginHeaders);
	});

	afterAll(async () => {
		await db.deleteFrom("user_account").where("username", "ilike", "test%").execute();
		await logoutUser(loginHeaders);
	});

	test("attempt to call endpoint as user who is not signed in, should return status code 403", async () => {
		const response = await app.request("/user/roles/admin", {
			method: "GET",
		});
		expect(response.status).toBe(403);
	});

	test("attempt to call endpoint as user who is signed in as editor, should return status code 403", async () => {
		const sessionCookie = await loginUserAndReturnCookie(
			users[0]?.email ?? "",
			users[0]?.password ?? "",
		);
		loginHeaders.Cookie = sessionCookie;
		const response = await app.request("/user/roles/admin", {
			headers: loginHeaders,
			method: "GET",
		});

		expect(response.status).toBe(403);
	});

	test("Call endpoint as admin and list all editors, should return one entry with the editor", async () => {
		const sessionCookie = await loginUserAndReturnCookie(
			users[1]?.email ?? "",
			users[1]?.password ?? "",
		);
		loginHeaders.Cookie = sessionCookie;
		const response = await app.request("/user/roles/editor", {
			headers: loginHeaders,
			method: "GET",
		});

		const body = await response.json();
		expect(body).toHaveLength(2);
		// expect(body[0].username).toBe("testeditor");
	});

	test("Call endpoint as superadmin and list all admins, should return one entry with the admin", async () => {
		const sessionCookie = await loginUserAndReturnCookie(
			users[2]?.email ?? "",
			users[2]?.password ?? "",
		);
		loginHeaders.Cookie = sessionCookie;
		const response = await app.request("/user/roles/admin", {
			headers: loginHeaders,
			method: "GET",
		});

		const body = await response.json();
		expect(body).toHaveLength(2);
		//expect(body[0].username).toBe("testadmin");
	});

	test("Call endpoint as superadmin and try to use an invalid role, should return status code 400", async () => {
		const sessionCookie = await loginUserAndReturnCookie(
			users[2]?.email ?? "",
			users[2]?.password ?? "",
		);
		loginHeaders.Cookie = sessionCookie;
		const response = await app.request("/user/roles/invalidrole", {
			headers: loginHeaders,
			method: "GET",
		});

		expect(response.status).toBe(400);
	});
});

describe("test endpoint PUT /user/roles/:id", () => {
	const loginHeaders = structuredClone(apiHeaders);

	const users: Array<{
		username: string;
		email: string;
		role_name: Userroles;
		firstname: string;
		lastname: string;
		password: string;
		id: number;
	}> = [];
	beforeAll(async () => {
		// create admin, superadmin and user account
		// login as admin
		const sessionCookie = await loginUserAndReturnCookie("admin@oeaw.ac.at", "adminadmin");
		loginHeaders.Cookie = sessionCookie;

		const editorUser = await app.request("/auth/signup", {
			headers: loginHeaders,
			method: "POST",
			body: JSON.stringify({
				username: "testeditor",
				password: "testeditor",
				email: "testeditor@oeaw.ac.at",
				user_role: "editor",
				firstname: "testeditor",
				lastname: "test",
			}),
		});

		let body = await editorUser.json();
		body.password = "testeditor";
		users.push(body);

		const testadminUser = await app.request("/auth/signup", {
			headers: loginHeaders,
			method: "POST",
			body: JSON.stringify({
				username: "testadmin",
				password: "testtest",
				email: "testadmin@oeaw.ac.at",
				user_role: "admin",
				firstname: "testadmin",
				lastname: "test",
			}),
		});

		body = await testadminUser.json();
		body.password = "testtest";
		users.push(body);

		const superadmin = await app.request("/auth/signup", {
			headers: loginHeaders,
			method: "POST",
			body: JSON.stringify({
				username: "testsuperadmin",
				password: "testsuperadmin",
				email: "testsuperadmin@oeaw.ac.at",
				user_role: "superadmin",
				firstname: "testsuperadmin",
				lastname: "test",
			}),
		});

		body = await superadmin.json();
		body.password = "testsuperadmin";
		users.push(body);
	});

	afterEach(async () => {
		await logoutUser(loginHeaders);
		if (users[0]?.id) {
			await db
				.updateTable("user_has_role")
				.set("role_id", 2)
				.where("user_id", "=", users[0]?.id)
				.execute();
		}

		if (users[1]?.id) {
			await db
				.updateTable("user_has_role")
				.set("role_id", 1)
				.where("user_id", "=", users[1]?.id)
				.execute();
		}
	});

	afterAll(async () => {
		await db.deleteFrom("user_account").where("username", "ilike", "test%").execute();
		await logoutUser(loginHeaders);
	});

	test("attempt to call endpoint as user who is not signed in, should return status code 403", async () => {
		const response = await app.request("/user/roles/3", {
			method: "GET",
		});
		expect(response.status).toBe(403);
	});

	test("attempt to call endpoint as user who is signed in as editor, should return status code 403", async () => {
		const sessionCookie = await loginUserAndReturnCookie(
			users[0]?.email ?? "",
			users[0]?.password ?? "",
		);
		loginHeaders.Cookie = sessionCookie;
		const response = await app.request("/user/roles/3", {
			headers: loginHeaders,
			method: "GET",
		});

		expect(response.status).toBe(403);
	});

	test("login as admin and change the role of the testeditor to an admin, should return status code 200, check if testeditor is an admin now", async () => {
		const sessionCookie = await loginUserAndReturnCookie(
			users[1]?.email ?? "",
			users[1]?.password ?? "",
		);
		loginHeaders.Cookie = sessionCookie;
		const response = await app.request(`/user/roles/${String(users[0]?.id)}`, {
			headers: loginHeaders,
			method: "PUT",
			body: JSON.stringify({
				role: ["admin"],
			}),
		});

		expect(response.status).toBe(200);

		//Check role of user by fetching user data
		const user = await app.request(`/user/${String(users[0]?.id)}`, {
			headers: loginHeaders,
			method: "GET",
		});
		const body = await user.json();
		expect(body.role_name).toBe("admin");
	});

	test("login as superadmin and change the role of the admin to a superadmin, should return status code 200, check if admin is a superadmin now", async () => {
		const sessionCookie = await loginUserAndReturnCookie(
			users[2]?.email ?? "",
			users[2]?.password ?? "",
		);
		loginHeaders.Cookie = sessionCookie;
		const response = await app.request(`/user/roles/${String(users[1]?.id)}`, {
			headers: loginHeaders,
			method: "PUT",
			body: JSON.stringify({
				role: ["superadmin"],
			}),
		});

		expect(response.status).toBe(200);

		//Check role of user by fetching user data
		const user = await app.request(`/user/${String(users[1]?.id)}`, {
			headers: loginHeaders,
			method: "GET",
		});
		const body = await user.json();
		expect(body.role_name).toBe("superadmin");
	});

	test("login as admin and try to change the role of the superadmin to an admin, should return status code 403", async () => {
		const sessionCookie = await loginUserAndReturnCookie(
			users[1]?.email ?? "",
			users[1]?.password ?? "",
		);
		loginHeaders.Cookie = sessionCookie;
		const response = await app.request(`/user/roles/${String(users[2]?.id)}`, {
			headers: loginHeaders,
			method: "PUT",
			body: JSON.stringify({
				role: ["admin"],
			}),
		});

		expect(response.status).toBe(403);

		//Check role of user by fetching user data
		const user = await app.request(`/user/${String(users[2]?.id)}`, {
			headers: loginHeaders,
			method: "GET",
		});
		const body = await user.json();
		expect(body.role_name).toBe("superadmin");
	});

	test("login as admin and try to change the role of the admin to a superadmin, should return status code 403", async () => {
		const sessionCookie = await loginUserAndReturnCookie(
			users[1]?.email ?? "",
			users[1]?.password ?? "",
		);
		loginHeaders.Cookie = sessionCookie;
		const response = await app.request(`/user/roles/${String(users[1]?.id)}`, {
			headers: loginHeaders,
			method: "PUT",
			body: JSON.stringify({
				role: ["superadmin"],
			}),
		});

		expect(response.status).toBe(403);

		//Check role of user by fetching user data
		const user = await app.request(`/user/${String(users[1]?.id)}`, {
			headers: loginHeaders,
			method: "GET",
		});
		const body = await user.json();
		expect(body.role_name).toBe("admin");
	});
});

// TODO finish testing: describe("test endpoint PUT /user/data/:id", () => {});
