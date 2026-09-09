<script setup lang="ts">
import * as locales from "@nuxt/ui/locale";

const { locale } = useI18n();
</script>

<template>
	<NuxtRouteAnnouncer />
	<UApp :locale="locales[locale]">
		<Patterndefs></Patterndefs>
		<NuxtLayout>
			<SkipLink target-id="main-content">{{ $t("DefaultLayout.skip-to-main-content") }}</SkipLink>
			<NuxtLoadingIndicator />
			<NuxtPage />
		</NuxtLayout>
	</UApp>
</template>
