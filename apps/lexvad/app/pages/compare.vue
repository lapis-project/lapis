<script lang="ts" setup>
const t = useTranslations();

usePageMetadata({ title: t("ComparePage.meta.title") });
</script>

<template>
	<div class="py-8">
		<ComparisonView></ComparisonView>
	</div>
</template>
