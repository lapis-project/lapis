import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import tailwindcss from "@tailwindcss/vite";

const currentDir = dirname(fileURLToPath(import.meta.url));
const appDir = join(currentDir, "app");
const tailwindCssPath = join(appDir, "assets/css/tailwind.css");

export default defineNuxtConfig({
	devtools: { enabled: true },
	/*
	/ IMPORTANT: use the resolved path, not '@/...'
	/ We need to do this because we extend the layer in other workspace apps
	/ Nuxt docs: When importing using global aliases (such as ~/ and @/) in a layer,
	/ these aliases are resolved relative to the user project, not the layer.
	*/
	css: [tailwindCssPath],

	alias: {
		"@": appDir,
	},

	vite: {
		plugins: [tailwindcss()],
	},

	modules: ["@nuxt/eslint", "shadcn-nuxt"],
	shadcn: {
		prefix: "",
		componentDir: join(appDir, "components/ui"),
	},
});
