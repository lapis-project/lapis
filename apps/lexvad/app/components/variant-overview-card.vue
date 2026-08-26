<script setup lang="ts">
defineProps<{
	data: Array<{ id: string; label: string; value: number; secondary?: string }>;
	title?: string;
	subtitle?: string;
	colors: Record<string, string>;
}>();

const t = useTranslations();
</script>

<template>
	<div class="rounded-lg p-3.5 border">
		<div class="uppercase font-semibold text-muted-foreground text-xs">
			{{ title ?? t("VariantOverviewCard.title") }}
		</div>
		<div v-if="subtitle" class="my-1 text-muted-foreground text-xs">
			{{ subtitle }}
		</div>
		<VariantBar
			v-for="entry in data"
			:key="entry.id"
			:color="colors[entry.id]"
			:secondary="entry.secondary"
			:value="entry.value"
		>
			<template #label>
				<span class="truncate">{{ entry.label }}</span>
			</template>
		</VariantBar>
	</div>
</template>
