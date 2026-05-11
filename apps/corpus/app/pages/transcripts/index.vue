<script lang="ts" setup>
import { BookmarkIcon, ChevronLeft, ChevronRight, Download } from "lucide-vue-next";
import { toast } from "vue-sonner";
import initialData from "@/assets/data/transcripts-demo.json";

import type { APITranscriptsWithBookmark } from "@/types/api";

definePageMeta({
	layout: "tool",
});

const route = useRoute();
const router = useRouter();

const filterOpen = ref(false);

const activeTab = ref<"plain" | "kwic" | "xml">("plain");
const bookmarkedIds = ref<Array<string>>([]);

const { response, isPending, refreshTranscripts } = useTranscripts(2);
const { response: kwicResponse, search, status } = useSearchKwic();

const transcripts = computed(() => {
	return response.value;
});

const kwic = computed(() => {
	return kwicResponse.value;
});

const limit = 20;
const totalPages = computed(() => {
	return kwic.value?.concsize ? Math.ceil(kwic.value.concsize / limit) : 0;
});
const pages = computed(() => {
	return Array.from({ length: totalPages.value }, (_, i) => i + 1);
});

const currentPage = computed({
	get: () => Number(route.query.page ?? 1),
	set: (page: number) => {
		router.push({
			query: {
				...route.query,
				page: String(page),
				from: String((page - 1) * limit),
			},
		});
	},
});

const searchResults = ref<Array<Transcript>>(initialData.transcripts);
const showFirstColumn = ref(true);
const showThirdColumn = ref(true);

const toggleFirstColumn = () => {
	showFirstColumn.value = !showFirstColumn.value;
};

const toggleThirdColumn = () => {
	showThirdColumn.value = !showThirdColumn.value;
};

const gridColumns = computed(() => {
	if (currentId.value == null) {
		return [showFirstColumn.value ? "340px" : "0px", "1fr"].join(" ");
	} else {
		return [
			showFirstColumn.value ? "340px" : "0px",
			"1fr",
			showThirdColumn.value ? "500px" : "0px",
		].join(" ");
	}
});

const currentId = computed(() => {
	return route.query.selection;
});
const currentSelectionArray = computed(() => {
	return Array.isArray(route.query.selection)
		? (route.query.selection as Array<string>)
		: route.query.selection
			? [route.query.selection as string]
			: [];
});

function handleSelection(id: string) {
	const current = currentSelectionArray.value;
	if (current.includes(id)) return;

	router.push({ query: { ...route.query, selection: [...current, id] } });
}

