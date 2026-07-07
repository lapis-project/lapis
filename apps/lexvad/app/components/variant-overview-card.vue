<script setup lang="ts">
defineProps<{
	data: Array<{ label: string; value: number; secondary?: string }>;
	title?: string;
	subtitle?: string;
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
		<div v-for="entry in data" :key="entry.label" class="my-2 text-xs">
			<div class="my-0.5">
				<span class="rounded-full bg-amber-600 size-2 inline-block"></span>
				<span class="ml-2">{{ entry.label }}</span>
				<span class="float-right">
					<span class="mr-2 text-muted-foreground">{{ entry.secondary }}</span>
					<span class="font-semibold">{{ (entry.value * 100).toFixed(0) }}%</span></span>
			</div>
			<div class="w-full relative">
				<svg class="block w-full" height="4">
					<rect height="4" rx="2" :style="{ fill: 'var(--accent)' }" width="100%" />
					<rect
class="transition-[width] duration-500" height="4" rx="2"
						:style="{ width: `${entry.value * 100}%`, fill: 'var(--color-amber-600)' }" />
				</svg>
			</div>
		</div>
	</div>
</template>
