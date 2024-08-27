import { defineConfig } from "tsup";

export default defineConfig({
	clean: true,
	dts: true,
	entry: ["./src/*.ts"],
	esbuildOptions(options) {
		options.packages = "external";
	},
	format: ["esm"],
	minify: false,
	sourcemap: true,
	treeshake: true,
});
