<script setup lang="ts">
import { ChevronRight, DownloadIcon, FileText, PauseCircle, PlayCircle } from "lucide-vue-next";
import { Separator } from "reka-ui";

import data from "@/transcripts-demo.json";

definePageMeta({
	layout: "corpus",
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
	audioUrl: string;
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

const audioIsPlaying = ref(false);

const gridColumns = computed(() => {
	return [showFirstColumn.value ? "340px" : "0px", "1fr"].join(" ");
});

// function formatTime(seconds: number) {
// 	const m = Math.floor(seconds / 60);
// 	const s = Math.floor(seconds % 60);
// 	return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
// }

const windowWidth = ref(window.innerWidth ?? 0);
const hiddenSpeakers = ref<Set<string>>(new Set());
const eventWidth = 240;

function handleResize() {
	windowWidth.value = window.innerWidth;
}

onMounted(() => {
	window.addEventListener("resize", handleResize);
});

onUnmounted(() => {
	window.removeEventListener("resize", handleResize);
});

const chunkedSpeakerEvents = computed(() => {
	if (!transcript.value) return [];

	const maxEventsPerRow = Math.floor(windowWidth.value / eventWidth);
	const speakers = transcript.value!.speakers;

	const events = transcript.value.events;
	const totalChunks = Math.ceil(events.length / maxEventsPerRow);

	const chunks = [];
	for (let chunkIndex = 0; chunkIndex < totalChunks; chunkIndex++) {
		const chunkStart = chunkIndex * maxEventsPerRow;
		const chunkEnd = chunkStart + maxEventsPerRow;
		const chunkEvents = events.slice(chunkStart, chunkEnd);

		const speakerMap: Record<string, Array<Event>> = {};
		speakers?.forEach((s) => (speakerMap[s] = []));

		chunkEvents.forEach((event) => {
			speakers?.forEach((speakerName: string) => {
				const speakerEntry = event.speakers.find((s) => s.name === speakerName);
				const tokens = speakerEntry?.tokens ?? [];

				// Join token texts for each mode
				const getTokens = (mode: "ortho" | "lu" | "phon") =>
					tokens
						.map((t) => ({
							text: t[mode]?.text ?? "",
							hasTags: (t[mode]?.tags?.length ?? 0) > 0,
						}))
						.filter((tok) => tok.text.trim() !== "");

				speakerMap[speakerName]?.push({
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
	if (audioRef.value) {
		audioRef.value.addEventListener("ended", resetAudio);
	}
});

onUnmounted(() => {
	if (audioRef.value) {
		audioRef.value.removeEventListener("ended", resetAudio);
	}
});
</script>

<template>
	<main class="max-w-full container py-8 pt-4 flex flex-col">
		<div class="h-fit">
			<Button size="icon" variant="outline" @click="toggleFirstColumn">
				<ChevronRight class="size-4" :class="{ 'rotate-180': showFirstColumn }" />
			</Button>
		</div>
		<div
			class="relative gap-4 pt-2 overflow-y-scroll flex-grow grid min-h-0 duration-250 delay-150 transition-[grid-template-columns] ease-in-out"
			:style="{ gridTemplateColumns: gridColumns }"
		>
			<div
				class="h-full border border-foreground/20 rounded"
				:class="{ 'opacity-0 pointer-events-none': !showFirstColumn }"
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
									Literal Utterance (lu)
								</label>
								<label class="flex items-center gap-2">
									<input v-model="showPhon" type="checkbox" />
									Phonographic (ph)
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
									<Button type="submit"> Suchen </Button>
								</form>
							</div>
						</TabsContent>
					</Tabs>
				</div>
			</div>
			<div v-if="transcript?.events && transcript.speakers" class="flex flex-col gap-4">
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
								'160px repeat(' + block[transcript.speakers[0]].length + ', 1fr)',
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
										const total = block[transcript.speakers[0]].length;
										const fullFillThreshold = (idx + 1) / total;
										const prevFillThreshold = idx / total;

										if (progressFraction >= fullFillThreshold) return '100%';
										else if (progressFraction <= prevFillThreshold) return '0%';
										else {
											// Partial fill inside this event block
											const partial = (progressFraction - prevFillThreshold) * total;
											return (partial * 100).toFixed(2) + '%';
										}
									})(),
								}"
							></div>
						</div>
					</div>
					<div
						v-for="speaker in transcript.speakers.filter((s) => !hiddenSpeakers.has(s))"
						:key="speaker"
						class="grid"
						:style="{ gridTemplateColumns: '160px repeat(' + block[speaker].length + ', 1fr)' }"
					>
						<div
							class="text-sm font-semibold p-2 bg-gray-100 border-foreground/20 border min-h-[64px]"
						>
							<div class="flex flex-row justify-between">
								{{ speaker }}
								<div class="text-sm font-normal text-right pr-3 text-gray-500">o</div>
							</div>
							<div class="text-sm font-normal text-right pr-3 text-gray-500">lu</div>
							<div class="text-sm font-normal text-right pr-3 text-gray-500">ph</div>
						</div>
						<div
							v-for="(e, idx) in block[speaker]"
							:key="idx"
							class="p-2 border rounded bg-white border-foreground/20 text-sm truncate hover:bg-gray-50"
						>
							<Dialog>
								<DialogTrigger as-child>
									<div class="text-sm size-full hover:bg-gray-50 cursor-pointer">
										<div v-if="e.ortho">
											<span
												v-for="(token, index) in e.ortho"
												:key="index"
												:class="
													token.hasTags
														? 'text-accent-foreground font-semibold pl-1'
														: 'text-gray-700 pl-1'
												"
											>
												{{ token.text }}
											</span>
										</div>
										<div v-else class="italic text-gray-300">-</div>
										<div v-if="showLu && e.lu" class="text-sm mt-1">
											<span
												v-for="(token, index) in e.lu"
												:key="index"
												:class="
													token.hasTags ? 'text-accent-foreground pl-1' : 'text-gray-400 pl-1'
												"
											>
												{{ token.text }}
											</span>
										</div>
										<div v-else class="italic text-gray-300">–</div>
										<div v-if="showPhon && e.phon" class="text-sm mt-0.5">
											<span
												v-for="(token, index) in e.phon"
												:key="index"
												:class="
													token.hasTags ? 'text-accent-foreground pl-1' : 'text-gray-400 pl-1'
												"
											>
												{{ token.text }}
											</span>
										</div>
										<div v-else class="italic text-gray-300">–</div>
									</div>
								</DialogTrigger>
								<DialogContent class="sm:max-w-[425px]">
									<DialogHeader>
										<DialogTitle>Details</DialogTitle>
										<DialogDescription> Hier finden Sie weitere Informationen </DialogDescription>
									</DialogHeader>
									<div>
										<div>
											<span class="font-semibold mr-1">Sprecher:</span>
											<span class="text-xs">{{ speaker }}</span>
										</div>

										<div class="border border-b w-full mt-2"></div>

										<p class="font-semibold mt-2">Tokens:</p>
										<p v-if="e.lu" class="italic text-sm mt-2">Ortho Tokens:</p>
										<p>
											<span v-for="(token, i) in e.ortho" :key="i" class="mr-1 text-xs">
												{{ token.text }}
											</span>
										</p>

										<p v-if="e.lu" class="italic text-sm mt-2">LU Tokens:</p>
										<p v-if="e.lu">
											<span v-for="(token, i) in e.lu" :key="i" class="mr-1 text-xs">
												{{ token.text }}
											</span>
										</p>

										<p v-if="e.phon" class="italic text-sm mt-2">PHON Tokens:</p>
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
					</div>
				</div>

				<Separator />
				<section class="absolute bottom-0 w-full flex justify-center m-auto mt-6">
					<div class="bg-gray-50 border rounded flex justify-center items-center gap-4 p-4 w-2xl">
						<Button class="cursor-pointer" variant="transparent" @click="togglePlayback">
							<PlayCircle v-if="!audioIsPlaying" />
							<PauseCircle v-else />
						</Button>
						<DownloadIcon></DownloadIcon>
					</div>
				</section>
			</div>
		</div>
	</main>
</template>
