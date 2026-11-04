<script setup lang="ts">
import { getRegisterOptions } from "@/assets/data/static-filter-data";

const props = defineProps<{
	data: Array<{
		id: string;
		label: string;
		abs: number;
		value: number;
		percentage: string;
		secondary?: string;
	}>;
}>();

const t = useTranslations();

const registerSections = computed(() => {
	const options = getRegisterOptions(t);
	const groups = options
		.flatMap((group) => {
			if (group.level !== 1 || typeof group.value !== "string" || typeof group.label !== "string") {
				return [];
			}

			const registers = new Set(
				options
					.filter((option) => option.level === 2 && option.group === group.group)
					.map((option) => option.label),
			);
			return [
				{
					id: group.value,
					label: group.label,
					entries: props.data.filter((entry) => registers.has(entry.id)),
				},
			];
		})
		.filter((group) => group.entries.length > 0);
	const groupedIds = new Set(groups.flatMap((group) => group.entries.map((entry) => entry.id)));
	const ungrouped = props.data.filter((entry) => !groupedIds.has(entry.id));

	const sections =
		ungrouped.length > 0
			? [...groups, { id: "ungrouped", label: undefined, entries: ungrouped }]
			: groups;
	return sections.map((section) => ({
		...section,
		abs: section.entries.reduce((total, entry) => total + entry.abs, 0),
		value: section.entries.reduce((total, entry) => total + entry.value, 0),
	}));
});
</script>

<template>
	<div class="rounded-lg p-3.5 border border-default">
		<div class="uppercase font-semibold text-muted text-xs">
			{{ t("RegisterGroupingCard.title") }}
		</div>
		<section
			v-for="section in registerSections"
			:key="section.id"
			:aria-label="section.label"
			class="mt-3"
		>
			<div v-if="section.label" class="space-y-1 text-xs">
				<h3 class="font-semibold wrap-anywhere">{{ section.label }}</h3>
				<div class="flex items-center justify-between gap-2">
					<span class="text-muted">{{ t("MapsPage.sidebar.answers", section.abs) }}</span>
					<span>{{ (section.value * 100).toFixed(0) }}%</span>
				</div>
			</div>
			<div :class="{ 'ml-1 mt-2 border-l border-default pl-3': section.label }">
				<VariantBar
					v-for="entry in section.entries"
					:key="entry.id"
					:percentage="entry.percentage"
					:secondary="entry.secondary"
					:value="entry.value"
					stacked
				>
					<template #label>
						<span class="min-w-0 flex-1 wrap-anywhere">{{ entry.label }}</span>
					</template>
				</VariantBar>
			</div>
		</section>
	</div>
</template>
