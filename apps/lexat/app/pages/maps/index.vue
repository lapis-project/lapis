<script lang="ts" setup>
const t = useTranslations();

usePageMetadata({
	title: t("MapsPage.meta.title"),
});
</script>

<template>
	<MainContent class="min-w-0 py-8">
		<div class="container">
			<MobileAlert class="mb-5" />
			<PageTitle class="sr-only">{{ t("MapsPage.title") }}</PageTitle>
		</div>
		<DataMapView />
	</MainContent>
</template>
