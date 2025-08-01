<script setup lang="ts">
import {
	ChevronRight,
	DownloadIcon,
	FileText,
	PauseIcon,
	PlayIcon,
	SquareIcon,
} from "lucide-vue-next";

import data from "@/assets/data/transcripts-demo.json";

definePageMeta({
	layout: "tool",
});

interface Token {
	id: number;
	ortho: { text: string; tags: Array<string> };
	lu: { text: string; tags: Array<string> };
	phon: { text: string; tags: Array<string> };
}

interface SpeakerEntry {
	name: string;
	tokens: Array<Token>;
}

interface TranscriptEvent {
	event: string;
	timestamp: { start: string; end: string };
	speakers: Array<SpeakerEntry>;
}

interface Annotation {
	id: number;
	eventIds: Array<number>;
	annoType: string;
}

export interface Transcript {
	id: number;
	name: string;
	location: string;
	setting: string;
	icon: string;
	audioUrl: string;
	bookmarked: boolean;
	annotations: Array<Annotation>;
	speakers: Array<string>;
	events: Array<TranscriptEvent>;
}

interface EventToken {
	text: string;
	hasTags: boolean;
}

interface Event {
	start: string;
	end: string;
	ortho: Array<EventToken>;
	lu: Array<EventToken>;
	phon: Array<EventToken>;
}

const transcripts = data as { transcripts: Array<Transcript> };

const showLu = ref(false);
const showPhon = ref(false);

const route = useRoute();

const id = computed(() => {
	return Number(route.params.id as string);
});

const transcript = computed(() => {
	if (id.value != null) {
		return transcripts.transcripts.find((t) => t.id === id.value);
	} else return null;
});

const showFirstColumn = ref(true);

const toggleFirstColumn = () => {
	showFirstColumn.value = !showFirstColumn.value;
};

const audioIsStopped = ref(false);
const audioIsPlaying = ref(false);

const gridColumns = computed(() => {
	return [showFirstColumn.value ? "340px" : "0px", "1fr"].join(" ");
});

// function formatTime(seconds: number) {
// 	const m = Math.floor(seconds / 60);
// 	const s = Math.floor(seconds % 60);
// 	return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
// }

const windowWidth = ref(0);
const hiddenSpeakers = ref<Set<string>>(new Set());
const eventMinWidth = 200;

const containerElementWidth = ref(0);
const maxEventsPerRow = computed(() => {
	if (!transcript.value || containerElementWidth.value <= 0) return 1;
	const availableWidth = containerElementWidth.value - SPEAKER_COL_WIDTH - SAFETY_PADDING;
	const slotWidth = eventMinWidth + GRID_COL_GAP;
	return Math.max(1, Math.floor((availableWidth + GRID_COL_GAP) / slotWidth));
});

function handleResize() {
	const element = document.getElementById("eventViewContainer");
	if (element != null) {
		containerElementWidth.value = element.getBoundingClientRect().width;
	}
	windowWidth.value = window.innerWidth;
}

const SPEAKER_COL_WIDTH = 160;
const GRID_COL_GAP = 8; // .grid without an explicit gap`

const SAFETY_PADDING = 2; // for sub-pixel rounding / scroll-bars

const chunkedSpeakerEvents = computed(() => {
	if (!transcript.value || containerElementWidth.value <= 0) return [];

	// Width that is actually available for event cells

	const availableWidth = containerElementWidth.value - SPEAKER_COL_WIDTH - SAFETY_PADDING;
	/* One “slot” = card-min-width + 1 gap to its left
		(the *first* event cell does not need a leading
		gap, so we add GRID_COL_GAP back once below)
	*/
	const slotWidth = eventMinWidth + GRID_COL_GAP;
	const maxEventsPerRow = Math.max(1, Math.floor((availableWidth + GRID_COL_GAP) / slotWidth));

	if (maxEventsPerRow <= 0) return [];

	const speakers = transcript.value!.speakers;
	const events = transcript.value.events;
	const totalChunks = Math.ceil(events.length / maxEventsPerRow);

	const chunks: Array<Record<string, Array<Event>>> = [];
	for (let chunkIndex = 0; chunkIndex < totalChunks; chunkIndex++) {
		const chunkStart = chunkIndex * maxEventsPerRow;
		const chunkEnd = chunkStart + maxEventsPerRow;
		const chunkEvents = events.slice(chunkStart, chunkEnd);

		const speakerMap: Record<string, Array<Event>> = {};
		speakers?.forEach((s) => (speakerMap[s] = []));

		chunkEvents.forEach((event) => {
			speakers?.forEach((speakerName) => {
				const speakerEntry = event.speakers.find((s) => s.name === speakerName);
				const tokens = speakerEntry?.tokens ?? [];

				const getTokens = (mode: "ortho" | "lu" | "phon") =>
					tokens
						.map((t) => ({
							text: t[mode]?.text ?? "",
							hasTags: (t[mode]?.tags?.length ?? 0) > 0,
						}))
						.filter((tok) => tok.text.trim() !== "");

				speakerMap[speakerName]!.push({
					start: event.timestamp.start,
					end: event.timestamp.end,
					ortho: getTokens("ortho"),
					lu: getTokens("lu"),
					phon: getTokens("phon"),
				});
			});
		});

		chunks.push(speakerMap);
	}

	return chunks;
});

