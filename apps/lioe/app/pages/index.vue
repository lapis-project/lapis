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
	<MainContent class="container py-8 sm:py-16">
		<section class="pb-16 article-content">
			<UPage>
				<div class="mx-auto max-w-4xl">
					<UPageHeader
						:description="t('LandingPage.description')"
						:title="t('LandingPage.title')"
					/>

					<div class="my-6">
						<p>{{ t("LandingPage.links-title") }}</p>
					</div>
					<div class="flex justify-between flex-col sm:flex-row gap-4">
						<LinkCard
							v-for="project in projects"
							:key="project.title"
							v-bind="project"
							class="w-full sm:w-1/3"
						></LinkCard>
					</div>
				</div>
			</UPage>
		</section>
	</MainContent>
</template>
