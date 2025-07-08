import { createUrl } from "@acdh-oeaw/lib";

import { locales } from "@/config/i18n.config";
import { expect, test } from "@/e2e/lib/test";

const baseUrl = process.env.NUXT_PUBLIC_APP_BASE_URL!;

test("should set a canonical url", async ({ page }) => {
	for (const locale of locales) {
		await page.goto(`/${locale}`);

		const canonicalUrl = page.locator('link[rel="canonical"]');
		await expect(canonicalUrl).toHaveAttribute(
			"href",
			String(createUrl({ baseUrl, pathname: `/${locale}` })),
		);
	}
});

test("should set document title on not-found page", async ({ page }) => {
	await page.goto("/unknown");
	await expect(page).toHaveTitle("Seite nicht gefunden | LexAT21");

	await page.goto("/en/unknown");
	await expect(page).toHaveTitle("Page not found | LexAT21");
});

test("should disallow indexing of not-found page", async ({ page }) => {
	for (const pathname of ["/unknown", "/de/unknown"]) {
		await page.goto(pathname);

		const ogTitle = page.locator('meta[name="robots"]');
		await expect(ogTitle).toHaveAttribute("content", "noindex");
	}
});

test.describe("should set page metadata", () => {
	test("static", async ({ page }) => {
		await page.goto("/en");

		const ogType = page.locator('meta[property="og:type"]');
		await expect(ogType).toHaveAttribute("content", "website");

		const twCard = page.locator('meta[name="twitter:card"]');
		await expect(twCard).toHaveAttribute("content", "summary_large_image");

		const twCreator = page.locator('meta[name="twitter:creator"]');
		await expect(twCreator).toHaveAttribute("content", "@acdh_oeaw");

		const twSite = page.locator('meta[name="twitter:site"]');
		await expect(twSite).toHaveAttribute("content", "@acdh_oeaw");

		// const googleSiteVerification = page.locator('meta[name="google-site-verification"]');
		// await expect(googleSiteVerification).toHaveAttribute("content", "");
	});

	test("with en locale", async ({ page }) => {
		await page.goto("/en");

		await expect(page).toHaveTitle("Homepage | LexAT21");

		const metaDescription = page.locator('meta[name="description"]');
		await expect(metaDescription).toHaveAttribute(
			"content",
			"The LexAT21 project aims to document lexical diversity and ist dynamics in the 21st century. It is a collaboration between researchers from the University of Vienna and the Austrian Academy of Sciences.",
		);

		const ogTitle = page.locator('meta[property="og:title"]');
		await expect(ogTitle).toHaveAttribute("content", "Homepage");

		const ogDescription = page.locator('meta[property="og:description"]');
		await expect(ogDescription).toHaveAttribute(
			"content",
			"The LexAT21 project aims to document lexical diversity and ist dynamics in the 21st century. It is a collaboration between researchers from the University of Vienna and the Austrian Academy of Sciences.",
		);

		const ogUrl = page.locator('meta[property="og:url"]');
		await expect(ogUrl).toHaveAttribute("content", String(createUrl({ baseUrl, pathname: "/en" })));

		const ogLocale = page.locator('meta[property="og:locale"]');
		await expect(ogLocale).toHaveAttribute("content", "en");
	});

	test("with de locale", async ({ page }) => {
		await page.goto("/de");

		await expect(page).toHaveTitle("Startseite | LexAT21");

		const metaDescription = page.locator('meta[name="description"]');
		await expect(metaDescription).toHaveAttribute(
			"content",
			"Das Projekt LexAT21 setzt es sich zum Ziel, lexikalische Vielfalt und ihre Dynamik im 21. Jahrhundert zu dokumentieren. Das Projekt wird in Kooperation von Forschenden der Universität Wien und der Österreichischen Akademie der Wissenschaften durchgeführt.",
		);

		const ogTitle = page.locator('meta[property="og:title"]');
		await expect(ogTitle).toHaveAttribute("content", "Startseite");

		const ogDescription = page.locator('meta[property="og:description"]');
		await expect(ogDescription).toHaveAttribute(
			"content",
			"Das Projekt LexAT21 setzt es sich zum Ziel, lexikalische Vielfalt und ihre Dynamik im 21. Jahrhundert zu dokumentieren. Das Projekt wird in Kooperation von Forschenden der Universität Wien und der Österreichischen Akademie der Wissenschaften durchgeführt.",
		);

		const ogUrl = page.locator('meta[property="og:url"]');
		await expect(ogUrl).toHaveAttribute("content", String(createUrl({ baseUrl, pathname: "/de" })));

		const ogLocale = page.locator('meta[property="og:locale"]');
		await expect(ogLocale).toHaveAttribute("content", "de");
	});
});

test.describe("should add json+ld metadata", () => {
	test("with en locale", async ({ page }) => {
		await page.goto("/en");

		const metadata = await page.locator('script[type="application/ld+json"]').textContent();
		// eslint-disable-next-line playwright/prefer-web-first-assertions
		expect(metadata).toBe(
			JSON.stringify({
				"@context": "https://schema.org",
				"@type": "WebSite",
				name: "LexAT21",
				description: "Atlas on lexical variation in Austria in the 21st century",
			}),
		);
	});

	test("with de locale", async ({ page }) => {
		await page.goto("/de");

		const metadata = await page.locator('script[type="application/ld+json"]').textContent();
		// eslint-disable-next-line playwright/prefer-web-first-assertions
		expect(metadata).toBe(
			JSON.stringify({
				"@context": "https://schema.org",
				"@type": "WebSite",
				name: "LexAT21",
				description: "Atlas zur lexikalischen Variation in Österreich im 21. Jahrhundert",
			}),
		);
	});
});

test("should serve an open-graph image", async ({ page, request }) => {
	for (const locale of locales) {
		// FIXME: serve og image per locale
		// const imagePath = `/${locale}/opengraph-image.png`;
		const imagePath = "/opengraph-image.png";

		await page.goto(`/${locale}`);
		await expect(page.locator('meta[property="og:image"]')).toHaveAttribute(
			"content",
			expect.stringContaining(String(createUrl({ baseUrl, pathname: imagePath }))),
		);

		const response = await request.get(imagePath);
		const status = response.status();
		const contentType = response.headers()["content-type"];

		expect(status).toBe(200);
		expect(contentType).toBe("image/png");
	}
});
