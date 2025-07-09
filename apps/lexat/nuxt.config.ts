import { fileURLToPath } from "node:url";

import tailwindcss from "@tailwindcss/vite";

import { defaultLocale, localesMap } from "./config/i18n.config";

const baseUrl = process.env.NUXT_PUBLIC_APP_BASE_URL!;

export default defineNuxtConfig({
	alias: {
		"@": fileURLToPath(new URL("./", import.meta.url)),
	},

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
		/** @see https://github.com/nuxt-modules/i18n/issues/3238#issuecomment-2672492536 */
		bundle: {
			optimizeTranslationDirective: false,
		},
		defaultLocale,
		detectBrowserLanguage: {
			redirectOn: "root",
		},
		langDir: "./messages",
		lazy: true,
		locales: Object.values(localesMap),
		strategy: "prefix",
		vueI18n: "./i18n.config.ts",
	},

	imports: {
		dirs: ["./config/"],
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
