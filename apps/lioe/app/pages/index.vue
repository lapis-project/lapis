<script lang="ts" setup>
import type { Collections } from "@nuxt/content";

const { locale } = useI18n();

const { data: page } = await useAsyncData(
	`landing`,
	async () => {
		const collectionName = `content_${locale.value}` as keyof Collections;
		const result = await queryCollection(collectionName).first();

		return result;
	},
	{
		watch: [locale],
	},
);
const projects = [
	{
		title: "LinkCards.wboe.title",
		description: "LinkCards.wboe.description",
		content: "LinkCards.wboe.content",
		action: "LinkCards.action",
		link: "LinkCards.wboe.link",
	},
	{
		title: "LinkCards.lexvad.title",
		description: "LinkCards.lexvad.description",
		content: "LinkCards.lexvad.content",
		action: "LinkCards.action",
		link: "LinkCards.lexvad.link",
	},
	{
		title: "LinkCards.lexat.title",
		description: "LinkCards.lexat.description",
		content: "LinkCards.lexat.content",
		action: "LinkCards.action",
		link: "LinkCards.lexat.link",
	},
];
</script>

<template>
	<UPage
		v-if="page"
		:ui="{
			root: 'pt-14 lg:pt-16',
		}"
	>
		<div class="max-w-4xl mx-auto">
			<UPageHeader :description="page.description" :title="page.title" />

			<div class="my-6">
				<p>{{ page.linksTitle }}</p>
			</div>

			<div class="flex justify-between flex-col sm:flex-row gap-4">
				<LinkCard
					v-for="project in projects"
					:key="project.title"
					v-bind="project"
					class="w-full sm:w-1/3"
				/>
			</div>
		</div>
	</UPage>
</template>
