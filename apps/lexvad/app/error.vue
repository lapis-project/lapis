<script lang="ts" setup>
import type { NuxtError } from "#app";

const props = defineProps({
	error: Object as () => NuxtError,
});

// const locale = useLocale();
const t = useTranslations();
const localePath = useLocalePath();

const isNotFoundPage = computed(() => {
	return props.error?.statusCode === 404;
});

/** `error.vue` is *not* wrapped in default layout out of the box. */
useHead({
	titleTemplate: computed(() => {
		return ["%s", t("DefaultLayout.meta.title")].join(" | ");
	}),
	title: computed(() => {
		return isNotFoundPage.value ? t("NotFoundPage.meta.title") : t("ErrorPage.meta.title");
	}),
});

useSeoMeta({
	robots: {
		noindex: true,
	},
});

function goToHome() {
	void clearError({ redirect: localePath("/") });
}
</script>

<template>
	<MainContent class="grid min-h-full place-content-center place-items-center gap-y-3">
		<template v-if="isNotFoundPage">
			<PageTitle>{{ t("NotFoundPage.title") }}</PageTitle>
		</template>

		<template v-else>
			<PageTitle>{{ t("ErrorPage.title") }}</PageTitle>
			<div class="flex items-center gap-4">
				<span>{{ props.error?.statusCode ?? 500 }}</span>
				<span>{{ props.error?.statusMessage }}</span>
			</div>
		</template>

		<div>
			<Button @click="goToHome">{{ t("ErrorPage.go-to-home") }}</Button>
		</div>
	</MainContent>
</template>
