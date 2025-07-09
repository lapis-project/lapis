import { join } from "node:path";

import { defineConfig, devices } from "@playwright/test";
import { isCI } from "ci-info";
import { config as dotenv } from "dotenv";
import { expand } from "dotenv-expand";
import os from "os";

for (const envFilePath of [
	".env.dev.local",
	".env.test.local",
	".env.local",
	".env.test",
	".env",
]) {
	expand(dotenv({ path: join(process.cwd(), envFilePath) }));
}

const frontendPort = 3000;
const isMac = os.platform() === "darwin";
const backendPort = isMac ? 5001 : 5000;
const frontendBaseUrl = `http://localhost:${String(frontendPort)}`;
const backendBaseUrl = `http://localhost:${String(backendPort)}`;

// make API base URL available to the tests and nuxt app
process.env.NUXT_PUBLIC_API_BASE_URL = backendBaseUrl;

export default defineConfig({
	testDir: "./e2e",
	snapshotDir: "./e2e/snapshots",
	fullyParallel: true,
	forbidOnly: isCI,
	retries: isCI ? 2 : 0,
	maxFailures: 10,
	workers: isCI ? 1 : undefined,
	reporter: isCI ? "github" : "html",
	use: {
		baseURL: frontendBaseUrl,
		trace: "on-first-retry",
	},
	projects: [
		{
			name: "setup",
			testMatch: "global.setup.ts",
		},
		{
			name: "chromium",
			use: { ...devices["Desktop Chrome"] },
			dependencies: ["setup"],
		},
		// {
		// 	name: "firefox",
		// 	use: { ...devices["Desktop Firefox"] },
		// 	dependencies: ["setup"],
		// },
		// {
		// 	name: "webkit",
		// 	use: { ...devices["Desktop Safari"] },
		// 	dependencies: ["setup"],
		// },
		/** Test against mobile viewports. */
		// {
		//      name: "Mobile Chrome",
		//      use: { ...devices["Pixel 5"] },
		//      dependencies: ["setup"],
		// },
		// {
		//      name: "Mobile Safari",
		//      use: { ...devices["iPhone 12"] },
		//      dependencies: ["setup"],
		// },
		/** Test against branded browsers. */
		// {
		//      name: "Microsoft Edge",
		//      use: { ...devices["Desktop Edge"], channel: "msedge" },
		//      dependencies: ["setup"],
		// },
		// {
		//      name: "Google Chrome",
		//      use: { ...devices["Desktop Chrome"], channel: "chrome" },
		//      dependencies: ["setup"],
		// },
	],
	webServer: [
		{
			name: "Hono",
			command: "pnpm -w dev:backend",
			url: backendBaseUrl,
			env: { PORT: String(backendPort) }, // if your API reads PORT
			reuseExistingServer: !isCI,
			timeout: 60_000,
		},
		{
			name: "LexAT21",
			command: "pnpm start",
			url: frontendBaseUrl,
			reuseExistingServer: !isCI,
			timeout: 120_000,
		},
	],
});