const audioRef = ref<HTMLAudioElement | null>(null);
let timer: ReturnType<typeof setTimeout> | null = null;

const currentTime = ref(0);
const duration = ref(0);

const searchInput = ref("");

function togglePlayback() {
	if (!audioRef.value) return;

	if (audioRef.value.paused) {
		audioRef.value.play();
		audioIsPlaying.value = true;
	} else {
		audioRef.value.pause();
		audioIsPlaying.value = false;
	}
}

function stopPlayback() {
	if (audioRef.value) {
		audioRef.value.pause();
		audioRef.value.currentTime = 0;
		audioIsStopped.value = true;
	}
	audioIsPlaying.value = false;
	timer = setTimeout(() => {
		audioIsStopped.value = false;
	}, 300);
}

function updateProgress() {
	if (!audioRef.value) return;
	currentTime.value = audioRef.value.currentTime;
}

function updateMetadata() {
	if (audioRef.value) {
		duration.value = audioRef.value.duration;
	}
}

const progressFraction = computed(() => {
	if (!duration.value) return 0;
	return currentTime.value / duration.value;
});

function resetAudio() {
	audioIsPlaying.value = false;
	currentTime.value = 0;
}

onMounted(() => {
	windowWidth.value = window.innerWidth;
	window.addEventListener("resize", handleResize, { passive: true });
	if (audioRef.value) {
		audioRef.value.addEventListener("ended", resetAudio);
	}
	const element = document.getElementById("eventViewContainer");
	if (element != null) {
		containerElementWidth.value = element.getBoundingClientRect().width;
	}
});

onUnmounted(() => {
	window.removeEventListener("resize", handleResize);
	if (audioRef.value) {
		audioRef.value.removeEventListener("ended", resetAudio);
	}
});

onScopeDispose(() => {
	if (timer != null) {
		clearTimeout(timer);
	}
});
</script>

