import { defineConfig } from "tsdown";

export default defineConfig({
	clean: true,
	dts: true,
	entry: ["src/*.ts"],
	format: ["esm"],
	fixedExtension: false,
	platform: "node",
	minify: false,
	sourcemap: false,
	treeshake: true,
	skipNodeModulesBundle: true,
	target: "node20",
});
