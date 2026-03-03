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
			<LapisBrandWrapper class="hidden lg:block">
				<ULink raw to="/">
					<LazySvgoLioe class="h-10" />
				</ULink>
			</LapisBrandWrapper>
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
