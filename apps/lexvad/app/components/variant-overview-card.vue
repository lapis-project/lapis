<script setup lang="ts">
defineProps<{
	data: Array<{ label: string; value: number }>;
}>();

const t = useTranslations();
</script>

<template>
	<div class="rounded-lg p-3.5 border">
		<div class="uppercase font-semibold text-muted-foreground text-xs">
			{{ t("VariantOverviewCard.title") }}
		</div>
		<div v-for="entry in data" :key="entry.label" class="my-2 text-xs">
			<div class="my-0.5">
				<span class="rounded-full bg-amber-600 size-2 inline-block"></span>
				<span class="ml-2">{{ entry.label }}</span>
				<span class="float-right font-semibold">{{ (entry.value * 100).toFixed(0) }}%</span>
			</div>
			<div class="w-full relative">
				<div class="w-full rounded-full bg-accent h-1"></div>
				<div
					class="absolute top-0 rounded-full bg-amber-600 h-1"
					:style="{ width: `${entry.value * 100}%` }"
				></div>
			</div>
		</div>
	</div>
</template>
