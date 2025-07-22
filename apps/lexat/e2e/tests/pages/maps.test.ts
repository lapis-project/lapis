import fs from "node:fs/promises";

import { expect, test } from "@playwright/test";

test.use({
	baseURL: "http://localhost:3000",
	storageState: {
		cookies: [],
		origins: [
			{
				origin: "http://localhost:3000", // ⬅️  no path
				localStorage: [
					{
						name: "map-onboarding",
						value: JSON.stringify({ finishedAt: "2025-05-20T12:12:39.122Z" }),
					},
				],
			},
		],
	},
});

test.describe("Maps page functionality", () => {
	test.beforeEach(async ({ page }) => {
		// stop external map/tiles from slowing the test
		await page.route(/(tile|maplibre|carto|openstreetmap)/, (r) => r.fulfill({ status: 204 }));

		// skip the redirect and wait just for the DOM
		await page.goto("/de/maps", { waitUntil: "domcontentloaded" });
	});

	test("page filters, url params and element visibility", async ({ page }) => {
		const questions = page.getByTestId("questions");
		await expect(questions).toContainText("Phänomen wählen...");

		const clipboardUrl = page.getByTestId("clipboard-url");
		await expect(clipboardUrl).toHaveText(/\/de\/maps$/);

		await expect(page.getByTestId("dataLegend")).toBeHidden();
		await expect(page.getByTestId("regionLegend")).toBeVisible();
		await expect(page.getByTestId("variantLegend")).toBeHidden();

		await expect(page.getByTestId("resetOnboarding")).toBeVisible();
		await expect(page.getByTestId("goToDbPage")).toBeHidden();

		await questions.click();
		await page.getByRole("option", { name: /AUGENLID\/LID/ }).click();

		await expect(page).toHaveURL((url) => {
			const p = new URL(url).searchParams;
			return (
				p.get("a") === "0,100" &&
				p.get("q") === "11" &&
				p.get("r") === "all" &&
				p.get("v") === "all" &&
				p.get("sv") === "false"
			);
		});
		await expect(clipboardUrl).toContainText("/de/maps?a=0,100&q=11&r=all&v=all&sv=false");

		await expect(page.getByTestId("datapoints")).toContainText("Ortspunkte: 538");
		await expect(page.getByTestId("informants")).toContainText("Antwortende: 1918");

		const locationTable = page.getByTestId("locationTable");
		await expect(locationTable).toBeVisible();
		await expect(locationTable.getByRole("row")).toHaveCount(1477);

		const variantTable = page.getByTestId("variantTable");
		await expect(variantTable).toBeVisible();
		await expect(variantTable.getByRole("row")).toHaveCount(8);

		await expect(page.getByTestId("dataLegend")).toBeVisible();
		await expect(page.getByTestId("regionLegend")).toBeVisible();
		await expect(page.getByTestId("variantLegend")).toBeVisible();

		await expect(page.getByTestId("resetOnboarding")).toBeHidden();
		await expect(page.getByTestId("goToDbPage")).toBeVisible();

		// change the register
		const registers = page.getByTestId("registers");
		await registers.click();
		await page.getByRole("option", { name: /Ihr Hochdeutsch/ }).click();

		await expect(page).toHaveURL((url) => {
			const p = new URL(url).searchParams;
			return (
				p.get("a") === "0,100" &&
				p.get("q") === "11" &&
				p.get("r") === "4" &&
				p.get("v") === "all" &&
				p.get("sv") === "false"
			);
		});
		await expect(clipboardUrl).toContainText("/de/maps?a=0,100&q=11&r=4&v=all&sv=false");

		await expect(page.getByTestId("datapoints")).toContainText("Ortspunkte: 165");
		await expect(page.getByTestId("informants")).toContainText("Antwortende: 368");

		await expect(locationTable.getByRole("row", { includeHidden: true })).toHaveCount(188);
		await expect(variantTable.getByRole("row", { includeHidden: true })).toHaveCount(6);

		// change the variant
		const variants = page.getByTestId("variants");
		await variants.click();
		await page.getByRole("option", { name: /Augenlid/ }).click();

		await expect(page).toHaveURL((url) => {
			const p = new URL(url).searchParams;
			return (
				p.get("a") === "0,100" &&
				p.get("q") === "11" &&
				p.get("r") === "4" &&
				p.get("v") === "Augenlid" &&
				p.get("sv") === "false"
			);
		});
		await expect(clipboardUrl).toContainText("/de/maps?a=0,100&q=11&r=4&v=Augenlid&sv=false");

		await expect(page.getByTestId("datapoints")).toContainText("Ortspunkte: 131");
		await expect(page.getByTestId("informants")).toContainText("Antwortende: 271");

		await expect(locationTable.getByRole("row", { includeHidden: true })).toHaveCount(132);
		await expect(variantTable.getByRole("row", { includeHidden: true })).toHaveCount(3);

		await page.getByTestId("reset").click();
		await expect(questions).toContainText("Phänomen wählen...");
		await expect(registers).toContainText("Alle anzeigen");
		await expect(variants).toContainText("Alle anzeigen");
		await expect(locationTable).toBeHidden();
		await expect(variantTable).toBeHidden();
		await expect(page.getByTestId("dataLegend")).toBeHidden();
		await expect(page.getByTestId("regionLegend")).toBeVisible();
		await expect(page.getByTestId("variantLegend")).toBeHidden();
		await expect(page.getByTestId("resetOnboarding")).toBeVisible();
		await expect(page.getByTestId("goToDbPage")).toBeHidden();
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
				p.get("r") === "all" &&
				p.get("v") === "all" &&
				p.get("sv") === "false"
			);
		});
	});

	test("csv download", async ({ page }, testInfo) => {
		const questions = page.getByTestId("questions");

		await questions.click();
		await page.getByRole("option", { name: /AUGENLID\/LID/ }).click();

		const locationTable = page.getByTestId("locationTable");

		const [downloadLocationTable] = await Promise.all([
			page.waitForEvent("download"),
			locationTable.getByRole("button", { name: /Als CSV herunterladen/i }).click(),
		]);

		const suggested = downloadLocationTable.suggestedFilename();
		expect(suggested).toMatch(/^table-data-\d{8}\.csv$/);

		const filePath = testInfo.outputPath(suggested);
		await downloadLocationTable.saveAs(filePath);

		const csv = await fs.readFile(filePath, "utf8");
		expect(csv.split("\n")).toHaveLength(1476); // header (1) + items (5806)
	});

	test("reset onboarding", async ({ page }) => {
		const resetOnboarding = page.getByTestId("resetOnboarding");
		await expect(resetOnboarding).toBeVisible();
		await resetOnboarding.click();
		const onboardingStep = page.getByTestId("onboardingStep");
		await expect(onboardingStep.getByRole("heading", { name: "Hallo!" })).toBeVisible();
		await onboardingStep.getByRole("button", { name: "Weiter" }).click();
		await expect(onboardingStep.getByRole("heading", { name: "Phänomenauswahl" })).toBeVisible();
		await expect(onboardingStep.getByRole("button", { name: "Zurück" })).toBeVisible();
		await onboardingStep.getByRole("button", { name: "Weiter" }).click();
		await expect(onboardingStep.getByRole("heading", { name: "Weitere Filter" })).toBeVisible();
		await expect(onboardingStep.getByRole("button", { name: "Zurück" })).toBeVisible();
		await onboardingStep.getByRole("button", { name: "Weiter" }).click();
		await expect(
			onboardingStep.getByRole("heading", { name: "Filter zurücksetzen" }),
		).toBeVisible();
		await expect(onboardingStep.getByRole("button", { name: "Zurück" })).toBeVisible();
		await onboardingStep.getByRole("button", { name: "Weiter" }).click();
		await expect(
			onboardingStep.getByRole("heading", { name: "Erweiterte Funktionen" }),
		).toBeVisible();
		await expect(onboardingStep.getByRole("button", { name: "Zurück" })).toBeVisible();
		await onboardingStep.getByRole("button", { name: "Weiter" }).click();
		await expect(onboardingStep.getByRole("heading", { name: "Mehr erfahren" })).toBeVisible();
		await expect(onboardingStep.getByRole("button", { name: "Zurück" })).toBeVisible();
		await onboardingStep.getByRole("button", { name: "Los gehts!" }).click();

		// check if localStorage entry was set after onboarding is finished
		const item = await page.evaluate(() => window.localStorage.getItem("map-onboarding"));
		expect(item).not.toBeNull();
	});
});
