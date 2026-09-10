<script setup lang="ts">
import { RotateCcwIcon } from "@lucide/vue";

import type { VariantGroup } from "@/composables/use-variant-groups";

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
const { getColorForGroup, setColorForVariant } = useColorStore();
const { groupDisplayLabel } = useVariantGroups();

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
			<UButton
				class="-my-1 shrink-0 gap-1.5"
				color="neutral"
				size="xs"
				variant="ghost"
				@click="emit('reset-colors')"
			>
				<RotateCcwIcon class="size-3.5" />
				{{ t("MapsPage.settings.colors.reset") }}
			</UButton>
		</div>

		<ul class="grid grid-cols-[repeat(auto-fill,minmax(14rem,1fr))] gap-x-6 gap-y-1.5">
			<li v-for="group in shownGroups" :key="group.id" class="flex items-center gap-2 text-xs">
				<ColorPicker
					:color="getColorForGroup(datasetId, question, group)"
					:label="groupDisplayLabel(group)"
					@update="(newColor) => updateColor(group, newColor)"
				></ColorPicker>
				<span class="truncate">{{ groupDisplayLabel(group) }}</span>
			</li>
		</ul>
	</section>
</template>
