import tailwindcss from "@tailwindcss/vite";
import { dirname, join } from "path";
import { fileURLToPath } from "url";

const currentDir = dirname(fileURLToPath(import.meta.url));

export default defineNuxtConfig({
	devtools: { enabled: true },
	css: [join(currentDir, "./assets/css/tailwind.css")],
	alias: {
		"@": currentDir,
	},
	vite: {
		plugins: [tailwindcss()],
	},
	modules: ["@nuxt/eslint", "shadcn-nuxt"],
	shadcn: {
		prefix: "",
		componentDir: join(currentDir, "./components/ui"),
	},
});
