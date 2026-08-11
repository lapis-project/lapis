<script setup lang="ts">
interface MapTooltipProps {
	entry?: PilotDataType;
}
const props = defineProps<MapTooltipProps>();
const multipleEntries = computed(() => (props.entry?.Variante?.split(";")?.length ?? 0) >= 3);
</script>

<template>
	<UCard
:ui="{
		root: 'divide-none min-w-42 bg-background/95',
		body: 'p-3 sm:p-3',
		header: 'p-3 text-sm text-left sm:p-3 pb-0 sm:pb-0',
	}">
		<template #header>
			<span class="font-semibold">{{ entry?.Ort }}</span>
		</template>

		<div class="grid grid-cols-[auto_1fr] gap-x-2 text-xs" :class="{ 'gap-y-1': multipleEntries }">
			<span class="text-muted">Variante: </span>
			<span class="text-xs">{{ entry?.Benennungsvariante }}</span>

			<span class="text-muted">Dialektform: </span>
			<span class="text-xs font-serif tracking-wider">{{ entry?.Variante }} </span>

			<span class="text-muted mt-1">Bundesland: </span>
			<span class="text-xs mt-1">{{ entry?.bundesland }}</span>

			<span class="text-muted">Kreis: </span>
			<span class="text-xs">{{ entry?.Kreis }}</span>
		</div>
	</UCard>
</template>
