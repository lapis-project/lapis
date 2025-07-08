import { createUrl } from "@acdh-oeaw/lib";

import { expect, test } from "@/e2e/lib/test";

if (process.env.NUXT_PUBLIC_MATOMO_BASE_URL && process.env.NUXT_PUBLIC_MATOMO_ID) {
	const baseUrl = String(
		createUrl({ baseUrl: process.env.NUXT_PUBLIC_MATOMO_BASE_URL, pathname: "/**" }),
	);

	test.describe("analytics service", () => {
		test("should track page views", async ({ page }) => {
			const initialResponsePromise = page.waitForResponse(baseUrl);
			await page.goto("/de");
			const initialResponse = await initialResponsePromise;
			expect(initialResponse.status()).toBe(200);

			const responsePromise = page.waitForResponse(baseUrl);
			const mainNav = page.getByRole("navigation", { name: "Hauptnavigation" });
			await mainNav.getByRole("link", { name: "Kartenkommentare" }).click();
			const response = await responsePromise;
			expect(response.status()).toBe(204);
		});
	});
}
