<script lang="ts" setup>
import * as locales from "@nuxt/ui/locale";

import type { NuxtError } from "#app";

const { locale } = useI18n();

const props = defineProps<{
	error: NuxtError;
}>();

/** `error.vue` is *not* wrapped in default layout out of the box. */
useHead({
	titleTemplate: computed(() => {
		return ["%s", $t("DefaultLayout.meta.title")].join(" | ");
	}),
	title: computed(() => {
		return props.error?.statusCode === 404
			? $t("NotFoundPage.meta.title")
			: $t("ErrorPage.meta.title");
	}),
});

useSeoMeta({
	robots: {
		noindex: true,
	},
});
</script>

<template>
	<UApp :locale="locales[locale]">
		<UError :error="error" />
	</UApp>
</template>
