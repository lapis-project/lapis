<script lang="ts" setup>
import type { StringifyOptions } from "node:querystring";

import { BookmarkIcon, ChevronLeft, ChevronRight, CopyIcon, Download } from "@lucide/vue";
import { toast } from "vue-sonner";

import initialData from "@/assets/data/transcripts-demo.json";
import type {
	APITranscript,
	APITranscriptsWithBookmark,
	KwicLine,
	SearchParams,
} from "@/types/api";

definePageMeta({
	layout: "tool",
});

const route = useRoute();
const router = useRouter();

const filterOpen = ref(false);

const currentSearchParams = ref<SearchParams | null>(null);

const bookmarkedIds = ref<Array<string>>([]);

const { response: searchResponse, search, status, isPending } = useSearch(2);

const transcripts = computed(() => {
	if (route.query.gender === "divers") return null;
	return searchResponse.value?.transcripts;
});

function getTranscriptIdFromRefs(references: Array<string> | undefined) {
	for (const reference of references ?? []) {
		const match = /(?:^|\W)transcript_(\d+)(?:\W|$)/i.exec(reference);
		if (!match?.[1]) continue;
		const id = Number(match[1]);
		if (Number.isSafeInteger(id)) return id;
	}
	return null;
}

const currentPageKwicByTranscript = computed(() => {
	const grouped: Record<string, Array<KwicLine>> = {};
	for (const line of kwic.value?.Lines ?? []) {
		const transcriptId =
			getTranscriptIdFromRefs(line.Tbl_refs) ?? getTranscriptIdFromRefs(line.Refs) ?? null;
		if (transcriptId == null) continue;
		const key = String(transcriptId);
		grouped[key] = [...(grouped[key] ?? []), line];
	}
	return grouped;
});

const currentPageTranscriptIds = computed(() => {
	return new Set(
		Object.keys(currentPageKwicByTranscript.value)
			.map((key) => Number(key))
			.filter(Number.isSafeInteger),
	);
});

const displayTranscripts = computed(() => {
	const currentPageIds = currentPageTranscriptIds.value;
	const hasCurrentKwicPage = kwic.value?.Lines != null && kwic.value.Lines.length > 0;
	const filtered = (transcripts.value ?? []).filter((result) => {
		if (!hasCurrentKwicPage) return true;
		return result.instance_id != null && currentPageIds.has(Number(result.instance_id));
	});

	return filtered.map((result) => ({
		...result,
		bookmarked: bookmarkedIds.value.includes(String(result.instance_id)),
	})) as APITranscriptsWithBookmark;
});

const matchesByTranscript = computed(() => {
	return searchResponse.value?.matchesByTranscript;
});

const kwic = computed(() => {
	return searchResponse.value?.kwic;
});

const limit = 50;
const totalPages = computed(() => {
	return kwic.value?.concsize ? Math.ceil(kwic.value.concsize / limit) : 0;
});

const currentPage = computed({
	get: () => Number(route.query.page ?? 1),
	set: (page: number) => {
		const safePage = Math.min(Math.max(page, 1), totalPages.value || 1);
		router.push({
			query: {
				...route.query,
				page: String(safePage),
				fromp: String(safePage),
			},
		});
	},
});

const searchResults = ref<Array<APITranscript>>(initialData.transcripts);
const showFirstColumn = ref(true);
const showThirdColumn = ref(true);

const toggleFirstColumn = () => {
	showFirstColumn.value = !showFirstColumn.value;
};

const toggleThirdColumn = () => {
	showThirdColumn.value = !showThirdColumn.value;
};

const gridColumns = computed(() =>
	[
		showFirstColumn.value ? "340px" : "0px",
		"minmax(0, 1fr)",
		showThirdColumn.value ? "340px" : "0px",
	].join(" "),
);

const currentId = computed(() => {
	return route.query.selection;
});

function handleSelection(id: string) {
	router.push({ query: { ...route.query, selection: id } });
}

