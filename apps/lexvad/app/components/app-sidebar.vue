<script setup lang="ts">
import { X } from "@lucide/vue";

import type { VariantGroup } from "@/composables/use-variant-groups";
import { useMapDataset } from "@/stores/use-dataset-store";

const open = defineModel<boolean>("open", { default: false });

const t = useTranslations();
const props = withDefaults(
	defineProps<{
		activeQuestion: string;
		activeVariant: string;
		side?: "left" | "right";
		mapId: string;
	}>(),
	{
		side: "right",
	},
);
const datasetId = useMapDataset(props.mapId);
const {
	countAnswersForQuestion,
	countAnswersForGroups,
	filterDataByQuestionAndVariant,
	getNotationsForVariant,
	getRegionalCooccurrencesForVariant,
} = useQuestions(datasetId);
const { getColorForGroup } = useColorStore();
const { byGroup, groupDisplayLabel, normaliseGroups, groupsForMap } = useVariantGroups();
const storedGroups = groupsForMap(props.mapId, () => props.activeQuestion);

const distributionMode = ref<"region" | "bundesland">("region");

const variantCount = computed(() => {
	return countAnswersForQuestion(props.activeQuestion ?? "")
		.map((entry) => ({ ...entry, value: entry.rel }))
		.toSorted((a, b) => b.value - a.value);
});

const groups = computed({
	get() {
		return normaliseGroups(
			storedGroups.value,
			variantCount.value.map((v) => v.label),
		);
	},
	set(next: Array<VariantGroup>) {
		storedGroups.value = next;
	},
});

const answerCount = computed(() => filterDataByQuestionAndVariant(props.activeQuestion).length);

const groupCount = computed(() => {
	const counts = countAnswersForGroups(props.activeQuestion, groups.value);
	return groups.value
		.map((group) => {
			const abs = counts[group.id] ?? 0;
			return {
				id: group.id,
				label: groupDisplayLabel(group),
				abs,
				value: answerCount.value > 0 ? abs / answerCount.value : 0,
				secondary: `${t("MapsPage.sidebar.places", abs)}`,
			};
		})
		.toSorted((a, b) => b.value - a.value);
});

function groupIdForVariant(variant: string) {
	const group = groups.value.find((g) => g.variants.includes(variant));
	return group?.id ?? groupCount.value[0]?.id ?? "";
}

const selectedGroupId = ref(groupIdForVariant(props.activeVariant));

watch(
	() => [props.activeQuestion, props.activeVariant],
	() => {
		selectedGroupId.value = groupIdForVariant(props.activeVariant);
	},
);

watch(groups, () => {
	if (!groups.value.some((group) => group.id === selectedGroupId.value))
		selectedGroupId.value = groupIdForVariant(props.activeVariant);
});

const selectedGroup = computed(() => groups.value.find((g) => g.id === selectedGroupId.value));
const selectedVariants = computed(() => selectedGroup.value?.variants ?? []);
const selectedLabel = computed(() =>
	selectedGroup.value ? groupDisplayLabel(selectedGroup.value) : "",
);

const activeVariantCount = computed(
	() => groupCount.value.find((v) => v.id === selectedGroupId.value)?.abs ?? 0,
);
const notations = computed(() => [
	...new Set(getNotationsForVariant(props.activeQuestion, selectedVariants.value)),
]);

const cooccurrences = computed(() => {
	const regionalCooccurrences = getRegionalCooccurrencesForVariant(
		props.activeQuestion,
		selectedVariants.value,
		distributionMode.value,
		groups.value,
	);
	const total = Object.values(regionalCooccurrences).reduce((a, b) => a + b, 0);
	const labels = byGroup(groups.value, groupDisplayLabel);
	return Object.entries(regionalCooccurrences)
		.toSorted((a, b) => b[1] - a[1])
		.map(([id, count]) => ({
			id,
			label: labels[id] ?? id,
			value: count / total,
			secondary: `${t("MapsPage.sidebar.places", count)}`,
		}));
});

const colors = computed(() =>
	byGroup(groups.value, (group) => getColorForGroup(datasetId.value, props.activeQuestion, group)),
);

const tabItems = computed(() => [
	{ label: t("MapsPage.sidebar.variable"), value: "phenomenon", slot: "phenomenon" as const },
	{ label: t("MapsPage.sidebar.region"), value: "region", slot: "region" as const },
]);
</script>

<template>
	<USidebar
		collapsible="offcanvas"
		:open="open"
		:side="side"
		:ui="{
			header: 'pb-0 min-h-12 text-muted-foreground',
			body: 'p-0  mb-(--ui-header-height)',
			container: 'h-full top-(--ui-header-height) bg-background',
			root: ['[--sidebar-width:clamp(16rem,22vw,25rem)]'],
		}"
		variant="sidebar"
	>
		<template #header>
			<div class="flex flex-row items-center justify-between w-full">
				<span class="uppercase font-semibold text-xs">
					{{ t("MapsPage.sidebar.labels.data-insights") }}
				</span>
				<UButton
					class="size-6 p-1 m-1 text-muted-foreground"
					variant="ghost"
					@click="
						() => {
							open = false;
						}
					"
				>
					<X></X>
				</UButton>
			</div>
		</template>

		<UTabs
			class="w-full"
			default-value="phenomenon"
			:items="tabItems"
			:ui="{
				list: 'w-full border-b border-border',
				label: 'text-wrap',
				trigger: 'flex-1 uppercase text-xs font-semibold tracking-wide leading-tight py-3',
			}"
			variant="link"
		>
			<template #phenomenon>
				<div class="p-2 flex flex-col gap-4">
					<SelectedPhenomenonCard
						:badges="[t('SelectedPhenomenonCard.categories.noun')]"
						class="w-full"
						:phenomenon="activeQuestion"
					></SelectedPhenomenonCard>
					<VariantGroupingCard
						v-model:groups="groups"
						class="w-full"
						:colors="colors"
						:data="groupCount"
						:variants="variantCount"
					></VariantGroupingCard>
				</div>
			</template>
			<template #region>
				<div class="p-2 flex flex-col gap-4">
					<SelectedVariantCard
						class="w-full"
						:color="colors[selectedGroupId] ?? ''"
						:count="activeVariantCount"
						:notations="notations.length"
						:variant="selectedLabel"
					>
					</SelectedVariantCard>
					<VariantSelectionCard v-model="selectedGroupId" :colors="colors" :data="groupCount">
					</VariantSelectionCard>
					<VariantDistributionCard
						v-model:mode="distributionMode"
						:dataset-id="datasetId"
						:question="activeQuestion"
						:variants="selectedVariants"
					>
					</VariantDistributionCard>

					<VariantOverviewCard
						class="w-full"
						:colors="colors"
						:data="cooccurrences"
						:subtitle="t(`VariantOverviewCard.cooccurrences-subtitle-${distributionMode}`)"
						:title="t('VariantOverviewCard.regional-cooccurrences')"
					></VariantOverviewCard>
					<RegionDistributionCard
						v-model:mode="distributionMode"
						:colors="colors"
						:dataset-id="datasetId"
						:groups="groups"
						:question="activeQuestion"
					>
					</RegionDistributionCard>
				</div>
			</template>
		</UTabs>
	</USidebar>
</template>
