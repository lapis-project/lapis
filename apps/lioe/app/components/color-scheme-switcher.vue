<script lang="ts" setup>
const t = useTranslations();
const colorMode = useColorMode();

const items = computed(() => [
	[
		{
			label: t("ColorSchemeSwitcher.color-schemes.system"),
			icon: "i-lucide-laptop",
			onSelect() {
				colorMode.preference = "system";
			},
		},
		{
			label: t("ColorSchemeSwitcher.color-schemes.light"),
			icon: "i-lucide-sun",
			onSelect() {
				colorMode.preference = "light";
			},
		},
		{
			label: t("ColorSchemeSwitcher.color-schemes.dark"),
			icon: "i-lucide-moon",
			onSelect() {
				colorMode.preference = "dark";
			},
		},
	],
]);

const currentIcon = computed(() => (colorMode.value === "dark" ? "i-lucide-moon" : "i-lucide-sun"));
</script>

<template>
	<UDropdownMenu :items="items" :popper="{ placement: 'bottom-end' }">
		<UButton
			:aria-label="t('ColorSchemeSwitcher.change-color-scheme')"
			class="gap-2"
			:icon="currentIcon"
			variant="ghost"
		/>
	</UDropdownMenu>
</template>
