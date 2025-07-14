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
import { FileText, MapPinned, Microscope, UserRound } from "lucide-vue-next";
import { Bar, Doughnut } from "vue-chartjs";

ChartJS.register(Title, Tooltip, Legend, BarElement, ArcElement, CategoryScale, LinearScale);

const { apiClient } = useApiClient();
const env = useRuntimeConfig();
const t = useTranslations();

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
	<section class="flex flex-col gap-12 items-center">
		<div class="grid grid-cols-1 md:grid-cols-2 gap-24">
			<div class="flex items-center justify-center h-80">
				<Bar class="w-full" :data="ageData" :options="barChartOptions" />
			</div>
			<div class="flex items-center justify-center h-80">
				<Doughnut class="w-full" :data="genderData" :options="donutChartOptions" />
			</div>
		</div>
		<div
			class="grid grid-cols-2 gap-6 md:flex md:mx-auto md:gap-12 lg:gap-20 xl:gap-24 self-stretch mb-8"
		>
			<div
				v-for="(item, index) in counts"
				:key="index"
				class="flex flex-col items-center justify-center gap-4"
			>
				<div
					class="flex size-28 sm:size-32 flex-col items-center justify-center gap-2 rounded-full bg-[#bb8588] text-white"
				>
					<component :is="item.icon" class="size-10 sm:size-12 stroke-[1.5]" />
					<p class="text-xl sm:text-2xl">
						<CountUp :value="item.value" />
					</p>
				</div>
				<p class="md:text-xl">{{ t(item.translation) }}</p>
			</div>
		</div>
	</section>
</template>
