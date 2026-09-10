<script lang="ts" setup>
import { InfoIcon, RotateCcwIcon, SettingsIcon, SquareSplitHorizontalIcon } from "@lucide/vue";

import { useMapDataset } from "@/stores/use-dataset-store";

const props = withDefaults(
	defineProps<{
		mapId: string;
		splitMode?: boolean;
	}>(),
	{
		splitMode: false,
	},
);

const emit = defineEmits<{
	"toggle-compare-mode": [];
	"toggle-sidebar": [question: string | null, variant: string | undefined];
}>();

const t = useTranslations();
const { setDefaultColorsForQuestion, hasQuestion, getColorForGroup } = useColorStore();
const { byVariant, normaliseGroups, groupsForMap } = useVariantGroups();
const datasetStore = useDatasetStore();
const datasetId = useMapDataset(props.mapId);

const activeQuestion = defineModel<string>("question", { default: "Gießkanne" });
const { allQuestions, countAnswersForQuestion, filterDataByQuestionAndVariant } =
	useQuestions(datasetId);

const mappedQuestions = computed(() => {
	return allQuestions.value.map((q) => ({ label: q, value: q }));
});
const uniqueVariants = computed(() => {
	return countAnswersForQuestion(activeQuestion.value)
		.map((v) => ({
			anno: v.label,
			value: v.label,
			label: v.label,
			count: v.abs,
		}))
		.toSorted((a, b) => b.count - a.count);
});
const activeVariants = ref<Array<string>>([]);

const storedGroups = groupsForMap(props.mapId, () => activeQuestion.value);
const variantGroups = computed(() =>
	normaliseGroups(
		storedGroups.value,
		uniqueVariants.value.map((v) => v.value),
	),
);

const variantColors = computed(() =>
	byVariant(variantGroups.value, (group) =>
		getColorForGroup(datasetId.value, activeQuestion.value, group),
	),
);

function resetSelection() {
	activeVariants.value = [];
}

function resetColors() {
	setDefaultColorsForQuestion(
		datasetId.value,
		activeQuestion.value,
		uniqueVariants.value.map((v) => v.label),
	);
}

function ensureColors() {
	if (activeQuestion.value && !hasQuestion(datasetId.value, activeQuestion.value)) resetColors();
}

onMounted(ensureColors);

watch([activeQuestion, datasetId], () => {
	ensureColors();
	activeVariants.value = [];
});

const settingsOpen = ref(false);

const data = computed(() => {
	const variantsInUse = activeVariants.value.length
		? activeVariants.value
		: uniqueVariants.value.map((v) => v.value);
	return filterDataByQuestionAndVariant(activeQuestion.value, variantsInUse).map((entry) => ({
		coordinates: [Number(entry.Longitude), Number(entry.Latitude)] as [number, number],
		color:
			variantColors.value[entry.variants.filter((v) => variantsInUse.includes(v))[0] ?? ""] ?? "",
		name: entry.Ort,
		...entry,
	}));
});
</script>

<template>
	<div class="relative flex flex-col gap-5">
		<div class="min-w-0 rounded-lg border p-5">
			<DatasetSwitcher
				v-if="datasetStore.hasCustomDatasets"
				class="mb-5 border-b border-muted pb-5"
				:map-id="mapId"
			></DatasetSwitcher>
			<div class="flex max-w-full flex-wrap items-end gap-5">
				<div id="phenomenon" class="min-w-48 flex-1">
					<div class="mb-1 ml-1 flex gap-1 text-sm font-semibold text-muted-foreground">
						{{ t("MapsPage.selection.variable.title") }}
						<UTooltip :content="{ side: 'top' }" :text="t('MapsPage.selection.variable.tooltip')">
							<InfoIcon class="size-4"></InfoIcon>
						</UTooltip>
					</div>
					<ComboboxBase
						v-if="mappedQuestions?.length"
						v-model="activeQuestion"
						data-testid="questions"
						has-search
						:options="mappedQuestions"
						:placeholder="t('MapsPage.selection.variable.placeholder')"
						width="w-full"
					/>
				</div>
				<div id="variant" class="min-w-48 flex-1">
					<div class="mb-1 ml-1 flex gap-1 text-sm font-semibold text-muted-foreground">
						{{ t("MapsPage.selection.variants.title") }}
						<UTooltip :content="{ side: 'top' }" :text="t('MapsPage.selection.variants.tooltip')">
							<InfoIcon class="size-4"></InfoIcon>
						</UTooltip>
					</div>
					<MultiSelect
						v-model="activeVariants"
						data-testid="variants"
						:options="uniqueVariants"
						:placeholder="t('MapsPage.selection.variants.placeholder')"
						single-level
						width="w-full"
					/>
				</div>
				<div
					v-if="!splitMode"
					class="my-1 hidden self-stretch border-l border-muted md:block"
					role="separator"
				></div>
				<div class="flex gap-2" :class="splitMode ? 'w-full justify-end' : 'ml-auto'">
					<UButton
						v-if="!splitMode"
						class="hidden gap-2 md:inline-flex"
						variant="outline"
						@click="emit('toggle-compare-mode')"
					>
						<SquareSplitHorizontalIcon class="size-4"></SquareSplitHorizontalIcon>
						<span>{{ t("MapsPage.controls.compare") }}</span>
					</UButton>
					<UButton
						class="gap-2 p-2"
						variant="outline"
						@click="emit('toggle-sidebar', activeQuestion, activeVariants[0])"
					>
						<InfoIcon class="size-4"></InfoIcon>
						<span>{{ t("MapsPage.controls.open-sidebar") }}</span>
					</UButton>
					<UTooltip :content="{ side: 'top' }" :text="t('MapsPage.controls.reset')">
						<UButton
							id="reset"
							class="aspect-square"
							data-testid="reset"
							variant="outline"
							@click="resetSelection()"
						>
							<RotateCcwIcon class="size-4" />
							<span class="sr-only">{{ t("MapsPage.controls.reset") }}</span>
						</UButton>
					</UTooltip>
					<UTooltip :content="{ side: 'top' }" :text="t('MapsPage.controls.settings')">
						<UButton
							:aria-expanded="settingsOpen"
							class="aspect-square"
							data-testid="settings"
							:variant="settingsOpen ? 'soft' : 'outline'"
							@click="settingsOpen = !settingsOpen"
						>
							<SettingsIcon class="size-4" />
							<span class="sr-only">{{ t("MapsPage.controls.settings") }}</span>
						</UButton>
					</UTooltip>
				</div>
			</div>
			<USeparator v-if="settingsOpen" class="mt-6" />
			<UCollapsible v-model:open="settingsOpen">
				<template #content>
					<MapSettings
						:active-variants="activeVariants"
						class="mt-5"
						:dataset-id="datasetId"
						:groups="variantGroups"
						:question="activeQuestion"
						@reset-colors="resetColors()"
					/>
				</template>
			</UCollapsible>
		</div>
		<VisualisationContainer v-slot="{ height, width }" class="border h-[600px]" :fullscreen="false">
			<MapLegend
				v-if="uniqueVariants.length"
				id="variantLegend"
				:active-variants="activeVariants"
				class="absolute bottom-4 right-0 z-10 mr-4 max-h-[70%] overflow-y-auto"
				:dataset-id="datasetId"
				:groups="variantGroups"
				:question="activeQuestion"
			/>
			<div v-if="height && width" class="w-full h-full">
				<GeoMap :colors="variantColors" :data="data"> </GeoMap>
			</div>
		</VisualisationContainer>
	</div>
</template>
