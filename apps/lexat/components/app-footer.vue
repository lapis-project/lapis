<script lang="ts" setup>
import type { NuxtLinkProps } from "#app";

const t = useTranslations();

const links = computed(() => {
	return {
		imprint: {
			to: { path: "https://www.oeaw.ac.at/oeaw/impressum/" },
			label: t("AppFooter.links.imprint"),
			target: "_blank",
		},
	} satisfies Record<string, { to: NuxtLinkProps["to"]; label: string; target: string }>;
});
</script>

<template>
	<footer class="border-t">
		<div
			class="container flex items-center justify-between gap-8 mdgap-4 py-6 flex-col md:flex-row"
		>
			<nav :aria-label="t('AppFooter.navigation-secondary')">
				<ul class="flex items-center gap-4" role="list">
					<li v-for="(link, key) of links" :key="key">
						<NuxtLink :target="link.target" :to="link.to.path">
							{{ link.label }}
						</NuxtLink>
					</li>
				</ul>
			</nav>
			<div class="flex flex-wrap-reverse justify-around sm:justify-start items-center gap-3">
				<NuxtLinkLocale target="_blank" title="Deutsch in Österreich" to="https://www.dioe.at/">
					<LazySvgoDioe class="h-16" />
				</NuxtLinkLocale>
				<NuxtLinkLocale
					target="_blank"
					title="FWF - Österreichischer Wissenschaftsfonds"
					to="https://www.fwf.ac.at/"
				>
					<LazySvgoFwf class="h-16" />
				</NuxtLinkLocale>
				<NuxtLinkLocale
					target="_blank"
					title="Austrian Centre for Digital Humanities and Cultural Heritage"
					to="https://www.oeaw.ac.at/acdh/acdh-ch-home"
				>
					<LazySvgoAcdhChDark class="h-10 hidden dark:block" />
					<LazySvgoAcdhCh class="h-10 block dark:hidden" />
				</NuxtLinkLocale>
			</div>
		</div>
	</footer>
</template>
