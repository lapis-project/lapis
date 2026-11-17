<script lang="ts" setup>
export interface MapLegendEntry {
	id: string;
	label: string;
	color?: string;
	stroke?: string;
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
		<table class="-my-1 border-separate border-spacing-y-1">
			<caption v-if="title" class="sr-only">
				{{ title }}
			</caption>
			<tbody>
				<tr v-for="entry in data" :key="entry.id">
					<th scope="row" class="text-start">
						<div class="flex min-w-0 items-center gap-2">
							<svg aria-hidden="true" class="size-3 shrink-0" viewBox="0 0 12 12">
								<circle
									cx="6"
									cy="6"
									:fill="entry.color"
									r="5"
									:stroke="entry.stroke ?? 'currentColor'"
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
					</th>
					<td v-if="showCounts" class="ps-4 text-right whitespace-nowrap tabular-nums text-muted">
						{{ formatCount ? formatCount(entry.count) : entry.count }}
					</td>
					<td
						v-if="showPercentages"
						class="text-right whitespace-nowrap tabular-nums"
						:class="showCounts ? 'ps-2' : 'ps-4'"
					>
						{{ entry.percentage }}%
					</td>
				</tr>
			</tbody>
		</table>
	</div>
</template>
