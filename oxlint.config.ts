import { defineConfig } from "oxlint";

const config = defineConfig({
	categories: {
		correctness: "error",
		suspicious: "warn",
	},
	env: {
		builtin: true,
		esnext: true,
	},
	ignorePatterns: [
		"apps/*/.nuxt/**",
		"apps/*/.output/**",
		"apps/*/content/**",
		"apps/*/public/**",
		"apps/backend/files/**",
		"apps/backend/persistent/**",
		"apps/backend/private_data/**",
		"apps/lexat/e2e/snapshots/**",
		"db/**",
	],
	options: {
		reportUnusedDisableDirectives: "warn",
	},
	plugins: ["eslint", "import", "oxc", "typescript", "unicorn"],
	rules: {
		"eslint/no-console": ["warn", { allow: ["warn", "error"] }],
		"eslint/no-shadow": "off",
		"eslint/no-underscore-dangle": "off",
		"eslint/no-unused-vars": ["error", { argsIgnorePattern: "^_", varsIgnorePattern: "^_" }],
		"import/no-unassigned-import": ["warn", { allow: ["**/*.css"] }],
		"typescript/no-non-null-assertion": "off",
		"typescript/no-unsafe-type-assertion": "off",
	},
	overrides: [
		{
			files: [
				"*.config.{js,mjs,ts}",
				"apps/backend/**/*.{js,ts}",
				"apps/*/*.config.{js,mjs,ts}",
				"apps/*/e2e/**/*.{js,ts}",
				"apps/*/server/**/*.{js,ts}",
				"scripts/**/*.{js,mjs,ts}",
			],
			env: {
				node: true,
			},
			plugins: ["eslint", "import", "node", "oxc", "typescript", "unicorn"],
		},
		{
			files: ["apps/*/app/**/*.{js,ts,vue}", "apps/*/i18n/**/*.{js,ts}"],
			env: {
				browser: true,
			},
		},
		{
			files: ["apps/*/**/*.vue"],
			env: {
				browser: true,
			},
			plugins: ["eslint", "import", "oxc", "typescript", "unicorn", "vue"],
			rules: {
				"eslint/no-undef": "off",
			},
		},
	],
});

export default config;
