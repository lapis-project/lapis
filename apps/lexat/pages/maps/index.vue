<script lang="ts" setup>
const t = useTranslations();

usePageMetadata({
	title: t("MapsPage.meta.title"),
});
</script>

<template>
	<MainContent class="container grid grid-rows-[auto_1fr] content-start py-8">
		<div>
			<PageTitle class="sr-only">{{ t("MapsPage.title") }}</PageTitle>
		</div>
		<ErrorBoundary>
			<DataMapView />
		</ErrorBoundary>
	</MainContent>
</template>
