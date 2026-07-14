<script lang="ts" setup>
import {
	CirclePileIcon,
	InfoIcon,
	LayersIcon,
	RotateCcwIcon,
	SquareSplitHorizontalIcon,
} from "@lucide/vue";

const _props = withDefaults(
	defineProps<{
		splitMode?: boolean;
	}>(),
	{
		splitMode: false,
	},
);

const emit = defineEmits(["toggle-compare-mode", "toggle-sidebar"]);

const t = useTranslations();

const { setDefaultColorsForQuestion, hasQuestion, getColorForVariant } = useColorStore();

const activeQuestion = ref<string | null>("Gießkanne");
const { allQuestions, countAnswersForQuestion, filterDataByQuestionAndVariant } = useQuestions();

const mappedQuestions = computed(() => {
	return allQuestions.map((q) => ({ label: q, value: q }));
});
const uniqueVariants = computed(() => {
	return countAnswersForQuestion(activeQuestion.value ?? "")
		.map((v) => ({
			anno: v.label,
			value: v.label,
			label: v.label,
			count: v.abs,
		}))
		.sort((a, b) => b.count - a.count);
});
const activeVariants = ref<Array<string>>([]);

function resetSelection() {
	activeVariants.value = [];
	activeQuestion.value = null;
}

onMounted(() => {
	if (activeQuestion.value && !hasQuestion(activeQuestion.value))
		setDefaultColorsForQuestion(
			activeQuestion.value,
			uniqueVariants.value.map((v) => v.label),
		);
});

watch(activeQuestion, () => {
	if (activeQuestion.value && !hasQuestion(activeQuestion.value))
		setDefaultColorsForQuestion(
			activeQuestion.value,
			uniqueVariants.value.map((v) => v.label),
		);
});

const mapMode = ref("point");

const data = computed(() =>
	filterDataByQuestionAndVariant(activeQuestion.value ?? "").map((entry) => ({
		coordinates: [Number(entry.Longitude), Number(entry.Latitude)] as [number, number],
		color: getColorForVariant(activeQuestion.value ?? "", entry.variants[0] ?? "") ?? "",
		name: entry.Ort,
	})),
);
</script>

<template>
	<div class="relative flex flex-col gap-5">
		<div class="flex gap-2">
			<div class="grow rounded-lg border p-5 max-w-full">
				<div class="flex gap-5 pb-5 border-b border-muted max-w-full flex-wrap">
					<div id="phenomenon" class="w-full flex-1">
						<div class="mb-1 ml-1 flex gap-1 text-sm font-semibold">
							{{ t("MapsPage.selection.variable.title") }}
							<InfoTooltip :content="t('MapsPage.selection.variable.tooltip')">
								<InfoIcon class="size-4"></InfoIcon>
							</InfoTooltip>
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
					<div id="variant" class="w-full flex-1">
						<div class="mb-1 ml-1 flex gap-1 text-sm font-semibold">
							{{ t("MapsPage.selection.variants.title") }}
							<InfoTooltip :content="t('MapsPage.selection.variants.tooltip')">
								<InfoIcon class="size-4"></InfoIcon>
							</InfoTooltip>
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
					<template v-if="!splitMode">
						<div class="divide-muted border-l my-1"></div>
						<div class="gap-2 flex ml-auto self-end">
							<Button class="gap-2" variant="outline" @click="emit('toggle-compare-mode')">
								<SquareSplitHorizontalIcon class="size-4"></SquareSplitHorizontalIcon>
								<span>{{ t("MapsPage.controls.compare") }}</span>
							</Button>
							<Button
								class="p-2 gap-2"
								variant="outline"
								@click="emit('toggle-sidebar', activeQuestion, activeVariants[0])"
							>
								<InfoIcon class="size-4"></InfoIcon>
								<span>{{ t("MapsPage.controls.open-sidebar") }}</span>
							</Button>
							<Button
								id="reset"
								data-testid="reset"
								size="icon"
								variant="outline"
								@click="resetSelection()"
							>
								<RotateCcwIcon class="size-4" />
							</Button>
						</div>
					</template>
				</div>
				<div class="mt-5 flex justify-between">
					<ToggleGroup
						v-model="mapMode"
						class="gap-0 p-1 bg-card w-fit rounded-lg"
						type="single"
						variant="outline"
					>
						<ToggleGroupItem
							class="whitespace-nowrap rounded-r-none py-2 h-full transition-text data-[state=on]:bg-background border-none data-[state=off]:text-muted-foreground data-[state=on]:text-primary w-full px-4"
							value="point"
						>
							<CirclePileIcon class="size-4"></CirclePileIcon>
							<span>{{ t("MapsPage.controls.point-map") }}</span>
						</ToggleGroupItem>
						<ToggleGroupItem
							class="whitespace-nowrap rounded-l-none py-2 h-full transition-text data-[state=on]:bg-background border-none data-[state=off]:text-muted-foreground data-[state=on]:text-primary w-full px-4"
							value="area"
						>
							<LayersIcon class="size-4"></LayersIcon>
							<span>{{ t("MapsPage.controls.area-map") }}</span>
						</ToggleGroupItem>
					</ToggleGroup>
					<template v-if="splitMode">
						<div class="gap-2 flex ml-auto self-center">
							<Button
								class="p-2 gap-2"
								variant="outline"
								@click="emit('toggle-sidebar', activeQuestion, activeVariants[0])"
							>
								<InfoIcon class="size-4"></InfoIcon>
								<span>{{ t("MapsPage.controls.open-sidebar") }}</span>
							</Button>
							<Button
								id="reset"
								data-testid="reset"
								size="icon"
								variant="outline"
								@click="resetSelection()"
							>
								<RotateCcwIcon class="size-4" />
							</Button>
						</div>
					</template>
				</div>
			</div>
		</div>
		<VisualisationContainer v-slot="{ height, width }" class="border h-[600px]" :fullscreen="false">
			<div
				v-if="uniqueVariants.length"
				id="variantLegend"
				class="absolute bottom-4 right-0 z-10 mr-4"
				data-testid="variantLegend"
			>
				<div
					class="rounded-md text-xs border border-input bg-background p-3 text-sm text-foreground shadow-md"
				>
					<ul class="space-y-0.5">
						<li
							v-for="variant in uniqueVariants"
							:key="variant.anno"
							class="flex items-center gap-4 justify-between"
						>
							<div class="flex gap-2">
								<div
									class="size-2 rounded-full self-center"
									:style="{
										backgroundColor: getColorForVariant(activeQuestion ?? '', variant.anno),
									}"
								></div>
								<span>{{ variant.anno }}</span>
							</div>
							<span class="text-muted-foreground">{{ variant.count }}</span>
						</li>
					</ul>
				</div>
			</div>
			<div v-if="height && width" class="w-full h-full">
				<GeoMap :data="data"></GeoMap>
			</div>
		</VisualisationContainer>
	</div>
</template>
