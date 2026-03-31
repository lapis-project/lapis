<script lang="ts" setup>
import type { Collections } from "@nuxt/content";

const { locale } = useI18n();

const { data: page } = await useAsyncData(
	`wboedemo`,
	async () => {
		const collectionName = `content_demo_${locale.value}` as keyof Collections;
		const result = await queryCollection(collectionName).first();

		return result;
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
			<WboeHeader></WboeHeader>
			<div class="my-6 pt-8">
				<div class="prose dark:prose-invert max-w-none my-10">
					<ContentRenderer :value="page" />
				</div>
			</div>
		</div>
	</UPage>
</template>
