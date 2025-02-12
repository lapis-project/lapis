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
import { Cat, FileText, MapPinned, Telescope, UserRound } from "lucide-vue-next";
import { Bar, Doughnut } from "vue-chartjs";

ChartJS.register(Title, Tooltip, Legend, BarElement, ArcElement, CategoryScale, LinearScale);

const localePath = useLocalePath();
const t = useTranslations();
const currentLocale = useLocale();

usePageMetadata({
	title: t("HomePage.meta.title"),
});

const ageData = {
	labels: ["<30", "30-50", "50+"],
	datasets: [
		{
			label: t("HomePage.charts.age-distribution.label"),
			data: [12, 19, 8],
			// backgroundColor: ["#ef4444", "#6366f1", "#ec4899"],
			backgroundColor: ["#8580ff", "#ff8080", "#ca80ff"],
		},
	],
};

const genderData = {
	labels: [
		t("HomePage.charts.gender-distribution.male"),
		t("HomePage.charts.gender-distribution.female"),
	],
	datasets: [
		{
			label: t("HomePage.charts.gender-distribution.label"),
			data: [14, 25],
			backgroundColor: ["#ff8080", "#ca80ff"],
		},
	],
};

const languageData = {
	labels: ["Hochdeutsch", "Umgangssprache", "Dialekt"],
	datasets: [
		{
			label: t("HomePage.charts.register-distribution.label"),
			data: [18, 22, 15],
			backgroundColor: ["#8580ff", "#ff8080", "#ca80ff"],
		},
	],
};

const chartOptions = {
	responsive: true,
	maintainAspectRatio: false,
};
</script>

<template>
	<MainContent class="container py-16">
		<div class="mb-12 flex flex-col-reverse gap-8 lg:flex-row">
			<div class="article-content flex flex-col lg:w-2/6">
				<h1 class="text-3xl font-semibold">{{ t("HomePage.title") }}</h1>
				<template v-if="currentLocale === 'de'">
					<p>
						LexAT21 (Atlas zur Lexik in Österreich im 21. Jahrhundert) ist eine Kollaboration
						zwischen dem
						<a href="https://www.oeaw.ac.at/acdh/acdh-ch-home" target="_blank"
							>Austrian Centre for Digital Humanities and Cultural Heritage</a
						>
						(ACDH-CH) und dem
						<a href="https://www.dioe.at/" target="_blank"
							>Spezialforschungsbereich Deutsch in Österreich: Variation - Kontakt - Perzeption</a
						>
						(SFB DiÖ, FWF F060) unter der Leitung von Alexandra N. Lenz. LexAT21 untersucht
						lexikalische Variation in gegenwärtiger gesprochener Sprache in Österreich anhand von
						ausgewählten Variablen. Visualisiert werden diese Ergebnisse über ein eigens
						entwickeltes Kartierungstool. Ausgewählte Analysen zu diesen Ergebnissen finden Sie im
						Reiter „Artikel“.
					</p>
				</template>
				<template v-else>
					<p>
						LexAT21 (Atlas on Lexis in Austria in the 21st century) is a collaborative project
						between the
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
				</template>
				<Button class="mt-6 self-center" @click="navigateTo(localePath('/maps'))"
					><Telescope class="mr-2 size-5" />{{ t("HomePage.action") }}</Button
				>
			</div>
			<div class="lg:w-4/6">
				<img
					alt="Beispielkarte des Projekts LexAT21"
					class="object-cover shadow-xl"
					height="871"
					src="/images/home.jpg"
					width="1397"
				/>
			</div>
		</div>
		<div class="article-content mb-12 border-b pb-12">
			<template v-if="currentLocale === 'de'">
				<p>
					LexAT21 ist Teil der
					<a
						href="https://www.oeaw.ac.at/de/acdh/forschung/sprachwissenschaft/forschung/korpuslinguistik/lapis-linguae-austriacae"
						target="_blank"
						>LAPIS</a
					>
					(Linguae Austriacae: Plattform und Informationssystem zu Sprache(n) in Österreich)
					Infrastruktur, einer momentan in Entstehung begriffenen Plattform zur Vernetzung von
					Forschungsdaten und -ergebnissen zu Sprache(n) in Österreich. Datengrundlage für diese
					Untersuchungen sind in der ersten Phase Online-Erhebungen in der Form von Fragebögen. Den
					momentan laufenden Fragebogen zur Erhebungsrunde 2 finden Sie
					<a href="https://ofb.dioe.at/index.php/65681?lang=de" target="_blank"
						>mit einem Klick hier</a
					>
					- wir freuen uns über Ihre Teilnahme!
				</p>
			</template>
			<template v-else>
				<p>
					LexAT is part of the
					<a
						href="https://www.oeaw.ac.at/acdh/research/linguistics/research/corpus-linguistics/lapis-linguae-austriacae"
						target="_blank"
						>LAPIS</a
					>
					(Linguae Austriacae: Platform and Information System on Language(s) in Austria)
					infrastructure currently being developed at the ACDH-CH. This platform aims to connect
					research data and results on language(s) in Austria. The data basis for the first phase of
					LexAT21 are online surveys. The current survey for survey round two can be found
					<a href="https://ofb.dioe.at/index.php/65681?lang=de" target="_blank">here</a> (German
					only).
				</p>
			</template>
		</div>
		<div class="mb-12 grid grid-cols-3 gap-6 border-b py-6 pb-12 lg:px-16 xl:px-24">
			<div class="flex items-center justify-center">
				<Bar class="h-64 w-full" :data="ageData" :options="chartOptions" />
			</div>
			<div class="flex items-center justify-center">
				<Doughnut class="h-64 w-full" :data="genderData" :options="chartOptions" />
			</div>
			<div class="flex items-center justify-center">
				<Bar class="h-64 w-full" :data="languageData" :options="chartOptions" />
			</div>
		</div>
		<div class="mb-12 grid grid-cols-4 gap-6 py-6 lg:px-16 xl:px-24">
			<div class="flex flex-col items-center justify-center gap-4">
				<div
					class="flex size-32 flex-col items-center justify-center gap-2 rounded-full bg-red-400 text-white"
				>
					<MapPinned class="size-12"></MapPinned>
					<p class="text-2xl">65</p>
				</div>
				<p class="text-xl">{{ t("HomePage.counts.locations") }}</p>
			</div>
			<div class="flex flex-col items-center justify-center gap-4">
				<div
					class="flex size-32 flex-col items-center justify-center gap-2 rounded-full bg-red-400 text-white"
				>
					<UserRound class="size-12"></UserRound>
					<p class="text-2xl">1923</p>
				</div>
				<p class="text-xl">{{ t("HomePage.counts.participants") }}</p>
			</div>
			<div class="flex flex-col items-center justify-center gap-4">
				<div
					class="flex size-32 flex-col items-center justify-center gap-2 rounded-full bg-red-400 text-white"
				>
					<FileText class="size-12"></FileText>
					<p class="text-2xl">2</p>
				</div>
				<p class="text-xl">{{ t("HomePage.counts.survey-rounds") }}</p>
			</div>
			<div class="flex flex-col items-center justify-center gap-4">
				<div
					class="flex size-32 flex-col items-center justify-center gap-2 rounded-full bg-red-400 text-white"
				>
					<Cat class="size-12"></Cat>
					<p class="text-2xl">56</p>
				</div>
				<p class="text-xl">{{ t("HomePage.counts.phenomenons") }}</p>
			</div>
		</div>
	</MainContent>
</template>
