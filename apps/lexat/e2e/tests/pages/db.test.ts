import fs from "node:fs/promises";

import { expect, test } from "@playwright/test";

test.describe("DB page functionality", () => {
	test.beforeEach(async ({ page }) => {
		await page.goto("/db");
	});

	test("default page has a selected question,  and  table rows", async ({ page }) => {
		const questions = page.getByTestId("questions");
		await expect(questions).toContainText("AUGENLID/LID");

		const results = page.locator("main").getByText(/^\d+\s+Ergebnisse$/);
		await expect(results).toHaveText(/5806\s+Ergebnisse/);

		await expect(page.getByRole("row")).toHaveCount(102);
	});

	test("page filters", async ({ page }) => {
		// change the question
		await page.getByTestId("questions").click();
		await page.getByRole("option", { name: /DOTTER\/EIGELB/ }).click();

		await expect(page).toHaveURL((url) => {
			const p = new URL(url).searchParams;
			return (
				p.get("a") === "0,100" &&
				p.get("q") === "44" &&
				p.get("r") === "all" &&
				p.get("v") === "all"
			);
		});

		const results = page.locator("main").getByText(/^\d+\s+Ergebnisse$/);
		await expect(results).toHaveText(/5919\s+Ergebnisse/);

		// change the register
		await page.getByTestId("registers").click();
		await page.getByRole("option", { name: /Ihr Hochdeutsch/ }).click();

		await expect(page).toHaveURL((url) => {
			const p = new URL(url).searchParams;
			return (
				p.get("a") === "0,100" && p.get("q") === "44" && p.get("r") === "4" && p.get("v") === "all"
			);
		});

		await expect(results).toHaveText(/417\s+Ergebnisse/);

		// change the variant
		await page.getByTestId("variants").click();
		await page.getByRole("option", { name: /Dotter/ }).click();

		await expect(page).toHaveURL((url) => {
			const p = new URL(url).searchParams;
			return (
				p.get("a") === "0,100" &&
				p.get("q") === "44" &&
				p.get("r") === "4" &&
				p.get("v") === "Dotter"
			);
		});
		await expect(results).toHaveText(/166\s+Ergebnisse/);

		await page.getByTestId("reset").click();
		const questions = page.getByTestId("questions");
		await expect(questions).toHaveText(/AUGENLID\/LID/);
		await expect(results).toHaveText(/5806\s+Ergebnisse/);
	});

	test("age slider", async ({ page }) => {
		// move the lower‑bound thumb from 0 to 10
		const thumb = page.getByRole("slider").first();

		await thumb.focus();
		await thumb.press("Home");
		await thumb.press("ArrowRight"); // +5
		await thumb.press("ArrowRight");

		await expect(page).toHaveURL((url) => {
			const p = new URL(url).searchParams;
			return (
				p.get("a") === "10,100" &&
				p.get("q") === "11" &&
				p.get("r") === "all" &&
				p.get("v") === "all"
			);
		});

		const results = page.locator("main").getByText(/^\d+\s+Ergebnisse$/);
		await expect(results).toHaveText(/5800\s+Ergebnisse/);
	});

	test("rows per page", async ({ page }) => {
		const rowsSelect = page.getByTestId("rows-per-page");
		await expect(rowsSelect).toHaveText(/100/);
		await rowsSelect.click();
		await page.getByRole("option", { name: /250/ }).click();
		await expect(rowsSelect).toHaveText(/250/);
	});

	test("csv download", async ({ page }, testInfo) => {
		const [download] = await Promise.all([
			page.waitForEvent("download"),
			page.getByRole("button", { name: /Als CSV herunterladen/i }).click(),
		]);
		const suggested = download.suggestedFilename();
		expect(suggested).toMatch(/^db-augenlid_lid-\d{8}\.csv$/);

		const filePath = testInfo.outputPath(suggested);
		await download.saveAs(filePath);

		const csv = await fs.readFile(filePath, "utf8");
		expect(csv.split("\n")).toHaveLength(5807); // header (1) + items (5806)
	});

	// TODO
	// test("citation suggestion", async ({ page }) => {
	// 	// open popover and check url & date in citation
	// });
});
