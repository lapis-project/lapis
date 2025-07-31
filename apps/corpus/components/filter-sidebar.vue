<script setup lang="ts">
import { BookmarkIcon, FileText, Folder, FolderOpen, Undo2 } from "lucide-vue-next";
import { TreeItem, TreeRoot } from "reka-ui";

import TreeModeSwitcher from "@/components/tree-mode-switcher.vue";
import type { Transcript } from "@/pages/transcripts/[id].vue";

const props = defineProps<{
	transcripts: Array<Transcript>;
}>();

const emit = defineEmits(["closeFilterSidebar", "handleBookmark", "handleSelection"]);

const activeContext = ref<string | null>(null);
const activeAge = ref<string | null>(null);
const activeFirstLanguage = ref<string | null>(null);
const activeGender = ref<string | null>(null);
const activeSetting = ref<string | null>(null);
const activeLocation = ref<string | null>(null);

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
	return props.transcripts.filter((transcript) => {
		if (activeSetting.value && transcript.setting !== activeSetting.value) return false;
		if (activeLocation.value && transcript.location !== activeLocation.value) return false;
		// add other filters here
		return true;
	});
});

const bookmarkedTranscripts = computed(() => {
	return props.transcripts.filter((entry) => {
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

function handleBookmark(transcript: Transcript) {
	emit("handleBookmark", transcript);
}

function handleSelection(id: string) {
	emit("handleSelection", id);
}
</script>

<template>
	<div class="flex justify-between mb-2">
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
							<Combobox
								id="context"
								v-model="activeContext"
								:options="sampleOptions"
								placeholder="Projektkontext"
							></Combobox>
							<Button size="icon" variant="outline" @click="activeContext = null"
								><Undo2 class="size-4"
							/></Button>
						</div>
					</div>
					<div class="grid w-full gap-1.5 pb-4 border-b">
						<Label class="tracking-wide pl-1" for="setting">Setting</Label>
						<div class="flex gap-2">
							<Combobox
								id="setting"
								v-model="activeSetting"
								:options="sampleOptions"
								placeholder="Setting"
							></Combobox>
							<Button size="icon" variant="outline" @click="activeSetting = null"
								><Undo2 class="size-4"
							/></Button>
						</div>
					</div>
					<div class="text-lg mb-1">Sprecher:innen</div>
					<div class="grid w-full gap-1.5">
						<Label class="tracking-wide pl-1" for="age">Altersklasse</Label>
						<div class="flex gap-2">
							<Combobox
								id="age"
								v-model="activeAge"
								:options="sampleOptions"
								placeholder="Altersklasse"
							></Combobox>
							<Button size="icon" variant="outline" @click="activeAge = null"
								><Undo2 class="size-4"
							/></Button>
						</div>
					</div>
					<div class="grid w-full gap-1.5">
						<Label class="tracking-wide pl-1" for="location">Ort</Label>
						<div class="flex gap-2">
							<Combobox
								id="location"
								v-model="activeLocation"
								:options="sampleOptions"
								placeholder="Ort"
							></Combobox>
							<Button size="icon" variant="outline" @click="activeLocation = null"
								><Undo2 class="size-4"
							/></Button>
						</div>
					</div>
					<div class="grid w-full gap-1.5">
						<Label class="tracking-wide pl-1" for="first-languaage">Erstprache</Label>
						<div class="flex gap-2">
							<Combobox
								id="first-languaage"
								v-model="activeFirstLanguage"
								:options="sampleOptions"
								placeholder="Erstprache"
							></Combobox>
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
							<Combobox
								id="gender"
								v-model="activeGender"
								:options="genderOptions"
								placeholder="Geschlecht"
							></Combobox>
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
</template>
