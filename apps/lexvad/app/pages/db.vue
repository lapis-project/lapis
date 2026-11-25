<script lang="ts" setup>
const t = useTranslations();

usePageMetadata({ title: t("DbPage.meta.title") });
</script>

<template>
	<div class="py-8">
		<DataTableView></DataTableView>
	</div>
</template>
