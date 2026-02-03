<script setup lang="ts">
import * as locales from "@nuxt/ui/locale";
const { locale } = useI18n();
</script>

<template>
	<NuxtRouteAnnouncer />
	<UApp :locale="locales[locale]">
		<NuxtLayout>
			<NuxtPage />
			<NuxtLoadingIndicator />
		</NuxtLayout>
	</UApp>
</template>
