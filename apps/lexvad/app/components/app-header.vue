<script lang="ts" setup>
const t = useTranslations();

const links = computed(() => {
	// TODO add i18n messages when navigation is fixated
	return [
		{ to: "/", label: t("AppHeader.links.home"), class: "lg:hidden uppercase text-foreground" },
		{ to: "/about", label: "Über das Projekt", class: "uppercase text-foreground" },
		{ to: "/map", label: "Kartierung", class: "uppercase text-foreground" },
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

		<UNavigationMenu :items="links" variant="link" :highlight="true" :highlight-color="'primary'" />

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
