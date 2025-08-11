import baseConfig from "@acdh-oeaw/eslint-config";
import nodeConfig from "@acdh-oeaw/eslint-config-node";
import gitignore from "eslint-config-flat-gitignore";
import { config } from "typescript-eslint";

const configs = config(gitignore({ strict: false }), baseConfig, nodeConfig);

export default configs;
