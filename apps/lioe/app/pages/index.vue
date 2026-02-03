<script lang="ts" setup>
const t = useTranslations();

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
	<MainContent class="container py-16">
		<UPage>
			<div>
				<UPageHeader
					class="p-2"
					:description="t('LandingPage.description')"
					:title="t('LandingPage.title')"
				/>
			</div>
			<div class="p-2 my-4">
				<p>{{ t("LandingPage.links-title") }}</p>
			</div>
			<div class="flex justify-between items-start gap-4">
				<LinkCard
					v-for="project in projects"
					:key="project.title"
					v-bind="project"
					class="w-1/3"
				></LinkCard>
			</div>
		</UPage>
	</MainContent>
</template>
