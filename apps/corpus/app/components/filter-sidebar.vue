<script setup lang="ts">
import {
	BookmarkIcon,
	CircleQuestionMarkIcon,
	FileText,
	Folder,
	FolderOpen,
	Undo2,
} from "@lucide/vue";
import { TreeItem, TreeRoot } from "reka-ui";

import { usePlaces } from "#imports";
import TreeModeSwitcher from "@/components/tree-mode-switcher.vue";
import { useSettingsProjectsFilter } from "@/composables/use-settings-projects";

import { austrianStates } from "../../../backend/src/lib/austrianPostalCodes.ts";

type FilterSidebarTranscript = {
	id?: number | string;
	name?: string;
	setting?: number;
	location?: number;
	icon?: string;
	bookmarked?: boolean;
};

const router = useRouter();
const route = useRoute();

const props = defineProps<{
	transcripts: Array<FilterSidebarTranscript>;
}>();

const { response: filter, isPending: isLoading } = useSettingsProjectsFilter();
const { response: places, isPending, hasError } = usePlaces(2);

const emit = defineEmits(["closeFilterSidebar", "handleBookmark", "handleSelection"]);

const activeContext = ref<string | undefined>();
const activeAgeGroup = ref<string | undefined>();
const activeGender = ref<string | undefined>();
const activeSetting = ref<string | undefined>();
const activeLocation = ref<string | undefined>();
const activeState = ref<string | undefined>();
const searchName = ref<string>("");
const searchId = ref<string>("");

const activeFilterCount = computed(() => {
	return [
		activeContext.value,
		activeSetting.value,
		activeAgeGroup.value,
		activeLocation.value,
		activeState.value,
		activeGender.value,
		standardCompetenceEnabled.value,
		dialectCompetenceEnabled.value,
		bkmsEnabled.value,
		searchName.value,
		searchId.value,
	].filter(Boolean).length;
});

const hasActiveFilters = computed(() => activeFilterCount.value > 0);

const ageRange = computed(() => {
	if (!activeAgeGroup.value) return null;

	const [lower, upper] = activeAgeGroup.value.split("-");

	return {
		lower,
		upper,
	};
});

const projectOptions = computed<Array<{ label: string; value: string }>>(() => {
	return (filter.value?.projects ?? [])
		.filter((project) => project.name != null)
		.toSorted((a, b) => a.name!.localeCompare(b.name!, "de"))
		.map((project) => ({
			label: project.name!,
			value: String(project.id),
		}));
});

const settingOptions = computed<Array<{ label: string; value: string }>>(() => {
	return (filter.value?.settings ?? [])
		.filter((setting) => setting.name != null)
		.toSorted((a, b) => a.name!.localeCompare(b.name!, "de"))
		.map((setting) => ({
			label: setting.name!,
			value: String(setting.id),
		}));
});

const ageGroupOptions = ref<Array<{ label: string; value: string }>>([
	{ label: "18-35", value: "18-35" },
	{ label: "65+", value: "65-999" },
]);

const genderOptions = ref<Array<{ label: string; value: string }>>([
	{ label: "Männlich", value: "männlich" },
	{ label: "Weiblich", value: "weiblich" },
	{ label: "Divers", value: "divers" },
]);

const locationOptions = computed<Array<{ label: string; value: string }>>(() => {
	return (places.value ?? [])
		.filter((place) => place.place_name != null)
		.toSorted((a, b) => a.place_name!.localeCompare(b.place_name!, "de"))
		.map((place) => ({
			label: place.place_name!,
			value: String(place.id),
		}));
});

const stateOptions = computed<Array<{ label: string; value: string }>>(() => {
	return austrianStates.map((state) => ({
		label: state.name,
		value: String(state.id),
	}));
});

const bkmsEnabled = ref(false);

const dialectCompetenceEnabled = ref(false);
const dialectCompetenceValue = ref<number[] | null>(null);

const standardCompetenceEnabled = ref(false);
const standardCompetenceValue = ref<number[] | null>(null);

onMounted(async () => {
	const query = route.query;
	const locationQuery = route.query.locations;
	const settingQuery = route.query.settings;
	const projectQuery = route.query.projects;
	const transcriptNameQuery = route.query.transcript_name;
	const instanceIdQuery = route.query.instance_id;

	if (projectQuery) {
		activeContext.value = String(Array.isArray(projectQuery) ? projectQuery[0] : projectQuery);
	}

	if (settingQuery) {
		activeSetting.value = String(Array.isArray(settingQuery) ? settingQuery[0] : settingQuery);
	}

	if (locationQuery) {
		activeLocation.value = String(Array.isArray(locationQuery) ? locationQuery[0] : locationQuery);
	}

	activeGender.value = query.gender
		? String(Array.isArray(query.gender) ? query.gender[0] : query.gender)
		: undefined;

	if (query.age_lower || query.age_upper) {
		activeAgeGroup.value = `${query.age_lower ?? 18}-${query.age_upper ?? 999}`;
	}

	if (query.standard_competence) {
		standardCompetenceEnabled.value = true;
		await nextTick();
		standardCompetenceValue.value = [Number(query.standard_competence)];
	}

	if (query.dialect_competence) {
		dialectCompetenceEnabled.value = true;
		await nextTick();
		dialectCompetenceValue.value = [Number(query.dialect_competence)];
	}

	if (query.has_bkms !== undefined) {
		bkmsEnabled.value = query.has_bkms === "true";
	}

	if (query.state) {
		activeState.value = String(query.state);
	}

	if (transcriptNameQuery != null) {
		searchName.value = String(
			Array.isArray(transcriptNameQuery) ? transcriptNameQuery[0] : transcriptNameQuery,
		);
	}

	if (instanceIdQuery != null) {
		searchId.value = String(Array.isArray(instanceIdQuery) ? instanceIdQuery[0] : instanceIdQuery);
	}
});

