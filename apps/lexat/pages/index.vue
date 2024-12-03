<script lang="ts" setup>
// defineRouteRules({
// 	prerender: true,
// });

const t = useTranslations();
const currentLocale = useLocale();

usePageMetadata({
	title: t("IndexPage.meta.title"),
});
</script>

<template>
	<MainContent class="container max-w-5xl py-8">
		<PageTitle class="mb-6">{{ t("IndexPage.title") }}</PageTitle>
		<div class="article-content">
			<template v-if="currentLocale === 'de'">
				<p>
					LexAT21 (Atlas zur Lexik in Österreich im 21. Jahrhundert) ist eine Kollaboration zwischen
					dem
					<a href="https://www.oeaw.ac.at/acdh/acdh-ch-home" target="_blank"
						>Austrian Centre for Digital Humanities and Cultural Heritage</a
					>
					(ACDH-CH) und dem
					<a href="https://www.dioe.at/" target="_blank"
						>Spezialforschungsbereich Deutsch in Österreich: Variation - Kontakt - Perzeption</a
					>
					(SFB DiÖ, FWF F060) unter der Leitung von Alexandra N. Lenz. LexAT21 untersucht
					lexikalische Variation in gegenwärtiger gesprochener Sprache in Österreich anhand von
					ausgewählten Variablen. Visualisiert werden diese Ergebnisse über ein eigens entwickeltes
					Kartierungstool. Ausgewählte Analysen zu diesen Ergebnissen finden Sie im Reiter
					„Artikel“.
				</p>
				<p>
					LexAT21 ist Teil der
					<a
						href="https://www.oeaw.ac.at/de/acdh/forschung/sprachwissenschaft/forschung/korpuslinguistik/lapis-linguae-austriacae"
						target="_blank"
						>LAPIS</a
					>
					(Linguae Austriacae: Plattform und Informationssystem zu Sprache(n) in Österreich)
					Infrastruktur, einer momentan in Entstehung begriffenen Plattform zur Vernetzung von
					Forschungsdaten und -ergebnissen zu Sprache(n) in Österreich.
				</p>
				<p>
					Datengrundlage für diese Untersuchungen sind in der ersten Phase Online-Erhebungen in der
					Form von Fragebögen. Den momentan laufenden Fragebogen zur Erhebungsrunde 2 finden Sie
					<a href="https://ofb.dioe.at/index.php/65681?lang=de" target="_blank"
						>mit einem Klick hier</a
					>
					- wir freuen uns über Ihre Teilnahme!
				</p>
			</template>
			<template v-else>
				<p>
					LexAT21 (Atlas on Lexis in Austria in the 21st century) is a collaborative project between
					the
					<a href="https://www.oeaw.ac.at/acdh/acdh-ch-home" target="_blank"
						>Austrian Centre for Digital Humanities and Cultural Heritage</a
					>
					and the
					<a href="https://www.dioe.at/en/" target="_blank"
						>Special Research Programme German in Austria: Variation - Contact - Perception</a
					>
					(FWF F060) under the lead of Alexandra N. Lenz. The LexAT21 project investigates lexical
					variation in contemporary spoken German in Austria on the basis of select variables. The
					results are visualized in a custom made mapping tool. You can find analyses of select
					variables by navigating to “Articles”.
				</p>
				<p>
					LexAT is part of the
					<a
						href="https://www.oeaw.ac.at/acdh/research/linguistics/research/corpus-linguistics/lapis-linguae-austriacae"
						target="_blank"
						>LAPIS</a
					>
					(Linguae Austriacae: Platform and Information System on Language(s) in Austria)
					infrastructure currently being developed at the ACDH-CH. This platform aims to connect
					research data and results on language(s) in Austria.
				</p>
				<p>
					The data basis for the first phase of LexAT21 are online surveys. The current survey for
					survey round two can be found
					<a href="https://ofb.dioe.at/index.php/65681?lang=de" target="_blank">here</a> (German
					only).
				</p>
			</template>
		</div>
	</MainContent>
</template>
