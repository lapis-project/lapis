<script lang="ts" setup>
const t = useTranslations();
const currentLocale = useLocale();

usePageMetadata({
	title: t("AboutPage.meta.title"),
});
</script>

<template>
	<MainContent class="container py-16">
		<section class="mb-16 pb-16 border-b">
			<div class="article-content mx-auto max-w-4xl">
				<h1 class="text-3xl text-left sm:text-center font-semibold">{{ t("AboutPage.title") }}</h1>
				<template v-if="currentLocale === 'de'">
					<p>
						Das Projekt LexAT21 setzt es sich zum Ziel, lexikalische Vielfalt und ihre Dynamik im
						21. Jahrhundert zu dokumentieren. Das Projekt wird in Kooperation von Forschenden der
						Universität Wien (FWF Spezialforschungsbereich „Deutsch in Österreich. Variation -
						Kontakt - Perzeption“) und der Österreichischen Akademie der Wissenschaften (<em
							>Austrian Centre for Digital Humanities and Cultural Heritage, ACDH-CH</em
						>) durchgeführt.
					</p>
					<p>
						Grundlage der auf dieser Plattform zur Verfügung gestellten Materialien (nämlich
						<NuxtLinkLocale target="_blank" to="/db">Fragebogendaten</NuxtLinkLocale>,
						<NuxtLinkLocale target="_blank" to="/maps">Sprachkarten</NuxtLinkLocale> und
						<NuxtLinkLocale target="_blank" to="/articles">Kartenkommentare</NuxtLinkLocale>) sind
						umfangreiche Online-Befragungen, die seit 2022 österreichweit durchgeführt werden. In
						den dabei eingesetzten Fragebögen werden die Teilnehmenden auch im Hinblick auf ihre
						eigene Variation in ihrem Wortschatz befragt, um Aussagen zur „intraindividuellen“
						Variation der Befragten treffen zu können. Der Fokus der Befragungen lag auf Phänomenen
						innerhalb der Sprache Deutsch, wobei die Teilnehmenden sowohl zu ihrem „Hochdeutsch“
						(<em>Standardsprache</em>) als auch - falls vorhanden - zu ihrer „Mundart“
						(<em>Dialekt</em>) oder ihrer „Umgangssprache“ (<em>Regiolekt</em>) befragt wurden.
					</p>
					<p>
						Mehr Informationen über das Projekt
						<NuxtLinkLocale target="_blank" to="/articles/lexat21-einfuehrung"
							>finden Sie hier</NuxtLinkLocale
						>.
					</p>
				</template>
				<template v-else>
					<p>
						The LexAT21 project aims to document lexical diversity and ist dynamics in the 21st
						century. It is a collaboration between researchers from the University of Vienna (FWF
						F60 Special Research Programme “German in Austria. Variation - Contact - Perception.“)
						and the Austrian Academy of Sciences (<em
							>Austrian Centre for Digital Humanities and Cultural Heritage, ACDH-CH</em
						>).
					</p>
					<p>
						The resources made available on this platform (<NuxtLinkLocale target="_blank" to="/db"
							>questionnaire data</NuxtLinkLocale
						>, <NuxtLinkLocale target="_blank" to="/maps">linguistic maps</NuxtLinkLocale> and
						<NuxtLinkLocale target="_blank" to="/articles">map commentaries</NuxtLinkLocale>) are
						based on extensive online surveys conducted across Austria since 2022. In order to
						capture intra-individual lexical variation, these questionnaires target participants'
						variation in their own vocabulary. The focus of the survey lies on phenomena within the
						German language and the participants' answers concerning their standard language
						(<em>Hochdeutsch</em>) and - where applicable - their dialect (<em>Mundart</em>) or
						colloquial variety (<em>Regiolekt</em>).
					</p>
					<p>
						Further information about the project can be
						<NuxtLinkLocale target="_blank" to="/articles/lexat21-einfuehrung"
							>found here</NuxtLinkLocale
						>.
					</p>
				</template>
			</div>
		</section>

		<section class="mb-16 flex flex-col items-center pb-16 border-b">
			<h2 class="text-3xl font-semibold mb-12">{{ t("HomePage.charts.title") }}</h2>
			<StatsSection />
		</section>

		<section class="mb-16 pb-16 border-b">
			<div class="article-content mx-auto max-w-4xl">
				<h2 class="text-3xl font-semibold">{{ t("AboutPage.team.title") }}</h2>
				<h3>{{ t("AboutPage.team.head") }}</h3>
				<p>Alexandra N. Lenz</p>
				<h3>{{ t("AboutPage.team.technical") }}</h3>
				<p>Jakob Bal, Kilian Kukelka, Markus Pluschkovits, Daniel Schopper, Anja Wittibschlager</p>
				<h3>{{ t("AboutPage.team.authors") }}</h3>
				<p>
					Amelie Dorn, Jan Höll, Wolfgang Koppensteiner, Katharina Korecky-Kröll, Claudia Mattes,
					Markus Pluschkovits, Rita Stiglbauer, Florian Tavernier, Anja Wittibschlager, Theresa
					Ziegler
				</p>
				<h3>{{ t("AboutPage.team.editors") }}</h3>
				<p>Kerstin Lorenz, Eric Schirl</p>
			</div>
		</section>

		<section>
			<div class="article-content mx-auto max-w-4xl">
				<h2 class="text-3xl font-semibold">{{ t("AboutPage.citation.title") }}</h2>
				<p>{{ t("AboutPage.citation.text") }}:</p>
				<blockquote>
					LexAT21: Atlas zur lexikalischen Variation in Österreich im 21. Jahrhundert. Herausgegeben
					von Alexandra N. Lenz. Konzipiert und entwickelt von Markus Pluschkovits, Jakob Bal,
					Kilian Kukelka, Anja Wittibschlager und Daniel Schopper. Unter Mitarbeit von Amelie Dorn,
					Jan Höll, Katharina Korecky-Kröll, Wolfgang Koppensteiner, Claudia Mattes, Markus
					Pluschkovits, Rita Stiglbauer, Florian David Tavernier, Anja Wittibschlager, Theresa
					Ziegler, Kerstin Lorenz und Eric Schirl.
				</blockquote>
			</div>
		</section>
	</MainContent>
</template>
