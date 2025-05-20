<script lang="ts" setup>
import { Download, FileText, Folder, FolderOpen, SearchIcon, Undo2, XIcon } from "lucide-vue-next";
import { TreeItem, TreeRoot } from "reka-ui";

definePageMeta({
	layout: "corpus",
});

const showThirdColumn = ref(true);

const gridColumnsStyle = computed(() => {
	return showThirdColumn.value
		? { gridTemplateColumns: "1fr 2fr 2fr" }
		: { gridTemplateColumns: "1fr 2fr" };
});

const enableKWIC = ref(false);

const searchInput = ref("");

const activeOne = ref<string | null>(null);

const activeTwo = ref<string | null>(null);

const activeThree = ref<string | null>(null);

const optionsOne = ref<Array<{ label: string; value: string }>>([
	{ label: "More fitting", value: "fitting" },
	{ label: "More idiomatic", value: "idiomatic" },
	{ label: "Reimagine", value: "new" },
	{ label: "Rephrase", value: "rephrase" },
	{ label: "Variations", value: "variations" },
]);

const optionsTwo = ref<Array<{ label: string; value: string }>>([
	{ label: "More fitting", value: "fitting" },
	{ label: "More idiomatic", value: "idiomatic" },
	{ label: "Reimagine", value: "new" },
	{ label: "Rephrase", value: "rephrase" },
	{ label: "Variations", value: "variations" },
]);

