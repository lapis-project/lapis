import { fileURLToPath } from "node:url";

import tailwindcss from "@tailwindcss/vite";

import { defaultLocale, files } from "./app/config/i18n.config";

const baseUrl = process.env.NUXT_PUBLIC_APP_BASE_URL!;

export default defineNuxtConfig({
	alias: {
		"@": fileURLToPath(new URL("./app", import.meta.url)),
	},

	// devServer: {
	// 	host: "0.0.0.0",
	// 	port: 3000,
	// },

	app: {
		layoutTransition: false,
		pageTransition: false,
	},

	colorMode: {
		classSuffix: "",
		dataValue: "ui-color-scheme",
	},

	components: [{ path: "@/components", extensions: [".vue"], pathPrefix: false }],

	css: [
		"@fontsource-variable/inter/standard.css",
		"@fontsource-variable/inter/standard-italic.css",
		"@/assets/css/lexat.css",
	],

	devtools: {
		enabled: process.env.NODE_ENV === "development",
	},

	eslint: {
		config: {
			autoInit: false,
			standalone: true,
		},
	},

	extends: ["../ui"],

	experimental: {
		defaults: {
			useAsyncData: {
				deep: false,
			},
			useFetch: {
				timeout: 250,
			},
		},
	},

	features: {
		/** @see https://github.com/nuxt/nuxt/issues/21821 */
		inlineStyles: false,
	},

	i18n: {
		baseUrl,
		defaultLocale,
		detectBrowserLanguage: {
			redirectOn: "root",
		},
		experimental: {
			typedOptionsAndMessages: "default",
		},
		langDir: "./messages",
		locales: files,
		strategy: "prefix",
		vueI18n: "./i18n.config.ts",
	},

	imports: {
		dirs: ["./app/config/"],
	},

	modules: [
		"nuxt-svgo",
		"@nuxt/eslint",
		"@nuxt/image",
		"@nuxtjs/color-mode",
		"@nuxtjs/i18n",
		"@vueuse/nuxt",
		"shadcn-nuxt",
		"@nuxtjs/sitemap",
	],

	nitro: {
		compressPublicAssets: true,
		// prerender: {
		// 	routes: ["/manifest.webmanifest", "/robots.txt", "/sitemap.xml"],
		// 	concurrency: 1,
		// },
		// devProxy: {
		// 	"/api": {
		// 		target: process.env.NUXT_PUBLIC_API_BASE_URL,
		// 		changeOrigin: true,
		// 	},
		// },
	},

	runtimeConfig: {
		NODE_ENV: process.env.NODE_ENV,
		public: {
			appBaseUrl: process.env.NUXT_PUBLIC_APP_BASE_URL,
			apiBaseUrl: process.env.NUXT_PUBLIC_API_BASE_URL,
			bots: process.env.NUXT_PUBLIC_BOTS,
			matomoBaseUrl: process.env.NUXT_PUBLIC_MATOMO_BASE_URL,
			matomoId: process.env.NUXT_PUBLIC_MATOMO_ID,
			redmineId: process.env.NUXT_PUBLIC_REDMINE_ID,
			zoteroBaseUrl: process.env.NUXT_PUBLIC_ZOTERO_BASE_URL,
		},
	},

	svgo: {
		defaultImport: "component",
	},

	typescript: {
		shim: false,
		strict: true,
		// https://github.com/nuxt/nuxt/issues/14816#issuecomment-1484918081
		tsConfig: {
			compilerOptions: {
				baseUrl: ".",
				paths: {
					"@": ["."],
					"@/*": ["./*"],
				},
			},
		},
	},

	vite: {
		plugins: [tailwindcss()],
	},

	compatibilityDate: "2025-01-14",
});