watch(
	[searchName, searchId],
	([name, id]) => {
		router.replace({
			query: {
				...route.query,
				transcript_name: name || undefined,
				instance_id: id || undefined,
			},
		});
	},
	{ deep: true },
);

const treeMode = ref<"Setting" | "Ort" | "Informant">("Setting");

const filteredTranscripts = computed(() => {
	return props.transcripts.filter((transcript) => {
		if (activeSetting.value && transcript.setting !== Number(activeSetting.value)) return false;
		if (activeLocation.value && transcript.location !== Number(activeLocation.value)) return false;
		return true;
	});
});

const bookmarkedTranscripts = computed(() => {
	return props.transcripts.filter((entry) => {
		if (entry.bookmarked) {
			return entry;
		}
		return false;
	});
});

const treeItems = computed(() => {
	const groups = filteredTranscripts.value.reduce(
		(acc, transcript) => {
			if (transcript.setting == null) return acc;
			if (!acc[transcript.setting]) acc[transcript.setting] = [];

			acc[transcript.setting]?.push({
				id: String(transcript.id),
				title: transcript.name,
				icon: transcript.icon,
			});
			return acc;
		},
		{} as Record<number, Array<{ id: string; title?: string; icon?: string }>>,
	);

	return Object.entries(groups ?? {}).map(([setting, transcripts]) => ({
		id: setting,
		title: setting,
		icon: "lucide:folder",
		children: transcripts,
	}));
});

function handleBookmark(transcript: FilterSidebarTranscript) {
	emit("handleBookmark", transcript);
}

function handleSelection(id: string) {
	emit("handleSelection", id);
}

function clearAllFilters() {
	activeContext.value = undefined;
	activeAgeGroup.value = undefined;
	activeGender.value = undefined;
	activeSetting.value = undefined;
	activeLocation.value = undefined;
	activeState.value = undefined;
	searchName.value = "";
	searchId.value = "";
	dialectCompetenceEnabled.value = false;
	dialectCompetenceValue.value = null;
	standardCompetenceEnabled.value = false;
	standardCompetenceValue.value = null;
	bkmsEnabled.value = false;
}

watch(
	[
		activeContext,
		activeSetting,
		activeAgeGroup,
		activeLocation,
		activeState,
		activeGender,
		dialectCompetenceValue,
		standardCompetenceValue,
		bkmsEnabled,
	],
	() => {
		router.replace({
			query: {
				...route.query,

				projects: activeContext.value ? [Number(activeContext.value)] : undefined,

				settings: activeSetting.value ? [Number(activeSetting.value)] : undefined,

				locations: activeLocation.value ? [Number(activeLocation.value)] : undefined,

				state: activeState.value ? Number(activeState.value) : undefined,

				gender: activeGender.value || undefined,

				dialect_competence:
					dialectCompetenceValue.value?.[0] != null
						? String(dialectCompetenceValue.value[0])
						: undefined,

				standard_competence:
					standardCompetenceValue.value?.[0] != null
						? String(standardCompetenceValue.value[0])
						: undefined,

				has_bkms: bkmsEnabled.value === true ? "true" : undefined,

				age_lower: ageRange.value?.lower,
				age_upper: ageRange.value?.upper,
			},
		});
	},
	{ deep: true },
);
</script>