const optionsThree = ref<Array<{ label: string; value: string }>>([
	{ label: "More fitting", value: "fitting" },
	{ label: "More idiomatic", value: "idiomatic" },
	{ label: "Reimagine", value: "new" },
	{ label: "Rephrase", value: "rephrase" },
	{ label: "Variations", value: "variations" },
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

const treeItems = [
	{
		title: "ED (4)",
		icon: "lucide:folder",
		children: [
			{ title: "Transkript01", icon: "vscode-icons:file-type-typescript" },
			{ title: "Transkript02", icon: "vscode-icons:file-type-typescript" },
			{ title: "Transkript03", icon: "vscode-icons:file-type-typescript" },
			{ title: "Transkript04", icon: "vscode-icons:file-type-typescript" },
		],
	},
	{
		title: "LE (3)",
		icon: "lucide:folder",
		children: [
			{ title: "Transkript05", icon: "vscode-icons:file-type-typescript" },
			{ title: "Transkript06", icon: "vscode-icons:file-type-typescript" },
			{ title: "Transkript07", icon: "vscode-icons:file-type-typescript" },
		],
	},
];
</script>

<template>
	<main class="max-w-full container py-10 flex flex-col overflow-hidden" :tabindex="-1">
		<div class="grid gap-4 items-stretch flex-grow min-h-0" :style="gridColumnsStyle">
			<div class="p-4 border border-foreground/20 rounded-lg flex flex-col overflow-hidden">
				<Tabs class="w-full flex flex-col flex-grow min-h-0" default-value="filter">
					<TabsList class="w-full flex-shrink-0">
						<TabsTrigger value="tree"> Tree </TabsTrigger>
						<TabsTrigger value="filter"> Filter </TabsTrigger>
						<TabsTrigger value="bookmark"> Bookmarks </TabsTrigger>
					</TabsList>
					<TabsContent class="mt-5 flex-grow overflow-y-auto min-h-0" value="tree">
						<TreeRoot
							v-slot="{ flattenItems }"
							class="list-none select-none w-56 bg-white text-stone-700 rounded-lg border shadow-sm p-2 text-sm font-medium"
							:default-expanded="['ED (4)']"
							:get-key="(item) => item.title"
							:items="treeItems"
						>
							<h2 class="font-semibold text-sm text-stone-400 px-2 pt-1 pb-3">Transkriptionen</h2>
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
									{{ item.value.title }}
								</div>
							</TreeItem>
						</TreeRoot>
					</TabsContent>
					<TabsContent class="mt-5 flex-grow overflow-y-auto min-h-0" value="filter">
						<div class="flex flex-col gap-4">
							<div class="grid w-full gap-1.5">
								<Label class="tracking-wide pl-1" for="One">One</Label>
								<div class="flex gap-2">
									<Combobox
										id="One"
										v-model="activeOne"
										:options="optionsOne"
										placeholder="x"
									></Combobox>
									<Button size="icon" variant="outline" @click="activeOne = null"
										><Undo2 class="size-4"
									/></Button>
								</div>
							</div>
							<div class="grid w-full gap-1.5">
								<Label class="tracking-wide pl-1" for="Two">Two</Label>
								<div class="flex gap-2">
									<Combobox
										id="Two"
										v-model="activeTwo"
										:options="optionsTwo"
										placeholder="y"
									></Combobox>
									<Button size="icon" variant="outline" @click="activeTwo = null"
										><Undo2 class="size-4"
									/></Button>
								</div>
							</div>
							<div class="grid w-full gap-1.5">
								<Label class="tracking-wide pl-1" for="Three">Three</Label>
								<div class="flex gap-2">
									<Combobox
										id="Three"
										v-model="activeThree"
										:options="optionsThree"
										placeholder="z"
									></Combobox>
									<Button size="icon" variant="outline" @click="activeThree = null"
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
				<form class="mb-5 pb-4 border-b flex gap-4 items-end flex-shrink-0">
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
				<p class="text-lg mb-3 flex-shrink-0">
					<b>122</b> Ergebnisse in <b>45</b> Events (utterances)
				</p>
				<Tabs class="w-full flex flex-col flex-grow min-h-0 overflow-hidden" default-value="voice">
					<div class="flex gap-4 items-center mb-1 flex-shrink-0">
						<TabsList class="w-full">
							<TabsTrigger value="voice"> Voice </TabsTrigger>
							<TabsTrigger value="plain"> Plain </TabsTrigger>
							<TabsTrigger value="post"> Pos </TabsTrigger>
							<TabsTrigger value="xml"> XML </TabsTrigger>
						</TabsList>
						<div class="flex gap-2 rounded border px-3 py-2 items-center">
							<Checkbox id="enableKWIC" v-model="enableKWIC" />
							<label
								class="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
								for="enableKWIC"
							>
								KWIC
							</label>
						</div>
						<Button class="shrink-0" size="icon" variant="ghost"
							><Download class="size-4"
						/></Button>
					</div>
					<TabsContent class="flex-grow overflow-y-auto min-h-0" value="voice">
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
					<TabsContent class="flex-grow overflow-y-auto min-h-0" value="plain">
						Sample content
					</TabsContent>
					<TabsContent class="flex-grow overflow-y-auto min-h-0" value="post">
						Sample content
					</TabsContent>
					<TabsContent class="flex-grow overflow-y-auto min-h-0" value="xml">
						Sample content
					</TabsContent>
				</Tabs>
			</div>

			<div class="p-4 border border-foreground/20 rounded-lg flex flex-col overflow-hidden">
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
				<Tabs class="w-full flex flex-col flex-grow min-h-0 overflow-hidden" default-value="voice">
					<div class="flex gap-4 items-center mb-1">
						<TabsList class="w-full">
							<TabsTrigger value="voice"> Voice </TabsTrigger>
							<TabsTrigger value="plain"> Plain </TabsTrigger>
							<TabsTrigger value="post"> Pos </TabsTrigger>
							<TabsTrigger value="xml"> XML </TabsTrigger>
						</TabsList>

						<Button class="shrink-0" size="icon" variant="ghost"
							><Download class="size-4"
						/></Button>
					</div>
					<TabsContent class="flex-grow overflow-y-auto min-h-0" value="voice">
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
					<TabsContent value="plain"> Sample content </TabsContent>
					<TabsContent value="post"> Sample content </TabsContent>
					<TabsContent value="xml"> Sample content </TabsContent>
				</Tabs>
			</div>
		</div>
	</main>
</template>
