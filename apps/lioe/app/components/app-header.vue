<script lang="ts" setup>
import { Menu, XIcon } from "lucide-vue-next";

import type { NuxtLinkProps } from "#app";

const t = useTranslations();

const drawerOpen = ref<boolean>(false);

const links = computed(() => {
	// TODO add i18n messages when navigation is fixated
	return {
		about: { to: { path: "/about" }, label: "Über das Projekt" },
	} satisfies Record<string, { to: NuxtLinkProps["href"]; label: string }>;
});

const mobileLinks = computed(() => {
	return {
		home: { to: { path: "/" }, label: t("AppHeader.links.home") },
		...links.value,
	};
});
</script>

<template>
	<header class="container border-b">
		<div class="flex h-16 items-center justify-between gap-4 py-4">
			<Drawer v-model:open="drawerOpen">
				<DrawerTrigger class="lg:hidden">
					<ClientOnly>
						<Button id="mobile-menu" class="lg:hidden" size="icon" variant="outline"
							><component :is="drawerOpen ? XIcon : Menu" class="size-4"
						/></Button>
					</ClientOnly>
				</DrawerTrigger>
				<DrawerContent>
					<DrawerHeader>
						<DrawerTitle>Navigation</DrawerTitle>
					</DrawerHeader>
					<DrawerFooter>
						<DrawerClose>
							<nav :aria-label="t('AppHeader.navigation-main')" class="pb-12">
								<ul class="flex flex-col" role="list">
									<li
										v-for="(link, key) of mobileLinks"
										:key="key"
										class="border-b p-3 last:border-none"
									>
										<NuxtLinkLocale
											class="uppercase"
											exact-active-class="underline underline-offset-2"
											:to="link.to"
										>
											{{ link.label }}
										</NuxtLinkLocale>
									</li>
								</ul>
							</nav>
						</DrawerClose>
					</DrawerFooter>
				</DrawerContent>
			</Drawer>

			<NuxtLinkLocale class="hidden lg:block" to="/">
				<!-- TODO: insert LIÖ Logo -->
			</NuxtLinkLocale>
			<!-- <img src="@/assets/lexat.svg" alt="LexAT Logo" class="w-32" /> -->
			<nav :aria-label="t('AppHeader.navigation-main')" class="hidden lg:block">
				<ul class="flex items-center gap-4" role="list">
					<li v-for="(link, key) of links" :key="key">
						<NuxtLinkLocale
							class="uppercase"
							exact-active-class="underline underline-offset-2"
							:to="link.to"
						>
							{{ link.label }}
						</NuxtLinkLocale>
					</li>
				</ul>
			</nav>

			<div class="relative flex items-center gap-4">
				<ColorSchemeSwitcher />
				<LocaleSwitcher />
			</div>
		</div>
	</header>
</template>
