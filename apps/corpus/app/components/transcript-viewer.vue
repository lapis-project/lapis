<script setup lang="ts">
import { ArrowUpIcon, ArrowDownIcon, ChevronUp, ChevronDown } from "@lucide/vue";
import { useVirtualizer } from "@tanstack/vue-virtual";
import { useRoute } from "vue-router";

import type { APITranscriptData, Event, TimestampEvent } from "@/types/api";

const props = defineProps<{
	fileData?: APITranscriptData;
	speakerIds: Array<number>;
	hiddenSpeakers: Set<number>;
	showLu: boolean;
	showPhon: boolean;
	kwicTokens: Array<{ toknum: number; text: string }>;
}>();

const emit = defineEmits<{
	"update:current-highlight-index": [current: number];
}>();

defineExpose({
	jumpToNextHighlight: () => jumpToHighlightedToken("next"),
	jumpToPreviousHighlight: () => jumpToHighlightedToken("prev"),
});

const eventContainer = ref<HTMLElement | null>(null);
const containerElementWidth = ref(0);

const SPEAKER_COL_WIDTH = 160;
const GRID_COL_GAP = 8;
const SAFETY_PADDING = 2;
const ROW_HEIGHT = 230;
const EVENTS_PER_CHUNK = 20;
const eventMinWidth = 200;

const windowWidth = ref(0);

const maxEventsPerRow = computed(() => {
	if (containerElementWidth.value <= 0) return 0;
	const availableWidth = containerElementWidth.value - SPEAKER_COL_WIDTH - SAFETY_PADDING;
	const slotWidth = eventMinWidth + GRID_COL_GAP;
	return Math.max(1, Math.floor((availableWidth + GRID_COL_GAP) / slotWidth));
});

const route = useRoute();

const currentHighlightIndex = ref<number | null>(null);

type HighlightTarget = {
	rowIndex: number;
	speakerId: number;
	eventIndex: number;
	field: "ortho";
	tokenIndex: number;
};

const highlightTargets = computed<HighlightTarget[]>(() => {
	const targets: HighlightTarget[] = [];

	chunkedSpeakerEvents.value.forEach((block, rowIndex) => {
		props.speakerIds
			.filter((speakerId) => !props.hiddenSpeakers.has(speakerId))
			.forEach((speakerId) => {
				const events = block.speakerEvents[speakerId] ?? [];

				events.forEach((event, eventIndex) => {
					event.ortho?.forEach((token, tokenIndex) => {
						if (token.isKwic) {
							targets.push({
								rowIndex,
								speakerId,
								eventIndex,
								field: "ortho",
								tokenIndex,
							});
						}
					});
				});
			});
	});

	return targets;
});

const currentHighlightedRowIndex = ref<number | null>(null);
const currentHighlightedToken = ref<HTMLElement | null>(null);

function resetCurrentSelection() {
	currentHighlightedRowIndex.value = null;
	currentHighlightedToken.value = null;
	for (const element of document.querySelectorAll<HTMLElement>(
		'[data-current-highlighted-token="true"]',
	)) {
		element.dataset.currentHighlightedToken = "false";
	}
}

function isTarget(
	rowIndex: number,
	speakerId: number,
	eventIndex: number,
	field: "ortho",
	tokenIndex: number,
) {
	return highlightTargets.value.findIndex(
		(target) =>
			target.rowIndex === rowIndex &&
			target.speakerId === speakerId &&
			target.eventIndex === eventIndex &&
			target.field === field &&
			target.tokenIndex === tokenIndex,
	);
}

function setCurrentSelection(element: HTMLElement | null) {
	if (!element) {
		resetCurrentSelection();
		return;
	}

	for (const current of document.querySelectorAll<HTMLElement>(
		'[data-current-highlighted-token="true"]',
	)) {
		current.dataset.currentHighlightedToken = "false";
	}

	element.dataset.currentHighlightedToken = "true";
	currentHighlightedToken.value = element;
	const rowElement = element.closest<HTMLElement>("[data-row-index]");
	currentHighlightedRowIndex.value = rowElement ? Number(rowElement.dataset.rowIndex) : null;
}

async function jumpToHighlightedToken(direction: "next" | "prev") {
	const targets = highlightTargets.value;
	if (!targets.length) return;

	const current = currentHighlightIndex.value;

	const nextIndex =
		current == null
			? direction === "next"
				? 0
				: targets.length - 1
			: direction === "next"
				? (current + 1) % targets.length
				: (current - 1 + targets.length) % targets.length;

	const target = targets[nextIndex];
	if (!target) return;

	// Scroll the virtual row into view first.
	rowVirtualizer.value.scrollToIndex(target.rowIndex, {
		align: "center",
		behavior: "auto",
	});

	// Wait for the virtual row to be rendered.
	await nextTick();

	await new Promise<void>((resolve) => {
		if (import.meta.client) {
			requestAnimationFrame(() => resolve());
		} else {
			resolve();
		}
	});

	const element = eventContainer.value?.querySelector<HTMLElement>(
		`[data-highlight-target="${nextIndex}"]`,
	);

	if (!element) {
		console.warn("Could not find highlighted token", target);
		return;
	}

	// Only update the index after successfully finding the element.
	currentHighlightIndex.value = nextIndex;
	emit("update:current-highlight-index", nextIndex + 1);

	setCurrentSelection(element);

	element.scrollIntoView({
		behavior: "smooth",
		block: "center",
		inline: "nearest",
	});
}

