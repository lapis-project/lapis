<script setup lang="ts">
import { CheckIcon, PaletteIcon, RotateCcwIcon } from "@lucide/vue";

import type { VariantGroup } from "@/composables/use-variant-groups";
import { type ColorPaletteId, colorPalettes } from "@/stores/use-color-store";

const props = defineProps<{
	datasetId: string;
	question: string;
	activeVariants: Array<string>;
	groups: Array<VariantGroup>;
}>();

const emit = defineEmits<{
	"reset-colors": [];
}>();

const t = useTranslations();
const { countAnswersForGroups } = useQuestions(() => props.datasetId);
const colorStore = useColorStore();
const { getColorForGroup, setColorForVariant } = colorStore;
const { groupDisplayLabel } = useVariantGroups();

const paletteItems = colorPalettes.map((palette) => ({
	label: palette.name,
	value: palette.id,
	colors: palette.colors,
}));

const activePalette = computed({
	get: () => colorStore.activePaletteId,
	set: (id: ColorPaletteId) => {
		colorStore.setPalette(id);
	},
});

const countByGroup = computed(() => countAnswersForGroups(props.question, props.groups));

function groupCount(group: VariantGroup) {
	return countByGroup.value[group.id] ?? 0;
}

function isVisible(variant: string) {
	return props.activeVariants.length === 0 || props.activeVariants.includes(variant);
}

const shownGroups = computed(() =>
	props.groups
		.filter((group) => group.variants.some(isVisible))
		.toSorted((a, b) => groupCount(b) - groupCount(a)),
);

function updateColor(group: VariantGroup, newColor: string) {
	setColorForVariant(props.datasetId, props.question, group.variants[0]!, newColor);
}
</script>

<template>
	<section class="@container p-1" data-testid="mapSettings">
		<div class="mb-3 flex items-start justify-between gap-3">
			<div class="flex flex-wrap items-baseline gap-x-3 gap-y-0.5">
				<h3 class="text-sm font-semibold text-muted-foreground">
					{{ t("MapsPage.settings.colors.title") }}
				</h3>
			</div>
			<div class="flex flex-wrap items-center justify-end gap-2">
				<USelect
					v-model="activePalette"
					:aria-label="t('MapsPage.settings.colors.palette')"
					class="w-44"
					data-testid="palette"
					:items="paletteItems"
					size="xs"
					:ui="{ itemLabel: 'flex w-full items-center gap-2', itemTrailing: 'hidden' }"
					variant="outline"
				>
					<template #leading>
						<PaletteIcon class="size-3.5 text-muted-foreground" />
					</template>
					<template #item-label="{ item }">
						<span class="truncate">{{ item.label }}</span>
						<CheckIcon v-if="item.value === activePalette" class="ms-auto size-4 shrink-0" />
					</template>
					<template #item-description="{ item }">
						<span
							class="mt-1 flex items-center gap-1.5"
							:title="t('MapsPage.settings.colors.count', item.colors.length)"
						>
							<span class="flex h-1.5 flex-1 overflow-hidden rounded-full">
								<span
									v-for="color in item.colors"
									:key="color"
									class="flex-1"
									:style="{ backgroundColor: color }"
								></span>
							</span>
							<!-- A fixed width keeps every preview the same length -->
							<span class="w-5 shrink-0 text-right tabular-nums text-muted-foreground">
								{{ item.colors.length }}
							</span>
						</span>
					</template>
				</USelect>
				<UButton
					class="-my-1 shrink-0 gap-1.5"
					color="neutral"
					size="xs"
					:title="t('MapsPage.settings.colors.reset')"
					variant="ghost"
					@click="emit('reset-colors')"
				>
					<RotateCcwIcon class="size-3.5" />
					<span class="sr-only @sm:not-sr-only">{{ t("MapsPage.settings.colors.reset") }}</span>
				</UButton>
			</div>
		</div>

		<ul class="grid grid-cols-[repeat(auto-fill,minmax(14rem,1fr))] gap-x-6 gap-y-1.5">
			<li v-for="group in shownGroups" :key="group.id" class="flex items-center gap-2 text-xs">
				<ColorPicker
					:color="getColorForGroup(datasetId, question, group)"
					:label="groupDisplayLabel(group)"
					@update="(newColor: string) => updateColor(group, newColor)"
				></ColorPicker>
				<span class="truncate">{{ groupDisplayLabel(group) }}</span>
			</li>
		</ul>
	</section>
</template>
