import { defineConfig } from "oxfmt";

const config = defineConfig({
	endOfLine: "lf",
	ignorePatterns: [
		"**/assets/data/*.json",
		"apps/*/.nuxt/**",
		"apps/*/.output/**",
		"apps/*/content/**",
		"apps/*/public/**",
		"apps/backend/files/**",
		"apps/backend/persistent/**",
		"apps/backend/private_data/**",
		"apps/backend/src/types/db.d.ts",
		"apps/backend/src/types/noske.d.ts",
		"apps/lexat/e2e/snapshots/**",
		".gitignore",
		"db/**",
		"pnpm-workspace.yaml",
	],
	jsdoc: true,
	printWidth: 100,
	proseWrap: "always",
	semi: true,
	singleQuote: false,
	sortImports: {
		groups: [
			["side_effect"],
			["side_effect_style"],
			["style"],
			["builtin"],
			["external"],
			["internal", "subpath"],
			["unknown"],
		],
	},
	sortPackageJson: {
		sortScripts: true,
	},
	tabWidth: 2,
	trailingComma: "all",
	useTabs: true,
});

export default config;
