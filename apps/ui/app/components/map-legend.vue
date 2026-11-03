<script lang="ts" setup>
export interface MapLegendEntry {
	id: string;
	label: string;
	color?: string;
	count: number;
	percentage: string | number;
	italic?: boolean;
}

withDefaults(
	defineProps<{
		data: Array<MapLegendEntry>;
		title?: string;
		formatCount?: (count: number) => string;
		showCounts?: boolean;
		showPercentages?: boolean;
		truncateLabels?: boolean;
	}>(),
	{
		showCounts: true,
		showPercentages: true,
		truncateLabels: true,
	},
);
</script>

<template>
	<!-- Real borders are captured by html2canvas; Nuxt UI's box-shadow rings are not. -->
	<div
		class="rounded-md border border-default bg-default p-3 text-xs text-default shadow-md"
		data-testid="variantLegend"
	>
		<p v-if="title" class="mb-2 font-semibold uppercase text-muted sr-only">
			{{ title }}
		</p>

		<ul class="space-y-1">
			<li v-for="entry in data" :key="entry.id" class="flex items-center justify-between gap-4">
				<div class="flex min-w-0 items-center gap-2">
					<svg aria-hidden="true" class="size-3 shrink-0" viewBox="0 0 12 12">
						<circle
							cx="6"
							cy="6"
							:fill="entry.color"
							r="5"
							stroke="currentColor"
							stroke-width="1"
						/>
					</svg>
					<span
						class="font-normal"
						:class="{ italic: entry.italic, 'truncate max-w-24': truncateLabels }"
						:title="entry.label"
					>
						{{ entry.label }}
					</span>
				</div>
				<span class="gap-2 flex shrink-0">
					<span v-if="showCounts" class="text-muted">{{
						formatCount ? formatCount(entry.count) : entry.count
					}}</span>
					<span v-if="showPercentages" class="font-normal">{{ entry.percentage }}%</span>
				</span>
			</li>
		</ul>
	</div>
</template>
