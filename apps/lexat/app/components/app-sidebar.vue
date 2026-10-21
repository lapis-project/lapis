<script setup lang="ts">
import { useElementBounding } from "@vueuse/core";
import type { Feature, MultiPolygon, Polygon } from "geojson";

import statesJson from "@/assets/data/bundeslaender.json";
import regionsJson from "@/assets/data/dialektregionen-lexat21-optimized.geojson.json";
import type { SurveyResponse } from "@/types/feature-collection";
import {
	countGroups,
	countRegions,
	type DistributionMode,
	locatePoint,
	regionalCooccurrences,
	regionalDistributions,
	surveyAnswers,
} from "@/utils/map-insights";
import { groupDisplayLabel, type VariantGroup } from "@/utils/variant-groups";

const props = defineProps<{
	activeQuestion: string;
	activeVariants: Array<string>;
	points: Array<SurveyResponse>;
	colors: Record<string, string>;
}>();
const open = defineModel<boolean>("open", { default: false });
const groups = defineModel<Array<VariantGroup>>("groups", { required: true });
const t = useTranslations();
const appHeader = shallowRef<HTMLElement | null>(null);
const { bottom: headerBottom } = useElementBounding(appHeader);
onMounted(() => {
	appHeader.value = document.querySelector("header");
});

const regions = regionsJson.features as Array<Feature<Polygon | MultiPolygon>>;
const states = statesJson.features as Array<Feature<Polygon | MultiPolygon>>;
const locationCache = new Map<string, Partial<Record<DistributionMode, string>>>();
const answers = computed(() =>
	surveyAnswers(props.points, (point) => {
		const key = `${point.lon},${point.lat}`;
		let location = locationCache.get(key);
		if (!location) {
			location = {
				region: locatePoint([point.lon, point.lat], regions, "Dialektregion_Name"),
				bundesland: locatePoint([point.lon, point.lat], states, "name"),
			};
			locationCache.set(key, location);
		}
		return location;
	}),
);

const groupColors = computed(() =>
	Object.fromEntries(
		groups.value.map((group) => [group.id, props.colors[group.variants[0] ?? ""] ?? "#777777"]),
	),
);

function overview(counts: Record<string, number>, total: number) {
	return groups.value
		.map((group) => {
			const abs = counts[group.id] ?? 0;
			return {
				id: group.id,
				label: groupDisplayLabel(group),
				abs,
				value: total > 0 ? abs / total : 0,
				secondary: t("MapsPage.sidebar.answers", abs),
			};
		})
		.toSorted((a, b) => b.value - a.value);
}

const groupCount = computed(() =>
	overview(countGroups(answers.value, groups.value), answers.value.length),
);
const variantCount = computed(() => {
	const counts = new Map<string, number>();
	for (const answer of answers.value)
		counts.set(answer.annotation, (counts.get(answer.annotation) ?? 0) + 1);
	return [...counts].map(([label, abs]) => ({ label, abs }));
});

const selectedGroupId = ref("");
watch(
	[() => props.activeQuestion, () => props.activeVariants, groupCount],
	([, variants]) => {
		const selected = groups.value.find((group) => group.id === selectedGroupId.value);
		if (selected && groupCount.value.some((entry) => entry.id === selected.id && entry.abs > 0))
			return;
		selectedGroupId.value =
			groups.value.find((group) => variants.some((variant) => group.variants.includes(variant)))
				?.id ??
			groupCount.value.find((entry) => entry.abs > 0)?.id ??
			"";
	},
	{ immediate: true },
);

const selectedGroup = computed(() =>
	groups.value.find((group) => group.id === selectedGroupId.value),
);
const selectedVariants = computed(() => selectedGroup.value?.variants ?? []);
const selectedCount = computed(
	() => groupCount.value.find((entry) => entry.id === selectedGroupId.value)?.abs ?? 0,
);
const notations = computed(
	() =>
		new Set(
			answers.value
				.filter((answer) => selectedVariants.value.includes(answer.annotation))
				.map((answer) => answer.response.trim())
				.filter(Boolean),
		).size,
);

const distributionMode = ref<DistributionMode>("region");
const modeItems = computed(() => [
	{ label: t("VariantDistributionCard.dialectal-region"), value: "region" },
	{ label: t("VariantDistributionCard.state"), value: "bundesland" },
]);
const distribution = computed(() => {
	const counts = countRegions(answers.value, selectedVariants.value, distributionMode.value);
	const total = Object.values(counts).reduce((sum, count) => sum + count, 0);
	return Object.entries(counts)
		.map(([label, count]) => ({
			id: label,
			label,
			value: total > 0 ? count / total : 0,
			secondary: t("MapsPage.sidebar.answers", count),
		}))
		.toSorted((a, b) => b.value - a.value);
});
const heatMapData = computed(() =>
	Object.fromEntries(distribution.value.map((entry) => [entry.label, entry.value])),
);
const cooccurrences = computed(() => {
	const counts = regionalCooccurrences(
		answers.value,
		selectedVariants.value,
		distributionMode.value,
		groups.value,
	);
	const total = Object.values(counts).reduce((sum, count) => sum + count, 0);
	return overview(counts, total).filter((entry) => entry.abs > 0);
});
const regionalRows = computed(() =>
	regionalDistributions(answers.value, distributionMode.value, groups.value),
);

const tabItems = computed(() => [
	{ label: t("MapsPage.sidebar.variable"), value: "phenomenon", slot: "phenomenon" as const },
	{ label: t("MapsPage.sidebar.region"), value: "region", slot: "region" as const },
]);
</script>

