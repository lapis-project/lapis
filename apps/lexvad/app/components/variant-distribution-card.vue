<script setup lang="ts">
import { VisDonut, VisSingleContainer } from "@unovis/vue";

const props = defineProps<{
	data: Array<{ label: string; value: number }>;
}>();

const t = useTranslations();
const mode = ref("region");

// Enable Unovis' built-in pattern fills: https://unovis.dev/docs/guides/theming/#applying-patterns
useHead({ bodyAttrs: { class: "theme-patterns" } });

const NUM_PATTERNS = 6;
const colorVar = (index: number) => `var(--vis-color${index % NUM_PATTERNS})`;
const patternVar = (index: number) => `var(--vis-pattern-fill${index % NUM_PATTERNS})`;

const legendItems = computed(() => {
	const total = props.data.reduce((sum, d) => sum + d.value, 0);
	return props.data.map((d, index) => ({
		label: d.label,
		value: total > 0 ? d.value / total : 0,
		secondary: t("MapsPage.sidebar.places", d.value),
		fill: colorVar(index),
		mask: patternVar(index),
	}));
});
</script>

<template>
	<div class="rounded-lg p-3.5 border">
		<div
			class="uppercase font-semibold text-muted-foreground text-xs mb-2.5 flex items-center gap-1"
		>
			{{ t("VariantDistributionCard.title") }}

			<Label
				><Select default-value="region">
					<SelectTrigger
						v-model="mode"
						class="uppercase font-semibold text-muted-foreground text-xs border-0 shadow-none data-[size=sm]:h-fit min-h-0 py-0 px-0"
						size="sm"
					>
						<SelectValue />
					</SelectTrigger>
					<SelectContent :body-lock="false">
						<SelectItem value="region">
							{{ t("VariantDistributionCard.dialectal-region") }}
						</SelectItem>
						<SelectItem value="state">
							{{ t("VariantDistributionCard.state") }}
						</SelectItem>
					</SelectContent>
				</Select></Label
			>
		</div>
		<VisSingleContainer class="w-full h-52" :data="data">
			<VisDonut
				:arc-width="30"
				:pad-angle="0.025"
				:radius="80"
				:value="(d: (typeof data)[0]) => d.value"
			/>
		</VisSingleContainer>
		<div v-for="entry in legendItems" :key="entry.label" class="my-2 text-xs">
			<div class="my-0.5">
				<svg class="inline-block align-[-2px]" height="12" viewBox="0 0 12 12" width="12">
					<circle
						cx="6"
						cy="6"
						r="6"
						:style="{ fill: entry.fill, mask: entry.mask, WebkitMask: entry.mask }"
					/>
				</svg>
				<span class="ml-2">{{ entry.label }}</span>
				<span class="float-right">
					<span class="mr-2 text-muted-foreground">{{ entry.secondary }}</span>
					<span class="font-semibold">{{ (entry.value * 100).toFixed(0) }}%</span></span
				>
			</div>
			<svg class="block w-full" height="4">
				<rect height="4" rx="2" :style="{ fill: 'var(--accent)' }" width="100%" />
				<rect
					class="transition-[width] duration-500"
					height="4"
					rx="2"
					:style="{
						width: `${entry.value * 100}%`,
						fill: entry.fill,
						mask: entry.mask,
						WebkitMask: entry.mask,
					}"
				/>
			</svg>
		</div>
	</div>
</template>

<style scoped>
* {
	--vis-color5: #aaa;
	--vis-color4: #9b9b9b;
	--vis-color3: #666;
	--vis-color2: #565656;
	--vis-color1: #474747;
	--vis-color0: #323232;
}
</style>
