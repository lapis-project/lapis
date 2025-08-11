import baseConfig from "@acdh-oeaw/eslint-config";
import nuxtConfig from "@acdh-oeaw/eslint-config-nuxt";
import vueConfig from "@acdh-oeaw/eslint-config-vue";
import gitignore from "eslint-config-flat-gitignore";
import { config } from "typescript-eslint";

import { withNuxt } from "./.nuxt/eslint.config.mjs";

const configs = config(
	gitignore({ strict: false }),
	{ ignores: ["public/**"] },
	baseConfig,
	vueConfig,
	nuxtConfig,
	{
		files: ["**/*.vue"],
		rules: {
			"vue/attributes-order": ["warn", { alphabetical: true }],
		},
	},
);

// eslint-disable-next-line @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-explicit-any
export default withNuxt(configs as any);
