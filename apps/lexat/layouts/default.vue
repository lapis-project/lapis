<script lang="ts" setup>
const t = useTranslations();
</script>

<template>
	<div class="grid min-h-full grid-rows-[auto_1fr_auto]">
		<SkipLink target-id="main-content">{{ t("DefaultLayout.skip-to-main-content") }}</SkipLink>

		<AppHeader />
		<ErrorBoundary>
			<slot />
		</ErrorBoundary>
		<AppFooter />
	</div>
</template>