<template>
	<div class="flex h-full min-h-0 flex-col">
		<Tabs class="w-full flex flex-col flex-grow min-h-0" default-value="filter">
			<TabsList class="w-full flex-shrink-0">
				<TabsTrigger value="tree"> Tree </TabsTrigger>
				<TabsTrigger class="inline-flex items-center gap-2" value="filter">
					<span>Filter</span>
				</TabsTrigger>
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
					<div class="flex items-center justify-between gap-3 border-b pb-3">
						<div
							class="flex items-center gap-1 py-1.5"
							:class="activeFilterCount > 0 ? 'text-accent-foreground' : ''"
						>
							<span class="text-sm"> Aktive Filter </span>
							<span class="flex text-xs items-center justify-end"> ({{ activeFilterCount }}) </span>
						</div>
						<Button
							v-if="hasActiveFilters"
							variant="ghost"
							size="sm"
							class="h-8 px-2 text-xs"
							@click="clearAllFilters"
						>
							Alle löschen
						</Button>
					</div>
					<div class="grid w-full gap-1.5 border-b pb-4">
						<div class="grid w-full gap-1.5 pb-4">
							<Label class="tracking-wide pl-1" for="name-input">Transkriptname</Label>
							<div class="flex gap-2">
								<Input id="name-input" v-model="searchName" placeholder="Transkriptname eingeben" />
								<Button size="icon" variant="outline" @click="searchName = ''"
									><Undo2 class="size-4"
								/></Button>
							</div>
						</div>
						<div class="grid w-full gap-1.5">
							<Label class="tracking-wide pl-1" for="id-input">Transkript ID</Label>
							<div class="flex gap-2">
								<Input id="id-input" v-model="searchId" placeholder="Transkript ID eingeben" />
								<Button size="icon" variant="outline" @click="searchId = ''"
									><Undo2 class="size-4"
								/></Button>
							</div>
						</div>
					</div>
					<div class="grid w-full gap-1.5">
						<Label class="tracking-wide pl-1" for="context">Projektkontext</Label>
						<div class="flex gap-2">
							<BaseSelect
								id="context"
								v-model="activeContext"
								:options="projectOptions"
								placeholder="Projektkontext wählen..."
							></BaseSelect>
							<Button size="icon" variant="outline" @click="activeContext = undefined"
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
							<Button size="icon" variant="outline" @click="activeSetting = undefined"
								><Undo2 class="size-4"
							/></Button>
						</div>
					</div>
					<div class="text-lg mb-1">Raum</div>
					<div class="grid w-full gap-1.5">
						<Label class="tracking-wide pl-1" for="location">Ort</Label>
						<div class="flex gap-2">
							<BaseSelect
								id="location"
								v-model="activeLocation"
								:options="locationOptions"
								placeholder="Ort wählen..."
							></BaseSelect>
							<Button size="icon" variant="outline" @click="activeLocation = undefined"
								><Undo2 class="size-4"
							/></Button>
						</div>
					</div>
					<div class="grid w-full gap-1.5">
						<Label class="tracking-wide pl-1" for="location">Bundesland</Label>
						<div class="flex gap-2">
							<BaseSelect
								id="location"
								v-model="activeState"
								:options="stateOptions"
								placeholder="Bundesland wählen..."
							></BaseSelect>
							<Button size="icon" variant="outline" @click="activeState = undefined"
								><Undo2 class="size-4"
							/></Button>
						</div>
					</div>
					<div class="grid w-full gap-1.5 border-b"></div>
					<div class="text-lg mb-1">Sprecher:innen</div>
					<div class="grid w-full gap-1.5">
						<Label class="tracking-wide pl-1" for="age">Altersgruppe</Label>
						<div class="flex gap-2">
							<BaseSelect
								id="age"
								v-model="activeAgeGroup"
								:options="ageGroupOptions"
								placeholder="Altersgruppe wählen..."
							></BaseSelect>
							<Button size="icon" variant="outline" @click="activeAgeGroup = undefined"
								><Undo2 class="size-4"
							/></Button>
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
							<Button size="icon" variant="outline" @click="activeGender = undefined"
								><Undo2 class="size-4"
							/></Button>
						</div>
					</div>
					<div class="grid w-full gap-1.5 border-b"></div>
					<div class="text-lg mb-1">Sprachrepertoires</div>

					<div class="grid my-2">
						<div class="flex w-full justify-between">
							<span class="flex-row flex gap-1">
								<Checkbox
									type="checkbox"
									id="competence-enabled"
									v-model="standardCompetenceEnabled"
								/>
								<Label class="tracking-wide pl-1" for="nos">Standardsprachkompetenz </Label>
								<TooltipProvider>
									<Tooltip>
										<TooltipTrigger as-child>
											<CircleQuestionMarkIcon
												:size="16"
												class="text-gray-400 hover:text-gray-500"
											/>
										</TooltipTrigger>
										<TooltipContent>
											Selbstauskunft auf einer siebenstufigen Skala (Deutsch)
										</TooltipContent>
									</Tooltip>
								</TooltipProvider>
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
									id="dialect-competence-enabled"
									v-model="dialectCompetenceEnabled"
								/>
								<Label class="tracking-wide pl-1" for="nos">Dialektkompetenz</Label>
								<TooltipProvider>
									<Tooltip>
										<TooltipTrigger as-child>
											<CircleQuestionMarkIcon
												:size="16"
												class="text-gray-400 hover:text-gray-500"
											/>
										</TooltipTrigger>
										<TooltipContent>
											Selbstauskunft auf einer siebenstufigen Skala (Deutsch)</TooltipContent
										>
									</Tooltip>
								</TooltipProvider>
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
					<div class="grid my-2">
						<div class="flex w-full justify-between">
							<span class="flex-row flex gap-1">
								<Checkbox type="checkbox" id="bkms-enabled" v-model="bkmsEnabled" />
								<Label class="tracking-wide pl-1" for="nos">BKMS</Label>
							</span>
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
