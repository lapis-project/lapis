<script setup lang="ts">
import type { Collections } from "@nuxt/content";

const { locale } = useI18n();

const { data: info } = await useAsyncData(
	`resources`,
	async () => {
		const collectionName = `resources_${locale.value}` as keyof Collections;
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
		v-if="info"
		:ui="{
			root: 'pt-6 pb-12 lg:pt-10 lg:pb-18 container',
		}"
	>
		<div class="max-w-4xl mx-auto">
			<UPageHeader :title="info.title" />

			<div class="my-6 text-center">
				<p>{{ info.description }}</p>
			</div>

			<ContentRenderer
				class="grid grid-cols-1 md:grid-cols-2 gap-8 justify-items-center"
				:value="info"
			/>
		</div>
	</UPage>
</template>
