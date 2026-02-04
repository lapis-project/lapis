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

	css: [
		"@fontsource-variable/inter/standard.css",
		"@fontsource-variable/inter/standard-italic.css",
		"@/assets/css/lioe.css",
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
		defaultLocale: "de",
		detectBrowserLanguage: {
			redirectOn: "root",
		},
		experimental: {
			typedOptionsAndMessages: "default",
		},
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
		strategy: "no_prefix",
	},

	modules: [
		"nuxt-svgo",
		"@nuxt/eslint",
		"@nuxt/image",
		"@nuxtjs/color-mode",
		"@nuxtjs/i18n",
		"@vueuse/nuxt",
		"@nuxt/ui",
	],

	nitro: {
		compressPublicAssets: true,
	},

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
