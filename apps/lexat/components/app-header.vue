<script lang="ts" setup>
import type { NuxtLinkProps } from "#app";

const t = useTranslations();

const links = computed(() => {
	return {
		articles: { to: { path: "/articles" }, label: t("AppHeader.links.articles") },
		db: { to: { path: "/db" }, label: t("AppHeader.links.db") },
		research: { to: { path: "/maps" }, label: t("AppHeader.links.research") },
	} satisfies Record<string, { to: NuxtLinkProps["href"]; label: string }>;
});
</script>

<template>
	<header class="container border-b">
		<div class="flex h-16 items-center justify-between gap-4 py-4">
			<img src="@/assets/lexat.svg" alt="LexAT Logo" class="w-32" />
			<nav :aria-label="t('AppHeader.navigation-main')">
				<ul class="flex items-center gap-4" role="list">
					<li v-for="(link, key) of links" :key="key">
						<NuxtLinkLocale
							:to="link.to"
							class="uppercase"
							exact-active-class="underline underline-offset-2"
						>
							{{ link.label }}
						</NuxtLinkLocale>
					</li>
				</ul>
			</nav>

			<div class="relative flex items-center gap-4">
				<ColorSchemeSwitcher />
				<LocaleSwitcher />
			</div>
		</div>
	</header>
</template>
