<script setup lang="ts">
defineProps<{
	data: Array<{ id: string; label: string; value: number; percentage: string; secondary?: string }>;
	title?: string;
	subtitle?: string;
	colors: Record<string, string>;
}>();

const t = useTranslations();
</script>

<template>
	<div class="rounded-lg p-3.5 border border-default">
		<div class="uppercase font-semibold text-muted text-xs">
			{{ title ?? t("VariantOverviewCard.title") }}
		</div>
		<div v-if="subtitle" class="my-1 text-muted text-xs">
			{{ subtitle }}
		</div>
		<VariantBar
			v-for="entry in data"
			:key="entry.id"
			:color="colors[entry.id]"
			:percentage="entry.percentage"
			:secondary="entry.secondary"
			:value="entry.value"
		>
			<template #label>
				<span class="truncate">{{ entry.label }}</span>
			</template>
		</VariantBar>
	</div>
</template>
