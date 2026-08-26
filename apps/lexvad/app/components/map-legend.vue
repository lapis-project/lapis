<script lang="ts" setup>
import type { VariantGroup } from "@/composables/use-variant-groups";

const props = defineProps<{
	question: string;
	activeVariants: Array<string>;
	groups: Array<VariantGroup>;
}>();

const t = useTranslations();
const { getColorForGroup } = useColorStore();
const { groupDisplayLabel } = useVariantGroups();
const { countAnswersForGroups } = useQuestions();

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
</script>

<template>
	<div
		class="rounded-md border border-input bg-background p-3 text-xs text-foreground shadow-md"
		data-testid="variantLegend"
	>
		<p class="mb-2 font-semibold uppercase text-muted-foreground sr-only">
			{{ t("MapsPage.legend.title") }}
		</p>

		<ul class="space-y-1">
			<li
				v-for="group in shownGroups"
				:key="group.id"
				class="flex items-center justify-between gap-4"
			>
				<div class="flex min-w-0 items-center gap-2">
					<div
						class="size-2 shrink-0 rounded-full"
						:style="{ backgroundColor: getColorForGroup(question, group) }"
					></div>
					<span class="truncate font-semibold max-w-24">{{ groupDisplayLabel(group) }}</span>
				</div>
				<span class="text-muted-foreground">{{ groupCount(group) }}</span>
			</li>
		</ul>
	</div>
</template>
