import tsConfigPaths from "vite-tsconfig-paths";
import { configDefaults, defineConfig } from "vitest/config";

export default defineConfig({
	plugins: [tsConfigPaths()],
	test: {
		include: ["**/tests/**/(*.)+(spec|test).+(ts|tsx|js)"],
		exclude: [...configDefaults.exclude, "**/sandbox/**", "**/*.case.test.+(ts|tsx|js)"],
		// setupFiles: ["./tests/setup-vitest.ts"],
		coverage: {
			enabled: false,
			provider: "v8",
			reportsDirectory: "./coverage/raw/default",
			reporter: ["json", "text", "html"],
			exclude: [
				...(configDefaults.coverage.exclude ?? []),
				"benchmarks",
				"runtime_tests",
				"build.ts",
				"src/test-utils",

				// types are compile-time only, so their coverage cannot be measured
				"src/**/types.ts",
				"src/jsx/intrinsic-elements.ts",
				"src/utils/http-status.ts",
			],
		},
		alias: {
			"@/": "./src", // Dont use relative aliase, use this instead
		},
		pool: "forks",
	},
});
