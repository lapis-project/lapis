/**
 * Head tags shared by every page. `error.vue` replaces `app.vue` entirely, so both call this. Pages
 * only set their own `title`; the site name is appended here.
 */
export function useSiteHead(): void {
	const t = useTranslations();
	// `lang` and `dir` on <html>, alternate-language and canonical links, `og:locale`.
	const i18nHead = useLocaleHead();

	useHead({
		htmlAttrs: {
			lang: computed(() => i18nHead.value.htmlAttrs?.lang),
			dir: computed(() => i18nHead.value.htmlAttrs?.dir),
		},
		titleTemplate: (title) => {
			const site = t("DefaultLayout.meta.title");
			return title ? `${title} | ${site}` : site;
		},
		link: computed(() => [
			{ href: "/favicon.ico", rel: "icon", sizes: "any" },
			{ href: "/icon.svg", rel: "icon", type: "image/svg+xml" },
			{ href: "/apple-icon.png", rel: "apple-touch-icon" },
			...(i18nHead.value.link ?? []),
		]),
		meta: computed(() => i18nHead.value.meta ?? []),
	});
}
