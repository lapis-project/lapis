import { createUrl } from "@acdh-oeaw/lib";

import { locales } from "@/config/i18n.config";
import { expect, test } from "@/e2e/lib/test";

const baseUrl = process.env.NUXT_PUBLIC_APP_BASE_URL!;

test.describe("i18n", () => {
	test.describe("should redirect root route to preferred locale", () => {
		test.use({ locale: "en" });

		test("with default locale", async ({ page }) => {
			await page.goto("/");
			await expect(page).toHaveURL("/en");
		});
	});

	test.describe("should redirect root route to preferred locale", () => {
		test.use({ locale: "de" });

		/**
		 * FIXME: Currently, this breaks when pre-rendering the page via `routeRules`.
		 * This is an upstream issue in `@nuxtjs/i18n`.
		 */
		test.fixme("with supported locale", async ({ page }) => {
			await page.goto("/");
			await expect(page).toHaveURL("/de");
		});
	});

	test.describe("should redirect root route to preferred locale", () => {
		test.use({ locale: "fr" });

		test("with unsupported locale", async ({ page }) => {
			await page.goto("/");
			await expect(page).toHaveURL("/de");
		});
	});

	test("should display not-found page for unknown locale", async ({ page }) => {
		const response = await page.goto("/unknown");
		expect(response?.status()).toBe(404);
		await expect(page.getByRole("heading", { name: "Seite nicht gefunden" })).toBeVisible();
	});

	test("should display localised not-found page for unknown pathname", async ({ page }) => {
		const response = await page.goto("/en/unknown");
		expect(response?.status()).toBe(404);
		await expect(page.getByRole("heading", { name: "Page not found" })).toBeVisible();
	});

	// test("should support switching locale", async ({ page }) => {
	// 	await page.goto("/de/imprint");
	// 	await expect(page).toHaveURL("/de/imprint");
	// 	await expect(page.getByRole("heading", { name: "Impressum" })).toBeVisible();
	// 	await expect(page).toHaveTitle("Impressum | ACDH-CH App");

	// 	await page.getByRole("link", { name: "Zu Englisch wechseln" }).click();

	// 	await expect(page).toHaveURL("/en/imprint");
	// 	await expect(page.getByRole("heading", { name: "Imprint" })).toBeVisible();
	// 	await expect(page).toHaveTitle("Imprint | ACDH-CH App");
	// });

	test("should set `lang` attribute on `html` element", async ({ page }) => {
		for (const locale of locales) {
			await page.goto(`/${locale}`);
			await expect(page.locator("html")).toHaveAttribute("lang", locale);
		}
	});

	const pathnames = ["", "/db"];

	/** Build the canonical absolute URL for a given pathname. */
	const abs = (pathname: string) => String(createUrl({ baseUrl, pathname }));

	test.describe.parallel("i18n alternate links", () => {
		for (const pathname of pathnames) {
			for (const locale of locales) {
				test(`locale=${locale} pathname=${pathname}`, async ({ page }) => {
					await page.goto(`/${locale}${pathname}`);

					const links = await page
						.locator('link[rel="alternate"]')
						.evaluateAll((el) =>
							el.map((e) => [e.getAttribute("hreflang"), e.getAttribute("href")]),
						);

					expect(links).toEqual(
						expect.arrayContaining([
							["x-default", abs(`/de${pathname}`)],
							["de", abs(`/de${pathname}`)],
							["en", abs(`/en${pathname}`)],
						]),
					);
				});
			}
		}
	});
});
