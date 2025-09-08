import { dirname } from "node:path";
import { fileURLToPath } from "node:url";

import baseConfig from "@acdh-oeaw/eslint-config";
import nuxtConfig from "@acdh-oeaw/eslint-config-nuxt";
import playwrightConfig from "@acdh-oeaw/eslint-config-playwright";
import vueConfig from "@acdh-oeaw/eslint-config-vue";
import { defineConfig } from "eslint/config";
import gitignore from "eslint-config-flat-gitignore";

import { withNuxt } from "./.nuxt/eslint.config.mjs";

const tsconfigRootDir = dirname(fileURLToPath(import.meta.url));

const configs = defineConfig(
	gitignore({ strict: false }),
	{ ignores: ["public/**"] },
	baseConfig,
	vueConfig,
	nuxtConfig,
	playwrightConfig,
	{
		files: ["**/*.vue"],
		rules: {
			"vue/attributes-order": ["warn", { alphabetical: true }],
		},
	},
	{
		languageOptions: {
			parserOptions: {
				tsconfigRootDir,
				projectService: true,
			},
		},
	},
);

// eslint-disable-next-line @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-explicit-any
export default withNuxt(configs as any);
