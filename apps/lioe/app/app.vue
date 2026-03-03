<script setup lang="ts">
import * as locales from "@nuxt/ui/locale";

const { locale } = useI18n();
</script>

<template>
	<NuxtRouteAnnouncer />
	<UApp :locale="locales[locale]">
		<SkipLink target-id="main-content">{{ $t("DefaultLayout.skip-to-main-content") }}</SkipLink>
		<NuxtLoadingIndicator />
		<AppHeader />
		<UMain id="main-content" :tabindex="-1" :ui="{ base: 'flex-1 min-h-0 overflow-y-auto' }">
			<NuxtPage />
		</UMain>
		<AppFooter />
	</UApp>
</template>
