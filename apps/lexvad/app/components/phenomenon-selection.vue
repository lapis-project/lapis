<script setup lang="ts">
import { InfoIcon, RotateCcwIcon, SettingsIcon, SquareSplitHorizontalIcon } from "@lucide/vue";
import type { LocationQueryRaw } from "vue-router";
const props = withDefaults(
	defineProps<{
		mapId: string;
		splitMode?: boolean;
		embedQuery?: LocationQueryRaw;
	}>(),
	{
		splitMode: false,
	},
);
const t = useTranslations();
const datasetStore = useDatasetStore();
const emit = defineEmits<{
	"toggle-compare-mode": [];
	"toggle-sidebar": [question: string | null, variant: string | undefined];
	"match-colors": [];
}>();
const datasetId = useMapDataset(props.mapId);
const activeQuestion = defineModel<string>("question", { default: "Gießkanne" });
const activeVariants = defineModel<Array<string>>("variants", { default: () => [] });

const { allQuestions, resetColors, uniqueVariants, variantGroups } = useMapData(
	props.mapId,
	datasetId,
	activeQuestion,
	activeVariants,
);

const mappedQuestions = computed(() => {
	return allQuestions.value.map((q) => ({ label: q, value: q }));
});

function resetSelection() {
	activeVariants.value = [];
}

const settingsOpen = ref(false);
</script>
<template>
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
				<USelectMenu
					v-if="mappedQuestions?.length"
					v-model="activeQuestion"
					class="w-full"
					data-testid="questions"
					:items="mappedQuestions"
					:placeholder="
						t('Combobox.button', { placeholder: t('MapsPage.selection.variable.placeholder') })
					"
					:search-input="{
						placeholder: t('Combobox.search', {
							placeholder: t('MapsPage.selection.variable.placeholder'),
						}),
					}"
					value-key="value"
					variant="outline"
				>
					<template #empty>
						{{ t("Combobox.empty", { placeholder: t("MapsPage.selection.variable.placeholder") }) }}
					</template>
				</USelectMenu>
			</div>
			<div id="variant" class="min-w-48 flex-1">
				<div class="mb-1 ml-1 flex gap-1 text-sm font-semibold text-muted-foreground">
					{{ t("MapsPage.selection.variants.title") }}
					<UTooltip :content="{ side: 'top' }" :text="t('MapsPage.selection.variants.tooltip')">
						<InfoIcon class="size-4"></InfoIcon>
					</UTooltip>
				</div>
				<USelectMenu
					v-model="activeVariants"
					class="w-full"
					data-testid="variants"
					:items="uniqueVariants"
					multiple
					:placeholder="
						t('Combobox.button', { placeholder: t('MapsPage.selection.variants.placeholder') })
					"
					:search-input="false"
					value-key="value"
					variant="outline"
					clear
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
				<EmbedDialog v-if="embedQuery" :query="embedQuery" :question="activeQuestion" />
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
					:can-match-colors="splitMode"
					class="mt-5"
					:dataset-id="datasetId"
					:groups="variantGroups"
					:question="activeQuestion"
					@match-colors="emit('match-colors')"
					@reset-colors="resetColors()"
				/>
			</template>
		</UCollapsible>
	</div>
</template>
