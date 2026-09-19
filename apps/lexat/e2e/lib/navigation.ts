import type { Page } from "@playwright/test";

/** Wait for Nuxt hydration before interacting with server-rendered controls. */
export async function gotoPage(page: Page, url: string) {
	await page.goto(url, { waitUntil: "domcontentloaded" });
	await page.waitForFunction(() => {
		const root = document.querySelector("#__nuxt") as Element & {
			__vue_app__?: { $nuxt?: { isHydrating: boolean } };
		};
		return root?.__vue_app__?.$nuxt?.isHydrating === false;
	});
}
