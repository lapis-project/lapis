import { expect, test } from "@playwright/test";

import { gotoPage } from "../../lib/navigation";

test.describe("Article overview page functionality", () => {
	test.beforeEach(async ({ page }) => {
		await gotoPage(page, "/de/articles");
	});

	test("article search", async ({ page }) => {
		// type search term
		const searchField = page.locator("#search");
		await expect(searchField).toHaveValue("");
		await searchField.fill("dotter");

		// choose category
		const category = page.getByTestId("category");
		await expect(category).toContainText("Kategorie wählen...");
		await category.click();
		await page.getByRole("option", { name: "Kurzbeschreibung" }).click();
		await expect(category).toContainText("Kurzbeschreibung");

		// choose language
		const language = page.getByTestId("language");
		await expect(language).toContainText("Sprache wählen...");
		await language.click();
		await page.getByRole("option", { name: "Deutsch" }).click();
		await expect(language).toContainText("Deutsch");

		const submit = page.getByRole("button", { name: "Suche", exact: true });
		await submit.click();

		const results = page.getByTestId("results");
		await expect(results).toContainText("1 Eintrag");
		const articles = page.getByTestId("articles");
		await expect(articles.getByRole("listitem")).toHaveCount(1);
		await expect(articles.getByRole("heading", { name: /DOTTER\s*\/\s*EIGELB/ })).toBeVisible();

		await language.click();
		await page.getByRole("option", { name: "Englisch" }).click();
		await expect(language).toContainText("Englisch");
		await submit.click();
		await expect(results).toContainText("0 Einträge");

		await page.getByRole("button", { name: "Zurücksetzen" }).click();
		await expect(searchField).toHaveValue("");
		await expect(category).toContainText("Kategorie wählen...");
		await expect(language).toContainText("Sprache wählen...");
	});
});
