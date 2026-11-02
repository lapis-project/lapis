<script setup lang="ts">
import { getRegisterOptions } from "@/assets/data/static-filter-data";

const props = defineProps<{
	data: Array<{ id: string; label: string; value: number; secondary?: string }>;
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

	return ungrouped.length > 0
		? [...groups, { id: "ungrouped", label: undefined, entries: ungrouped }]
		: groups;
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
			<h3 v-if="section.label" class="text-xs font-semibold">{{ section.label }}</h3>
			<div :class="{ 'ml-1 mt-2 border-l border-default pl-3': section.label }">
				<VariantBar
					v-for="entry in section.entries"
					:key="entry.id"
					:secondary="entry.secondary"
					:value="entry.value"
				>
					<template #label>
						<span class="truncate" :title="entry.label">{{ entry.label }}</span>
					</template>
				</VariantBar>
			</div>
		</section>
	</div>
</template>
