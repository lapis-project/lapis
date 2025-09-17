import tsConfigPaths from "vite-tsconfig-paths";
import { configDefaults, defineConfig } from "vitest/config";

export default defineConfig({
	plugins: [tsConfigPaths()],
	test: {
		include: ["**/tests/**/(*.)+(spec|test).+(ts|tsx|js)"],
		exclude: [...configDefaults.exclude, "**/sandbox/**", "**/*.case.test.+(ts|tsx|js)"],
		// setupFiles: ["./tests/setup-vitest.ts"],
		coverage: {
			enabled: true,
			provider: "v8",
			reportsDirectory: "./coverage/raw/default",
			reporter: ["json", "text", "html"],
			exclude: [
				...(configDefaults.coverage.exclude ?? []),
				"benchmarks",
				"runtime_tests",
				"build.ts",
				"tsdown.config.ts",
				"src/index.ts",
				"src/test-utils",

				// types are compile-time only, so their coverage cannot be measured
				"src/**/apiTypes.ts",
				"src/jsx/intrinsic-elements.ts",
				"src/utils/http-status.ts",
				"src/utils/backend-types.ts",
			],
		},
		alias: {
			"@/": "./src", // Dont use relative aliase, use this instead
		},
		pool: "forks",
	},
});
