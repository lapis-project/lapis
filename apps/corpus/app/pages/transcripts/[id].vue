<!-- eslint-disable vuejs-accessibility/media-has-caption -->
<script setup lang="ts">
import {
	ChevronRight,
	DownloadIcon,
	FileText,
	PauseIcon,
	PlayIcon,
	SquareIcon,
} from "lucide-vue-next";

import { useAudioController } from "@/composables/use-audio-controller";

definePageMeta({
	layout: "tool",
});

const route = useRoute();

const currentId = ref<number | null>(null);

// const { response, isPending, refreshTranscripts } = useTranscript(currentId, "json");

const {
	response: previewResponse,
	isPending: previewIsPending,
	refreshTranscripts: refreshPreview,
} = useTranscriptPreview(currentId);

const speakerIds = computed(() => {
	return transcriptFileData.value?.map((sp) => sp.informant) ?? [];
});

const transcriptMetadata = computed(() => {
	return previewResponse.value?.metadata[0];
});

const transcriptFileData = computed(() => {
	console.log(previewResponse.value?.fileData.data);
	return previewResponse.value?.fileData.data;
});

const env = useRuntimeConfig();

const hiddenSpeakers = ref<Set<number>>(new Set());

const showLu = ref(false);
const showPhon = ref(false);

const { audioRef, bind } = useAudioController();

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

const searchInput = ref("");

const isScrubbing = ref(false);
const scrub = ref(0); // slider’s own value
const isReady = ref(false);

function updateMetadata() {
	if (!audioRef.value) return;
	duration.value = Number.isFinite(audioRef.value.duration) ? audioRef.value.duration : 0;
	currentTime.value = audioRef.value.currentTime || 0;
	scrub.value = currentTime.value; // keep slider in sync initially
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
	if (isScrubbing.value) return;
	currentTime.value = scrub.value;
}

function togglePlayback() {
	if (!audioRef.value) return;

	if (!waveformReady.value) {
		console.log("loading...");
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
	const base = env.public.apiBaseUrl;
	const name = "returnofsherlockholmes";
	return new URL(`/audio/stream/${name}`, base).toString();
});

onMounted(() => {
	const val = route.params.id;
	const selection = Array.isArray(val) ? Number(val[0]) : (Number(val) ?? currentId.value);
	currentId.value = isNaN(selection) ? null : selection;
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

watch(
	() => route.params.id,
	(val) => {
		const selection = Array.isArray(val) ? Number(val[0]) : (Number(val) ?? null);
		currentId.value = isNaN(selection) ? null : selection;
	},
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
						<div class="text-normal text-sm items-center mb-1 inline-flex gap-2">
							<FileText class="size-4" />
							Transkript
						</div>
						<h1 class="text-lg font-bold">Transkript {{ transcriptMetadata?.transcript_id }}</h1>
						<div class="flex flex-wrap py-2">
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
										v-for="(speaker, index) in speakerIds"
										:key="index"
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
				<div id="transcriptContainer" class="min-h-0 h-full grid grid-rows-[1fr_auto]">
					<TranscriptViewer
						id="transcriptViewer"
						:file-data="transcriptFileData"
						:speaker-ids="speakerIds"
						:hidden-speakers="hiddenSpeakers"
						:show-lu="showLu"
						:showPhon="showPhon"
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
								:audio="audioRef"
								class="absolute inset-0 w-full h-full z-0 bg-black"
								:class="{ 'opacity-0 transition-opacity': !audioIsPlaying || !waveformReady }"
								:is-playing="audioIsPlaying"
								:is-scrubbing="isScrubbing"
								:is-stopped="audioIsStopped"
								:scrub="scrub"
								@commit-scrub="commitScrub"
								@ready="
									waveformReady = true;
									isLoading = false;
									togglePlayback();
								"
								@update:scrub="updateScrub"
							/>

							<div
								class="relative z-10 rounded p-2 h-full m-auto w-fit flex justify-center items-center gap-4 bg-none transition-all"
								:class="{ 'bg-white/80 hover:bg-white': audioIsPlaying }"
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
								<span :class="audioIsPlaying ? `text-black/50` : `text-foreground/20`">|</span>
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