const isKwicToken = (text: string | null | undefined) =>
	props.kwicTokens.some((kwicToken) => kwicToken.text?.trim() === text?.trim());

const kwicTokenPositions = computed(() => {
	const positions = new Set<string>();

	for (const [speakerId, speakerEvents] of Object.entries(props.fileData?.events ?? {})) {
		speakerEvents.forEach((token, index) => {
			if (props.kwicTokens.some((kwicToken) => kwicToken.text?.trim() === token.ortho?.trim())) {
				positions.add(`${speakerId}-${index}`);
			}
		});
	}

	return positions;
});

const chunkedSpeakerEvents = computed(() => {
	const fileData = props.fileData;
	if (!fileData || !props.speakerIds.length) return [];

	const perRow = maxEventsPerRow.value || EVENTS_PER_CHUNK;

	const timestampSet = new Set<string>();
	for (const infId in fileData.events) {
		fileData.events[infId]?.map((ev) => {
			return timestampSet.add(ev.start_time + "-" + ev.end_time);
		});
	}

	const timestamps = Array.from(timestampSet).toSorted();

	const speakerMap: Record<string, Event[]> = {};

	props.speakerIds.forEach((speaker) => {
		speakerMap[speaker] = timestamps.map(() => ({
			start: "",
			end: "",
			ortho: [],
			lu: [],
			phon: [],
		}));

		const tokens = fileData.events[speaker] ?? [];
		const eventsByTimestamp = new Map<string, Event>();

		for (const token of tokens) {
			const key = `${token.start_time}-${token.end_time}`;
			const hasTags = (token.tags?.length ?? 0) > 0;

			const existing = eventsByTimestamp.get(key);

			if (existing) {
				existing.ortho.push({
					text: token.ortho,
					hasTags,
					isKwic: isKwicToken(token.ortho),
				});
				existing.lu.push({ text: token.text_in_ortho, hasTags });
				existing.phon.push({ text: token.phon, hasTags });
			} else {
				eventsByTimestamp.set(key, {
					start: token.start_time,
					end: token.end_time,
					ortho: [
						{
							text: token.ortho,
							hasTags,
							isKwic: isKwicToken(token.ortho),
						},
					],
					lu: [{ text: token.text_in_ortho, hasTags }],
					phon: [{ text: token.phon, hasTags }],
				});
			}
		}

		speakerMap[speaker] = timestamps.map(
			(speakerMapTS) =>
				eventsByTimestamp.get(speakerMapTS) || {
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

const rowCount = computed(() => chunkedSpeakerEvents.value.length);

const rowVirtualizer = useVirtualizer(
	computed(() => ({
		count: rowCount.value,
		getScrollElement: () => eventContainer.value,
		estimateSize: () => ROW_HEIGHT,
		overscan: 5,
	})),
);
function scrollToTop() {
	rowVirtualizer.value.scrollToOffset(0, {
		behavior: "instant",
	});
}

function scrollToBottom() {
	const element = eventContainer.value;
	if (!element) return;

	element.scrollTop = rowVirtualizer.value.getTotalSize();
}

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

watch(
	highlightTargets,
	async (targets, oldTargets) => {
		if (!targets.length) {
			if (oldTargets?.length) {
				currentHighlightIndex.value = null;
				currentHighlightedRowIndex.value = null;
				resetCurrentSelection();
				emit("update:current-highlight-index", 0);
			}
			return;
		}

		currentHighlightIndex.value = null;
		await nextTick();
		await jumpToHighlightedToken("next");
	},
	{ immediate: true },
);
</script>

<template>
	<div class="relative min-h-0 max-h-full h-full overflow-hidden">
		<div class="absolute h-full justify-between right-6 py-4 z-50 flex flex-col gap-2">
			<TooltipProvider>
				<Tooltip>
					<TooltipTrigger>
						<Button
							variant="default"
							size="icon"
							class="shadow-lg bg-accent-foreground hover:!bg-highlight"
							@click="scrollToTop"
						>
							<ArrowUpIcon class="size-4" />
						</Button>
					</TooltipTrigger>
					<TooltipContent>
						<p>Zum Anfang springen</p>
					</TooltipContent>
				</Tooltip>
			</TooltipProvider>

			<TooltipProvider>
				<Tooltip>
					<TooltipTrigger>
						<Button
							variant="default"
							size="icon"
							class="shadow-lg mt-auto bg-accent-foreground hover:!bg-highlight"
							@click="scrollToBottom"
						>
							<ArrowDownIcon class="size-4" />
						</Button>
					</TooltipTrigger>
					<TooltipContent>
						<p>Zum Ende springen</p>
					</TooltipContent>
				</Tooltip>
			</TooltipProvider>
		</div>
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
					flex: 'none',
				}"
			>
				<VirtualRow
					id="virtualRow"
					class="py-2"
					v-for="virtualRow in rowVirtualizer.getVirtualItems()"
					:key="virtualRow.index"
					:row-index="virtualRow.index"
					:block="chunkedSpeakerEvents[virtualRow.index]"
					:speakers="speakerIds"
					:hidden-speakers="hiddenSpeakers"
					:show-lu="showLu"
					:show-phon="showPhon"
					:style="{
						position: 'absolute',
						width: '100%',
						transform: `translateY(${virtualRow.start}px)`,
						height: `${ROW_HEIGHT}px`,
						top: 0,
						left: 0,
					}"
					:max-events-per-row="maxEventsPerRow"
					:highlight-target-index="isTarget"
				/>
			</div>
		</div>
	</div>
</template>