<template>
	<USidebar
		v-model:open="open"
		collapsible="offcanvas"
		side="right"
		:title="t('MapsPage.sidebar.labels.data-insights')"
		:style="{ '--map-sidebar-top': `${headerBottom || 63}px` }"
		:menu="{ description: t('MapsPage.sidebar.variable'), ui: { body: 'overflow-y-auto' } }"
		:ui="{
			header: 'pb-0 min-h-12 text-muted',
			body: 'p-0',
			container: 'top-(--map-sidebar-top) h-[calc(100dvh-var(--map-sidebar-top))] bg-default z-30',
			root: 'shrink-0 [--sidebar-width:clamp(16rem,22vw,25rem)]',
		}"
	>
		<template #header="{ close }">
			<div class="flex w-full items-center justify-between">
				<span class="uppercase font-semibold text-xs">{{
					t("MapsPage.sidebar.labels.data-insights")
				}}</span>
				<UButton
					icon="i-lucide-x"
					variant="ghost"
					color="neutral"
					:aria-label="t('MapsPage.controls.close-sidebar')"
					@click="close"
				/>
			</div>
		</template>
		<p v-if="!answers.length" class="p-4 text-sm text-muted">{{ t("MapsPage.sidebar.empty") }}</p>
		<UTabs
			v-else
			class="w-full"
			default-value="phenomenon"
			:items="tabItems"
			variant="link"
			:ui="{
				list: 'w-full border-b border-default',
				label: 'text-wrap',
				trigger: 'flex-1 uppercase text-xs font-semibold tracking-wide leading-tight py-3',
			}"
		>
			<template #phenomenon>
				<div class="p-2 flex flex-col gap-4">
					<div class="rounded-lg p-3.5 border border-default">
						<div class="uppercase font-semibold text-muted text-xs">
							{{ t("SelectedPhenomenonCard.title") }}
						</div>
						<div class="uppercase font-bold text-lg mt-1">{{ activeQuestion }}</div>
					</div>
					<VariantGroupingCard
						v-model:groups="groups"
						:colors="groupColors"
						:data="groupCount"
						:variants="variantCount"
					/>
				</div>
			</template>
			<template #region>
				<div class="p-2 flex flex-col gap-4">
					<SelectedVariantCard
						:variant="selectedGroup ? groupDisplayLabel(selectedGroup) : ''"
						:color="groupColors[selectedGroupId] ?? '#777777'"
						:count="selectedCount"
						:notations="notations"
					/>
					<VariantSelectionCard
						v-model="selectedGroupId"
						:colors="groupColors"
						:data="groupCount.filter((entry) => entry.abs > 0)"
					/>
					<div class="rounded-lg p-3.5 border border-default">
						<div class="uppercase font-semibold text-muted text-xs mb-2.5 flex items-center gap-1">
							{{ t("VariantDistributionCard.title") }}
							<USelect
								v-model="distributionMode"
								:items="modeItems"
								size="sm"
								:aria-label="t('VariantDistributionCard.title')"
							/>
						</div>
						<SimpleHeatMap
							class="w-full h-52"
							:features="distributionMode === 'region' ? regions : states"
							:name-key="distributionMode === 'region' ? 'Dialektregion_Name' : 'name'"
							:data="heatMapData"
							:color="groupColors[selectedGroupId] ?? '#777777'"
						/>
						<VariantBar
							v-for="entry in distribution"
							:key="entry.id"
							:secondary="entry.secondary"
							:value="entry.value"
						>
							<template #label
								><span>{{ entry.label }}</span></template
							>
						</VariantBar>
					</div>
					<VariantOverviewCard
						:colors="groupColors"
						:data="cooccurrences"
						:title="t('VariantOverviewCard.regional-cooccurrences')"
						:subtitle="t(`VariantOverviewCard.cooccurrences-subtitle-${distributionMode}`)"
					/>
					<div class="rounded-lg p-3.5 border border-default">
						<div class="uppercase font-semibold text-muted text-xs mb-2.5">
							{{ t("RegionDistributionCard.title") }}
						</div>
						<div class="flex flex-wrap gap-x-3 gap-y-1 mb-3 text-xs">
							<div
								v-for="entry in groupCount.filter((entry) => entry.abs > 0)"
								:key="entry.id"
								class="flex items-center gap-1.5"
							>
								<span
									class="rounded-sm size-3 shrink-0"
									:style="{ backgroundColor: groupColors[entry.id] }"
								></span
								>{{ entry.label }}
							</div>
						</div>
						<div v-for="row in regionalRows" :key="row.label" class="mb-2.5 text-xs">
							<div class="flex justify-between mb-1">
								<span>{{ row.label }}</span
								><span>{{ t("MapsPage.sidebar.answers", row.total) }}</span>
							</div>
							<div class="flex h-4 rounded overflow-hidden w-full">
								<div
									v-for="entry in groupCount.filter((entry) => (row.counts[entry.id] ?? 0) > 0)"
									:key="entry.id"
									tabindex="0"
									class="h-full text-center text-white text-[10px] content-center text-nowrap overflow-hidden px-1 hover:min-w-fit focus:min-w-fit"
									:style="{
										width: `${((row.counts[entry.id] ?? 0) / row.total) * 100}%`,
										backgroundColor: groupColors[entry.id],
									}"
									:title="`${entry.label}: ${row.counts[entry.id]}`"
								>
									{{ (((row.counts[entry.id] ?? 0) / row.total) * 100).toFixed(0) }}% ({{
										row.counts[entry.id]
									}})
								</div>
							</div>
						</div>
					</div>
				</div>
			</template>
		</UTabs>
	</USidebar>
</template>
