import { expect, test } from "@playwright/test";

import { gotoPage } from "../../lib/navigation";

test("returns to the requested protected URL after signing in", async ({ page }) => {
	const user = { id: 1, email: "editor@oeaw.ac.at", username: "editor", role_name: "editor" };
	let signedIn = false;
	await page.route("**/auth/login", (route) => {
		signedIn = true;
		return route.fulfill({ json: user });
	});
	await page.route("**/auth/session", (route) => {
		return signedIn ? route.fulfill({ json: user }) : route.fulfill({ status: 401 });
	});
	await page.route("**/cms/articles/all/1?*", (route) => {
		return route.fulfill({ json: { articles: [], totalResults: 0 } });
	});

	const destination = "/en/admin/articles?page=2&filter=a%2Bb%26c#main-content";
	await gotoPage(page, destination);
	await expect(page).toHaveURL((url) => url.pathname === "/en/login");
	await page.getByLabel("Email").fill(user.email);
	await page.getByLabel("Password").fill("test-password");
	await page.getByRole("button", { name: "Submit" }).click();

	await expect(page).toHaveURL(destination);
});
