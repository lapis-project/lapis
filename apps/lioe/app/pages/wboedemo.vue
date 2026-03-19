<script lang="ts" setup>
import type { Collections } from "@nuxt/content";
import type { NavigationMenuItem } from "@nuxt/ui";

const { locale } = useI18n();

const { data: page } = await useAsyncData(
	`landing`,
	async () => {
		const collectionName = `content_demo_${locale.value}` as keyof Collections;
		const result = await queryCollection(collectionName).first();

		return result;
	},
	{
		watch: [locale],
	},
);

const items = computed<Array<NavigationMenuItem>>(() => {
	if (!page.value) return [];

	return [
		{
			label: page.value.navHome,
			icon: "",
			to: "/",
		},
		{
			label: page.value.navArticles,
			icon: "",
			to: "/",
		},
		{
			label: page.value.navDatabase,
			icon: "",
			to: "/",
		},
		{
			label: page.value.navMapping,
			icon: "",
			to: "/",
		},
		{
			label: page.value.navInformation,
			icon: "",
			to: "/",
		},
	];
});
</script>

<template>
	<UPage
		v-if="page"
		:ui="{
			root: 'pt-6 pb-12 lg:pt-10 lg:pb-18 container',
		}"
	>
		<div class="max-w-4xl mx-auto">
			<div class="flex justify-center">
				<UNavigationMenu
					class="bg-muted/80 backdrop-blur-sm rounded-full px-2 sm:px-4 border border-muted/50 shadow-lg shadow-neutral-950/5"
					color="neutral"
					:items="items"
					:ui="{
						link: 'px-2 py-1',
						linkLeadingIcon: 'hidden',
					}"
					variant="link"
				>
				</UNavigationMenu>
			</div>
			<div class="my-6 pt-8">
				<h1 class="text-3xl font-bold">{{ page.title }}</h1>
				<div class="my-6">
					<p>{{ page.description }}</p>
				</div>

				<h2 class="text-2xl font-semibold">{{ page.articlesTitle }}</h2>
				<div class="my-6">
					<p>{{ page.articlesText }}</p>

					<p class="my-6">
						<span class="font-semibold">{{ page.fundamentalTitle }}</span>
						{{ page.fundamentalText }}
					</p>

					<p class="my-6">
						<span class="font-semibold">{{ page.fullTitle }}</span>
						{{ page.fullText }}
					</p>

					<p class="my-6">
						<span class="font-semibold gap-4">{{ page.retrogradeTitle }}</span>
						{{ page.retrogradeText }}
					</p>
				</div>

				<h2 class="text-2xl font-semibold mt-4">{{ page.databaseTitle }}</h2>
				<div class="my-6">
					<p>{{ page.databaseText }}</p>
				</div>

				<h2 class="text-2xl font-semibold mt-4">{{ page.mappingTitle }}</h2>
				<div class="my-6">
					<p>{{ page.mappingText }}</p>
				</div>

				<h2 class="text-2xl font-semibold mt-4">{{ page.infoTitle }}</h2>
				<div class="my-6">
					<p>{{ page.infoText }}</p>
				</div>

				<h2 class="text-2xl font-semibold mt-4">{{ page.faqTitle }}</h2>
				<div class="my-6">
					<p>{{ page.faqText }}</p>
				</div>
			</div>
		</div>
	</UPage>
</template>
