import { locales } from "@/config/i18n.config";

import { expect, test } from "../../lib/test";

test.describe("index page", () => {
	test("should have document title", async ({ createIndexPage }) => {
		for (const locale of locales) {
			const { i18n, indexPage } = await createIndexPage(locale);
			await indexPage.goto();

			await expect(indexPage.page).toHaveTitle(
				[i18n.t("HomePage.meta.title"), i18n.t("DefaultLayout.meta.title")].join(" | "),
			);
		}
	});

	// OBJECTION, YOUR HONOR
	// test("should not have any automatically detectable accessibility issues", async ({
	// 	createAccessibilityScanner,
	// 	createIndexPage,
	// }) => {
	// 	for (const locale of locales) {
	// 		const { indexPage } = await createIndexPage(locale);
	// 		await indexPage.goto();

	// 		const { getViolations } = await createAccessibilityScanner();
	// 		expect(await getViolations()).toEqual([]);
	// 	}
	// });

	test("should not have visible changes", async ({ createIndexPage }) => {
		for (const locale of locales) {
			const { indexPage } = await createIndexPage(locale);

			await indexPage.goto();

			const statsLocators = indexPage.page.locator('[data-testid="stats-count"]');

			await expect(indexPage.page).toHaveScreenshot({
				mask: [statsLocators],
				stylePath: "./e2e/lib/screenshot.css",
				maxDiffPixelRatio: 0.01,
			});
		}
	});
});
