<script lang="ts" setup>
import { locales } from "@/config/i18n.config";

const currentLocale = useLocale();
const t = useTranslations();
const switchLocalePath = useSwitchLocalePath();
const { setLocale } = useI18n();
const route = useRoute();
const labels = computed(() => {
	return new Intl.DisplayNames([currentLocale.value], { type: "language" });
});
</script>

<template>
	<div class="flex items-center gap-2">
		<template v-for="(locale, index) of locales" :key="locale">
			<span v-if="index !== 0">|</span>

			<!--
				`@nuxtjs/i18n` does not update the locale cookie on route change, so we need to
				call `setLocale` explicitly.

				@see https://i18n.nuxtjs.org/guide/lang-switcher
			 -->
			<NuxtLink
				v-if="locale !== currentLocale"
				:href="{ path: switchLocalePath(locale), query: route.query }"
				@click.prevent.stop="setLocale(locale)"
			>
				<span class="sr-only">
					{{ t("LocaleSwitcher.switch-locale", { locale: labels.of(locale) }) }}
				</span>
				<span aria-hidden="true">{{ locale.toUpperCase() }}</span>
			</NuxtLink>
			<span v-else class="font-bold">
				<span class="sr-only">
					{{ t("LocaleSwitcher.current-locale", { locale: labels.of(locale) }) }}
				</span>
				<span aria-hidden="true">{{ locale.toUpperCase() }}</span>
			</span>
		</template>
	</div>
</template>
