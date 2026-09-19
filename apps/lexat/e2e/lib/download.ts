import { expect, type Locator, type Page } from "@playwright/test";

export async function downloadCsv(page: Page, button: Locator) {
	await button.click();
	const dialog = page.getByRole("dialog");
	const download = dialog.getByRole("button", { name: "Download", exact: true });
	await expect(download).toBeDisabled();
	await dialog.getByRole("checkbox").check();
	await expect(download).toBeEnabled();
	const [file] = await Promise.all([page.waitForEvent("download"), download.click()]);
	await expect(dialog).toBeHidden();
	return file;
}
