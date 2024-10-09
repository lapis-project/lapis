import { defineConfig } from "tsup";

export default defineConfig({
	clean: true,
	dts: true,
	entry: ["./src/*.ts"],
	format: ["esm"],
	minify: false,
	sourcemap: false,
	treeshake: true,
	target: "node20",
	platform: "node",
	bundle: true,
	splitting: false,
});
