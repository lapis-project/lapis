<script setup lang="ts">
import type { APITranscriptFileData, Event, TimestampEvent } from "@/types/api";
import { useVirtualizer } from "@tanstack/vue-virtual";

const props = defineProps<{
	fileData: Array<APITranscriptFileData> | undefined;
	speakerIds: Array<number>;
	hiddenSpeakers: Set<number>;
	showLu: boolean;
	showPhon: boolean;
}>();

const eventContainer = ref<HTMLElement | null>(null);
const containerElementWidth = ref(0);

const SPEAKER_COL_WIDTH = 160;
const GRID_COL_GAP = 8; // .grid without an explicit gap`
const SAFETY_PADDING = 2; // for sub-pixel rounding / scroll-bars

const EVENTS_PER_CHUNK = 20;

const windowWidth = ref(0);
const eventMinWidth = 200;

const maxEventsPerRow = computed(() => {
	if (containerElementWidth.value <= 0) return 0;
	const availableWidth = containerElementWidth.value - SPEAKER_COL_WIDTH - SAFETY_PADDING;
	const slotWidth = eventMinWidth + GRID_COL_GAP;
	return Math.max(1, Math.floor((availableWidth + GRID_COL_GAP) / slotWidth));
});

const chunkedSpeakerEvents = computed(() => {
	if (!props.fileData || !props.speakerIds.length) return [];

	const perRow = maxEventsPerRow.value || EVENTS_PER_CHUNK;

	const timestampSet = new Set<string>();
	props.fileData.forEach((informant) => {
		informant.events.forEach((ev) => {
			timestampSet.add(ev.start_time + "–" + ev.end_time);
		});
	});
	const timestamps = Array.from(timestampSet).sort();

	const speakerMap: Record<number, Event[]> = {};

	props.speakerIds.forEach((spId) => {
		const informant = props.fileData!.find((f) => f.informant === spId);

		if (!informant) {
			speakerMap[spId] = timestamps.map(() => ({
				start: "",
				end: "",
				ortho: [],
				lu: [],
				phon: [],
			}));
			return;
		}

		const eventsByTimestamp = new Map(
			informant.events.map((ev) => [
				ev.start_time + "–" + ev.end_time,
				{
					start: ev.start_time,
					end: ev.end_time,
					ortho: ev.tokens.map((t) => ({ text: t.ortho, hasTags: false })),
					lu: ev.tokens.map((t) => ({ text: t.text_in_ortho, hasTags: false })),
					phon: ev.tokens.map((t) => ({ text: t.phon, hasTags: false })),
				} as Event,
			]),
		);

		speakerMap[spId] = timestamps.map(
			(ts) =>
				eventsByTimestamp.get(ts) || {
					start: "",
					end: "",
					ortho: [],
					lu: [],
					phon: [],
				},
		);
	});

	const blocks: Array<TimestampEvent> = [];

	for (let i = 0; i < timestamps.length; i += perRow) {
		const blockTimestamps = timestamps.slice(i, i + perRow);

		const speakerEvents: Record<number, Event[]> = {};

		for (const sp of props.speakerIds) {
			speakerEvents[sp] = speakerMap[sp]?.slice(i, i + perRow) ?? [];
		}

		blocks.push({
			timestamps: blockTimestamps,
			speakerEvents,
		});
	}

	return blocks;
});

const maxEventsInBlock = (block: Record<number, Event[]>) => {
	return Math.max(
		...props.speakerIds
			.filter((sp) => !props.hiddenSpeakers.has(sp))
			.map((sp) => block[sp]?.length || 0),
	);
};

const rowCount = computed(() => chunkedSpeakerEvents.value.length);

const rowVirtualizer = useVirtualizer({
	count: rowCount.value,
	getScrollElement: () => eventContainer.value,
	estimateSize: () => 230,
});

function handleResize() {
	if (eventContainer.value != null) {
		containerElementWidth.value = eventContainer.value.getBoundingClientRect().width;
	}
	windowWidth.value = window.innerWidth;
}

onMounted(async () => {
	await nextTick();

	handleResize();
	window.addEventListener("resize", handleResize, { passive: true });
});

onUnmounted(() => {
	window.removeEventListener("resize", handleResize);
});

watch(
	() => props.fileData,
	(newVal, oldVal) => {
		if (oldVal != newVal) {
			nextTick(() => {
				handleResize();
			});
		}
	},
	{ immediate: true },
);
</script>

<template>
	<div class="relative overflow-auto min-h-0 max-h-full h-full">
		<div v-if="!chunkedSpeakerEvents.length" class="h-fit item-center m-auto">
			<Spinner />
		</div>
		<div
			v-else
			id="eventViewContainer"
			ref="eventContainer"
			class="overflow-y-auto flex flex-col min-h-0 gap-4 border border-foreground/20 rounded-lg bg-muted h-full"
		>
			<div
				:style="{
					height: `${rowVirtualizer.getTotalSize()}px`,
					width: '100%',
					position: 'relative',
				}"
			>
				<VirtualRow
					id="virtualRow"
					class="py-2"
					v-for="virtualRow in rowVirtualizer.getVirtualItems()"
					:key="virtualRow.index"
					:block="chunkedSpeakerEvents[virtualRow.index]"
					:speakers="speakerIds"
					:hidden-speakers="hiddenSpeakers"
					:show-lu="showLu"
					:show-phon="showPhon"
					:style="{
						position: 'absolute',
						width: '100%',
						transform: `translateY(${virtualRow.start}px)`,
						height: `${virtualRow.size}px`,
						top: 0,
						left: 0,
					}"
					:max-events-per-row="maxEventsPerRow"
				/>
			</div>
		</div>
	</div>
</template>
