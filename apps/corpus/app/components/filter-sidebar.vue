<script setup lang="ts">
import { BookmarkIcon, FileText, Folder, FolderOpen, Undo2 } from "@lucide/vue";
import { TreeItem, TreeRoot } from "reka-ui";

import { usePlaces } from "#imports";
import TreeModeSwitcher from "@/components/tree-mode-switcher.vue";
import { useSettingsProjectsFilter } from "@/composables/use-settings-projects";
import type { Transcript } from "@/pages/transcripts/[id].vue";

const router = useRouter();
const route = useRoute();

const props = defineProps<{
	transcripts: Array<Transcript>;
}>();

const { response: filter, isPending: isLoading } = useSettingsProjectsFilter();
const { response: places, isPending, hasError } = usePlaces(2);

const emit = defineEmits(["closeFilterSidebar", "handleBookmark", "handleSelection"]);

const activeContext = ref<string | null>(null);
const activeAgeGroup = ref<string | null>(null);
const activeGender = ref<string | null>(null);
const activeSetting = ref<string | null>(null);
const activeLocation = ref<string | null>(null);

const ageRange = computed(() => {
	if (!activeAgeGroup.value) return null;

	const [lower, upper] = activeAgeGroup.value.split("-");

	return {
		lower,
		upper,
	};
});

// const projectOptions = ref<Array<{ label: string; value: string }>>([
// 	{ label: "PP01", value: "PP01" },
// 	{ label: "PP02", value: "PP02" },
// 	{ label: "PP03", value: "PP03" },
// 	{ label: "PP04", value: "PP04" },
// 	{ label: "PP05", value: "PP05" },
// 	{ label: "PP06", value: "PP06" },
// 	{ label: "PP08", value: "PP08" },
// 	{ label: "PP10", value: "PP10" },
// 	{ label: "PP11", value: "PP11" },
// ]);

// const settingOptions = ref<Array<{ label: string; value: string }>>([
// 	{ label: "Interview", value: "Interview" },
// 	{ label: "Gespräch ohne Explorator/in", value: "Gespräch ohne Explorator/in" },
// 	{ label: "Übersetzungen", value: "Übersetzungen" },
// 	{ label: "Vorlesen", value: "Vorlesen" },
// 	{ label: "Papier-Fragebogen", value: "Papier-Fragebogen" },
// 	{ label: "Online-Fragebogen", value: "Online-Fragebogen" },
// 	{ label: "Fragebuch", value: "Fragebuch" },
// 	{ label: "Experimente (SPT und andere)", value: "Experimente (SPT und andere)" },
// ]);

const projectOptions = computed<Array<{ label: string; value: string }>>(() => {
	return (filter.value?.projects ?? [])
		.filter((project) => project.name != null)
		.toSorted((a, b) => a.name!.localeCompare(b.name!, "de"))
		.map((project) => ({
			label: project.name!,
			value: project.name!,
		}));
});

const settingOptions = computed<Array<{ label: string; value: string }>>(() => {
	return (filter.value?.settings ?? [])
		.filter((setting) => setting.name != null)
		.toSorted((a, b) => a.name!.localeCompare(b.name!, "de"))
		.map((setting) => ({
			label: setting.name!,
			value: setting.name!,
		}));
});

const ageGroupOptions = ref<Array<{ label: string; value: string }>>([
	{ label: "18-35", value: "18-35" },
	{ label: "65+", value: "65-999" },
]);

const genderOptions = ref<Array<{ label: string; value: string }>>([
	{ label: "Männlich", value: "männlich" },
	{ label: "Weiblich", value: "weiblich" },
]);

const locationOptions = computed<Array<{ label: string; value: string }>>(() => {
	return (places.value ?? [])
		.filter((place) => place.place_name != null)
		.toSorted((a, b) => a.place_name!.localeCompare(b.place_name!, "de"))
		.map((place) => ({
			label: place.place_name!,
			value: place.place_name!,
		}));
});

const dialectCompetenceEnabled = ref(false);
const dialectCompetenceValue = ref<number[] | null>(null);

const standardCompetenceEnabled = ref(false);
const standardCompetenceValue = ref<number[] | null>(null);

watch(
	() => {
		return dialectCompetenceEnabled.value;
	},
	() => {
		if (dialectCompetenceEnabled.value) {
			dialectCompetenceValue.value = [1];
		} else {
			dialectCompetenceValue.value = null;
		}
	},
	{ immediate: true },
);

watch(
	() => {
		return standardCompetenceEnabled.value;
	},
	() => {
		if (standardCompetenceEnabled.value) {
			standardCompetenceValue.value = [1];
		} else {
			standardCompetenceValue.value = null;
		}
	},
	{ immediate: true },
);

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

