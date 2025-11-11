<script lang="ts" setup>
import { BookmarkIcon, ChevronLeft, ChevronRight, Download } from "lucide-vue-next";
import { toast } from "vue-sonner";

import initialData from "@/assets/data/transcripts-demo.json";

import type { Transcript } from "./[id].vue";

definePageMeta({
	layout: "tool",
});

const route = useRoute();
const router = useRouter();

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

function handleBookmark(transcript: Transcript) {
	transcript.bookmarked = !transcript.bookmarked;
	localStorage.setItem("transcripts-demo", JSON.stringify(searchResults.value));

	if (transcript.bookmarked) {
		toast.info("Das Transcript wurde zu Ihrer Bibliothek hinzugefügt!");
	} else {
		toast.info("Das Transcript wurde aus Ihrer Bibliothek entfernt!");
	}
}

onMounted(async () => {
	localStorage.setItem("transcripts-demo", JSON.stringify(searchResults.value));

	const saved = localStorage.getItem("transcripts-demo");
	if (saved) {
		searchResults.value = JSON.parse(saved);
	} else {
		localStorage.setItem("transcripts-demo", JSON.stringify(initialData));
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
					<SearchBar />
					<Separator orientation="vertical" />
					<Sheet>
						<SheetTrigger><Button variant="ghost"> Filter </Button></SheetTrigger>
						<SheetContent class="h-[50vh] scroll-y-auto max-h-full" side="bottom">
							<TagBuilderGroup />
						</SheetContent>
					</Sheet>
				</div>

				<p class="text-lg mb-3 flex-shrink-0"><b>122</b> Ergebnisse in <b>45</b> Events</p>
				<Tabs class="w-full flex flex-col flex-grow min-h-0 overflow-hidden" default-value="plain">
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
						<div v-for="result in searchResults" :key="result.id">
							<div
								class="px-4 py-2 mb-2 bg-gray-100 font-semibold text-gray-700 grid grid-cols-[auto_1fr] items-center"
							>
								<Button
									class="underline text-md text-black decoration-dotted transition hover:no-underline focus-visible:no-underline p-0"
									hover:no-underline
									variant="transparent"
									@click="handleSelection(String(result.id))"
								>
									<span class="sr-only"> Open Sidebar Demo </span>
									{{ result.name }}
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
					</TabsContent>
					<TabsContent class="flex-grow overflow-y-auto min-h-0" value="kwic">
						Sample content
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
				<TranscriptDemoSidebar />
			</div>
		</div>
	</main>
</template>
