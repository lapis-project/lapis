<script lang="ts" setup>
const t = useTranslations();

usePageMetadata({
	title: t("MapsPage.meta.title"),
});
</script>

<template>
	<MainContent
		class="container grid grid-rows-[auto_1fr] content-start py-8 overflow-x-scroll sm:overflow-x-auto"
	>
		<MobileAlert />
		<div>
			<PageTitle class="sr-only">{{ t("MapsPage.title") }}</PageTitle>
		</div>
		<DataMapView />
	</MainContent>
</template>
