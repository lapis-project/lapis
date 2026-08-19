<script setup lang="ts">
import { X } from "@lucide/vue";

const open = defineModel<boolean>("open", { default: false });

const t = useTranslations();
const { countAnswersForQuestion, getNotationsForVariant, getRegionalCooccurrencesForVariant } =
	useQuestions();
const { getColorsForQuestion } = useColorStore();

const props = withDefaults(
	defineProps<{
		activeQuestion: string;
		activeVariant: string;
		side?: "left" | "right";
	}>(),
	{
		side: "right",
	},
);
const selectedVariant = ref(props.activeVariant);

watch(
	() => props.activeVariant,
	(variant) => {
		selectedVariant.value = variant;
	},
);
const distributionMode = ref<"region" | "bundesland">("region");

const variantCount = computed(() => {
	return countAnswersForQuestion(props.activeQuestion ?? "")
		.map((entry) => ({ ...entry, value: entry.rel }))
		.toSorted((a, b) => b.value - a.value);
});

const activeVariantCount = computed(
	() => variantCount.value.find((v) => v.label === selectedVariant.value)?.abs ?? 0,
);
const notations = computed(() => [
	...new Set(getNotationsForVariant(props.activeQuestion, selectedVariant.value)),
]);

const cooccurrences = computed(() => {
	const regionalCooccurrences = getRegionalCooccurrencesForVariant(
		props.activeQuestion,
		selectedVariant.value,
		distributionMode.value,
	);
	const total = Object.values(regionalCooccurrences).reduce((a, b) => a + b, 0);
	return Object.entries(regionalCooccurrences)
		.toSorted((a, b) => b[1] - a[1])
		.map((entry) => ({
			label: entry[0],
			value: entry[1] / total,
			secondary: `${t("MapsPage.sidebar.places", entry[1])}`,
		}));
});

const colors = computed(() => {
	return getColorsForQuestion(props.activeQuestion) ?? {};
});

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
					>
					</SelectedPhenomenonCard>
					<VariantOverviewCard class="w-full" :colors="colors" :data="variantCount">
					</VariantOverviewCard>
				</div>
			</template>
			<template #region>
				<div class="p-2 flex flex-col gap-4">
					<SelectedVariantCard
						class="w-full"
						:color="colors[selectedVariant] ?? ''"
						:count="activeVariantCount"
						:notations="notations.length"
						:variant="selectedVariant"
					>
					</SelectedVariantCard>
					<VariantSelectionCard v-model="selectedVariant" :colors="colors" :data="variantCount">
					</VariantSelectionCard>
					<VariantDistributionCard
						v-model:mode="distributionMode"
						:question="activeQuestion"
						:variant="selectedVariant"
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
						:question="activeQuestion"
					>
					</RegionDistributionCard>
				</div>
			</template>
		</UTabs>
	</USidebar>
</template>
