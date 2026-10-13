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

const formatThousands = (value: number) => `${Math.round(value / 1_000)}K`;

const counts = [
	{
		value: startPageData.value?.place?.[0]?.total ?? 0,
		icon: "i-lucide-map-pinned",
		translation: "HomePage.counts.locations",
	},
	{
		value: startPageData.value?.inf?.[0]?.total ?? 0,
		icon: "i-lucide-user-round",
		translation: "HomePage.counts.participants",
	},
	{
		value: startPageData.value?.response?.[0]?.total ?? 0,
		icon: "i-lucide-audio-lines",
		translation: "HomePage.counts.answers",
	},
	{
		value: startPageData.value?.survey?.[0]?.total ?? 0,
		icon: "i-lucide-file-text",
		translation: "HomePage.counts.survey-rounds",
	},
	{
		value: startPageData.value?.phen?.[0]?.total ?? 0,
		icon: "i-lucide-microscope",
		translation: "HomePage.counts.phenomenons",
	},
];
</script>

<template>
	<section class="flex w-full min-w-0 max-w-6xl flex-col items-center gap-10 sm:gap-12">
		<div class="grid w-full min-w-0 grid-cols-1 gap-10 md:grid-cols-2 md:gap-8 lg:gap-16">
			<div class="relative h-72 min-w-0 sm:h-80">
				<Bar class="w-full" :data="ageData" :options="barChartOptions" />
			</div>
			<div class="relative h-72 min-w-0 sm:h-80">
				<Doughnut class="w-full" :data="genderData" :options="donutChartOptions" />
			</div>
		</div>
		<ul
			class="mb-8 flex w-full flex-wrap justify-center gap-x-4 gap-y-8 sm:gap-x-6 sm:gap-y-10 lg:flex-nowrap"
		>
			<li
				v-for="item in counts"
				:key="item.translation"
				class="flex min-w-0 basis-[calc((100%-1rem)/2)] flex-col items-center gap-3 text-center sm:basis-[calc((100%-3rem)/3)] lg:flex-1 lg:basis-0"
			>
				<div
					class="flex size-28 shrink-0 flex-col items-center justify-center gap-2 rounded-full bg-[#bb8588] text-white sm:size-32"
				>
					<UIcon
						:name="item.icon"
						mode="svg"
						class="size-10 sm:size-12 [&_*]:stroke-[1.5]"
						aria-hidden="true"
					/>
					<p :title="String(item.value)" class="text-xl font-semibold tabular-nums sm:text-2xl">
						<span class="sr-only">{{ item.value }}</span>
						<CountUp
							:value="item.value"
							:format="item.value >= 100_000 ? formatThousands : undefined"
							aria-hidden="true"
						/>
					</p>
				</div>
				<p class="max-w-48 text-sm leading-snug break-words sm:text-base lg:text-lg">
					{{ t(item.translation) }}
				</p>
			</li>
		</ul>
	</section>
</template>
