<script lang="ts" setup>
const t = useTranslations();

usePageMetadata({ title: t("MapsPage.meta.title") });
</script>

<template>
	<div class="py-8">
		<DataMapView></DataMapView>
	</div>
</template>