function handleBookmark(transcript: APITranscriptsWithBookmark[number]) {
	const id = transcript.instance_id;
	if (!id) return;

	if (transcript.bookmarked) {
		bookmarkedIds.value = bookmarkedIds.value.filter((i) => i !== String(id));
		transcript.bookmarked = false;
		toast.info("Das Transcript wurde aus Ihrer Bibliothek entfernt!");
	} else {
		bookmarkedIds.value.push(String(id));
		transcript.bookmarked = true;
		toast.info("Das Transcript wurde zu Ihrer Bibliothek hinzugefügt!");
	}

	// Save updated array to localStorage
	localStorage.setItem("transcript-bookmarks", JSON.stringify(bookmarkedIds.value));
}

onMounted(async () => {
	await nextTick();
	const saved = localStorage.getItem("transcript-bookmarks");
	if (saved) {
		bookmarkedIds.value = saved ? (JSON.parse(saved) as Array<string>) : [];
	}
});

watch(
	() => {
		return route.query.selection;
	},
	() => {
		if (route.query.selection != null) {
			showThirdColumn.value = true;
		}
	},
	{ immediate: true },
);

watch(
	() => route.query,
	async (q) => {
		const filters: SearchParams = {
			word: q.word as string,
			query: q.query as string,
			lemma: q.lemma as string,
			pos: q.pos as string,
			mode: (q.mode as "simple" | "regex") ?? "simple",
			feats: q.feats as string,
			fromp: (q.fromp as string) ?? "1",
			pagesize: String(limit),
			locations: [Number(q.locations)],
			state: q.state ? Number(q.state) : undefined,
			gender: q.gender ? (q.gender as string) : undefined,
			dialect_competence: q.dialect_competence ? Number(q.dialect_competence) : undefined,
			standard_competence: q.standard_competence ? Number(q.standard_competence) : undefined,
			age_lower: q.age_lower ? Number(q.age_lower) : undefined,
			age_upper: q.age_upper ? Number(q.age_upper) : undefined,
			projects: q.projects ? [Number(q.projects)] : undefined,
			settings: q.settings ? [Number(q.settings)] : undefined,
			transcript_name: q.transcript_name ? String(q.transcript_name) : undefined,
			transcript_ids: q.instance_id ? [Number(q.instance_id)] : undefined,
			has_bkms: q.has_bkms === "true",
		};
		const hasSearchFilters = Object.values(filters).some((value) => {
			if (value === undefined || value === null) {
				return false;
			}
			if (Array.isArray(value)) {
				return value.length > 0;
			}
			return true;
		});

		if (hasSearchFilters) {
			await search(filters);
			currentSearchParams.value = filters;
		}
	},
	{
		immediate: true,
		deep: true,
	},
);

const hasKwicSearch = computed(() => {
	const q = route.query;
	return Boolean(q.word || q.query || q.lemma || q.pos || q.feats || q.comment_search || q.mode);
});

const kwicTranscriptResults = computed(() => {
	if (!kwic.value || !transcripts.value) return [];
	return transcripts.value.filter(
		(result) =>
			result.instance_id != null &&
			(kwic.value?.Lines ?? []).some((line) => {
				const transcriptId =
					getTranscriptIdFromRefs(line.Tbl_refs) ?? getTranscriptIdFromRefs(line.Refs) ?? null;
				return transcriptId != null && Number(result.instance_id) === transcriptId;
			}),
	);
});
</script>

