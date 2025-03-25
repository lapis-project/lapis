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
import type { InferResponseType } from "hono/client";
import { FileText, MapPinned, Microscope, Scroll, Telescope, UserRound } from "lucide-vue-next";
import { Bar, Doughnut } from "vue-chartjs";

ChartJS.register(Title, Tooltip, Legend, BarElement, ArcElement, CategoryScale, LinearScale);

const { apiClient } = useApiClient();
const env = useRuntimeConfig();
const localePath = useLocalePath();
const t = useTranslations();
const currentLocale = useLocale();

usePageMetadata({
	title: t("HomePage.meta.title"),
});

const _getStartPageData = apiClient.stat.$get;
type APIStartPageData = InferResponseType<typeof _getStartPageData, 200>;

const { data: startPageData } = await useFetch<APIStartPageData>(`stat`, {
	baseURL: env.public.apiBaseUrl,
	method: "GET",
	credentials: "include",
});

const ageData = computed(() => {
	return {
		// LOWER AND UPPER BUCKET BOUNDARY ARE INCLUSIVE
		labels: ["≤30", "30-50", "51+"],
		datasets: [
			{
				label: t("HomePage.charts.age-distribution.label"),
				data: [
					startPageData.value?.age?.bucket_0_30 ?? 0,
					startPageData.value?.age?.bucket_30_50 ?? 0,
					startPageData.value?.age?.bucket_50_100 ?? 0,
				],
				// backgroundColor: ["#8580ff", "#ff8080", "#ca80ff"], // sexy
				// COLOR PALETTE '#d6ce93', '#efebce', '#bb8588', '#559cad', '#d8a48f' https://coolors.co/visualizer/d6ce93-efebce-bb8588-559cad-d8a48f
				backgroundColor: ["#d6ce93", "#bb8588", "#559cad"],
			},
		],
	};
});

const genderData = computed(() => {
	return {
		labels: [
			t("HomePage.charts.gender-distribution.male"),
			t("HomePage.charts.gender-distribution.female"),
			t("HomePage.charts.gender-distribution.diverse"),
		],
		datasets: [
			{
				label: t("HomePage.charts.gender-distribution.label"),
				data: [
					startPageData.value?.gender?.find((g) => g.gender === "männlich")?.total ?? 0,
					startPageData.value?.gender?.find((g) => g.gender === "weiblich")?.total ?? 0,
					startPageData.value?.gender?.find((g) => g.gender === "divers")?.total ?? 0,
				],
				backgroundColor: ["#d6ce93", "#bb8588", "#559cad"],
			},
		],
	};
});

const surveyData = computed(() => {
	return {
		labels: [
			t("HomePage.charts.survey-distribution.round-one"),
			t("HomePage.charts.survey-distribution.round-two"),
			t("HomePage.charts.survey-distribution.round-three"),
		],
		datasets: [
			{
				label: t("HomePage.charts.survey-distribution.label"),
				data: [
					startPageData.value?.survey_conducted?.[0]?.total,
					startPageData.value?.survey_conducted?.[1]?.total,
					startPageData.value?.survey_conducted?.[2]?.total,
				],
				backgroundColor: ["#d6ce93", "#bb8588", "#559cad"],
			},
		],
	};
});

const barChartOptions = {
	responsive: true,
	maintainAspectRatio: false,
	plugins: {
		legend: {
			labels: {
				boxWidth: 0, // This hides the colored box
				font: {
					size: 14, // Adjust legend font size
				},
			},
		},
	},
	scales: {
		x: {
			ticks: {
				font: {
					size: 14, // Adjust x-axis font size
				},
			},
		},
		y: {
			ticks: {
				font: {
					size: 14, // Adjust y-axis font size
				},
			},
		},
	},
};

const donutChartOptions = {
	responsive: true,
	maintainAspectRatio: false,
	plugins: {
		legend: {
			labels: {
				font: {
					size: 14, // Adjust legend font size
				},
			},
		},
	},
};

const counts = [
	{
		value: startPageData.value?.place?.[0]?.total ?? 0,
		icon: MapPinned,
		translation: "HomePage.counts.locations",
	},
	{
		value: startPageData.value?.inf?.[0]?.total ?? 0,
		icon: UserRound,
		translation: "HomePage.counts.participants",
	},
	{
		value: startPageData.value?.survey?.[0]?.total ?? 0,
		icon: FileText,
		translation: "HomePage.counts.survey-rounds",
	},
	{
		value: startPageData.value?.phen?.[0]?.total ?? 0,
		icon: Microscope,
		translation: "HomePage.counts.phenomenons",
	},
];
</script>

