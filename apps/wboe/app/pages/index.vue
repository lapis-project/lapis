<script lang="ts" setup>
import type { Collections } from "@nuxt/content";

const { locale } = useI18n();
const route = useRoute();

const { data: page } = await useAsyncData(
	`page-${route.path}`,
	async () => {
		const collectionName = `content_${locale.value}` as keyof Collections;
		const contentPath = route.path === "/" ? `/${locale.value}` : route.path;

		return await queryCollection(collectionName).path(contentPath).first();
	},
	{
		watch: [locale],
	},
);
</script>

<template>
	<UPage
		v-if="page"
		:ui="{
			root: 'pt-6 pb-12 lg:pt-10 lg:pb-18 container',
		}"
	>
		<div class="max-w-4xl mx-auto">
			<div class="prose dark:prose-invert max-w-none my-10">
				<ContentRenderer :value="page" />
			</div>
		</div>
	</UPage>
</template>
