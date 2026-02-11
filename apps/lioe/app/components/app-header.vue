<script lang="ts" setup>
import LocaleSwitcher from "@/components/locale-switcher.vue";
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
	<header class="border-b z-40">
		<div class="container Cmx-auto">
			<div class="flex h-16 items-center justify-between gap-4 py-4">
				<div class="block lg:hidden">
					<UButton
						id="mobile-menu"
						class="lg:hidden"
						variant="outline"
						@click="drawerOpen = !drawerOpen"
					>
						<UIcon class="size-4" :name="drawerOpen ? 'i-lucide-x' : 'i-lucide-menu'" />
					</UButton>
					<UDrawer v-model:open="drawerOpen">
						<template #content>
							<div class="p-4">
								<h3 class="font-semibold mb-4">Navigation</h3>
								<nav :aria-label="t('AppHeader.navigation-main')" class="pb-12">
									<ul class="flex flex-col" role="list">
										<li
											v-for="(link, key) of mobileLinks"
											:key="key"
											class="border-b p-3 last:border-none"
										>
											<ULink
												active-class="underline underline-offset-2"
												class="uppercase"
												:to="link.to"
											>
												{{ link.label }}
											</ULink>
										</li>
									</ul>
								</nav>
							</div>
						</template>
					</UDrawer>
				</div>

				<NuxtLinkLocale class="hidden lg:block" to="/">
					<LazySvgoLioe class="h-10" />
				</NuxtLinkLocale>
				<!-- <img src="@/assets/lexat.svg" alt="LexAT Logo" class="w-32" /> -->
				<nav :aria-label="t('AppHeader.navigation-main')" class="hidden lg:block">
					<ul class="flex items-center gap-4" role="list">
						<li v-for="(link, key) of links" :key="key">
							<ULink active-class="underline underline-offset-2" class="uppercase" :to="link.to">
								{{ link.label }}
							</ULink>
						</li>
					</ul>
				</nav>

				<div class="relative flex items-center gap-4">
					<ClientOnly>
						<ColorSchemeSwitcher />
					</ClientOnly>
					<LocaleSwitcher />
				</div>
			</div>
		</div>
	</header>
</template>
