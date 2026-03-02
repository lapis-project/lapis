<script setup lang="ts">
import * as locales from "@nuxt/ui/locale";

const { locale } = useI18n();
const t = useTranslations();
</script>

<template>
	<NuxtRouteAnnouncer />
	<UApp class="flex flex-col h-screen overflow-hidden" :locale="locales[locale]">
		<SkipLink target-id="main-content">{{ t("DefaultLayout.skip-to-main-content") }}</SkipLink>
		<NuxtLoadingIndicator />
		<AppHeader class="fixed top-0 left-0 right-0" />
		<UMain id="main-content" :tabindex="-1" :ui="{ base: 'flex-1 min-h-0 overflow-y-auto' }">
			<NuxtPage />
		</UMain>
		<AppFooter class="flex-none" />
	</UApp>
</template>
