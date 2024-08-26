<script lang="ts" setup>
const t = useTranslations();

usePageMetadata({
	title: t("ProfilePage.meta.title"),
});
</script>

<template>
	<MainContent class="container grid content-start gap-y-8 py-8">
		<PageTitle>{{ t("ProfilePage.title") }}</PageTitle>
	</MainContent>
</template>
