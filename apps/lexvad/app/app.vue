<script setup lang="ts">
import * as locales from "@nuxt/ui/locale";

const { locale } = useI18n();

useSiteHead();
</script>

<template>
	<NuxtRouteAnnouncer />
	<UApp :locale="locales[locale]">
		<NuxtLoadingIndicator />
		<NuxtLayout>
			<NuxtPage />
		</NuxtLayout>
	</UApp>
</template>
