<script lang="ts" setup>
import {
	BookmarkIcon,
	ChevronLeft,
	ChevronRight,
	Download,
	FileText,
	Folder,
	FolderOpen,
	SearchIcon,
	Undo2,
} from "lucide-vue-next";
import { TreeItem, TreeRoot } from "reka-ui";
import { toast } from "vue-sonner";

import initialData from "@/assets/data/transcripts-demo.json";
import TreeModeSwitcher from "@/components/tree-mode-switcher.vue";

import Checkbox from "../../../ui/components/ui/checkbox/Checkbox.vue";
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

const searchInput = ref("");

const activeContext = ref<string | null>(null);

const activeSetting = ref<string | null>(null);

const activeAge = ref<string | null>(null);

const activeLocation = ref<string | null>(null);

const activeFirstLanguage = ref<string | null>(null);

const activeGender = ref<string | null>(null);

const sampleOptions = ref<Array<{ label: string; value: string }>>([
	{ label: "Option 1", value: "one" },
	{ label: "Option 2", value: "two" },
	{ label: "Option 3", value: "three" },
]);

const genderOptions = ref<Array<{ label: string; value: string }>>([
	{ label: "m", value: "m" },
	{ label: "w", value: "w" },
	{ label: "divers", value: "divers" },
]);

const competenceValue = ref<Array<number>>([1]);

const treeMode = ref<"Setting" | "Ort" | "Informant">("Setting");

const filteredTranscripts = computed(() => {
	return searchResults.value.filter((transcript) => {
		if (activeSetting.value && transcript.setting !== activeSetting.value) return false;
		if (activeLocation.value && transcript.location !== activeLocation.value) return false;
		// add other filters here
		return true;
	});
});

const bookmarkedTranscripts = computed(() => {
	return searchResults.value.filter((entry) => {
		if (entry.bookmarked) {
			return entry;
		}
		return null;
	});
});

const treeItems = computed(() => {
	const groups = filteredTranscripts.value?.reduce(
		(acc, transcript) => {
			if (!acc[transcript.setting]) acc[transcript.setting] = [];

			acc[transcript.setting]?.push({
				id: transcript.id as unknown as string,
				title: transcript.name,
				icon: transcript.icon,
			});
			return acc;
		},
		{} as Record<string, Array<{ id: string; title: string; icon: string }>>,
	);

	return Object.entries(groups).map(([setting, transcripts]) => ({
		id: setting,
		title: setting,
		icon: "lucide:folder",
		children: transcripts,
	}));
});

