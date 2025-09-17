import { defineConfig } from "tsdown";

export default defineConfig({
	clean: true,
	dts: true,
	entry: ["src/*.ts"],
	format: ["esm"],
	platform: "node",
	minify: false,
	splitting: false,
	sourcemap: false,
	treeshake: true,
	skipNodeModulesBundle: true,
	target: "node20",
});
