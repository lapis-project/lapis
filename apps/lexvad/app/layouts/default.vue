<script lang="ts" setup>
const t = useTranslations();
</script>

<template>
	<div>
		<SkipLink target-id="main-content">{{ t("DefaultLayout.skip-to-main-content") }}</SkipLink>

		<AppHeader />
		<UMain
			id="main-content"
			:tabindex="-1"
			:ui="{ base: 'flex-1 min-h-0 overflow-y-auto container mx-auto' }"
		>
			<NuxtPage />
		</UMain>
	</div>
</template>
