<script lang="ts" setup>
import {
	ArcElement,
	BarElement,
	CategoryScale,
	Chart as ChartJS,
	Legend,
	LinearScale,
	Title,
	Tooltip,
} from "chart.js";

ChartJS.register(Title, Tooltip, Legend, BarElement, ArcElement, CategoryScale, LinearScale);

const t = useTranslations();
const currentLocale = useLocale();

usePageMetadata({
	title: t("HomePage.meta.title"),
	description: t("HomePage.meta.description"),
});
</script>

<template>
	<MainContent class="container py-16">
		<section class="mb-16 pb-16 border-b">
			<div class="article-content mx-auto max-w-4xl">
				<h1 class="text-left font-semibold mb-6 sm:mb-10 text-3xl">
					{{ t("HomePage.introduction.title") }}
				</h1>
				<p>
					<template v-if="currentLocale === 'de'">
						LexAT21 dokumentiert und erforscht lexikalische Variation des Gegenwartsdeutschen in
						Österreich. Die Daten stammen aus Fragebogenerhebungen, die seit 2021 österreichweit
						online durchgeführt werden. Die Fragebögen sind registerübergreifend (von
						Dialekt/Mundart bis Hochdeutsch (<em>Standardsprache</em>)) angelegt und berücksichtigen
						lexikalische Variation in ihrer gesprochensprachlichen Vielfalt.
					</template>
					<template v-else>
						LexAT21 documents and researches lexical Variation in contemporary German in Austria.
						The data was collected by means from surveys, which were distributed online since 2021
						all over Austria. The surveys target different registers of the respondents (both their
						dialect/colloquial language use and their High German (standard German)) and focus
						lexical variation in spoken language.
					</template>
				</p>
				<h2 class="text-xl font-semibold">{{ t("HomePage.features.title") }}</h2>
				<ul>
					<template v-if="currentLocale === 'de'">
						<li>
							einen direkten Zugang zu den
							<NuxtLinkLocale target="_blank" to="/db">Originaldaten</NuxtLinkLocale> der
							Fragebogenerhebungen
						</li>
						<li>
							vielfältige Möglichkeiten der
							<NuxtLinkLocale target="_blank" to="/maps">Datenkartierungen</NuxtLinkLocale>
						</li>
						<li>
							Auswertungen der Daten in Form von
							<NuxtLinkLocale target="_blank" to="/articles">Kartenkommentaren</NuxtLinkLocale>
						</li>
						<li>
							umfangreiche
							<NuxtLinkLocale target="_blank" to="/articles/lexat21-einfuehrung"
								>Hintergrundinformationen</NuxtLinkLocale
							>
							zum Projekt
						</li>
						<li>
							die Möglichkeit
							<a href="https://ofb.dioe.at/index.php/59431?lang=de" target="_blank">mitzumachen</a>
							(Runde III) und damit den eigenen Wortschatz zu dokumentieren
						</li>
					</template>
					<template v-else>
						<li>
							access to the
							<NuxtLinkLocale target="_blank" to="/db">data of the surveys</NuxtLinkLocale>
						</li>
						<li>
							various ways of
							<NuxtLinkLocale target="_blank" to="/maps">mapping the data</NuxtLinkLocale>
						</li>
						<li>
							analyses of the data by means of
							<NuxtLinkLocale target="_blank" to="/articles">map commentaries</NuxtLinkLocale>
						</li>
						<li>
							extensive
							<NuxtLinkLocale target="_blank" to="/articles/lexat21-einfuehrung"
								>background information</NuxtLinkLocale
							>
							about the project
						</li>
						<li>
							the possibility to document your own language use by
							<a href="https://ofb.dioe.at/index.php/59431?lang=de" target="_blank"
								>participating</a
							>
							(round III) in the current survey
						</li>
					</template>
				</ul>
			</div>
		</section>

		<section class="mb-16 flex flex-col items-center pb-12 border-b">
			<h2 class="text-3xl font-semibold mb-12">{{ t("HomePage.charts.title") }}</h2>
			<StatsSection data-testid="stats-count" />
		</section>

		<section class="mb-16 pb-16 border-b">
			<div class="article-content mx-auto max-w-4xl">
				<h2 class="text-3xl font-semibold">{{ t("HomePage.team.title") }}</h2>
				<h3>{{ t("HomePage.team.head") }}</h3>
				<p>Alexandra N. Lenz</p>
				<h3>{{ t("HomePage.team.technical") }}</h3>
				<p>
					Jakob Bal, Kilian Kukelka, Markus Pluschkovits, Marie Rohler, Daniel Schopper, Anja
					Wittibschlager
				</p>
				<h3>{{ t("HomePage.team.authors") }}</h3>
				<p>
					Amelie Dorn, Jan Höll, Wolfgang Koppensteiner, Katharina Korecky-Kröll, Claudia Mattes,
					Markus Pluschkovits, Rita Stiglbauer, Florian Tavernier, Anja Wittibschlager, Theresa
					Ziegler
				</p>
				<h3>{{ t("HomePage.team.editors") }}</h3>
				<p>Kerstin Lorenz, Eric Schirl</p>
			</div>
		</section>

		<section>
			<div class="article-content mx-auto max-w-4xl">
				<h2 class="text-3xl font-semibold">{{ t("HomePage.citation.title") }}</h2>
				<p>{{ t("HomePage.citation.text") }}:</p>
				<blockquote v-if="currentLocale === 'de'">
					Lenz, Alexandra N. (ed.). 2025ff. LexAT21 - Atlas zur lexikalischen Variation in
					Österreich im 21. Jahrhundert. Konzipiert und entwickelt von Jakob Bal, Kilian Kukelka,
					Markus Pluschkovits, Marie Rohler, Daniel Schopper und Anja Wittibschlager. Unter
					Mitarbeit von Amelie Dorn, Jan Höll, Katharina Korecky-Kröll, Wolfgang Koppensteiner,
					Claudia Mattes, Markus Pluschkovits, Rita Stiglbauer, Florian David Tavernier, Anja
					Wittibschlager, Theresa Ziegler, Kerstin Lorenz und Eric Schirl.
				</blockquote>
				<blockquote v-else>
					Lenz, Alexandra N. (ed.). 2025ff. LexAT21 - Atlas on lexical variation in Austria in the
					21st century. Concept and development by Jakob Bal, Kilian Kukelka, Markus Pluschkovits,
					Marie Rohler, Daniel Schopper und Anja Wittibschlager. With participation from Amelie
					Dorn, Jan Höll, Katharina Korecky-Kröll, Wolfgang Koppensteiner, Claudia Mattes, Markus
					Pluschkovits, Rita Stiglbauer, Florian David Tavernier, Anja Wittibschlager, Theresa
					Ziegler, Kerstin Lorenz and Eric Schirl.
				</blockquote>
			</div>
		</section>

		<!-- <div class="mb-16 flex flex-col-reverse gap-14 lg:flex-row">
			<div class="article-content flex flex-col lg:w-2/6">
			</div>
			<div class="lg:w-4/6">
				<img
					alt="Beispielkarte des Projekts LexAT21"
					class="object-cover shadow-sharp"
					height="1148"
					src="/images/home-maps.webp"
					width="1728"
				/>
			</div>
		</div> -->

		<!-- <section class="article-content flex flex-col mb-16 border-b pb-16">
			<p class="max-w-2xl mx-auto text-center">
				<template v-if="currentLocale === 'de'">
					Interesse geweckt? Dann werde Teil des Forschungsprojekts und nimm an der aktuellen
					Fragenrunde zum Sprachgebrauch in Österreich teil!
				</template>
				<template v-else>
					Want to take part? Join our research project and participate in the current questionnaire
					on language usage in Austria (open for all speakers of German in Austria)!
				</template>
			</p>
			<Button
				class="mt-6 self-center"
				@click="
					navigateTo('https://ofb.dioe.at/index.php/65681?lang=de', {
						external: true,
						open: {
							target: '_blank',
						},
					})
				"
				><Scroll class="mr-2 size-5" />{{ t("HomePage.cta.action") }}</Button
			>
		</section> -->
	</MainContent>
</template>
