const baseUrl = process.env.NUXT_PUBLIC_APP_BASE_URL!;

export default defineNuxtConfig({
	app: {
		layoutTransition: false,
		pageTransition: false,
	},

	compatibilityDate: "2026-03-03",

	components: [
		{
			path: "~/components",
			global: true,
		},
	],

	content: {
		experimental: { sqliteConnector: "native" },
	},

	css: ["~/assets/css/wboe.css"],

	devtools: {
		enabled: process.env.NODE_ENV === "development",
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
		"@nuxtjs/seo",
		"@nuxt/content",
		"@nuxt/image",
		"@nuxtjs/i18n",
		"@vueuse/nuxt",
		"@nuxt/ui",
	],

	robots: {
		groups: [
			// the following applies to all standard bots that respect emerging AI standards.
			{
				userAgent: "*",
				allow: "/",
				// IETF: https://ietf-wg-aipref.github.io/drafts/draft-ietf-aipref-vocab.html
				contentUsage: {
					bots: "y",
					"train-ai": "n",
					"ai-output": "y", // allows real-time AI generation (RAG) using your site
				},
				// https://contentsignals.org/
				contentSignal: {
					"ai-train": "no",
					search: "yes",
					"ai-input": "yes", // allows real-time AI generation (RAG) using your site
				},
			},
			// explicitly block other major AI foundation models and datasets
			{
				userAgent: [
					"Google-Extended", // Google's AI Scraper (This stops Gemini/Vertex AI training but keeps Google Search fully intact)
					"Applebot-Extended", // Apple's AI Scraper (This stops Apple Intelligence training but keeps Apple Search/Siri intact)
					"GPTBot", // OpenAI / ChatGPT
					"ChatGPT-User", // OpenAI Plugins
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
			},
		],
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

	site: {
		url: baseUrl,
		name: "WBÖ",
	},

	svgo: {
		defaultImport: "component",
	},

	vite: {
		server: {
			watch: {
				usePolling: true,
			},
		},
	},
});