<template>
	<MainContent class="container py-16">
		<div class="mb-16 flex flex-col-reverse gap-14 lg:flex-row">
			<div class="article-content flex flex-col lg:w-2/6">
				<h1 class="text-3xl font-semibold">{{ t("HomePage.maps.title") }}</h1>
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
					><MapPinned class="mr-2 size-5" />{{ t("HomePage.maps.action") }}</Button
				>
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
		</div>
		<div class="mb-16 border-b border-t py-16 flex gap-14">
			<div class="lg:w-4/6">
				<img
					alt="Beispielkarte des Projekts LexAT21"
					class="object-cover shadow-sharp"
					height="1148"
					src="/images/home-survey.webp"
					width="1728"
				/>
			</div>
			<div class="article-content flex flex-col lg:w-1/2">
				<h1 class="text-3xl font-semibold">{{ t("HomePage.data.title") }}</h1>
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
						Untersuchungen sind in der ersten Phase Online-Erhebungen in der Form von Fragebögen.
						Den momentan laufenden Fragebogen zur Erhebungsrunde 3 finden Sie
						<a href="https://ofb.dioe.at/index.php/65681?lang=de" target="_blank"
							>mit einem Klick hier</a
						>
						- wir freuen uns über Ihre Teilnahme!
						<br />
						<br />
						Der aktuelle Bestand aller erhobenen Forschungsdaten kann im Reiter „Belegdatenbank“
						aufgerufen und durchsucht werden.
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
						research data and results on language(s) in Austria. The data basis for the first phase
						of LexAT21 are online surveys. The current survey for survey round three can be found
						<a href="https://ofb.dioe.at/index.php/65681?lang=de" target="_blank">here</a> (German
						only).
						<br />
						<br />
						The current inventory of all collected research data can be accessed and searched in the
						'Browse data' tab.
					</p>
				</template>
				<Button class="mt-6 self-center" @click="navigateTo(localePath('/db'))"
					><Telescope class="mr-2 size-5" />{{ t("HomePage.data.action") }}</Button
				>
			</div>
		</div>

		<section class="mb-16 border-b pb-16 flex flex-col items-center">
			<h1 class="text-2xl font-semibold mb-12">{{ t("HomePage.charts.title") }}</h1>
			<div class="grid grid-cols-3 gap-8 py-6 lg:px-16 xl:px-20 mb-8">
				<div class="flex items-center justify-center">
					<Bar class="h-64 w-full" :data="ageData" :options="barChartOptions" />
				</div>
				<div class="flex items-center justify-center">
					<Doughnut class="h-64 w-full" :data="genderData" :options="donutChartOptions" />
				</div>
				<div class="flex items-center justify-center">
					<Bar class="h-64 w-full" :data="surveyData" :options="barChartOptions" />
				</div>
			</div>

			<div class="grid grid-cols-4 gap-6 mt-6 lg:px-16 xl:px-24 self-stretch">
				<div
					v-for="(item, index) in counts"
					:key="index"
					class="flex flex-col items-center justify-center gap-4"
				>
					<div
						class="flex size-32 flex-col items-center justify-center gap-2 rounded-full bg-[#bb8588] text-white"
					>
						<!-- Render the icon component -->
						<component :is="item.icon" class="size-12 stroke-[1.5]" />
						<!-- Use the CountUp component instead of a simple <p> -->
						<p class="text-2xl">
							<CountUp :value="item.value" />
						</p>
					</div>
					<p class="text-xl">{{ t(item.translation) }}</p>
				</div>
			</div>
		</section>

		<section class="article-content flex flex-col mb-16">
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
		</section>
	</MainContent>
</template>

<style lang="css" scoped>
.shadow-sharp {
	box-shadow:
		0 1px 1px rgb(0 0 0 / 15%),
		0 2px 2px rgb(0 0 0 / 15%),
		0 4px 4px rgb(0 0 0 / 15%),
		0 8px 8px rgb(0 0 0 / 15%);
}
</style>
