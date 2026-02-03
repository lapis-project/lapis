<script setup lang="ts">
import { de, en } from "@nuxt/ui/locale";

const { locale, setLocale } = useI18n();

const handleLocaleChange = (value: string) => {
	setLocale(value as "de" | "en");
};
</script>

<template>
	<ULocaleSelect
		:locales="[de, en]"
		:model-value="locale"
		name="Sprache"
		size="xl"
		@update:model-value="handleLocaleChange($event)"
		:ui="{
			leading: 'hidden',
			base: 'pl-4 w-32',
		}"
	/>
</template>