<template>
	<main class="max-w-full container py-8 pt-4 flex flex-col !overflow-y-hidden">
		<div class="w-fit">
			<Button
				class="fixed z-10 flex items-center border rounded-none rounded-br-md rounded-tr-md border-foreground/20 justify-center py-0 px-1 transition-all shadow-md duration-250 delay-150"
				:class="showFirstColumn ? 'left-[371px]' : 'left-0'"
				variant="ghost"
				@click="toggleFirstColumn"
			>
				<ChevronRight class="size-4" :class="{ 'rotate-180': showFirstColumn }" />
			</Button>
		</div>
		<div
			class="relative gap-8 !overflow-hidden flex-grow grid min-h-0 duration-250 delay-150 transition-[grid-template-columns] ease-in-out"
			:style="{ gridTemplateColumns: gridColumns }"
		>
			<div
				class="h-full border border-foreground/20 rounded overflow-y-auto"
				:class="{ 'opacity-0 pointer-events-none transition-all': !showFirstColumn }"
			>
				<div class="p-3">
					<div class="text-normal text-sm items-center mb-1 inline-flex gap-2">
						<FileText class="size-4" />
						Transcript
					</div>
					<h1 class="text-lg font-bold">
						{{ transcript?.name }}
					</h1>
					<div class="flex flex-wrap py-2">
						<TooltipProvider>
							<Tooltip>
								<TooltipTrigger>
									<span
										v-if="transcript?.location"
										class="border text-xs mr-2 px-2.5 py-0.5 rounded hover:bg-gray-50"
									>
										{{ transcript.location }}
									</span>
								</TooltipTrigger>
								<TooltipContent> Ort </TooltipContent>
							</Tooltip>
						</TooltipProvider>

						<TooltipProvider>
							<Tooltip>
								<TooltipTrigger>
									<span
										v-if="transcript?.setting"
										class="border text-xs mr-2 px-2.5 py-0.5 rounded hover:bg-gray-50"
									>
										{{ transcript.setting }}
									</span>
								</TooltipTrigger>
								<TooltipContent> Setting </TooltipContent>
							</Tooltip>
						</TooltipProvider>
					</div>

					<Tabs class="w-full flex flex-col flex-grow min-h-0" default-value="info">
						<TabsList class="w-full flex-shrink-0">
							<TabsTrigger value="info"> Info </TabsTrigger>
							<TabsTrigger value="filter"> Filter </TabsTrigger>
							<TabsTrigger value="search"> Suche </TabsTrigger>
						</TabsList>
						<TabsContent class="flex-grow overflow-y-auto min-h-0" value="info">
							<div class="hyphens-auto">
								Lorem ipsum dolor sit amet, consetetur sadipscing elitr, sed diam nonumy eirmod
								tempor invidunt ut labore et dolore magna aliquyam erat, sed diam voluptua. At vero
								eos et accusam et justo duo dolores et ea rebum. Stet clita kasd gubergren, no sea
								takimata sanctus est Lorem ipsum dolor sit amet. Lorem ipsum dolor sit amet,
								consetetur sadipscing elitr, sed diam nonumy eirmod tempor invidunt ut labore et
								dolore magna aliquyam erat, sed diam voluptua. At vero eos et accusam et justo duo
								dolores et ea rebum. Stet clita kasd gubergren, no sea takimata sanctus est Lorem
								ipsum dolor sit amet. Lorem ipsum dolor sit amet, consetetur sadipscing elitr, sed
								diam nonumy eirmod tempor invidunt ut labore et dolore magna aliquyam erat, sed diam
								voluptua. At vero eos et accusam et justo duo dolores et ea rebum. Stet clita kasd
								gubergren, no sea takimata sanctus est Lorem ipsum dolor sit amet. Duis autem vel
								eum iriure dolor in hendrerit in vulputate velit esse molestie consequat, vel illum
								dolore eu feugiat nulla facilisis at vero eros et accumsan et iusto odio dignissim
								qui blandit praesent luptatum zzril delenit augue duis dolore te feugait nulla
								facilisi. Lorem ipsum dolor sit amet, consectetuer adipiscing elit, sed diam nonummy
								nibh euismod tincidunt ut laoreet dolore magna aliquam erat volutpat.
							</div>
						</TabsContent>
						<TabsContent class="flex-grow overflow-y-auto min-h-0 p-2" value="filter">
							<div class="flex flex-col gap-2 text-sm">
								<p class="text-xs text-gray-500">Spuren:</p>
								<label class="flex items-center gap-2">
									<input v-model="showLu" type="checkbox" />
									Lautorientierte Transkription (lu)
								</label>
								<label class="flex items-center gap-2">
									<input v-model="showPhon" type="checkbox" />
									Phonetische Transkription (phon)
								</label>
							</div>
							<hr class="my-2 border-foreground/10" />
							<p class="text-xs text-gray-500 pb-2">Sprecher ausblenden:</p>
							<div class="flex flex-col gap-1 pl-1">
								<label
									v-for="speaker in transcript?.speakers"
									:key="speaker"
									class="flex items-center gap-2"
								>
									<input
										:checked="hiddenSpeakers.has(speaker)"
										type="checkbox"
										:value="speaker"
										@change="
											(e) => {
												if (e.target?.checked) hiddenSpeakers.add(speaker);
												else hiddenSpeakers.delete(speaker);
											}
										"
									/>
									{{ speaker }}
								</label>
							</div>
						</TabsContent>
						<TabsContent class="flex-grow overflow-y-auto min-h-0" value="search">
							<div class="p-4 w-full flex flex-col overflow-hidden">
								<form class="flex gap-4 items-end flex-shrink-0">
									<Label class="sr-only" for="search">Suche</Label>
									<div class="relative w-64">
										<Input
											id="search"
											v-model="searchInput"
											placeholder="Suchbegriff eingeben"
											type="text"
										/>
									</div>
									s
									<Button type="submit"> Suchen </Button>
								</form>
							</div>
						</TabsContent>
					</Tabs>
				</div>
			</div>

			<div class="relative overflow-y-hidden grid grid-rows-[1fr_auto]">
				<div
					v-if="transcript?.events && transcript.speakers"
					id="eventViewContainer"
					class="overflow-y-auto flex flex-col gap-4 border border-foreground/20 rounded-lg bg-muted"
				>
					<!-- eslint-disable-next-line vuejs-accessibility/media-has-caption -->
					<audio
						ref="audioRef"
						:src="transcript.audioUrl"
						@loadedmetadata="updateMetadata"
						@timeupdate="updateProgress"
					/>

					<div v-for="(block, blockIndex) in chunkedSpeakerEvents" :key="blockIndex" class="w-full">
						<div
							class="grid"
							:style="{
								gridTemplateColumns:
									'160px repeat(' + block[transcript.speakers[0]].length + ', max-content)',
							}"
						>
							<div class="pl-2 text-white bg-black font-bold text-sm rounded-tl">Zeitleiste</div>
							<div
								v-for="(event, idx) in block[transcript.speakers[0]]"
								:key="'header-' + idx"
								class="text-xs text-start py-1 text-white bg-black"
							>
								<div class="relative z-10 px-2">{{ event.start }} – {{ event.end }}</div>

								<div
									class="bg-accent-foreground z-20 h-full"
									:style="{
										width: (() => {
											const total = transcript.events.length; // total events in all rows
											const globalIndex = blockIndex * maxEventsPerRow + idx;

											const fullFillThreshold = (globalIndex + 1) / total;
											const prevFillThreshold = globalIndex / total;

											if (progressFraction >= fullFillThreshold) return '100%';
											else if (progressFraction <= prevFillThreshold) return '0%';
											else {
												const partial = (progressFraction - prevFillThreshold) * total;
												return (partial * 100).toFixed(2) + '%';
											}
										})(),
									}"
								></div>
							</div>

							<template
								v-for="speaker in transcript.speakers.filter((s) => !hiddenSpeakers.has(s))"
								:key="speaker"
							>
								<div
									class="text-sm font-semibold p-2 bg-gray-200 border-foreground/20 border min-h-[64px]"
								>
									<div class="flex flex-row justify-between">
										{{ speaker }}
										<div class="text-sm font-normal text-right pr-3 text-gray-500 h-full">
											<TooltipProvider>
												<Tooltip>
													<TooltipTrigger> o </TooltipTrigger>
													<TooltipContent> Standardorthografische Transkription </TooltipContent>
												</Tooltip>
											</TooltipProvider>
										</div>
									</div>
									<div v-if="showLu" class="text-sm font-normal text-right pr-3 text-gray-500">
										<TooltipProvider>
											<Tooltip>
												<TooltipTrigger> lu </TooltipTrigger>
												<TooltipContent> Lautorientierte Transkription </TooltipContent>
											</Tooltip>
										</TooltipProvider>
									</div>
									<div v-if="showPhon" class="text-sm font-normal text-right pr-3 text-gray-500">
										<TooltipProvider>
											<Tooltip>
												<TooltipTrigger> phon </TooltipTrigger>
												<TooltipContent> Phonetische Transkription </TooltipContent>
											</Tooltip>
										</TooltipProvider>
									</div>
								</div>

								<div
									v-for="(e, idx) in block[speaker]"
									:key="speaker + '-event-' + idx"
									class="h-full flex p-2 border rounded bg-white border-foreground/20 text-sm space-y-1 transition-transform duration-200 ease-in-out hover:scale-105 hover:border-foreground/80"
								>
									<Dialog>
										<DialogTrigger as-child class="h-full">
											<div
												class="grid gap-1 h-full"
												:style="{
													gridTemplateColumns: 'repeat(' + e.ortho.length + ', minmax(0, auto))',
												}"
											>
												<div
													v-for="(token, index) in e.ortho"
													:key="'token-group-' + index"
													class="grid grid-rows-[auto_1fr] items-end group hover:cursor-pointer h-full hover:bg-gray-100"
												>
													<div
														class="px-0.5 m-0 whitespace-nowrap py-0.5 text-start text-sm"
														:class="token.hasTags ? 'text-accent-foreground font-semibold' : ''"
													>
														{{ token.text }}
													</div>
													<div
														v-if="showLu"
														class="px-0.5 m-0 whitespace-nowrap py-0.5 text-start text-gray-600 text-sm"
														:class="
															e.lu[index]?.hasTags ? 'text-accent-foreground  font-semibold' : ''
														"
													>
														{{ e.lu[index]?.text }}
													</div>

													<div
														v-if="showPhon"
														class="px-0.5 m-0 whitespace-nowrappy-0.5 text-start text-gray-500 text-sm"
														:class="
															e.phon[index]?.hasTags ? 'text-accent-foreground  font-semibold' : ''
														"
													>
														{{ e.phon[index]?.text }}
													</div>

													<div
														class="h-1 flex w-full relative py-0.5 rounded bg-gray-300 transition-colors duration-200 group-hover:bg-accent-foreground group-hover:cursor-pointer"
													></div>
												</div>
											</div>
										</DialogTrigger>
										<DialogContent class="sm:max-w-[425px]">
											<DialogHeader>
												<DialogTitle>Details</DialogTitle>
												<DialogDescription>
													Hier finden Sie weitere Informationen
												</DialogDescription>
											</DialogHeader>
											<div>
												<div>
													<span class="font-semibold mr-1">Sprecher:</span>
													<span class="text-xs">{{ speaker }}</span>
												</div>

												<div class="border border-b w-full mt-2"></div>

												<p class="font-semibold mt-2">Tokens:</p>
												<p v-if="e.lu" class="italic text-sm mt-2">
													Standardorthografische Transkription:
												</p>
												<p>
													<span v-for="(token, i) in e.ortho" :key="i" class="mr-1 text-xs">
														{{ token.text }}
													</span>
												</p>

												<p v-if="e.lu" class="italic text-sm mt-2">
													Lautorientierte Transkription:
												</p>
												<p v-if="e.lu">
													<span v-for="(token, i) in e.lu" :key="i" class="mr-1 text-xs">
														{{ token.text }}
													</span>
												</p>

												<p v-if="e.phon" class="italic text-sm mt-2">Phonetische Transkription:</p>
												<p v-if="e.phon">
													<span v-for="(token, i) in e.phon" :key="i" class="mr-1 text-xs">
														{{ token.text }}
													</span>
												</p>
												<div class="border border-b w-full mt-2"></div>

												<p class="font-semibold mt-2">Annotationen:</p>
												<div class="mr-1 text-xs">loremipsum</div>

												<div class="border border-b w-full mt-2"></div>
											</div>
										</DialogContent>
									</Dialog>
								</div>
							</template>
						</div>
					</div>
				</div>
				<section
					class="bottom-0 border border-foreground/20 rounded w-full flex justify-center m-auto mt-6"
				>
					<div class="relative p-4 w-full rounded overflow-hidden">
						<!-- <AudioWaveform
							:audio="audioRef"
							class="absolute inset-0 w-full h-full z-0 bg-accent-foreground"
							:class="{ 'opacity-0 transition-opacity': !audioIsPlaying }"
							:is-playing="audioIsPlaying"
							:is-stopped="audioIsStopped"
						/> -->

						<div
							class="absolute inset-0 w-full h-full z-0"
							:class="{ 'opacity-0 transition-opacity': !audioIsPlaying }"
						>
							<AudioVisualizer
								:audio="audioRef"
								class="-z-50"
								:is-playing="audioIsPlaying"
								:is-stopped="audioIsStopped"
							/>
						</div>

						<div
							class="relative z-10 rounded p-2 h-full m-auto w-fit flex justify-center items-center gap-4 bg-none transition-all"
							:class="{ 'bg-white/80 hover:bg-white': audioIsPlaying }"
						>
							<Button variant="ghost" @click="togglePlayback">
								<PlayIcon v-if="!audioIsPlaying" :size="16" />
								<PauseIcon v-else :size="16" />
							</Button>
							<Button variant="ghost" @click="stopPlayback">
								<SquareIcon :size="16" />
							</Button>
							<span :class="audioIsPlaying ? `text-black/50` : `text-foreground/20`">|</span>
							<Button variant="ghost">
								<DownloadIcon :size="16" />
							</Button>
						</div>
					</div>
				</section>
			</div>
		</div>
	</main>
</template>
