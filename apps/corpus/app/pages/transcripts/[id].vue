<!-- eslint-disable vuejs-accessibility/media-has-caption -->
<script setup lang="ts">
import {
	ChevronRight,
	ChevronLeft,
	DownloadIcon,
	FileText,
	PauseIcon,
	PlayIcon,
	SquareIcon,
	X,
} from "@lucide/vue";

import { useAudioStream } from "@/composables/use-audio-controller";
import { useActiveFilterTags } from "@/composables/use-filter-tags";
import { useHitsPerTranscript } from "@/composables/use-hits-per-transcript";
import type { SearchParams } from "@/types/api";

definePageMeta({
	layout: "tool",
});

const route = useRoute();
const { filterParams, hasKwicSearch } = useActiveFilterTags();
const {
	response: hitsResponse,
	isPending,
	fetchTranscriptHits,
	generateCacheKey,
} = useHitsPerTranscript(2);

const currentId = computed<number | null>(() => {
	const value = route.params.id;
	const selection = Array.isArray(value) ? Number(value[0]) : Number(value);
	return Number.isNaN(selection) ? null : selection;
});

const transcriptViewer = useTemplateRef("transcriptViewer");
const currentHighlightIndex = ref(0);

const { response: previewResponse, isPending: previewIsPending } = useTranscriptPreview(currentId);

const speakerIds = computed(() => {
	return previewResponse.value?.unique_informant_ids.map((sp) => sp) ?? [];
});

const transcriptMetadata = computed(() => {
	return previewResponse.value?.metadata[0];
});

const transcriptFileData = computed(() => {
	return previewResponse.value?.transcript_data;
});

const env = useRuntimeConfig();

const hiddenSpeakers = ref<Set<number>>(new Set());

const showLu = ref(false);
const showPhon = ref(false);

const { audioRef, bind } = useAudioStream();

const showFirstColumn = ref(true);

const toggleFirstColumn = () => {
	showFirstColumn.value = !showFirstColumn.value;
};

const audioIsStopped = ref(false);
const audioIsPlaying = ref(false);
const isLoading = ref(false);

const gridColumns = computed(() => {
	return [showFirstColumn.value ? "340px" : "0px", "1fr"].join(" ");
});

let timer: ReturnType<typeof setTimeout> | null = null;

const currentTime = ref(0);
const duration = ref(0);

const waveformReady = ref(false);
const waveformFailed = ref(false);

const searchInput = ref("");

const isScrubbing = ref(false);
const scrub = ref(0);
const isReady = ref(false);

function updateMetadata() {
	if (!audioRef.value) return;
	duration.value = Number.isFinite(audioRef.value.duration) ? audioRef.value.duration : 0;
	currentTime.value = audioRef.value.currentTime || 0;
	scrub.value = currentTime.value;
	isReady.value = duration.value > 0;
}

function commitScrub() {
	isScrubbing.value = false;

	if (audioIsPlaying.value && audioRef.value?.paused) {
		audioRef.value.play().catch(() => {});
	}
}

function updateScrub(newTime: number) {
	scrub.value = newTime;
	currentTime.value = newTime;
}

function updateProgress() {
	if (isScrubbing.value || !audioRef.value) return;
	currentTime.value = audioRef.value.currentTime;
	scrub.value = currentTime.value;
}

function togglePlayback() {
	if (!audioRef.value) return;

	if (!waveformReady.value && !waveformFailed.value) {
		isLoading.value = true;
		return;
	}

	isLoading.value = false;
	if (audioRef.value.paused) {
		audioRef.value.play();
		audioIsPlaying.value = true;
	} else {
		audioRef.value.pause();
		audioIsPlaying.value = false;
	}
}

function handleWaveformReady() {
	const shouldStartPlayback = isLoading.value;
	waveformReady.value = true;
	waveformFailed.value = false;
	isLoading.value = false;
	if (shouldStartPlayback) togglePlayback();
}

