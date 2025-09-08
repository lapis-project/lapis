import { dirname } from "node:path";
import { fileURLToPath } from "node:url";

import baseConfig from "@acdh-oeaw/eslint-config";
import nodeConfig from "@acdh-oeaw/eslint-config-node";
import { defineConfig } from "eslint/config";
import gitignore from "eslint-config-flat-gitignore";

const tsconfigRootDir = dirname(fileURLToPath(import.meta.url));

const configs = defineConfig(gitignore({ strict: false }), baseConfig, nodeConfig, {
	languageOptions: {
		parserOptions: {
			tsconfigRootDir,
			projectService: true, // let TS Project Service auto-detect the tsconfig in this folder (TS-ESLint v7+)
		},
	},
});

export default configs;
