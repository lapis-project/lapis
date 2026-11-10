<script setup lang="ts">
interface MapTooltipProps {
	entry?: LocatedEntry;
	entries?: Array<LocatedEntry>;
}
const props = defineProps<MapTooltipProps>();
const t = useTranslations();
const shown = computed(() => props.entries ?? (props.entry ? [props.entry] : []));
const multipleEntries = computed(() => (props.entry?.Variante?.split(";")?.length ?? 0) >= 3);
</script>

<template>
	<UCard
		:ui="{
			root: 'divide-none min-w-42 bg-background/95',
			body: 'p-3 sm:p-3',
			header: 'p-3 text-sm text-left sm:p-3 pb-0 sm:pb-0',
		}"
	>
		<template #header>
			<span class="font-semibold">{{ shown[0]?.Ort }}</span>
		</template>

		<div class="grid grid-cols-[auto_1fr] gap-x-2 text-xs" :class="{ 'gap-y-1': multipleEntries }">
			<template v-for="(item, index) in shown" :key="index">
				<template v-if="entries">
					<span class="text-muted" :class="{ 'mt-1': index > 0 }"
						>{{ t("MapsPage.sidebar.variable") }}:
					</span>
					<span class="text-xs font-semibold" :class="{ 'mt-1': index > 0 }">{{ item.Item }}</span>
				</template>

				<span class="text-muted">Variante: </span>
				<span class="text-xs">{{ item.Benennungsvariante }}</span>

				<span class="text-muted">Dialektform: </span>
				<span class="text-xs font-serif tracking-wider">{{ item.Variante }} </span>
				<div class="divider col-span-2 border mt-1" v-if="shown.length > 1"></div>
			</template>

			<span class="text-muted mt-1">Bundesland: </span>
			<span class="text-xs mt-1">{{ shown[0]?.bundesland }}</span>

			<span class="text-muted">Kreis: </span>
			<span class="text-xs">{{ shown[0]?.Kreis }}</span>
		</div>
	</UCard>
</template>
