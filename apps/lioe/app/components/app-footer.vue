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
	<UFooter class="border-t">
		<template #left>
			<nav :aria-label="t('AppFooter.navigation-secondary')">
				<ul class="flex items-center gap-4" role="list">
					<li v-for="(link, key) of links" :key="key">
						<NuxtLink :target="link.target" :to="link.to.path">
							{{ link.label }}
						</NuxtLink>
					</li>
				</ul>
			</nav>
		</template>
		<template #right>
			<div class="flex items-center gap-4 flex-wrap lg:flex-nowrap justify-between">
				<ULink
					target="_blank"
					title="Österreichische Akademie der Wissenschaften"
					to="https://www.oeaw.ac.at/oesterreichische-akademie-der-wissenschaften"
				>
					<LazySvgoOeaw class="h-16" />
				</ULink>
				<ULink
					target="_blank"
					title="Austrian Centre for Digital Humanities and Cultural Heritage"
					to="https://www.oeaw.ac.at/acdh/acdh-ch-home"
				>
					<LazySvgoAcdhChDark class="h-10 hidden dark:block" />
					<LazySvgoAcdhCh class="h-10 block dark:hidden" />
				</ULink>
				<ULink
					target="_blank"
					title="Wörterbuchs der historischen bairischen Mundarten in Österreich und Südtirol"
					to="https://lioe.dioe.at/articles"
				>
					<LazySvgoWboe class="h-13" />
				</ULink>
				<ULink
					target="_blank"
					title="FWF - Österreichischer Wissenschaftsfonds"
					to="https://www.fwf.ac.at/"
				>
					<LazySvgoFwf class="h-16" />
				</ULink>
				<ULink target="_blank" title="Universität Wien" to="https://www.univie.ac.at/">
					<LazySvgoUniVie class="h-10" />
				</ULink>
				<ULink target="_blank" title="Deutsch in Österreich" to="https://www.dioe.at/">
					<LazySvgoDioe class="h-14" />
				</ULink>
			</div>
		</template>
	</UFooter>
</template>
