<script lang="ts" setup>
import type { NavigationMenuItem } from "@nuxt/ui";

interface Props {
	items?: Array<NavigationMenuItem>;
}

const props = withDefaults(defineProps<Props>(), {
	items: () => [
		{
			label: "HOME",
			icon: "i-lucide-house",
			to: "/",
		},
		{
			label: "WBÖ-ARTIKEL",
			icon: "i-lucide-newspaper",
			to: "/",
		},
		{
			label: "BELEGDATENBANK",
			icon: "i-lucide-database",
			to: "/",
		},
		{
			label: "KARTIERUNG",
			icon: "i-lucide-map",
			to: "/",
		},
		{
			label: "INFORMATIONEN",
			icon: "i-lucide.info",
			to: "/",
		},
	],
});
</script>

<template>
	<div class="flex justify-center">
		<UNavigationMenu
			class="bg-muted/80 backdrop-blur-sm rounded-full px-2 sm:px-4 border border-muted/50 shadow-lg shadow-neutral-950/5"
			color="neutral"
			:items="props.items"
			:ui="{
				link: 'px-3 py-1',
			}"
			variant="link"
		>
		</UNavigationMenu>
	</div>
</template>
