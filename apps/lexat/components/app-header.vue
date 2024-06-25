<script lang="ts" setup>
import type { NuxtLinkProps } from "#app";

const t = useTranslations();

const colorMode = useColorMode();

const links = computed(() => {
	return {
		articles: { to: { path: "/articles" }, label: t("AppHeader.links.articles") },
		db: { to: { path: "/db" }, label: t("AppHeader.links.db") },
		research: { to: { path: "/maps" }, label: t("AppHeader.links.research") },
	} satisfies Record<string, { to: NuxtLinkProps["href"]; label: string }>;
});
</script>

<template>
	<header class="container border-b">
		<div class="flex h-16 items-center justify-between gap-4 py-4">
			<svg
				width="182"
				height="45"
				viewBox="0 0 182 45"
				class="w-32"
				fill="none"
				xmlns="http://www.w3.org/2000/svg"
			>
				<path
					d="M0.15 44V42.425C2.85 42.425 4.425 41.925 4.875 40.925V3.2C4.425 2.2 2.85 1.7 0.15 1.7V0.124997H16.5V1.7C13.8 1.7 12.225 2.2 11.775 3.2V41.45H28.875C30.125 40.9 31.25 39.325 32.25 36.725H33.75L31.95 44H0.15ZM44.1838 25.925C44.2338 30.125 45.4338 33.85 47.7838 37.1C50.1838 40.3 52.8588 41.9 55.8088 41.9C60.1588 41.9 63.6588 40.25 66.3088 36.95L68.1088 37.85C66.6588 40.25 64.7588 42 62.4088 43.1C60.1088 44.2 57.0588 44.75 53.2588 44.75C51.3588 44.75 49.5338 44.475 47.7838 43.925C46.0338 43.325 44.3088 42.375 42.6088 41.075C40.9088 39.725 39.5588 37.75 38.5588 35.15C37.5588 32.55 37.0588 29.45 37.0588 25.85C37.0588 21.45 38.4088 17.75 41.1088 14.75C43.8588 11.75 47.6588 10.25 52.5088 10.25C57.8088 10.25 61.7588 11.75 64.3588 14.75C66.9588 17.7 68.2588 21.425 68.2588 25.925H44.1838ZM44.2588 23.6H60.9088C60.6088 20 59.8338 17.25 58.5838 15.35C57.3838 13.45 55.2588 12.5 52.2088 12.5C50.4588 12.5 48.7588 13.525 47.1088 15.575C45.5088 17.625 44.5588 20.3 44.2588 23.6ZM102.946 11V12.575C100.346 12.575 98.6707 13.05 97.9207 14L90.5707 24.95L100.546 41C101.096 41.95 102.646 42.425 105.196 42.425V44H90.6457V42.425C91.8457 42.425 92.7957 42.35 93.4957 42.2L86.5207 30.95L79.1707 41.9C79.8207 42.25 81.0707 42.425 82.9207 42.425V44H70.6207V42.425C73.2707 42.425 74.9707 41.9 75.7207 40.85L84.4957 27.8L75.7957 13.775C75.2957 12.975 73.8207 12.575 71.3707 12.575V11H85.9207V12.575C84.7207 12.575 83.7457 12.65 82.9957 12.8L88.5457 21.8L94.3957 13.1C93.7457 12.75 92.4957 12.575 90.6457 12.575V11H102.946ZM130.305 44V42.425C132.605 42.425 134.055 42.125 134.655 41.525L130.455 30.05H116.055L112.155 41.075C112.655 41.975 114.205 42.425 116.805 42.425V44H104.505V42.425C107.305 42.425 108.88 41.9 109.23 40.85L123.78 0.124997H127.38L141.93 40.85C142.28 41.9 143.88 42.425 146.73 42.425V44H130.305ZM123.18 10.1L116.955 27.575H129.555L123.18 10.1ZM143.955 0.124997H181.605V7.4H180.03C180.03 4.7 179.53 3.125 178.53 2.675H166.23V40.925C166.68 41.925 168.255 42.425 170.955 42.425V44H154.605V42.425C157.305 42.425 158.88 41.925 159.33 40.925V2.675H147.03C146.03 3.125 145.53 4.7 145.53 7.4H143.955V0.124997Z"
					:fill="colorMode.value === 'dark' ? 'white' : 'black'"
				/>
			</svg>
			<!-- <img src="@/assets/lexat.svg" alt="LexAT Logo" class="w-32" /> -->
			<nav :aria-label="t('AppHeader.navigation-main')">
				<ul class="flex items-center gap-4" role="list">
					<li v-for="(link, key) of links" :key="key">
						<NuxtLinkLocale
							:to="link.to"
							class="uppercase"
							exact-active-class="underline underline-offset-2"
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
