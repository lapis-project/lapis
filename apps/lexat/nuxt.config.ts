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

	components: [
		{
			path: "~/components",
			global: true,
		},
	],

	css: ["@/assets/css/lexat.css"],

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
		"@nuxt/scripts",
		"@nuxtjs/color-mode",
		"@nuxtjs/i18n",
		"@nuxtjs/robots",
		"@vueuse/nuxt",
		"@nuxtjs/sitemap",
		"@nuxt/ui",
	],

	nitro: {
		compressPublicAssets: true,
		// prerender: {
		// 	routes: ["/manifest.webmanifest", "/sitemap.xml"],
		// 	concurrency: 1,
		// },
		// devProxy: {
		// 	"/api": {
		// 		target: process.env.NUXT_PUBLIC_API_BASE_URL,
		// 		changeOrigin: true,
		// 	},
		// },
	},

	robots: {
		groups: [
			// the following applies to all standard bots that respect emerging AI standards.
			{
				userAgent: "*",
				allow: "/",
				// IETF: https://ietf-wg-aipref.github.io/drafts/draft-ietf-aipref-vocab.html
				contentUsage: {
					"train-ai": "n",
					search: "y",
				},
				// https://contentsignals.org/
				contentSignal: {
					"ai-train": "no",
					search: "yes",
					"ai-input": "yes", // allows real-time AI generation (RAG) using your site
				},
			},
			// explicitly block training crawlers and dataset scrapers
			{
				userAgent: [
					"Applebot-Extended", // Apple's AI Scraper (This stops Apple Intelligence training but keeps Apple Search/Siri intact)
					"GPTBot", // OpenAI model training
					"ClaudeBot", // Anthropic
					"Anthropic-ai", // Anthropic
					"CCBot", // Common Crawl (Dataset used to train almost all LLMs)
					"Bytespider", // ByteDance (TikTok) AI
					"Diffbot", // AI Extraction
					"FacebookBot", // Meta AI
					"cohere-ai", // Cohere
					"Omgilibot", // AI Web Scraper
					"Omgili", // AI Web Scraper
				],
				disallow: ["/"],
				contentUsage: {
					"train-ai": "n",
					search: "y",
				},
				contentSignal: {
					"ai-train": "no",
					search: "yes",
					"ai-input": "yes",
				},
			},
		],
	},

	runtimeConfig: {
		NODE_ENV: process.env.NODE_ENV,
		public: {
			appBaseUrl: process.env.NUXT_PUBLIC_APP_BASE_URL,
			apiBaseUrl: process.env.NUXT_PUBLIC_API_BASE_URL,
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
});