watch(
	[
		activeContext,
		activeSetting,
		activeAgeGroup,
		activeLocation,
		activeGender,
		dialectCompetenceValue,
		standardCompetenceValue,
	],
	() => {
		router.replace({
			query: {
				...route.query,

				projects: activeContext.value ? [activeContext.value] : undefined,

				settings: activeSetting.value ? [activeSetting.value] : undefined,

				locations: activeLocation.value ? [activeLocation.value] : undefined,

				gender: activeGender.value || undefined,

				dialect_competence:
					dialectCompetenceValue.value?.[0] != null
						? String(dialectCompetenceValue.value[0])
						: undefined,

				standard_competence:
					standardCompetenceValue.value?.[0] != null
						? String(standardCompetenceValue.value[0])
						: undefined,

				age_lower: ageRange.value?.lower,
				age_upper: ageRange.value?.upper,
			},
		});
	},
	{ deep: true },
);
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
							<BaseSelect
								id="context"
								v-model="activeContext"
								:options="projectOptions"
								placeholder="Projektkontext wählen..."
							></BaseSelect>
							<Button size="icon" variant="outline" @click="activeContext = null"
								><Undo2 class="size-4"
							/></Button>
						</div>
					</div>
					<div class="grid w-full gap-1.5 pb-4 border-b">
						<Label class="tracking-wide pl-1" for="setting">Setting</Label>
						<div class="flex gap-2">
							<BaseSelect
								id="setting"
								v-model="activeSetting"
								:options="settingOptions"
								placeholder="Setting wählen..."
							></BaseSelect>
							<Button size="icon" variant="outline" @click="activeSetting = null"
								><Undo2 class="size-4"
							/></Button>
						</div>
					</div>
					<div class="text-lg mb-1">Sprecher:innen</div>
					<div class="grid w-full gap-1.5">
						<Label class="tracking-wide pl-1" for="age">Altersklasse</Label>
						<div class="flex gap-2">
							<BaseSelect
								id="age"
								v-model="activeAgeGroup"
								:options="ageGroupOptions"
								placeholder="Altersklasse wählen..."
							></BaseSelect>
							<Button size="icon" variant="outline" @click="activeAgeGroup = null"
								><Undo2 class="size-4"
							/></Button>
						</div>
					</div>
					<div class="grid w-full gap-1.5">
						<Label class="tracking-wide pl-1" for="location">Ort</Label>
						<div class="flex gap-2">
							<BaseSelect
								id="location"
								v-model="activeLocation"
								:options="locationOptions"
								placeholder="Ort wählen..."
							></BaseSelect>
							<Button size="icon" variant="outline" @click="activeLocation = null"
								><Undo2 class="size-4"
							/></Button>
						</div>
					</div>
					<div class="grid my-2">
						<div class="flex w-full justify-between">
							<span class="flex-row flex gap-1">
								<Checkbox
									type="checkbox"
									id="competence-enabled"
									v-model="standardCompetenceEnabled"
								/>
								<Label class="tracking-wide pl-1" for="nos">Standardkompetenz</Label>
							</span>
							<span
								v-if="standardCompetenceEnabled && standardCompetenceValue"
								class="text-xs text-muted-foreground"
							>
								{{ standardCompetenceValue[0] }}
							</span>
						</div>
						<div class="grid w-full">
							<div class="flex items-center gap-2"></div>

							<Collapsible :open="standardCompetenceEnabled">
								<CollapsibleContent
									class="overflow-hidden data-[state=closed]:animate-accordion-up data-[state=open]:animate-accordion-down data-[state=open]:mt-3"
								>
									<div class="flex flex-row my-2.5 mx-1.5">
										<Slider v-model="standardCompetenceValue" :max="7" :min="1" :step="1" />
									</div>
								</CollapsibleContent>
							</Collapsible>
						</div>
					</div>
					<div class="grid my-2">
						<div class="flex w-full justify-between">
							<span class="flex-row flex gap-1">
								<Checkbox
									type="checkbox"
									id="competence-enabled"
									v-model="dialectCompetenceEnabled"
								/>
								<Label class="tracking-wide pl-1" for="nos">Dialektkompetenz</Label>
							</span>
							<span
								v-if="dialectCompetenceEnabled && dialectCompetenceValue"
								class="text-xs text-muted-foreground"
							>
								{{ dialectCompetenceValue[0] }}
							</span>
						</div>
						<div class="grid w-full">
							<div class="flex items-center gap-2"></div>

							<Collapsible :open="dialectCompetenceEnabled">
								<CollapsibleContent
									class="overflow-hidden data-[state=closed]:animate-accordion-up data-[state=open]:animate-accordion-down data-[state=open]:mt-3"
								>
									<div class="flex flex-row my-2.5 mx-1.5">
										<Slider v-model="dialectCompetenceValue" :max="7" :min="1" :step="1" />
									</div>
								</CollapsibleContent>
							</Collapsible>
						</div>
					</div>
					<div class="grid w-full gap-1.5">
						<Label class="tracking-wide pl-1" for="gender">Geschlecht</Label>
						<div class="flex gap-2">
							<BaseSelect
								id="gender"
								v-model="activeGender"
								:options="genderOptions"
								placeholder="Geschlecht wählen..."
							></BaseSelect>
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
