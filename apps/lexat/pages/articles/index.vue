<script lang="ts" setup>
const t = useTranslations();

usePageMetadata({
	title: t("ArticlesPage.meta.title"),
});
</script>

<template>
	<MainContent class="container grid content-start gap-y-8 py-8">
		<PageTitle>{{ t("ArticlesPage.title") }}</PageTitle>
		<Card></Card>
	</MainContent>
</template>
