import { createUrl } from "@acdh-oeaw/lib";

import { locales } from "@/config/i18n.config";
import { expect, test } from "@/e2e/lib/test";

const baseUrl = process.env.NUXT_PUBLIC_APP_BASE_URL!;

test.describe("app", () => {
	if (process.env.NUXT_PUBLIC_BOTS !== "enabled") {
		test("should serve a robots.txt which disallows search engine bots", async ({ request }) => {
			const response = await request.get("/robots.txt");
			const body = await response.body();

			expect(body.toString()).toEqual(
				["User-Agent: *", "Disallow: /", `Host: ${baseUrl}`].join("\n"),
			);
		});
	} else {
		test("should serve a robots.txt", async ({ request }) => {
			const response = await request.get("/robots.txt");
			const body = await response.body();

			expect(body.toString()).toEqual(
				[
					"User-Agent: *",
					"Allow: /",
					`Host: ${baseUrl}`,
					`Sitemap: ${String(createUrl({ baseUrl, pathname: "sitemap.xml" }))}`,
				].join("\n"),
			);
		});
	}

	test("should serve a sitemap.xml", async ({ request }) => {
		// 1 ️. fetch the index
		const index = await request.get("/sitemap.xml");
		const indexXml = await index.text();
		expect(indexXml).toContain("<sitemapindex");

		// 2 ️. follow each locale sitemap and assert its URLs
		for (const locale of locales) {
			const subUrl = `/__sitemap__/${locale}.xml`;
			const sub = await request.get(subUrl);
			const subXml = await sub.text();

			for (const path of ["", "/articles"]) {
				const loc = createUrl({ baseUrl, pathname: `/${locale}${path}` }).toString();
				expect(subXml).toContain(`<loc>${loc}</loc>`);
			}
		}
	});

	test("should serve a webmanifest", async ({ request }) => {
		const response = await request.get("/manifest.webmanifest");
		// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
		const json = await response.json();

		// TODO: use toMatchSnapshot
		expect(json).toEqual({
			name: "LexAT21",
			short_name: "LexAT21",
			description: "Atlas on lexical variation in Austria in the 21st century",
			start_url: "/",
			display: "standalone",
			background_color: "#fff",
			theme_color: "#fff",
			icons: [
				{ src: "/icon.svg", sizes: "any", type: "image/svg+xml" },
				{ src: "/icon-maskable.svg", sizes: "any", type: "image/svg+xml", purpose: "maskable" },
				{ src: "/android-chrome-192x192.png", sizes: "192x192", type: "image/png" },
				{ src: "/android-chrome-512x512.png", sizes: "512x512", type: "image/png" },
			],
		});
	});

	test("should serve a favicon.ico", async ({ request }) => {
		const response = await request.get("/favicon.ico");
		const status = response.status();

		expect(status).toEqual(200);
	});

	test("should serve an svg favicon", async ({ request }) => {
		const response = await request.get("/icon.svg");
		const status = response.status();

		expect(status).toEqual(200);
	});

	test("should serve an apple favicon", async ({ request }) => {
		const response = await request.get("/apple-icon.png");
		const status = response.status();

		expect(status).toEqual(200);
	});

	test.describe("should set color mode according to system preference", () => {
		test.use({ colorScheme: "no-preference" });

		test("with no preference", async ({ page }) => {
			await page.goto("/en");
			await expect(page.locator("html")).toHaveAttribute("data-ui-color-scheme", "light");
		});
	});

	test.describe("should set color mode according to system preference", () => {
		test.use({ colorScheme: "light" });

		test("in light mode", async ({ page }) => {
			await page.goto("/en");
			await expect(page.locator("html")).toHaveAttribute("data-ui-color-scheme", "light");
		});
	});

	test.describe("should set color mode according to system preference", () => {
		test.use({ colorScheme: "dark" });

		test("in dark mode", async ({ page }) => {
			await page.goto("/en");
			await expect(page.locator("html")).toHaveAttribute("data-ui-color-scheme", "dark");
		});
	});

	test("should skip to main content with skip-link", async ({ createIndexPage }) => {
		const locale = "en";

		const { indexPage } = await createIndexPage(locale);
		await indexPage.goto();

		await indexPage.page.keyboard.press("Tab");
		await expect(indexPage.skipLink).toBeFocused();

		await indexPage.page.keyboard.press("Enter");
		await expect(indexPage.mainContent).toBeFocused();
	});
});