const currentId = computed(() => {
	console.log(route.query.selection);
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
	console.log(current, id);
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
		<div class="flex justify-between mb-2">
			<Button size="icon" variant="outline" @click="toggleFirstColumn">
				<ChevronRight class="size-4" :class="{ 'rotate-180': showFirstColumn }" />
			</Button>
			<Button v-if="currentId != null" size="icon" variant="outline" @click="toggleThirdColumn">
				<ChevronLeft class="size-4" :class="{ '-rotate-180': showThirdColumn }" />
			</Button>
		</div>
		<div
			class="relative gap-4 flex-grow grid h-full min-h-0 duration-250 items-stretch delay-150 transition-[grid-template-columns] ease-in-out"
			:data-selection="currentId != null ? 'true' : undefined"
			:style="{ gridTemplateColumns: gridColumns }"
		>
			<div
				class="p-4 border border-foreground/20 rounded-lg flex flex-col overflow-hidden"
				:class="{ 'opacity-0 pointer-events-none': !showFirstColumn }"
			>
				<Tabs class="w-full flex flex-col flex-grow min-h-0" default-value="filter">
					<TabsList class="w-full flex-shrink-0">
						<TabsTrigger value="tree"> Tree </TabsTrigger>
						<TabsTrigger value="filter"> Filter </TabsTrigger>
						<TabsTrigger value="bookmark">
							Bibliothek
							<span
								v-if="bookmarkedTranscripts.length > 0"
								class="bg-black text-white text-xs rounded-full w-4 h-4 flex items-center justify-center"
							>
								{{ bookmarkedTranscripts.length }}
							</span>
						</TabsTrigger>
					</TabsList>
					<TabsContent class="mt-5 flex-grow overflow-y-auto min-h-0" value="tree">
						<TreeRoot
							v-slot="{ flattenItems }"
							class="list-none select-none w-full rounded-lg border shadow-sm p-2 text-sm"
							:default-expanded="['0']"
							:get-key="(item) => item.id || item.id"
							:items="treeItems"
						>
							<div class="flex items-center justify-between">
								<h2 class="font-semibold text-sm text-stone-400 px-2 pt-1 pb-3">Transkriptionen</h2>
								<TreeModeSwitcher v-model="treeMode"></TreeModeSwitcher>
							</div>
							<TreeItem
								v-for="item in flattenItems"
								:key="item._id"
								v-slot="{ isExpanded }"
								v-bind="item.bind"
								class="flex items-center py-1 px-2 rounded outline-none focus:ring-grass8 focus:ring-2 data-[selected]:bg-grass4"
								:style="{ 'padding-left': `${item.level - 0.5}rem` }"
							>
								<template v-if="item.hasChildren">
									<Folder v-if="!isExpanded" class="size-4" />
									<FolderOpen v-else class="size-4" />
									<span class="pl-2">{{ item.value.title }}</span>
								</template>
								<template v-else>
									<FileText class="size-4" />
									<Button
										class="p-0 pl-2 h-fit font-normal underline decoration-dotted transition hover:no-underline focus-visible:no-underline"
										variant="transparent"
										@click="handleSelection(String(item.value.id))"
									>
										<span class="sr-only">Open Detail Sidebar</span>
										{{ item.value.title }}
									</Button>
								</template>
							</TreeItem>
						</TreeRoot>
					</TabsContent>
					<TabsContent class="mt-5 flex-grow overflow-y-auto min-h-0" value="filter">
						<div class="flex flex-col gap-4">
							<div class="grid w-full gap-1.5">
								<Label class="tracking-wide pl-1" for="context">Projektkontext</Label>
								<div class="flex gap-2">
									<ComboboxBase
										id="context"
										v-model="activeContext"
										:options="sampleOptions"
										placeholder="Projektkontext"
									></ComboboxBase>
									<Button size="icon" variant="outline" @click="activeContext = null"
										><Undo2 class="size-4"
									/></Button>
								</div>
							</div>
							<div class="grid w-full gap-1.5 pb-4 border-b">
								<Label class="tracking-wide pl-1" for="setting">Setting</Label>
								<div class="flex gap-2">
									<ComboboxBase
										id="setting"
										v-model="activeSetting"
										:options="sampleOptions"
										placeholder="Setting"
									></ComboboxBase>
									<Button size="icon" variant="outline" @click="activeSetting = null"
										><Undo2 class="size-4"
									/></Button>
								</div>
							</div>
							<div class="text-lg mb-1">Sprecher:innen</div>
							<div class="grid w-full gap-1.5">
								<Label class="tracking-wide pl-1" for="age">Altersklasse</Label>
								<div class="flex gap-2">
									<ComboboxBase
										id="age"
										v-model="activeAge"
										:options="sampleOptions"
										placeholder="Altersklasse"
									></ComboboxBase>
									<Button size="icon" variant="outline" @click="activeAge = null"
										><Undo2 class="size-4"
									/></Button>
								</div>
							</div>
							<div class="grid w-full gap-1.5">
								<Label class="tracking-wide pl-1" for="location">Ort</Label>
								<div class="flex gap-2">
									<ComboboxBase
										id="location"
										v-model="activeLocation"
										:options="sampleOptions"
										placeholder="Ort"
									></ComboboxBase>
									<Button size="icon" variant="outline" @click="activeLocation = null"
										><Undo2 class="size-4"
									/></Button>
								</div>
							</div>
							<div class="grid w-full gap-1.5">
								<Label class="tracking-wide pl-1" for="first-languaage">Erstprache</Label>
								<div class="flex gap-2">
									<ComboboxBase
										id="first-languaage"
										v-model="activeFirstLanguage"
										:options="sampleOptions"
										placeholder="Erstprache"
									></ComboboxBase>
									<Button size="icon" variant="outline" @click="activeFirstLanguage = null"
										><Undo2 class="size-4"
									/></Button>
								</div>
							</div>
							<div class="grid w-full gap-3 my-2">
								<div class="flex gap-1">
									<Label class="tracking-wide pl-1" for="nos">Dialektkompetenz</Label>
									<span class="text-xs text-muted-foreground">{{ competenceValue[0] }}</span>
								</div>
								<div class="flex flex-row gap-4">
									<Slider v-model="competenceValue" :max="7" :min="1" :step="1" />
									<div class="flex items-center space-x-2">
										<Checkbox id="na" />
										<TooltipProvider>
											<Tooltip>
												<TooltipTrigger> <label class="text-sm" for="na">NA</label></TooltipTrigger>
												<TooltipContent> „Nicht angegeben“ berücksichtigen </TooltipContent>
											</Tooltip>
										</TooltipProvider>
									</div>
								</div>
							</div>
							<div class="grid w-full gap-1.5">
								<Label class="tracking-wide pl-1" for="gender">Geschlecht</Label>
								<div class="flex gap-2">
									<ComboboxBase
										id="gender"
										v-model="activeGender"
										:options="genderOptions"
										placeholder="Geschlecht"
									></ComboboxBase>
									<Button size="icon" variant="outline" @click="activeGender = null"
										><Undo2 class="size-4"
									/></Button>
								</div>
							</div>
						</div>
					</TabsContent>
					<TabsContent class="mt-5 flex-grow overflow-y-auto min-h-0" value="bookmark">
						<div v-if="bookmarkedTranscripts.length <= 0" class="text-sm text-muted-foreground">
							Es befinden sich derzeit keine gespeicherten Transkripte in Ihrer Bibliothek.
						</div>

						<div v-else>
							<div v-for="result in bookmarkedTranscripts" :key="result.id">
								<div
									class="px-4 py-2 mb-2 bg-gray-100 font-semibold text-gray-700 grid grid-cols-[auto_1fr] items-center justify-between"
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
						</div>
					</TabsContent>
				</Tabs>
			</div>

			<div class="p-4 w-full border border-foreground/20 rounded-lg flex flex-col overflow-hidden">
				<form class="mb-4 pb-4 border-b flex gap-4 items-end flex-shrink-0">
					<Label class="sr-only" for="search">Suche</Label>
					<div class="relative w-64">
						<Input
							id="search"
							v-model="searchInput"
							class="pl-10"
							placeholder="Suchbegriff eingeben"
							type="text"
						/>
						<span class="absolute inset-y-0 start-0 flex items-center justify-center px-2">
							<SearchIcon class="size-6 text-muted-foreground" />
						</span>
					</div>
					<Button type="submit"> Suchen </Button>
				</form>
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
				class="transition p-4 border border-foreground/20 rounded-lg flex flex-col overflow-hidden"
				:class="{ 'opacity-0 pointer-events-none': !showThirdColumn }"
			>
				<TranscriptDemoSidebar />
			</div>
		</div>
	</main>
</template>
