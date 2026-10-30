<script lang="ts" setup>
const t = useTranslations();

const links = computed(() => {
	return [
		{ to: "/", label: t("AppHeader.links.home"), class: "lg:hidden uppercase text-foreground" },
		{ to: "/about", label: t("AppHeader.links.about"), class: "uppercase text-foreground" },
		{ to: "/map", label: t("AppHeader.links.map"), class: "uppercase text-foreground" },
		{ to: "/compare", label: t("AppHeader.links.compare"), class: "uppercase text-foreground" },
		{
			to: "/custom-data",
			label: t("ExperimentalPage.title"),
			class: "uppercase text-foreground",
		},
	];
});
</script>

<template>
	<UHeader toggle-side="left">
		<template #left>
			<LapisBrandWrapper class="hidden lg:block">
				<ULink raw to="/">
					<span class="text-3xl font-serif">LexVAD20</span>
				</ULink>
			</LapisBrandWrapper>
		</template>

		<UNavigationMenu :highlight="true" :highlight-color="'primary'" :items="links" variant="link" />

		<template #right>
			<ClientOnly>
				<ColorSchemeSwitcher />
			</ClientOnly>
			<LocaleSwitcher />
		</template>

		<template #body>
			<UNavigationMenu class="-mx-2.5" :items="links" orientation="vertical" />
		</template>
	</UHeader>
</template>
