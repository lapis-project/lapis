<script lang="ts" setup>
const { t } = useI18n();

definePageMeta({
	sitemap: {
		lastmod: "2026-07-13", // or Date object
	},
});
useSeoMeta({
	title: t("ArticlesPage.title"),
});
</script>

<template>
	<UPage
		:ui="{
			root: 'pt-6 pb-12 lg:pt-10 lg:pb-18 container',
		}"
	>
		<div class="max-w-4xl mx-auto">
			<div class="prose dark:prose-invert max-w-none my-10">
				<h1>{{ t("ArticlesPage.title") }}</h1>
			</div>
		</div>
	</UPage>
</template>