<template>
	<main class="max-w-full container py-8 pt-4 flex flex-col overflow-hidden" :tabindex="-1">
		<Button
			class="fixed z-10 flex items-center border rounded-none rounded-br-md rounded-tr-md border-foreground/20 justify-center py-0 px-1 transition-all shadow-md duration-250 delay-150"
			:class="showFirstColumn ? 'left-[371px]' : 'left-0'"
			variant="ghost"
			@click="toggleFirstColumn"
		>
			<ChevronRight class="size-4" :class="{ 'rotate-180': showFirstColumn }" />
		</Button>
		<Button
			class="fixed z-10 flex items-center border rounded-none rounded-bl-md rounded-tl-md border-foreground/20 justify-center py-0 px-1 transition-all shadow-md duration-250 delay-150"
			:class="showThirdColumn ? 'right-[371px]' : 'right-0'"
			variant="ghost"
			@click="toggleThirdColumn"
		>
			<ChevronLeft class="size-4" :class="{ 'rotate-180': showThirdColumn }" />
		</Button>
		<div
			class="relative gap-10 flex-grow grid grid-cols-1 h-full min-h-0 duration-250 items-stretch delay-150 transition-[grid-template-columns] ease-in-out"
			:data-selection="currentId != null ? 'true' : undefined"
			:style="{ gridTemplateColumns: gridColumns }"
		>
			<div
				class="p-4 border border-foreground/20 rounded-b-lg rounded-tl-lg flex flex-col overflow-hidden"
				:class="{ 'opacity-0 pointer-events-none transition-all': !showFirstColumn }"
			>
				<FilterSidebar
					:transcripts="searchResults"
					@handle-bookmark="handleBookmark"
					@handle-selection="handleSelection"
				/>
			</div>

			<div class="p-4 w-full border border-foreground/20 rounded-lg flex flex-col overflow-hidden">
				<div class="flex flex-col flex-grow min-h-0 overflow-hidden">
					<div v-if="isPending" class="justify-center flex m-auto">
						<Spinner />
					</div>
					<div class="w-full flex flex-col flex-grow min-h-0 overflow-y-auto">
						<div class="grid grid-cols-[auto_1fr] mt-2 mb-5 pb-5 items-center mx-2 border-b">
							<p class="text-lg">
								Ergebnisse
								<span class="text-sm text-muted-foreground"
									>({{ searchResponse?.transcripts.length }})</span
								>
							</p>
						</div>
						<div v-if="!isPending && transcripts != null && transcripts.length > 0" class="w-full">
							<TranscriptResults
								:transcripts="displayTranscripts"
								:transcript-hit-counts="matchesByTranscript ?? {}"
								:has-kwic-search="hasKwicSearch"
								:current-search-params="currentSearchParams"
								@select="handleSelection"
								@bookmark="handleBookmark"
							/>
						</div>
						<!-- <div
							v-else-if="
								!isPending && transcripts != null && transcripts.length > 0 && hasKwicSearch
							"
							class="w-full"
						>
							<KwicTranscriptResults
								:kwic="kwic ?? {}"
								:transcripts="matchesByTranscript ?? {}"
								:bookmarked-ids="bookmarkedIds"
								@select="handleSelection"
								@bookmark="handleBookmark"
							/>
						</div> -->

						<div v-else class="text-md text-muted-foreground justify-center flex m-auto">
							Keine Ergebnisse vorhanden.
						</div>
					</div>
				</div>
			</div>
			<div
				class="transition p-4 border border-foreground/20 rounded-b-lg rounded-tr-lg flex flex-col overflow-hidden"
				:class="{ 'opacity-0 pointer-events-none transition-all': !showThirdColumn }"
			>
				<Tabs class="w-full flex flex-col flex-grow min-h-0" default-value="word">
					<div class="flex gap-4 items-center flex-shrink-0">
						<TabsList class="w-full">
							<TabsTrigger value="tags"> Tags </TabsTrigger>
							<TabsTrigger value="word"> Word / Lemma / POS </TabsTrigger>
							<TabsTrigger value="cql"> CQL </TabsTrigger>
						</TabsList>
					</div>
					<TabsContent class="flex-grow overflow-y-auto min-h-0" value="tags">
						<TagBuilderGroup @search="filterOpen = false" />
					</TabsContent>
					<TabsContent class="flex-grow overflow-y-auto min-h-0" value="word">
						<SearchKwic @search="filterOpen = false" />
					</TabsContent>
					<TabsContent class="flex-grow overflow-y-auto min-h-0" value="cql">
						Sample content
					</TabsContent>
				</Tabs>
			</div>
		</div>
	</main>
</template>
