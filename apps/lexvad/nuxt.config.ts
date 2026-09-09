import { fileURLToPath } from "node:url";

import { defaultLocale, files } from "./app/config/i18n.config";

const baseUrl = process.env.NUXT_PUBLIC_APP_BASE_URL!;

export default defineNuxtConfig({
	alias: {
		"@": fileURLToPath(new URL("./app", import.meta.url)),
	},

	app: {
		layoutTransition: false,
		pageTransition: false,
	},

	compatibilityDate: "2026-02-11",

	components: [{ path: "@/components", extensions: [".vue"], pathPrefix: false }],

	css: ["@/assets/css/lexvad.css"],

	devtools: {
		enabled: process.env.NODE_ENV === "development",
	},

	extends: ["../ui"],

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
		"@nuxt/image",
		"@nuxtjs/color-mode",
		"@nuxtjs/i18n",
		"@vueuse/nuxt",
		"@pinia/nuxt",
		"@nuxt/ui",
	],

	nitro: {
		compressPublicAssets: true,
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
});
