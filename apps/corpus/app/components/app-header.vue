<script lang="ts" setup>
import { Menu, XIcon } from "lucide-vue-next";

import type { NuxtLinkProps } from "#app";

const t = useTranslations();

const drawerOpen = ref<boolean>(false);

const links = computed(() => {
	// TODO add i18n messages when navigation is fixated
	return {
		about: { to: { path: "/about" }, label: "Über das Projekt" },
		transcripts: { to: { path: "/transcripts" }, label: "Transkripte" },
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
				<svg
					class="w-24"
					viewBox="0 0 117 44"
					fill="currentColor"
					xmlns="http://www.w3.org/2000/svg"
				>
					<path
						d="M100.562 43.875V42.3C103.262 42.3 104.837 41.8 105.287 40.8V3.075C104.837 2.075 103.262 1.575 100.562 1.575V0H116.912V1.575C114.212 1.575 112.637 2.075 112.187 3.075V40.8C112.637 41.8 114.212 42.3 116.912 42.3V43.875H100.562Z"
					/>
					<path
						d="M72.2906 0V1.575C69.9906 1.575 68.5406 1.875 67.9406 2.475L79.4156 33.9L90.4406 2.925C89.9406 2.025 88.3906 1.575 85.7906 1.575V0H98.0906V1.575C95.2906 1.575 93.7656 1.975 93.5156 2.775L78.8156 43.875H75.2156L60.6656 3.15C60.2656 2.1 58.6656 1.575 55.8656 1.575V0H72.2906Z"
					/>
					<path
						d="M37.1338 43.875V42.3C39.8338 42.3 41.4088 41.8 41.8588 40.8V3.075C41.4088 2.075 39.8338 1.575 37.1338 1.575V0H53.4838V1.575C50.7838 1.575 49.2088 2.075 48.7588 3.075V40.8C49.2088 41.8 50.7838 42.3 53.4838 42.3V43.875H37.1338Z"
					/>
					<path
						d="M0 43.875V42.3C2.7 42.3 4.275 41.8 4.725 40.8V3.075C4.275 2.075 2.7 1.575 0 1.575V0H16.35V1.575C13.65 1.575 12.075 2.075 11.625 3.075V41.325H28.725C29.975 40.775 31.1 39.2 32.1 36.6H33.6L31.8 43.875H0Z"
					/>
				</svg>
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
