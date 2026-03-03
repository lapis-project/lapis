<script lang="ts" setup>
import type { NavigationMenuItem } from "@nuxt/ui";

const route = useRoute();

const items = computed<Array<NavigationMenuItem>>(() => [
	{
		label: $t("AppHeader.links.home"),
		to: "/",
		active: route.path.startsWith("/"),
		class: "lg:hidden",
	},
	{
		label: $t("AppHeader.links.team"),
		to: "/team",
		active: route.path.includes("/team"),
	},
]);
</script>

<template>
	<UHeader toggle-side="left">
		<template #left>
			<ULink class="hidden lg:block" to="/">
				<LazySvgoLioe class="h-10" />
			</ULink>
		</template>

		<UNavigationMenu :items="items" />

		<template #right>
			<ClientOnly>
				<ColorSchemeSwitcher />
			</ClientOnly>
			<LocaleSwitcher />
		</template>

		<template #body>
			<UNavigationMenu class="-mx-2.5" :items="items" orientation="vertical" />
		</template>
	</UHeader>
</template>