function handleWaveformError() {
	const shouldStartPlayback = isLoading.value;
	waveformReady.value = false;
	waveformFailed.value = true;
	isLoading.value = false;
	if (shouldStartPlayback) togglePlayback();
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

function resetAudio() {
	audioIsPlaying.value = false;
	currentTime.value = 0;
}

const audioSrc = computed(() => {
	if (currentId.value == null) return undefined;
	const base = env.public.apiBaseUrl;
	return new URL(`/audio/stream/${currentId.value}`, base).toString();
});

onUnmounted(() => {
	if (audioRef.value) {
		audioRef.value.removeEventListener("ended", resetAudio);
	}
});

onScopeDispose(() => {
	if (timer != null) {
		clearTimeout(timer);
	}
});

watch(currentId, () => {
	waveformReady.value = false;
	waveformFailed.value = false;
	isLoading.value = false;
	audioIsPlaying.value = false;
	currentTime.value = 0;
	scrub.value = 0;
});

const currentTranscriptHits = computed(() => {
	if (currentId.value == null) return null;
	const key = generateCacheKey(currentId.value, filterParams.value);
	return hitsResponse.value[key] ?? null;
});

const kwicTokens = computed(() => {
	return (
		currentTranscriptHits.value?.kwic?.Lines?.flatMap((line) =>
			(line.Kwic ?? []).map((token) => ({
				toknum: line.toknum,
				text: token.str,
			})),
		) ?? []
	);
});

watch(
	currentId,
	async (id) => {
		if (id == null) return;
		await fetchTranscriptHits(id, filterParams.value);
	},
	{ immediate: true },
);

watch(
	filterParams,
	async (params) => {
		if (currentId.value == null) return;
		await fetchTranscriptHits(currentId.value, params);
	},
	{ deep: true },
);

const hits = computed(() => {
	return Number(
		(currentTranscriptHits.value as { kwic?: { concsize?: number | null } } | null)?.kwic
			?.concsize ?? 0,
	);
});

watch(
	[hasKwicSearch, transcriptFileData],
	async ([hasSearch, fileData]) => {
		if (!hasSearch || !fileData) return;

		await nextTick();
		transcriptViewer.value?.jumpToNextHighlight();
	},
	{ immediate: true },
);
</script>

<template>
	<main class="max-w-full flex flex-col container py-8 pt-4 flex flex-col !overflow-y-hidden">
		<div v-if="previewIsPending" class="item-center m-auto">
			<Spinner />
		</div>
		<div v-else class="flex flex-1 min-h-0">
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
						<h1 class="text-lg font-bold pt-3">
							{{ transcriptMetadata?.transcript_name }}
						</h1>
						<div class="flex flex-wrap pt-2 pb-4">
							<TooltipProvider>
								<Tooltip>
									<TooltipTrigger>
										<span
											v-if="transcriptMetadata?.place_name"
											class="border text-xs mr-2 px-2.5 py-0.5 rounded hover:bg-gray-50"
										>
											{{ transcriptMetadata.place_name }}
										</span>
									</TooltipTrigger>
									<TooltipContent> Ort </TooltipContent>
								</Tooltip>
							</TooltipProvider>

							<TooltipProvider>
								<Tooltip>
									<TooltipTrigger>
										<span
											v-if="transcriptMetadata?.survey_type_name"
											class="border text-xs mr-2 px-2.5 py-0.5 rounded hover:bg-gray-50"
										>
											{{ transcriptMetadata.survey_type_name }}
										</span>
									</TooltipTrigger>
									<TooltipContent> Setting </TooltipContent>
								</Tooltip>
							</TooltipProvider>
						</div>

						<Tabs class="w-full flex flex-col flex-grow min-h-0" default-value="filter">
							<TabsList class="w-full flex-shrink-0">
								<TabsTrigger value="info"> Info </TabsTrigger>
								<TabsTrigger value="filter"> Filter </TabsTrigger>
								<TabsTrigger value="search"> Suche </TabsTrigger>
							</TabsList>
							<TabsContent class="flex-grow overflow-y-auto min-h-0" value="info">
								<div class="hyphens-auto">
									Lorem ipsum dolor sit amet, consetetur sadipscing elitr, sed diam nonumy eirmod
									tempor invidunt ut labore et dolore magna aliquyam erat, sed diam voluptua. At
									vero eos et accusam et justo duo dolores et ea rebum. Stet clita kasd gubergren,
									no sea takimata sanctus est Lorem ipsum dolor sit amet. Lorem ipsum dolor sit
									amet, consetetur sadipscing elitr, sed diam nonumy eirmod tempor invidunt ut
									labore et dolore magna aliquyam erat, sed diam voluptua. At vero eos et accusam et
									justo duo dolores et ea rebum. Stet clita kasd gubergren, no sea takimata sanctus
									est Lorem ipsum dolor sit amet. Lorem ipsum dolor sit amet, consetetur sadipscing
									elitr, sed diam nonumy eirmod tempor invidunt ut labore et dolore magna aliquyam
									erat, sed diam voluptua. At vero eos et accusam et justo duo dolores et ea rebum.
									Stet clita kasd gubergren, no sea takimata sanctus est Lorem ipsum dolor sit amet.
									Duis autem vel eum iriure dolor in hendrerit in vulputate velit esse molestie
									consequat, vel illum dolore eu feugiat nulla facilisis at vero eros et accumsan et
									iusto odio dignissim qui blandit praesent luptatum zzril delenit augue duis dolore
									te feugait nulla facilisi. Lorem ipsum dolor sit amet, consectetuer adipiscing
									elit, sed diam nonummy nibh euismod tincidunt ut laoreet dolore magna aliquam erat
									volutpat.
								</div>
							</TabsContent>
							<TabsContent class="flex-grow overflow-y-auto min-h-0 p-2" value="filter">
								<FilterBadgeList />
								<div
									v-if="hasKwicSearch"
									class="mb-3 rounded border border-foreground/10 bg-muted/40 p-2"
								>
									<p class="text-[10px] uppercase tracking-wide text-gray-500">KWIC-Treffer</p>
									<div v-if="isPending(currentId!, filterParams)" class="item-center m-auto py-2">
										<Spinner />
									</div>
									<div v-else class="mt-1 flex items-baseline justify-between gap-2">
										<span class="text-lg font-semibold text-accent-foreground">{{ hits }}</span>

										<div v-if="currentHighlightIndex !== 0" class="flex items-center gap-1">
											<Button
												variant="ghost"
												size="icon"
												class="size-7"
												:disabled="!hits"
												@click="transcriptViewer?.jumpToPreviousHighlight()"
											>
												<ChevronLeft class="size-4" />
											</Button>

											<span class="text-xs text-muted-foreground mr-1">
												{{ currentHighlightIndex || 0 }}/{{ hits }}
											</span>

											<Button
												variant="ghost"
												size="icon"
												class="size-7"
												:disabled="!hits"
												@click="transcriptViewer?.jumpToNextHighlight()"
											>
												<ChevronRight class="size-4" />
											</Button>
										</div>
									</div>
								</div>

								<div class="pb-4 rounded border-t border-b border-foreground/10">
									<p class="pt-2 text-xs text-gray-500">Word / Lemma / POS</p>
									<SearchKwic />
								</div>

								<div class="flex flex-col gap-2 pt-2 text-sm">
									<p class="text-xs text-gray-500">Spuren</p>

									<div class="flex items-center gap-2 py-1">
										<Checkbox id="show-lu" v-model="showLu" />
										<Label for="show-lu">Lautorientierte Transkription (lu)</Label>
									</div>

									<div class="flex items-center gap-2 py-1">
										<Checkbox id="show-phon" v-model="showPhon" />
										<Label for="show-phon">Phonetische Transkription (phon)</Label>
									</div>
								</div>
								<hr class="my-2 border-foreground/10" />
								<p class="text-xs text-gray-500 pb-3">Sprecher:innen</p>

								<div class="flex flex-col gap-3 pl-1">
									<div
										v-for="(speaker, index) in speakerIds"
										:key="index"
										class="flex items-center gap-2"
									>
										<Checkbox
											:id="`speaker-${speaker}`"
											:model-value="!hiddenSpeakers.has(speaker)"
											@update:model-value="
												(value: boolean | 'indeterminate') => {
													if (value === true) hiddenSpeakers.delete(speaker);
													else hiddenSpeakers.add(speaker);
												}
											"
										/>
										<Label :for="`speaker-${speaker}`">
											{{ speaker }}
										</Label>
									</div>
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
				<div id="transcriptContainer" class="min-h-0 h-full grid grid-rows-[1fr_auto]">
					<TranscriptViewer
						ref="transcriptViewer"
						id="transcriptViewer"
						:file-data="transcriptFileData"
						:speaker-ids="speakerIds"
						:hidden-speakers="hiddenSpeakers"
						:show-lu="showLu"
						:showPhon="showPhon"
						:kwic-tokens="kwicTokens"
						@update:current-highlight-index="currentHighlightIndex = $event"
					/>
					<section
						id="audioPlayer"
						class="bottom-0 border border-foreground/20 rounded w-full flex justify-center m-auto mt-6"
					>
						<ClientOnly>
							<audio
								:ref="(el) => bind(el as HTMLAudioElement)"
								preload="metadata"
								:src="audioSrc"
								@loadedmetadata="updateMetadata"
								@timeupdate="updateProgress"
							>
								<track kind="captions" />
							</audio>
						</ClientOnly>
						<div class="relative p-4 w-full rounded overflow-hidden">
							<AudioWaveform
								v-if="currentId != null"
								:key="currentId"
								:id="currentId"
								:audio="audioRef"
								class="absolute inset-0 w-full h-full z-0 bg-black transition-opacity"
								:class="{ 'opacity-0': !waveformReady }"
								:is-playing="audioIsPlaying"
								:is-scrubbing="isScrubbing"
								:is-stopped="audioIsStopped"
								:scrub="scrub"
								@commit-scrub="commitScrub"
								@error="handleWaveformError"
								@ready="handleWaveformReady"
								@time-change="updateScrub"
								@update:scrub="updateScrub"
							/>

							<div
								class="relative z-10 rounded p-2 h-full m-auto w-fit flex justify-center items-center gap-4 bg-white/80 text-black transition-all hover:bg-white"
							>
								<Button variant="ghost" @click="togglePlayback">
									<PlayIcon v-if="!audioIsPlaying && !isLoading" :size="16" />
									<div v-if="isLoading" class="w-full h-full z-0 pt-1">
										<div
											class="w-4 h-4 border-2 border-foreground/20 border-t-transparent rounded-full animate-spin"
										></div>
									</div>
									<PauseIcon v-if="audioIsPlaying" :size="16" />
								</Button>
								<Button
									variant="ghost"
									@click="
										stopPlayback();
										isLoading = false;
									"
								>
									<SquareIcon :size="16" />
								</Button>
								<span class="text-black/50">|</span>
								<Button variant="ghost">
									<DownloadIcon :size="16" />
								</Button>
							</div>
						</div>
					</section>
				</div>
			</div>
		</div>
	</main>
</template>
