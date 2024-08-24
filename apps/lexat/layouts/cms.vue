<script setup lang="ts">
const t = useTranslations();
</script>

<template>
	<div class="grid min-h-full grid-rows-[auto_1fr_auto]">
		<SkipLink target-id="main-content">{{ t("DefaultLayout.skip-to-main-content") }}</SkipLink>

		<AppHeader />
		<ErrorBoundary>
			<div class="container flex gap-8 py-8"><AdminNavigation class="w-1/4" /><slot /></div>
		</ErrorBoundary>
		<AppFooter />
	</div>
</template>
