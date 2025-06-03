<script lang="ts" setup>
import {
	ChevronLeft,
	ChevronRight,
	Download,
	FileText,
	Folder,
	FolderOpen,
	SearchIcon,
	Undo2,
	XIcon,
} from "lucide-vue-next";
import { TreeItem, TreeRoot } from "reka-ui";

import TreeModeSwitcher from "@/components/tree-mode-switcher.vue";

definePageMeta({
	layout: "corpus",
});

const showFirstColumn = ref(true);
const showThirdColumn = ref(true);

const toggleFirstColumn = () => {
	showFirstColumn.value = !showFirstColumn.value;
};

const toggleThirdColumn = () => {
	showThirdColumn.value = !showThirdColumn.value;
};

const gridColumns = computed(() => {
	return [
		showFirstColumn.value ? "340px" : "0px",
		"1fr",
		showThirdColumn.value ? "500px" : "0px",
	].join(" ");
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

const searchResults = [
	{
		name: "Transkript01",
		hits: [
			{
				event: "Transkript01:102",
				speaker: "S2",
				text: "ich war gestern bei meiner Mutter zu Besuch",
			},
			{
				event: "Transkript01:115",
				speaker: "S1",
				text: "das Wetter war heute besser als erwartet",
			},
			{
				event: "Transkript01:130",
				speaker: "S3",
				text: "er war überzeugt, dass es funktionieren würde",
			},
			{
				event: "Transkript01:142",
				speaker: "S4",
				text: "sie war früher Lehrerin an dieser Schule",
			},
			{
				event: "Transkript01:158",
				speaker: "S2",
				text: "ich war so müde nach dem langen Tag",
			},
			{
				event: "Transkript01:176",
				speaker: "S1",
				text: "das Ergebnis war überraschend positiv",
			},
		],
	},
	{
		name: "Transkript02",
		hits: [
			{
				event: "Transkript02:015",
				speaker: "S3",
				text: "ich war heute Morgen im Fitnessstudio",
			},
			{
				event: "Transkript02:023",
				speaker: "S1",
				text: "es war schwierig, den richtigen Zeitpunkt zu finden",
			},
			{
				event: "Transkript02:045",
				speaker: "S4",
				text: "das Meeting war sehr produktiv",
			},
			{
				event: "Transkript02:067",
				speaker: "S2",
				text: "sie war überrascht über die Nachricht",
			},
			{
				event: "Transkript02:089",
				speaker: "S3",
				text: "er war gestern nicht erreichbar",
			},
			{
				event: "Transkript02:104",
				speaker: "S4",
				text: "das Experiment war ein voller Erfolg",
			},
		],
	},
	{
		name: "Transkript03",
		hits: [
			{
				event: "Transkript03:011",
				speaker: "S1",
				text: "ich war letzte Woche nicht zu Hause",
			},
			{
				event: "Transkript03:025",
				speaker: "S2",
				text: "es war einmal ein König in einem fernen Land",
			},
			{
				event: "Transkript03:038",
				speaker: "S4",
				text: "sie war damals noch klein und unschuldig",
			},
			{
				event: "Transkript03:052",
				speaker: "S3",
				text: "das Konzert war ausverkauft innerhalb weniger Stunden",
			},
			{
				event: "Transkript03:076",
				speaker: "S1",
				text: "er war erstaunt über die schnelle Entwicklung",
			},
			{
				event: "Transkript03:095",
				speaker: "S2",
				text: "das Protokoll war unvollständig und musste ergänzt werden",
			},
		],
	},
];

const transcriptResults = [
	{
		event: "1",
		speaker: "S2",
		text: "ich war gestern bei meiner Mutter zu Besuch",
	},
	{
		event: "2",
		speaker: "S1",
		text: "das Wetter war heute besser als erwartet",
	},
	{
		event: "3",
		speaker: "S3",
		text: "er war überzeugt, dass es funktionieren würde",
	},
	{
		event: "4",
		speaker: "S4",
		text: "sie war früher Lehrerin an dieser Schule",
	},
	{
		event: "5",
		speaker: "S2",
		text: "ich war so müde nach dem langen Tag",
	},
	{
		event: "6",
		speaker: "S1",
		text: "das Ergebnis war überraschend positiv",
	},
	{
		event: "7",
		speaker: "S2",
		text: "das Ergebnis war überraschend positiv",
	},
	{
		event: "8",
		speaker: "S3",
		text: "das Ergebnis war überraschend positiv",
	},
	{
		event: "1",
		speaker: "S2",
		text: "ich war gestern bei meiner Mutter zu Besuch",
	},
	{
		event: "2",
		speaker: "S1",
		text: "das Wetter war heute besser als erwartet",
	},
	{
		event: "3",
		speaker: "S3",
		text: "er war überzeugt, dass es funktionieren würde",
	},
	{
		event: "4",
		speaker: "S4",
		text: "sie war früher Lehrerin an dieser Schule",
	},
	{
		event: "5",
		speaker: "S2",
		text: "ich war so müde nach dem langen Tag",
	},
	{
		event: "6",
		speaker: "S1",
		text: "das Ergebnis war überraschend positiv",
	},
	{
		event: "7",
		speaker: "S2",
		text: "das Ergebnis war überraschend positiv",
	},
	{
		event: "8",
		speaker: "S3",
		text: "das Ergebnis war überraschend positiv",
	},
	{
		event: "6",
		speaker: "S1",
		text: "das Ergebnis war überraschend positiv",
	},
	{
		event: "7",
		speaker: "S2",
		text: "das Ergebnis war überraschend positiv",
	},
	{
		event: "8",
		speaker: "S3",
		text: "das Ergebnis war überraschend positiv",
	},
];

const activeCompetence = ref("3");

const competenceOptions = ref<Array<RadioOption>>([
	{ id: "competence-option-one", label: "A1", value: "1" },
	{ id: "competence-option-two", label: "A2", value: "2" },
	{ id: "competence-option-three", label: "B1", value: "3" },
	{ id: "competence-option-four", label: "B2", value: "4" },
	{ id: "competence-option-five", label: "C1", value: "5" },
]);

const treeMode = ref<"Setting" | "Ort" | "Informant">("Setting");

const getTreeTitle = (index: string) => {
	switch (treeMode.value) {
		case "Setting":
			return treeItems[Number(index)]?.setting;
		case "Ort":
			return treeItems[Number(index)]?.location;
		case "Informant":
			return treeItems[Number(index)]?.speaker;
	}
};

const treeItems = [
	{
		title: "0",
		speaker: "0001",
		location: "Wien",
		setting: "Interview",
		icon: "lucide:folder",
		children: [
			{ title: "Transkript01", icon: "vscode-icons:file-type-typescript" },
			{ title: "Transkript02", icon: "vscode-icons:file-type-typescript" },
			{ title: "Transkript03", icon: "vscode-icons:file-type-typescript" },
			{ title: "Transkript04", icon: "vscode-icons:file-type-typescript" },
		],
	},
	{
		title: "1",
		speaker: "0002",
		location: "Graz",
		setting: "Freundesgespräch",
		icon: "lucide:folder",
		children: [
			{ title: "Transkript05", icon: "vscode-icons:file-type-typescript" },
			{ title: "Transkript06", icon: "vscode-icons:file-type-typescript" },
			{ title: "Transkript07", icon: "vscode-icons:file-type-typescript" },
		],
	},
	{
		title: "2",
		speaker: "0003",
		location: "Innsbruck",
		setting: "Nordwind & Sonne",
		icon: "lucide:folder",
		children: [
			{ title: "Transkript08", icon: "vscode-icons:file-type-typescript" },
			{ title: "Transkript09", icon: "vscode-icons:file-type-typescript" },
			{ title: "Transkript10", icon: "vscode-icons:file-type-typescript" },
			{ title: "Transkript11", icon: "vscode-icons:file-type-typescript" },
			{ title: "Transkript12", icon: "vscode-icons:file-type-typescript" },
		],
	},
];
</script>

<template>
	<main class="max-w-full container py-8 pt-4 flex flex-col overflow-hidden" :tabindex="-1">
		<div class="flex justify-between mb-2">
			<Button size="icon" variant="outline" @click="toggleFirstColumn">
				<ChevronRight class="size-4" :class="{ 'rotate-180': showFirstColumn }" />
			</Button>
			<Button size="icon" variant="outline" @click="toggleThirdColumn">
				<ChevronLeft class="size-4" :class="{ '-rotate-180': showThirdColumn }" />
			</Button>
		</div>
		<div
			class="grid gap-4 items-stretch flex-grow min-h-0 transition-[grid-template-columns] duration-250 ease-in-out"
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
						<TabsTrigger value="bookmark"> Bookmarks </TabsTrigger>
					</TabsList>
					<TabsContent class="mt-5 flex-grow overflow-y-auto min-h-0" value="tree">
						<TreeRoot
							v-slot="{ flattenItems }"
							class="list-none select-none w-full rounded-lg border shadow-sm p-2 text-sm"
							:default-expanded="['0']"
							:get-key="(item) => item.title"
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
								class="flex items-center py-1 px-2 my-0.5 rounded outline-none focus:ring-grass8 focus:ring-2 data-[selected]:bg-grass4"
								:style="{ 'padding-left': `${item.level - 0.5}rem` }"
							>
								<template v-if="item.hasChildren">
									<Folder v-if="!isExpanded" class="size-4" />
									<FolderOpen v-else class="size-4" />
								</template>
								<FileText v-else class="size-4" />
								<div class="pl-2">
									{{ item.level > 1 ? item.value.title : getTreeTitle(item.value.title) }}
								</div>
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
							<div class="text-lg mb-1">Sprecher</div>
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
								<Label class="tracking-wide pl-1" for="nos">Dialektkompetenz (Deutsch)</Label>
								<BaseRadioGroup
									v-model="activeCompetence"
									name="nos"
									:options="competenceOptions"
									orientation="horizontal"
								></BaseRadioGroup>
								<!-- <div class="text-sm justify-between flex">
									<span> (Schlecht) </span>
									<span> (Gut) </span>
								</div> -->
							</div>
							<div class="grid w-full gap-1.5">
								<Label class="tracking-wide pl-1" for="gender">Geschlecht</Label>
								<div class="flex gap-2">
									<Combobox
										id="gender"
										v-model="activeGender"
										:options="sampleOptions"
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
						Sample content
					</TabsContent>
				</Tabs>
			</div>

			<div class="p-4 border border-foreground/20 rounded-lg flex flex-col overflow-hidden">
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
						<div v-for="result in searchResults" :key="result.name">
							<div class="px-4 py-2 bg-gray-100 font-semibold text-gray-700">
								{{ result.name }}
							</div>

							<div class="divide-y divide-gray-200">
								<div
									v-for="hit in result.hits"
									:key="hit.event"
									class="grid grid-cols-[110px_40px_1fr] gap-4 px-4 py-3 items-start"
								>
									<div class="text-sm text-gray-500">
										{{ hit.event }}
									</div>
									<div class="text-sm font-semibold">
										{{ hit.speaker }}
									</div>
									<div class="text-sm text-gray-800">
										{{ hit.text }}
									</div>
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
				class="p-4 border border-foreground/20 rounded-lg flex flex-col overflow-hidden"
				:class="{ 'opacity-0 pointer-events-none': !showThirdColumn }"
			>
				<div class="mb-5 pb-3 border-b flex gap-2 items-end flex-shrink-0">
					<div
						class="py-1.5 px-3 flex items-center rounded bg-secondary border gap-2 cursor-pointer text-sm"
					>
						Transkript01
						<div class="bg-foreground rounded-full p-0.5">
							<XIcon class="size-3 text-background" />
						</div>
					</div>
					<div
						class="py-1.5 px-3 flex items-center rounded hover:bg-secondary border gap-2 cursor-pointer text-sm"
					>
						Transkript03
						<div class="bg-foreground rounded-full p-0.5">
							<XIcon class="size-3 text-background" />
						</div>
					</div>
				</div>
				<Tabs class="w-full flex flex-col flex-grow min-h-0 overflow-hidden" default-value="plain">
					<div class="flex gap-4 items-center">
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
						<div class="divide-y divide-gray-200">
							<div
								v-for="hit in transcriptResults"
								:key="hit.event"
								class="grid grid-cols-[20px_40px_1fr] gap-4 px-4 py-3 items-start"
							>
								<div class="text-sm text-gray-500">
									{{ hit.event }}
								</div>
								<div class="text-sm font-semibold">
									{{ hit.speaker }}
								</div>
								<div class="text-sm text-gray-800">
									{{ hit.text }}
								</div>
							</div>
						</div>
					</TabsContent>
					<TabsContent value="kwic"> Sample content </TabsContent>
					<TabsContent value="xml"> Sample content </TabsContent>
				</Tabs>
			</div>
		</div>
	</main>
</template>
