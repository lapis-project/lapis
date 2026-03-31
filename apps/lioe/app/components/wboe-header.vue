<script lang="ts" setup>
import type { Collections } from "@nuxt/content";
import type { NavigationMenuItem } from "@nuxt/ui";

const { locale } = useI18n();

const { data: nav } = await useAsyncData(
	`navigation`,
	async () => {
		const collectionName = `content_nav_${locale.value}` as keyof Collections;
		const result = await queryCollection(collectionName).first();

		return result;
	},
	{
		watch: [locale],
	},
);

const items = computed<Array<NavigationMenuItem>>(() => {
	if (!nav.value) return [];

	return [
		{
			label: nav.value.navHome,
			icon: nav.value.homeIcon,
			to: "/",
		},
		{
			label: nav.value.navArticles,
			icon: nav.value.articlesIcon,
			to: "/",
		},
		{
			label: nav.value.navDatabase,
			icon: nav.value.databaseIcon,
			to: "/",
		},
		{
			label: nav.value.navMapping,
			icon: nav.value.mappingIcon,
			to: "/",
		},
		{
			label: nav.value.navInformation,
			icon: nav.value.infoIcon,
			to: "/",
		},
	];
});
</script>

<template>
	<div class="flex justify-center">
		<UNavigationMenu
			class="bg-muted/80 backdrop-blur-sm rounded-full px-2 sm:px-4 border border-muted/50 shadow-lg shadow-neutral-950/5"
			color="neutral"
			:items="items"
			:ui="{
				link: 'px-3 py-1',
			}"
			variant="link"
		>
		</UNavigationMenu>
	</div>
</template>
