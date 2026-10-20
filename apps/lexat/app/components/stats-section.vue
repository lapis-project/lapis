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
import type { ChartOptions } from "chart.js";
import type { InferResponseType } from "hono/client";
import { Bar, Doughnut } from "vue-chartjs";

ChartJS.register(Title, Tooltip, Legend, BarElement, ArcElement, CategoryScale, LinearScale);

const { apiClient } = useApiClient();
const env = useRuntimeConfig();
const t = useTranslations();
const colorMode = useColorMode();
const chartTextColor = computed(() => (colorMode.value === "dark" ? "#d4d4d8" : "#52525b"));

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
				backgroundColor: ["#d6ce93", "#bb8588", "#559cad"],
				borderRadius: 4,
				maxBarThickness: 60,
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
				borderWidth: 0,
				spacing: 3,
			},
		],
	};
});

const barChartOptions = computed<ChartOptions<"bar">>(() => ({
	responsive: true,
	maintainAspectRatio: false,
	color: chartTextColor.value,
	plugins: {
		legend: {
			display: false,
		},
	},
	scales: {
		x: {
			grid: { display: false },
			border: { display: false },
			ticks: {
				color: chartTextColor.value,
				font: { size: 13 },
			},
		},
		y: {
			beginAtZero: true,
			border: { display: false },
			grid: {
				color: colorMode.value === "dark" ? "#ffffff14" : "#0000000d",
			},
			ticks: {
				color: chartTextColor.value,
				maxTicksLimit: 5,
				font: { size: 12 },
			},
		},
	},
}));

const donutChartOptions = computed<ChartOptions<"doughnut">>(() => ({
	responsive: true,
	maintainAspectRatio: false,
	cutout: "64%",
	plugins: {
		legend: {
			position: "bottom",
			labels: {
				color: chartTextColor.value,
				usePointStyle: true,
				boxWidth: 8,
				boxHeight: 8,
				padding: 16,
				font: { size: 12 },
			},
		},
	},
}));

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
	<section class="flex w-full min-w-0 max-w-4xl flex-col items-center gap-10 sm:gap-12">
		<div class="grid w-full min-w-0 grid-cols-1 gap-6 md:grid-cols-2">
			<figure class="min-w-0 rounded-2xl border border-muted p-4 sm:p-6">
				<figcaption class="mb-6 text-center text-base font-medium">
					{{ t("HomePage.charts.age-distribution.label") }}
				</figcaption>
				<div class="relative mx-auto h-64 w-full max-w-sm">
					<Bar
						class="w-full"
						:data="ageData"
						:options="barChartOptions"
						:aria-label="t('HomePage.charts.age-distribution.label')"
					/>
				</div>
			</figure>
			<figure class="min-w-0 rounded-2xl border border-muted p-4 sm:p-6">
				<figcaption class="mb-6 text-center text-base font-medium">
					{{ t("HomePage.charts.gender-distribution.label") }}
				</figcaption>
				<div class="relative mx-auto h-64 w-full max-w-xs">
					<Doughnut
						class="w-full"
						:data="genderData"
						:options="donutChartOptions"
						:aria-label="t('HomePage.charts.gender-distribution.label')"
					/>
				</div>
			</figure>
		</div>
		<ul class="flex w-full flex-wrap justify-center gap-x-4 gap-y-8 sm:gap-x-6 md:flex-nowrap">
			<li
				v-for="item in counts"
				:key="item.translation"
				class="flex min-w-0 basis-[calc((100%-1rem)/2)] flex-col items-center gap-3 text-center sm:basis-[calc((100%-3rem)/3)] md:flex-1 md:basis-0"
			>
				<div
					class="flex size-24 shrink-0 flex-col items-center justify-center gap-1.5 rounded-full bg-[#bb8588] text-white sm:size-28"
				>
					<UIcon
						:name="item.icon"
						mode="svg"
						class="size-8 sm:size-10 [&_*]:stroke-[1.5]"
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
				<p class="max-w-40 text-sm leading-snug break-words sm:text-base">
					{{ t(item.translation) }}
				</p>
			</li>
		</ul>
	</section>
</template>