function handleBookmark(transcript: APITranscriptsWithBookmark[number]) {
	const id = transcript.transcript_id;
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
		if (q.word || q.lemma || q.pos) {
			await search({
				word: q.word as string,
				lemma: q.lemma as string,
				pos: q.pos as string,
				mode: (q.mode as "simple" | "regex") ?? "simple",
				from: (q.from as string) ?? "0",
			});
			activeTab.value = "kwic";
		}
	},
	{ immediate: true, deep: true },
);
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
			v-if="currentId"
			class="fixed z-10 flex items-center border rounded-none rounded-bl-md rounded-tl-md border-foreground/20 justify-center py-0 px-1 transition-all shadow-md duration-250 delay-150"
			:class="showThirdColumn ? 'right-[531px]' : 'right-0'"
			variant="ghost"
			@click="toggleThirdColumn"
		>
			<ChevronLeft class="size-4" :class="{ 'rotate-180': showThirdColumn }" />
		</Button>
		<div
			class="relative gap-8 flex-grow grid h-full min-h-0 duration-250 items-stretch delay-150 transition-[grid-template-columns] ease-in-out"
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
				<div class="flex relative items-center mb-4 pb-4 border-b gap-4">
					<SearchBar search-type="default" />
					<Separator orientation="vertical" />
					<Sheet v-model:open="filterOpen">
						<SheetTrigger><Button variant="outline"> Erweiterte Suche </Button></SheetTrigger>
						<SheetContent class="h-[50vh] scroll-y-auto max-h-full" side="bottom">
							<Tabs
								class="w-full flex flex-col flex-grow min-h-0 overflow-hidden"
								default-value="plain"
							>
								<div class="flex gap-4 mx-10 mt-2 items-center flex-shrink-0">
									<TabsList class="w-full">
										<TabsTrigger value="tags"> Tags </TabsTrigger>
										<TabsTrigger value="word"> Word / Lemma / Pos </TabsTrigger>
										<TabsTrigger value="cql"> CQL </TabsTrigger>
									</TabsList>
								</div>
								<TabsContent class="flex-grow overflow-y-auto min-h-0" value="tags">
									<TagBuilderGroup />
								</TabsContent>
								<TabsContent class="flex-grow overflow-y-auto min-h-0" value="word">
									<SearchKwic @search="filterOpen = false" />
								</TabsContent>
								<TabsContent class="flex-grow overflow-y-auto min-h-0" value="cql">
									Sample content
								</TabsContent>
							</Tabs>
						</SheetContent>
					</Sheet>
				</div>
				<Tabs class="w-full flex flex-col flex-grow min-h-0 overflow-hidden" v-model="activeTab">
					<div class="flex gap-4 items-center flex-shrink-0">
						<TabsList class="w-full">
							<TabsTrigger value="plain"> Plain </TabsTrigger>
							<TabsTrigger value="kwic"> KWIC </TabsTrigger>
							<TabsTrigger value="xml"> XML </TabsTrigger>
						</TabsList>
						<Button class="shrink-0" size="icon" variant="ghost"
							><Download class="size-4"
						/></Button>
					</div>
					<TabsContent class="flex-grow overflow-y-auto min-h-0" value="plain">
						<UtteranceViewOptions class="mb-3"></UtteranceViewOptions>
						<div v-if="isPending" class="item-center m-auto">
							<Spinner />
						</div>
						<div v-else>
							<p class="text-lg mb-3 flex-shrink-0">
								Ergebnisse
								<span class="text-sm text-muted-foreground">({{ transcripts?.length }})</span>
							</p>
							<div v-for="result in transcripts" :key="result.transcript_id">
								<div
									class="px-4 py-2 mb-2 bg-gray-100 font-semibold text-gray-700 grid grid-cols-[auto_1fr] items-center"
								>
									<Button
										class="underline text-md text-black decoration-dotted transition hover:no-underline focus-visible:no-underline p-0"
										hover:no-underline
										variant="transparent"
										@click="handleSelection(String(result.transcript_id))"
									>
										<span class="sr-only"> Open Sidebar Demo </span>
										Transcript {{ result.transcript_id }}
									</Button>
									<div class="w-full flex justify-end">
										<Button
											class="p-0 w-fit self-end"
											variant="transparent"
											@click="handleBookmark(result)"
										>
											<BookmarkIcon :fill="result.bookmarked ? 'black' : 'none'" />
										</Button>
									</div>
								</div>
							</div>
						</div>
					</TabsContent>
					<TabsContent class="flex flex-col flex-grow min-h-0" value="kwic">
						<div v-if="status === 'pending'" class="flex justify-center py-6">
							<Spinner />
						</div>

						<div v-else-if="kwic?.Lines?.length" class="flex flex-col flex-grow min-h-0 gap-2">
							<p class="text-lg flex-shrink-0">
								Ergebnisse
								<span class="text-sm text-muted-foreground">({{ kwic.concsize }})</span>
							</p>
							<div
								class="px-3 py-2 text-sm grid grid-cols-[1fr_auto_1fr] gap-8 items-center text-muted-foreground"
							>
								<span class="text-right">Rechter Kontext</span>
								<span>KWIC</span>
								<span class="text-left">Linker Kontext</span>
							</div>
							<div class="flex-1 min-h-0 overflow-y-auto">
								<div
									v-for="line in kwic.Lines"
									:key="line.toknum"
									class="px-3 py-2 text-sm grid grid-cols-[1fr_auto_1fr] gap-2 items-center"
								>
									<div
										class="h-full p-2 border rounded bg-white border-foreground/20 text-sm space-y-1 text-right transition-transform duration-200 ease-in-out hover:scale-101 hover:border-foreground/80 whitespace-nowrap"
									>
										<span class="pl-2" v-for="token in line.Left">{{ token.str }}</span>
									</div>

									<span
										class="h-full flex font-semibold text-accent-foreground bg-accent-foreground/20 rounded-sm space-y-1 transition-transform duration-200 ease-in-out hover:scale-110 hover:border-background/10 p-2.5 text-center whitespace-nowrap"
									>
										{{ line.Kwic ? line.Kwic[0]?.str : "" }}
									</span>

									<div
										class="h-full p-2 border rounded bg-white border-foreground/20 text-sm space-y-1 transition-transform duration-200 ease-in-out hover:scale-101 hover:border-foreground/80 text-center whitespace-nowrap text-left"
									>
										<span class="pl-2" v-for="token in line.Right">{{ token.str }}</span>
									</div>
								</div>
							</div>
							<div class="shrink-0 sticky bottom-0 bg-white border-t flex justify-center py-4">
								<Pagination
									v-model:page="currentPage"
									:items-per-page="limit"
									:total="kwic.concsize"
									:sibling-count="1"
									:show-edges="true"
									class="flex items-center gap-1"
								>
									<PaginationContent v-slot="{ items }">
										<PaginationPrevious />

										<template v-for="(item, i) in items" :key="i">
											<PaginationEllipsis v-if="item.type === 'ellipsis'" />

											<PaginationItem v-else-if="item.type === 'page'" :value="item.value" as-child>
												<Button
													class="size-9 p-0"
													:variant="item.value === currentPage ? 'default' : 'outline'"
													@click="currentPage = item.value"
												>
													{{ item.value }}
												</Button>
											</PaginationItem>
										</template>

										<PaginationNext />
									</PaginationContent>
								</Pagination>
							</div>
						</div>
					</TabsContent>
					<TabsContent class="flex-grow overflow-y-auto min-h-0" value="xml">
						<UtteranceViewOptions class="mb-3"></UtteranceViewOptions>
						Sample content
					</TabsContent>
				</Tabs>
			</div>
			<div
				v-if="currentId != null"
				class="transition p-4 border border-foreground/20 rounded-b-lg rounded-tr-lg flex flex-col overflow-hidden"
				:class="{ 'opacity-0 pointer-events-none transition-all': !showThirdColumn }"
			>
				<TranscriptDemoSidebar :transcripts="transcripts ?? []" />
			</div>
		</div>
	</main>
</template>
