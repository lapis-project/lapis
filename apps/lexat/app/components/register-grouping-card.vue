<script setup lang="ts">
defineProps<{
	data: Array<{ id: string; label: string; value: number; secondary?: string }>;
}>();

const t = useTranslations();
</script>

<template>
	<div class="rounded-lg p-3.5 border border-default">
		<div class="uppercase font-semibold text-muted text-xs">
			{{ t("RegisterGroupingCard.title") }}
		</div>
		<VariantBar
			v-for="entry in data"
			:key="entry.id"
			:secondary="entry.secondary"
			:value="entry.value"
		>
			<template #label>
				<span class="truncate" :title="entry.label">{{ entry.label }}</span>
			</template>
		</VariantBar>
	</div>
</template>
