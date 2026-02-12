<script lang="ts" setup>
import type { NavigationMenuItem } from "@nuxt/ui";

const route = useRoute();

const items = computed<Array<NavigationMenuItem>>(() => [
	{
		label: t("AppHeader.links.home"),
		to: "/",
		active: route.path.startsWith("/"),
		class: "lg:hidden",
	},
	{
		label: t("AppHeader.links.about"),
		to: "/about",
		active: route.path.startsWith("/about"),
	},
]);

const t = useTranslations();
</script>

<template>
	<UHeader mode="drawer" toggle-side="left">
		<template #title>
			<ULink class="hidden lg:block" to="/">
				<LazySvgoLioe class="h-10" />
			</ULink>
		</template>

		<UNavigationMenu class="max-sm:hidden" :items="items" />

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
