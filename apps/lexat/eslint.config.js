/** @typedef {import("typescript-eslint").Config} Config */

import baseConfig from "@acdh-oeaw/eslint-config";
import nuxtConfig from "@acdh-oeaw/eslint-config-nuxt";
import playwrightConfig from "@acdh-oeaw/eslint-config-playwright";
import vueConfig from "@acdh-oeaw/eslint-config-vue";
import gitignore from "eslint-config-flat-gitignore";

import { withNuxt } from "./.nuxt/eslint.config.mjs";

/** @type {Config} */
const config = [
	gitignore({ strict: false }),
	...baseConfig,
	...vueConfig,
	...nuxtConfig,
	// ...tailwindcssConfig, // DON'T USE TILL TAILWIND 4 COMPATIBLE
	...playwrightConfig,
	{
		rules: {
			"vue/attributes-order": ["warn", { alphabetical: true }],
		},
	},
];

export default withNuxt(/** @type {any} */ (config));
