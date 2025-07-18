<script setup lang="ts">
import { createUrl, isNonEmptyString } from "@acdh-oeaw/lib";
import type { WebSite, WithContext } from "schema-dts";

const env = useRuntimeConfig();

const locale = useLocale();
const t = useTranslations();

const i18nHead = useLocaleHead({
	addDirAttribute: true,
	identifierAttribute: "id",
	addSeoAttributes: true,
});

useHead({
	htmlAttrs: {
		lang: computed(() => {
			return locale.value;
		}),
	},
	titleTemplate: computed(() => {
		return ["%s", t("DefaultLayout.meta.title")].join(" | ");
	}),
	title: computed(() => {
		return t("DefaultLayout.meta.title");
	}),
	link: computed(() => {
		return [
			{ href: "/favicon.ico", rel: "icon", sizes: "any" },
			{ href: "/icon.svg", rel: "icon", type: "image/svg+xml", sizes: "any" },
			{ href: "/apple-icon.png", rel: "apple-touch-icon" },
			{ href: "/manifest.webmanifest", rel: "manifest" },
			...(i18nHead.value.link ?? []),
		];
	}),
	meta: computed(() => {
		return [
			{ name: "description", content: t("DefaultLayout.meta.description") },
			{ property: "og:type", content: "website" },
			{ property: "og:title", content: t("DefaultLayout.meta.title") },
			{ property: "og:site_name", content: t("DefaultLayout.meta.title") },
			{ property: "og:description", content: t("DefaultLayout.meta.description") },
			{
				property: "og:image",
				content: String(
					createUrl({
						baseUrl: env.public.appBaseUrl,
						pathname: "/opengraph-image.png",
					}),
				),
			},
			{ name: "twitter:card", content: "summary_large_image" },
			{ name: "twitter:creator", content: "@acdh_oeaw" },
			{ name: "twitter:site", content: "@acdh_oeaw" },
			...(i18nHead.value.meta ?? []),
		];
	}),
	script: computed(() => {
		const jsonLd: WithContext<WebSite> = {
			"@context": "https://schema.org",
			"@type": "WebSite",
			name: t("DefaultLayout.meta.title"),
			description: t("DefaultLayout.meta.description"),
		};

		const scripts = [
			{ type: "application/ld+json", innerHTML: JSON.stringify(jsonLd, safeJsonLdReplacer) },
		];

		if (
			process.env.NODE_ENV === "production" &&
			isNonEmptyString(env.public.matomoBaseUrl) &&
			(isNonEmptyString(env.public.matomoId) ||
				/** Nuxt tries to cast env vars o_O. @see https://github.com/nuxt/nuxt/issues/24812 */
				typeof env.public.matomoId === "number")
		) {
			const baseUrl = env.public.matomoBaseUrl;

			scripts.push({
				innerHTML: createAnalyticsScript(
					baseUrl.endsWith("/") ? baseUrl : `${baseUrl}/`,
					env.public.matomoId,
				),
			});
		}

		return scripts;
	}),
});
</script>

<template>
	<NuxtRouteAnnouncer />
	<NuxtLayout>
		<NuxtPage />
		<NuxtLoadingIndicator />
		<LazyClientOnly>
			<Toaster />
		</LazyClientOnly>
	</NuxtLayout>
</template>
