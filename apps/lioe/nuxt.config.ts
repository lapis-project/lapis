import { fileURLToPath } from "node:url";

import tailwindcss from "@tailwindcss/vite";

const baseUrl = process.env.NUXT_PUBLIC_APP_BASE_URL!;

export default defineNuxtConfig({
	alias: {
		"@": fileURLToPath(new URL("./app", import.meta.url)),
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

	content: {
		experimental: { sqliteConnector: "native" },
	},

	css: ["@/assets/css/lioe.css"],

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

	i18n: {
		baseUrl,
		defaultLocale: "de",
		detectBrowserLanguage: {
			redirectOn: "root",
		},
		experimental: {
			typedOptionsAndMessages: "default",
		},
		langDir: "locales/",
		locales: [
			{
				code: "en",
				name: "Englisch",
				file: "en.json",
			},
			{
				code: "de",
				name: "Deutsch",
				file: "de.json",
			},
		],
		strategy: "prefix",
	},

	modules: [
		"nuxt-svgo",
		"@nuxt/content",
		"@nuxt/eslint",
		"@nuxt/image",
		"@nuxtjs/i18n",
		"@vueuse/nuxt",
		"@nuxt/ui",
		"nuxt-studio",
	],

	runtimeConfig: {
		NODE_ENV: process.env.NODE_ENV,
		public: {
			appBaseUrl: process.env.NUXT_PUBLIC_APP_BASE_URL,
			bots: process.env.NUXT_PUBLIC_BOTS,
			matomoBaseUrl: process.env.NUXT_PUBLIC_MATOMO_BASE_URL,
			matomoId: process.env.NUXT_PUBLIC_MATOMO_ID,
			redmineId: process.env.NUXT_PUBLIC_REDMINE_ID,
		},
	},

	studio: {
		repository: {
			provider: "github",
			rootDir: "apps/lioe",
			owner: "lapis-project",
			repo: "lapis",
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

	compatibilityDate: "2026-02-11",
});
