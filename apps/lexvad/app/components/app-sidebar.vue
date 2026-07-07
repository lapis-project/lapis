<script setup lang="ts">
import { X } from "@lucide/vue";

import { useSidebar } from "../../../shadcn/app/components/ui/sidebar";

const { toggleSidebar } = useSidebar();
const t = useTranslations();
const {
	countAnswersForQuestion,
	getValuesForQuestion,
	getNotationsForVariant,
	getRegionsForVariant,
	getRegionalCooccurrencesForVariant,
	getVariantsForRegion,
	allRegions,
} = useQuestions();

const props = defineProps<{
	activeQuestion: string;
	activeVariant: string;
}>();
const selectedVariant = toRef(props.activeVariant);

const variantCount = computed(() => {
	return countAnswersForQuestion(props.activeQuestion ?? "")
		.map((entry) => ({ ...entry, value: entry.rel }))
		.sort((a, b) => b.value - a.value);
});

const answerCount = computed(() => getValuesForQuestion(props.activeQuestion).length);

const activeVariantCount = computed(
	() => variantCount.value.find((v) => v.label === selectedVariant.value)?.abs ?? 0,
);
const notations = computed(() => [
	...new Set(getNotationsForVariant(props.activeQuestion, selectedVariant.value)),
]);

const regionsForVariant = computed(() => {
	return Object.entries(getRegionsForVariant(props.activeQuestion, selectedVariant.value))
		.sort((a, b) => b[1] - a[1])
		.map((entry) => ({
			label: entry[0],
			value: entry[1],
		}));
});

const regions = computed(() => {
	return allRegions.map((entry) => ({
		label: entry,
		entries: Object.entries(getVariantsForRegion(props.activeQuestion, entry)).map((e) => ({
			label: e[0],
			value: e[1],
		})),
	}));
});

const cooccurrences = computed(() => {
	const regionalCooccurrences = getRegionalCooccurrencesForVariant(
		props.activeQuestion,
		selectedVariant.value,
	);
	const total = Object.values(regionalCooccurrences).reduce((a, b) => a + b, 0);
	return Object.entries(regionalCooccurrences)
		.sort((a, b) => b[1] - a[1])
		.map((entry) => ({
			label: entry[0],
			value: entry[1] / total,
			secondary: `${t("MapsPage.sidebar.places", entry[1])}`,
		}));
});
</script>

<template>
	<Sidebar
		class="top-14 h-[calc(100svh-3.5rem)] sm:top-16 sm:h-[calc(100svh-4rem)] shadow-lg bg-background border-t border-border"
		side="right"
		variant="inset"
	>
		<SidebarHeader class="pb-0">
			<SidebarGroup class="border-b border-border flex-row justify-between">
				<SidebarGroupLabel class="uppercase font-semibold"
					>{{ t("MapsPage.sidebar.labels.data-insights") }}
				</SidebarGroupLabel>
				<Button class="size-6 p-1 m-1 text-muted-foreground" variant="ghost" @click="toggleSidebar">
					<X></X>
				</Button>
			</SidebarGroup>
		</SidebarHeader>
		<SidebarContent>
			<SidebarGroup>
				<SidebarGroupContent>
					<Tabs default-value="phenomenon">
						<TabsList
							class="w-full h-auto items-stretch justify-start gap-0 rounded-none border-b border-border bg-transparent p-0"
						>
							<TabsTrigger
								class="h-auto flex-1 items-center whitespace-normal rounded-none border-0 border-b-2 border-transparent bg-transparent px-1 py-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground leading-tight shadow-none data-[state=active]:border-foreground data-[state=active]:bg-transparent data-[state=active]:text-foreground data-[state=active]:shadow-none dark:data-[state=active]:border-foreground dark:data-[state=active]:bg-transparent"
								value="phenomenon"
							>
								{{ t("MapsPage.sidebar.variable") }}
							</TabsTrigger>
							<TabsTrigger
								class="h-auto flex-1 items-center whitespace-normal rounded-none border-0 border-b-2 border-transparent bg-transparent px-1 py-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground leading-tight shadow-none data-[state=active]:border-foreground data-[state=active]:bg-transparent data-[state=active]:text-foreground data-[state=active]:shadow-none dark:data-[state=active]:border-foreground dark:data-[state=active]:bg-transparent"
								value="variant"
							>
								{{ t("MapsPage.sidebar.variant") }}
							</TabsTrigger>
							<TabsTrigger
								class="h-auto flex-1 items-center whitespace-normal rounded-none border-0 border-b-2 border-transparent bg-transparent px-1 py-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground leading-tight shadow-none data-[state=active]:border-foreground data-[state=active]:bg-transparent data-[state=active]:text-foreground data-[state=active]:shadow-none dark:data-[state=active]:border-foreground dark:data-[state=active]:bg-transparent"
								value="region"
							>
								{{ t("MapsPage.sidebar.region") }}
							</TabsTrigger>
						</TabsList>
						<TabsContent class="p-2 flex flex-col gap-4" value="phenomenon">
							<SelectedPhenomenonCard
								class="w-full"
								:count="answerCount"
								:phenomenon="activeQuestion"
								:variants="variantCount.length"
							></SelectedPhenomenonCard>
							<VariantOverviewCard class="w-full" :data="variantCount"></VariantOverviewCard>
							<CategoryCard class="w-full"></CategoryCard>
						</TabsContent>
						<TabsContent class="p-2 flex flex-col gap-4" value="variant">
							<SelectedVariantCard
								class="w-full"
								:count="activeVariantCount"
								:notations="notations.length"
								:variant="selectedVariant"
							></SelectedVariantCard>
							<VariantSelectionCard v-model="selectedVariant" :data="variantCount">
							</VariantSelectionCard>
							<VariantDistributionCard :data="regionsForVariant"></VariantDistributionCard>

							<VariantOverviewCard
								class="w-full"
								:data="cooccurrences"
								:subtitle="t('VariantOverviewCard.cooccurrences-subtitle')"
								:title="t('VariantOverviewCard.regional-cooccurrences')"
							></VariantOverviewCard>
						</TabsContent>
						<TabsContent class="p-2 flex flex-col gap-4" value="region">
							<SelectedPhenomenonCard
								class="w-full"
								:count="answerCount"
								:phenomenon="activeQuestion"
								:variants="variantCount.length"
							></SelectedPhenomenonCard>
							<RegionDistributionCard :data="regions"></RegionDistributionCard>
							<CategoryCard class="w-full"></CategoryCard>
						</TabsContent>
					</Tabs>
				</SidebarGroupContent>
			</SidebarGroup>
		</SidebarContent>
		<SidebarFooter />
		<SidebarRail />
	</Sidebar>
</template>
